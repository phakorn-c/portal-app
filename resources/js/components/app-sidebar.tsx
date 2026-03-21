import { Link, usePage } from '@inertiajs/react';
import { FileText, LayoutGrid, Shield, Bookmark, History, Bell } from 'lucide-react';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { dashboard } from '@/routes';
import type { NavItem, SharedData } from '@/types';


export function AppSidebar() {
    const page = usePage<SharedData>();
    const { auth } = page.props;

    const navItems: NavItem[] = [
        { title: 'ประกาศจัดซื้อจัดจ้าง', href: '/procurement', icon: FileText },
    ];

    if (auth?.capabilities?.isAdmin || auth?.capabilities?.isRegistered) {
        navItems.unshift({ title: 'Dashboard', href: dashboard(), icon: LayoutGrid });
        navItems.push(
            { title: 'Saved Searches', href: '/user/saved-searches', icon: Bookmark, 'data-test': 'nav-saved-searches-link' },
            { title: 'History', href: '/user/history', icon: History, 'data-test': 'nav-history-link' },
            { title: 'Notifications', href: '/user/notifications', icon: Bell, 'data-test': 'nav-notifications-link' }
        );
    }

    if (auth?.capabilities?.isAdmin) {
        navItems.push({ title: 'หน้าจัดการ (Admin)', href: '/admin', icon: Shield, 'data-test': 'nav-admin-link' });
    }

    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href={dashboard()} prefetch>
                                <span className="text-lg font-bold">{page.props.name}</span>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={navItems} />
            </SidebarContent>

            <SidebarFooter>
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
