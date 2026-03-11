import { Head, Link, usePage } from '@inertiajs/react';
import {
    Bookmark,
    ChevronRight,
    Download,
    FileText,
    Menu,
    Share2,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatusBadge } from '@/components/ui/status-badge';
import { Timeline, type TimelineItem } from '@/components/ui/timeline';
import AppHeaderLayout from '@/layouts/app/app-header-layout';
import type { SharedData } from '@/types';

type Attachment = {
    id: number;
    filename: string;
    url: string;
};

type AnnouncementDetail = {
    id: number;
    title: string;
    organization: string;
    category: string;
    method: string;
    budget: number | string;
    deadline: string;
    status: 'open' | 'urgent' | 'closing' | 'closed';
    description: string | null;
    publication_status: 'draft' | 'published' | 'hidden';
    published_at: string | null;
    attachments: Attachment[];
};

type PageProps = SharedData & {
    announcement: AnnouncementDetail;
};

function formatDate(value: string | null): string {
    if (!value) {
        return '-';
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        return value;
    }

    return date.toLocaleDateString('th-TH');
}

function formatBudget(value: number | string): string {
    const amount = typeof value === 'number' ? value : Number.parseFloat(value);
    if (Number.isNaN(amount)) {
        return '-';
    }

    return `${amount.toLocaleString('th-TH')} บาท`;
}

export default function ProcurementAnnouncement() {
    const { announcement } = usePage<PageProps>().props;
    const primaryAttachment = announcement.attachments[0] ?? null;

    const timelineItems: TimelineItem[] = [
        {
            date: formatDate(announcement.published_at),
            title: 'เผยแพร่ประกาศ',
            status: 'completed',
        },
        {
            date: formatDate(announcement.deadline),
            title: 'วันสิ้นสุดการรับยื่นข้อเสนอ',
            status: 'current',
        },
    ];

    return (
        <AppHeaderLayout>
            <Head title={`รายละเอียดประกาศ ${announcement.id}`} />
            <div className="flex flex-col gap-6 px-4 py-6 md:px-8">
                <nav className="flex flex-wrap items-center gap-2 text-sm">
                    <Link
                        href="/"
                        className="text-muted-foreground hover:text-primary hover:underline"
                    >
                        หน้าหลัก
                    </Link>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    <Link
                        href="/procurement"
                        className="text-muted-foreground hover:text-primary hover:underline"
                    >
                        ประกาศจัดซื้อจัดจ้าง
                    </Link>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium text-foreground">
                        โครงการเลขที่ #{announcement.id}
                    </span>
                </nav>

                <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                    <div className="flex max-w-3xl flex-col gap-3">
                        <div className="flex items-center gap-3">
                            <StatusBadge status={announcement.status} />
                            <span className="text-sm text-muted-foreground">
                                วันที่ประกาศ:{' '}
                                {formatDate(announcement.published_at)}
                            </span>
                        </div>
                        <h1 className="text-2xl leading-tight font-black tracking-tight text-foreground md:text-4xl">
                            {announcement.title}
                        </h1>
                        <p className="text-muted-foreground">
                            รหัสโครงการ: {announcement.id}
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-3">
                        <Button
                            variant="outline"
                            className="gap-2"
                            type="button"
                        >
                            <Bookmark className="h-4 w-4" />
                            บันทึก
                        </Button>
                        <Button
                            variant="outline"
                            className="gap-2"
                            type="button"
                        >
                            <Share2 className="h-4 w-4" />
                            แชร์
                        </Button>
                        {primaryAttachment ? (
                            <Button className="gap-2 shadow-sm" asChild>
                                <a
                                    href={primaryAttachment.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    <Download className="h-4 w-4" />
                                    ดาวน์โหลดเอกสาร PDF
                                </a>
                            </Button>
                        ) : (
                            <Button className="gap-2 shadow-sm" disabled>
                                <Download className="h-4 w-4" />
                                ไม่มีไฟล์แนบ
                            </Button>
                        )}
                    </div>
                </div>

                <Card className="overflow-hidden">
                    <CardHeader className="flex flex-row items-center gap-2 border-b border-border bg-muted/30 py-4">
                        <FileText className="h-5 w-5 text-primary" />
                        <CardTitle className="text-lg">
                            รายละเอียดประกาศจัดซื้อจัดจ้าง
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="grid grid-cols-1 divide-y divide-border md:grid-cols-2 md:divide-x md:divide-y-0 lg:grid-cols-4">
                            <div className="flex flex-col gap-1 p-5">
                                <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                                    หน่วยงานที่รับผิดชอบ
                                </p>
                                <p className="font-medium text-foreground">
                                    {announcement.organization}
                                </p>
                            </div>
                            <div className="flex flex-col gap-1 p-5">
                                <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                                    งบประมาณโครงการ
                                </p>
                                <p className="font-medium text-foreground">
                                    {formatBudget(announcement.budget)}
                                </p>
                            </div>
                            <div className="flex flex-col gap-1 p-5">
                                <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                                    หมวดหมู่
                                </p>
                                <p className="font-medium text-foreground">
                                    {announcement.category}
                                </p>
                            </div>
                            <div className="flex flex-col gap-1 p-5">
                                <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                                    สิ้นสุดรับยื่นข้อเสนอ
                                </p>
                                <p className="font-bold text-destructive">
                                    {formatDate(announcement.deadline)}
                                </p>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 divide-y divide-border border-t border-border md:grid-cols-2 md:divide-x md:divide-y-0 lg:grid-cols-4">
                            <div className="flex flex-col gap-1 p-5">
                                <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                                    วิธีการจัดซื้อจัดจ้าง
                                </p>
                                <p className="font-medium text-foreground">
                                    {announcement.method}
                                </p>
                            </div>
                            <div className="flex flex-col gap-1 p-5">
                                <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                                    วันที่ประกาศเผยแพร่
                                </p>
                                <p className="font-medium text-foreground">
                                    {formatDate(announcement.published_at)}
                                </p>
                            </div>
                            <div className="flex flex-col gap-1 p-5">
                                <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                                    การเผยแพร่
                                </p>
                                <p className="font-medium text-foreground">
                                    {announcement.publication_status}
                                </p>
                            </div>
                            <div className="flex flex-col gap-1 p-5">
                                <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                                    สถานะประกาศ
                                </p>
                                <p className="font-medium text-foreground">
                                    {announcement.status}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
                    <div className="flex flex-col gap-4">
                        <div className="flex items-center justify-between">
                            <h2 className="flex items-center gap-3 text-2xl font-bold text-foreground">
                                <FileText className="h-7 w-7 text-primary" />
                                เอกสารข้อกำหนด (TOR)
                            </h2>
                        </div>

                        <div className="group relative flex h-[600px] flex-col overflow-hidden rounded-xl border border-border bg-[#525659] shadow-lg">
                            <div className="flex h-12 items-center justify-between border-b border-[#404447] bg-[#323639] px-4">
                                <div className="flex items-center gap-4 text-gray-300">
                                    <Menu className="h-5 w-5" />
                                    <span className="max-w-[260px] truncate text-sm font-medium">
                                        {primaryAttachment?.filename ??
                                            `TOR-${announcement.id}.pdf`}
                                    </span>
                                </div>
                                <Badge variant="secondary">PDF</Badge>
                            </div>

                            <div className="custom-scrollbar flex flex-1 justify-center overflow-y-auto bg-[#525659] p-8">
                                {primaryAttachment ? (
                                    <iframe
                                        src={primaryAttachment.url}
                                        title={primaryAttachment.filename}
                                        className="h-full min-h-[520px] w-full max-w-[920px] rounded-md bg-white"
                                    />
                                ) : (
                                    <div className="flex h-full w-full max-w-[920px] items-center justify-center rounded-md bg-white p-12 text-center text-muted-foreground">
                                        ไม่มีไฟล์แนบสำหรับประกาศนี้
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">
                                    ข้อมูลติดต่อ & เอกสารที่ต้องใช้
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {announcement.attachments.length > 0 ? (
                                    announcement.attachments.map((file) => (
                                        <a
                                            key={file.id}
                                            href={file.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="group/item flex cursor-pointer items-center justify-between gap-3 rounded-lg p-2 transition-colors hover:bg-muted"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="flex h-10 w-10 items-center justify-center rounded bg-red-50 text-red-600">
                                                    <FileText className="h-5 w-5" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium text-foreground group-hover/item:text-primary">
                                                        {file.filename}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">
                                                        PDF
                                                    </p>
                                                </div>
                                            </div>
                                            <Download className="h-4 w-4 text-muted-foreground" />
                                        </a>
                                    ))
                                ) : (
                                    <p className="text-sm text-muted-foreground">
                                        ไม่มีเอกสารแนบ
                                    </p>
                                )}
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">
                                    กำหนดการ
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <Timeline items={timelineItems} />
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">
                                    รายละเอียดเพิ่มเติม
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm leading-relaxed whitespace-pre-line text-muted-foreground">
                                    {announcement.description ??
                                        'ไม่มีรายละเอียดเพิ่มเติม'}
                                </p>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </AppHeaderLayout>
    );
}
