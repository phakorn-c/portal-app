export function serializeCriteria(criteria: Record<string, unknown>): string {
    const params = new URLSearchParams();
    if (typeof criteria.query === 'string') params.set('query', criteria.query);
    if (typeof criteria.keyword === 'string')
        params.set('keyword', criteria.keyword);
    if (Array.isArray(criteria.organizations)) {
        criteria.organizations.forEach((val) =>
            typeof val === 'string'
                ? params.append('organization[]', val)
                : undefined,
        );
    }
    if (Array.isArray(criteria.methods)) {
        criteria.methods.forEach((val) =>
            typeof val === 'string'
                ? params.append('method[]', val)
                : undefined,
        );
    }
    if (Array.isArray(criteria.categories)) {
        criteria.categories.forEach((val) =>
            typeof val === 'string'
                ? params.append('category[]', val)
                : undefined,
        );
    }
    for (const [field, parameter] of [
        ['noticeTypes', 'notice_type[]'],
        ['provinces', 'province[]'],
        ['tags', 'tag[]'],
    ] as const) {
        const values = criteria[field];
        if (Array.isArray(values)) {
            values.forEach((value) => {
                if (typeof value === 'string') params.append(parameter, value);
            });
        }
    }
    if (
        Array.isArray(criteria.budgetRange) &&
        typeof criteria.budgetRange[0] === 'number' &&
        criteria.budgetRange[0] > 0
    ) {
        params.set('budget_min', String(criteria.budgetRange[0]));
    }
    if (
        Array.isArray(criteria.budgetRange) &&
        typeof criteria.budgetRange[1] === 'number' &&
        criteria.budgetRange[1] > 0
    ) {
        params.set('budget_max', String(criteria.budgetRange[1]));
    }
    if (typeof criteria.sortBy === 'string') {
        params.set('sort', criteria.sortBy);
    }
    return params.toString();
}
