import { Head, Link, usePage } from '@inertiajs/react';
import {
    Bell,
    Bookmark,
    Edit2,
    FileText,
    HelpCircle,
    History,
    LayoutDashboard,
    Mail,
    Plus,
    Settings,
    Smartphone,
    Trash2,
    User,
} from 'lucide-react';
import { useState } from 'react';
import AppHeaderLayout from '@/layouts/app/app-header-layout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
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

const existingAlerts = [
    {
        id: 1,
        name: 'งานก่อสร้าง มากกว่า 10 ล้าน',
        criteria: 'หมวดหมู่: ก่อสร้าง, งบประมาณ: > 10,000,000 บาท',
        color: 'bg-blue-500',
    },
    {
        id: 2,
        name: 'เครื่องมือแพทย์ - สาธารณสุขจังหวัด',
        criteria: 'หน่วยงาน: สำนักงานสาธารณสุข, หมวดหมู่: การแพทย์',
        color: 'bg-emerald-500',
    },
    {
        id: 3,
        name: 'ครุภัณฑ์ IT ทุกหน่วยงาน',
        criteria: 'หมวดหมู่: ไอที/ครุภัณฑ์',
        color: 'bg-violet-500',
    },
];

const workTypes = [
    'ก่อสร้าง',
    'ไอที/ครุภัณฑ์',
    'ที่ปรึกษา',
    'การแพทย์',
    'บริการทั่วไป',
];

export default function NotificationSettings() {
    const { auth } = usePage<SharedData>().props;
    const user = auth.user;

    const [emailEnabled, setEmailEnabled] = useState(true);
    const [inAppEnabled, setInAppEnabled] = useState(true);
    const [smsEnabled, setSmsEnabled] = useState(false);

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
                                กำหนดเงื่อนไขการแจ้งเตือนเมื่อมีประกาศใหม่ที่ตรงกับความต้องการ
                            </p>
                        </div>

                        <div className="grid gap-6 xl:grid-cols-3">
                            <div className="space-y-6 xl:col-span-2">
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <Plus className="h-5 w-5 text-primary" />
                                            สร้างการแจ้งเตือนใหม่
                                        </CardTitle>
                                        <CardDescription>
                                            ระบุเงื่อนไขที่ต้องการรับการแจ้งเตือนเมื่อมีประกาศใหม่
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <form className="grid gap-6 sm:grid-cols-2">
                                            <div className="space-y-2">
                                                <Label htmlFor="org">
                                                    ชื่อหน่วยงาน
                                                </Label>
                                                <Input
                                                    id="org"
                                                    placeholder="เช่น เทศบาลนครขอนแก่น"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="workType">
                                                    ประเภทงาน / หมวดหมู่
                                                </Label>
                                                <Select>
                                                    <SelectTrigger id="workType">
                                                        <SelectValue placeholder="เลือกประเภทงาน" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {workTypes.map(
                                                            (type) => (
                                                                <SelectItem
                                                                    key={type}
                                                                    value={type}
                                                                >
                                                                    {type}
                                                                </SelectItem>
                                                            ),
                                                        )}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="budget">
                                                    งบประมาณขั้นต่ำ (บาท)
                                                </Label>
                                                <Input
                                                    id="budget"
                                                    type="number"
                                                    placeholder="เช่น 1000000"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="location">
                                                    พื้นที่ / อำเภอ
                                                </Label>
                                                <Input
                                                    id="location"
                                                    placeholder="เช่น อำเภอเมืองขอนแก่น"
                                                />
                                            </div>
                                            <div className="sm:col-span-2">
                                                <Button className="w-full gap-2 sm:w-auto">
                                                    <Plus className="h-4 w-4" />
                                                    เพิ่มเงื่อนไขการแจ้งเตือน
                                                </Button>
                                            </div>
                                        </form>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader>
                                        <div className="flex items-center justify-between">
                                            <CardTitle className="flex items-center gap-2">
                                                การแจ้งเตือนปัจจุบัน
                                                <Badge
                                                    variant="secondary"
                                                    className="ml-2"
                                                >
                                                    {existingAlerts.length}{' '}
                                                    รายการ
                                                </Badge>
                                            </CardTitle>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        {existingAlerts.map((alert) => (
                                            <div
                                                key={alert.id}
                                                className="flex items-center gap-4 rounded-lg border border-border p-4 transition-colors hover:bg-muted/50"
                                            >
                                                <div
                                                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${alert.color} text-white`}
                                                >
                                                    <Bell className="h-5 w-5" />
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <p className="font-semibold text-foreground">
                                                        {alert.name}
                                                    </p>
                                                    <p className="truncate text-sm text-muted-foreground">
                                                        {alert.criteria}
                                                    </p>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8"
                                                    >
                                                        <Edit2 className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}
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
                                                checked={emailEnabled}
                                                onCheckedChange={
                                                    setEmailEnabled
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
                                                checked={inAppEnabled}
                                                onCheckedChange={
                                                    setInAppEnabled
                                                }
                                            />
                                        </div>

                                        <div className="flex items-center justify-between opacity-60">
                                            <div className="flex items-center gap-3">
                                                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-100 text-violet-600">
                                                    <Smartphone className="h-5 w-5" />
                                                </div>
                                                <div>
                                                    <p className="flex items-center gap-2 font-medium text-foreground">
                                                        SMS
                                                        <Badge
                                                            variant="secondary"
                                                            className="bg-amber-100 text-amber-700"
                                                        >
                                                            Pro
                                                        </Badge>
                                                    </p>
                                                    <p className="text-sm text-muted-foreground">
                                                        รับ SMS
                                                        เมื่อมีประกาศใหม่
                                                    </p>
                                                </div>
                                            </div>
                                            <Switch
                                                checked={smsEnabled}
                                                disabled
                                            />
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card className="border-primary/20 bg-primary/5">
                                    <CardContent className="flex items-start gap-4 pt-6">
                                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                                            <HelpCircle className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <p className="font-semibold text-foreground">
                                                ต้องการความช่วยเหลือ?
                                            </p>
                                            <p className="mt-1 text-sm text-muted-foreground">
                                                อ่านคู่มือการใช้งานการแจ้งเตือน
                                                หรือติดต่อทีมสนับสนุนของเรา
                                            </p>
                                            <Button
                                                variant="link"
                                                className="mt-2 h-auto p-0 text-primary"
                                            >
                                                ดูคู่มือการใช้งาน →
                                            </Button>
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
