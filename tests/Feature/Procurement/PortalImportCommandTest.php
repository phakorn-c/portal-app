<?php

use App\Models\Announcement;
use App\Models\AnnouncementAttachment;
use App\Models\DocumentExtraction;
use Illuminate\Support\Facades\Storage;

use function Pest\Laravel\artisan;

test('valid portal rows import as drafts even when the export marks them published', function () {
    Storage::fake('local');

    $importPath = portalImportFileWithAttachment([
        portalImportRow([
            'publication_status' => 'published',
            'published_at' => '2026-09-01 09:00:00',
        ]),
    ]);

    artisan('portal:import', ['path' => $importPath])
        ->expectsOutput('Import complete: imported=1 skipped=0 errors=0')
        ->assertSuccessful();

    portalImportCleanup($importPath);

    $announcement = Announcement::query()->sole();

    expect($announcement->title)->toBe('ประกวดราคาซื้อครุภัณฑ์คอมพิวเตอร์')
        ->and($announcement->source_reference)->toBe('kku:notice-001')
        ->and($announcement->publication_status)->toBe('draft')
        ->and($announcement->published_at)->toBeNull();
});

test('duplicate record keys are skipped without changing the existing announcement', function () {
    Announcement::factory()->draft()->create([
        'title' => 'Existing reviewed draft',
        'source_reference' => 'kku:notice-001',
    ]);

    $importPath = portalImportFile(json_encode([
        portalImportRow(['title' => 'Incoming duplicate']),
    ], JSON_THROW_ON_ERROR | JSON_UNESCAPED_UNICODE));

    artisan('portal:import', ['path' => $importPath])
        ->expectsOutput('Import complete: imported=0 skipped=1 errors=0')
        ->assertSuccessful();

    unlink($importPath);

    expect(Announcement::query()->count())->toBe(1)
        ->and(Announcement::query()->sole()->title)->toBe('Existing reviewed draft');
});

test('importing the same file twice keeps the imported record graph unchanged', function () {
    Storage::fake('local');

    $importPath = portalImportFileWithAttachment([
        portalImportRow([
            'validation_flags' => ['budget_needs_review'],
            'raw_text' => "OCR line one\nOCR line two",
        ]),
    ]);

    artisan('portal:import', ['path' => $importPath])
        ->expectsOutput('Import complete: imported=1 skipped=0 errors=0')
        ->assertSuccessful();

    $announcement = Announcement::query()->sole();
    $attachment = AnnouncementAttachment::query()->sole();
    $extraction = DocumentExtraction::query()->sole();
    $firstImport = [
        'announcement_id' => $announcement->id,
        'announcement_title' => $announcement->title,
        'announcement_updated_at' => $announcement->updated_at?->toJSON(),
        'attachment_id' => $attachment->id,
        'attachment_updated_at' => $attachment->updated_at?->toJSON(),
        'extraction_id' => $extraction->id,
        'extraction_updated_at' => $extraction->updated_at?->toJSON(),
    ];

    artisan('portal:import', ['path' => $importPath])
        ->expectsOutput('Import complete: imported=0 skipped=1 errors=0')
        ->assertSuccessful();

    expect(Announcement::query()->count())->toBe(1)
        ->and(AnnouncementAttachment::query()->count())->toBe(1)
        ->and(DocumentExtraction::query()->count())->toBe(1)
        ->and([
            'announcement_id' => Announcement::query()->sole()->id,
            'announcement_title' => Announcement::query()->sole()->title,
            'announcement_updated_at' => Announcement::query()->sole()->updated_at?->toJSON(),
            'attachment_id' => AnnouncementAttachment::query()->sole()->id,
            'attachment_updated_at' => AnnouncementAttachment::query()->sole()->updated_at?->toJSON(),
            'extraction_id' => DocumentExtraction::query()->sole()->id,
            'extraction_updated_at' => DocumentExtraction::query()->sole()->updated_at?->toJSON(),
        ])->toBe($firstImport)
        ->and($announcement->publication_status)->toBe('draft')
        ->and($attachment->filename)->toBe('notice-001.pdf')
        ->and($extraction->status)->toBe('review')
        ->and($extraction->method)->toBe('portal-ocr')
        ->and($extraction->warnings)->toBe(['budget_needs_review'])
        ->and($extraction->raw_text)->toBe("OCR line one\nOCR line two");

    expect(Storage::disk('local')->exists($attachment->stored_filename))->toBeTrue();
    portalImportCleanup($importPath);
});

test('invalid rows report their row number while valid rows still import', function () {
    Storage::fake('local');

    $importPath = portalImportFileWithAttachment([
        portalImportRow(),
        portalImportRow([
            'record_key' => 'kku:notice-002',
            'budget' => null,
        ]),
    ]);

    artisan('portal:import', ['path' => $importPath])
        ->expectsOutputToContain('Row 2: The budget field is required.')
        ->expectsOutput('Import complete: imported=1 skipped=0 errors=1')
        ->assertFailed();

    portalImportCleanup($importPath);

    expect(Announcement::query()->count())->toBe(1)
        ->and(Announcement::query()->sole()->publication_status)->toBe('draft');
});

test('an invalid JSON document fails before importing anything', function () {
    $importPath = portalImportFile('{invalid json');

    artisan('portal:import', ['path' => $importPath])
        ->expectsOutputToContain('Import failed: invalid JSON:')
        ->expectsOutput('Import complete: imported=0 skipped=0 errors=1')
        ->assertFailed();

    unlink($importPath);

    expect(Announcement::query()->count())->toBe(0);
});

function portalImportRow(array $overrides = []): array
{
    return [
        'title' => 'ประกวดราคาซื้อครุภัณฑ์คอมพิวเตอร์',
        'organization' => 'มหาวิทยาลัยขอนแก่น',
        'category' => 'goods',
        'method' => 'e-bidding',
        'budget' => '1500000.00',
        'location' => 'ขอนแก่น',
        'reference_price' => '1480000.00',
        'contact_name' => 'งานพัสดุ',
        'contact_phone' => '043-000-601',
        'description' => 'ข้อมูลจาก portal-ocr',
        'status' => 'open',
        'publication_status' => 'draft',
        'published_at' => null,
        'deadline' => '2026-09-30',
        'pdf_path' => 'notice-001.pdf',
        'source_url' => 'https://example.test/notices/001',
        'record_key' => 'kku:notice-001',
        ...$overrides,
    ];
}

function portalImportFile(string $contents): string
{
    $path = tempnam(sys_get_temp_dir(), 'portal-import-');

    if ($path === false || file_put_contents($path, $contents) === false) {
        throw new RuntimeException('Unable to create portal import fixture.');
    }

    return $path;
}

function portalImportFileWithAttachment(array $rows): string
{
    $directory = sys_get_temp_dir().'/portal-import-'.bin2hex(random_bytes(8));
    $attachments = $directory.'/portal_attachments';

    if (! mkdir($attachments, 0777, true)) {
        throw new RuntimeException('Unable to create portal attachment fixture directory.');
    }

    $path = $directory.'/portal_import.json';
    file_put_contents($path, json_encode($rows, JSON_THROW_ON_ERROR | JSON_UNESCAPED_UNICODE));
    file_put_contents($attachments.'/notice-001.pdf', "%PDF-1.4\n%%EOF\n");

    return $path;
}

function portalImportCleanup(string $path): void
{
    $directory = dirname($path);
    @unlink($directory.'/portal_attachments/notice-001.pdf');
    @rmdir($directory.'/portal_attachments');
    @unlink($path);
    @rmdir($directory);
}
