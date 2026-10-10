import type {
    SearchCriteria,
    SearchTaxonomy,
} from '@/components/procurement-search/search-filters';

type FilterChipKey = keyof Pick<
    SearchCriteria,
    | 'organizations'
    | 'methods'
    | 'categories'
    | 'noticeTypes'
    | 'purchaseTypes'
    | 'provinces'
    | 'tags'
>;

export function buildActiveFilterChips(
    criteria: SearchCriteria,
    taxonomy: SearchTaxonomy,
    {
        onRemove,
        onOpenProposalsRemove,
    }: {
        onRemove: (key: FilterChipKey, value: string) => void;
        onOpenProposalsRemove: () => void;
    },
) {
    const activeFilters = [
        ...criteria.organizations.map((value) => ({
            label: value,
            value,
            onRemove: () => onRemove('organizations', value),
        })),
        ...criteria.methods.map((value) => ({
            label: taxonomy.methodLabels[value] ?? value,
            value,
            onRemove: () => onRemove('methods', value),
        })),
        ...criteria.categories.map((value) => ({
            label: taxonomy.categoryLabels[value] ?? value,
            value,
            onRemove: () => onRemove('categories', value),
        })),
        ...(
            [
                {
                    values: criteria.noticeTypes,
                    options: taxonomy.noticeTypes,
                    key: 'noticeTypes',
                },
                {
                    values: criteria.purchaseTypes,
                    options: [
                        { value: 'purchase', label: 'ซื้อ' },
                        { value: 'hire', label: 'จ้าง' },
                    ],
                    key: 'purchaseTypes',
                },
                {
                    values: criteria.provinces,
                    options: taxonomy.provinces,
                    key: 'provinces',
                },
                {
                    values: criteria.tags,
                    options: taxonomy.tags,
                    key: 'tags',
                },
            ] as const
        ).flatMap(({ values, options, key }) =>
            values.map((value) => ({
                label:
                    options.find((option) => option.value === value)?.label ??
                    value,
                value: `${key}:${value}`,
                onRemove: () => onRemove(key, value),
            })),
        ),
    ];

    if (criteria.openProposals) {
        activeFilters.push({
            label: 'ยังรับข้อเสนอ',
            value: 'openProposals',
            onRemove: onOpenProposalsRemove,
        });
    }

    return activeFilters;
}
