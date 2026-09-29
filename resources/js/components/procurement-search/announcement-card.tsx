import { Link } from '@inertiajs/react';
import { Building2, CalendarDays, ChevronRight, Gavel } from 'lucide-react';
import { ProcurementMethodLabel } from '@/components/procurement-method-label';
import type { SearchTaxonomy } from '@/components/procurement-search/search-filters';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/status-badge';
import { formatThaiBudget, formatThaiDate } from '@/lib/procurement-format';

export type SearchAnnouncement = {
    id: number;
    title: string;
    organization: string;
    category: string;
    method: string;
    budget: number | string;
    deadline: string;
    status: 'open' | 'urgent' | 'closing' | 'closed';
};

export function AnnouncementCard({
    announcement,
    methodLabels,
}: {
    announcement: SearchAnnouncement;
    methodLabels: SearchTaxonomy['methodLabels'];
}) {
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
                    <StatusBadge status={announcement.status} />
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
                </div>

                <div className="flex flex-col items-start justify-between gap-4 border-t border-border pt-4 sm:flex-row sm:items-center">
                    <div className="flex w-full flex-wrap items-start gap-x-6 gap-y-4 sm:w-auto">
                        <div>
                            <p className="text-xs text-muted-foreground">
                                งบประมาณ
                            </p>
                            <p className="text-base font-bold text-primary tabular-nums">
                                {formatThaiBudget(announcement.budget)}
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
                        variant={
                            announcement.status === 'closed'
                                ? 'outline'
                                : 'secondary'
                        }
                        className="w-full gap-2 transition-all hover:bg-primary hover:text-primary-foreground sm:w-auto"
                    >
                        <Link
                            href={`/procurement/announcements/${announcement.id}`}
                        >
                            {announcement.status === 'closed'
                                ? 'ดูผลการจัดซื้อ'
                                : 'ดูรายละเอียด'}
                            <ChevronRight className="h-4 w-4" />
                        </Link>
                    </Button>
                </div>
            </div>
        </article>
    );
}
