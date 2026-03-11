<?php

use App\Jobs\EvaluateSavedSearchAlerts;
use App\Models\Announcement;
use App\Models\NotificationPreference;
use App\Models\SavedSearch;
use App\Models\User;
use App\Notifications\NewMatchingAnnouncement;
use App\Support\Procurement\FilterState;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Queue;

use function Pest\Laravel\actingAs;
use function Pest\Laravel\get;
use function Pest\Laravel\patchJson;

test('notifications page requires authentication', function () {
    get(route('user.notifications'))->assertRedirect(route('login'));
});

test('authenticated user can view notifications page', function () {
    $user = User::factory()->create();

    actingAs($user);

    get(route('user.notifications'))->assertOk();
});

test('dispatches evaluate alerts job when announcement published', function () {
    Queue::fake();

    $admin = User::factory()->admin()->create();
    $announcement = Announcement::factory()->draft()->create();

    actingAs($admin);

    patchJson(route('admin.announcements.publish', $announcement))->assertOk();

    Queue::assertPushed(EvaluateSavedSearchAlerts::class, function ($job) use ($announcement) {
        return $job->announcement->is($announcement);
    });
});

test('does not fire duplicate notifications', function () {
    Notification::fake();

    $user = User::factory()->create();
    NotificationPreference::factory()->for($user)->create([
        'website_enabled' => true,
        'email_enabled' => false,
    ]);

    $announcement = Announcement::factory()->published()->create([
        'organization' => 'Khon Kaen Municipality',
        'category' => 'Construction',
        'method' => 'e-bidding',
        'published_at' => now(),
    ]);

    $criteria = FilterState::defaults();
    $criteria['organizations'] = ['Khon Kaen Municipality'];
    $criteria['categories'] = ['Construction'];
    $criteria['methods'] = ['e-bidding'];

    SavedSearch::factory()->for($user)->create([
        'criteria' => $criteria,
        'alert_enabled' => true,
        'last_notified_at' => now(),
    ]);

    EvaluateSavedSearchAlerts::dispatchSync($announcement);

    Notification::assertNothingSent();
});

test('matching saved search creates notification', function () {
    Notification::fake();

    $user = User::factory()->create();
    NotificationPreference::factory()->for($user)->create([
        'website_enabled' => true,
        'email_enabled' => false,
    ]);

    $announcement = Announcement::factory()->published()->create([
        'organization' => 'Khon Kaen Municipality',
        'category' => 'Construction',
        'method' => 'e-bidding',
        'published_at' => now(),
    ]);

    $criteria = FilterState::defaults();
    $criteria['organizations'] = ['Khon Kaen Municipality'];
    $criteria['categories'] = ['Construction'];
    $criteria['methods'] = ['e-bidding'];

    $savedSearch = SavedSearch::factory()->for($user)->create([
        'name' => 'Construction municipal projects',
        'criteria' => $criteria,
        'alert_enabled' => true,
        'last_notified_at' => null,
    ]);

    EvaluateSavedSearchAlerts::dispatchSync($announcement);

    Notification::assertSentTo($user, NewMatchingAnnouncement::class);
    expect($savedSearch->fresh()->last_notified_at)->not()->toBeNull();
});
