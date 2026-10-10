import { Head, Link, usePage } from '@inertiajs/react';
import {
    Building2,
    CircleHelp,
    FileText,
    RotateCcw,
    Wallet,
} from 'lucide-react';
import { AgencyChart } from '@/components/procurement-overview/agency-chart';
import { AgencyTable } from '@/components/procurement-overview/agency-table';
import {
    count,
    millions,
    type Agency,
} from '@/components/procurement-overview/overview-data';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import AppHeaderLayout from '@/layouts/app/app-header-layout';
import type { SharedData } from '@/types';

type OverviewProps = SharedData & {
    summary: {
        readonly announcements: number;
        readonly agencies: number;
        readonly projects: number;
        readonly known_budget: number;
        readonly unknown_budget_projects: number;
    };
    agencies: readonly Agency[];
    agencyOptions: readonly string[];
    filters: {
        readonly period: 'all' | '30d' | 'year';
        readonly agency: string;
    };
    updatedAt: string | null;
};

const updatedDate = new Intl.DateTimeFormat('th-TH-u-ca-buddhist-nu-latn', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Bangkok',
});

export default function ProcurementOverview() {
    const { summary, agencies, agencyOptions, filters, updatedAt } =
        usePage<OverviewProps>().props;
    const visibleAgencies = summary.announcements > 0 ? agencies : [];
    const summaryCards = [
        {
            label: 'ประกาศที่เผยแพร่',
            value: count.format(summary.announcements),
            detail: 'ฉบับ',
            icon: FileText,
            tone: 'bg-primary/10 text-primary dark:text-blue-400',
        },
        {
            label: 'หน่วยงานที่มีข้อมูล',
            value: count.format(summary.agencies),
            detail: 'แห่ง',
            icon: Building2,
            tone: 'text-chart-2 bg-chart-2/10',
        },
        {
            label: 'งบประมาณที่ยืนยันแล้ว',
            value: `฿ ${millions.format(summary.known_budget / 1_000_000)} ล้าน`,
            detail: `${count.format(summary.projects - summary.unknown_budget_projects)} จาก ${count.format(summary.projects)} โครงการ`,
            icon: Wallet,
            tone: 'text-chart-2 bg-chart-2/10',
        },
        {
            label: 'โครงการที่ไม่ทราบงบ',
            value: count.format(summary.unknown_budget_projects),
            detail: 'ไม่รวมในยอดเงิน',
            icon: CircleHelp,
            tone: 'bg-chart-1/10 text-chart-1 dark:bg-amber-400/10 dark:text-amber-400',
        },
    ] as const;

    return (
        <AppHeaderLayout>
            <Head title="ภาพรวมข้อมูลในระบบ" />
            <div className="flex min-w-0 flex-col gap-4 px-4 py-6 md:gap-6 md:px-8 md:py-8">
                <div className="flex flex-wrap items-end justify-between gap-2">
                    <div>
                        <h1 className="text-3xl font-bold text-foreground md:text-4xl">
                            ภาพรวมข้อมูลในระบบ
                        </h1>
                        <p className="mt-1 text-base text-muted-foreground">
                            เฉพาะประกาศที่ตรวจสอบแล้วและเผยแพร่ ·
                            รวมงบครั้งเดียวต่อโครงการ
                        </p>
                    </div>
                    <p className="text-sm text-muted-foreground">
                        {updatedAt
                            ? `อัปเดตข้อมูลล่าสุด ${updatedDate.format(new Date(updatedAt))}`
                            : 'ไม่ทราบเวลาปรับปรุงข้อมูลล่าสุด'}
                    </p>
                </div>

                <form
                    action="/overview"
                    method="get"
                    className="flex flex-col gap-4 rounded-lg border border-border bg-card p-4 lg:flex-row lg:items-end"
                >
                    <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:items-center">
                        <label
                            htmlFor="overview-period"
                            className="shrink-0 text-sm font-semibold"
                        >
                            ช่วงวันที่ประกาศ
                        </label>
                        <select
                            id="overview-period"
                            name="period"
                            defaultValue={filters.period}
                            className="h-11 min-w-0 flex-1 rounded-md border border-input bg-background px-3 text-base text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                        >
                            <option value="all">ทั้งหมด</option>
                            <option value="30d">30 วันที่ผ่านมา</option>
                            <option value="year">ปีนี้</option>
                        </select>
                    </div>
                    <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:items-center">
                        <label
                            htmlFor="overview-agency"
                            className="shrink-0 text-sm font-semibold"
                        >
                            หน่วยงาน
                        </label>
                        <select
                            id="overview-agency"
                            name="agency"
                            defaultValue={filters.agency}
                            className="h-11 min-w-0 flex-1 rounded-md border border-input bg-background px-3 text-base text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                        >
                            <option value="">ทั้งหมด</option>
                            {agencyOptions.map((name) => (
                                <option key={name} value={name}>
                                    {name}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <Button type="submit" className="h-11">
                            แสดงผล
                        </Button>
                        <Button variant="outline" asChild className="h-11">
                            <Link href="/overview">
                                <RotateCcw aria-hidden="true" /> ล้างตัวกรอง
                            </Link>
                        </Button>
                    </div>
                </form>

                <section
                    aria-label="สรุปข้อมูล"
                    className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
                >
                    {summaryCards.map(
                        ({ label, value, detail, icon: Icon, tone }) => (
                            <Card key={label} className="min-w-0 gap-2 py-4">
                                <CardContent className="flex items-start gap-4 px-5">
                                    <span
                                        className={`flex size-12 shrink-0 items-center justify-center rounded-full ${tone}`}
                                    >
                                        <Icon
                                            aria-hidden="true"
                                            className="size-6"
                                        />
                                    </span>
                                    <div className="min-w-0">
                                        <h2 className="text-sm font-semibold text-foreground">
                                            {label}
                                        </h2>
                                        <p className="text-3xl font-bold wrap-anywhere text-foreground tabular-nums">
                                            {value}
                                        </p>
                                        <p className="text-sm text-muted-foreground">
                                            {detail}
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>
                        ),
                    )}
                </section>

                <section
                    aria-label="กราฟเปรียบเทียบหน่วยงาน"
                    className="grid min-w-0 gap-4 lg:grid-cols-2"
                >
                    <AgencyChart
                        title="จำนวนประกาศตามหน่วยงาน"
                        agencies={visibleAgencies}
                        metric="announcements"
                    />
                    <AgencyChart
                        title="งบประมาณที่ยืนยันตามหน่วยงาน (ล้านบาท)"
                        agencies={visibleAgencies}
                        metric="known_budget"
                    />
                </section>

                <AgencyTable agencies={visibleAgencies} />
                <p className="text-sm text-muted-foreground">
                    รวมเฉพาะงบประมาณที่มีหลักฐาน ·
                    ไม่ใช่ราคากลางหรือราคาที่ชนะรวม · ไม่ใช่งบทั้งหมดของหน่วยงาน
                </p>
            </div>
        </AppHeaderLayout>
    );
}
