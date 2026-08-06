import type { FormDataConvertible } from '@inertiajs/core';
import { Head, Link, router, usePage } from '@inertiajs/react';
import {
    BookmarkPlus,
    Building2,
    CalendarDays,
    ChevronRight,
    Gavel,
    LoaderCircle,
    Search,
    SlidersHorizontal,
    X,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Pagination } from '@/components/ui/pagination';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { StatusBadge } from '@/components/ui/status-badge';
import { Switch } from '@/components/ui/switch';
import AppHeaderLayout from '@/layouts/app/app-header-layout';
import type { SharedData } from '@/types';
import type { FilterState } from '@/types/procurement';

type SortValue = FilterState['sortBy'];

type ServerAnnouncement = {
    id: number;
    title: string;
    organization: string;
    category: string;
    method: string;
    budget: number | string;
    deadline: string;
    status: 'open' | 'urgent' | 'closing' | 'closed';
};

type AnnouncementPagination = {
    data: ServerAnnouncement[];
    total: number;
    current_page: number;
    last_page: number;
};

type PageProps = SharedData & {
    announcements: AnnouncementPagination;
    filters: FilterState;
    pagination: AnnouncementPagination;
    taxonomy: {
        organizations: { value: string; label: string }[];
        methods: { value: string; label: string }[];
        categories: { value: string; label: string }[];
        methodLabels: Record<string, string>;
        categoryLabels: Record<string, string>;
    };
};

function formatBudget(amount: number) {
    return amount.toLocaleString('th-TH');
}

function formatDate(value: string): string {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return value;
    }

    return date.toLocaleDateString('th-TH', {
        timeZone: 'Asia/Bangkok',
    });
}

function parseBudget(value: number | string): number {
    if (typeof value === 'number') {
        return value;
    }

    return Number.parseFloat(value) || 0;
}

function readCookie(name: string): string | null {
    if (typeof document === 'undefined') {
        return null;
    }

    const cookie = document.cookie
        .split('; ')
        .find((value) => value.startsWith(`${name}=`));

    if (!cookie) {
        return null;
    }

    return decodeURIComponent(cookie.split('=').slice(1).join('='));
}

function mapSortForQuery(sortBy: SortValue): string {
    if (sortBy === 'latest') {
        return 'newest';
    }
    if (sortBy === 'deadline') {
        return 'deadline_asc';
    }
    if (sortBy === 'budget-low') {
        return 'budget_asc';
    }

    return 'budget_desc';
}

function buildQueryParams(
    criteria: FilterState,
    page = 1,
): Record<string, FormDataConvertible> {
    return {
        query: criteria.query,
        organization: criteria.organizations,
        method: criteria.methods,
        category: criteria.categories,
        budget_min: criteria.budgetRange[0],
        budget_max: criteria.budgetRange[1],
        sort: mapSortForQuery(criteria.sortBy),
        page,
    };
}

export default function ProcurementSearch() {
    const { auth, announcements, filters, pagination, taxonomy } =
        usePage<PageProps>().props;
    const metaCsrfToken = document
        .querySelector('meta[name="csrf-token"]')
        ?.getAttribute('content');
    const cookieCsrfToken = readCookie('XSRF-TOKEN');
    const csrfToken = metaCsrfToken ?? cookieCsrfToken;

    const [query, setQuery] = useState(filters.query);
    const [budgetRange, setBudgetRange] = useState<[number, number]>(
        filters.budgetRange,
    );
    const [sortBy, setSortBy] = useState<SortValue>(filters.sortBy);
    const [selectedOrganizations, setSelectedOrganizations] = useState<
        string[]
    >(filters.organizations);
    const [selectedMethods, setSelectedMethods] = useState<string[]>(
        filters.methods,
    );
    const [selectedCategories, setSelectedCategories] = useState<string[]>(
        filters.categories,
    );
    const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);
    const [saveSearchName, setSaveSearchName] = useState('');
    const [saveSearchAlertsEnabled, setSaveSearchAlertsEnabled] =
        useState(true);
    const [saveSearchError, setSaveSearchError] = useState<string | null>(null);
    const [saveSearchSuccess, setSaveSearchSuccess] = useState<string | null>(
        null,
    );
    const [isSavingSearch, setIsSavingSearch] = useState(false);

    useEffect(() => {
        setQuery(filters.query);
        setBudgetRange(filters.budgetRange);
        setSortBy(filters.sortBy);
        setSelectedOrganizations(filters.organizations);
        setSelectedMethods(filters.methods);
        setSelectedCategories(filters.categories);
    }, [filters]);

    const submitFilters = (next: FilterState, page = 1) => {
        router.get('/procurement', buildQueryParams(next, page), {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });

        setSaveSearchSuccess(null);
    };

    const criteria: FilterState = {
        query,
        budgetRange,
        organizations: selectedOrganizations,
        methods: selectedMethods,
        categories: selectedCategories,
        sortBy,
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
        budgetRange[1] !== 10000000;
    const canCreateSavedSearch =
        auth.user !== null && auth.user.email_verified_at !== null;

    const cards = useMemo(
        () =>
            announcements.data.map((announcement) => ({
                ...announcement,
                budget: parseBudget(announcement.budget),
            })),
        [announcements.data],
    );

    const clearAllFilters = () => {
        const next: FilterState = {
            query: '',
            budgetRange: [0, 10000000],
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

    const resetSaveSearchDialog = () => {
        setSaveSearchName('');
        setSaveSearchAlertsEnabled(true);
        setSaveSearchError(null);
        setIsSavingSearch(false);
    };

    const handleSaveDialogChange = (open: boolean) => {
        setIsSaveDialogOpen(open);

        if (!open) {
            resetSaveSearchDialog();
        }
    };

    const handleCreateSavedSearch = async () => {
        const trimmedName = saveSearchName.trim();

        if (trimmedName === '') {
            setSaveSearchError('กรุณาตั้งชื่อการค้นหาก่อนบันทึก');

            return;
        }

        if (!csrfToken) {
            setSaveSearchError('ไม่พบข้อมูลความปลอดภัยสำหรับการบันทึกการค้นหา');

            return;
        }

        const headers: Record<string, string> = {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
        };

        if (metaCsrfToken) {
            headers['X-CSRF-TOKEN'] = metaCsrfToken;
        } else if (cookieCsrfToken) {
            headers['X-XSRF-TOKEN'] = cookieCsrfToken;
        }

        setIsSavingSearch(true);
        setSaveSearchError(null);
        setSaveSearchSuccess(null);

        try {
            const response = await window.fetch('/user/saved-searches', {
                method: 'POST',
                credentials: 'same-origin',
                headers,
                body: JSON.stringify({
                    name: trimmedName,
                    criteria,
                    alert_enabled: saveSearchAlertsEnabled,
                }),
            });

            if (response.ok) {
                setSaveSearchSuccess(
                    `บันทึกการค้นหา "${trimmedName}" เรียบร้อยแล้ว`,
                );
                handleSaveDialogChange(false);

                return;
            }

            const data = (await response.json().catch(() => null)) as {
                message?: string;
                errors?: Record<string, string[]>;
            } | null;

            const nameError = data?.errors?.name?.[0];
            const criteriaError = data?.errors?.criteria?.[0];

            setSaveSearchError(
                nameError ??
                    criteriaError ??
                    data?.message ??
                    'ไม่สามารถบันทึกการค้นหาได้ในขณะนี้',
            );
        } finally {
            setIsSavingSearch(false);
        }
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

    return (
        <AppHeaderLayout>
            <Head title="ประกาศจัดซื้อจัดจ้าง" />
            <div className="flex flex-col gap-8 px-4 py-6 md:px-8">
                <div className="rounded-2xl bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-6 md:p-10">
                    <div className="flex flex-col gap-6">
                        <div className="space-y-3">
                            <h1 className="text-3xl font-black tracking-tight text-foreground md:text-4xl">
                                ค้นหาและประกาศ{' '}
                                <span className="text-primary">
                                    จัดซื้อจัดจ้าง
                                </span>
                            </h1>
                            <p className="max-w-2xl text-base text-muted-foreground md:text-lg">
                                ตรวจสอบความโปร่งใสในการใช้จ่ายภาครัฐ
                                ค้นหาโอกาสในการยื่นข้อเสนอโครงการจัดซื้อจัดจ้างทั่วจังหวัดขอนแก่น
                            </p>
                        </div>
                        <div className="flex flex-col gap-3 md:flex-row">
                            <div className="relative flex-1">
                                <Search className="pointer-events-none absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2 text-primary/70" />
                                <Input
                                    value={query}
                                    onChange={(event) => {
                                        const nextQuery = event.target.value;
                                        setQuery(nextQuery);
                                        submitFilters({
                                            ...criteria,
                                            query: nextQuery,
                                        });
                                    }}
                                    placeholder="ค้นหาด้วยคำสำคัญ, เลขที่โครงการ หรือชื่อหน่วยงาน..."
                                    className="h-14 rounded-xl border-none bg-card pr-28 pl-12 text-base shadow-md ring-1 ring-border focus-visible:ring-2 focus-visible:ring-primary"
                                />
                                <Button
                                    className="absolute top-2 right-2 h-10 rounded-lg px-6"
                                    onClick={() => submitFilters(criteria)}
                                >
                                    ค้นหา
                                </Button>
                            </div>
                            {!auth.user && (
                                <Button
                                    asChild
                                    variant="outline"
                                    className="h-14 rounded-xl px-6"
                                >
                                    <Link href="/register">ลงทะเบียน</Link>
                                </Button>
                            )}
                        </div>
                    </div>
                </div>

                <div className="grid gap-8 lg:grid-cols-12">
                    <aside className="lg:col-span-3">
                        <Card className="sticky top-24">
                            <CardHeader className="border-b border-border pb-4">
                                <div className="flex items-center justify-between">
                                    <CardTitle className="flex items-center gap-2 text-xl font-bold">
                                        <SlidersHorizontal className="h-5 w-5 text-primary" />
                                        ตัวกรอง
                                    </CardTitle>
                                    <Button
                                        variant="ghost"
                                        className="h-8 px-2 text-xs text-muted-foreground hover:text-primary"
                                        onClick={clearAllFilters}
                                        disabled={!hasActiveFilters}
                                    >
                                        ล้างทั้งหมด
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-8 pt-6">
                                <div className="space-y-4">
                                    <h4 className="text-sm font-bold tracking-wide text-foreground uppercase">
                                        ช่วงงบประมาณ
                                    </h4>
                                    <div className="px-1">
                                        <Slider
                                            value={budgetRange}
                                            onValueChange={(value) => {
                                                const next = [
                                                    value[0] ?? 0,
                                                    value[1] ?? 10000000,
                                                ] as [number, number];
                                                setBudgetRange(next);
                                                submitFilters({
                                                    ...criteria,
                                                    budgetRange: next,
                                                });
                                            }}
                                            min={0}
                                            max={10000000}
                                            step={100000}
                                            className="w-full"
                                        />
                                        <div className="mt-3 flex justify-between text-sm text-muted-foreground">
                                            <span>0 บาท</span>
                                            <span>10 ล้าน</span>
                                        </div>
                                        <div className="mt-3 grid grid-cols-2 gap-2">
                                            <div className="relative">
                                                <span className="absolute top-2 left-2 text-xs text-muted-foreground">
                                                    ฿
                                                </span>
                                                <Input
                                                    placeholder="ต่ำสุด"
                                                    className="h-9 pl-6 text-sm"
                                                    value={budgetRange[0]}
                                                    readOnly
                                                />
                                            </div>
                                            <div className="relative">
                                                <span className="absolute top-2 left-2 text-xs text-muted-foreground">
                                                    ฿
                                                </span>
                                                <Input
                                                    placeholder="สูงสุด"
                                                    className="h-9 pl-6 text-sm"
                                                    value={budgetRange[1]}
                                                    readOnly
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <h4 className="text-sm font-bold tracking-wide text-foreground uppercase">
                                        หน่วยงาน / ภาคส่วน
                                    </h4>
                                    <div className="custom-scrollbar max-h-48 space-y-2 overflow-y-auto pr-2">
                                        {taxonomy.organizations.map(
                                            (organization) => (
                                                <label
                                                    key={organization.value}
                                                    className="group flex cursor-pointer items-start gap-3"
                                                >
                                                    <Checkbox
                                                        checked={selectedOrganizations.includes(
                                                            organization.value,
                                                        )}
                                                        onCheckedChange={() =>
                                                            toggleFilter(
                                                                organization.value,
                                                                selectedOrganizations,
                                                                setSelectedOrganizations,
                                                                'organizations',
                                                            )
                                                        }
                                                    />
                                                    <span className="text-sm text-muted-foreground transition-colors group-hover:text-primary">
                                                        {organization.label}
                                                    </span>
                                                </label>
                                            ),
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <h4 className="text-sm font-bold tracking-wide text-foreground uppercase">
                                        วิธีการจัดซื้อจัดจ้าง
                                    </h4>
                                    <div className="space-y-2">
                                        {taxonomy.methods.map((method) => (
                                            <label
                                                key={method.value}
                                                className="group flex cursor-pointer items-center gap-3"
                                            >
                                                <Checkbox
                                                    checked={selectedMethods.includes(
                                                        method.value,
                                                    )}
                                                    onCheckedChange={() =>
                                                        toggleFilter(
                                                            method.value,
                                                            selectedMethods,
                                                            setSelectedMethods,
                                                            'methods',
                                                        )
                                                    }
                                                />
                                                <span className="text-sm text-muted-foreground transition-colors group-hover:text-primary">
                                                    {method.label}
                                                </span>
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <h4 className="text-sm font-bold tracking-wide text-foreground uppercase">
                                        หมวดหมู่ / ประเภทงาน
                                    </h4>
                                    <div className="space-y-2">
                                        {taxonomy.categories.map((category) => (
                                            <label
                                                key={category.value}
                                                className="group flex cursor-pointer items-center gap-3"
                                            >
                                                <Checkbox
                                                    checked={selectedCategories.includes(
                                                        category.value,
                                                    )}
                                                    onCheckedChange={() =>
                                                        toggleFilter(
                                                            category.value,
                                                            selectedCategories,
                                                            setSelectedCategories,
                                                            'categories',
                                                        )
                                                    }
                                                />
                                                <span className="text-sm text-muted-foreground transition-colors group-hover:text-primary">
                                                    {category.label}
                                                </span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </aside>

                    <div className="space-y-6 lg:col-span-9">
                        <div className="flex flex-col justify-between gap-4 rounded-xl border border-border bg-card p-4 md:flex-row md:items-center">
                            <div className="space-y-2">
                                <p className="flex items-center gap-2 text-sm text-muted-foreground">
                                    พบทั้งหมด{' '}
                                    <span className="text-lg font-bold text-foreground">
                                        {pagination.total}
                                    </span>{' '}
                                    รายการ
                                </p>
                                <div className="flex flex-wrap gap-2">
                                    {activeFilters.map((filter) => (
                                        <Badge
                                            key={filter.value}
                                            variant="secondary"
                                            className="gap-1.5 border border-primary/20 bg-primary/5 text-primary"
                                        >
                                            {filter.label}
                                            <button
                                                type="button"
                                                onClick={filter.onRemove}
                                                className="rounded-full hover:bg-primary/20"
                                            >
                                                <X className="h-3 w-3" />
                                            </button>
                                        </Badge>
                                    ))}
                                    {hasActiveFilters && (
                                        <button
                                            className="px-2 text-xs text-muted-foreground underline hover:text-primary"
                                            onClick={clearAllFilters}
                                        >
                                            ล้างตัวกรอง
                                        </button>
                                    )}
                                </div>
                                {saveSearchSuccess && (
                                    <p
                                        className="text-sm font-medium text-emerald-600"
                                        data-test="procurement-save-search-success"
                                    >
                                        {saveSearchSuccess}{' '}
                                        <Link
                                            href="/user/saved-searches"
                                            className="underline underline-offset-4"
                                        >
                                            ดูรายการที่บันทึกไว้
                                        </Link>
                                    </p>
                                )}
                            </div>
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                                {canCreateSavedSearch && (
                                    <Button
                                        type="button"
                                        variant="outline"
                                        className="gap-2"
                                        data-test="procurement-save-search-trigger"
                                        onClick={() =>
                                            handleSaveDialogChange(true)
                                        }
                                    >
                                        <BookmarkPlus className="h-4 w-4" />
                                        บันทึกการค้นหานี้
                                    </Button>
                                )}
                                <Select
                                    value={sortBy}
                                    onValueChange={(value) => {
                                        const next = value as SortValue;
                                        setSortBy(next);
                                        submitFilters({
                                            ...criteria,
                                            sortBy: next,
                                        });
                                    }}
                                >
                                    <SelectTrigger className="w-[200px]">
                                        <SelectValue placeholder="เรียงตาม" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="latest">
                                            ใหม่ล่าสุด
                                        </SelectItem>
                                        <SelectItem value="deadline">
                                            กำหนดส่งใกล้สุด
                                        </SelectItem>
                                        <SelectItem value="budget-high">
                                            งบประมาณสูงสุด
                                        </SelectItem>
                                        <SelectItem value="budget-low">
                                            งบประมาณต่ำสุด
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="space-y-4">
                            {cards.map((announcement) => (
                                <article
                                    key={announcement.id}
                                    className={`group rounded-xl border bg-card p-5 shadow-sm transition-all duration-300 hover:border-primary/50 hover:shadow-md ${
                                        announcement.status === 'closed'
                                            ? 'border-border bg-muted/30 opacity-80 hover:opacity-100'
                                            : 'border-border'
                                    }`}
                                >
                                    <div className="flex flex-col gap-4">
                                        <div className="flex items-start justify-between gap-4">
                                            <StatusBadge
                                                status={announcement.status}
                                            />
                                            <span className="font-mono text-xs text-muted-foreground">
                                                ID: {announcement.id}
                                            </span>
                                        </div>

                                        <h3 className="text-lg font-bold text-foreground transition-colors group-hover:text-primary">
                                            {announcement.title}
                                        </h3>

                                        <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
                                            <div className="flex items-center gap-1.5">
                                                <Building2 className="h-4 w-4 text-primary" />
                                                <span>
                                                    หน่วยงาน:{' '}
                                                    {announcement.organization}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <Gavel className="h-4 w-4 text-amber-500" />
                                                <span>
                                                    {taxonomy.methodLabels[
                                                        announcement.method
                                                    ] ?? announcement.method}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="flex flex-col items-start justify-between gap-4 border-t border-border pt-4 sm:flex-row sm:items-center">
                                            <div className="flex items-center gap-6">
                                                <div>
                                                    <p className="text-xs text-muted-foreground">
                                                        งบประมาณ
                                                    </p>
                                                    <p className="text-base font-bold text-primary">
                                                        ฿{' '}
                                                        {formatBudget(
                                                            announcement.budget,
                                                        )}
                                                    </p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-muted-foreground">
                                                        สิ้นสุดรับสมัคร
                                                    </p>
                                                    <p className="flex items-center gap-1 text-sm font-semibold text-foreground">
                                                        <CalendarDays className="h-4 w-4" />
                                                        {formatDate(
                                                            announcement.deadline,
                                                        )}
                                                    </p>
                                                </div>
                                            </div>
                                            <Button
                                                asChild
                                                variant={
                                                    announcement.status ===
                                                    'closed'
                                                        ? 'outline'
                                                        : 'secondary'
                                                }
                                                className="w-full gap-2 transition-all hover:bg-primary hover:text-white sm:w-auto"
                                            >
                                                <Link
                                                    href={`/procurement/announcements/${announcement.id}`}
                                                >
                                                    {announcement.status ===
                                                    'closed'
                                                        ? 'ดูผลการจัดซื้อ'
                                                        : 'ดูรายละเอียด'}
                                                    <ChevronRight className="h-4 w-4" />
                                                </Link>
                                            </Button>
                                        </div>
                                    </div>
                                </article>
                            ))}
                        </div>

                        {pagination.last_page > 1 && (
                            <div className="mt-8">
                                <Pagination
                                    currentPage={pagination.current_page}
                                    totalPages={pagination.last_page}
                                    onPageChange={(page) =>
                                        submitFilters(criteria, page)
                                    }
                                />
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <Dialog
                open={isSaveDialogOpen}
                onOpenChange={handleSaveDialogChange}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>บันทึกการค้นหาปัจจุบัน</DialogTitle>
                        <DialogDescription>
                            ตั้งชื่อและเลือกการแจ้งเตือนสำหรับเงื่อนไขที่กำลังค้นหาอยู่ในตอนนี้
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="saved-search-name">
                                ชื่อการค้นหา
                            </Label>
                            <Input
                                id="saved-search-name"
                                value={saveSearchName}
                                onChange={(event) => {
                                    setSaveSearchName(event.target.value);
                                    if (saveSearchError) {
                                        setSaveSearchError(null);
                                    }
                                }}
                                placeholder="เช่น งานก่อสร้างเทศบาลที่สนใจ"
                                data-test="procurement-save-search-name"
                            />
                        </div>
                        <div className="flex items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                                <Label
                                    htmlFor="saved-search-alert-enabled"
                                    className="text-base"
                                >
                                    เปิดการแจ้งเตือน
                                </Label>
                                <p className="text-sm text-muted-foreground">
                                    แจ้งเมื่อมีประกาศใหม่ที่ตรงกับเงื่อนไขนี้
                                </p>
                            </div>
                            <Switch
                                id="saved-search-alert-enabled"
                                checked={saveSearchAlertsEnabled}
                                onCheckedChange={setSaveSearchAlertsEnabled}
                                data-test="procurement-save-search-alert-enabled"
                            />
                        </div>
                        {saveSearchError && (
                            <p
                                className="text-sm font-medium text-destructive"
                                data-test="procurement-save-search-error"
                            >
                                {saveSearchError}
                            </p>
                        )}
                    </div>
                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => handleSaveDialogChange(false)}
                            disabled={isSavingSearch}
                        >
                            ยกเลิก
                        </Button>
                        <Button
                            type="button"
                            onClick={handleCreateSavedSearch}
                            disabled={isSavingSearch}
                            data-test="procurement-save-search-submit"
                        >
                            {isSavingSearch && (
                                <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                            )}
                            บันทึกการค้นหา
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppHeaderLayout>
    );
}
