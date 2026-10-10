import { Link } from '@inertiajs/react';
import {
    count,
    millions,
    type Agency,
} from '@/components/procurement-overview/overview-data';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function AgencyChart({
    title,
    agencies,
    metric,
}: {
    readonly title: string;
    readonly agencies: readonly Agency[];
    readonly metric: 'announcements' | 'known_budget';
}) {
    const max = Math.max(0, ...agencies.map((agency) => agency[metric]));
    const isBudget = metric === 'known_budget';

    return (
        <Card className="min-w-0 gap-4 py-5">
            <CardHeader className="px-5">
                <CardTitle>
                    <h2 className="text-xl font-semibold text-foreground">
                        {title}
                    </h2>
                </CardTitle>
            </CardHeader>
            <CardContent className="px-5">
                {agencies.length === 0 ? (
                    <p
                        data-test="overview-empty"
                        className="py-8 text-base text-muted-foreground"
                    >
                        ไม่มีข้อมูลหน่วยงานตามตัวกรองนี้{' '}
                        <Link
                            href="/overview"
                            className="text-primary underline"
                        >
                            ล้างตัวกรอง
                        </Link>
                    </p>
                ) : (
                    <ul className="space-y-4">
                        {agencies.map((agency) => {
                            const value = agency[metric];
                            const label = isBudget
                                ? millions.format(value / 1_000_000)
                                : count.format(value);

                            return (
                                <li
                                    key={agency.name}
                                    className="grid min-w-0 gap-2 sm:grid-cols-[minmax(0,11rem)_minmax(0,1fr)] sm:items-center"
                                >
                                    <span className="min-w-0 text-sm wrap-anywhere text-foreground">
                                        {agency.name}
                                    </span>
                                    <div className="flex min-w-0 items-center gap-3">
                                        <div className="h-5 min-w-0 flex-1 overflow-hidden rounded-sm bg-muted">
                                            <div
                                                role="meter"
                                                aria-label={`${agency.name}: ${label} ${isBudget ? 'ล้านบาท' : 'ประกาศ'}`}
                                                aria-valuemin={0}
                                                aria-valuemax={max || 1}
                                                aria-valuenow={value}
                                                aria-valuetext={`${label} ${isBudget ? 'ล้านบาท' : 'ประกาศ'}`}
                                                className={`h-full rounded-sm ${isBudget ? 'bg-chart-2' : 'bg-primary dark:bg-blue-400'}`}
                                                style={{
                                                    width: `${max > 0 ? (value / max) * 100 : 0}%`,
                                                }}
                                            />
                                        </div>
                                        <span className="w-16 shrink-0 text-right text-sm font-semibold text-foreground tabular-nums">
                                            {label}
                                        </span>
                                    </div>
                                </li>
                            );
                        })}
                    </ul>
                )}
            </CardContent>
        </Card>
    );
}
