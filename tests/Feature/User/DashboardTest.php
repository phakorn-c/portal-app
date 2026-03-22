<?php

namespace Tests\Feature\User;

use App\Models\Announcement;
use App\Models\ListingHistory;
use App\Models\SavedSearch;
use App\Models\SearchHistory;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DashboardTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_dashboard_shows_real_data(): void
    {
        /** @var User $user */
        $user = User::factory()->create();
        $this->actingAs($user);

        $announcement = Announcement::factory()->create(['title' => 'Test Announcement']);
        ListingHistory::create([
            'user_id' => $user->id,
            'announcement_id' => $announcement->id,
            'viewed_at' => now()->subMinutes(10),
        ]);

        SearchHistory::create([
            'user_id' => $user->id,
            'criteria' => ['query' => 'Test Search'],
            'result_count' => 10,
            'searched_at' => now()->subMinutes(5),
        ]);

        SavedSearch::create([
            'user_id' => $user->id,
            'name' => 'Test Saved Search',
            'criteria' => ['query' => 'Test Search'],
            'created_at' => now(),
        ]);

        $response = $this->get(route('user.dashboard'));

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->component('user/dashboard')
            ->where('savedSearchCount', 1)
            ->where('searchHistoryCount', 1)
            ->has('listingHistory', 1)
            ->has('activities', 3)
            ->where('activities.0.title', 'บันทึกการค้นหาใหม่')
            ->where('activities.1.title', 'ประวัติการค้นหา')
            ->where('activities.2.title', 'ดูรายละเอียดประกาศ')
        );
    }
}
