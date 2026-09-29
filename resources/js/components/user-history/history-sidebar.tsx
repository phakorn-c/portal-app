import { Link } from '@inertiajs/react';
import {
    Bell,
    Bookmark,
    FileText,
    History,
    LayoutDashboard,
    Settings,
    User,
} from 'lucide-react';
import type { SharedData } from '@/types';

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
] as const;

export function HistorySidebar({ user }: { user: SharedData['auth']['user'] }) {
    return (
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
    );
}
