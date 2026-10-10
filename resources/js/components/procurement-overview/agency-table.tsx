import { Link } from '@inertiajs/react';
import { Download } from 'lucide-react';
import {
    count,
    millions,
    type Agency,
} from '@/components/procurement-overview/overview-data';
import { Button } from '@/components/ui/button';

export function AgencyTable({
    agencies,
}: {
    readonly agencies: readonly Agency[];
}) {
    function downloadCsv() {
        const rows = [
            ['หน่วยงาน', 'ประกาศ', 'โครงการ', 'งบที่ยืนยัน (ล้านบาท)'],
            ...agencies.map((agency) => [
                agency.name,
                count.format(agency.announcements),
                count.format(agency.projects),
                millions.format(agency.known_budget / 1_000_000),
            ]),
        ];
        const csv = rows
            .map((row) =>
                row
                    .map(
                        (cell) =>
                            `"${cell.replace(/^\s*[=+\-@]/, "'$&").replaceAll('"', '""')}"`,
                    )
                    .join(','),
            )
            .join('\r\n');
        const url = URL.createObjectURL(
            new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' }),
        );
        const link = document.createElement('a');
        link.href = url;
        link.download = 'procurement-overview.csv';
        document.body.append(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(url);
    }

    return (
        <section className="min-w-0 overflow-hidden rounded-lg border border-border bg-card">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border p-4">
                <h2 className="text-xl font-semibold text-foreground">
                    เปรียบเทียบหน่วยงาน
                </h2>
                <Button
                    variant="outline"
                    type="button"
                    onClick={downloadCsv}
                    disabled={agencies.length === 0}
                    className="h-11"
                >
                    <Download aria-hidden="true" /> ดาวน์โหลดตาราง CSV
                </Button>
            </div>
            <table className="block w-full text-sm md:table">
                <thead className="sr-only md:not-sr-only md:table-header-group md:bg-muted">
                    <tr>
                        <th scope="col" className="p-3 text-left font-semibold">
                            หน่วยงาน
                        </th>
                        <th
                            scope="col"
                            className="p-3 text-right font-semibold"
                        >
                            ประกาศ
                        </th>
                        <th
                            scope="col"
                            className="p-3 text-right font-semibold"
                        >
                            โครงการ
                        </th>
                        <th
                            scope="col"
                            className="p-3 text-right font-semibold"
                        >
                            งบที่ยืนยัน (ล้านบาท)
                        </th>
                        <th scope="col" className="p-3 text-left font-semibold">
                            ดูเอกสาร
                        </th>
                    </tr>
                </thead>
                <tbody className="block md:table-row-group">
                    {agencies.map((agency) => (
                        <tr
                            key={agency.name}
                            className="grid grid-cols-2 gap-2 border-t border-border p-4 first:border-t-0 md:table-row md:p-0"
                        >
                            <th
                                scope="row"
                                className="col-span-2 min-w-0 text-left font-medium wrap-anywhere md:p-3"
                            >
                                {agency.name}
                            </th>
                            <td className="text-foreground md:p-3 md:text-right">
                                <span className="text-muted-foreground md:hidden">
                                    ประกาศ ·{' '}
                                </span>
                                {count.format(agency.announcements)}
                            </td>
                            <td className="text-foreground md:p-3 md:text-right">
                                <span className="text-muted-foreground md:hidden">
                                    โครงการ ·{' '}
                                </span>
                                {count.format(agency.projects)}
                            </td>
                            <td className="col-span-2 text-foreground md:p-3 md:text-right">
                                <span className="text-muted-foreground md:hidden">
                                    งบที่ยืนยัน ·{' '}
                                </span>
                                {millions.format(
                                    agency.known_budget / 1_000_000,
                                )}
                            </td>
                            <td className="col-span-2 md:p-3">
                                <Link
                                    href={`/procurement?organization=${encodeURIComponent(agency.name)}`}
                                    className="inline-flex min-h-11 items-center font-medium text-primary underline-offset-4 hover:underline focus-visible:rounded-sm focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                                >
                                    ดูประกาศ
                                    <span className="sr-only">
                                        ของ{agency.name}
                                    </span>{' '}
                                    →
                                </Link>
                            </td>
                        </tr>
                    ))}
                    {agencies.length === 0 && (
                        <tr className="block p-6 md:table-row">
                            <td
                                colSpan={5}
                                data-test="overview-empty"
                                className="text-base text-muted-foreground md:p-8"
                            >
                                ไม่มีข้อมูลหน่วยงานตามตัวกรองนี้{' '}
                                <Link
                                    href="/overview"
                                    className="text-primary underline"
                                >
                                    ล้างตัวกรอง
                                </Link>
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </section>
    );
}
