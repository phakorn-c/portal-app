<?php

namespace App\Http\Controllers\User;

use App\Http\Controllers\Controller;
use App\Models\ListingHistory;
use App\Models\SearchHistory;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class HistoryController extends Controller
{
    public function index(Request $request): Response
    {
        $user = $request->user();

        $listingHistory = ListingHistory::where('user_id', $user->id)
            ->with('announcement')
            ->latest('viewed_at')
            ->paginate(15, ['*'], 'listing_page');

        $searchHistory = SearchHistory::where('user_id', $user->id)
            ->latest('searched_at')
            ->paginate(15, ['*'], 'search_page');

        return Inertia::render('user/history', [
            'listingHistory' => $listingHistory,
            'searchHistory' => $searchHistory,
        ]);
    }
}
