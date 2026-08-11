<?php

use App\Jobs\ProcessDocumentExtraction;
use App\Models\Announcement;
use App\Models\AnnouncementAttachment;
use App\Models\User;
use App\Support\Procurement\AttachmentStorage;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

use function Pest\Laravel\actingAs;
use function Pest\Laravel\assertDatabaseCount;
use function Pest\Laravel\assertDatabaseMissing;
use function Pest\Laravel\postJson;
use function Pest\Laravel\putJson;

beforeEach(function () {
    Storage::fake('local');
    Queue::fake();
});

test('storage stages a PDF before promoting it into an atomic attachment and extraction', function () {
    $announcement = Announcement::factory()->create();
    $contents = "%PDF-1.4\nT5 staged upload\n%%EOF";
    $file = UploadedFile::fake()->createWithContent('original-client-name.pdf', $contents);
    $sawUploadingFile = false;
    $sawPromotedFile = false;

    Announcement::retrieved(function () use (&$sawUploadingFile): void {
        if ($sawUploadingFile) {
            return;
        }

        $files = Storage::disk('local')->allFiles('attachments/managed');
        $sawUploadingFile = count($files) === 1 && str_ends_with($files[0], '.uploading');
    });
    AnnouncementAttachment::creating(function () use (&$sawPromotedFile): void {
        if ($sawPromotedFile) {
            return;
        }

        $files = Storage::disk('local')->allFiles('attachments/managed');
        $sawPromotedFile = count($files) === 1
            && str_ends_with($files[0], '.pdf')
            && ! str_ends_with($files[0], '.uploading');
    });

    $attachment = app(AttachmentStorage::class)->store($announcement, $file);

    expect($sawUploadingFile)->toBeTrue()
        ->and($sawPromotedFile)->toBeTrue()
        ->and($attachment->filename)->toBe('original-client-name.pdf')
        ->and($attachment->stored_filename)->toStartWith('attachments/managed/')
        ->and($attachment->stored_filename)->toEndWith('.pdf')
        ->and($attachment->sha256)->toBe(hash('sha256', $contents))
        ->and($attachment->document_kind)->toBe('unknown')
        ->and(Storage::disk('local')->get($attachment->stored_filename))->toBe($contents)
        ->and(Storage::disk('local')->allFiles('attachments/managed'))->toHaveCount(1);

    $extraction = $attachment->extraction()->sole();
    expect($extraction->status)->toBe('pending')
        ->and($extraction->attempt_count)->toBe(0);

    Queue::assertPushed(ProcessDocumentExtraction::class, function (ProcessDocumentExtraction $job) use ($extraction): bool {
        return $job->afterCommit === true
            && $job->extractionId === $extraction->id
            && $job->expectedAttempt === 1
            && Str::isUuid($job->invocationToken);
    });
    Queue::assertPushed(ProcessDocumentExtraction::class, 1);
});

test('admin upload refuses to run while the attachment storage lock is held', function () {
    actingAs(User::factory()->admin()->create());
    $lock = Cache::lock('procurement:attachment-storage', 60);
    expect($lock->get())->toBeTrue();

    try {
        $response = postJson(route('admin.announcements.store'), [
            ...attachmentAnnouncementPayload(),
            'attachment' => attachmentPdf('locked.pdf', 'locked'),
        ]);
    } finally {
        $lock->release();
    }

    $response->assertUnprocessable()->assertJsonValidationErrors(['attachment']);
    assertDatabaseCount('announcements', 0);
    assertDatabaseCount('announcement_attachments', 0);
    assertDatabaseCount('document_extractions', 0);
    expect(Storage::disk('local')->allFiles())->toBeEmpty();
    Queue::assertNothingPushed();
});

test('duplicate PDF upload returns a validation conflict without leaving orphan state', function () {
    actingAs(User::factory()->admin()->create());

    $firstResponse = postJson(route('admin.announcements.store'), [
        ...attachmentAnnouncementPayload(['title' => 'Original PDF']),
        'attachment' => attachmentPdf('first.pdf', 'duplicate-content'),
    ]);
    $firstResponse->assertRedirect(route('admin.announcements.index'));
    $original = AnnouncementAttachment::query()->sole();
    $originalExtraction = $original->extraction()->sole();

    $duplicateResponse = postJson(route('admin.announcements.store'), [
        ...attachmentAnnouncementPayload(['title' => 'Duplicate PDF']),
        'attachment' => attachmentPdf('second.pdf', 'duplicate-content'),
    ]);

    $duplicateResponse->assertUnprocessable()->assertJsonValidationErrors(['attachment']);
    assertDatabaseCount('announcements', 1);
    assertDatabaseCount('announcement_attachments', 1);
    assertDatabaseCount('document_extractions', 1);
    expect($original->fresh()->is($original))->toBeTrue()
        ->and($originalExtraction->fresh()->is($originalExtraction))->toBeTrue()
        ->and(Storage::disk('local')->exists($original->stored_filename))->toBeTrue()
        ->and(Storage::disk('local')->allFiles('attachments/managed'))->toHaveCount(1);
    Queue::assertPushed(ProcessDocumentExtraction::class, 1);
});

test('replacement cascades the old extraction and dispatches one fresh pending extraction', function () {
    actingAs(User::factory()->admin()->create());

    postJson(route('admin.announcements.store'), [
        ...attachmentAnnouncementPayload(['title' => 'Before replacement']),
        'attachment' => attachmentPdf('before.pdf', 'before-content'),
    ])->assertRedirect(route('admin.announcements.index'));

    $announcement = Announcement::query()->sole();
    $oldAttachment = $announcement->attachments()->sole();
    $oldExtraction = $oldAttachment->extraction()->sole();

    putJson(route('admin.announcements.update', $announcement), [
        ...attachmentAnnouncementPayload(['title' => 'After replacement']),
        'attachment' => attachmentPdf('after.pdf', 'after-content'),
    ])->assertRedirect(route('admin.announcements.index'));

    assertDatabaseMissing('announcement_attachments', ['id' => $oldAttachment->id]);
    assertDatabaseMissing('document_extractions', ['id' => $oldExtraction->id]);
    expect(Storage::disk('local')->exists($oldAttachment->stored_filename))->toBeFalse();

    $newAttachment = $announcement->fresh()->attachments()->sole();
    $newExtraction = $newAttachment->extraction()->sole();
    expect($newAttachment->filename)->toBe('after.pdf')
        ->and($newAttachment->document_kind)->toBe('unknown')
        ->and($newExtraction->status)->toBe('pending')
        ->and($newExtraction->id)->not()->toBe($oldExtraction->id)
        ->and(Storage::disk('local')->exists($newAttachment->stored_filename))->toBeTrue();
    Queue::assertPushed(ProcessDocumentExtraction::class, 2);
});

test('failed duplicate replacement preserves parent attachment extraction and managed file', function () {
    actingAs(User::factory()->admin()->create());

    foreach ([['First', 'first-content'], ['Second', 'second-content']] as [$title, $contents]) {
        postJson(route('admin.announcements.store'), [
            ...attachmentAnnouncementPayload(['title' => $title]),
            'attachment' => attachmentPdf(strtolower($title).'.pdf', $contents),
        ])->assertRedirect(route('admin.announcements.index'));
    }

    $first = Announcement::query()->where('title', 'First')->firstOrFail();
    $originalAttachment = $first->attachments()->sole();
    $originalExtraction = $originalAttachment->extraction()->sole();

    $response = putJson(route('admin.announcements.update', $first), [
        ...attachmentAnnouncementPayload(['title' => 'Must roll back']),
        'attachment' => attachmentPdf('duplicate.pdf', 'second-content'),
    ]);

    $response->assertUnprocessable()->assertJsonValidationErrors(['attachment']);
    expect($first->fresh()->title)->toBe('First')
        ->and($originalAttachment->fresh()->is($originalAttachment))->toBeTrue()
        ->and($originalExtraction->fresh()->is($originalExtraction))->toBeTrue()
        ->and(Storage::disk('local')->exists($originalAttachment->stored_filename))->toBeTrue()
        ->and(Storage::disk('local')->allFiles('attachments/managed'))->toHaveCount(2);
    assertDatabaseCount('announcement_attachments', 2);
    assertDatabaseCount('document_extractions', 2);
    Queue::assertPushed(ProcessDocumentExtraction::class, 2);
});

function attachmentPdf(string $name, string $marker): UploadedFile
{
    return UploadedFile::fake()->createWithContent($name, "%PDF-1.4\n{$marker}\n%%EOF");
}

function attachmentAnnouncementPayload(array $overrides = []): array
{
    return [
        'title' => 'Attachment storage tender',
        'organization' => 'เทศบาลนครขอนแก่น',
        'category' => 'construction',
        'method' => 'e-bidding',
        'budget' => 2500000,
        'description' => 'Attachment storage integration test',
        'status' => 'open',
        'publication_status' => 'draft',
        'deadline' => now()->addDays(30)->toDateString(),
        'source_url' => 'https://example.test/procurement/T5',
        'source_reference' => 'T5-REF-001',
        ...$overrides,
    ];
}
