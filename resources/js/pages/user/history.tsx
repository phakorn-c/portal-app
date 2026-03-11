import { Head, Link, usePage } from '@inertiajs/react';
import {
    Bell,
    Bookmark,
    ChevronRight,
    Clock,
    Download,
    Eye,
    FileText,
    History,
    LayoutDashboard,
    Plus,
    Settings,
    TrendingUp,
    User,
    Search,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatusBadge } from '@/components/ui/status-badge';
import AppHeaderLayout from '@/layouts/app/app-header-layout';
import type { SharedData } from '@/types';
import type { FilterState } from '@/types/procurement';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Pagination } from '@/components/ui/pagination';

const sidebarNav = [
    {
        icon: LayoutDashboard,
        label: 'แผงควบคุม',
        href: '/user/dashboard',
        active: false,
    },
    {
        icon: FileText,
        label: 'ประกาศจัดซื้อจัดจ้าง',
        href: '/procurement',
        active: false,
    },
    {
        icon: Bookmark,
        label: 'การค้นหาที่บันทึกไว้',
        href: '/user/saved-searches',
        active: false,
    },
    {
        icon: History,
        label: 'ประวัติการเข้าชม',
        href: '/user/history',
        active: true,
    },
    {
        icon: Bell,
        label: 'การแจ้งเตือน',
        href: '/user/notifications',
        active: false,
    },
    {
        icon: User,
        label: 'ข้อมูลส่วนตัว',
        href: '/settings/profile',
        active: false,
    },
];

function formatBudget(amount: number) {
    return amount.toLocaleString('th-TH');
}
function serializeCriteria(criteria: FilterState | Record<string, any>): string {
    const params = new URLSearchParams();
    if (criteria.query) params.set('query', criteria.query as string);
    if ('keyword' in criteria && (criteria as any).keyword) params.set('keyword', (criteria as any).keyword as string);
    if (Array.isArray(criteria.organizations)) {
        criteria.organizations.forEach((val: string) => params.append('organization[]', val));
    }
    if (Array.isArray(criteria.methods)) {
        criteria.methods.forEach((val: string) => params.append('method[]', val));
    }
    if (Array.isArray(criteria.categories)) {
        criteria.categories.forEach((val: string) => params.append('category[]', val));
    }
    if (criteria.budgetRange?.[0] > 0) {
        params.set('budget_min', String(criteria.budgetRange[0]));
    }
    if (criteria.budgetRange?.[1] > 0) {
        params.set('budget_max', String(criteria.budgetRange[1]));
    }
    if (criteria.sortBy) {
        params.set('sort', criteria.sortBy as string);
    }
    return params.toString();
}

export default function UserHistory({
    listingHistory,
    searchHistory,
}: {
    listingHistory: any;
    searchHistory: any;
}) {
    const { auth } = usePage<SharedData>().props;
    const user = auth.user;

    return (
        <AppHeaderLayout>
            <Head title="ประวัติการเข้าชม" />
            <div className="flex min-h-[calc(100vh-4rem)]">
                <aside className="hidden w-72 shrink-0 border-r border-border bg-card lg:block">
                    <div className="flex h-full flex-col">
                        <div className="border-b border-border p-6">
                            <div className="flex items-center gap-4">
                                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-lg font-bold text-primary-foreground">
                                    {user?.name?.charAt(0) || 'U'}
                                </div>
                                <div className="flex-1 overflow-hidden">
                                    <p className="truncate font-semibold text-foreground">
                                        {user?.name || 'ผู้ใช้งาน'}
                                    </p>
                                    <p className="truncate text-sm text-muted-foreground">
                                        {user?.email || 'user@example.com'}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <nav className="flex-1 space-y-1 p-4">
                            {sidebarNav.map((item) => (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={`flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors ${
                                        item.active
                                            ? 'bg-primary/10 text-primary'
                                            : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                                    }`}
                                >
                                    <item.icon className="h-5 w-5" />
                                    {item.label}
                                </Link>
                            ))}
                        </nav>

                        <div className="border-t border-border p-4">
                            <Link
                                href="/settings"
                                className="flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                            >
                                <Settings className="h-5 w-5" />
                                ตั้งค่า
                            </Link>
                        </div>
                    </div>
                </aside>

                <main className="flex-1 overflow-y-auto">
                    <div className="flex flex-col gap-8 p-6 md:p-8">
                        <div>
                            <h1 className="text-3xl font-black tracking-tight text-foreground">
                                ประวัติการเข้าชม
                            </h1>
                            <p className="mt-1 text-muted-foreground">
                                ประวัติการดูประกาศและการค้นหาของคุณ
                            </p>
                        </div>

                        <Tabs defaultValue="listings" className="w-full">
                            <TabsList className="mb-4">
                                <TabsTrigger value="listings">
                                    ประวัติการดูประกาศ
                                </TabsTrigger>
                                <TabsTrigger value="searches">
                                    ประวัติการค้นหา
                                </TabsTrigger>
                            </TabsList>

                            <TabsContent value="listings">
                                <Card>
                                    <CardContent className="p-0">
                                        <div className="divide-y divide-border">
                                            {listingHistory.data.map(
                                                (item: any) => (
                                                    <Link
                                                        key={item.id}
                                                        href={`/procurement/announcements/${item.announcement.id}`}
                                                        className="group flex items-start gap-4 p-4 transition-colors hover:bg-muted"
                                                        data-test="history-row"
                                                    >
                                                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                                            <FileText className="h-5 w-5" />
                                                        </div>
                                                        <div className="min-w-0 flex-1">
                                                            <div className="flex items-center gap-2">
                                                                <StatusBadge
                                                                    status={
                                                                        item
                                                                            .announcement
                                                                            .status
                                                                    }
                                                                />
                                                                <span className="text-xs text-muted-foreground">
                                                                    {new Date(
                                                                        item.viewed_at,
                                                                    ).toLocaleDateString(
                                                                        'th-TH',
                                                                        {
                                                                            year: 'numeric',
                                                                            month: 'short',
                                                                            day: 'numeric',
                                                                            hour: '2-digit',
                                                                            minute: '2-digit',
                                                                        },
                                                                    )}
                                                                </span>
                                                            </div>
                                                            <p className="mt-1 truncate font-medium text-foreground group-hover:text-primary">
                                                                {
                                                                    item
                                                                        .announcement
                                                                        .title
                                                                }
                                                            </p>
                                                            <p className="mt-0.5 text-sm text-muted-foreground">
                                                                {
                                                                    item
                                                                        .announcement
                                                                        .organization
                                                                }{' '}
                                                                · ฿
                                                                {formatBudget(
                                                                    item
                                                                        .announcement
                                                                        .budget,
                                                                )}
                                                            </p>
                                                        </div>
                                                        <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary" />
                                                    </Link>
                                                ),
                                            )}
                                            {listingHistory.data.length ===
                                                0 && (
                                                <div className="p-8 text-center text-muted-foreground">
                                                    ยังไม่มีประวัติการดูประกาศ
                                                </div>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                                {listingHistory.last_page > 1 && (
                                    <div className="mt-4">
                                        <Pagination
                                            currentPage={
                                                listingHistory.current_page
                                            }
                                            totalPages={
                                                listingHistory.last_page
                                            }
                                            onPageChange={(page) => {
                                                window.location.href = `/user/history?listing_page=${page}`;
                                            }}
                                        />
                                    </div>
                                )}
                            </TabsContent>

                            <TabsContent value="searches">
                                <Card>
                                    <CardContent className="p-0">
                                        <div className="divide-y divide-border">
                                            {searchHistory.data.map(
                                                (item: any) => (
                                                    <Link
                                                        key={item.id}
                                                        href={`/procurement?${serializeCriteria(item.criteria)}`}
                                                        className="group flex items-start gap-4 p-4 transition-colors hover:bg-muted"
                                                        data-test="history-row"
                                                    >
                                                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                                            <Search className="h-5 w-5" />
                                                        </div>
                                                        <div className="min-w-0 flex-1">
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-xs text-muted-foreground">
                                                                    {new Date(
                                                                        item.searched_at,
                                                                    ).toLocaleDateString(
                                                                        'th-TH',
                                                                        {
                                                                            year: 'numeric',
                                                                            month: 'short',
                                                                            day: 'numeric',
                                                                            hour: '2-digit',
                                                                            minute: '2-digit',
                                                                        },
                                                                    )}
                                                                </span>
                                                            </div>
                                                            <p className="mt-1 truncate font-medium text-foreground group-hover:text-primary">
                                                                {item.criteria
                                                                    .query ||
                                                                    'ค้นหาทั้งหมด'}
                                                            </p>
                                                            <p className="mt-0.5 text-sm text-muted-foreground">
                                                                พบ{' '}
                                                                {
                                                                    item.result_count
                                                                }{' '}
                                                                รายการ
                                                            </p>
                                                        </div>
                                                        <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary" />
                                                    </Link>
                                                ),
                                            )}
                                            {searchHistory.data.length ===
                                                0 && (
                                                <div className="p-8 text-center text-muted-foreground">
                                                    ยังไม่มีประวัติการค้นหา
                                                </div>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                                {searchHistory.last_page > 1 && (
                                    <div className="mt-4">
                                        <Pagination
                                            currentPage={
                                                searchHistory.current_page
                                            }
                                            totalPages={searchHistory.last_page}
                                            onPageChange={(page) => {
                                                window.location.href = `/user/history?search_page=${page}`;
                                            }}
                                        />
                                    </div>
                                )}
                            </TabsContent>
                        </Tabs>
                    </div>
                </main>
            </div>
        </AppHeaderLayout>
    );
}
