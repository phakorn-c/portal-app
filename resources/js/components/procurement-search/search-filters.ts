import type { FormDataConvertible } from '@inertiajs/core';
import { router } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import type { FilterState } from '@/types/procurement';

export type SearchTaxonomy = {
    organizations: { value: string; label: string }[];
    methods: { value: string; label: string }[];
    categories: { value: string; label: string }[];
    methodLabels: Record<string, string>;
    categoryLabels: Record<string, string>;
};

const querySort = {
    latest: 'newest',
    deadline: 'deadline_asc',
    'budget-low': 'budget_asc',
    'budget-high': 'budget_desc',
} as const satisfies Record<FilterState['sortBy'], string>;

export function useSearchFilters(
    filters: FilterState,
    taxonomy: SearchTaxonomy,
    onSubmit: () => void,
) {
    const [query, setQuery] = useState(filters.query);
    const [budgetRange, setBudgetRange] = useState<[number, number | null]>(
        filters.budgetRange,
    );
    const [sortBy, setSortBy] = useState<FilterState['sortBy']>(filters.sortBy);
    const [selectedOrganizations, setSelectedOrganizations] = useState<
        string[]
    >(filters.organizations);
    const [selectedMethods, setSelectedMethods] = useState<string[]>(
        filters.methods,
    );
    const [selectedCategories, setSelectedCategories] = useState<string[]>(
        filters.categories,
    );

    useEffect(() => {
        setQuery(filters.query);
        setBudgetRange(filters.budgetRange);
        setSortBy(filters.sortBy);
        setSelectedOrganizations(filters.organizations);
        setSelectedMethods(filters.methods);
        setSelectedCategories(filters.categories);
    }, [filters]);

    const criteria: FilterState = {
        query,
        budgetRange,
        organizations: selectedOrganizations,
        methods: selectedMethods,
        categories: selectedCategories,
        sortBy,
    };

    const submitFilters = (next: FilterState, page = 1) => {
        const params: Record<string, FormDataConvertible> = {
            query: next.query,
            organization: next.organizations,
            method: next.methods,
            category: next.categories,
            budget_min: next.budgetRange[0],
            ...(next.budgetRange[1] === null
                ? {}
                : { budget_max: next.budgetRange[1] }),
            sort: querySort[next.sortBy],
            page,
        };

        router.get('/procurement', params, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
        onSubmit();
    };

    const activeFilters = [
        ...selectedOrganizations.map((value) => ({
            label: value,
            value,
            onRemove: () => {
                const next = selectedOrganizations.filter(
                    (item) => item !== value,
                );
                setSelectedOrganizations(next);
                submitFilters({ ...criteria, organizations: next });
            },
        })),
        ...selectedMethods.map((value) => ({
            label: taxonomy.methodLabels[value] ?? value,
            value,
            onRemove: () => {
                const next = selectedMethods.filter((item) => item !== value);
                setSelectedMethods(next);
                submitFilters({ ...criteria, methods: next });
            },
        })),
        ...selectedCategories.map((value) => ({
            label: taxonomy.categoryLabels[value] ?? value,
            value,
            onRemove: () => {
                const next = selectedCategories.filter(
                    (item) => item !== value,
                );
                setSelectedCategories(next);
                submitFilters({ ...criteria, categories: next });
            },
        })),
    ];

    const hasActiveFilters =
        activeFilters.length > 0 ||
        query.trim() !== '' ||
        budgetRange[0] !== 0 ||
        budgetRange[1] !== null;

    const clearAllFilters = () => {
        const next: FilterState = {
            query: '',
            budgetRange: [0, null],
            organizations: [],
            methods: [],
            categories: [],
            sortBy: 'latest',
        };

        setQuery(next.query);
        setBudgetRange(next.budgetRange);
        setSelectedOrganizations(next.organizations);
        setSelectedMethods(next.methods);
        setSelectedCategories(next.categories);
        setSortBy(next.sortBy);
        submitFilters(next);
    };

    const toggleFilter = (
        value: string,
        values: string[],
        setter: (next: string[]) => void,
        key: 'organizations' | 'methods' | 'categories',
    ) => {
        const next = values.includes(value)
            ? values.filter((item) => item !== value)
            : [...values, value];

        setter(next);
        submitFilters({ ...criteria, [key]: next });
    };

    return {
        query,
        setQuery,
        budgetRange,
        setBudgetRange,
        sortBy,
        setSortBy,
        selectedOrganizations,
        setSelectedOrganizations,
        selectedMethods,
        setSelectedMethods,
        selectedCategories,
        setSelectedCategories,
        criteria,
        submitFilters,
        activeFilters,
        hasActiveFilters,
        clearAllFilters,
        toggleFilter,
    };
}

export type SearchFilters = ReturnType<typeof useSearchFilters>;
