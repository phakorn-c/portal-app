<?php

use App\Models\Announcement;
use App\Models\AnnouncementAttachment;
use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\Schema;

test('document kind defaults to unknown and accepts exactly the allowed set', function () {
    $default = AnnouncementAttachment::factory()->create();

    expect($default->refresh()->document_kind)->toBe('unknown');

    foreach (['unknown', 'text_pdf', 'scanned_pdf'] as $kind) {
        $attachment = AnnouncementAttachment::factory()->create(['document_kind' => $kind]);

        expect($attachment->refresh()->document_kind)->toBe($kind);
    }
});

test('out-of-set document kind is rejected by the database', function () {
    $attachment = AnnouncementAttachment::factory()->create();
    $attachment->update(['document_kind' => 'text_pdf']);

    expect($attachment->refresh()->document_kind)->toBe('text_pdf');
    expect(fn () => $attachment->update(['document_kind' => 'word_docx']))->toThrow(QueryException::class);
});

test('multiple attachments may keep a null sha256 for legacy rows', function () {
    AnnouncementAttachment::factory()->count(3)->create(['sha256' => null]);

    expect(AnnouncementAttachment::query()->whereNull('sha256')->count())->toBe(3);
});

test('duplicate non-null sha256 is rejected by the unique index', function () {
    $sha = hash('sha256', 'demo-pdf-bytes');

    AnnouncementAttachment::factory()->create(['sha256' => $sha]);

    expect(fn () => AnnouncementAttachment::factory()->create(['sha256' => $sha]))
        ->toThrow(QueryException::class);

    expect(AnnouncementAttachment::query()->where('sha256', $sha)->count())->toBe(1);
});

test('announcements expose nullable provenance source fields with an indexed reference', function () {
    $legacy = Announcement::factory()->create();

    expect($legacy->refresh()->source_url)->toBeNull()
        ->and($legacy->source_reference)->toBeNull();

    $sourced = Announcement::factory()->create([
        'source_url' => 'https://example.invalid/tor.pdf',
        'source_reference' => 'TOR-2026-0001',
    ]);

    expect($sourced->refresh()->source_url)->toBe('https://example.invalid/tor.pdf')
        ->and($sourced->source_reference)->toBe('TOR-2026-0001')
        ->and(Schema::hasIndex('announcements', 'announcements_source_reference_index'))->toBeTrue();
});

test('announcements expose no candidate or extraction result fields', function () {
    $forbidden = [
        'candidate',
        'confidence',
        'warnings',
        'raw_text',
        'error_message',
        'extraction_status',
        'extracted_at',
    ];

    $fillable = (new Announcement)->getFillable();

    foreach ($forbidden as $column) {
        expect(Schema::hasColumn('announcements', $column))->toBeFalse()
            ->and($fillable)->not->toContain($column);
    }
});
