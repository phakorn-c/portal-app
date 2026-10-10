<?php

namespace App\Http\Controllers\Procurement;

use App\Http\Controllers\Controller;
use App\Models\Announcement;
use App\Support\Procurement\Taxonomy;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class OverviewController extends Controller
{
    public function index(Request $request): Response
    {
        $filters = $request->validate([
            'period' => ['sometimes', Rule::in(['all', '30d', 'year'])],
            'agency' => ['sometimes', 'nullable', Rule::in(Taxonomy::organizations())],
        ]);
        $period = $filters['period'] ?? 'all';
        $agency = $filters['agency'] ?? '';

        $query = Announcement::query()->visible();
        if ($period === '30d') {
            $query->where('published_at', '>=', now('Asia/Bangkok')->subDays(30)->utc());
        } elseif ($period === 'year') {
            $query->where('published_at', '>=', now('Asia/Bangkok')->startOfYear()->utc());
        }
        if ($agency !== '') {
            $query->where('organization', $agency);
        }

        $announcements = $query->get([
            'id', 'organization', 'project_key', 'project_no', 'budget',
            'display_price', 'display_price_source', 'published_at',
        ]);

        $agencies = collect(Taxonomy::organizations())
            ->filter(fn (string $name): bool => $agency === '' || $agency === $name)
            ->map(fn (string $name): array => $this->agencySummary(
                $name,
                $announcements->where('organization', $name),
            ))
            ->values()
            ->all();

        return Inertia::render('procurement/overview', [
            'summary' => [
                'announcements' => $announcements->count(),
                'agencies' => collect($agencies)->where('announcements', '>', 0)->count(),
                'projects' => array_sum(array_column($agencies, 'projects')),
                'known_budget' => array_sum(array_column($agencies, 'known_budget')),
                'unknown_budget_projects' => array_sum(array_column($agencies, 'unknown_budget_projects')),
            ],
            'agencies' => $agencies,
            'agencyOptions' => Taxonomy::organizations(),
            'filters' => ['period' => $period, 'agency' => $agency],
            'updatedAt' => $announcements->max('published_at')?->toIso8601String(),
        ]);
    }

    private function agencySummary(string $name, Collection $announcements): array
    {
        // Without an explicit project key or number, a notice is counted as its own project.
        $projects = $announcements->groupBy(fn (Announcement $item): string => $item->project_key
            ?: ($item->project_no ?: "announcement:{$item->id}"));
        $knownBudget = 0;
        $unknownBudgetProjects = 0;

        foreach ($projects as $notices) {
            $amounts = $notices->map(function (Announcement $item): ?float {
                if ($item->display_price_source === 'budget'
                    && $item->display_price !== null) {
                    return (float) $item->display_price;
                }

                return $item->budget !== null ? (float) $item->budget : null;
            })->filter(fn (?float $amount): bool => $amount !== null);

            if ($amounts->isEmpty()) {
                $unknownBudgetProjects++;
            } else {
                // Repeated notices for one project contribute only their largest confirmed budget.
                $knownBudget += $amounts->max();
            }
        }

        return [
            'name' => $name,
            'announcements' => $announcements->count(),
            'projects' => $projects->count(),
            'known_budget' => $knownBudget,
            'unknown_budget_projects' => $unknownBudgetProjects,
        ];
    }
}
