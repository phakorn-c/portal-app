import { Link } from '@inertiajs/react';
import { ArrowLeft, ShieldCheck } from 'lucide-react';
import { statusLabels } from '@/components/extraction-review/shared';
import { Button } from '@/components/ui/button';
import * as adminRoutes from '@/routes/admin';

type ReviewHeaderProps = {
    title: string;
    status: string;
    attemptCount: number;
    approvedBy: number | null;
};

export function ReviewHeader({
    title,
    status,
    attemptCount,
    approvedBy,
}: ReviewHeaderProps) {
    return (
        <div className="flex flex-col gap-6 rounded-2xl border border-border bg-card p-6 md:p-8">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm font-semibold text-primary">
                        <ShieldCheck className="h-4 w-4" />
                        Admin Portal
                    </div>
                    <h1 className="text-2xl font-black tracking-tight text-foreground md:text-3xl">
                        ตรวจสอบการสกัดเอกสาร
                    </h1>
                    <p className="text-sm break-all text-muted-foreground">
                        {title}
                    </p>
                </div>
                <Button asChild variant="outline" className="gap-2 shadow-sm">
                    <Link href={adminRoutes.dashboard.url()}>
                        <ArrowLeft className="h-4 w-4" />
                        กลับไปหน้าหลัก
                    </Link>
                </Button>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-sm">
                <span
                    className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700"
                    data-test="extraction-status"
                >
                    {statusLabels[status] ?? status}
                </span>
                <span
                    className="text-muted-foreground"
                    data-test="extraction-attempts"
                >
                    ความพยายาม {attemptCount}/3
                </span>
                {approvedBy && (
                    <span
                        className="text-muted-foreground"
                        data-test="extraction-approved"
                    >
                        อนุมัติโดยผู้ใช้ #{approvedBy}
                    </span>
                )}
            </div>
        </div>
    );
}
