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

        return Inertia::render('user/dashboard', [
            'savedSearchCount' => $savedSearchCount,
            'recentSavedSearches' => $recentSavedSearches,
            'listingHistory' => $listingHistory,
            'searchHistoryCount' => $searchHistoryCount,
        ]);
    }
}
