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

        $purchaseTypes = array_values($criteria['purchaseTypes'] ?? []);
        if ($purchaseTypes !== []) {
            $isPurchase = in_array('purchase', $purchaseTypes, true);
            $isHire = in_array('hire', $purchaseTypes, true);
            $categories = [
                ...($isPurchase ? ['supply'] : []),
                ...($isHire ? ['works', 'service', 'consulting'] : []),
            ];
            $legacyCategories = [
                ...($isPurchase ? ['goods'] : []),
                ...($isHire ? ['construction', 'services', 'consulting'] : []),
            ];
            $query->where(function (Builder $builder) use ($categories, $legacyCategories): void {
                $builder->whereIn('procurement_category', $categories)
                    ->orWhere(function (Builder $legacy) use ($legacyCategories): void {
                        $legacy->whereNull('procurement_category')
                            ->whereIn('category', $legacyCategories);
                    });
            });
        }

        if ($criteria['openProposals'] ?? false) {
            $query->where('notice_type', 'invitation')
                ->where(function (Builder $builder): void {
                    $builder->whereNull('status')->orWhere('status', '!=', 'closed');
                })
                ->where(function (Builder $builder): void {
                    $builder->whereNull('process_status')->orWhere('process_status', '!=', 'award_announced');
                })
                ->whereRaw('DATE(COALESCE(submission_deadline, deadline)) > ?', [now('Asia/Bangkok')->toDateString()]);
        }

        $provinces = array_values($criteria['provinces'] ?? []);
        if ($provinces !== []) {
            $query->whereIn('province', $provinces);
        }

        foreach (array_values($criteria['tags'] ?? []) as $tag) {
            $query->whereJsonContains('tags', $tag);
        }

        $price = $this->displayedPriceSql();
        $budgetRange = $criteria['budgetRange'] ?? [0, null];
        $budgetMin = (float) ($budgetRange[0] ?? 0);
        $budgetMax = $budgetRange[1] ?? null;
        if ($budgetMin > 0) {
            $query->whereRaw("{$price} >= ?", [$budgetMin]);
        }
        if ($budgetMax !== null) {
            $query->whereRaw("{$price} <= ?", [(float) $budgetMax]);
        }

        $sortBy = (string) ($criteria['sortBy'] ?? 'latest');
        $this->applySort($query, $sortBy);

        return $query;
    }

    private function applySort(Builder $query, string $sortBy): void
    {
        $price = $this->displayedPriceSql();

        match ($sortBy) {
            'deadline_asc', 'deadline' => $query->orderByRaw('deadline IS NULL')->orderBy('deadline'),
            'budget_asc', 'budget-low' => $query->orderByRaw("{$price} IS NULL")->orderByRaw("{$price} ASC"),
            'budget_desc', 'budget-high' => $query->orderByRaw("{$price} IS NULL")->orderByRaw("{$price} DESC"),
            default => $query->orderByDesc('created_at'),
        };
    }

    private function displayedPriceSql(): string
    {
        return "CAST(CASE WHEN display_price_source IN ('reference_price', 'budget', 'winning_price') AND display_price IS NOT NULL THEN display_price ELSE budget END AS DECIMAL(15, 2))";
    }
}
