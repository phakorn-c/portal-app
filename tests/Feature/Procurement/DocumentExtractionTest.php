<?php

use App\Models\AnnouncementAttachment;
use App\Models\DocumentExtraction;
use App\Models\User;
use Carbon\CarbonInterface;
use Illuminate\Database\QueryException;
use Illuminate\Support\Str;

use function Pest\Laravel\assertDatabaseCount;
use function Pest\Laravel\assertDatabaseMissing;

test('pending extraction is created once per attachment via firstOrCreate', function () {
    $attachment = AnnouncementAttachment::factory()->create();

    $extraction = DocumentExtraction::firstOrCreate(
        ['announcement_attachment_id' => $attachment->id],
        ['status' => 'pending'],
    );

    expect($extraction->wasRecentlyCreated)->toBeTrue();

    $fresh = $extraction->refresh();
    expect($fresh->status)->toBe('pending')
        ->and($fresh->attempt_count)->toBe(0)
        ->and($fresh->method)->toBeNull()
        ->and($fresh->processing_token)->toBeNull();

    $again = DocumentExtraction::firstOrCreate(
        ['announcement_attachment_id' => $attachment->id],
        ['status' => 'pending'],
    );

    expect($again->wasRecentlyCreated)->toBeFalse()
        ->and($again->id)->toBe($extraction->id);
    assertDatabaseCount('document_extractions', 1);
});

test('status accepts exactly the allowed set', function () {
    foreach (['pending', 'processing', 'review', 'failed', 'approved'] as $status) {
        $extraction = DocumentExtraction::factory()->create(['status' => $status]);

        expect($extraction->refresh()->status)->toBe($status);
    }
});

test('out-of-set status is rejected by the database', function () {
    $extraction = DocumentExtraction::factory()->create();
    $extraction->update(['status' => 'review']);

    expect($extraction->refresh()->status)->toBe('review');
    expect(fn () => $extraction->update(['status' => 'done']))->toThrow(QueryException::class);
});

test('method accepts exactly the allowed set or null', function () {
    foreach (['fake_embedded_text', 'fake_ocr_placeholder', 'fake_unknown'] as $method) {
        $extraction = DocumentExtraction::factory()->create(['method' => $method]);

        expect($extraction->refresh()->method)->toBe($method);
    }

    $nullMethod = DocumentExtraction::factory()->create(['method' => null]);
    expect($nullMethod->refresh()->method)->toBeNull();
});

test('out-of-set method is rejected by the database', function () {
    $extraction = DocumentExtraction::factory()->create();
    $extraction->update(['method' => 'fake_embedded_text']);

    expect($extraction->refresh()->method)->toBe('fake_embedded_text');
    expect(fn () => $extraction->update(['method' => 'tesseract_ocr']))->toThrow(QueryException::class);
});

test('json and datetime casts round-trip', function () {
    $extraction = DocumentExtraction::factory()->create([
        'candidate' => ['title' => 'ประกาศจัดซื้อจัดจ้าง', 'budget' => 1250000],
        'confidence' => ['title' => 0.98, 'budget' => 0.87],
        'warnings' => ['low_contrast_page'],
        'raw_text' => 'ตัวอย่างข้อความดิบ',
        'processing_started_at' => '2026-08-07 10:00:00',
        'processed_at' => '2026-08-07 10:00:05',
        'approved_at' => '2026-08-07 11:30:00',
    ])->refresh();

    expect($extraction->candidate)->toBeArray()
        ->and($extraction->candidate['title'])->toBe('ประกาศจัดซื้อจัดจ้าง')
        ->and($extraction->confidence)->toBeArray()
        ->and($extraction->confidence['budget'])->toBe(0.87)
        ->and($extraction->warnings)->toBe(['low_contrast_page'])
        ->and($extraction->raw_text)->toBe('ตัวอย่างข้อความดิบ')
        ->and($extraction->processing_started_at)->toBeInstanceOf(CarbonInterface::class)
        ->and($extraction->processed_at)->toBeInstanceOf(CarbonInterface::class)
        ->and($extraction->approved_at)->toBeInstanceOf(CarbonInterface::class)
        ->and($extraction->processed_at->toDateTimeString())->toBe('2026-08-07 10:00:05');
});

test('relationships load in both directions', function () {
    $approver = User::factory()->create();
    $attachment = AnnouncementAttachment::factory()->create();
    $extraction = DocumentExtraction::factory()->create([
        'announcement_attachment_id' => $attachment->id,
        'status' => 'approved',
        'approved_by' => $approver->id,
        'approved_at' => now(),
    ]);

    expect($extraction->attachment)->toBeInstanceOf(AnnouncementAttachment::class)
        ->and($extraction->attachment->is($attachment))->toBeTrue()
        ->and($attachment->extraction)->toBeInstanceOf(DocumentExtraction::class)
        ->and($attachment->extraction->is($extraction))->toBeTrue()
        ->and($extraction->approver)->toBeInstanceOf(User::class)
        ->and($extraction->approver->is($approver))->toBeTrue();
});

test('a second extraction for the same attachment violates the unique constraint', function () {
    $attachment = AnnouncementAttachment::factory()->create();
    DocumentExtraction::factory()->create(['announcement_attachment_id' => $attachment->id]);

    expect(fn () => DocumentExtraction::factory()->create(['announcement_attachment_id' => $attachment->id]))
        ->toThrow(QueryException::class);

    assertDatabaseCount('document_extractions', 1);
});

test('deleting the attachment cascade-deletes its extraction', function () {
    $extraction = DocumentExtraction::factory()->create();
    $attachment = $extraction->attachment;

    $attachment->delete();

    assertDatabaseMissing('document_extractions', ['id' => $extraction->id]);
    assertDatabaseCount('document_extractions', 0);
});

test('deleting the approver nulls approved_by but keeps the extraction', function () {
    $approver = User::factory()->create();
    $extraction = DocumentExtraction::factory()->create([
        'status' => 'approved',
        'approved_by' => $approver->id,
        'approved_at' => now(),
    ]);

    $approver->delete();

    $fresh = $extraction->refresh();
    expect($fresh->approved_by)->toBeNull()
        ->and($fresh->status)->toBe('approved');
});

test('every contract field is mass assignable', function () {
    $attachment = AnnouncementAttachment::factory()->create();
    $approver = User::factory()->create();
    $token = Str::uuid()->toString();

    $extraction = DocumentExtraction::query()->create([
        'announcement_attachment_id' => $attachment->id,
        'status' => 'processing',
        'method' => 'fake_embedded_text',
        'candidate' => ['title' => 'x'],
        'confidence' => ['title' => 0.5],
        'warnings' => ['w'],
        'raw_text' => 'raw',
        'error_message' => 'none',
        'attempt_count' => 2,
        'processing_token' => $token,
        'processing_started_at' => now(),
        'processed_at' => now(),
        'approved_at' => now(),
        'approved_by' => $approver->id,
    ])->refresh();

    expect($extraction->announcement_attachment_id)->toBe($attachment->id)
        ->and($extraction->status)->toBe('processing')
        ->and($extraction->method)->toBe('fake_embedded_text')
        ->and($extraction->candidate)->toBe(['title' => 'x'])
        ->and($extraction->confidence)->toBe(['title' => 0.5])
        ->and($extraction->warnings)->toBe(['w'])
        ->and($extraction->raw_text)->toBe('raw')
        ->and($extraction->error_message)->toBe('none')
        ->and($extraction->attempt_count)->toBe(2)
        ->and($extraction->processing_token)->toBe($token)
        ->and($extraction->processing_started_at)->toBeInstanceOf(CarbonInterface::class)
        ->and($extraction->processed_at)->toBeInstanceOf(CarbonInterface::class)
        ->and($extraction->approved_at)->toBeInstanceOf(CarbonInterface::class)
        ->and($extraction->approved_by)->toBe($approver->id);
});
