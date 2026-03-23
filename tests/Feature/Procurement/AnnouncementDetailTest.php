<?php

use App\Models\Announcement;
use App\Models\AnnouncementAttachment;
use App\Models\User;
use Database\Seeders\DemoAnnouncementSeeder;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;

use function Pest\Laravel\actingAs;
use function Pest\Laravel\assertDatabaseHas;
use function Pest\Laravel\assertDatabaseMissing;
use function Pest\Laravel\get;
use function Pest\Laravel\seed;

beforeEach(function () {
    seed(DemoAnnouncementSeeder::class);
});

function seededAnnouncement(int $id): Announcement
{
    return Announcement::query()->findOrFail($id);
}

function seededPdfAttachment(Announcement $announcement, string $filename = 'demo-contract.pdf'): AnnouncementAttachment
{
    $attachment = AnnouncementAttachment::factory()->create([
        'announcement_id' => $announcement->id,
        'filename' => $filename,
        'stored_filename' => 'attachments/'.$filename,
    ]);

    Storage::disk('local')->put($attachment->stored_filename, 'pdf-content');

    return $attachment;
}

test('shows published seeded announcement detail', function () {
    $announcement = seededAnnouncement(1);

    $response = get(route('procurement.show', $announcement));

    $response->assertOk();
    $response->assertInertia(fn (Assert $page) => $page
        ->component('procurement/show')
        ->where('announcement.id', 1)
        ->where('announcement.title', 'Khon Kaen Smart Traffic Upgrade')
        ->where('announcement.organization', 'เทศบาลนครขอนแก่น')
        ->where('announcement.method', 'e-bidding')
        ->where('announcement.category', 'services')
        ->where('announcement.publication_status', 'published')
        ->has('announcement.attachments', 1)
        ->where('announcement.attachments.0.filename', 'Smart-Traffic-TOR-demo.pdf')
    );
});

test('returns 404 for invalid announcement', function () {
    get('/procurement/announcements/999999')->assertNotFound();
});

test('returns 404 for draft announcement', function () {
    $announcement = seededAnnouncement(4);

    $response = get(route('procurement.show', $announcement));

    $response->assertNotFound();
});

test('returns 404 for hidden announcement', function () {
    $announcement = seededAnnouncement(5);

    $response = get(route('procurement.show', $announcement));

    $response->assertNotFound();
});

test('published detail exposes attachment preview and download urls', function () {
    Storage::fake('local');

    // Use announcement 2 (has no seeded attachments) to avoid conflict with seeded data
    $announcement = seededAnnouncement(2);
    $attachment = seededPdfAttachment($announcement, 'smart-traffic-contract.pdf');

    $response = get(route('procurement.show', $announcement));

    $response->assertOk();
    $response->assertInertia(fn (Assert $page) => $page
        ->component('procurement/show')
        ->has('announcement.attachments', 1)
        ->where('announcement.attachments.0.id', $attachment->id)
        ->where('announcement.attachments.0.filename', 'smart-traffic-contract.pdf')
        ->where('announcement.attachments.0.preview_url', route('procurement.pdf', [
            'announcement' => $announcement,
            'attachment' => $attachment,
        ]))
        ->where('announcement.attachments.0.download_url', route('procurement.pdf.download', [
            'announcement' => $announcement,
            'attachment' => $attachment,
        ]))
    );
});

test('creates listing history for authenticated verified user', function () {
    $announcement = seededAnnouncement(1);
    $user = User::query()->findOrFail(User::factory()->createOne()->getKey());
    actingAs($user);

    $response = get(route('procurement.show', $announcement));

    $response->assertOk();
    assertDatabaseHas('listing_history', [
        'user_id' => $user->id,
        'announcement_id' => $announcement->id,
    ]);
});

test('does not create listing history for guests', function () {
    $announcement = seededAnnouncement(1);

    $response = get(route('procurement.show', $announcement));

    $response->assertOk();
    assertDatabaseMissing('listing_history', [
        'announcement_id' => $announcement->id,
    ]);
});

test('serves pdf for published announcement', function () {
    Storage::fake('local');

    $announcement = seededAnnouncement(1);
    $attachment = seededPdfAttachment($announcement, 'published.pdf');

    $response = get(route('procurement.pdf', [
        'announcement' => $announcement,
        'attachment' => $attachment,
    ]));

    $response->assertOk();
    $response->assertHeader('content-type', 'application/pdf');
    $response->assertHeader('content-disposition', 'inline; filename="published.pdf"');
});

test('downloads pdf from explicit download endpoint', function () {
    Storage::fake('local');

    $announcement = seededAnnouncement(1);
    $attachment = seededPdfAttachment($announcement, 'downloadable.pdf');

    $response = get(route('procurement.pdf.download', [
        'announcement' => $announcement,
        'attachment' => $attachment,
    ]));

    $response->assertOk();
    $response->assertHeader('content-type', 'application/pdf');
    $response->assertHeader('content-disposition', 'attachment; filename=downloadable.pdf');
});

test('returns 404 pdf for invalid attachment', function () {
    $announcement = seededAnnouncement(1);

    get("/procurement/announcements/{$announcement->id}/pdf/999999")->assertNotFound();
});

test('returns 404 pdf for attachment from another announcement', function () {
    Storage::fake('local');

    $announcement = seededAnnouncement(1);
    $foreignAttachment = seededPdfAttachment(seededAnnouncement(2), 'foreign.pdf');

    $response = get(route('procurement.pdf', [
        'announcement' => $announcement,
        'attachment' => $foreignAttachment,
    ]));

    $response->assertNotFound();
});

test('returns 404 pdf when the stored file is missing', function () {
    Storage::fake('local');

    $announcement = seededAnnouncement(1);
    $attachment = AnnouncementAttachment::factory()->create([
        'announcement_id' => $announcement->id,
        'filename' => 'missing.pdf',
        'stored_filename' => 'attachments/missing.pdf',
    ]);

    $response = get(route('procurement.pdf', [
        'announcement' => $announcement,
        'attachment' => $attachment,
    ]));

    $response->assertNotFound();
});

test('returns 404 pdf for draft announcement', function () {
    Storage::fake('local');

    $announcement = seededAnnouncement(4);
    $attachment = seededPdfAttachment($announcement, 'draft.pdf');

    $response = get(route('procurement.pdf', [
        'announcement' => $announcement,
        'attachment' => $attachment,
    ]));

    $response->assertNotFound();
});

test('returns 404 pdf for hidden announcement', function () {
    Storage::fake('local');

    $announcement = seededAnnouncement(5);
    $attachment = seededPdfAttachment($announcement, 'hidden.pdf');

    $response = get(route('procurement.pdf', [
        'announcement' => $announcement,
        'attachment' => $attachment,
    ]));

    $response->assertNotFound();
});
