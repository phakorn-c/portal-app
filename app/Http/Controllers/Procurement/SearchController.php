<?php

namespace App\Http\Controllers\Procurement;

use App\Http\Controllers\Controller;
use App\Models\SearchHistory;
use App\Support\Procurement\AnnouncementSearch;
use App\Support\Procurement\FilterState;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Inertia\Inertia;
use Inertia\Response;

class SearchController extends Controller
{
    public function __construct(private readonly AnnouncementSearch $announcementSearch) {}

    public function index(Request $request): Response
    {
        $criteria = $this->normalizedCriteriaFromRequest($request);

        $announcements = $this->announcementSearch
            ->apply($criteria)
            ->paginate(15)
            ->withQueryString();

        $this->storeSearchHistory($request, $criteria, $announcements->total());

        return Inertia::render('procurement/search', [
            'announcements' => $announcements,
            'filters' => $criteria,
            'pagination' => $announcements->toArray(),
        ]);
    }

    private function normalizedCriteriaFromRequest(Request $request): array
    {
        $input = [
            'query' => (string) $request->query('query', ''),
            'organizations' => $this->arrayFromQuery($request->query('organization', [])),
            'methods' => $this->arrayFromQuery($request->query('method', [])),
            'categories' => $this->arrayFromQuery($request->query('category', [])),
            'budgetRange' => [
                (float) $request->query('budget_min', 0),
                (float) $request->query('budget_max', 10000000),
            ],
            'sortBy' => $this->normalizeSortValue((string) $request->query('sort', 'newest')),
        ];

        $validator = Validator::make(['criteria' => $input], FilterState::validationRules());
        $validated = $validator->validate();

        return FilterState::normalize($validated['criteria']);
    }

    private function arrayFromQuery(mixed $value): array
    {
        if (is_array($value)) {
            return array_values(array_filter($value, static fn ($item) => $item !== null && $item !== ''));
        }

        if (is_string($value) && $value !== '') {
            return [$value];
        }

        return [];
    }

    private function normalizeSortValue(string $sortBy): string
    {
        return match ($sortBy) {
            'newest' => 'latest',
            'deadline_asc' => 'deadline',
            'budget_asc' => 'budget-low',
            'budget_desc' => 'budget-high',
            default => $sortBy,
        };
    }

    private function storeSearchHistory(Request $request, array $criteria, int $resultCount): void
    {
        $user = $request->user();
        if (! $user || $user->email_verified_at === null) {
            return;
        }

        if ($criteria === FilterState::defaults()) {
            return;
        }

        SearchHistory::query()->create([
            'user_id' => $user->id,
            'criteria' => $criteria,
            'result_count' => $resultCount,
            'searched_at' => now(),
        ]);
    }
}
