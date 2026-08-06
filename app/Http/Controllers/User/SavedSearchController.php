<?php

namespace App\Http\Controllers\User;

use App\Http\Controllers\Controller;
use App\Http\Requests\User\StoreSavedSearchRequest;
use App\Models\SavedSearch;
use App\Support\Procurement\FilterState;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\Response as SymfonyResponse;

class SavedSearchController extends Controller
{
    public function index(Request $request): JsonResponse|Response
    {
        $savedSearches = SavedSearch::query()
            ->where('user_id', $request->user()->id)
            ->latest()
            ->paginate(15);

        if ($request->wantsJson()) {
            return response()->json($savedSearches);
        }

        return Inertia::render('user/saved-searches', [
            'savedSearches' => $savedSearches,
        ]);
    }

    public function store(StoreSavedSearchRequest $request): JsonResponse
    {
        $savedSearch = SavedSearch::query()->create([
            'user_id' => $request->user()->id,
            'name' => $request->string('name')->toString(),
            'criteria' => FilterState::normalize($request->array('criteria')),
            'alert_enabled' => (bool) $request->boolean('alert_enabled'),
            'last_notified_at' => null,
        ]);

        return response()->json($savedSearch, SymfonyResponse::HTTP_CREATED);
    }

    public function update(StoreSavedSearchRequest $request, SavedSearch $savedSearch): JsonResponse
    {
        abort_if($savedSearch->user_id !== $request->user()->id, SymfonyResponse::HTTP_FORBIDDEN);

        $savedSearch->update([
            'name' => $request->string('name')->toString(),
            'criteria' => FilterState::normalize($request->array('criteria')),
            'alert_enabled' => (bool) $request->boolean('alert_enabled', $savedSearch->alert_enabled),
        ]);

        return response()->json($savedSearch->fresh());
    }

    public function destroy(Request $request, SavedSearch $savedSearch): \Illuminate\Http\Response
    {
        abort_if($savedSearch->user_id !== $request->user()->id, SymfonyResponse::HTTP_FORBIDDEN);

        $savedSearch->delete();

        return response()->noContent();
    }

    public function run(Request $request, SavedSearch $savedSearch): JsonResponse
    {
        abort_if($savedSearch->user_id !== $request->user()->id, SymfonyResponse::HTTP_FORBIDDEN);

        return response()->json([
            'criteria' => FilterState::normalize($savedSearch->criteria ?? []),
        ]);
    }
}
