import { Head, router, Link, useForm } from '@inertiajs/react';
import {
    ChevronDown,
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
import { useState, useEffect } from 'react';
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
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import * as announcementRoutes from '@/routes/admin/announcements';
import * as adminRoutes from '@/routes/admin';
import * as userRoutes from '@/routes/admin/users';

type Announcement = {
    id: string;
    title: string;
    description?: string;
    organization: string;
    method: string;
    category: string;
    budget: number;
    deadline: string;
    published_at: string | null;
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

type TaxonomyOption = { value: string; label: string };

interface AdminDashboardProps {
    announcements: PaginatedData<Announcement>;
    stats: Stats;
    taxonomy: {
        organizations: TaxonomyOption[];
        methods: TaxonomyOption[];
        categories: TaxonomyOption[];
    };
}
function formatBudget(amount: number) {
    return amount.toLocaleString('th-TH');
}
type AnnouncementModalProps = {
    isOpen: boolean;
    onClose: () => void;
    announcement?: Announcement | null;
    taxonomy: AdminDashboardProps['taxonomy'];
};

function AnnouncementModal({
    isOpen,
    onClose,
    announcement,
    taxonomy,
}: AnnouncementModalProps) {
    const isEdit = !!announcement;

    const { data, setData, post, processing, errors, reset, clearErrors } =
        useForm({
            _method: isEdit ? 'PUT' : 'POST',
            title: '',
            description: '',
            organization: '',
            method: 'e-bidding',
            category: 'goods',
            budget: 0,
            deadline: '',
            status: 'open',
            publication_status: 'draft',
            attachment: null as File | null,
        });

    useEffect(() => {
        if (isOpen) {
            setData({
                _method: isEdit ? 'PUT' : 'POST',
                title: announcement?.title || '',
                description: announcement?.description || '',
                organization: announcement?.organization || '',
                method: announcement?.method || 'e-bidding',
                category: announcement?.category || 'goods',
                budget: announcement?.budget || 0,
                deadline: announcement?.deadline
                    ? announcement.deadline.split('T')[0].split(' ')[0]
                    : '',
                status: announcement?.status || 'open',
                publication_status: announcement?.publication_status || 'draft',
                attachment: null,
            });
            clearErrors();
        }
    }, [isOpen, announcement]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (isEdit && announcement) {
            post(announcementRoutes.update.url(announcement.id), {
                forceFormData: true,
                onSuccess: () => {
                    reset();
                    onClose();
                },
            });
        } else {
            post(announcementRoutes.store.url(), {
                forceFormData: true,
                onSuccess: () => {
                    reset();
                    onClose();
                },
            });
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>
                        {isEdit ? 'แก้ไขประกาศ' : 'เพิ่มประกาศใหม่'}
                    </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2 space-y-2">
                            <Label htmlFor="title">ชื่อโครงการ</Label>
                            <Input
                                id="title"
                                value={data.title}
                                onChange={(e) =>
                                    setData('title', e.target.value)
                                }
                            />
                            {errors.title && (
                                <p className="text-sm text-destructive">
                                    {errors.title}
                                </p>
                            )}
                        </div>
                        <div className="col-span-2 space-y-2">
                            <Label htmlFor="description">รายละเอียด</Label>
                            <textarea
                                id="description"
                                className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                                value={data.description}
                                onChange={(e) =>
                                    setData('description', e.target.value)
                                }
                            />
                            {errors.description && (
                                <p className="text-sm text-destructive">
                                    {errors.description}
                                </p>
                            )}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="organization">หน่วยงาน</Label>
                            <Select
                                value={data.organization}
                                onValueChange={(value) =>
                                    setData('organization', value)
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="เลือกหน่วยงาน" />
                                </SelectTrigger>
                                <SelectContent>
                                    {taxonomy.organizations.map(
                                        (organization) => (
                                            <SelectItem
                                                key={organization.value}
                                                value={organization.value}
                                            >
                                                {organization.label}
                                            </SelectItem>
                                        ),
                                    )}
                                </SelectContent>
                            </Select>
                            {errors.organization && (
                                <p className="text-sm text-destructive">
                                    {errors.organization}
                                </p>
                            )}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="budget">งบประมาณ</Label>
                            <Input
                                id="budget"
                                type="number"
                                value={data.budget}
                                onChange={(e) =>
                                    setData('budget', Number(e.target.value))
                                }
                            />
                            {errors.budget && (
                                <p className="text-sm text-destructive">
                                    {errors.budget}
                                </p>
                            )}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="method">
                                วิธีการจัดซื้อจัดจ้าง
                            </Label>
                            <Select
                                value={data.method}
                                onValueChange={(value) =>
                                    setData('method', value)
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="เลือกวิธี" />
                                </SelectTrigger>
                                <SelectContent>
                                    {taxonomy.methods.map((method) => (
                                        <SelectItem
                                            key={method.value}
                                            value={method.value}
                                        >
                                            {method.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {errors.method && (
                                <p className="text-sm text-destructive">
                                    {errors.method}
                                </p>
                            )}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="category">หมวดหมู่</Label>
                            <Select
                                value={data.category}
                                onValueChange={(value) =>
                                    setData('category', value)
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="เลือกหมวดหมู่" />
                                </SelectTrigger>
                                <SelectContent>
                                    {taxonomy.categories.map((category) => (
                                        <SelectItem
                                            key={category.value}
                                            value={category.value}
                                        >
                                            {category.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {errors.category && (
                                <p className="text-sm text-destructive">
                                    {errors.category}
                                </p>
                            )}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="deadline">วันสิ้นสุด</Label>
                            <Input
                                id="deadline"
                                type="date"
                                value={data.deadline}
                                onChange={(e) =>
                                    setData('deadline', e.target.value)
                                }
                            />
                            {errors.deadline && (
                                <p className="text-sm text-destructive">
                                    {errors.deadline}
                                </p>
                            )}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="status">สถานะ</Label>
                            <Select
                                value={data.status}
                                onValueChange={(value) =>
                                    setData('status', value)
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="เลือกสถานะ" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="open">
                                        เปิดรับข้อเสนอ
                                    </SelectItem>
                                    <SelectItem value="urgent">ด่วน</SelectItem>
                                    <SelectItem value="closing">
                                        ใกล้ปิดรับ
                                    </SelectItem>
                                    <SelectItem value="closed">
                                        ปิดรับแล้ว
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                            {errors.status && (
                                <p className="text-sm text-destructive">
                                    {errors.status}
                                </p>
                            )}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="publication_status">
                                สถานะการเผยแพร่
                            </Label>
                            <Select
                                value={data.publication_status}
                                onValueChange={(value) =>
                                    setData('publication_status', value)
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="เลือกสถานะการเผยแพร่" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="draft">ร่าง</SelectItem>
                                    <SelectItem value="published">
                                        เผยแพร่
                                    </SelectItem>
                                    <SelectItem value="hidden">ซ่อน</SelectItem>
                                </SelectContent>
                            </Select>
                            {errors.publication_status && (
                                <p className="text-sm text-destructive">
                                    {errors.publication_status}
                                </p>
                            )}
                        </div>
                        <div className="col-span-2 space-y-2">
                            <Label htmlFor="attachment">เอกสารแนบ (PDF)</Label>
                            <Input
                                id="attachment"
                                type="file"
                                accept="application/pdf"
                                onChange={(e) =>
                                    setData(
                                        'attachment',
                                        e.target.files?.[0] || null,
                                    )
                                }
                            />
                            {errors.attachment && (
                                <p className="text-sm text-destructive">
                                    {errors.attachment}
                                </p>
                            )}
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onClose}
                        >
                            ยกเลิก
                        </Button>
                        <Button type="submit" disabled={processing}>
                            {processing ? 'กำลังบันทึก...' : 'บันทึก'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

export default function AdminDashboard({
    announcements,
    stats,
    taxonomy,
}: AdminDashboardProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingAnnouncement, setEditingAnnouncement] =
        useState<Announcement | null>(null);

    const handleCreate = () => {
        setEditingAnnouncement(null);
        setIsModalOpen(true);
    };

    const handleEdit = (item: Announcement) => {
        setEditingAnnouncement(item);
        setIsModalOpen(true);
    };

    const handlePublishToggle = (item: Announcement) => {
        if (item.publication_status === 'published') {
            router.patch(announcementRoutes.hide.url(item.id));
        } else {
            router.patch(announcementRoutes.publish.url(item.id));
        }
    };

    const handleDelete = (item: Announcement) => {
        if (confirm('คุณแน่ใจหรือไม่ที่จะลบประกาศนี้?')) {
            router.delete(announcementRoutes.destroy.url(item.id));
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
                    {item.published_at
                        ? new Date(item.published_at).toLocaleDateString(
                              'th-TH',
                          )
                        : '-'}
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
                        onClick={() => handleEdit(item)}
                    >
                        <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        title={
                            item.publication_status === 'published'
                                ? 'ซ่อน'
                                : 'เผยแพร่'
                        }
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
            (item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                item.organization
                    ?.toLowerCase()
                    .includes(searchQuery.toLowerCase()) ||
                item.id.toString().includes(searchQuery)) &&
            (statusFilter === 'all' || item.status === statusFilter),
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
                            <Button
                                asChild
                                variant="outline"
                                className="gap-2 shadow-sm"
                            >
                                <Link href={userRoutes.index.url()}>
                                    <Users className="h-4 w-4" />
                                    จัดการผู้ใช้งาน
                                </Link>
                            </Button>
                            <Button
                                className="gap-2 shadow-sm"
                                onClick={handleCreate}
                            >
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
                                    <DropdownMenuItem
                                        onClick={() => setStatusFilter('all')}
                                    >
                                        ทั้งหมด
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                        onClick={() => setStatusFilter('open')}
                                    >
                                        เปิดรับข้อเสนอ
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                        onClick={() =>
                                            setStatusFilter('urgent')
                                        }
                                    >
                                        ด่วน
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                        onClick={() =>
                                            setStatusFilter('closing')
                                        }
                                    >
                                        ใกล้ปิดรับ
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                        onClick={() =>
                                            setStatusFilter('closed')
                                        }
                                    >
                                        ปิดรับแล้ว
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="rounded-lg border border-border">
                            <DataTable
                                data={filteredAnnouncements}
                                columns={columns}
                                emptyMessage="ไม่พบประกาศที่ตรงกับการค้นหา"
                                getRowProps={(item) =>
                                    ({
                                        'data-test': 'admin-announcement-row',
                                    }) as React.HTMLAttributes<HTMLTableRowElement>
                                }
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
                                        adminRoutes.dashboard.url(),
                                        { page },
                                        { preserveState: true },
                                    );
                                }}
                            />
                        </div>
                    </CardContent>
                </Card>
            </div>
            <AnnouncementModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                announcement={editingAnnouncement}
                taxonomy={taxonomy}
            />
        </AppHeaderLayout>
    );
}
