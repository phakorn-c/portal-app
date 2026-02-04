import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';

import { cn } from '@/lib/utils';

const statusBadgeVariants = cva(
    'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold',
    {
        variants: {
            status: {
                open: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
                urgent: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
                closing:
                    'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
                closed: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
            },
        },
        defaultVariants: {
            status: 'open',
        },
    },
);

const dotVariants: Record<string, string> = {
    open: 'bg-emerald-500',
    urgent: 'bg-amber-500 animate-pulse',
    closing: 'bg-amber-500 animate-pulse',
    closed: 'bg-slate-400',
};

const defaultLabels: Record<string, string> = {
    open: 'เปิดรับข้อเสนอ',
    urgent: 'เร่งด่วน',
    closing: 'ใกล้ปิดรับ',
    closed: 'ปิดรับแล้ว',
};

export interface StatusBadgeProps
    extends React.HTMLAttributes<HTMLSpanElement>,
        VariantProps<typeof statusBadgeVariants> {
    status: 'open' | 'urgent' | 'closing' | 'closed';
    showDot?: boolean;
}

function StatusBadge({
    className,
    status,
    showDot = true,
    children,
    ...props
}: StatusBadgeProps) {
    return (
        <span
            className={cn(statusBadgeVariants({ status }), className)}
            {...props}
        >
            {showDot && (
                <span
                    className={cn('h-1.5 w-1.5 rounded-full', dotVariants[status])}
                />
            )}
            {children || defaultLabels[status]}
        </span>
    );
}

export { StatusBadge, statusBadgeVariants };
