import { Head, Link, usePage } from '@inertiajs/react';
import {
    ChevronRight,
    Download,
    ExternalLink,
    FileText,
    MapPin,
    Menu,
    Phone,
    User,
} from 'lucide-react';
import { ProcurementMethodLabel } from '@/components/procurement-method-label';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    announcementStatusLabels,
    StatusBadge,
} from '@/components/ui/status-badge';
import { Timeline, type TimelineItem } from '@/components/ui/timeline';
import AppHeaderLayout from '@/layouts/app/app-header-layout';
import { formatThaiBudget, formatThaiDate } from '@/lib/procurement-format';
import type { SharedData } from '@/types';

type Attachment = {
    id: number;
    filename: string;
    url: string;
    preview_url: string;
    download_url: string;
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
    location: string | null;
    contact_name: string | null;
    contact_phone: string | null;
    publication_status: 'draft' | 'published' | 'hidden';
    published_at: string | null;
    source_url?: string;
    source_reference?: string | null;
    attachments: Attachment[];
};

type PageProps = SharedData & {
    announcement: AnnouncementDetail;
    taxonomy?: {
        methodLabels: Record<string, string>;
        categoryLabels: Record<string, string>;
    };
};

export default function ProcurementAnnouncement() {
    const { announcement, taxonomy } = usePage<PageProps>().props;
    const primaryAttachment = announcement.attachments[0] ?? null;
    const sourceHostname = announcement.source_url
        ? new URL(announcement.source_url).hostname
        : null;

    const methodLabel =
        taxonomy?.methodLabels?.[announcement.method] ?? announcement.method;
    const categoryLabel =
        taxonomy?.categoryLabels?.[announcement.category] ??
        announcement.category;

    const timelineItems: TimelineItem[] = [
        {
            date: formatThaiDate(announcement.published_at),
            title: 'เผยแพร่ประกาศ',
            status: 'completed',
        },
        {
            date: formatThaiDate(announcement.deadline),
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
                    <div className="flex max-w-3xl min-w-0 flex-col gap-3">
                        <div className="flex items-center gap-3">
                            <StatusBadge status={announcement.status} />
                            <span className="text-sm text-muted-foreground">
                                วันที่ประกาศ:{' '}
                                {formatThaiDate(announcement.published_at)}
                            </span>
                        </div>
                        <h1 className="text-xl leading-tight font-black tracking-tight text-pretty text-foreground sm:text-2xl md:text-3xl">
                            {announcement.title}
                        </h1>
                        <p className="text-muted-foreground">
                            รหัสโครงการ: {announcement.id}
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-3">
                        {primaryAttachment ? (
                            <Button className="gap-2 shadow-sm" asChild>
                                <a
                                    href={primaryAttachment.download_url}
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
                        <CardTitle>
                            <h2 className="text-lg">
                                รายละเอียดประกาศจัดซื้อจัดจ้าง
                            </h2>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="grid grid-cols-1 divide-y divide-border md:grid-cols-2 md:divide-x md:divide-y-0 lg:grid-cols-4">
                            <div className="flex flex-col gap-1 p-5">
                                <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                                    หน่วยงานที่รับผิดชอบ
                                </p>
                                <p className="font-medium break-words text-foreground">
                                    {announcement.organization}
                                </p>
                            </div>
                            <div className="flex flex-col gap-1 p-5">
                                <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                                    งบประมาณโครงการ
                                </p>
                                <p className="text-sm font-medium text-foreground">
                                    {formatThaiBudget(announcement.budget)}
                                </p>
                            </div>
                            <div className="flex flex-col gap-1 p-5">
                                <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                                    หมวดหมู่
                                </p>
                                <p className="font-medium text-foreground">
                                    {categoryLabel}
                                </p>
                            </div>
                            <div className="flex flex-col gap-1 p-5">
                                <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                                    สิ้นสุดรับยื่นข้อเสนอ
                                </p>
                                <p className="font-bold text-destructive">
                                    {formatThaiDate(announcement.deadline)}
                                </p>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 divide-y divide-border border-t border-border md:grid-cols-2 md:divide-x md:divide-y-0 lg:grid-cols-4">
                            <div className="flex flex-col gap-1 p-5">
                                <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                                    วิธีการจัดซื้อจัดจ้าง
                                </p>
                                <p className="font-medium text-foreground">
                                    <ProcurementMethodLabel
                                        label={methodLabel}
                                    />
                                </p>
                            </div>
                            <div className="flex flex-col gap-1 p-5">
                                <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                                    วันที่ประกาศเผยแพร่
                                </p>
                                <p className="font-medium text-foreground">
                                    {formatThaiDate(announcement.published_at)}
                                </p>
                            </div>
                            <div className="flex flex-col gap-1 p-5">
                                <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                                    การเผยแพร่
                                </p>
                                <p className="font-medium text-foreground">
                                    {
                                        {
                                            draft: 'ฉบับร่าง',
                                            published: 'เผยแพร่แล้ว',
                                            hidden: 'ซ่อนจากสาธารณะ',
                                        }[announcement.publication_status]
                                    }
                                </p>
                            </div>
                            <div className="flex flex-col gap-1 p-5">
                                <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                                    สถานะประกาศ
                                </p>
                                <p className="font-medium text-foreground">
                                    {announcementStatusLabels[
                                        announcement.status
                                    ] ?? announcement.status}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <div className="grid min-w-0 gap-6 lg:grid-cols-[2fr_1fr]">
                    <div className="flex min-w-0 flex-col gap-4">
                        <div className="flex items-center justify-between">
                            <h2 className="flex items-center gap-3 text-2xl font-bold text-foreground">
                                <FileText className="h-7 w-7 text-primary" />
                                เอกสารข้อกำหนด (TOR)
                            </h2>
                        </div>

                        <div className="group relative flex h-[600px] flex-col overflow-hidden rounded-xl border border-border bg-muted shadow-lg">
                            <div className="flex h-12 shrink-0 items-center justify-between border-b border-border bg-primary px-4">
                                <div className="flex min-w-0 items-center gap-4 text-primary-foreground/80">
                                    <Menu className="h-5 w-5" />
                                    <span className="max-w-[260px] truncate text-sm font-medium">
                                        {primaryAttachment?.filename ??
                                            `TOR-${announcement.id}.pdf`}
                                    </span>
                                </div>
                                <Badge variant="secondary">PDF</Badge>
                            </div>

                            <div className="relative flex flex-1 items-center justify-center overflow-hidden bg-muted p-4">
                                {primaryAttachment ? (
                                    <>
                                        <iframe
                                            src={primaryAttachment.preview_url}
                                            title={primaryAttachment.filename}
                                            className="h-full w-full rounded-md bg-background"
                                            style={{
                                                maxWidth: '100%',
                                                maxHeight: '100%',
                                            }}
                                        />
                                        <div className="absolute inset-x-8 bottom-8 flex flex-col items-center gap-3 rounded-lg border border-border bg-card/95 p-4 text-center shadow-lg backdrop-blur sm:right-auto sm:left-1/2 sm:w-max sm:max-w-[calc(100%-4rem)] sm:-translate-x-1/2 sm:flex-row sm:text-left">
                                            <FileText className="h-6 w-6 shrink-0 text-primary" />
                                            <div className="min-w-0">
                                                <p className="text-sm font-semibold text-foreground">
                                                    หากตัวอย่างไม่แสดงในเบราว์เซอร์
                                                </p>
                                                <p className="truncate text-xs text-muted-foreground">
                                                    {primaryAttachment.filename}
                                                </p>
                                            </div>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="shrink-0"
                                                asChild
                                            >
                                                <a
                                                    href={
                                                        primaryAttachment.preview_url
                                                    }
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                >
                                                    เปิดเอกสาร PDF ในแท็บใหม่
                                                </a>
                                            </Button>
                                        </div>
                                    </>
                                ) : (
                                    <div className="flex h-full w-full items-center justify-center rounded-md bg-background p-12 text-center text-muted-foreground">
                                        ไม่มีไฟล์แนบสำหรับประกาศนี้
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="min-w-0 space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>
                                    <h2 className="text-lg">
                                        ข้อมูลติดต่อ & เอกสารที่ต้องใช้
                                    </h2>
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div className="space-y-4 border-b border-border pb-4">
                                    <div className="flex items-start gap-3">
                                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded bg-primary/10 text-primary">
                                            <MapPin className="h-4 w-4" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-xs font-semibold text-muted-foreground uppercase">
                                                สถานที่ปฏิบัติงาน
                                            </p>
                                            <p className="text-sm font-medium break-words text-foreground">
                                                {announcement.location ?? '-'}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded bg-primary/10 text-primary">
                                            <User className="h-4 w-4" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-xs font-semibold text-muted-foreground uppercase">
                                                ผู้ติดต่อ
                                            </p>
                                            <p className="text-sm font-medium break-words text-foreground">
                                                {announcement.contact_name ??
                                                    '-'}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded bg-primary/10 text-primary">
                                            <Phone className="h-4 w-4" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-xs font-semibold text-muted-foreground uppercase">
                                                เบอร์โทรศัพท์
                                            </p>
                                            {announcement.contact_phone ? (
                                                <a
                                                    href={`tel:${announcement.contact_phone}`}
                                                    className="text-sm font-medium break-all text-primary hover:underline"
                                                >
                                                    {announcement.contact_phone}
                                                </a>
                                            ) : (
                                                <p className="text-sm font-medium text-foreground">
                                                    -
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {announcement.attachments.length > 0 ? (
                                    announcement.attachments.map((file) => (
                                        <a
                                            key={file.id}
                                            href={file.download_url}
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

                        {announcement.source_url ? (
                            <Card data-test="source-attribution">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <h2 className="text-lg">
                                            แหล่งที่มาของประกาศ
                                        </h2>
                                        {sourceHostname?.endsWith(
                                            '.invalid',
                                        ) ? (
                                            <Badge
                                                variant="secondary"
                                                data-test="source-attribution-invalid-label"
                                            >
                                                .invalid — โดเมนสาธิต
                                            </Badge>
                                        ) : null}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    <a
                                        href={announcement.source_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex max-w-full items-center gap-2 text-sm font-medium break-words text-primary hover:underline"
                                        data-test="source-attribution-link"
                                    >
                                        {announcement.source_url}
                                        <ExternalLink className="h-4 w-4 shrink-0" />
                                    </a>
                                    {announcement.source_reference ? (
                                        <p
                                            className="text-sm text-muted-foreground"
                                            data-test="source-attribution-reference"
                                        >
                                            เลขที่อ้างอิง:{' '}
                                            {announcement.source_reference}
                                        </p>
                                    ) : null}
                                    <p
                                        className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm leading-relaxed text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100"
                                        data-test="source-attribution-notice"
                                    >
                                        {sourceHostname?.endsWith('.invalid')
                                            ? 'ข้อมูลนี้ใช้โดเมนสาธิตและไม่ใช่แหล่งข้อมูลทางการ'
                                            : 'ข้อมูลแหล่งที่มาและเลขที่อ้างอิงนำเข้าพร้อมประกาศ โปรดตรวจสอบรายละเอียดกับเว็บไซต์ต้นทาง'}
                                    </p>
                                </CardContent>
                            </Card>
                        ) : null}

                        <Card>
                            <CardHeader>
                                <CardTitle>
                                    <h2 className="text-lg">กำหนดการ</h2>
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <Timeline items={timelineItems} />
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>
                                    <h2 className="text-lg">
                                        รายละเอียดเพิ่มเติม
                                    </h2>
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
