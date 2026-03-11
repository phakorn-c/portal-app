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
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatusBadge } from '@/components/ui/status-badge';
import { Timeline, type TimelineItem } from '@/components/ui/timeline';
import AppHeaderLayout from '@/layouts/app/app-header-layout';
import type { SharedData } from '@/types';
import type { FilterState } from '@/types/procurement';



const activityTimeline: TimelineItem[] = [
    {
        date: 'วันนี้ 14:30',
        title: 'ดาวน์โหลดเอกสาร TOR',
        description: 'โครงการก่อสร้างถนน #66107382',
        status: 'completed',
    },
    {
        date: 'วันนี้ 10:15',
        title: 'บันทึกการค้นหาใหม่',
        description: '"ก่อสร้าง งบ > 5 ล้าน"',
        status: 'completed',
    },
    {
        date: 'เมื่อวาน 16:45',
        title: 'ดูรายละเอียดประกาศ',
        description: 'โครงการจัดซื้อครุภัณฑ์ #66109221',
        status: 'completed',
    },
    {
        date: 'เมื่อวาน 09:00',
        title: 'ตั้งการแจ้งเตือนใหม่',
        description: 'หมวดหมู่: เครื่องมือแพทย์',
        status: 'completed',
    },
];

const sidebarNav = [
    {
        icon: LayoutDashboard,
        label: 'แผงควบคุม',
        href: '/user/dashboard',
        active: true,
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
        active: false,
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

export default function UserDashboard({
    savedSearchCount,
    recentSavedSearches,
    listingHistory,
    searchHistoryCount,
}: {
    savedSearchCount: number;
    recentSavedSearches: any[];
    listingHistory: any[];
    searchHistoryCount: number;
}) {
    const { auth } = usePage<SharedData>().props;
    const user = auth.user;

    // Map real data to stats
    const realStats = [
        {
            label: 'ติดตามประกาศ',
            value: listingHistory.length.toString(),
            change: 'ดูล่าสุด',
            changeType: 'neutral' as const,
            icon: Eye,
            color: 'bg-blue-500',
        },
        {
            label: 'บันทึกไว้',
            value: savedSearchCount.toString(),
            change: 'การค้นหา',
            changeType: 'positive' as const,
            icon: Bookmark,
            color: 'bg-emerald-500',
        },
        {
            label: 'ประวัติการค้นหา',
            value: searchHistoryCount.toString(),
            change: 'ครั้ง',
            changeType: 'neutral' as const,
            icon: History,
            color: 'bg-amber-500',
        },
        {
            label: 'ดาวน์โหลดเอกสาร',
            value: '0',
            change: 'เดือนนี้',
            changeType: 'neutral' as const,
            icon: Download,
            color: 'bg-violet-500',
        },
    ];

    // Map real data to recently viewed
    const realRecentlyViewed = listingHistory.map((history) => ({
        id: history.announcement.id,
        title: history.announcement.title,
        organization: history.announcement.organization,
        budget: history.announcement.budget,
        status: history.announcement.status,
        viewedAt: new Date(history.viewed_at).toLocaleDateString('th-TH', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        }),
    }));

    // Map real data to saved searches
    const realSavedSearches = recentSavedSearches.map((search) => ({
        label: search.name,
        count: 0, // We don't have a count of results for saved searches easily available here
        criteria: search.criteria,
    }));
    return (
        <AppHeaderLayout>
            <Head title="แผงควบคุมผู้ใช้งาน" />
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
                                แผงควบคุมผู้ใช้งาน
                            </h1>
                            <p className="mt-1 text-muted-foreground">
                                ติดตามประกาศ จัดการการค้นหา และดูกิจกรรมของคุณ
                            </p>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                            {realStats.map((stat) => (
                                <Card
                                    key={stat.label}
                                    className="relative overflow-hidden"
                                >
                                    <CardContent className="pt-6">
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <p className="text-sm text-muted-foreground">
                                                    {stat.label}
                                                </p>
                                                <p className="mt-1 text-3xl font-bold text-foreground">
                                                    {stat.value}
                                                </p>
                                                <p
                                                    className={`mt-1 text-xs ${
                                                        stat.changeType === 'positive'
                                                            ? 'text-emerald-600'
                                                            : 'text-muted-foreground'
                                                    }`}
                                                >
                                                    {stat.change}
                                                </p>
                                            </div>
                                            <div
                                                className={`flex h-12 w-12 items-center justify-center rounded-xl ${stat.color} text-white`}
                                            >
                                                <stat.icon className="h-6 w-6" />
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>

                        <div className="grid gap-6 xl:grid-cols-3">
                            <div className="space-y-6 xl:col-span-2">
                                <Card>
                                    <CardHeader className="flex flex-row items-center justify-between">
                                        <CardTitle className="text-lg">
                                            การค้นหาที่บันทึกไว้
                                        </CardTitle>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="gap-1"
                                        >
                                            <Plus className="h-4 w-4" />
                                            เพิ่มใหม่
                                        </Button>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="flex flex-wrap gap-2">
                                            {realSavedSearches.map((search) => (
                                                <Link
                                                    key={search.label}
                                                    href={`/procurement?${serializeCriteria(search.criteria)}`}
                                                    className="inline-flex items-center gap-2 rounded-full border border-border bg-muted/50 px-4 py-2 text-sm font-medium text-foreground transition-colors hover:border-primary hover:bg-primary/5 hover:text-primary"
                                                >
                                                    {search.label}
                                                </Link>
                                            ))}
                                            {realSavedSearches.length === 0 && (
                                                <p className="text-sm text-muted-foreground">ยังไม่มีการค้นหาที่บันทึกไว้</p>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader className="flex flex-row items-center justify-between">
                                        <CardTitle className="text-lg">
                                            ดูล่าสุด
                                        </CardTitle>
                                        <Link
                                            href="/user/history"
                                            className="text-sm text-primary hover:underline"
                                        >
                                            ดูทั้งหมด
                                        </Link>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        {realRecentlyViewed.map((item) => (
                                            <Link
                                                key={item.id}
                                                href={`/procurement/announcements/${item.id}`}
                                                className="group flex items-start gap-4 rounded-lg p-3 transition-colors hover:bg-muted"
                                            >
                                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                                    <FileText className="h-5 w-5" />
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <div className="flex items-center gap-2">
                                                        <StatusBadge
                                                            status={item.status}
                                                        />
                                                        <span className="text-xs text-muted-foreground">
                                                            {item.viewedAt}
                                                        </span>
                                                    </div>
                                                    <p className="mt-1 truncate font-medium text-foreground group-hover:text-primary">
                                                        {item.title}
                                                    </p>
                                                    <p className="mt-0.5 text-sm text-muted-foreground">
                                                        {item.organization} · ฿
                                                        {formatBudget(
                                                            item.budget,
                                                        )}
                                                    </p>
                                                </div>
                                                <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary" />
                                            </Link>
                                        ))}
                                        {realRecentlyViewed.length === 0 && (
                                            <p className="text-sm text-muted-foreground">ยังไม่มีประวัติการเข้าชม</p>
                                        )}
                                    </CardContent>
                                </Card>
                            </div>

                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg">
                                        กิจกรรมล่าสุด
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <Timeline items={activityTimeline} />
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </main>
            </div>
        </AppHeaderLayout>
    );
}
