<?php

use App\Models\Announcement;
use App\Models\User;
use App\Support\Procurement\FilterState;
use App\Support\Procurement\Taxonomy;
use Database\Seeders\DemoAnnouncementSeeder;
use Inertia\Testing\AssertableInertia as Assert;

use function Pest\Laravel\actingAs;
use function Pest\Laravel\assertDatabaseCount;
use function Pest\Laravel\assertDatabaseHas;
use function Pest\Laravel\get;
use function Pest\Laravel\seed;

beforeEach(function () {
    seed(DemoAnnouncementSeeder::class);
});

test('guest search returns published announcements', function () {
    $response = get(route('procurement.search'));

    $response->assertOk();
    $response->assertInertia(fn (Assert $page) => $page
        ->component('procurement/search')
        ->where('announcements.per_page', 15)
        ->where('announcements.total', 3)
        ->where('pagination.total', 3)
        ->has('announcements.data', 3)
        ->where('announcements.data.0.id', 1)
        ->where('announcements.data.1.id', 2)
        ->where('announcements.data.2.id', 3)
    );
});

test('keyword filter returns only matching announcements', function () {
    $response = get(route('procurement.search', ['query' => 'clinic renovation']));

    $response->assertOk();
    $response->assertInertia(fn (Assert $page) => $page
        ->component('procurement/search')
        ->where('announcements.total', 1)
        ->where('announcements.data.0.id', 3)
        ->where('announcements.data.0.title', 'Nam Phong Clinic Renovation')
    );
});

test('canonical seeded organization method and category filters return the matching published announcement', function () {
    $cases = [
        [
            'organization' => Taxonomy::organizations()[1],
            'method' => 'e-bidding',
            'category' => 'services',
            'id' => 1,
            'title' => 'Khon Kaen Smart Traffic Upgrade',
        ],
        [
            'organization' => Taxonomy::organizations()[0],
            'method' => 'selective',
            'category' => 'goods',
            'id' => 2,
            'title' => 'Ban Phai School Wi-Fi Expansion',
        ],
        [
            'organization' => Taxonomy::organizations()[4],
            'method' => 'specific',
            'category' => 'construction',
            'id' => 3,
            'title' => 'Nam Phong Clinic Renovation',
        ],
    ];

    foreach ($cases as $case) {
        $response = get(route('procurement.search', [
            'organization' => $case['organization'],
            'method' => $case['method'],
            'category' => $case['category'],
        ]));

        $response->assertOk();
        $response->assertInertia(fn (Assert $page) => $page
            ->component('procurement/search')
            ->where('filters.organizations', [$case['organization']])
            ->where('filters.methods', [$case['method']])
            ->where('filters.categories', [$case['category']])
            ->where('announcements.total', 1)
            ->where('announcements.data.0.id', $case['id'])
            ->where('announcements.data.0.title', $case['title'])
        );
    }
});

test('canonical hidden and draft filter combinations return zero public results', function () {
    $response = get(route('procurement.search', [
        'organization' => Taxonomy::organizations()[3],
        'method' => 'selective',
        'category' => 'consulting',
    ]));

    $response->assertOk();
    $response->assertInertia(fn (Assert $page) => $page
        ->component('procurement/search')
        ->where('filters.organizations', [Taxonomy::organizations()[3]])
        ->where('filters.methods', ['selective'])
        ->where('filters.categories', ['consulting'])
        ->where('announcements.total', 0)
        ->has('announcements.data', 0)
        ->where('pagination.total', 0)
    );
});

test('guest search paginates after seeded demo announcements overflow the first page', function () {
    Announcement::factory()->published()->count(13)->create();

    $response = get(route('procurement.search', ['page' => 2]));

    $response->assertOk();
    $response->assertInertia(fn (Assert $page) => $page
        ->component('procurement/search')
        ->where('announcements.per_page', 15)
        ->where('announcements.total', 16)
        ->where('announcements.current_page', 2)
        ->where('announcements.last_page', 2)
        ->has('announcements.data', 1)
        ->where('announcements.data.0.id', 3)
        ->where('announcements.data.0.title', 'Nam Phong Clinic Renovation')
        ->where('pagination.current_page', 2)
        ->where('pagination.last_page', 2)
        ->where('pagination.total', 16)
    );
});

test('guest search does not create search history', function () {
    Announcement::factory()->published()->create([
        'category' => 'construction',
    ]);

    get(route('procurement.search', ['category' => 'construction']))->assertOk();

    assertDatabaseCount('search_history', 0);
});

test('authenticated verified user search with criteria creates history', function () {
    $user = User::factory()->createOne([
        'email_verified_at' => now(),
    ]);
    if (! $user instanceof User) {
        throw new RuntimeException('Expected User model instance.');
    }

    actingAs($user);

    get(route('procurement.search', [
        'category' => 'construction',
        'method' => 'specific',
        'organization' => 'สำนักงานสาธารณสุขจังหวัด',
        'budget_min' => 1000,
        'budget_max' => 2000000,
    ]))->assertOk();

    assertDatabaseCount('search_history', 1);
    assertDatabaseHas('search_history', [
        'user_id' => $user->id,
    ]);
});

test('authenticated user search with empty criteria does not create history', function () {
    $user = User::factory()->createOne([
        'email_verified_at' => now(),
    ]);
    if (! $user instanceof User) {
        throw new RuntimeException('Expected User model instance.');
    }

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

test('search page exposes canonical procurement taxonomy options', function () {
    $response = get(route('procurement.search'));

    $response->assertOk();
    $response->assertInertia(fn (Assert $page) => $page
        ->component('procurement/search')
        ->where('taxonomy.organizations', Taxonomy::organizationOptions())
        ->where('taxonomy.methods', Taxonomy::methodOptions())
        ->where('taxonomy.categories', Taxonomy::categoryOptions())
    );
});
