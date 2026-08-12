<?php

use App\Models\Announcement;
use App\Models\AnnouncementAttachment;
use App\Models\DocumentExtraction;
use App\Models\User;
use App\Support\Procurement\Taxonomy;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Support\Facades\Storage;

use function Pest\Laravel\seed;

const THAI_FIXTURES = [
    6 => [
        'filename' => 'kku-text-demo.pdf',
        'stored_filename' => 'attachments/kku-text-demo.pdf',
        'sha256' => '952c7d6ee54162b5390d010ddec7db423f8156355c9cb3d31855ac5642d13535',
        'size' => 466,
    ],
    7 => [
        'filename' => 'khon-kaen-municipality-scanned-demo.pdf',
        'stored_filename' => 'attachments/khon-kaen-municipality-scanned-demo.pdf',
        'sha256' => '7b9b4fde3bd1bdcd778e4c64f458f3d286c88e2984750ee213e03222bacffc2b',
        'size' => 488,
    ],
    8 => [
        'filename' => 'thanyarak-khon-kaen-failure-demo.pdf',
        'stored_filename' => 'attachments/thanyarak-khon-kaen-failure-demo.pdf',
        'sha256' => '19e6c0b8abdee6209e1c93dcd1ba3e553f19e9d3769c872f1cd12b27d2d445db',
        'size' => 481,
    ],
];

const ORIGINAL_ANNOUNCEMENT_TITLES = [
    1 => 'Khon Kaen Smart Traffic Upgrade',
    2 => 'Ban Phai School Wi-Fi Expansion',
    3 => 'Nam Phong Clinic Renovation',
    4 => 'Internal ERP Discovery Workshop',
    5 => 'Archived Water Pump Replacement',
];

const ORIGINAL_PDF_SHA256 = '660b9ea443b233dbff854f75666a0a08aab5e6ac2289db78e7ed1d8c7923152e';

beforeEach(function () {
    seed(DatabaseSeeder::class);
});

test('seeds the literal Thai extraction matrix and exact fixture bytes', function () {
    expect(Taxonomy::organizations())->toContain('โรงพยาบาลธัญญารักษ์ขอนแก่น')
        ->and(Announcement::query()->count())->toBe(8)
        ->and(AnnouncementAttachment::query()->count())->toBe(4)
        ->and(DocumentExtraction::query()->count())->toBe(3);

    $admin = User::query()->where('email', 'admin@example.com')->firstOrFail();

    $expected = [
        6 => [
            'source_url' => 'https://demo.invalid/kku/PROC-2569-001',
            'source_reference' => 'PROC-2569-001',
            'kind' => 'text_pdf',
            'method' => 'fake_embedded_text',
            'status' => 'review',
            'started' => '2026-08-01 09:00:00',
            'processed' => '2026-08-01 09:00:01',
            'approved' => null,
            'approved_by' => null,
            'candidate' => [
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
            ],
            'confidence' => ['title' => 0.99, 'budget' => 0.98],
            'warnings' => [],
            'raw_text' => 'ข้อมูลสาธิต Text PDF',
            'error' => null,
        ],
        7 => [
            'source_url' => 'https://demo.invalid/kkmuni/PROC-2569-002',
            'source_reference' => 'PROC-2569-002',
            'kind' => 'scanned_pdf',
            'method' => 'fake_ocr_placeholder',
            'status' => 'approved',
            'started' => '2026-08-01 09:05:00',
            'processed' => '2026-08-01 09:05:01',
            'approved' => '2026-08-01 09:06:00',
            'approved_by' => $admin->id,
            'candidate' => [
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
            ],
            'confidence' => ['title' => 0.86, 'budget' => 0.82],
            'warnings' => ['deterministic OCR placeholder; not model output'],
            'raw_text' => 'ข้อมูลสาธิต Scanned PDF',
            'error' => null,
        ],
        8 => [
            'source_url' => 'https://demo.invalid/thanyarak/PROC-2569-003',
            'source_reference' => 'PROC-2569-003',
            'kind' => 'unknown',
            'method' => null,
            'status' => 'failed',
            'started' => '2026-08-01 09:10:00',
            'processed' => '2026-08-01 09:10:01',
            'approved' => null,
            'approved_by' => null,
            'candidate' => null,
            'confidence' => null,
            'warnings' => null,
            'raw_text' => null,
            'error' => 'DEMO_EXTRACTION_FAILURE',
        ],
    ];

    foreach ($expected as $announcementId => $matrix) {
        $announcement = Announcement::query()->findOrFail($announcementId);
        $attachment = $announcement->attachments()->firstOrFail();
        $extraction = $attachment->extraction()->firstOrFail();
        $fixture = THAI_FIXTURES[$announcementId];

        expect($announcement->publication_status)->toBe('draft')
            ->and($announcement->source_url)->toBe($matrix['source_url'])
            ->and($announcement->source_reference)->toBe($matrix['source_reference'])
            ->and($attachment->filename)->toBe($fixture['filename'])
            ->and($attachment->stored_filename)->toBe($fixture['stored_filename'])
            ->and($attachment->document_kind)->toBe($matrix['kind'])
            ->and($attachment->sha256)->toBe($fixture['sha256'])
            ->and($attachment->file_size)->toBe($fixture['size'])
            ->and(hash('sha256', Storage::disk('local')->get($attachment->stored_filename)))->toBe($fixture['sha256'])
            ->and(Storage::disk('local')->size($attachment->stored_filename))->toBe($fixture['size'])
            ->and(Storage::disk('local')->get($attachment->stored_filename))->toBe(
                file_get_contents(base_path('tests/Fixtures/Procurement/'.$fixture['filename'])),
            )
            ->and($extraction->status)->toBe($matrix['status'])
            ->and($extraction->method)->toBe($matrix['method'])
            ->and($extraction->attempt_count)->toBe(1)
            ->and($extraction->processing_started_at?->utc()->format('Y-m-d H:i:s'))->toBe($matrix['started'])
            ->and($extraction->processed_at?->utc()->format('Y-m-d H:i:s'))->toBe($matrix['processed'])
            ->and($extraction->approved_at?->utc()->format('Y-m-d H:i:s'))->toBe($matrix['approved'])
            ->and($extraction->approved_by)->toBe($matrix['approved_by'])
            ->and($extraction->candidate)->toBe($matrix['candidate'])
            ->and($extraction->confidence)->toBe($matrix['confidence'])
            ->and($extraction->warnings)->toBe($matrix['warnings'])
            ->and($extraction->raw_text)->toBe($matrix['raw_text'])
            ->and($extraction->error_message)->toBe($matrix['error']);

        if ($announcementId === 7) {
            expect($announcement->only([
                'title', 'organization', 'category', 'method', 'location', 'contact_name',
                'contact_phone', 'description', 'status',
            ]))->toBe(collect($matrix['candidate'])->except(['budget', 'reference_price', 'deadline'])->all())
                ->and((int) $announcement->budget)->toBe($matrix['candidate']['budget'])
                ->and((int) $announcement->reference_price)->toBe($matrix['candidate']['reference_price'])
                ->and($announcement->deadline->format('Y-m-d'))->toBe($matrix['candidate']['deadline']);
        }
    }
});

test('preserves IDs one through five and the original demo PDF across deterministic reseeding', function () {
    $snapshot = fn (): array => [
        'announcements' => Announcement::query()->orderBy('id')->get()->map->getAttributes()->all(),
        'attachments' => AnnouncementAttachment::query()->orderBy('id')->get()->map->getAttributes()->all(),
        'extractions' => DocumentExtraction::query()->orderBy('id')->get()->map->getAttributes()->all(),
        'files' => collect(THAI_FIXTURES)
            ->pluck('stored_filename')
            ->prepend('attachments/demo-smart-traffic-tor.pdf')
            ->mapWithKeys(fn (string $path): array => [$path => hash('sha256', Storage::disk('local')->get($path))])
            ->all(),
    ];

    $before = $snapshot();

    expect(Announcement::query()->whereKey(array_keys(ORIGINAL_ANNOUNCEMENT_TITLES))->orderBy('id')->pluck('title', 'id')->all())
        ->toBe(ORIGINAL_ANNOUNCEMENT_TITLES)
        ->and(Storage::disk('local')->size('attachments/demo-smart-traffic-tor.pdf'))->toBe(460)
        ->and(hash('sha256', Storage::disk('local')->get('attachments/demo-smart-traffic-tor.pdf')))->toBe(ORIGINAL_PDF_SHA256);

    seed(DatabaseSeeder::class);

    expect($snapshot())->toBe($before)
        ->and(Announcement::query()->whereKey(array_keys(ORIGINAL_ANNOUNCEMENT_TITLES))->orderBy('id')->pluck('title', 'id')->all())
        ->toBe(ORIGINAL_ANNOUNCEMENT_TITLES)
        ->and(Storage::disk('local')->size('attachments/demo-smart-traffic-tor.pdf'))->toBe(460)
        ->and(hash('sha256', Storage::disk('local')->get('attachments/demo-smart-traffic-tor.pdf')))->toBe(ORIGINAL_PDF_SHA256);
});
