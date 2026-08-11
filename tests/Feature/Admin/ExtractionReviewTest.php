<?php

use App\Jobs\ProcessDocumentExtraction;
use App\Models\Announcement;
use App\Models\AnnouncementAttachment;
use App\Models\DocumentExtraction;
use App\Models\User;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\Str;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(function () {
    Queue::fake();
});

test('guests and registered users cannot access extraction review endpoints', function (string $action) {
    $announcement = Announcement::factory()->draft()->create(t6CandidatePayload());
    $extraction = t6Extraction($announcement, ['status' => 'review']);
    $url = t6ExtractionUrl($announcement, $extraction, $action);

    $guestResponse = match ($action) {
        'show' => $this->get($url),
        'approve' => $this->put($url, t6CandidatePayload()),
        'retry' => $this->post($url),
    };
    $guestResponse->assertRedirect(route('login'));

    $registered = User::factory()->registered()->create();
    $registeredResponse = match ($action) {
        'show' => $this->actingAs($registered)->get($url),
        'approve' => $this->actingAs($registered)->put($url, t6CandidatePayload()),
        'retry' => $this->actingAs($registered)->post($url),
    };
    $registeredResponse->assertForbidden();

    expect($extraction->fresh()->status)->toBe('review');
    Queue::assertNothingPushed();
})->with(['show', 'approve', 'retry']);

test('admin can inspect private extraction review data through inertia', function () {
    $this->withoutVite();
    $admin = User::factory()->admin()->create();
    $announcement = Announcement::factory()->draft()->create([
        ...t6CandidatePayload(),
        'source_url' => 'https://example.test/source/T6',
        'source_reference' => 'T6-SOURCE-001',
    ]);
    $extraction = t6Extraction($announcement, [
        'status' => 'review',
        'method' => 'fake_embedded_text',
        'candidate' => t6CandidatePayload(['title' => 'Extracted private title']),
        'confidence' => ['title' => 0.98],
        'warnings' => ['review budget'],
        'raw_text' => 'private raw extraction text',
        'attempt_count' => 1,
        'processed_at' => now(),
    ]);

    $response = $this->actingAs($admin)->get(t6ExtractionUrl($announcement, $extraction));

    $response->assertOk()->assertInertia(fn (Assert $page) => $page
        ->component('admin/extraction-review', false)
        ->where('announcement.id', $announcement->id)
        ->where('announcement.source_url', 'https://example.test/source/T6')
        ->where('announcement.source_reference', 'T6-SOURCE-001')
        ->where('attachment.filename', $extraction->attachment->filename)
        ->where('attachment.document_kind', 'text_pdf')
        ->where('extraction.id', $extraction->id)
        ->where('extraction.status', 'review')
        ->where('extraction.method', 'fake_embedded_text')
        ->where('extraction.candidate.title', 'Extracted private title')
        ->where('extraction.confidence.title', 0.98)
        ->where('extraction.warnings.0', 'review budget')
        ->where('extraction.raw_text', 'private raw extraction text'));
});

test('admin approval atomically applies a complete corrected candidate without publishing', function () {
    $admin = User::factory()->admin()->create();
    $announcement = Announcement::factory()->draft()->create(t6CandidatePayload([
        'title' => 'Draft title before review',
    ]));
    $extraction = t6Extraction($announcement, [
        'status' => 'review',
        'candidate' => t6CandidatePayload(['title' => 'Extracted title']),
        'attempt_count' => 1,
    ]);
    $corrected = t6CandidatePayload([
        'title' => 'Admin corrected title',
        'budget' => 2750000,
    ]);

    $response = $this->actingAs($admin)->putJson(
        t6ExtractionUrl($announcement, $extraction, 'approve'),
        $corrected,
    );

    $response->assertRedirect(t6ExtractionUrl($announcement, $extraction));

    $freshAnnouncement = $announcement->fresh();
    foreach ($corrected as $field => $value) {
        $actual = $freshAnnouncement->getAttribute($field);

        if ($field === 'deadline') {
            expect($actual->toDateString())->toBe($value);
        } elseif (in_array($field, ['budget', 'reference_price'], true)) {
            expect((float) $actual)->toBe((float) $value);
        } else {
            expect($actual)->toBe($value);
        }
    }

    expect($freshAnnouncement->publication_status)->toBe('draft')
        ->and($freshAnnouncement->published_at)->toBeNull()
        ->and($extraction->fresh()->status)->toBe('approved')
        ->and($extraction->fresh()->approved_by)->toBe($admin->id)
        ->and($extraction->fresh()->approved_at)->not->toBeNull();
    Queue::assertNothingPushed();
});

test('approval rejects invalid taxonomy values without mutation', function (string $field, string $invalidValue) {
    $admin = User::factory()->admin()->create();
    $announcement = Announcement::factory()->draft()->create(t6CandidatePayload());
    $extraction = t6Extraction($announcement, ['status' => 'review']);
    $announcementBefore = $announcement->fresh()->getAttributes();
    $extractionBefore = $extraction->fresh()->getAttributes();

    $response = $this->actingAs($admin)->putJson(
        t6ExtractionUrl($announcement, $extraction, 'approve'),
        t6CandidatePayload([$field => $invalidValue]),
    );

    $response->assertUnprocessable()->assertJsonValidationErrors([$field]);
    expect($announcement->fresh()->getAttributes())->toBe($announcementBefore)
        ->and($extraction->fresh()->getAttributes())->toBe($extractionBefore);
    Queue::assertNothingPushed();
})->with([
    'organization' => ['organization', 'Unknown organization'],
    'category' => ['category', 'unknown-category'],
    'method' => ['method', 'unknown-method'],
    'status' => ['status', 'draft'],
]);

test('approval rejects every non-allowlisted key without mutation', function (string $forbiddenKey) {
    $admin = User::factory()->admin()->create();
    $announcement = Announcement::factory()->draft()->create(t6CandidatePayload());
    $extraction = t6Extraction($announcement, ['status' => 'review']);
    $announcementBefore = $announcement->fresh()->getAttributes();
    $extractionBefore = $extraction->fresh()->getAttributes();

    $response = $this->actingAs($admin)->putJson(
        t6ExtractionUrl($announcement, $extraction, 'approve'),
        [...t6CandidatePayload(), $forbiddenKey => 'forbidden'],
    );

    $response->assertUnprocessable()->assertJsonValidationErrors(['payload']);
    expect($announcement->fresh()->getAttributes())->toBe($announcementBefore)
        ->and($extraction->fresh()->getAttributes())->toBe($extractionBefore);
    Queue::assertNothingPushed();
})->with([
    'publication_status',
    'source_url',
    'source_reference',
    'id',
    'announcement_id',
    'approved_by',
    'unexpected_key',
]);

test('approval requires all nullable candidate keys to be present', function (string $missingKey) {
    $admin = User::factory()->admin()->create();
    $announcement = Announcement::factory()->draft()->create(t6CandidatePayload());
    $extraction = t6Extraction($announcement, ['status' => 'review']);
    $payload = t6CandidatePayload();
    unset($payload[$missingKey]);

    $response = $this->actingAs($admin)->putJson(
        t6ExtractionUrl($announcement, $extraction, 'approve'),
        $payload,
    );

    $response->assertUnprocessable()->assertJsonValidationErrors([$missingKey]);
    expect($extraction->fresh()->status)->toBe('review');
    Queue::assertNothingPushed();
})->with(['location', 'reference_price', 'contact_name', 'contact_phone', 'description']);

test('approval rejects extraction states other than review without mutation', function (string $status) {
    $admin = User::factory()->admin()->create();
    $announcement = Announcement::factory()->draft()->create(t6CandidatePayload());
    $extraction = t6Extraction($announcement, [
        'status' => $status,
        'approved_at' => $status === 'approved' ? now() : null,
        'approved_by' => $status === 'approved' ? $admin->id : null,
    ]);
    $announcementBefore = $announcement->fresh()->getAttributes();
    $extractionBefore = $extraction->fresh()->getAttributes();

    $response = $this->actingAs($admin)->putJson(
        t6ExtractionUrl($announcement, $extraction, 'approve'),
        t6CandidatePayload(['title' => 'Must not be applied']),
    );

    $response->assertUnprocessable()->assertJsonValidationErrors(['extraction']);
    expect($announcement->fresh()->getAttributes())->toBe($announcementBefore)
        ->and($extraction->fresh()->getAttributes())->toBe($extractionBefore);
    Queue::assertNothingPushed();
})->with(['pending', 'processing', 'failed', 'approved']);

test('admin can retry review and failed extractions through the token dispatch contract', function (string $status) {
    $admin = User::factory()->admin()->create();
    $announcement = Announcement::factory()->draft()->create(t6CandidatePayload());
    $oldToken = Str::uuid()->toString();
    $extraction = t6Extraction($announcement, [
        'status' => $status,
        'method' => 'fake_unknown',
        'candidate' => t6CandidatePayload(),
        'confidence' => ['title' => 0.5],
        'warnings' => ['retry requested'],
        'raw_text' => 'old raw text',
        'error_message' => $status === 'failed' ? 'old failure' : null,
        'attempt_count' => 1,
        'processing_token' => $oldToken,
        'processing_started_at' => now()->subMinute(),
        'processed_at' => now()->subMinute(),
    ]);

    $response = $this->actingAs($admin)->postJson(
        t6ExtractionUrl($announcement, $extraction, 'retry'),
    );

    $response->assertRedirect(t6ExtractionUrl($announcement, $extraction));
    $fresh = $extraction->fresh();
    expect($fresh->status)->toBe('pending')
        ->and($fresh->attempt_count)->toBe(1)
        ->and($fresh->processing_token)->toBeNull()
        ->and($fresh->candidate)->toBeNull()
        ->and($fresh->approved_at)->toBeNull()
        ->and($fresh->approved_by)->toBeNull();
    Queue::assertPushed(ProcessDocumentExtraction::class, function (ProcessDocumentExtraction $job) use ($extraction, $oldToken): bool {
        return $job->afterCommit === true
            && $job->extractionId === $extraction->id
            && $job->expectedAttempt === 2
            && Str::isUuid($job->invocationToken)
            && $job->invocationToken !== $oldToken;
    });
    Queue::assertPushed(ProcessDocumentExtraction::class, 1);
})->with(['review', 'failed']);

test('retry rejects terminal approved extraction without mutation or dispatch', function () {
    $admin = User::factory()->admin()->create();
    $announcement = Announcement::factory()->draft()->create(t6CandidatePayload());
    $extraction = t6Extraction($announcement, [
        'status' => 'approved',
        'attempt_count' => 1,
        'approved_at' => now(),
        'approved_by' => $admin->id,
    ]);
    $before = $extraction->fresh()->getAttributes();

    $response = $this->actingAs($admin)->postJson(
        t6ExtractionUrl($announcement, $extraction, 'retry'),
    );

    $response->assertUnprocessable()->assertJsonValidationErrors(['extraction']);
    expect($extraction->fresh()->getAttributes())->toBe($before);
    Queue::assertNothingPushed();
});

test('retry surfaces the attempt ceiling refusal without mutation or dispatch', function () {
    $admin = User::factory()->admin()->create();
    $announcement = Announcement::factory()->draft()->create(t6CandidatePayload());
    $extraction = t6Extraction($announcement, [
        'status' => 'failed',
        'attempt_count' => 3,
        'error_message' => 'third failure',
        'processed_at' => now(),
    ]);
    $before = $extraction->fresh()->getAttributes();

    $response = $this->actingAs($admin)->postJson(
        t6ExtractionUrl($announcement, $extraction, 'retry'),
    );

    $response->assertUnprocessable()->assertJsonValidationErrors(['extraction']);
    expect($extraction->fresh()->getAttributes())->toBe($before);
    Queue::assertNothingPushed();
});

test('cross announcement extraction identifiers return 404 for every action without mutation or dispatch', function (string $action) {
    $admin = User::factory()->admin()->create();
    $announcement = Announcement::factory()->draft()->create(t6CandidatePayload());
    $otherAnnouncement = Announcement::factory()->draft()->create(t6CandidatePayload(['title' => 'Other announcement']));
    $extraction = t6Extraction($otherAnnouncement, ['status' => 'review']);
    $announcementBefore = $announcement->fresh()->getAttributes();
    $otherBefore = $otherAnnouncement->fresh()->getAttributes();
    $extractionBefore = $extraction->fresh()->getAttributes();
    $url = t6ExtractionUrl($announcement, $extraction, $action);

    $response = match ($action) {
        'show' => $this->actingAs($admin)->get($url),
        'approve' => $this->actingAs($admin)->putJson($url, t6CandidatePayload()),
        'retry' => $this->actingAs($admin)->postJson($url),
    };

    $response->assertNotFound();
    expect($announcement->fresh()->getAttributes())->toBe($announcementBefore)
        ->and($otherAnnouncement->fresh()->getAttributes())->toBe($otherBefore)
        ->and($extraction->fresh()->getAttributes())->toBe($extractionBefore);
    Queue::assertNothingPushed();
})->with(['show', 'approve', 'retry']);

function t6CandidatePayload(array $overrides = []): array
{
    return [
        'title' => 'T6 procurement announcement',
        'organization' => 'เทศบาลนครขอนแก่น',
        'category' => 'construction',
        'method' => 'e-bidding',
        'budget' => 2500000,
        'location' => 'ขอนแก่น',
        'reference_price' => 2450000,
        'contact_name' => 'งานพัสดุ',
        'contact_phone' => '043-000-606',
        'description' => 'T6 extraction review test',
        'deadline' => '2026-09-30',
        'status' => 'open',
        ...$overrides,
    ];
}

function t6Extraction(Announcement $announcement, array $overrides = []): DocumentExtraction
{
    $attachment = AnnouncementAttachment::factory()->create([
        'announcement_id' => $announcement->id,
        'filename' => 't6-review.pdf',
        'document_kind' => 'text_pdf',
    ]);

    return DocumentExtraction::factory()->create([
        'announcement_attachment_id' => $attachment->id,
        'status' => 'review',
        'candidate' => t6CandidatePayload(),
        ...$overrides,
    ]);
}

function t6ExtractionUrl(
    Announcement $announcement,
    DocumentExtraction $extraction,
    string $action = 'show',
): string {
    $base = "/admin/announcements/{$announcement->id}/extractions/{$extraction->id}";

    return $action === 'show' ? $base : "{$base}/{$action}";
}
