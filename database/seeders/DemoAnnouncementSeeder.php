<?php

namespace Database\Seeders;

use App\Models\Announcement;
use App\Models\AnnouncementAttachment;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class DemoAnnouncementSeeder extends Seeder
{
    public function run(): void
    {
        Announcement::query()->delete();
        AnnouncementAttachment::query()->delete();

        DB::table('announcements')->insert([
            [
                'id' => 1,
                'title' => 'Khon Kaen Smart Traffic Upgrade',
                'organization' => 'เทศบาลนครขอนแก่น',
                'category' => 'services',
                'method' => 'e-bidding',
                'budget' => '2450000.00',
                'location' => 'Khon Kaen City Hall',
                'reference_price' => '2400000.00',
                'contact_name' => 'Suda Rattanakul',
                'contact_phone' => '043-000-101',
                'description' => 'Published demo record for the public procurement landing page.',
                'status' => 'open',
                'publication_status' => 'published',
                'deadline' => '2026-04-25',
                'published_at' => '2026-03-18 09:00:00',
                'created_at' => '2026-03-18 09:00:00',
                'updated_at' => '2026-03-18 09:00:00',
            ],
            [
                'id' => 2,
                'title' => 'Ban Phai School Wi-Fi Expansion',
                'organization' => 'องค์การบริหารส่วนจังหวัด',
                'category' => 'goods',
                'method' => 'selective',
                'budget' => '890000.00',
                'location' => 'Ban Phai District',
                'reference_price' => '875000.00',
                'contact_name' => 'Preecha Srisuk',
                'contact_phone' => '043-000-202',
                'description' => 'Published demo record for member dashboards and saved searches.',
                'status' => 'urgent',
                'publication_status' => 'published',
                'deadline' => '2026-04-18',
                'published_at' => '2026-03-17 10:30:00',
                'created_at' => '2026-03-17 10:30:00',
                'updated_at' => '2026-03-17 10:30:00',
            ],
            [
                'id' => 3,
                'title' => 'Nam Phong Clinic Renovation',
                'organization' => 'สำนักงานสาธารณสุขจังหวัด',
                'category' => 'construction',
                'method' => 'specific',
                'budget' => '3650000.00',
                'location' => 'Nam Phong',
                'reference_price' => '3600000.00',
                'contact_name' => 'Anong Chaisena',
                'contact_phone' => '043-000-303',
                'description' => 'Published demo record for detail views and sorting checks.',
                'status' => 'closing',
                'publication_status' => 'published',
                'deadline' => '2026-04-12',
                'published_at' => '2026-03-16 14:15:00',
                'created_at' => '2026-03-16 14:15:00',
                'updated_at' => '2026-03-16 14:15:00',
            ],
            [
                'id' => 4,
                'title' => 'Internal ERP Discovery Workshop',
                'organization' => 'มหาวิทยาลัยขอนแก่น',
                'category' => 'consulting',
                'method' => 'selective',
                'budget' => '420000.00',
                'location' => 'Khon Kaen Province Hall',
                'reference_price' => '415000.00',
                'contact_name' => 'Nisa Wongchai',
                'contact_phone' => '043-000-404',
                'description' => 'Draft demo record reserved for access-control assertions.',
                'status' => 'open',
                'publication_status' => 'draft',
                'deadline' => '2026-05-02',
                'published_at' => null,
                'created_at' => '2026-03-15 11:45:00',
                'updated_at' => '2026-03-15 11:45:00',
            ],
            [
                'id' => 5,
                'title' => 'Archived Water Pump Replacement',
                'organization' => 'แขวงทางหลวงขอนแก่น',
                'category' => 'goods',
                'method' => 'e-bidding',
                'budget' => '1180000.00',
                'location' => 'Ubolratana',
                'reference_price' => '1150000.00',
                'contact_name' => 'Kriangsak Panya',
                'contact_phone' => '043-000-505',
                'description' => 'Hidden demo record reserved for visibility assertions.',
                'status' => 'closed',
                'publication_status' => 'hidden',
                'deadline' => '2026-03-30',
                'published_at' => null,
                'created_at' => '2026-03-14 08:20:00',
                'updated_at' => '2026-03-14 08:20:00',
            ],
        ]);

        DB::table('announcements')->insert([
            [
                'id' => 6,
                'title' => 'ประกวดราคาซื้อครุภัณฑ์คอมพิวเตอร์',
                'organization' => 'มหาวิทยาลัยขอนแก่น',
                'category' => 'goods',
                'method' => 'e-bidding',
                'budget' => '1500000.00',
                'location' => 'มหาวิทยาลัยขอนแก่น',
                'reference_price' => '1480000.00',
                'contact_name' => 'งานพัสดุ',
                'contact_phone' => '043-000-601',
                'description' => 'ข้อมูลสาธิตจาก PDF ที่มีชั้นข้อความ',
                'status' => 'open',
                'publication_status' => 'draft',
                'deadline' => '2026-09-30',
                'published_at' => null,
                'source_url' => 'https://demo.invalid/kku/PROC-2569-001',
                'source_reference' => 'PROC-2569-001',
                'created_at' => '2026-08-01 09:00:00',
                'updated_at' => '2026-08-01 09:00:01',
            ],
            [
                'id' => 7,
                'title' => 'จ้างปรับปรุงระบบระบายน้ำเทศบาล',
                'organization' => 'เทศบาลนครขอนแก่น',
                'category' => 'construction',
                'method' => 'e-bidding',
                'budget' => '2750000.00',
                'location' => 'เทศบาลนครขอนแก่น',
                'reference_price' => '2700000.00',
                'contact_name' => 'กองคลัง',
                'contact_phone' => '043-000-602',
                'description' => 'ข้อมูลสาธิต Scanned PDF',
                'status' => 'open',
                'publication_status' => 'draft',
                'deadline' => '2026-10-15',
                'published_at' => null,
                'source_url' => 'https://demo.invalid/kkmuni/PROC-2569-002',
                'source_reference' => 'PROC-2569-002',
                'created_at' => '2026-08-01 09:05:00',
                'updated_at' => '2026-08-01 09:06:00',
            ],
            [
                'id' => 8,
                'title' => 'เอกสารสาธิตการสกัดข้อมูลไม่สำเร็จ',
                'organization' => 'โรงพยาบาลธัญญารักษ์ขอนแก่น',
                'category' => 'services',
                'method' => 'specific',
                'budget' => '0.00',
                'location' => 'โรงพยาบาลธัญญารักษ์ขอนแก่น',
                'reference_price' => null,
                'contact_name' => null,
                'contact_phone' => null,
                'description' => 'ข้อมูลสาธิตกรณีการสกัดเอกสารล้มเหลว',
                'status' => 'open',
                'publication_status' => 'draft',
                'deadline' => '2026-10-31',
                'published_at' => null,
                'source_url' => 'https://demo.invalid/thanyarak/PROC-2569-003',
                'source_reference' => 'PROC-2569-003',
                'created_at' => '2026-08-01 09:10:00',
                'updated_at' => '2026-08-01 09:10:01',
            ],
        ]);

        $this->syncPostgresSequence('announcements', 'id');

        // Create a demo PDF attachment for the first published announcement
        $attachmentId = 1;
        $storedFilename = 'attachments/demo-smart-traffic-tor.pdf';

        // Store a minimal valid PDF content
        Storage::disk('local')->put($storedFilename, $this->minimalPdfContent());

        DB::table('announcement_attachments')->insert([
            'id' => $attachmentId,
            'announcement_id' => 1,
            'filename' => 'Smart-Traffic-TOR-demo.pdf',
            'stored_filename' => $storedFilename,
            'mime_type' => 'application/pdf',
            'file_size' => 1024,
            'created_at' => '2026-03-18 09:00:00',
            'updated_at' => '2026-03-18 09:00:00',
        ]);

        $fixtures = [
            6 => [
                'id' => 2,
                'filename' => 'kku-text-demo.pdf',
                'stored_filename' => 'attachments/kku-text-demo.pdf',
                'sha256' => '952c7d6ee54162b5390d010ddec7db423f8156355c9cb3d31855ac5642d13535',
                'file_size' => 466,
                'document_kind' => 'text_pdf',
                'timestamp' => '2026-08-01 09:00:00',
            ],
            7 => [
                'id' => 3,
                'filename' => 'khon-kaen-municipality-scanned-demo.pdf',
                'stored_filename' => 'attachments/khon-kaen-municipality-scanned-demo.pdf',
                'sha256' => '7b9b4fde3bd1bdcd778e4c64f458f3d286c88e2984750ee213e03222bacffc2b',
                'file_size' => 488,
                'document_kind' => 'scanned_pdf',
                'timestamp' => '2026-08-01 09:05:00',
            ],
            8 => [
                'id' => 4,
                'filename' => 'thanyarak-khon-kaen-failure-demo.pdf',
                'stored_filename' => 'attachments/thanyarak-khon-kaen-failure-demo.pdf',
                'sha256' => '19e6c0b8abdee6209e1c93dcd1ba3e553f19e9d3769c872f1cd12b27d2d445db',
                'file_size' => 481,
                'document_kind' => 'unknown',
                'timestamp' => '2026-08-01 09:10:00',
            ],
        ];

        foreach ($fixtures as $announcementId => $fixture) {
            $contents = file_get_contents(base_path('tests/Fixtures/Procurement/'.$fixture['filename']));

            if ($contents === false
                || strlen($contents) !== $fixture['file_size']
                || hash('sha256', $contents) !== $fixture['sha256']) {
                throw new \RuntimeException("Invalid demo fixture: {$fixture['filename']}");
            }

            Storage::disk('local')->put($fixture['stored_filename'], $contents);

            DB::table('announcement_attachments')->insert([
                'id' => $fixture['id'],
                'announcement_id' => $announcementId,
                'filename' => $fixture['filename'],
                'stored_filename' => $fixture['stored_filename'],
                'mime_type' => 'application/pdf',
                'file_size' => $fixture['file_size'],
                'sha256' => $fixture['sha256'],
                'document_kind' => $fixture['document_kind'],
                'created_at' => $fixture['timestamp'],
                'updated_at' => $fixture['timestamp'],
            ]);
        }

        $this->syncPostgresSequence('announcement_attachments', 'id');

        $adminId = User::query()->where('email', 'admin@example.com')->value('id');

        DB::table('document_extractions')->insert([
            [
                'id' => 1,
                'announcement_attachment_id' => 2,
                'status' => 'review',
                'method' => 'fake_embedded_text',
                'candidate' => json_encode([
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
                ], JSON_THROW_ON_ERROR | JSON_UNESCAPED_UNICODE),
                'confidence' => json_encode(['title' => 0.99, 'budget' => 0.98], JSON_THROW_ON_ERROR),
                'warnings' => json_encode([], JSON_THROW_ON_ERROR),
                'raw_text' => 'ข้อมูลสาธิต Text PDF',
                'error_message' => null,
                'attempt_count' => 1,
                'processing_token' => null,
                'processing_started_at' => '2026-08-01 09:00:00',
                'processed_at' => '2026-08-01 09:00:01',
                'approved_at' => null,
                'approved_by' => null,
                'created_at' => '2026-08-01 09:00:00',
                'updated_at' => '2026-08-01 09:00:01',
            ],
            [
                'id' => 2,
                'announcement_attachment_id' => 3,
                'status' => 'approved',
                'method' => 'fake_ocr_placeholder',
                'candidate' => json_encode([
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
                ], JSON_THROW_ON_ERROR | JSON_UNESCAPED_UNICODE),
                'confidence' => json_encode(['title' => 0.86, 'budget' => 0.82], JSON_THROW_ON_ERROR),
                'warnings' => json_encode(['deterministic OCR placeholder; not model output'], JSON_THROW_ON_ERROR),
                'raw_text' => 'ข้อมูลสาธิต Scanned PDF',
                'error_message' => null,
                'attempt_count' => 1,
                'processing_token' => null,
                'processing_started_at' => '2026-08-01 09:05:00',
                'processed_at' => '2026-08-01 09:05:01',
                'approved_at' => '2026-08-01 09:06:00',
                'approved_by' => $adminId,
                'created_at' => '2026-08-01 09:05:00',
                'updated_at' => '2026-08-01 09:06:00',
            ],
            [
                'id' => 3,
                'announcement_attachment_id' => 4,
                'status' => 'failed',
                'method' => null,
                'candidate' => null,
                'confidence' => null,
                'warnings' => null,
                'raw_text' => null,
                'error_message' => 'DEMO_EXTRACTION_FAILURE',
                'attempt_count' => 1,
                'processing_token' => null,
                'processing_started_at' => '2026-08-01 09:10:00',
                'processed_at' => '2026-08-01 09:10:01',
                'approved_at' => null,
                'approved_by' => null,
                'created_at' => '2026-08-01 09:10:00',
                'updated_at' => '2026-08-01 09:10:01',
            ],
        ]);

        $this->syncPostgresSequence('document_extractions', 'id');
    }

    private function syncPostgresSequence(string $table, string $column): void
    {
        if (DB::getDriverName() !== 'pgsql') {
            return;
        }

        DB::statement(
            "SELECT setval(pg_get_serial_sequence('{$table}', '{$column}'), COALESCE(MAX({$column}), 1), true) FROM {$table}"
        );
    }

    private function minimalPdfContent(): string
    {
        // Minimal valid PDF structure for demo purposes
        return "%PDF-1.4\n1 0 obj\n<<\n/Type /Catalog\n/Pages 2 0 R\n>>\nendobj\n2 0 obj\n<<\n/Type /Pages\n/Kids [3 0 R]\n/Count 1\n>>\nendobj\n3 0 obj\n<<\n/Type /Page\n/Parent 2 0 R\n/MediaBox [0 0 612 792]\n/Contents 4 0 R\n>>\nendobj\n4 0 obj\n<<\n/Length 44\n>>\nstream\nBT\n/F1 12 Tf\n100 700 Td\n(Demo PDF Attachment) Tj\nET\nendstream\nendobj\nxref\n0 5\n0000000000 65535 f\n0000000009 00000 n\n0000000058 00000 n\n0000000115 00000 n\n0000000214 00000 n\ntrailer\n<<\n/Size 5\n/Root 1 0 R\n>>\nstartxref\n308\n%%EOF";
    }
}
