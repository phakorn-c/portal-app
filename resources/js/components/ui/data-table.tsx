import * as React from 'react';

import { cn } from '@/lib/utils';

export interface Column<T> {
    key: string;
    header: string;
    cell?: (item: T, index: number) => React.ReactNode;
    className?: string;
    headerClassName?: string;
}

export interface DataTableProps<T> extends React.HTMLAttributes<HTMLDivElement> {
    data: T[];
    columns: Column<T>[];
    onRowClick?: (item: T, index: number) => void;
    emptyMessage?: string;
}

function DataTable<T extends Record<string, unknown>>({
    data,
    columns,
    onRowClick,
    emptyMessage = 'ไม่มีข้อมูล',
    className,
    ...props
}: DataTableProps<T>) {
    return (
        <div className={cn('overflow-x-auto', className)} {...props}>
            <table className="w-full text-left">
                <thead>
                    <tr className="border-b border-border bg-muted/50">
                        {columns.map((col) => (
                            <th
                                key={col.key}
                                className={cn(
                                    'px-4 py-3 text-sm font-semibold text-foreground',
                                    col.headerClassName,
                                )}
                            >
                                {col.header}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody className="divide-y divide-border">
                    {data.length === 0 ? (
                        <tr>
                            <td
                                colSpan={columns.length}
                                className="px-4 py-8 text-center text-sm text-muted-foreground"
                            >
                                {emptyMessage}
                            </td>
                        </tr>
                    ) : (
                        data.map((item, rowIndex) => (
                            <tr
                                key={rowIndex}
                                className={cn(
                                    'transition-colors hover:bg-muted/30',
                                    onRowClick && 'cursor-pointer',
                                )}
                                onClick={() => onRowClick?.(item, rowIndex)}
                            >
                                {columns.map((col) => (
                                    <td
                                        key={col.key}
                                        className={cn('px-4 py-3 text-sm', col.className)}
                                    >
                                        {col.cell
                                            ? col.cell(item, rowIndex)
                                            : String(item[col.key] ?? '')}
                                    </td>
                                ))}
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    );
}

export { DataTable };
