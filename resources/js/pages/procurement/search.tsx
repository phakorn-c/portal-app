import { Head, Link, usePage } from '@inertiajs/react';
import {
    Building2,
    CalendarDays,
    ChevronRight,
    FileText,
    Gavel,
    MapPin,
    Search,
    SlidersHorizontal,
    X,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import AppHeaderLayout from '@/layouts/app/app-header-layout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
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
import type { SharedData } from '@/types';

type Announcement = {
    id: string;
    title: string;
    organization: string;
    category: string;
    method: string;
    budget: number;
    location: string;
    publishedAt: string;
    deadline: string;
    status: 'open' | 'urgent' | 'closing' | 'closed';
};

const announcements: Announcement[] = [
    {
        id: '66107382',
        title: 'ประกวดราคาจ้างก่อสร้างถนนคอนกรีตเสริมเหล็ก บ้านกอกสี หมู่ที่ 8',
        organization: 'เทศบาลนครขอนแก่น',
        category: 'ก่อสร้าง',
        method: 'e-Bidding',
        budget: 2540000,
        location: 'อำเภอเมืองขอนแก่น',
        publishedAt: '20 ต.ค. 2566',
        deadline: '25 ต.ค. 2566',
        status: 'open',
    },
    {
        id: '66109221',
        title: 'ซื้อครุภัณฑ์การแพทย์สำหรับโรงพยาบาลขอนแก่น (ระยะที่ 2)',
        organization: 'สำนักงานสาธารณสุขจังหวัด',
        category: 'การแพทย์',
        method: 'วิธีเฉพาะเจาะจง',
        budget: 15000000,
        location: 'อำเภอเมืองขอนแก่น',
        publishedAt: '18 ต.ค. 2566',
        deadline: 'พรุ่งนี้',
        status: 'urgent',
    },
    {
        id: '66101104',
        title: 'จ้างปรับปรุงอาคารเรียน Smart Classroom คณะวิศวกรรมศาสตร์',
        organization: 'มหาวิทยาลัยขอนแก่น',
        category: 'ก่อสร้าง',
        method: 'e-Bidding',
        budget: 8450000,
        location: 'อำเภอเมืองขอนแก่น',
        publishedAt: '15 ต.ค. 2566',
        deadline: '02 พ.ย. 2566',
        status: 'open',
    },
    {
        id: '66098821',
        title: 'โครงการซ่อมบำรุงทางหลวง ถนนมิตรภาพ กม. 230-245',
        organization: 'แขวงทางหลวงขอนแก่น',
        category: 'ก่อสร้าง',
        method: 'e-Bidding',
        budget: 45000000,
        location: 'อำเภอน้ำพอง',
        publishedAt: '01 ต.ค. 2566',
        deadline: '12 ต.ค. 2566',
        status: 'closed',
    },
    {
        id: '66095512',
        title: 'จัดซื้อครุภัณฑ์คอมพิวเตอร์สำหรับศูนย์บริการประชาชน',
        organization: 'องค์การบริหารส่วนจังหวัด',
        category: 'ไอที/ครุภัณฑ์',
        method: 'e-Market',
        budget: 3200000,
        location: 'อำเภอเมืองขอนแก่น',
        publishedAt: '28 ก.ย. 2566',
        deadline: '15 ต.ค. 2566',
        status: 'closing',
    },
    {
        id: '66092334',
        title: 'จ้างที่ปรึกษาออกแบบระบบบริหารจัดการน้ำเพื่อการเกษตร',
        organization: 'เทศบาลนครขอนแก่น',
        category: 'ที่ปรึกษา',
        method: 'คัดเลือก',
        budget: 5800000,
        location: 'อำเภอบ้านไผ่',
        publishedAt: '25 ก.ย. 2566',
        deadline: '10 ต.ค. 2566',
        status: 'closed',
    },
];

const organizations = [
    'องค์การบริหารส่วนจังหวัด',
    'เทศบาลนครขอนแก่น',
    'แขวงทางหลวงขอนแก่น',
    'มหาวิทยาลัยขอนแก่น',
    'สำนักงานสาธารณสุขจังหวัด',
];

const categories = ['ก่อสร้าง', 'ไอที/ครุภัณฑ์', 'ที่ปรึกษา', 'การแพทย์'];

const methods = [
    'e-Bidding',
    'วิธีเฉพาะเจาะจง',
    'คัดเลือก',
    'สอบราคา',
    'e-Market',
];

function formatBudget(amount: number) {
    return amount.toLocaleString('th-TH');
}

const ITEMS_PER_PAGE = 4;

export default function ProcurementSearch() {
    const { auth } = usePage<SharedData>().props;
    const [query, setQuery] = useState('');
    const [budgetRange, setBudgetRange] = useState([0, 100]);
    const [sort, setSort] = useState('ล่าสุด');
    const [selectedOrganizations, setSelectedOrganizations] = useState<
        string[]
    >(['เทศบาลนครขอนแก่น']);
    const [selectedMethods, setSelectedMethods] = useState<string[]>([
        'e-Bidding',
    ]);
    const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
    const [currentPage, setCurrentPage] = useState(1);

    const budgetMin = budgetRange[0] * 500000;
    const budgetMax =
        budgetRange[1] === 100 ? Infinity : budgetRange[1] * 500000;

    const filteredAnnouncements = useMemo(() => {
        return announcements.filter((announcement) => {
            const matchesQuery = query
                ? `${announcement.title} ${announcement.organization} ${announcement.id}`
                      .toLowerCase()
                      .includes(query.toLowerCase())
                : true;

            const matchesBudget =
                announcement.budget >= budgetMin &&
                (budgetMax === Infinity || announcement.budget <= budgetMax);

            const matchesOrganization = selectedOrganizations.length
                ? selectedOrganizations.includes(announcement.organization)
                : true;
            const matchesMethod = selectedMethods.length
                ? selectedMethods.includes(announcement.method)
                : true;
            const matchesCategory = selectedCategories.length
                ? selectedCategories.includes(announcement.category)
                : true;

            return (
                matchesQuery &&
                matchesBudget &&
                matchesOrganization &&
                matchesMethod &&
                matchesCategory
            );
        });
    }, [
        query,
        budgetMin,
        budgetMax,
        selectedOrganizations,
        selectedMethods,
        selectedCategories,
    ]);

    const sortedAnnouncements = useMemo(() => {
        const next = [...filteredAnnouncements];
        if (sort === 'งบสูง') {
            return next.sort((a, b) => b.budget - a.budget);
        }
        if (sort === 'งบต่ำ') {
            return next.sort((a, b) => a.budget - b.budget);
        }
        return next;
    }, [filteredAnnouncements, sort]);

    const totalPages = Math.ceil(sortedAnnouncements.length / ITEMS_PER_PAGE);
    const paginatedAnnouncements = sortedAnnouncements.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE,
    );

    const activeFilters = [
        ...selectedOrganizations.map((value) => ({
            type: 'องค์กร',
            value,
            onRemove: () =>
                setSelectedOrganizations((current) =>
                    current.filter((item) => item !== value),
                ),
        })),
        ...selectedMethods.map((value) => ({
            type: 'วิธีการ',
            value,
            onRemove: () =>
                setSelectedMethods((current) =>
                    current.filter((item) => item !== value),
                ),
        })),
        ...selectedCategories.map((value) => ({
            type: 'หมวดหมู่',
            value,
            onRemove: () =>
                setSelectedCategories((current) =>
                    current.filter((item) => item !== value),
                ),
        })),
    ];

    const clearAllFilters = () => {
        setSelectedOrganizations([]);
        setSelectedMethods([]);
        setSelectedCategories([]);
        setBudgetRange([0, 100]);
        setQuery('');
        setCurrentPage(1);
    };

    const hasActiveFilters = activeFilters.length > 0 || query.length > 0;

    const toggleFilter = (
        value: string,
        values: string[],
        setter: (next: string[]) => void,
    ) => {
        if (values.includes(value)) {
            setter(values.filter((item) => item !== value));
        } else {
            setter([...values, value]);
        }
        setCurrentPage(1);
    };

    return (
        <AppHeaderLayout>
            <Head title="ประกาศจัดซื้อจัดจ้าง" />
            <div className="flex flex-col gap-8 px-4 py-6 md:px-8">
                {/* Hero Section */}
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
                                        setQuery(event.target.value);
                                        setCurrentPage(1);
                                    }}
                                    placeholder="ค้นหาด้วยคำสำคัญ, เลขที่โครงการ หรือชื่อหน่วยงาน..."
                                    className="h-14 rounded-xl border-none bg-card pr-28 pl-12 text-base shadow-md ring-1 ring-border focus-visible:ring-2 focus-visible:ring-primary"
                                />
                                <Button className="absolute top-2 right-2 h-10 rounded-lg px-6">
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

                {/* Main Grid */}
                <div className="grid gap-8 lg:grid-cols-12">
                    {/* Filter Sidebar */}
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
                                {/* Budget Range */}
                                <div className="space-y-4">
                                    <h4 className="text-sm font-bold tracking-wide text-foreground uppercase">
                                        ช่วงงบประมาณ
                                    </h4>
                                    <div className="px-1">
                                        <Slider
                                            defaultValue={[0, 100]}
                                            value={budgetRange}
                                            onValueChange={(value) => {
                                                setBudgetRange(value);
                                                setCurrentPage(1);
                                            }}
                                            max={100}
                                            step={1}
                                            className="w-full"
                                        />
                                        <div className="mt-3 flex justify-between text-sm text-muted-foreground">
                                            <span>0 บาท</span>
                                            <span>50 ล้าน+</span>
                                        </div>
                                        <div className="mt-3 grid grid-cols-2 gap-2">
                                            <div className="relative">
                                                <span className="absolute top-2 left-2 text-xs text-muted-foreground">
                                                    ฿
                                                </span>
                                                <Input
                                                    placeholder="ต่ำสุด"
                                                    className="h-9 pl-6 text-sm"
                                                    value={
                                                        budgetRange[0] *
                                                            500000 || ''
                                                    }
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
                                                    value={
                                                        budgetRange[1] === 100
                                                            ? 'ไม่จำกัด'
                                                            : budgetRange[1] *
                                                              500000
                                                    }
                                                    readOnly
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Organizations */}
                                <div className="space-y-3">
                                    <h4 className="text-sm font-bold tracking-wide text-foreground uppercase">
                                        หน่วยงาน / ภาคส่วน
                                    </h4>
                                    <div className="custom-scrollbar max-h-48 space-y-2 overflow-y-auto pr-2">
                                        {organizations.map((org) => (
                                            <label
                                                key={org}
                                                className="group flex cursor-pointer items-start gap-3"
                                            >
                                                <Checkbox
                                                    checked={selectedOrganizations.includes(
                                                        org,
                                                    )}
                                                    onCheckedChange={() =>
                                                        toggleFilter(
                                                            org,
                                                            selectedOrganizations,
                                                            setSelectedOrganizations,
                                                        )
                                                    }
                                                />
                                                <span className="text-sm text-muted-foreground transition-colors group-hover:text-primary">
                                                    {org}
                                                </span>
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                {/* Procurement Methods */}
                                <div className="space-y-3">
                                    <h4 className="text-sm font-bold tracking-wide text-foreground uppercase">
                                        วิธีการจัดซื้อจัดจ้าง
                                    </h4>
                                    <div className="space-y-2">
                                        {methods.map((method) => (
                                            <label
                                                key={method}
                                                className="group flex cursor-pointer items-center gap-3"
                                            >
                                                <Checkbox
                                                    checked={selectedMethods.includes(
                                                        method,
                                                    )}
                                                    onCheckedChange={() =>
                                                        toggleFilter(
                                                            method,
                                                            selectedMethods,
                                                            setSelectedMethods,
                                                        )
                                                    }
                                                />
                                                <span className="text-sm text-muted-foreground transition-colors group-hover:text-primary">
                                                    {method}
                                                </span>
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                {/* Categories */}
                                <div className="space-y-3">
                                    <h4 className="text-sm font-bold tracking-wide text-foreground uppercase">
                                        หมวดหมู่ / ประเภทงาน
                                    </h4>
                                    <div className="space-y-2">
                                        {categories.map((cat) => (
                                            <label
                                                key={cat}
                                                className="group flex cursor-pointer items-center gap-3"
                                            >
                                                <Checkbox
                                                    checked={selectedCategories.includes(
                                                        cat,
                                                    )}
                                                    onCheckedChange={() =>
                                                        toggleFilter(
                                                            cat,
                                                            selectedCategories,
                                                            setSelectedCategories,
                                                        )
                                                    }
                                                />
                                                <span className="text-sm text-muted-foreground transition-colors group-hover:text-primary">
                                                    {cat}
                                                </span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </aside>

                    {/* Results */}
                    <div className="space-y-6 lg:col-span-9">
                        {/* Results Header */}
                        <div className="flex flex-col justify-between gap-4 rounded-xl border border-border bg-card p-4 md:flex-row md:items-center">
                            <div className="space-y-2">
                                <p className="flex items-center gap-2 text-sm text-muted-foreground">
                                    พบทั้งหมด
                                    <span className="text-lg font-bold text-foreground">
                                        {sortedAnnouncements.length}
                                    </span>
                                    รายการ
                                    <span className="mx-1 h-1 w-1 rounded-full bg-muted-foreground" />
                                    เรียงตาม
                                    <span className="cursor-pointer font-medium text-primary hover:underline">
                                        {sort}
                                    </span>
                                </p>
                                <div className="flex flex-wrap gap-2">
                                    {activeFilters.map((filter) => (
                                        <Badge
                                            key={`${filter.type}-${filter.value}`}
                                            variant="secondary"
                                            className="gap-1.5 border border-primary/20 bg-primary/5 text-primary"
                                        >
                                            {filter.value}
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
                            </div>
                            <Select value={sort} onValueChange={setSort}>
                                <SelectTrigger className="w-[160px]">
                                    <SelectValue placeholder="เรียงตาม" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="ล่าสุด">
                                        ใหม่ล่าสุด
                                    </SelectItem>
                                    <SelectItem value="งบสูง">
                                        งบประมาณสูงสุด
                                    </SelectItem>
                                    <SelectItem value="งบต่ำ">
                                        งบประมาณต่ำสุด
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Announcement Cards */}
                        <div className="space-y-4">
                            {paginatedAnnouncements.map((announcement) => (
                                <article
                                    key={announcement.id}
                                    className={`group rounded-xl border bg-card p-5 shadow-sm transition-all duration-300 hover:border-primary/50 hover:shadow-md ${
                                        announcement.status === 'closed'
                                            ? 'border-border bg-muted/30 opacity-80 hover:opacity-100'
                                            : 'border-border'
                                    }`}
                                >
                                    <div className="flex flex-col gap-4">
                                        {/* Header */}
                                        <div className="flex items-start justify-between gap-4">
                                            <StatusBadge
                                                status={announcement.status}
                                            />
                                            <span className="font-mono text-xs text-muted-foreground">
                                                ID: {announcement.id}
                                            </span>
                                        </div>

                                        {/* Title */}
                                        <h3 className="text-lg font-bold text-foreground transition-colors group-hover:text-primary">
                                            {announcement.title}
                                        </h3>

                                        {/* Meta Info */}
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
                                                    {announcement.method}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Footer */}
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
                                                    <p
                                                        className={`flex items-center gap-1 text-sm font-semibold ${
                                                            announcement.status ===
                                                            'urgent'
                                                                ? 'text-amber-600'
                                                                : announcement.status ===
                                                                    'closed'
                                                                  ? 'text-muted-foreground'
                                                                  : 'text-foreground'
                                                        }`}
                                                    >
                                                        <CalendarDays className="h-4 w-4" />
                                                        {announcement.deadline}
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

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="mt-8">
                                <Pagination
                                    currentPage={currentPage}
                                    totalPages={totalPages}
                                    onPageChange={setCurrentPage}
                                />
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AppHeaderLayout>
    );
}
