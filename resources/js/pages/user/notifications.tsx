import { Head, Link, router, usePage } from '@inertiajs/react';
import {
    Bell,
    Bookmark,
    FileText,
    History,
    LayoutDashboard,
    Mail,
    Settings,
    User,
} from 'lucide-react';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import AppHeaderLayout from '@/layouts/app/app-header-layout';
import type { SharedData } from '@/types';
import type { FilterState, SavedSearch } from '@/types/procurement';

type NotificationPreference = {
    website_enabled: boolean;
    email_enabled: boolean;
};

type NotificationItem = {
    id: string;
    type: string;
    data: {
        announcement_id: number;
        announcement_title: string;
        saved_search_id: number;
        saved_search_name: string;
    };
    read_at: string | null;
    created_at: string;
};

type NotificationPaginator = {
    data: NotificationItem[];
    current_page: number;
    last_page: number;
};

type PageProps = SharedData & {
    notifications: NotificationPaginator;
    preferences: NotificationPreference;
    alerts: SavedSearch[];
};

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
        active: false,
    },
    {
        icon: Bell,
        label: 'การแจ้งเตือน',
        href: '/user/notifications',
        active: true,
    },
    {
        icon: User,
        label: 'ข้อมูลส่วนตัว',
        href: '/settings/profile',
        active: false,
    },
];

function formatTimestamp(value: string): string {
    return new Date(value).toLocaleString('th-TH');
}

function describeCriteria(criteria: FilterState): string {
    const parts: string[] = [];

    if (criteria.query.trim() !== '') {
        parts.push(`คีย์เวิร์ด: ${criteria.query}`);
    }

    if (criteria.organizations.length > 0) {
        parts.push(`หน่วยงาน: ${criteria.organizations.join(', ')}`);
    }

    if (criteria.categories.length > 0) {
        parts.push(`หมวดหมู่: ${criteria.categories.join(', ')}`);
    }

    if (criteria.methods.length > 0) {
        parts.push(`วิธีจัดซื้อ: ${criteria.methods.join(', ')}`);
    }

    parts.push(
        `งบประมาณ: ${criteria.budgetRange[0]} - ${criteria.budgetRange[1]} บาท`,
    );

    return parts.join(' | ');
}

export default function NotificationSettings() {
    const { auth, notifications, preferences, alerts } =
        usePage<PageProps>().props;
    const user = auth.user;
    const [currentPreferences, setCurrentPreferences] =
        useState<NotificationPreference>(preferences);

    const updatePreference = async (next: NotificationPreference) => {
        const previous = currentPreferences;
        const csrfToken = document
            .querySelector('meta[name="csrf-token"]')
            ?.getAttribute('content');

        setCurrentPreferences(next);

        const headers: Record<string, string> = {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
        };

        if (csrfToken) {
            headers['X-CSRF-TOKEN'] = csrfToken;
        }

        const response = await window.fetch('/user/notification-preferences', {
            method: 'PUT',
            credentials: 'same-origin',
            headers,
            body: JSON.stringify(next),
        });

        if (!response.ok) {
            setCurrentPreferences(previous);
        }
    };

    return (
        <AppHeaderLayout>
            <Head title="ตั้งค่าการแจ้งเตือน" />
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
                                ตั้งค่าการแจ้งเตือน
                            </h1>
                            <p className="mt-1 text-muted-foreground">
                                จัดการการแจ้งเตือนจากประกาศใหม่ที่ตรงกับการค้นหาที่บันทึกไว้
                            </p>
                        </div>

                        <div className="grid gap-6 xl:grid-cols-3">
                            <div className="space-y-6 xl:col-span-2">
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            การแจ้งเตือนปัจจุบัน
                                            <Badge
                                                variant="secondary"
                                                className="ml-2"
                                            >
                                                {alerts.length} รายการ
                                            </Badge>
                                        </CardTitle>
                                        <CardDescription>
                                            เงื่อนไขการแจ้งเตือนที่บันทึกไว้จาก
                                            Saved Searches
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        {alerts.map((alert) => (
                                            <div
                                                key={alert.id}
                                                data-test="notification-alert-row"
                                                className="rounded-lg border border-border p-4"
                                            >
                                                <p className="font-semibold text-foreground">
                                                    {alert.name}
                                                </p>
                                                <p className="mt-1 text-sm text-muted-foreground">
                                                    {describeCriteria(
                                                        alert.criteria,
                                                    )}
                                                </p>
                                                <p className="mt-2 text-xs text-muted-foreground">
                                                    แจ้งเตือนล่าสุด:{' '}
                                                    {alert.last_notified_at
                                                        ? formatTimestamp(
                                                              alert.last_notified_at,
                                                          )
                                                        : 'ยังไม่เคยแจ้งเตือน'}
                                                </p>
                                            </div>
                                        ))}
                                        {alerts.length === 0 && (
                                            <p className="text-sm text-muted-foreground">
                                                ยังไม่มีการแจ้งเตือนที่เปิดใช้งาน
                                            </p>
                                        )}
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader>
                                        <CardTitle>
                                            การแจ้งเตือนในระบบ
                                        </CardTitle>
                                        <CardDescription>
                                            ประวัติการแจ้งเตือนที่ถูกส่งเข้าระบบของคุณ
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-3">
                                        {notifications.data.map(
                                            (notification) => (
                                                <div
                                                    key={notification.id}
                                                    className="rounded-lg border border-border p-4"
                                                >
                                                    <div className="flex items-start justify-between gap-4">
                                                        <div>
                                                            <p className="font-medium text-foreground">
                                                                {
                                                                    notification
                                                                        .data
                                                                        .announcement_title
                                                                }
                                                            </p>
                                                            <p className="text-sm text-muted-foreground">
                                                                จากการค้นหา:{' '}
                                                                {
                                                                    notification
                                                                        .data
                                                                        .saved_search_name
                                                                }
                                                            </p>
                                                            <p className="mt-1 text-xs text-muted-foreground">
                                                                {formatTimestamp(
                                                                    notification.created_at,
                                                                )}
                                                            </p>
                                                        </div>
                                                        {!notification.read_at && (
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                onClick={() =>
                                                                    router.patch(
                                                                        `/user/notifications/${notification.id}/read`,
                                                                        {},
                                                                        {
                                                                            preserveScroll: true,
                                                                            preserveState: true,
                                                                        },
                                                                    )
                                                                }
                                                            >
                                                                ทำเครื่องหมายว่าอ่านแล้ว
                                                            </Button>
                                                        )}
                                                    </div>
                                                </div>
                                            ),
                                        )}

                                        {notifications.data.length === 0 && (
                                            <p className="text-sm text-muted-foreground">
                                                ยังไม่มีการแจ้งเตือนในระบบ
                                            </p>
                                        )}

                                        {notifications.last_page > 1 && (
                                            <div className="flex items-center justify-between pt-2 text-sm text-muted-foreground">
                                                <span>
                                                    หน้า{' '}
                                                    {notifications.current_page}{' '}
                                                    / {notifications.last_page}
                                                </span>
                                                <div className="flex gap-2">
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        disabled={
                                                            notifications.current_page <=
                                                            1
                                                        }
                                                        onClick={() =>
                                                            router.get(
                                                                '/user/notifications',
                                                                {
                                                                    page:
                                                                        notifications.current_page -
                                                                        1,
                                                                },
                                                            )
                                                        }
                                                    >
                                                        ก่อนหน้า
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        disabled={
                                                            notifications.current_page >=
                                                            notifications.last_page
                                                        }
                                                        onClick={() =>
                                                            router.get(
                                                                '/user/notifications',
                                                                {
                                                                    page:
                                                                        notifications.current_page +
                                                                        1,
                                                                },
                                                            )
                                                        }
                                                    >
                                                        ถัดไป
                                                    </Button>
                                                </div>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            </div>

                            <div className="space-y-6">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>
                                            ช่องทางการแจ้งเตือน
                                        </CardTitle>
                                        <CardDescription>
                                            เลือกวิธีรับการแจ้งเตือนที่ต้องการ
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-6">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
                                                    <Mail className="h-5 w-5" />
                                                </div>
                                                <div>
                                                    <p className="font-medium text-foreground">
                                                        อีเมล
                                                    </p>
                                                    <p className="text-sm text-muted-foreground">
                                                        รับการแจ้งเตือนทางอีเมล
                                                    </p>
                                                </div>
                                            </div>
                                            <Switch
                                                data-test="notification-channel-email"
                                                checked={
                                                    currentPreferences.email_enabled
                                                }
                                                onCheckedChange={(checked) =>
                                                    updatePreference({
                                                        ...currentPreferences,
                                                        email_enabled: checked,
                                                    })
                                                }
                                            />
                                        </div>

                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600">
                                                    <Bell className="h-5 w-5" />
                                                </div>
                                                <div>
                                                    <p className="font-medium text-foreground">
                                                        แจ้งเตือนในระบบ
                                                    </p>
                                                    <p className="text-sm text-muted-foreground">
                                                        แจ้งเตือนบนเว็บไซต์
                                                    </p>
                                                </div>
                                            </div>
                                            <Switch
                                                data-test="notification-channel-in-app"
                                                checked={
                                                    currentPreferences.website_enabled
                                                }
                                                onCheckedChange={(checked) =>
                                                    updatePreference({
                                                        ...currentPreferences,
                                                        website_enabled:
                                                            checked,
                                                    })
                                                }
                                            />
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </AppHeaderLayout>
    );
}
