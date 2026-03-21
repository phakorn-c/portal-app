<?php

use App\Models\Announcement;
use App\Models\AnnouncementAttachment;
use App\Models\User;
use Illuminate\Support\Facades\Storage;

use function Pest\Laravel\actingAs;
use function Pest\Laravel\assertDatabaseHas;
use function Pest\Laravel\assertDatabaseMissing;
use function Pest\Laravel\get;

test('shows published announcement detail', function () {
    $announcement = Announcement::factory()->published()->create([
        'title' => 'Published procurement notice',
    ]);

    $response = get(route('procurement.show', $announcement));

    $response->assertOk();
    $response->assertSee('Published procurement notice');
});

test('returns 404 for draft announcement', function () {
    $announcement = Announcement::factory()->draft()->create();

    $response = get(route('procurement.show', $announcement));

    $response->assertNotFound();
});

test('returns 404 for hidden announcement', function () {
    $announcement = Announcement::factory()->hidden()->create();

    $response = get(route('procurement.show', $announcement));

    $response->assertNotFound();
});

test('creates listing history for authenticated verified user', function () {
    $announcement = Announcement::factory()->published()->create();
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
    $announcement = Announcement::factory()->published()->create();

    $response = get(route('procurement.show', $announcement));

    $response->assertOk();
    assertDatabaseMissing('listing_history', [
        'announcement_id' => $announcement->id,
    ]);
});

test('serves pdf for published announcement', function () {
    Storage::fake('local');

    $announcement = Announcement::factory()->published()->create();
    $attachment = AnnouncementAttachment::factory()->create([
        'announcement_id' => $announcement->id,
        'filename' => 'published.pdf',
        'stored_filename' => 'attachments/published.pdf',
    ]);
    Storage::disk('local')->put($attachment->stored_filename, 'pdf-content');

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

    $announcement = Announcement::factory()->published()->create();
    $attachment = AnnouncementAttachment::factory()->create([
        'announcement_id' => $announcement->id,
        'filename' => 'downloadable.pdf',
        'stored_filename' => 'attachments/downloadable.pdf',
    ]);
    Storage::disk('local')->put($attachment->stored_filename, 'pdf-content');

    $response = get(route('procurement.pdf.download', [
        'announcement' => $announcement,
        'attachment' => $attachment,
    ]));

    $response->assertOk();
    $response->assertHeader('content-type', 'application/pdf');
    $response->assertHeader('content-disposition', 'attachment; filename=downloadable.pdf');
});

test('returns 404 pdf for draft announcement', function () {
    Storage::fake('local');

    $announcement = Announcement::factory()->draft()->create();
    $attachment = AnnouncementAttachment::factory()->create([
        'announcement_id' => $announcement->id,
        'stored_filename' => 'attachments/draft.pdf',
    ]);
    Storage::disk('local')->put($attachment->stored_filename, 'pdf-content');

    $response = get(route('procurement.pdf', [
        'announcement' => $announcement,
        'attachment' => $attachment,
    ]));

    $response->assertNotFound();
});
