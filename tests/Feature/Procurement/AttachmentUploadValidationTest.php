<?php

use App\Jobs\ProcessDocumentExtraction;
use App\Models\Announcement;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\Facades\Storage;

use function Pest\Laravel\actingAs;
use function Pest\Laravel\assertDatabaseCount;
use function Pest\Laravel\postJson;

beforeEach(function () {
    Storage::fake('local');
    Queue::fake();
    actingAs(User::factory()->admin()->create());
});

test('admin provenance fields accept a valid URL and reference', function () {
    $response = postJson(route('admin.announcements.store'), attachmentValidationPayload());

    $response->assertRedirect(route('admin.announcements.index'));
    $announcement = Announcement::query()->sole();
    expect($announcement->source_url)->toBe('https://example.test/notices/valid')
        ->and($announcement->source_reference)->toBe('VALID-REF-001');
});

test('invalid source URL is rejected without file result or job or a second announcement', function () {
    postJson(route('admin.announcements.store'), attachmentValidationPayload())
        ->assertRedirect(route('admin.announcements.index'));

    $response = postJson(route('admin.announcements.store'), attachmentValidationPayload([
        'title' => 'Invalid source URL',
        'source_url' => 'not-a-url',
        'attachment' => attachmentValidationPdf('invalid-source.pdf'),
    ]));

    $response->assertUnprocessable()->assertJsonValidationErrors(['source_url']);
    assertDatabaseCount('announcements', 1);
    assertDatabaseCount('announcement_attachments', 0);
    assertDatabaseCount('document_extractions', 0);
    expect(Storage::disk('local')->allFiles())->toBeEmpty();
    Queue::assertNothingPushed();
});

test('non PDF upload is rejected without file result or job', function () {
    postJson(route('admin.announcements.store'), attachmentValidationPayload())
        ->assertRedirect(route('admin.announcements.index'));

    $response = postJson(route('admin.announcements.store'), attachmentValidationPayload([
        'title' => 'Invalid attachment',
        'attachment' => UploadedFile::fake()->createWithContent('notes.txt', 'plain text'),
    ]));

    $response->assertUnprocessable()->assertJsonValidationErrors(['attachment']);
    assertDatabaseCount('announcements', 1);
    assertDatabaseCount('announcement_attachments', 0);
    assertDatabaseCount('document_extractions', 0);
    expect(Storage::disk('local')->allFiles())->toBeEmpty();
    Queue::assertNotPushed(ProcessDocumentExtraction::class);
});

function attachmentValidationPdf(string $name): UploadedFile
{
    return UploadedFile::fake()->createWithContent($name, "%PDF-1.4\nvalidation\n%%EOF");
}

function attachmentValidationPayload(array $overrides = []): array
{
    return [
        'title' => 'Valid provenance announcement',
        'organization' => 'เทศบาลนครขอนแก่น',
        'category' => 'construction',
        'method' => 'e-bidding',
        'budget' => 100000,
        'status' => 'open',
        'publication_status' => 'draft',
        'deadline' => now()->addDays(30)->toDateString(),
        'source_url' => 'https://example.test/notices/valid',
        'source_reference' => 'VALID-REF-001',
        ...$overrides,
    ];
}
