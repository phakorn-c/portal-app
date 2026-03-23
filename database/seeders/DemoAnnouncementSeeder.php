<?php

namespace Database\Seeders;

use App\Models\Announcement;
use App\Models\AnnouncementAttachment;
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
    }

    private function minimalPdfContent(): string
    {
        // Minimal valid PDF structure for demo purposes
        return "%PDF-1.4\n1 0 obj\n<<\n/Type /Catalog\n/Pages 2 0 R\n>>\nendobj\n2 0 obj\n<<\n/Type /Pages\n/Kids [3 0 R]\n/Count 1\n>>\nendobj\n3 0 obj\n<<\n/Type /Page\n/Parent 2 0 R\n/MediaBox [0 0 612 792]\n/Contents 4 0 R\n>>\nendobj\n4 0 obj\n<<\n/Length 44\n>>\nstream\nBT\n/F1 12 Tf\n100 700 Td\n(Demo PDF Attachment) Tj\nET\nendstream\nendobj\nxref\n0 5\n0000000000 65535 f\n0000000009 00000 n\n0000000058 00000 n\n0000000115 00000 n\n0000000214 00000 n\ntrailer\n<<\n/Size 5\n/Root 1 0 R\n>>\nstartxref\n308\n%%EOF";
    }
}
