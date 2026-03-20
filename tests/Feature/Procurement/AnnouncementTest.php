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

test('admin can create announcement without attachment', function () {
    $user = User::factory()->admin()->create();
    actingAs($user);

    $response = postJson(route('admin.announcements.store'), announcementPayload());

    $response->assertCreated();
    assertDatabaseHas('announcements', [
        'title' => 'Road maintenance tender 2026',
        'publication_status' => 'draft',
        'status' => 'open',
    ]);
    assertDatabaseCount('announcement_attachments', 0);
});

test('admin can create announcement with pdf attachment', function () {
    Storage::fake('public');

    $user = User::factory()->admin()->create();
    actingAs($user);

    $response = postJson(route('admin.announcements.store'), [
        ...announcementPayload(),
        'attachment' => UploadedFile::fake()->create('announcement.pdf', 150, 'application/pdf'),
    ]);

    $response->assertCreated();
    $attachment = AnnouncementAttachment::query()->first();

    expect($attachment)->not()->toBeNull();
    expect(Storage::disk('public')->exists($attachment->stored_filename))->toBeTrue();
    assertDatabaseHas('announcement_attachments', [
        'announcement_id' => Announcement::query()->first()->id,
        'mime_type' => 'application/pdf',
    ]);
});

test('non-pdf upload is rejected', function () {
    Storage::fake('public');

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

    $response->assertOk();
    $announcement->refresh();

    expect($announcement->publication_status)->toBe('published');
    expect($announcement->published_at)->not()->toBeNull();
});

test('admin can hide an announcement', function () {
    $user = User::factory()->admin()->create();
    actingAs($user);

    $announcement = Announcement::factory()->published()->create();

    $response = patchJson(route('admin.announcements.hide', $announcement));

    $response->assertOk();
    $announcement->refresh();

    expect($announcement->publication_status)->toBe('hidden');
});

test('admin can delete announcement and stored files are cleaned up', function () {
    Storage::fake('public');

    $user = User::factory()->admin()->create();
    actingAs($user);

    $announcement = Announcement::factory()->create();
    $attachment = AnnouncementAttachment::factory()->create([
        'announcement_id' => $announcement->id,
        'stored_filename' => 'attachments/to-delete.pdf',
    ]);
    Storage::disk('public')->put($attachment->stored_filename, 'pdf-content');

    $response = deleteJson(route('admin.announcements.destroy', $announcement));

    $response->assertNoContent();
    assertDatabaseMissing('announcements', ['id' => $announcement->id]);
    assertDatabaseMissing('announcement_attachments', ['id' => $attachment->id]);
    expect(Storage::disk('public')->exists($attachment->stored_filename))->toBeFalse();
});

function announcementPayload(array $overrides = []): array
{
    return [
        'title' => 'Road maintenance tender 2026',
        'organization' => 'Khon Kaen Municipality',
        'category' => 'Construction',
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
