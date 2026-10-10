<?php

use App\Models\Announcement;
use App\Models\User;
use Database\Seeders\DemoAnnouncementSeeder;
use Illuminate\Support\Facades\Date;
use Inertia\Testing\AssertableInertia as Assert;

use function Pest\Laravel\actingAs;
use function Pest\Laravel\get;
use function Pest\Laravel\seed;

beforeEach(function () {
    seed(DemoAnnouncementSeeder::class);
});

test('guest overview counts only public agencies and deduplicates known project budgets', function () {
    Announcement::factory()->published()->create([
        'organization' => 'มหาวิทยาลัยขอนแก่น',
        'project_key' => 'kku:shared-project',
        'budget' => 1000000,
    ]);
    Announcement::factory()->published()->create([
        'organization' => 'มหาวิทยาลัยขอนแก่น',
        'project_key' => 'kku:shared-project',
        'budget' => 900000,
    ]);
    Announcement::factory()->published()->create([
        'organization' => 'โรงพยาบาลธัญญารักษ์ขอนแก่น',
        'budget' => null,
        'display_price' => null,
    ]);
    Announcement::factory()->published()->create([
        'organization' => 'องค์การบริหารส่วนจังหวัด',
        'budget' => 10000000,
    ]);
    Announcement::factory()->draft()->create([
        'organization' => 'เทศบาลนครขอนแก่น',
        'budget' => 20000000,
    ]);
    Announcement::factory()->hidden()->create([
        'organization' => 'เทศบาลนครขอนแก่น',
        'budget' => 30000000,
    ]);
    Announcement::query()->findOrFail(7)->update([
        'publication_status' => 'published',
        'published_at' => now(),
    ]);

    get(route('procurement.overview'))->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('procurement/overview')
            ->where('summary.announcements', 7)
            ->where('summary.agencies', 3)
            ->where('summary.projects', 6)
            ->where('summary.known_budget', 10740000)
            ->where('summary.unknown_budget_projects', 1)
            ->has('agencies', 3)
            ->has('agencyOptions', 3)
            ->where('agencies.0.name', 'เทศบาลนครขอนแก่น')
            ->where('agencies.0.announcements', 2)
            ->where('agencies.1.projects', 2)
            ->where('agencies.1.known_budget', 1890000)
            ->where('agencies.2.unknown_budget_projects', 1)
            ->where('filters.period', 'all')
            ->where('filters.agency', ''));
});

test('overview date and agency filters handle an empty result without inventing amounts', function () {
    Date::setTestNow('2027-01-01 00:00:00 UTC');

    try {
        get(route('procurement.overview', [
            'period' => '30d',
            'agency' => 'โรงพยาบาลธัญญารักษ์ขอนแก่น',
        ]))->assertOk()->assertInertia(fn (Assert $page) => $page
            ->where('summary.announcements', 0)
            ->where('summary.agencies', 0)
            ->where('summary.projects', 0)
            ->where('summary.known_budget', 0)
            ->where('summary.unknown_budget_projects', 0)
            ->has('agencies', 1)
            ->has('agencyOptions', 3)
            ->where('agencies.0.name', 'โรงพยาบาลธัญญารักษ์ขอนแก่น')
            ->where('agencies.0.known_budget', 0)
            ->where('updatedAt', null));
    } finally {
        Date::setTestNow();
    }
});

test('overview filters recent published records for one agency', function () {
    Date::setTestNow('2026-10-10 12:00:00 UTC');

    try {
        Announcement::factory()->published()->create([
            'organization' => 'มหาวิทยาลัยขอนแก่น',
            'budget' => 500000,
        ]);
        Announcement::factory()->published()->create([
            'organization' => 'โรงพยาบาลธัญญารักษ์ขอนแก่น',
            'budget' => 800000,
        ]);

        get(route('procurement.overview', [
            'period' => '30d',
            'agency' => 'มหาวิทยาลัยขอนแก่น',
        ]))->assertOk()->assertInertia(fn (Assert $page) => $page
            ->where('summary.announcements', 1)
            ->where('summary.agencies', 1)
            ->where('summary.projects', 1)
            ->where('summary.known_budget', 500000)
            ->has('agencies', 1)
            ->has('agencyOptions', 3)
            ->where('agencies.0.name', 'มหาวิทยาลัยขอนแก่น')
            ->where('filters.period', '30d')
            ->where('filters.agency', 'มหาวิทยาลัยขอนแก่น'));
    } finally {
        Date::setTestNow();
    }
});

test('overview accepts a date filter when the agency choice is all', function () {
    Date::setTestNow('2027-01-01 00:00:00 UTC');

    try {
        get(route('procurement.overview', [
            'period' => '30d',
            'agency' => '',
        ]))->assertOk()->assertInertia(fn (Assert $page) => $page
            ->where('summary.announcements', 0)
            ->where('summary.agencies', 0)
            ->where('summary.known_budget', 0)
            ->has('agencyOptions', 3)
            ->where('filters.period', '30d')
            ->where('filters.agency', ''));
    } finally {
        Date::setTestNow();
    }
});

test('overview does not count reference or winning prices as confirmed budget', function () {
    Announcement::factory()->published()->create([
        'organization' => 'มหาวิทยาลัยขอนแก่น',
        'budget' => null,
        'display_price' => 750000,
        'display_price_source' => 'reference_price',
    ]);
    Announcement::factory()->published()->create([
        'organization' => 'โรงพยาบาลธัญญารักษ์ขอนแก่น',
        'budget' => null,
        'display_price' => 500000,
        'display_price_source' => 'winning_price',
    ]);

    get(route('procurement.overview'))->assertOk()->assertInertia(fn (Assert $page) => $page
        ->where('summary.announcements', 5)
        ->where('summary.projects', 5)
        ->where('summary.known_budget', 6990000)
        ->where('summary.unknown_budget_projects', 2));
});

test('authenticated account dashboard still redirects to the member surface', function () {
    $user = User::factory()->create([
        'email_verified_at' => now(),
    ]);

    actingAs($user);
    get(route('dashboard'))->assertRedirect(route('user.dashboard'));
});
