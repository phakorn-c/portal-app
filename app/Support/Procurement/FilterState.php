<?php

namespace App\Support\Procurement;

use Illuminate\Validation\Rule;

class FilterState
{
    public static function defaults(): array
    {
        return [
            'query' => '',
            'budgetRange' => [0.0, 10000000.0],
            'organizations' => [],
            'methods' => [],
            'categories' => [],
            'sortBy' => 'latest',
        ];
    }

    public static function validationRules(string $prefix = 'criteria'): array
    {
        return [
            $prefix => ['required', 'array'],
            $prefix.'.query' => ['present', 'nullable', 'string'],
            $prefix.'.budgetRange' => ['required', 'array', 'size:2'],
            $prefix.'.budgetRange.0' => ['required', 'numeric'],
            $prefix.'.budgetRange.1' => ['required', 'numeric'],
            $prefix.'.organizations' => ['present', 'array'],
            $prefix.'.organizations.*' => [Rule::in(Taxonomy::organizations())],
            $prefix.'.methods' => ['present', 'array'],
            $prefix.'.methods.*' => [Rule::in(array_keys(Taxonomy::methods()))],
            $prefix.'.categories' => ['present', 'array'],
            $prefix.'.categories.*' => [Rule::in(array_keys(Taxonomy::categories()))],
            $prefix.'.sortBy' => ['required', 'in:latest,budget-high,budget-low,deadline'],
        ];
    }

    public static function normalize(array $criteria): array
    {
        $defaults = self::defaults();

        return [
            'query' => (string) ($criteria['query'] ?? $defaults['query']),
            'budgetRange' => [
                $criteria['budgetRange'][0] ?? $defaults['budgetRange'][0],
                $criteria['budgetRange'][1] ?? $defaults['budgetRange'][1],
            ],
            'organizations' => array_values($criteria['organizations'] ?? $defaults['organizations']),
            'methods' => array_values($criteria['methods'] ?? $defaults['methods']),
            'categories' => array_values($criteria['categories'] ?? $defaults['categories']),
            'sortBy' => (string) ($criteria['sortBy'] ?? $defaults['sortBy']),
        ];
    }
}
