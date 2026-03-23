<?php

use App\Models\Announcement;
use App\Models\AnnouncementAttachment;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

use function Pest\Laravel\actingAs;
use function Pest\Laravel\assertDatabaseCount;
use function Pest\Laravel\assertDatabaseHas;
use function Pest\Laravel\assertDatabaseMissing;
use function Pest\Laravel\deleteJson;
use function Pest\Laravel\patchJson;
use function Pest\Laravel\postJson;
use function Pest\Laravel\putJson;

test('admin can create announcement without attachment', function () {
    $user = User::factory()->admin()->create();
    actingAs($user);

    $response = postJson(route('admin.announcements.store'), announcementPayload());

    $response->assertRedirect(route('admin.announcements.index'));
    assertDatabaseHas('announcements', [
        'title' => 'Road maintenance tender 2026',
        'organization' => 'เทศบาลนครขอนแก่น',
        'category' => 'construction',
        'method' => 'e-bidding',
        'publication_status' => 'draft',
        'status' => 'open',
    ]);
    assertDatabaseCount('announcement_attachments', 0);
});

test('admin can create announcement with pdf attachment', function () {
    Storage::fake('local');

    $user = User::factory()->admin()->create();
    actingAs($user);

    $response = postJson(route('admin.announcements.store'), [
        ...announcementPayload(),
        'attachment' => UploadedFile::fake()->create('announcement.pdf', 150, 'application/pdf'),
    ]);

    $response->assertRedirect(route('admin.announcements.index'));
    $attachment = AnnouncementAttachment::query()->first();

    expect($attachment)->not()->toBeNull();
    expect(Storage::disk('local')->exists($attachment->stored_filename))->toBeTrue();
    assertDatabaseHas('announcement_attachments', [
        'announcement_id' => Announcement::query()->first()->id,
        'mime_type' => 'application/pdf',
    ]);
});

test('non-pdf upload is rejected', function () {
    Storage::fake('local');

    $user = User::factory()->admin()->create();
    actingAs($user);

    $response = postJson(route('admin.announcements.store'), [
        ...announcementPayload(),
        'attachment' => UploadedFile::fake()->create('notes.txt', 10, 'text/plain'),
    ]);

    $response->assertUnprocessable();
    $response->assertJsonValidationErrors(['attachment']);
    assertDatabaseCount('announcements', 0);
    assertDatabaseCount('announcement_attachments', 0);
});

test('admin can publish an announcement', function () {
    $user = User::factory()->admin()->create();
    actingAs($user);

    $announcement = Announcement::factory()->draft()->create();

    $response = patchJson(route('admin.announcements.publish', $announcement));

    $response->assertRedirect(route('admin.announcements.index'));
    $announcement->refresh();

    expect($announcement->publication_status)->toBe('published');
    expect($announcement->published_at)->not()->toBeNull();
});

test('admin can hide an announcement', function () {
    $user = User::factory()->admin()->create();
    actingAs($user);

    $announcement = Announcement::factory()->published()->create();

    $response = patchJson(route('admin.announcements.hide', $announcement));

    $response->assertRedirect(route('admin.announcements.index'));
    $announcement->refresh();

    expect($announcement->publication_status)->toBe('hidden');
});

test('admin can delete announcement and stored files are cleaned up', function () {
    Storage::fake('local');

    $user = User::factory()->admin()->create();
    actingAs($user);

    $announcement = Announcement::factory()->create();
    $attachment = AnnouncementAttachment::factory()->create([
        'announcement_id' => $announcement->id,
        'stored_filename' => 'attachments/to-delete.pdf',
    ]);
    Storage::disk('local')->put($attachment->stored_filename, 'pdf-content');

    $response = deleteJson(route('admin.announcements.destroy', $announcement));

    $response->assertRedirect(route('admin.announcements.index'));
    assertDatabaseMissing('announcements', ['id' => $announcement->id]);
    assertDatabaseMissing('announcement_attachments', ['id' => $attachment->id]);
    expect(Storage::disk('local')->exists($attachment->stored_filename))->toBeFalse();
});

test('admin can update an announcement', function () {
    $user = User::factory()->admin()->create();
    actingAs($user);

    $announcement = Announcement::factory()->create([
        'title' => 'Old Title',
        'budget' => 1000,
    ]);

    $updatedData = announcementPayload([
        'title' => 'New Updated Title',
        'budget' => 5000,
    ]);

    $response = putJson(route('admin.announcements.update', $announcement), $updatedData);

    $response->assertRedirect(route('admin.announcements.index'));
    assertDatabaseHas('announcements', [
        'id' => $announcement->id,
        'title' => 'New Updated Title',
        'budget' => 5000,
    ]);
});

test('admin can update an announcement with new attachment', function () {
    Storage::fake('local');

    $user = User::factory()->admin()->create();
    actingAs($user);

    $announcement = Announcement::factory()->create();
    $oldAttachment = AnnouncementAttachment::factory()->create([
        'announcement_id' => $announcement->id,
        'stored_filename' => 'attachments/old.pdf',
    ]);
    Storage::disk('local')->put($oldAttachment->stored_filename, 'old-content');

    $newFile = UploadedFile::fake()->create('new-announcement.pdf', 200, 'application/pdf');

    $response = putJson(route('admin.announcements.update', $announcement), [
        ...announcementPayload(),
        'attachment' => $newFile,
    ]);

    $response->assertRedirect(route('admin.announcements.index'));

    // Verify old attachment is gone
    assertDatabaseMissing('announcement_attachments', ['id' => $oldAttachment->id]);
    expect(Storage::disk('local')->exists($oldAttachment->stored_filename))->toBeFalse();

    // Verify new attachment exists
    $newAttachment = AnnouncementAttachment::query()->where('announcement_id', $announcement->id)->first();
    expect($newAttachment)->not()->toBeNull();
    expect(Storage::disk('local')->exists($newAttachment->stored_filename))->toBeTrue();
});

function announcementPayload(array $overrides = []): array
{
    return [
        'title' => 'Road maintenance tender 2026',
        'organization' => 'เทศบาลนครขอนแก่น',
        'category' => 'construction',
        'method' => 'e-bidding',
        'budget' => 2500000.50,
        'location' => 'Khon Kaen',
        'reference_price' => 2450000.00,
        'contact_name' => 'Procurement Office',
        'contact_phone' => '043-000-000',
        'description' => 'Road resurfacing and lane marking',
        'status' => 'open',
        'publication_status' => 'draft',
        'deadline' => now()->addDays(30)->toDateString(),
        ...$overrides,
    ];
}
