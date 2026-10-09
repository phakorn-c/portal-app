import { Head, Link, usePage } from '@inertiajs/react';
import {
    ChevronRight,
    Download,
    ExternalLink,
    FileText,
    Globe,
    MapPin,
    Megaphone,
    Menu,
    Phone,
    Trophy,
    User,
} from 'lucide-react';
import type { ReactNode } from 'react';
import { ProcurementMethodLabel } from '@/components/procurement-method-label';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    type AnnouncementStatus,
    announcementStatusLabels,
    StatusBadge,
} from '@/components/ui/status-badge';
import { Timeline, type TimelineItem } from '@/components/ui/timeline';
import AppHeaderLayout from '@/layouts/app/app-header-layout';
import {
    displayPriceLabel,
    formatThaiBudget,
    formatThaiDate,
    noticeTypeLabels,
    procurementCategoryLabels,
    processStatusLabels,
    verifiedDisplayPrice,
} from '@/lib/procurement-format';
import type { SharedData } from '@/types';

type Attachment = {
    id: number;
    filename: string;
    url: string;
    preview_url: string;
    download_url: string;
    mime_type: string;
};

type Bidder = {
    name?: string | null;
    price?: number | string | null;
    bidder_name?: string | null;
    bid_price?: number | string | null;
} & Record<string, unknown>;

type AnnouncementDetail = {
    id: number;
    title: string;
    organization: string;
    method: string;
    budget: number | string | null;
    deadline: string | null;
    status: AnnouncementStatus | null;
    notice_type: string | null;
    procurement_category: string | null;
    display_price: number | string | null;
    display_price_source: string | null;
    province: string | null;
    district: string | null;
    subdistrict: string | null;
    project_key: string | null;
    project_no: string | null;
    tags: string[] | null;
    reference_price: number | string | null;
    contact_name: string | null;
    contact_phone: string | null;
    contact_website: string | null;
    announcer_name: string | null;
    announcer_position: string | null;
    winner_name: string | null;
    winning_price: number | string | null;
    bidders: Bidder[] | null;
    announced_at: string | null;
    submission_deadline: string | null;
    award_announced_at: string | null;
    process_status: string | null;
    description: string | null;
    publication_status: 'draft' | 'published' | 'hidden';
    published_at: string | null;
    source_id?: string | null;
    source_url?: string;
    source_reference?: string | null;
    attachments: Attachment[];
};

type PageProps = SharedData & {
    announcement: AnnouncementDetail;
    taxonomy?: {
        methodLabels: Record<string, string>;
        categoryLabels?: Record<string, string>;
    };
};

function attachmentKind(mimeType: string | null | undefined): {
    badge: string;
    isImage: boolean;
} {
    if (mimeType?.startsWith('image/')) {
        return { badge: 'JPG', isImage: true };
    }

    return { badge: 'PDF', isImage: false };
}

function labelOr(labels: Record<string, string>, value: string | null): string {
    if (!value) {
        return '-';
    }

    return labels[value] ?? value;
}

function bidderText(bidder: Bidder): string {
    const name = bidder.name ?? bidder.bidder_name;
    const price = bidder.price ?? bidder.bid_price;

    if (typeof name === 'string' && name !== '') {
        return price !== null && price !== undefined && price !== ''
            ? `${name} — ${formatThaiBudget(price)}`
            : name;
    }

    return JSON.stringify(bidder);
}

function DetailCell({
    label,
    children,
}: {
    label: string;
    children: ReactNode;
}) {
    return (
        <div className="flex flex-col gap-1 p-5">
            <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                {label}
            </p>
            {children}
        </div>
    );
}

export default function ProcurementAnnouncement() {
    const { announcement, taxonomy } = usePage<PageProps>().props;
    const primaryAttachment = announcement.attachments[0] ?? null;
    const primaryKind = attachmentKind(primaryAttachment?.mime_type);
    const sourceHostname = announcement.source_url
        ? new URL(announcement.source_url).hostname
        : null;

    const isAward = announcement.notice_type === 'award';
    const tags = announcement.tags ?? [];
    const bidders = announcement.bidders ?? [];
    const projectReference = announcement.project_no || String(announcement.id);
    const deadline = announcement.submission_deadline ?? announcement.deadline;
    const announcedAt = announcement.announced_at ?? announcement.published_at;
    const workLocation =
        [
            announcement.subdistrict ? `ตำบล${announcement.subdistrict}` : null,
            announcement.district ? `อำเภอ${announcement.district}` : null,
            announcement.province ? `จังหวัด${announcement.province}` : null,
        ]
            .filter((part) => part !== null)
            .join(' ') || '-';

    const methodLabel =
        taxonomy?.methodLabels?.[announcement.method] ?? announcement.method;

    const timelineItems: TimelineItem[] = [
        {
            date: formatThaiDate(announcedAt),
            title: 'เผยแพร่ประกาศ',
            status: 'completed',
        },
        ...(deadline
            ? [
                  {
                      date: formatThaiDate(deadline),
                      title: 'วันสิ้นสุดการรับยื่นข้อเสนอ',
                      status: isAward
                          ? ('completed' as const)
                          : ('current' as const),
                  },
              ]
            : []),
        ...(isAward && announcement.award_announced_at
            ? [
                  {
                      date: formatThaiDate(announcement.award_announced_at),
                      title: 'ประกาศผู้ชนะการเสนอราคา',
                      status: 'current' as const,
                  },
              ]
            : []),
    ];

    return (
        <AppHeaderLayout>
            <Head title={`รายละเอียดประกาศ ${projectReference}`} />
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
                        โครงการเลขที่ #{projectReference}
                    </span>
                </nav>

                <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                    <div className="flex max-w-3xl min-w-0 flex-col gap-3">
                        <div className="flex flex-wrap items-center gap-3">
                            <StatusBadge status={announcement.status} />
                            {isAward && (
                                <Badge variant="secondary">ประกาศผู้ชนะ</Badge>
                            )}
                            <span className="text-sm text-muted-foreground">
                                วันที่ประกาศ: {formatThaiDate(announcedAt)}
                            </span>
                        </div>
                        <h1 className="text-xl leading-tight font-black tracking-tight text-pretty text-foreground sm:text-2xl md:text-3xl">
                            {announcement.title}
                        </h1>
                        {tags.length > 0 && (
                            <div className="flex flex-wrap gap-1.5">
                                {tags.map((tag) => (
                                    <Badge
                                        key={tag}
                                        variant="secondary"
                                        className="max-w-full text-left break-words whitespace-normal"
                                    >
                                        {tag}
                                    </Badge>
                                ))}
                            </div>
                        )}
                        <p className="text-muted-foreground">
                            รหัสโครงการ: {projectReference}
                        </p>
                        {announcement.project_key && (
                            <p className="text-sm break-all text-muted-foreground">
                                รหัสอ้างอิงโครงการ: {announcement.project_key}
                            </p>
                        )}
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
                                    {primaryKind.isImage
                                        ? 'ดาวน์โหลดเอกสารต้นฉบับ'
                                        : 'ดาวน์โหลดเอกสาร PDF'}
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
                            <DetailCell label="หน่วยงานที่รับผิดชอบ">
                                <p className="font-medium break-words text-foreground">
                                    {announcement.organization}
                                </p>
                            </DetailCell>
                            <DetailCell
                                label={displayPriceLabel(
                                    announcement.display_price_source,
                                )}
                            >
                                <p className="text-sm font-medium text-foreground">
                                    {formatThaiBudget(
                                        verifiedDisplayPrice(
                                            announcement.display_price,
                                            announcement.display_price_source,
                                        ) ?? announcement.budget,
                                    )}
                                </p>
                            </DetailCell>
                            <DetailCell label="ประเภทประกาศ">
                                <p className="font-medium text-foreground">
                                    {labelOr(
                                        noticeTypeLabels,
                                        announcement.notice_type,
                                    )}
                                </p>
                            </DetailCell>
                            <DetailCell label="สิ้นสุดรับยื่นข้อเสนอ">
                                <p
                                    className={
                                        deadline
                                            ? 'font-bold text-destructive'
                                            : 'font-medium text-muted-foreground'
                                    }
                                >
                                    {formatThaiDate(deadline)}
                                </p>
                            </DetailCell>
                        </div>
                        <div className="grid grid-cols-1 divide-y divide-border border-t border-border md:grid-cols-2 md:divide-x md:divide-y-0 lg:grid-cols-4">
                            <DetailCell label="วิธีการจัดซื้อจัดจ้าง">
                                <p className="font-medium text-foreground">
                                    <ProcurementMethodLabel
                                        label={methodLabel}
                                    />
                                </p>
                            </DetailCell>
                            <DetailCell label="วันที่ประกาศเผยแพร่">
                                <p className="font-medium text-foreground">
                                    {formatThaiDate(announcedAt)}
                                </p>
                            </DetailCell>
                            <DetailCell label="การเผยแพร่">
                                <p className="font-medium text-foreground">
                                    {
                                        {
                                            draft: 'ฉบับร่าง',
                                            published: 'เผยแพร่แล้ว',
                                            hidden: 'ซ่อนจากสาธารณะ',
                                        }[announcement.publication_status]
                                    }
                                </p>
                            </DetailCell>
                            <DetailCell label="สถานะประกาศ">
                                <p className="font-medium text-foreground">
                                    {
                                        announcementStatusLabels[
                                            announcement.status ?? 'unknown'
                                        ]
                                    }
                                </p>
                            </DetailCell>
                        </div>
                        <div className="grid grid-cols-1 divide-y divide-border border-t border-border md:grid-cols-2 md:divide-x md:divide-y-0 lg:grid-cols-4">
                            <DetailCell label="ราคากลาง">
                                <p className="font-medium text-foreground">
                                    {formatThaiBudget(
                                        announcement.reference_price,
                                    )}
                                </p>
                            </DetailCell>
                            <DetailCell label="งบประมาณโครงการ">
                                <p className="font-medium text-foreground">
                                    {formatThaiBudget(announcement.budget)}
                                </p>
                            </DetailCell>
                            <DetailCell label="หมวดจัดซื้อ">
                                <p className="font-medium text-foreground">
                                    {labelOr(
                                        procurementCategoryLabels,
                                        announcement.procurement_category,
                                    )}
                                </p>
                            </DetailCell>
                            <DetailCell label="สถานะกระบวนการ">
                                <p className="font-medium text-foreground">
                                    {labelOr(
                                        processStatusLabels,
                                        announcement.process_status,
                                    )}
                                </p>
                            </DetailCell>
                        </div>
                    </CardContent>
                </Card>

                {isAward && (
                    <Card className="overflow-hidden">
                        <CardHeader className="flex flex-row items-center gap-2 border-b border-border bg-muted/30 py-4">
                            <Trophy className="h-5 w-5 text-primary" />
                            <CardTitle>
                                <h2 className="text-lg">ผลการเสนอราคา</h2>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="grid grid-cols-1 divide-y divide-border md:grid-cols-3 md:divide-x md:divide-y-0">
                                <DetailCell label="ผู้ชนะการเสนอราคา">
                                    <p className="font-medium break-words text-foreground">
                                        {announcement.winner_name ?? '-'}
                                    </p>
                                </DetailCell>
                                <DetailCell label="ราคาที่เสนอชนะ">
                                    <p className="font-medium text-foreground">
                                        {formatThaiBudget(
                                            announcement.winning_price,
                                        )}
                                    </p>
                                </DetailCell>
                                <DetailCell label="วันที่ประกาศผู้ชนะ">
                                    <p className="font-medium text-foreground">
                                        {formatThaiDate(
                                            announcement.award_announced_at,
                                        )}
                                    </p>
                                </DetailCell>
                            </div>
                            {bidders.length > 0 && (
                                <div className="border-t border-border p-5">
                                    <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                                        ผู้ยื่นข้อเสนอ
                                    </p>
                                    <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-foreground">
                                        {bidders.map((bidder, index) => (
                                            <li key={index}>
                                                {bidderText(bidder)}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                )}

                <div className="grid min-w-0 gap-6 lg:grid-cols-[2fr_1fr]">
                    <div className="flex min-w-0 flex-col gap-4">
                        <div className="flex items-center justify-between">
                            <h2 className="flex items-center gap-3 text-2xl font-bold text-foreground">
                                <FileText className="h-7 w-7 text-primary" />
                                {primaryKind.isImage
                                    ? 'เอกสารต้นฉบับ'
                                    : 'เอกสารข้อกำหนด (TOR)'}
                            </h2>
                        </div>

                        <div className="group relative flex h-[600px] flex-col overflow-hidden rounded-xl border border-border bg-muted shadow-lg">
                            <div className="flex h-12 shrink-0 items-center justify-between border-b border-border bg-primary px-4">
                                <div className="flex min-w-0 items-center gap-4 text-primary-foreground/80">
                                    <Menu className="h-5 w-5" />
                                    <span className="max-w-[260px] truncate text-sm font-medium">
                                        {primaryAttachment?.filename ??
                                            (primaryKind.isImage
                                                ? `TOR-${announcement.id}.jpg`
                                                : `TOR-${announcement.id}.pdf`)}
                                    </span>
                                </div>
                                <Badge variant="secondary">
                                    {primaryKind.badge}
                                </Badge>
                            </div>

                            <div className="relative flex flex-1 items-center justify-center overflow-hidden bg-muted p-4">
                                {primaryAttachment ? (
                                    <>
                                        {primaryKind.isImage ? (
                                            <img
                                                src={
                                                    primaryAttachment.preview_url
                                                }
                                                alt={primaryAttachment.filename}
                                                className="h-full w-full rounded-md bg-background object-contain"
                                            />
                                        ) : (
                                            <iframe
                                                src={
                                                    primaryAttachment.preview_url
                                                }
                                                title={
                                                    primaryAttachment.filename
                                                }
                                                className="h-full w-full rounded-md bg-background"
                                                style={{
                                                    maxWidth: '100%',
                                                    maxHeight: '100%',
                                                }}
                                            />
                                        )}
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
                                                    {primaryKind.isImage
                                                        ? 'เปิดเอกสารต้นฉบับในแท็บใหม่'
                                                        : 'เปิดเอกสาร PDF ในแท็บใหม่'}
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
                                                {workLocation}
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
                                    <div className="flex items-start gap-3">
                                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded bg-primary/10 text-primary">
                                            <Globe className="h-4 w-4" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-xs font-semibold text-muted-foreground uppercase">
                                                เว็บไซต์ติดต่อ
                                            </p>
                                            {announcement.contact_website ? (
                                                /^https?:\/\//i.test(
                                                    announcement.contact_website,
                                                ) ? (
                                                    <a
                                                        href={
                                                            announcement.contact_website
                                                        }
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-sm font-medium break-all text-primary hover:underline"
                                                    >
                                                        {
                                                            announcement.contact_website
                                                        }
                                                    </a>
                                                ) : (
                                                    <p className="text-sm font-medium break-all text-foreground">
                                                        {
                                                            announcement.contact_website
                                                        }
                                                    </p>
                                                )
                                            ) : (
                                                <p className="text-sm font-medium text-foreground">
                                                    -
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded bg-primary/10 text-primary">
                                            <Megaphone className="h-4 w-4" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-xs font-semibold text-muted-foreground uppercase">
                                                ผู้ประกาศ
                                            </p>
                                            <p className="text-sm font-medium break-words text-foreground">
                                                {announcement.announcer_name ??
                                                    '-'}
                                            </p>
                                            {announcement.announcer_position && (
                                                <p className="text-xs break-words text-muted-foreground">
                                                    {
                                                        announcement.announcer_position
                                                    }
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
                                                        {
                                                            attachmentKind(
                                                                file.mime_type,
                                                            ).badge
                                                        }
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
                                    {announcement.source_id ? (
                                        <p
                                            className="text-sm text-muted-foreground"
                                            data-test="source-attribution-source-id"
                                        >
                                            แหล่งข้อมูล:{' '}
                                            {announcement.source_id}
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
