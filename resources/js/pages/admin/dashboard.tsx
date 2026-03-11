import { Head, router, Link } from '@inertiajs/react';
import {
    Bell,
    ChevronDown,
    Download,
    Edit2,
    Eye,
    EyeOff,
    FileText,
    Filter,
    FolderOpen,
    Plus,
    Search,
    ShieldCheck,
    Trash2,
    Users,
} from 'lucide-react';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DataTable, type Column } from '@/components/ui/data-table';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Pagination } from '@/components/ui/pagination';
import { StatusBadge } from '@/components/ui/status-badge';
import AppHeaderLayout from '@/layouts/app/app-header-layout';

type Announcement = {
    id: string;
    title: string;
    organization: string;
    published_at: string | null;
    budget: number;
    status: 'open' | 'urgent' | 'closing' | 'closed';
    publication_status: 'draft' | 'published' | 'hidden';
};

type PaginatedData<T> = {
    data: T[];
    current_page: number;
    last_page: number;
    total: number;
    per_page: number;
};

type Stats = {
    total_announcements: number;
    published_announcements: number;
    draft_announcements: number;
    total_users: number;
};

interface AdminDashboardProps {
    announcements: PaginatedData<Announcement>;
    stats: Stats;
}
function formatBudget(amount: number) {
    return amount.toLocaleString('th-TH');
}

export default function AdminDashboard({ announcements, stats }: AdminDashboardProps) {
    const [searchQuery, setSearchQuery] = useState('');

    const handlePublishToggle = (item: Announcement) => {
        if (item.publication_status === 'published') {
            router.patch(route('admin.announcements.hide', item.id));
        } else {
            router.patch(route('admin.announcements.publish', item.id));
        }
    };

    const handleDelete = (item: Announcement) => {
        if (confirm('คุณแน่ใจหรือไม่ที่จะลบประกาศนี้?')) {
            router.delete(route('admin.announcements.destroy', item.id));
        }
    };

    const statCards = [
        {
            label: 'ประกาศทั้งหมด',
            value: stats.total_announcements,
            change: 'รายการทั้งหมดในระบบ',
            changeType: 'neutral' as const,
            icon: FolderOpen,
            color: 'text-slate-600',
            bgColor: 'bg-slate-100',
        },
        {
            label: 'ประกาศที่เผยแพร่แล้ว',
            value: stats.published_announcements,
            change: 'แสดงผลบนหน้าเว็บ',
            changeType: 'positive' as const,
            icon: FileText,
            color: 'text-emerald-600',
            bgColor: 'bg-emerald-50',
        },
        {
            label: 'ผู้ใช้งานทั้งหมด',
            value: stats.total_users,
            change: 'ผู้ใช้ในระบบ',
            changeType: 'neutral' as const,
            icon: Users,
            color: 'text-blue-600',
            bgColor: 'bg-blue-50',
        },
    ];
    const columns: Column<Announcement>[] = [
        {
            key: 'title',
            header: 'ชื่อโครงการ',
            cell: (item) => (
                <div className="max-w-md">
                    <p className="truncate font-medium text-foreground">
                        {item.title}
                    </p>
                    <p className="text-xs text-muted-foreground">
                        ID: {item.id}
                    </p>
                </div>
            ),
        },
        {
            key: 'organization',
            header: 'หน่วยงาน',
            cell: (item) => (
                <span className="text-muted-foreground">
                    {item.organization}
                </span>
            ),
        },
        {
            key: 'published_at',
            header: 'วันที่ประกาศ',
            cell: (item) => (
                <span className="text-muted-foreground">
                    {item.published_at ? new Date(item.published_at).toLocaleDateString('th-TH') : '-'}
                </span>
            ),
        },
        {
            key: 'budget',
            header: 'งบประมาณ',
            cell: (item) => (
                <span className="font-medium">
                    ฿{formatBudget(item.budget)}
                </span>
            ),
            className: 'text-right',
            headerClassName: 'text-right',
        },
        {
            key: 'status',
            header: 'สถานะ',
            cell: (item) => <StatusBadge status={item.status} />,
        },
        {
            key: 'actions',
            header: 'การดำเนินการ',
            cell: (item) => (
                <div className="flex items-center justify-end gap-1">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        title="แก้ไข"
                    >
                        <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        title={item.publication_status === 'published' ? 'ซ่อน' : 'เผยแพร่'}
                        onClick={() => handlePublishToggle(item)}
                        data-test="admin-announcement-publish"
                    >
                        {item.publication_status === 'published' ? (
                            <Eye className="h-4 w-4" />
                        ) : (
                            <EyeOff className="h-4 w-4" />
                        )}
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
                        title="ลบ"
                        onClick={() => handleDelete(item)}
                    >
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </div>
            ),
            className: 'text-right',
            headerClassName: 'text-right',
        },
    ];

    const filteredAnnouncements = announcements.data.filter(
        (item) =>
            item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.organization
                ?.toLowerCase()
                .includes(searchQuery.toLowerCase()) ||
            item.id.toString().includes(searchQuery),
    );
    return (
        <AppHeaderLayout>
            <Head title="Admin Dashboard" />
            <div className="flex flex-col gap-8 px-4 py-6 md:px-8">
                <div className="flex flex-col gap-6 rounded-2xl border border-border bg-card p-6 md:p-8">
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <div className="space-y-2">
                            <div className="flex items-center gap-2 text-sm font-semibold text-primary">
                                <ShieldCheck className="h-4 w-4" />
                                Admin Portal
                            </div>
                            <h1 className="text-2xl font-black tracking-tight text-foreground md:text-3xl">
                                หน้าจัดการประกาศการจัดซื้อจัดจ้าง
                            </h1>
                            <p className="text-sm text-muted-foreground">
                                ดูแลข้อมูลและควบคุมการประกาศทั้งหมดของจังหวัดขอนแก่น
                            </p>
                        </div>
                        <div className="flex gap-2">
                            <Button asChild variant="outline" className="gap-2 shadow-sm">
                                <Link href={route('admin.users.index')}>
                                    <Users className="h-4 w-4" />
                                    จัดการผู้ใช้งาน
                                </Link>
                            </Button>
                            <Button className="gap-2 shadow-sm">
                                <Plus className="h-4 w-4" />
                                เพิ่มประกาศใหม่
                            </Button>
                        </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-3">
                        {statCards.map((stat) => (
                            <Card key={stat.label}>
                                <CardContent className="flex items-center gap-4 pt-6">
                                    <div
                                        className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-xl ${stat.bgColor}`}
                                    >
                                        <stat.icon
                                            className={`h-7 w-7 ${stat.color}`}
                                        />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-sm text-muted-foreground">
                                            {stat.label}
                                        </p>
                                        <p className="text-3xl font-bold text-foreground">
                                            {stat.value}
                                        </p>
                                        <p
                                            className={`text-xs ${
                                                stat.changeType === 'positive'
                                                    ? 'text-emerald-600'
                                                    : stat.changeType ===
                                                        'warning'
                                                      ? 'text-amber-600'
                                                      : 'text-muted-foreground'
                                            }`}
                                        >
                                            {stat.change}
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>

                <Card>
                    <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <div>
                            <CardTitle className="text-xl">
                                รายการประกาศทั้งหมด
                            </CardTitle>
                            <p className="mt-1 text-sm text-muted-foreground">
                                จัดการประกาศจัดซื้อจัดจ้างทั้งหมดในระบบ
                            </p>
                        </div>
                        <div className="flex flex-wrap gap-3">
                            <div className="relative">
                                <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    placeholder="ค้นหาประกาศ..."
                                    className="w-full pl-9 md:w-64"
                                    value={searchQuery}
                                    onChange={(e) =>
                                        setSearchQuery(e.target.value)
                                    }
                                />
                            </div>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" className="gap-2">
                                        <Filter className="h-4 w-4" />
                                        ตัวกรอง
                                        <ChevronDown className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem>ทั้งหมด</DropdownMenuItem>
                                    <DropdownMenuItem>
                                        เปิดรับข้อเสนอ
                                    </DropdownMenuItem>
                                    <DropdownMenuItem>
                                        รอตรวจสอบ
                                    </DropdownMenuItem>
                                    <DropdownMenuItem>
                                        ปิดรับแล้ว
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                            <Button variant="outline" className="gap-2">
                                <Download className="h-4 w-4" />
                                ส่งออก
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="rounded-lg border border-border">
                            <DataTable
                                data={filteredAnnouncements}
                                columns={columns}
                                emptyMessage="ไม่พบประกาศที่ตรงกับการค้นหา"
                                getRowProps={(item) => ({
                                    'data-test': 'admin-announcement-row',
                                } as React.HTMLAttributes<HTMLTableRowElement>)}
                            />
                        </div>
                        <div className="mt-6 flex items-center justify-between">
                            <p className="text-sm text-muted-foreground">
                                แสดง {filteredAnnouncements.length} จาก{' '}
                                {announcements.total} รายการ
                            </p>
                            <Pagination
                                currentPage={announcements.current_page}
                                totalPages={announcements.last_page}
                                onPageChange={(page) => {
                                    router.get(
                                        route('admin.dashboard'),
                                        { page },
                                        { preserveState: true }
                                    );
                                }}
                            />
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AppHeaderLayout>
    );
}
