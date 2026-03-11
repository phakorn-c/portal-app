<?php

use App\Models\Announcement;
use App\Models\User;
use App\Support\Procurement\FilterState;
use Inertia\Testing\AssertableInertia as Assert;

use function Pest\Laravel\actingAs;
use function Pest\Laravel\assertDatabaseCount;
use function Pest\Laravel\assertDatabaseHas;
use function Pest\Laravel\get;

test('guest search returns published announcements', function () {
    Announcement::factory()->published()->count(16)->create();
    Announcement::factory()->draft()->count(2)->create();

    $response = get(route('procurement.search'));

    $response->assertOk();
    $response->assertInertia(fn (Assert $page) => $page
        ->component('procurement/search')
        ->where('announcements.per_page', 15)
        ->where('announcements.total', 16)
        ->where('pagination.total', 16)
    );
});

test('keyword filter returns only matching announcements', function () {
    $match = Announcement::factory()->published()->create([
        'title' => 'Road maintenance package',
        'description' => 'Asphalt surface repair works',
    ]);

    Announcement::factory()->published()->create([
        'title' => 'Medical equipment package',
        'description' => 'Hospital procurement',
    ]);

    Announcement::factory()->draft()->create([
        'title' => 'Road maintenance draft',
    ]);

    $response = get(route('procurement.search', ['query' => 'maintenance']));

    $response->assertOk();
    $response->assertInertia(fn (Assert $page) => $page
        ->component('procurement/search')
        ->where('announcements.total', 1)
        ->where('announcements.data.0.id', $match->id)
    );
});

test('guest search does not create search history', function () {
    Announcement::factory()->published()->create([
        'category' => 'Construction',
    ]);

    get(route('procurement.search', ['category' => 'Construction']))->assertOk();

    assertDatabaseCount('search_history', 0);
});

test('authenticated verified user search with criteria creates history', function () {
    $user = User::factory()->create([
        'email_verified_at' => now(),
    ]);

    Announcement::factory()->published()->create([
        'category' => 'Construction',
    ]);

    actingAs($user);

    get(route('procurement.search', [
        'category' => 'Construction',
        'budget_min' => 1000,
        'budget_max' => 2000000,
    ]))->assertOk();

    assertDatabaseCount('search_history', 1);
    assertDatabaseHas('search_history', [
        'user_id' => $user->id,
    ]);
});

test('authenticated user search with empty criteria does not create history', function () {
    $user = User::factory()->create([
        'email_verified_at' => now(),
    ]);

    Announcement::factory()->published()->create();

    actingAs($user);

    get(route('procurement.search', [
        'query' => '',
        'budget_min' => FilterState::defaults()['budgetRange'][0],
        'budget_max' => FilterState::defaults()['budgetRange'][1],
        'sort' => 'newest',
    ]))->assertOk();

    assertDatabaseCount('search_history', 0);
});
