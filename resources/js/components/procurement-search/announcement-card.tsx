import { Link } from '@inertiajs/react';
import {
    Building2,
    CalendarDays,
    ChevronRight,
    Gavel,
    MapPin,
} from 'lucide-react';
import { ProcurementMethodLabel } from '@/components/procurement-method-label';
import type { SearchTaxonomy } from '@/components/procurement-search/search-filters';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    type AnnouncementStatus,
    StatusBadge,
} from '@/components/ui/status-badge';
import {
    displayPriceLabel,
    formatThaiBudget,
    formatThaiDate,
    verifiedDisplayPrice,
} from '@/lib/procurement-format';

export type SearchAnnouncement = {
    id: number;
    title: string;
    organization: string;
    method: string;
    budget: number | string | null;
    deadline: string | null;
    status: AnnouncementStatus | null;
    notice_type: string;
    procurement_category: string | null;
    display_price: number | string | null;
    display_price_source: string | null;
    province: string | null;
};

export function AnnouncementCard({
    announcement,
    methodLabels,
}: {
    announcement: SearchAnnouncement;
    methodLabels: SearchTaxonomy['methodLabels'];
}) {
    const isAward = announcement.notice_type === 'award';
    const isResult = isAward || announcement.status === 'closed';
    const price = verifiedDisplayPrice(
        announcement.display_price,
        announcement.display_price_source,
    );

    return (
        <article
            className={`group min-w-0 rounded-xl border bg-card p-5 shadow-sm transition-all duration-300 hover:border-primary/50 hover:shadow-md ${
                announcement.status === 'closed'
                    ? 'border-border bg-muted/30 opacity-80 hover:opacity-100'
                    : 'border-border'
            }`}
        >
            <div className="flex flex-col gap-4">
                <div className="flex items-start justify-between gap-4">
                    <div className="flex flex-wrap items-center gap-2">
                        <StatusBadge status={announcement.status} />
                        {isAward && (
                            <Badge variant="secondary">ประกาศผู้ชนะ</Badge>
                        )}
                    </div>
                    <span className="font-mono text-xs text-muted-foreground">
                        ID: {announcement.id}
                    </span>
                </div>

                <h3 className="text-base leading-relaxed font-bold text-balance text-foreground transition-colors group-hover:text-primary sm:text-lg">
                    {announcement.title}
                </h3>

                <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
                    <div className="flex min-w-0 items-start gap-1.5">
                        <Building2 className="h-4 w-4 text-primary" />
                        <span className="min-w-0 break-words">
                            หน่วยงาน: {announcement.organization}
                        </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <Gavel className="h-4 w-4 text-primary" />
                        <span>
                            <ProcurementMethodLabel
                                label={
                                    methodLabels[announcement.method] ??
                                    announcement.method
                                }
                            />
                        </span>
                    </div>
                    {announcement.province && (
                        <div className="flex items-center gap-1.5">
                            <MapPin className="h-4 w-4 text-primary" />
                            <span>จังหวัด{announcement.province}</span>
                        </div>
                    )}
                </div>

                <div className="flex flex-col items-start justify-between gap-4 border-t border-border pt-4 sm:flex-row sm:items-center">
                    <div className="flex w-full flex-wrap items-start gap-x-6 gap-y-4 sm:w-auto">
                        <div>
                            <p className="text-xs text-muted-foreground">
                                {displayPriceLabel(
                                    announcement.display_price_source,
                                )}
                            </p>
                            <p className="text-base font-bold text-primary tabular-nums">
                                {formatThaiBudget(price ?? announcement.budget)}
                            </p>
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground">
                                สิ้นสุดรับสมัคร
                            </p>
                            <p className="flex items-center gap-1 text-sm font-semibold text-foreground">
                                <CalendarDays className="h-4 w-4" />
                                {formatThaiDate(announcement.deadline)}
                            </p>
                        </div>
                    </div>
                    <Button
                        asChild
                        variant={isResult ? 'outline' : 'secondary'}
                        className="w-full gap-2 transition-all hover:bg-primary hover:text-primary-foreground sm:w-auto"
                    >
                        <Link
                            href={`/procurement/announcements/${announcement.id}`}
                        >
                            {isResult ? 'ดูผลการจัดซื้อ' : 'ดูรายละเอียด'}
                            <ChevronRight className="h-4 w-4" />
                        </Link>
                    </Button>
                </div>
            </div>
        </article>
    );
}
