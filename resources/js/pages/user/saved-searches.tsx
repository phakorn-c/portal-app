import { Head, Link, usePage, router } from '@inertiajs/react';
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
    Trash2,
    Edit,
    BellRing,
    BellOff,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatusBadge } from '@/components/ui/status-badge';
import AppHeaderLayout from '@/layouts/app/app-header-layout';
import type { SharedData } from '@/types';
import type { FilterState } from '@/types/procurement';
import { Pagination } from '@/components/ui/pagination';
import { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

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
        active: true,
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
function serializeCriteria(criteria: FilterState | Record<string, any>): string {
    const params = new URLSearchParams();
    if (criteria.query) params.set('query', criteria.query as string);
    if ('keyword' in criteria && criteria.keyword) params.set('keyword', criteria.keyword as string);
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

export default function UserSavedSearches({
    savedSearches,
}: {
    savedSearches: any;
}) {
    const { auth } = usePage<SharedData>().props;
    const user = auth.user;

    const [editingSearch, setEditingSearch] = useState<any>(null);
    const [editName, setEditName] = useState('');
    const [editAlertEnabled, setEditAlertEnabled] = useState(false);
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    const handleDelete = (id: string) => {
        if (confirm('คุณแน่ใจหรือไม่ที่จะลบการค้นหานี้?')) {
            router.delete(`/user/saved-searches/${id}`);
        }
    };

    const openEditDialog = (search: any) => {
        setEditingSearch(search);
        setEditName(search.name);
        setEditAlertEnabled(search.alert_enabled);
        setIsDialogOpen(true);
    };

    const handleUpdate = () => {
        if (editingSearch) {
            router.put(
                `/user/saved-searches/${editingSearch.id}`,
                {
                    name: editName,
                    criteria: editingSearch.criteria,
                    alert_enabled: editAlertEnabled,
                },
                {
                    onSuccess: () => {
                        setIsDialogOpen(false);
                        setEditingSearch(null);
                    },
                },
            );
        }
    };

    const handleToggleAlert = (search: any) => {
        router.put(`/user/saved-searches/${search.id}`, {
            name: search.name,
            criteria: search.criteria,
            alert_enabled: !search.alert_enabled,
        });
    };

    return (
        <AppHeaderLayout>
            <Head title="การค้นหาที่บันทึกไว้" />
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
                        <div className="flex items-center justify-between">
                            <div>
                                <h1 className="text-3xl font-black tracking-tight text-foreground">
                                    การค้นหาที่บันทึกไว้
                                </h1>
                                <p className="mt-1 text-muted-foreground">
                                    จัดการการค้นหาและการแจ้งเตือนของคุณ
                                </p>
                            </div>
                            <Button asChild>
                                <Link href="/procurement">
                                    <Plus className="mr-2 h-4 w-4" />
                                    ค้นหาใหม่
                                </Link>
                            </Button>
                        </div>

                        <Card>
                            <CardContent className="p-0">
                                <div className="divide-y divide-border">
                                    {savedSearches.data.map((search: any) => (
                                        <div
                                            key={search.id}
                                            className="flex flex-col justify-between gap-4 p-6 transition-colors hover:bg-muted/50 sm:flex-row sm:items-center"
                                            data-test="saved-search-row"
                                        >
                                            <div className="flex items-start gap-4">
                                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                                    <Bookmark className="h-5 w-5" />
                                                </div>
                                                <div>
                                                    <h3 className="text-lg font-semibold text-foreground">
                                                        {search.name}
                                                    </h3>
                                                    <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                                                        <span>
                                                            บันทึกเมื่อ{' '}
                                                            {new Date(
                                                                search.created_at,
                                                            ).toLocaleDateString(
                                                                'th-TH',
                                                            )}
                                                        </span>
                                                        <span>•</span>
                                                        <span className="flex items-center gap-1">
                                                            {search.alert_enabled ? (
                                                                <span className="flex items-center text-emerald-600">
                                                                    <BellRing className="mr-1 h-3 w-3" />
                                                                    เปิดแจ้งเตือน
                                                                </span>
                                                            ) : (
                                                                <span className="flex items-center text-muted-foreground">
                                                                    <BellOff className="mr-1 h-3 w-3" />
                                                                    ปิดแจ้งเตือน
                                                                </span>
                                                            )}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2 self-end sm:self-auto">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() =>
                                                        handleToggleAlert(
                                                            search,
                                                        )
                                                    }
                                                    title={
                                                        search.alert_enabled
                                                            ? 'ปิดการแจ้งเตือน'
                                                            : 'เปิดการแจ้งเตือน'
                                                    }
                                                >
                                                    {search.alert_enabled ? (
                                                        <BellOff className="h-4 w-4" />
                                                    ) : (
                                                        <BellRing className="h-4 w-4" />
                                                    )}
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() =>
                                                        openEditDialog(search)
                                                    }
                                                >
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                                                    onClick={() =>
                                                        handleDelete(search.id)
                                                    }
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    asChild
                                                    size="sm"
                                                    data-test="run-saved-search-button"
                                                >
                                                    <Link
                                                        href={`/procurement?${serializeCriteria(search.criteria)}`}
                                                    >
                                                        <Search className="mr-2 h-4 w-4" />
                                                        ค้นหา
                                                    </Link>
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                    {savedSearches.data.length === 0 && (
                                        <div className="p-12 text-center">
                                            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                                                <Bookmark className="h-6 w-6 text-muted-foreground" />
                                            </div>
                                            <h3 className="mt-4 text-lg font-semibold">
                                                ยังไม่มีการค้นหาที่บันทึกไว้
                                            </h3>
                                            <p className="mt-2 text-sm text-muted-foreground">
                                                คุณสามารถบันทึกการค้นหาจากหน้าประกาศจัดซื้อจัดจ้างเพื่อกลับมาดูภายหลังได้
                                            </p>
                                            <Button asChild className="mt-6">
                                                <Link href="/procurement">
                                                    ไปที่หน้าค้นหา
                                                </Link>
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        {savedSearches.last_page > 1 && (
                            <div className="mt-4">
                                <Pagination
                                    currentPage={savedSearches.current_page}
                                    totalPages={savedSearches.last_page}
                                    onPageChange={(page) => {
                                        window.location.href = `/user/saved-searches?page=${page}`;
                                    }}
                                />
                            </div>
                        )}
                    </div>
                </main>
            </div>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>แก้ไขการค้นหาที่บันทึกไว้</DialogTitle>
                        <DialogDescription>
                            เปลี่ยนชื่อหรือตั้งค่าการแจ้งเตือนสำหรับการค้นหานี้
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="name">ชื่อการค้นหา</Label>
                            <Input
                                id="name"
                                value={editName}
                                onChange={(e) => setEditName(e.target.value)}
                            />
                        </div>
                        <div className="flex items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                                <Label className="text-base">
                                    การแจ้งเตือน
                                </Label>
                                <p className="text-sm text-muted-foreground">
                                    รับการแจ้งเตือนเมื่อมีประกาศใหม่ที่ตรงกับเงื่อนไข
                                </p>
                            </div>
                            <Switch
                                checked={editAlertEnabled}
                                onCheckedChange={setEditAlertEnabled}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setIsDialogOpen(false)}
                        >
                            ยกเลิก
                        </Button>
                        <Button onClick={handleUpdate}>บันทึก</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppHeaderLayout>
    );
}
