<?php

use App\Models\Announcement;
use App\Models\DocumentExtraction;
use App\Models\User;
use App\Support\Procurement\AttachmentStorage;
use Database\Seeders\DemoAnnouncementSeeder;
use Illuminate\Support\Collection;
use Inertia\Testing\AssertableInertia as Assert;

use function Pest\Laravel\actingAs;
use function Pest\Laravel\get;
use function Pest\Laravel\patch;
use function Pest\Laravel\seed;

beforeEach(function () {
    seed(DemoAnnouncementSeeder::class);
});

function sourceAnnouncement(): Announcement
{
    return Announcement::query()->findOrFail(7);
}

function sourceExtraction(Announcement $announcement): DocumentExtraction
{
    return $announcement->attachments()->firstOrFail()->extraction()->firstOrFail();
}

function publishSourceAnnouncement(Announcement $announcement): void
{
    $announcement->update([
        'publication_status' => 'published',
        'published_at' => now(),
    ]);
}

function assertPrivateExtractionPropsMissing(Assert $page): Assert
{
    return $page
        ->missing('announcement.extraction')
        ->missing('announcement.extractions')
        ->missing('announcement.extraction_status')
        ->missing('announcement.extraction_method')
        ->missing('announcement.candidate')
        ->missing('announcement.confidence')
        ->missing('announcement.warnings')
        ->missing('announcement.raw_text')
        ->missing('announcement.error')
        ->missing('announcement.error_message')
        ->missing('announcement.attachments.0.extraction');
}

test('published announcement with an approved extraction exposes source attribution without extraction internals', function () {
    $announcement = sourceAnnouncement();
    publishSourceAnnouncement($announcement);

    $response = get(route('procurement.show', $announcement));

    $response->assertOk();
    $response->assertInertia(fn (Assert $page) => assertPrivateExtractionPropsMissing($page
        ->component('procurement/show')
        ->where('announcement.source_url', 'https://demo.invalid/kkmuni/PROC-2569-002')
        ->where('announcement.source_reference', 'PROC-2569-002')
        ->has('announcement.attachments', 1)
    ));
    $response
        ->assertDontSee('fake_ocr_placeholder', false)
        ->assertDontSee('deterministic OCR placeholder; not model output', false)
        ->assertDontSee('DEMO_EXTRACTION_FAILURE', false);
});

test('published announcement without a currently approved extraction omits source attribution and extraction internals', function () {
    $announcement = sourceAnnouncement();
    sourceExtraction($announcement)->update([
        'status' => 'review',
        'approved_at' => null,
        'approved_by' => null,
    ]);
    publishSourceAnnouncement($announcement);

    $response = get(route('procurement.show', $announcement));

    $response->assertOk();
    $response->assertInertia(fn (Assert $page) => assertPrivateExtractionPropsMissing($page
        ->missing('announcement.source_url')
        ->missing('announcement.source_reference')
    ));
    $response
        ->assertDontSee('https://demo.invalid/kkmuni/PROC-2569-002', false)
        ->assertDontSee('PROC-2569-002', false)
        ->assertDontSee('fake_ocr_placeholder', false);
});

test('editing an approval-sensitive field removes public source attribution', function (string $field, mixed $value) {
    $announcement = sourceAnnouncement();
    $extraction = sourceExtraction($announcement);
    publishSourceAnnouncement($announcement);

    app(AttachmentStorage::class)->updateAnnouncement($announcement, [$field => $value]);

    expect($extraction->refresh()->status)->toBe('review')
        ->and($extraction->approved_at)->toBeNull()
        ->and($extraction->approved_by)->toBeNull();

    get(route('procurement.show', $announcement))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => assertPrivateExtractionPropsMissing($page
            ->missing('announcement.source_url')
            ->missing('announcement.source_reference')
        ));
})->with([
    'candidate title' => ['title', 'จ้างปรับปรุงระบบระบายน้ำเทศบาล ระยะที่ 2'],
    'candidate organization' => ['organization', 'มหาวิทยาลัยขอนแก่น'],
    'candidate category' => ['category', 'goods'],
    'candidate method' => ['method', 'selective'],
    'candidate budget' => ['budget', 2750001],
    'candidate location' => ['location', 'ศาลากลางจังหวัดขอนแก่น'],
    'candidate reference price' => ['reference_price', 2700001],
    'candidate contact name' => ['contact_name', 'งานพัสดุ'],
    'candidate contact phone' => ['contact_phone', '043-000-699'],
    'candidate description' => ['description', 'ข้อมูลสาธิตที่แก้ไขแล้ว'],
    'candidate deadline' => ['deadline', '2026-10-16'],
    'candidate status' => ['status', 'urgent'],
    'provenance source url' => ['source_url', 'https://demo.invalid/kkmuni/PROC-2569-002-v2'],
    'provenance source reference' => ['source_reference', 'PROC-2569-002-v2'],
]);

test('publication-only publish and hide actions preserve approval while public visibility follows publication status', function () {
    $announcement = sourceAnnouncement();
    $extraction = sourceExtraction($announcement);
    $admin = User::factory()->create([
        'role' => 'admin',
        'email_verified_at' => now(),
    ]);
    actingAs($admin);

    patch(route('admin.announcements.publish', $announcement))->assertRedirect(route('admin.announcements.index'));

    expect($extraction->refresh()->status)->toBe('approved');
    get(route('procurement.show', $announcement))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('announcement.source_url', 'https://demo.invalid/kkmuni/PROC-2569-002')
            ->where('announcement.source_reference', 'PROC-2569-002')
        );

    patch(route('admin.announcements.hide', $announcement))->assertRedirect(route('admin.announcements.index'));

    expect($extraction->refresh()->status)->toBe('approved');
    get(route('procurement.show', $announcement))->assertNotFound();

    patch(route('admin.announcements.publish', $announcement))->assertRedirect(route('admin.announcements.index'));

    expect($extraction->refresh()->status)->toBe('approved');
    get(route('procurement.show', $announcement))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('announcement.source_url', 'https://demo.invalid/kkmuni/PROC-2569-002')
            ->where('announcement.source_reference', 'PROC-2569-002')
        );
});

test('draft and hidden source announcements return 404', function () {
    $draft = sourceAnnouncement();

    get(route('procurement.show', $draft))->assertNotFound();

    $draft->update(['publication_status' => 'hidden']);

    get(route('procurement.show', $draft))->assertNotFound();
});

test('public search explicitly whitelists announcement fields and excludes source and extraction data', function () {
    $announcement = sourceAnnouncement();
    publishSourceAnnouncement($announcement);

    $response = get(route('procurement.search', ['query' => $announcement->title]));
    $publicFields = ['id', 'title', 'organization', 'category', 'method', 'budget', 'deadline', 'status'];

    $response->assertOk();
    $response->assertInertia(fn (Assert $page) => $page
        ->has('announcements.data', 1)
        ->where('announcements.data.0', fn (Collection $data): bool => $data->keys()->all() === $publicFields)
        ->has('pagination.data', 1)
        ->where('pagination.data.0', fn (Collection $data): bool => $data->keys()->all() === $publicFields)
    );
    $response
        ->assertDontSee('https://demo.invalid/kkmuni/PROC-2569-002', false)
        ->assertDontSee('PROC-2569-002', false)
        ->assertDontSee('fake_ocr_placeholder', false)
        ->assertDontSee('deterministic OCR placeholder; not model output', false);
});
