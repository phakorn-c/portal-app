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

test('home renders the complete public procurement search', function () {
    $response = get(route('home'));

    $response->assertOk();
    $response->assertInertia(fn (Assert $page) => $page
        ->component('procurement/search')
        ->where('announcements.total', 3)
        ->has('announcements.data', 3)
        ->where('pagination.total', 3)
        ->where('filters.budgetRange', [0, null])
        ->where('filters.organizations', [])
        ->where('filters.methods', [])
        ->where('filters.categories', [])
        ->where('taxonomy.organizations', Taxonomy::organizationOptions())
        ->where('taxonomy.methods', Taxonomy::methodOptions())
        ->where('taxonomy.categories', Taxonomy::categoryOptions())
    );
});

test('default search includes published announcements above ten million but explicit maximum limits results', function () {
    Announcement::factory()->published()->create(['budget' => 12000000]);

    foreach (['home', 'procurement.search'] as $route) {
        get(route($route))->assertInertia(fn (Assert $page) => $page
            ->where('announcements.total', 4)
            ->where('filters.budgetRange', [0, null])
            ->has('announcements.data', 4)
        );

        get(route($route, ['budget_max' => 10000000]))->assertInertia(fn (Assert $page) => $page
            ->where('announcements.total', 3)
            ->where('filters.budgetRange', [0, 10000000])
            ->missing('announcements.data.3')
        );

        get(route($route, ['budget_min' => 11000000, 'budget_max' => 13000000]))
            ->assertInertia(fn (Assert $page) => $page
                ->where('announcements.total', 1)
                ->where('filters.budgetRange', [11000000, 13000000])
            );
    }
});

test('OCR notice location and tag filters include unknown budgets only without price bounds', function () {
    $award = Announcement::factory()->published()->create([
        'title' => 'ประกาศผู้ชนะงานก่อสร้าง',
        'notice_type' => 'award',
        'province' => 'ขอนแก่น',
        'tags' => ['ก่อสร้าง', 'โรงพยาบาล'],
        'budget' => null,
        'deadline' => null,
        'status' => null,
        'organization' => 'หน่วยงานที่นำเข้าจาก OCR',
        'method' => 'ประกวดราคา',
    ]);
    Announcement::factory()->published()->create([
        'notice_type' => 'invitation',
        'province' => 'กรุงเทพมหานคร',
        'tags' => ['ก่อสร้าง'],
    ]);

    $filters = ['notice_type' => 'award', 'province' => 'ขอนแก่น', 'tag' => 'ก่อสร้าง'];

    get(route('procurement.search', $filters))->assertInertia(fn (Assert $page) => $page
        ->where('announcements.total', 1)
        ->where('announcements.data.0.id', $award->id)
        ->where('announcements.data.0.budget', null)
        ->where('filters.noticeTypes', ['award'])
        ->where('filters.provinces', ['ขอนแก่น'])
        ->where('filters.tags', ['ก่อสร้าง'])
        ->where('taxonomy.provinces.0.value', 'ขอนแก่น')
        ->where('taxonomy.tags.0.value', 'ก่อสร้าง')
    );

    get(route('procurement.search', [...$filters, 'budget_min' => 1]))
        ->assertInertia(fn (Assert $page) => $page->where('announcements.total', 0));

    get(route('procurement.search', ['sort' => 'budget_asc']))
        ->assertInertia(fn (Assert $page) => $page
            ->where('announcements.data.4.id', $award->id)
            ->where('announcements.data.4.budget', null));
});

test('purchase and hire filter uses reviewed procurement category before legacy category', function () {
    $purchase = Announcement::factory()->published()->create([
        'procurement_category' => 'supply',
        'category' => 'goods',
    ]);
    $hire = Announcement::factory()->published()->create([
        'procurement_category' => 'works',
        'category' => 'construction',
    ]);
    $misclassified = Announcement::factory()->published()->create([
        'procurement_category' => 'supply',
        'category' => 'services',
    ]);
    Announcement::factory()->published()->create([
        'procurement_category' => 'other',
        'category' => 'goods',
    ]);

    get(route('procurement.search', ['purchase_type' => 'hire']))
        ->assertInertia(fn (Assert $page) => $page
            ->where('filters.purchaseTypes', ['hire'])
            ->where('announcements.total', 3)
            ->where('announcements.data', fn ($data) => collect($data)->pluck('id')->sort()->values()->all() === [1, 3, $hire->id]));

    get(route('procurement.search', ['purchase_type' => 'purchase']))
        ->assertInertia(fn (Assert $page) => $page
            ->where('announcements.total', 3)
            ->where('announcements.data', fn ($data) => collect($data)->pluck('id')->sort()->values()->all() === [2, $purchase->id, $misclassified->id]));

    get(route('procurement.search', ['purchase_type' => ['purchase', 'hire']]))
        ->assertInertia(fn (Assert $page) => $page
            ->where('announcements.total', 6));
});

test('open proposals require an invitation with a deadline after today and no closed result', function () {
    \Illuminate\Support\Facades\Date::setTestNow('2026-10-09 13:00:00');

    $open = Announcement::factory()->published()->create([
        'notice_type' => 'invitation',
        'procurement_category' => 'supply',
        'deadline' => '2026-10-15',
        'submission_deadline' => '2026-10-15',
        'status' => 'open',
        'process_status' => 'unknown',
    ]);
    foreach ([
        ['notice_type' => 'award', 'submission_deadline' => '2026-10-15'],
        ['notice_type' => 'invitation', 'submission_deadline' => '2026-10-09'],
        ['notice_type' => 'invitation', 'submission_deadline' => null, 'deadline' => null],
        ['notice_type' => 'invitation', 'submission_deadline' => '2026-10-15', 'status' => 'closed'],
        ['notice_type' => 'invitation', 'submission_deadline' => '2026-10-15', 'process_status' => 'award_announced'],
    ] as $attributes) {
        Announcement::factory()->published()->create([
            'procurement_category' => 'supply',
            'deadline' => '2026-10-15',
            'status' => 'open',
            ...$attributes,
        ]);
    }

    try {
        get(route('procurement.search', ['purchase_type' => 'purchase', 'open_proposals' => '1']))
            ->assertInertia(fn (Assert $page) => $page
                ->where('filters.openProposals', true)
                ->where('announcements.total', 1)
                ->where('announcements.data.0.id', $open->id));
    } finally {
        \Illuminate\Support\Facades\Date::setTestNow();
    }
});

test('open proposals exclude a deadline on the current Bangkok date', function () {
    \Illuminate\Support\Facades\Date::setTestNow('2026-10-09 18:00:00 UTC');

    try {
        Announcement::factory()->published()->create([
            'notice_type' => 'invitation',
            'submission_deadline' => '2026-10-10',
            'status' => 'open',
        ]);
        $tomorrow = Announcement::factory()->published()->create([
            'notice_type' => 'invitation',
            'submission_deadline' => '2026-10-11',
            'status' => 'open',
        ]);

        get(route('procurement.search', ['open_proposals' => '1']))
            ->assertInertia(fn (Assert $page) => $page
                ->where('announcements.total', 1)
                ->where('announcements.data.0.id', $tomorrow->id));
    } finally {
        \Illuminate\Support\Facades\Date::setTestNow();
    }
});

test('price range and ordering use sourced display price rather than budget', function () {
    $low = Announcement::factory()->published()->create([
        'budget' => 900000,
        'display_price' => 250000,
        'display_price_source' => 'reference_price',
    ]);
    $high = Announcement::factory()->published()->create([
        'budget' => 100000,
        'display_price' => 400000,
        'display_price_source' => 'winning_price',
    ]);
    Announcement::factory()->published()->create([
        'budget' => null,
        'display_price' => 300000,
        'display_price_source' => 'none',
    ]);

    get(route('procurement.search', ['budget_min' => 200000, 'budget_max' => 450000, 'sort' => 'budget_asc']))
        ->assertInertia(fn (Assert $page) => $page
            ->where('announcements.total', 2)
            ->where('announcements.data.0.id', $low->id)
            ->where('announcements.data.1.id', $high->id));
    get(route('procurement.search', ['budget_min' => 200000, 'budget_max' => 450000, 'sort' => 'budget_desc']))
        ->assertInertia(fn (Assert $page) => $page
            ->where('announcements.data.0.id', $high->id)
            ->where('announcements.data.1.id', $low->id));
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
