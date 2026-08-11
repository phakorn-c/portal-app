<?php

use App\Jobs\EvaluateSavedSearchAlerts;
use App\Jobs\ProcessDocumentExtraction;
use App\Models\Announcement;
use App\Models\DocumentExtraction;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\Facades\Storage;

beforeEach(function () {
    Queue::fake();
    Storage::fake('local');
});

test('each candidate and provenance change invalidates approved extraction audit', function (string $field, mixed $changedValue) {
    $admin = User::factory()->admin()->create();
    $announcement = Announcement::factory()->draft()->create([
        ...t6CandidatePayload(),
        'source_url' => 'https://example.test/source/original',
        'source_reference' => 'T6-ORIGINAL',
    ]);
    $extraction = t6ApprovedExtraction($announcement, $admin);

    $response = $this->actingAs($admin)->putJson(
        route('admin.announcements.update', $announcement),
        t6AnnouncementUpdatePayload($announcement, [$field => $changedValue]),
    );

    $response->assertRedirect(route('admin.announcements.index'));
    expect($announcement->fresh()->getAttribute($field))->not->toBe($announcement->getAttribute($field))
        ->and($extraction->fresh()->status)->toBe('review')
        ->and($extraction->fresh()->approved_at)->toBeNull()
        ->and($extraction->fresh()->approved_by)->toBeNull();
    Queue::assertNotPushed(ProcessDocumentExtraction::class);
})->with([
    'title' => ['title', 'Changed title'],
    'organization' => ['organization', 'มหาวิทยาลัยขอนแก่น'],
    'category' => ['category', 'goods'],
    'method' => ['method', 'selective'],
    'budget' => ['budget', 2600000],
    'location' => ['location', 'New location'],
    'reference_price' => ['reference_price', 2400000],
    'contact_name' => ['contact_name', 'New contact'],
    'contact_phone' => ['contact_phone', '043-999-999'],
    'description' => ['description', 'Changed description'],
    'deadline' => ['deadline', '2026-10-31'],
    'status' => ['status', 'urgent'],
    'source_url' => ['source_url', 'https://example.test/source/changed'],
    'source_reference' => ['source_reference', 'T6-CHANGED'],
]);

test('candidate edit invalidates every approved extraction across multiple attachments', function () {
    $admin = User::factory()->admin()->create();
    $announcement = Announcement::factory()->draft()->create(t6CandidatePayload());
    $first = t6ApprovedExtraction($announcement, $admin);
    $second = t6ApprovedExtraction($announcement, $admin);

    $response = $this->actingAs($admin)->putJson(
        route('admin.announcements.update', $announcement),
        t6AnnouncementUpdatePayload($announcement, ['title' => 'One edit invalidates both']),
    );

    $response->assertRedirect(route('admin.announcements.index'));
    foreach ([$first, $second] as $extraction) {
        expect($extraction->fresh()->status)->toBe('review')
            ->and($extraction->fresh()->approved_at)->toBeNull()
            ->and($extraction->fresh()->approved_by)->toBeNull();
    }
});

test('publish and hide preserve approved extraction audit', function () {
    $admin = User::factory()->admin()->create();
    $announcement = Announcement::factory()->draft()->create(t6CandidatePayload());
    $extraction = t6ApprovedExtraction($announcement, $admin);
    $approvedAt = $extraction->approved_at;

    $this->actingAs($admin)
        ->patch(route('admin.announcements.publish', $announcement))
        ->assertRedirect(route('admin.announcements.index'));

    expect($extraction->fresh()->status)->toBe('approved')
        ->and($extraction->fresh()->approved_at->equalTo($approvedAt))->toBeTrue()
        ->and($extraction->fresh()->approved_by)->toBe($admin->id);
    Queue::assertPushed(EvaluateSavedSearchAlerts::class, 1);

    $this->actingAs($admin)
        ->patch(route('admin.announcements.hide', $announcement))
        ->assertRedirect(route('admin.announcements.index'));

    expect($extraction->fresh()->status)->toBe('approved')
        ->and($extraction->fresh()->approved_at->equalTo($approvedAt))->toBeTrue()
        ->and($extraction->fresh()->approved_by)->toBe($admin->id);
});

test('no-op announcement update preserves approved extraction audit', function () {
    $admin = User::factory()->admin()->create();
    $announcement = Announcement::factory()->draft()->create([
        ...t6CandidatePayload(),
        'source_url' => 'https://example.test/source/same',
        'source_reference' => 'T6-SAME',
    ]);
    $extraction = t6ApprovedExtraction($announcement, $admin);
    $approvedAt = $extraction->approved_at;

    $response = $this->actingAs($admin)->putJson(
        route('admin.announcements.update', $announcement),
        t6AnnouncementUpdatePayload($announcement),
    );

    $response->assertRedirect(route('admin.announcements.index'));
    expect($extraction->fresh()->status)->toBe('approved')
        ->and($extraction->fresh()->approved_at->equalTo($approvedAt))->toBeTrue()
        ->and($extraction->fresh()->approved_by)->toBe($admin->id);
});

test('file replacement path explicitly invalidates all old approvals before replacement', function () {
    $admin = User::factory()->admin()->create();
    $announcement = Announcement::factory()->draft()->create(t6CandidatePayload());
    $first = t6ApprovedExtraction($announcement, $admin);
    $second = t6ApprovedExtraction($announcement, $admin);
    $invalidated = [];
    $originalDispatcher = DocumentExtraction::getEventDispatcher();
    DocumentExtraction::setEventDispatcher(clone $originalDispatcher);
    DocumentExtraction::updated(function (DocumentExtraction $extraction) use (&$invalidated): void {
        if ($extraction->wasChanged('status') && $extraction->status === 'review') {
            $invalidated[] = $extraction->id;
        }
    });

    try {
        $response = $this->actingAs($admin)->putJson(
            route('admin.announcements.update', $announcement),
            [
                ...t6AnnouncementUpdatePayload($announcement, ['title' => 'Changed with replacement']),
                'attachment' => UploadedFile::fake()->createWithContent(
                    'replacement.pdf',
                    "%PDF-1.4\nT6 replacement\n%%EOF",
                ),
            ],
        );
    } finally {
        DocumentExtraction::setEventDispatcher($originalDispatcher);
    }

    $response->assertRedirect(route('admin.announcements.index'));
    sort($invalidated);
    $expected = [$first->id, $second->id];
    sort($expected);
    expect($invalidated)->toBe($expected)
        ->and(DocumentExtraction::query()->whereKey($expected)->exists())->toBeFalse();

    $replacement = $announcement->fresh()->attachments()->sole()->extraction()->sole();
    expect($replacement->status)->toBe('pending');
    Queue::assertPushed(ProcessDocumentExtraction::class, 1);
});

test('failure during multi-extraction invalidation rolls back announcement and every approval', function () {
    $admin = User::factory()->admin()->create();
    $announcement = Announcement::factory()->draft()->create(t6CandidatePayload([
        'title' => 'Atomic original title',
    ]));
    $first = t6ApprovedExtraction($announcement, $admin);
    $second = t6ApprovedExtraction($announcement, $admin);
    $updates = 0;
    $originalDispatcher = DocumentExtraction::getEventDispatcher();
    DocumentExtraction::setEventDispatcher(clone $originalDispatcher);
    DocumentExtraction::updating(function (DocumentExtraction $extraction) use (&$updates): void {
        if ($extraction->status !== 'review') {
            return;
        }

        $updates++;

        if ($updates === 2) {
            throw new \RuntimeException('forced invalidation failure');
        }
    });
    $this->withoutExceptionHandling();

    $thrown = null;

    try {
        $this->actingAs($admin)->putJson(
            route('admin.announcements.update', $announcement),
            t6AnnouncementUpdatePayload($announcement, ['title' => 'Must roll back']),
        );
    } catch (\RuntimeException $exception) {
        $thrown = $exception;
    } finally {
        DocumentExtraction::setEventDispatcher($originalDispatcher);
    }

    expect($thrown)->not->toBeNull()
        ->and($thrown->getMessage())->toBe('forced invalidation failure')
        ->and($updates)->toBe(2)
        ->and($announcement->fresh()->title)->toBe('Atomic original title');
    foreach ([$first, $second] as $extraction) {
        expect($extraction->fresh()->status)->toBe('approved')
            ->and($extraction->fresh()->approved_at)->not->toBeNull()
            ->and($extraction->fresh()->approved_by)->toBe($admin->id);
    }
    Queue::assertNothingPushed();
});

function t6ApprovedExtraction(Announcement $announcement, User $admin): DocumentExtraction
{
    return t6Extraction($announcement, [
        'status' => 'approved',
        'attempt_count' => 1,
        'approved_at' => now()->subMinute(),
        'approved_by' => $admin->id,
    ]);
}

function t6AnnouncementUpdatePayload(Announcement $announcement, array $overrides = []): array
{
    return [
        'title' => $announcement->title,
        'organization' => $announcement->organization,
        'category' => $announcement->category,
        'method' => $announcement->method,
        'budget' => (float) $announcement->budget,
        'location' => $announcement->location,
        'reference_price' => $announcement->reference_price === null
            ? null
            : (float) $announcement->reference_price,
        'contact_name' => $announcement->contact_name,
        'contact_phone' => $announcement->contact_phone,
        'description' => $announcement->description,
        'deadline' => $announcement->deadline->toDateString(),
        'status' => $announcement->status,
        'publication_status' => $announcement->publication_status,
        'source_url' => $announcement->source_url,
        'source_reference' => $announcement->source_reference,
        ...$overrides,
    ];
}
