<?php

use App\Models\NotificationPreference;
use App\Models\SavedSearch;
use App\Models\User;
use App\Support\Procurement\FilterState;

use function Pest\Laravel\actingAs;
use function Pest\Laravel\assertDatabaseHas;
use function Pest\Laravel\assertDatabaseMissing;
use function Pest\Laravel\delete;
use function Pest\Laravel\get;
use function Pest\Laravel\getJson;
use function Pest\Laravel\post;
use function Pest\Laravel\postJson;
use function Pest\Laravel\put;
use function Pest\Laravel\putJson;

function createUser(): User
{
    $user = User::factory()->createOne();

    if (! $user instanceof User) {
        throw new RuntimeException('Expected User model instance.');
    }

    return $user;
}

test('authenticated verified user can create a saved search from procurement criteria', function () {
    $user = createUser();
    $criteria = [
        ...FilterState::defaults(),
        'query' => 'Playwright Auth Procurement Notice',
        'budgetRange' => [100000, 500000],
        'organizations' => ['เทศบาลนครขอนแก่น'],
        'methods' => ['e-bidding'],
        'categories' => ['construction'],
        'sortBy' => 'deadline',
    ];

    actingAs($user);

    $response = postJson(route('user.saved-searches.store'), [
        'name' => 'Demo Saved Search',
        'criteria' => $criteria,
        'alert_enabled' => true,
    ]);

    $response->assertCreated()
        ->assertJsonPath('name', 'Demo Saved Search')
        ->assertJsonPath('criteria.query', 'Playwright Auth Procurement Notice')
        ->assertJsonPath('criteria.organizations.0', 'เทศบาลนครขอนแก่น')
        ->assertJsonPath('criteria.methods.0', 'e-bidding')
        ->assertJsonPath('criteria.categories.0', 'construction')
        ->assertJsonPath('criteria.budgetRange.0', 100000)
        ->assertJsonPath('criteria.budgetRange.1', 500000)
        ->assertJsonPath('criteria.sortBy', 'deadline')
        ->assertJsonPath('alert_enabled', true);

    assertDatabaseHas('saved_searches', [
        'user_id' => $user->id,
        'name' => 'Demo Saved Search',
        'alert_enabled' => true,
    ]);

    $savedSearch = SavedSearch::query()->where('user_id', $user->id)->firstOrFail();

    expect($savedSearch->criteria)->toBe($criteria);
});

test('authenticated verified user can list their saved searches', function () {
    $user = createUser();
    $otherUser = createUser();

    SavedSearch::factory()->for($user)->create(['name' => 'My Search']);
    SavedSearch::factory()->for($otherUser)->create(['name' => 'Other Search']);

    actingAs($user);

    $response = getJson(route('user.saved-searches.index'));

    $response->assertOk()
        ->assertJsonCount(1, 'data')
        ->assertJsonPath('data.0.name', 'My Search');
});

test('authenticated verified user can update a saved search', function () {
    $user = createUser();
    $savedSearch = SavedSearch::factory()->for($user)->create([
        'name' => 'Initial',
        'alert_enabled' => false,
    ]);

    $criteria = FilterState::defaults();
    $criteria['query'] = 'hospital';
    $criteria['sortBy'] = 'deadline';

    actingAs($user);

    $response = putJson(route('user.saved-searches.update', $savedSearch), [
        'name' => 'Updated Search',
        'criteria' => $criteria,
        'alert_enabled' => true,
    ]);

    $response->assertOk()
        ->assertJsonPath('name', 'Updated Search')
        ->assertJsonPath('criteria.query', 'hospital')
        ->assertJsonPath('criteria.sortBy', 'deadline')
        ->assertJsonPath('alert_enabled', true);

    assertDatabaseHas('saved_searches', [
        'id' => $savedSearch->id,
        'name' => 'Updated Search',
        'alert_enabled' => true,
    ]);
});

test('authenticated verified user can delete a saved search', function () {
    $user = createUser();
    $savedSearch = SavedSearch::factory()->for($user)->create();

    actingAs($user);

    $response = delete(route('user.saved-searches.destroy', $savedSearch));

    $response->assertNoContent();
    assertDatabaseMissing('saved_searches', ['id' => $savedSearch->id]);
});

test('user cannot delete another users saved search', function () {
    $user = createUser();
    $owner = createUser();
    $savedSearch = SavedSearch::factory()->for($owner)->create();

    actingAs($user);

    $response = delete(route('user.saved-searches.destroy', $savedSearch));

    $response->assertForbidden();
    assertDatabaseHas('saved_searches', ['id' => $savedSearch->id]);
});

test('user cannot update or run another users saved search', function () {
    $user = createUser();
    $owner = createUser();
    $savedSearch = SavedSearch::factory()->for($owner)->create();

    actingAs($user);

    putJson(route('user.saved-searches.update', $savedSearch), [
        'name' => 'Stolen Search',
        'criteria' => FilterState::defaults(),
        'alert_enabled' => true,
    ])->assertForbidden();

    postJson(route('user.saved-searches.run', $savedSearch))
        ->assertForbidden();

    assertDatabaseMissing('saved_searches', [
        'id' => $savedSearch->id,
        'name' => 'Stolen Search',
    ]);
});

test('guest cannot create list update delete saved searches', function () {
    $savedSearch = SavedSearch::factory()->create();

    post(route('user.saved-searches.store'), [
        'name' => 'Guest Search',
        'criteria' => FilterState::defaults(),
    ])->assertRedirect(route('login'));

    get(route('user.saved-searches.index'))->assertRedirect(route('login'));

    put(route('user.saved-searches.update', $savedSearch), [
        'name' => 'Guest Update',
        'criteria' => FilterState::defaults(),
    ])->assertRedirect(route('login'));

    delete(route('user.saved-searches.destroy', $savedSearch))->assertRedirect(route('login'));
});

test('user can retrieve their notification preferences and default is created when missing', function () {
    $user = createUser();

    actingAs($user);

    $response = getJson(route('user.notification-preferences.show'));

    $response->assertOk()
        ->assertJsonPath('user_id', $user->id)
        ->assertJsonPath('website_enabled', true)
        ->assertJsonPath('email_enabled', false);

    assertDatabaseHas('notification_preferences', [
        'user_id' => $user->id,
        'website_enabled' => true,
        'email_enabled' => false,
    ]);
});

test('user can update email and website channel preferences', function () {
    $user = createUser();
    NotificationPreference::factory()->for($user)->create([
        'website_enabled' => true,
        'email_enabled' => false,
    ]);

    actingAs($user);

    $response = putJson(route('user.notification-preferences.update'), [
        'website_enabled' => false,
        'email_enabled' => true,
    ]);

    $response->assertOk()
        ->assertJsonPath('website_enabled', false)
        ->assertJsonPath('email_enabled', true);

    assertDatabaseHas('notification_preferences', [
        'user_id' => $user->id,
        'website_enabled' => false,
        'email_enabled' => true,
    ]);
});
