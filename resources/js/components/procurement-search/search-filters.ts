import type { FormDataConvertible } from '@inertiajs/core';
import { router } from '@inertiajs/react';
import { useState } from 'react';
import type { FilterState } from '@/types/procurement';

export type SearchTaxonomy = {
    organizations: { value: string; label: string }[];
    methods: { value: string; label: string }[];
    categories: { value: string; label: string }[];
    noticeTypes: { value: string; label: string }[];
    provinces: { value: string; label: string }[];
    tags: { value: string; label: string }[];
    methodLabels: Record<string, string>;
    categoryLabels: Record<string, string>;
};

export type SearchCriteria = FilterState & {
    noticeTypes: string[];
    provinces: string[];
    tags: string[];
};

const querySort = {
    latest: 'newest',
    deadline: 'deadline_asc',
    'budget-low': 'budget_asc',
    'budget-high': 'budget_desc',
} as const satisfies Record<FilterState['sortBy'], string>;

export function useSearchFilters(
    filters: SearchCriteria,
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
    const [selectedNoticeTypes, setSelectedNoticeTypes] = useState<string[]>(
        filters.noticeTypes,
    );
    const [selectedProvinces, setSelectedProvinces] = useState<string[]>(
        filters.provinces,
    );
    const [selectedTags, setSelectedTags] = useState<string[]>(filters.tags);

    const criteria: SearchCriteria = {
        query,
        budgetRange,
        organizations: selectedOrganizations,
        methods: selectedMethods,
        categories: selectedCategories,
        noticeTypes: selectedNoticeTypes,
        provinces: selectedProvinces,
        tags: selectedTags,
        sortBy,
    };

    const submitFilters = (next: SearchCriteria, page = 1) => {
        const params: Record<string, FormDataConvertible> = {
            query: next.query,
            organization: next.organizations,
            method: next.methods,
            category: next.categories,
            notice_type: next.noticeTypes,
            province: next.provinces,
            tag: next.tags,
            budget_min: next.budgetRange[0],
            ...(next.budgetRange[1] === null
                ? {}
                : { budget_max: next.budgetRange[1] }),
            sort: querySort[next.sortBy],
            page,
        };

        router.get('/procurement', params, {
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
        ...(
            [
                {
                    values: selectedNoticeTypes,
                    options: taxonomy.noticeTypes,
                    key: 'noticeTypes',
                },
                {
                    values: selectedProvinces,
                    options: taxonomy.provinces,
                    key: 'provinces',
                },
                { values: selectedTags, options: taxonomy.tags, key: 'tags' },
            ] as const
        ).flatMap(({ values, options, key }) =>
            values.map((value) => ({
                label:
                    options.find((option) => option.value === value)?.label ??
                    value,
                value: `${key}:${value}`,
                onRemove: () => {
                    const next = values.filter((item) => item !== value);
                    if (key === 'noticeTypes') setSelectedNoticeTypes(next);
                    if (key === 'provinces') setSelectedProvinces(next);
                    if (key === 'tags') setSelectedTags(next);
                    submitFilters({ ...criteria, [key]: next });
                },
            })),
        ),
    ];

    const hasActiveFilters =
        activeFilters.length > 0 ||
        query.trim() !== '' ||
        budgetRange[0] !== 0 ||
        budgetRange[1] !== null;

    const clearAllFilters = () => {
        const next: SearchCriteria = {
            query: '',
            budgetRange: [0, null],
            organizations: [],
            methods: [],
            categories: [],
            noticeTypes: [],
            provinces: [],
            tags: [],
            sortBy: 'latest',
        };

        setQuery(next.query);
        setBudgetRange(next.budgetRange);
        setSelectedOrganizations(next.organizations);
        setSelectedMethods(next.methods);
        setSelectedCategories(next.categories);
        setSelectedNoticeTypes(next.noticeTypes);
        setSelectedProvinces(next.provinces);
        setSelectedTags(next.tags);
        setSortBy(next.sortBy);
        submitFilters(next);
    };

    const toggleFilter = (
        value: string,
        values: string[],
        setter: (next: string[]) => void,
        key:
            | 'organizations'
            | 'methods'
            | 'categories'
            | 'noticeTypes'
            | 'provinces'
            | 'tags',
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
        selectedNoticeTypes,
        setSelectedNoticeTypes,
        selectedProvinces,
        setSelectedProvinces,
        selectedTags,
        setSelectedTags,
        criteria,
        submitFilters,
        activeFilters,
        hasActiveFilters,
        clearAllFilters,
        toggleFilter,
    };
}

export type SearchFilters = ReturnType<typeof useSearchFilters>;
