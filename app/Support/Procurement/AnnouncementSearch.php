<?php

namespace App\Support\Procurement;

use App\Models\Announcement;
use Illuminate\Database\Eloquent\Builder;

class AnnouncementSearch
{
    public function apply(array $criteria): Builder
    {
        $query = Announcement::query()->published();

        $keyword = trim((string) ($criteria['query'] ?? ''));
        if ($keyword !== '') {
            $lowerKeyword = mb_strtolower($keyword);
            $query->where(function (Builder $builder) use ($lowerKeyword): void {
                $builder
                    ->whereRaw('LOWER(title) LIKE ?', ["%{$lowerKeyword}%"])
                    ->orWhereRaw('LOWER(description) LIKE ?', ["%{$lowerKeyword}%"]);
            });
        }

        $organizations = array_values($criteria['organizations'] ?? []);
        if ($organizations !== []) {
            $query->whereIn('organization', $organizations);
        }

        $methods = array_values($criteria['methods'] ?? []);
        if ($methods !== []) {
            $query->whereIn('method', $methods);
        }

        $categories = array_values($criteria['categories'] ?? []);
        if ($categories !== []) {
            $query->whereIn('category', $categories);
        }

        $budgetRange = $criteria['budgetRange'] ?? [0, 10000000];
        $budgetMin = (float) ($budgetRange[0] ?? 0);
        $budgetMax = (float) ($budgetRange[1] ?? 10000000);
        $query->whereBetween('budget', [$budgetMin, $budgetMax]);

        $sortBy = (string) ($criteria['sortBy'] ?? 'latest');
        $this->applySort($query, $sortBy);

        return $query;
    }

    private function applySort(Builder $query, string $sortBy): void
    {
        match ($sortBy) {
            'deadline_asc', 'deadline' => $query->orderBy('deadline'),
            'budget_asc', 'budget-low' => $query->orderBy('budget'),
            'budget_desc', 'budget-high' => $query->orderByDesc('budget'),
            default => $query->orderByDesc('created_at'),
        };
    }
}
