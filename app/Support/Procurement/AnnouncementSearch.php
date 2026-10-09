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
                    ->orWhereRaw('LOWER(description) LIKE ?', ["%{$lowerKeyword}%"])
                    ->orWhereRaw('LOWER(project_no) LIKE ?', ["%{$lowerKeyword}%"])
                    ->orWhereRaw('LOWER(winner_name) LIKE ?', ["%{$lowerKeyword}%"]);
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

        $noticeTypes = array_values($criteria['noticeTypes'] ?? []);
        if ($noticeTypes !== []) {
            $query->whereIn('notice_type', $noticeTypes);
        }

        $provinces = array_values($criteria['provinces'] ?? []);
        if ($provinces !== []) {
            $query->whereIn('province', $provinces);
        }

        foreach (array_values($criteria['tags'] ?? []) as $tag) {
            $query->whereJsonContains('tags', $tag);
        }

        $budgetRange = $criteria['budgetRange'] ?? [0, null];
        $budgetMin = (float) ($budgetRange[0] ?? 0);
        $budgetMax = $budgetRange[1] ?? null;
        if ($budgetMin > 0) {
            $query->where('budget', '>=', $budgetMin);
        }
        if ($budgetMax !== null) {
            $query->where('budget', '<=', (float) $budgetMax);
        }

        $sortBy = (string) ($criteria['sortBy'] ?? 'latest');
        $this->applySort($query, $sortBy);

        return $query;
    }

    private function applySort(Builder $query, string $sortBy): void
    {
        match ($sortBy) {
            'deadline_asc', 'deadline' => $query->orderByRaw('deadline IS NULL')->orderBy('deadline'),
            'budget_asc', 'budget-low' => $query->orderByRaw('budget IS NULL')->orderBy('budget'),
            'budget_desc', 'budget-high' => $query->orderByRaw('budget IS NULL')->orderByDesc('budget'),
            default => $query->orderByDesc('created_at'),
        };
    }
}
