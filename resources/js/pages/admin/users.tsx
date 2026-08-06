import { Head, router, Link } from '@inertiajs/react';
import { ShieldCheck, Trash2, Users, ArrowLeft } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DataTable, type Column } from '@/components/ui/data-table';
import { Pagination } from '@/components/ui/pagination';
import AppHeaderLayout from '@/layouts/app/app-header-layout';
import * as adminRoutes from '@/routes/admin';
import * as userRoutes from '@/routes/admin/users';

type User = {
    id: number;
    name: string;
    email: string;
    role: 'admin' | 'registered';
    created_at: string;
};

type PaginatedData<T> = {
    data: T[];
    current_page: number;
    last_page: number;
    total: number;
    per_page: number;
};

interface AdminUsersProps {
    users: PaginatedData<User>;
}

export default function AdminUsers({ users }: AdminUsersProps) {
    const [error, setError] = useState<string | null>(null);

    const handleRoleChange = (user: User, newRole: string) => {
        setError(null);
        router.patch(
            userRoutes.updateRole.url(user.id),
            { role: newRole },
            {
                preserveScroll: true,
                onError: (errors) => {
                    if (errors.message) {
                        setError(errors.message);
                    } else {
                        setError('ไม่สามารถเปลี่ยนสิทธิ์ได้');
                    }
                },
            },
        );
    };

    const handleDelete = (user: User) => {
        if (confirm(`คุณแน่ใจหรือไม่ที่จะลบผู้ใช้ ${user.name}?`)) {
            setError(null);
            router.delete(userRoutes.destroy.url(user.id), {
                preserveScroll: true,
                onError: (errors) => {
                    if (errors.message) {
                        setError(errors.message);
                    } else {
                        setError('ไม่สามารถลบผู้ใช้ได้');
                    }
                },
            });
        }
    };

    const columns: Column<User>[] = [
        {
            key: 'name',
            header: 'ชื่อ',
            cell: (item) => (
                <div className="font-medium text-foreground">{item.name}</div>
            ),
        },
        {
            key: 'email',
            header: 'อีเมล',
            cell: (item) => (
                <span className="text-muted-foreground">{item.email}</span>
            ),
        },
        {
            key: 'role',
            header: 'สิทธิ์การใช้งาน',
            cell: (item) => (
                <select
                    value={item.role}
                    onChange={(e) => handleRoleChange(item, e.target.value)}
                    className="rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none"
                    data-test="admin-user-role-select"
                >
                    <option value="registered">ผู้ใช้ทั่วไป</option>
                    <option value="admin">ผู้ดูแลระบบ</option>
                </select>
            ),
        },
        {
            key: 'created_at',
            header: 'วันที่สมัคร',
            cell: (item) => (
                <span className="text-muted-foreground">
                    {new Date(item.created_at).toLocaleDateString('th-TH')}
                </span>
            ),
        },
        {
            key: 'actions',
            header: 'การดำเนินการ',
            cell: (item) => (
                <div className="flex items-center justify-end gap-1">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
                        title="ลบผู้ใช้"
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

    return (
        <AppHeaderLayout>
            <Head title="จัดการผู้ใช้งาน - Admin" />
            <div className="flex flex-col gap-8 px-4 py-6 md:px-8">
                <div className="flex flex-col gap-6 rounded-2xl border border-border bg-card p-6 md:p-8">
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <div className="space-y-2">
                            <div className="flex items-center gap-2 text-sm font-semibold text-primary">
                                <ShieldCheck className="h-4 w-4" />
                                Admin Portal
                            </div>
                            <h1 className="text-2xl font-black tracking-tight text-foreground md:text-3xl">
                                จัดการผู้ใช้งาน
                            </h1>
                            <p className="text-sm text-muted-foreground">
                                ดูแลข้อมูลและสิทธิ์การใช้งานของผู้ใช้ในระบบ
                            </p>
                        </div>
                        <Button
                            asChild
                            variant="outline"
                            className="gap-2 shadow-sm"
                        >
                            <Link href={adminRoutes.dashboard.url()}>
                                <ArrowLeft className="h-4 w-4" />
                                กลับไปหน้าหลัก
                            </Link>
                        </Button>
                    </div>
                </div>

                {error && (
                    <div className="rounded-md bg-destructive/15 p-4 text-sm text-destructive">
                        {error}
                    </div>
                )}

                <Card>
                    <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <div>
                            <CardTitle className="flex items-center gap-2 text-xl">
                                <Users className="h-5 w-5" />
                                รายชื่อผู้ใช้งานทั้งหมด
                            </CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="rounded-lg border border-border">
                            <DataTable
                                data={users.data}
                                columns={columns}
                                emptyMessage="ไม่พบผู้ใช้งาน"
                                getRowProps={() =>
                                    ({
                                        'data-test': 'admin-user-row',
                                    }) as React.HTMLAttributes<HTMLTableRowElement>
                                }
                            />
                        </div>
                        <div className="mt-6 flex items-center justify-between">
                            <p className="text-sm text-muted-foreground">
                                แสดง {users.data.length} จาก {users.total}{' '}
                                รายการ
                            </p>
                            <Pagination
                                currentPage={users.current_page}
                                totalPages={users.last_page}
                                onPageChange={(page) => {
                                    router.get(
                                        userRoutes.index.url(),
                                        { page },
                                        { preserveState: true },
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
