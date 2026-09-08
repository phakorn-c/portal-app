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
        ->and($attachment->stored_filename)->toBe('attachments/managed/'.$attachment->sha256.'.pdf')
        ->and($attachment->sha256)->toBe(hash('sha256', portalImportPdfContents()))
        ->and($attachment->document_kind)->toBe('unknown')
        ->and($extraction->status)->toBe('review')
        ->and($extraction->method)->toBe('portal-ocr')
        ->and($extraction->candidate)->toBe([
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
            'deadline' => '2026-09-30',
            'status' => 'open',
        ])
        ->and($extraction->warnings)->toBe(['budget_needs_review'])
        ->and($extraction->raw_text)->toBe("OCR line one\nOCR line two");

    expect(Storage::disk('local')->exists($attachment->stored_filename))->toBeTrue();
    portalImportCleanup($importPath);
});

test('a representative portal fixture round trips to the exact draft record graph idempotently', function () {
    Storage::fake('local');

    $importPath = base_path('tests/Fixtures/Procurement/portal-import-round-trip/portal_import.json');
    $sourcePdf = base_path('tests/Fixtures/Procurement/portal-import-round-trip/portal_attachments/drainage-project.pdf');
    $sha256 = hash_file('sha256', $sourcePdf);
    $fileSize = filesize($sourcePdf);

    expect($sha256)->toBeString()
        ->and($fileSize)->toBeInt();

    artisan('portal:import', ['path' => $importPath])
        ->expectsOutput('Import complete: imported=1 skipped=0 errors=0')
        ->assertSuccessful();

    $announcement = Announcement::query()->sole();
    $attachment = AnnouncementAttachment::query()->sole();
    $extraction = DocumentExtraction::query()->sole();

    expect([
        'title' => $announcement->title,
        'organization' => $announcement->organization,
        'category' => $announcement->category,
        'method' => $announcement->method,
        'budget' => $announcement->budget,
        'location' => $announcement->location,
        'reference_price' => $announcement->reference_price,
        'contact_name' => $announcement->contact_name,
        'contact_phone' => $announcement->contact_phone,
        'description' => $announcement->description,
        'status' => $announcement->status,
        'publication_status' => $announcement->publication_status,
        'deadline' => $announcement->deadline->toDateString(),
        'published_at' => $announcement->published_at,
        'source_url' => $announcement->source_url,
        'source_reference' => $announcement->source_reference,
    ])->toBe([
        'title' => 'ประกวดราคาจ้างปรับปรุงระบบระบายน้ำภายในมหาวิทยาลัย',
        'organization' => 'มหาวิทยาลัยขอนแก่น',
        'category' => 'construction',
        'method' => 'e-bidding',
        'budget' => '9876543.21',
        'location' => 'อำเภอเมืองขอนแก่น จังหวัดขอนแก่น',
        'reference_price' => 9765000,
        'contact_name' => 'กองคลัง งานพัสดุ',
        'contact_phone' => '043-202-555',
        'description' => 'ปรับปรุงระบบระบายน้ำตามเอกสารประกวดราคา',
        'status' => 'closing',
        'publication_status' => 'draft',
        'deadline' => '2026-09-18',
        'published_at' => null,
        'source_url' => 'https://example.test/procurement/drainage-2569',
        'source_reference' => 'kku:drainage-2569-001',
    ])->and([
        'announcement_id' => $attachment->announcement_id,
        'filename' => $attachment->filename,
        'stored_filename' => $attachment->stored_filename,
        'file_size' => $attachment->file_size,
        'mime_type' => $attachment->mime_type,
        'sha256' => $attachment->sha256,
        'document_kind' => $attachment->document_kind,
    ])->toBe([
        'announcement_id' => $announcement->id,
        'filename' => 'drainage-project.pdf',
        'stored_filename' => 'attachments/managed/'.$sha256.'.pdf',
        'file_size' => $fileSize,
        'mime_type' => 'application/pdf',
        'sha256' => $sha256,
        'document_kind' => 'unknown',
    ])->and([
        'announcement_attachment_id' => $extraction->announcement_attachment_id,
        'status' => $extraction->status,
        'method' => $extraction->method,
        'candidate' => $extraction->candidate,
        'confidence' => $extraction->confidence,
        'warnings' => $extraction->warnings,
        'raw_text' => $extraction->raw_text,
        'error_message' => $extraction->error_message,
        'attempt_count' => $extraction->attempt_count,
        'processing_token' => $extraction->processing_token,
        'processing_started_at' => $extraction->processing_started_at,
        'approved_at' => $extraction->approved_at,
        'approved_by' => $extraction->approved_by,
    ])->toBe([
        'announcement_attachment_id' => $attachment->id,
        'status' => 'review',
        'method' => 'portal-ocr',
        'candidate' => [
            'title' => 'ประกวดราคาจ้างปรับปรุงระบบระบายน้ำภายในมหาวิทยาลัย',
            'organization' => 'มหาวิทยาลัยขอนแก่น',
            'category' => 'construction',
            'method' => 'e-bidding',
            'budget' => '9876543.21',
            'location' => 'อำเภอเมืองขอนแก่น จังหวัดขอนแก่น',
            'reference_price' => '9765000.00',
            'contact_name' => 'กองคลัง งานพัสดุ',
            'contact_phone' => '043-202-555',
            'description' => 'ปรับปรุงระบบระบายน้ำตามเอกสารประกวดราคา',
            'deadline' => '2026-09-18',
            'status' => 'closing',
        ],
        'confidence' => [],
        'warnings' => ['budget_needs_review', 'deadline_needs_review'],
        'raw_text' => "มหาวิทยาลัยขอนแก่น\nประกวดราคาจ้างปรับปรุงระบบระบายน้ำ\nวงเงินงบประมาณ 9,876,543.21 บาท\nกำหนดยื่นข้อเสนอวันที่ 18 กันยายน 2569",
        'error_message' => null,
        'attempt_count' => 0,
        'processing_token' => null,
        'processing_started_at' => null,
        'approved_at' => null,
        'approved_by' => null,
    ]);

    expect($extraction->processed_at)->not->toBeNull()
        ->and(Storage::disk('local')->get($attachment->stored_filename))->toBe(file_get_contents($sourcePdf));

    $firstGraph = [
        'announcement' => $announcement->getAttributes(),
        'attachment' => $attachment->getAttributes(),
        'extraction' => $extraction->getAttributes(),
    ];

    artisan('portal:import', ['path' => $importPath])
        ->expectsOutput('Import complete: imported=0 skipped=1 errors=0')
        ->assertSuccessful();

    expect(Announcement::query()->count())->toBe(1)
        ->and(AnnouncementAttachment::query()->count())->toBe(1)
        ->and(DocumentExtraction::query()->count())->toBe(1)
        ->and([
            'announcement' => Announcement::query()->sole()->getAttributes(),
            'attachment' => AnnouncementAttachment::query()->sole()->getAttributes(),
            'extraction' => DocumentExtraction::query()->sole()->getAttributes(),
        ])->toBe($firstGraph);
});

test('a missing PDF reports an explicit row error without creating partial records', function () {
    Storage::fake('local');

    $importPath = portalImportFileWithAttachment([
        portalImportRow(['pdf_path' => 'missing.pdf']),
    ]);

    artisan('portal:import', ['path' => $importPath])
        ->expectsOutputToContain('Row 1: Database import failed: The source PDF is missing or unreadable.')
        ->expectsOutput('Import complete: imported=0 skipped=0 errors=1')
        ->assertFailed();

    expect(Announcement::query()->count())->toBe(0)
        ->and(AnnouncementAttachment::query()->count())->toBe(0)
        ->and(DocumentExtraction::query()->count())->toBe(0)
        ->and(Storage::disk('local')->allFiles())->toBe([]);

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
        ->expectsOutputToContain('Row 2: The budget field is required; the importer does not generate a fallback for this NOT NULL field.')
        ->expectsOutput('Import complete: imported=1 skipped=0 errors=1')
        ->assertFailed();

    portalImportCleanup($importPath);

    expect(Announcement::query()->count())->toBe(1)
        ->and(Announcement::query()->sole()->publication_status)->toBe('draft');
});

test('missing budget and deadline are rejected instead of receiving NOT NULL fallbacks', function () {
    Storage::fake('local');

    $importPath = portalImportFileWithAttachment([
        portalImportRow([
            'budget' => null,
        ]),
        portalImportRow([
            'record_key' => 'kku:notice-002',
            'deadline' => null,
        ]),
    ]);

    artisan('portal:import', ['path' => $importPath])
        ->expectsOutputToContain('Row 1: The budget field is required; the importer does not generate a fallback for this NOT NULL field.')
        ->expectsOutputToContain('Row 2: The deadline field is required; the importer does not generate a fallback for this NOT NULL field.')
        ->expectsOutput('Import complete: imported=0 skipped=0 errors=2')
        ->assertFailed();

    expect(Announcement::query()->count())->toBe(0)
        ->and(AnnouncementAttachment::query()->count())->toBe(0)
        ->and(DocumentExtraction::query()->count())->toBe(0)
        ->and(Storage::disk('local')->allFiles())->toBe([]);

    portalImportCleanup($importPath);
});

test('review flags preserve the provenance of accepted budget and deadline values', function () {
    Storage::fake('local');

    $importPath = portalImportFileWithAttachment([
        portalImportRow([
            'budget' => '1.00',
            'deadline' => '2026-10-30',
            'status' => 'closing',
            'publication_status' => 'published',
            'published_at' => '2026-09-01 09:00:00',
            'validation_flags' => ['budget_needs_review', 'deadline_needs_review'],
            'raw_text' => "วงเงิน 1.00 บาท\nกำหนดยื่นข้อเสนอ 30/10/2569",
        ]),
    ]);

    artisan('portal:import', ['path' => $importPath])
        ->expectsOutput('Import complete: imported=1 skipped=0 errors=0')
        ->assertSuccessful();

    $announcement = Announcement::query()->sole();
    $extraction = DocumentExtraction::query()->sole();

    expect($announcement->budget)->toBe('1.00')
        ->and($announcement->deadline->toDateString())->toBe('2026-10-30')
        ->and($announcement->status)->toBe('closing')
        ->and($announcement->publication_status)->toBe('draft')
        ->and($announcement->published_at)->toBeNull()
        ->and($extraction->candidate['budget'])->toBe('1.00')
        ->and($extraction->candidate['deadline'])->toBe('2026-10-30')
        ->and($extraction->warnings)->toBe(['budget_needs_review', 'deadline_needs_review'])
        ->and($extraction->raw_text)->toBe("วงเงิน 1.00 บาท\nกำหนดยื่นข้อเสนอ 30/10/2569");

    portalImportCleanup($importPath);
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
    file_put_contents($attachments.'/notice-001.pdf', portalImportPdfContents());

    return $path;
}

function portalImportPdfContents(): string
{
    return "%PDF-1.4\n%%EOF\n";
}

function portalImportCleanup(string $path): void
{
    $directory = dirname($path);
    @unlink($directory.'/portal_attachments/notice-001.pdf');
    @rmdir($directory.'/portal_attachments');
    @unlink($path);
    @rmdir($directory);
}
