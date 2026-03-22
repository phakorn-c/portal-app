<?php

namespace App\Http\Controllers\User;

use App\Http\Controllers\Controller;
use App\Models\ListingHistory;
use App\Models\SavedSearch;
use App\Models\SearchHistory;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function index(Request $request): Response
    {
        $user = $request->user();

        $savedSearchCount = SavedSearch::where('user_id', $user->id)->count();
        $recentSavedSearches = SavedSearch::where('user_id', $user->id)
            ->latest()
            ->take(5)
            ->get();

        $listingHistory = ListingHistory::where('user_id', $user->id)
            ->with('announcement')
            ->latest('viewed_at')
            ->take(5)
            ->get();

        $searchHistoryCount = SearchHistory::where('user_id', $user->id)->count();
        $notificationCount = $user->unreadNotifications()->count();

        // Fetch activities for timeline
        $activities = collect();

        // 1. Listing History (Views)
        $listingHistory->each(function ($history) use ($activities) {
            $activities->push([
                'type' => 'view_announcement',
                'date' => $history->viewed_at,
                'title' => 'ดูรายละเอียดประกาศ',
                'description' => $history->announcement->title,
                'status' => 'completed',
            ]);
        });

        // 2. Search History
        SearchHistory::where('user_id', $user->id)
            ->latest('searched_at')
            ->take(5)
            ->get()
            ->each(function ($history) use ($activities) {
                $query = $history->criteria['query'] ?? $history->criteria['keyword'] ?? 'การค้นหาทั่วไป';
                $activities->push([
                    'type' => 'search',
                    'date' => $history->searched_at,
                    'title' => 'ประวัติการค้นหา',
                    'description' => '"'.$query.'"',
                    'status' => 'completed',
                ]);
            });

        // 3. Saved Searches
        $recentSavedSearches->each(function ($search) use ($activities) {
            $activities->push([
                'type' => 'save_search',
                'date' => $search->created_at,
                'title' => 'บันทึกการค้นหาใหม่',
                'description' => '"'.$search->name.'"',
                'status' => 'completed',
            ]);
        });

        // 4. Notifications
        $user->notifications()
            ->latest()
            ->take(5)
            ->get()
            ->each(function ($notification) use ($activities) {
                $activities->push([
                    'type' => 'notification',
                    'date' => $notification->created_at,
                    'title' => 'การแจ้งเตือน',
                    'description' => $notification->data['message'] ?? 'คุณมีการแจ้งเตือนใหม่',
                    'status' => 'completed',
                ]);
            });

        $sortedActivities = $activities->sortByDesc('date')->take(10)->values();

        return Inertia::render('user/dashboard', [
            'savedSearchCount' => $savedSearchCount,
            'recentSavedSearches' => $recentSavedSearches,
            'listingHistory' => $listingHistory,
            'searchHistoryCount' => $searchHistoryCount,
            'notificationCount' => $notificationCount,
            'activities' => $sortedActivities,
        ]);
    }
}
