<?php

use App\Support\Procurement\Extraction\ExtractionRequest;
use App\Support\Procurement\Extraction\ExtractionResult;
use App\Support\Procurement\Extraction\FakeDocumentExtractor;
use App\Support\Procurement\Taxonomy;

const CANDIDATE_KEYS = [
    'title',
    'organization',
    'category',
    'method',
    'budget',
    'location',
    'reference_price',
    'contact_name',
    'contact_phone',
    'description',
    'deadline',
    'status',
];

test('extracts the deterministic text PDF candidate from the original client filename', function () {
    $request = new ExtractionRequest('kku-text-demo.pdf');

    $result = (new FakeDocumentExtractor)->extract($request);

    expect($request->originalClientFilename)->toBe('kku-text-demo.pdf')
        ->and($result)->toBeInstanceOf(ExtractionResult::class)
        ->and($result->document_kind)->toBe('text_pdf')
        ->and($result->method)->toBe('fake_embedded_text')
        ->and($result->candidate)->toBe([
            'title' => 'ประกวดราคาซื้อครุภัณฑ์คอมพิวเตอร์',
            'organization' => 'มหาวิทยาลัยขอนแก่น',
            'category' => 'goods',
            'method' => 'e-bidding',
            'budget' => 1500000,
            'location' => 'มหาวิทยาลัยขอนแก่น',
            'reference_price' => 1480000,
            'contact_name' => 'งานพัสดุ',
            'contact_phone' => '043-000-601',
            'description' => 'ข้อมูลสาธิตจาก PDF ที่มีชั้นข้อความ',
            'deadline' => '2026-09-30',
            'status' => 'open',
        ])
        ->and(array_keys($result->candidate))->toBe(CANDIDATE_KEYS)
        ->and($result->candidate['category'])->toBeIn(array_keys(Taxonomy::categories()))
        ->and($result->candidate['method'])->toBeIn(array_keys(Taxonomy::methods()))
        ->and($result->candidate['status'])->toBeIn(['open', 'urgent', 'closing', 'closed'])
        ->and($result->confidence)->toBe(['title' => 0.99, 'budget' => 0.98])
        ->and($result->warnings)->toBe([])
        ->and($result->raw_text)->toBe('ข้อมูลสาธิต Text PDF')
        ->and($result->error_message)->toBeNull();
});

test('returns an honestly labeled partial placeholder for the scanned fixture', function () {
    $result = (new FakeDocumentExtractor)->extract(
        new ExtractionRequest('khon-kaen-municipality-scanned-demo.pdf'),
    );

    expect($result->document_kind)->toBe('scanned_pdf')
        ->and($result->method)->toBe('fake_ocr_placeholder')
        ->and($result->candidate)->toBe([
            'title' => 'จ้างปรับปรุงระบบระบายน้ำเทศบาล',
            'organization' => 'เทศบาลนครขอนแก่น',
            'category' => 'construction',
            'method' => 'e-bidding',
            'budget' => 2750000,
            'location' => 'เทศบาลนครขอนแก่น',
            'reference_price' => 2700000,
            'contact_name' => 'กองคลัง',
            'contact_phone' => '043-000-602',
            'description' => 'ข้อมูลสาธิต Scanned PDF',
            'deadline' => '2026-10-15',
            'status' => 'open',
        ])
        ->and($result->candidate['category'])->toBeIn(array_keys(Taxonomy::categories()))
        ->and($result->candidate['method'])->toBeIn(array_keys(Taxonomy::methods()))
        ->and($result->candidate['status'])->toBeIn(['open', 'urgent', 'closing', 'closed'])
        ->and($result->confidence)->toBe(['title' => 0.86, 'budget' => 0.82])
        ->and($result->warnings)->toBe(['deterministic OCR placeholder; not model output'])
        ->and($result->raw_text)->toBe('ข้อมูลสาธิต Scanned PDF')
        ->and($result->error_message)->toBeNull();
});

test('returns a typed failure result for the failure fixture', function () {
    $result = (new FakeDocumentExtractor)->extract(
        new ExtractionRequest('thanyarak-khon-kaen-failure-demo.pdf'),
    );

    expect($result)->toBeInstanceOf(ExtractionResult::class)
        ->and($result->document_kind)->toBe('unknown')
        ->and($result->method)->toBeNull()
        ->and($result->candidate)->toBeNull()
        ->and($result->confidence)->toBe([])
        ->and($result->raw_text)->toBeNull()
        ->and($result->warnings)->toBe([])
        ->and($result->error_message)->toBe('DEMO_EXTRACTION_FAILURE');
});

test('returns a safe review fallback for malformed and unknown filenames', function (string $filename) {
    $result = (new FakeDocumentExtractor)->extract(new ExtractionRequest($filename));

    expect($result->document_kind)->toBe('unknown')
        ->and($result->method)->toBe('fake_unknown')
        ->and($result->candidate)->toBeNull()
        ->and($result->confidence)->toBe([])
        ->and($result->warnings)->not->toBe([])
        ->and($result->raw_text)->toBeNull()
        ->and($result->error_message)->toBeNull();
})->with([
    'unknown' => 'unrecognized.pdf',
    'empty' => '',
    'odd case' => 'KKU-TEXT-DEMO.PDF',
    'generated storage basename' => 'attachments/4f81a2.pdf',
]);

test('keeps request and result immutable with exactly the persisted result fields', function () {
    $request = new ExtractionRequest('kku-text-demo.pdf');
    $result = (new FakeDocumentExtractor)->extract($request);

    expect((new ReflectionClass($request))->isReadOnly())->toBeTrue()
        ->and((new ReflectionClass($result))->isReadOnly())->toBeTrue()
        ->and(array_keys(get_object_vars($result)))->toBe([
            'document_kind',
            'method',
            'candidate',
            'confidence',
            'warnings',
            'raw_text',
            'error_message',
        ]);
});

test('never emits forbidden announcement, provenance, or identity candidate keys', function (string $filename) {
    $result = (new FakeDocumentExtractor)->extract(new ExtractionRequest($filename));

    expect(array_keys($result->candidate ?? []))->each->toBeIn(CANDIDATE_KEYS)
        ->and(array_keys($result->candidate ?? []))->not->toContain(
            'publication_status',
            'source_url',
            'source_reference',
            'id',
            'announcement_id',
            'announcement_attachment_id',
        );
})->with([
    'text fixture' => 'kku-text-demo.pdf',
    'scanned fixture' => 'khon-kaen-municipality-scanned-demo.pdf',
    'failure fixture' => 'thanyarak-khon-kaen-failure-demo.pdf',
    'unknown fixture' => 'unknown.pdf',
]);
