import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';

import { cn } from '@/lib/utils';

type AnnouncementStatus = 'open' | 'urgent' | 'closing' | 'closed';

const statusBadgeVariants = cva(
    'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold',
    {
        variants: {
            status: {
                open: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
                urgent: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
                closing:
                    'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
                closed: 'bg-muted text-muted-foreground',
                unknown:
                    'border border-border bg-background text-muted-foreground',
            },
        },
        defaultVariants: {
            status: 'open',
        },
    },
);

const dotVariants: Record<string, string> = {
    open: 'bg-emerald-500',
    urgent: 'bg-amber-500 motion-safe:animate-pulse',
    closing: 'bg-amber-500 motion-safe:animate-pulse',
    closed: 'bg-muted-foreground',
    unknown: 'bg-border',
};

const announcementStatusLabels = {
    open: 'เปิดรับข้อเสนอ',
    urgent: 'เร่งด่วน',
    closing: 'ใกล้ปิดรับ',
    closed: 'ปิดรับแล้ว',
    unknown: 'ไม่ทราบสถานะ',
} as const;

export interface StatusBadgeProps
    extends React.HTMLAttributes<HTMLSpanElement>,
        VariantProps<typeof statusBadgeVariants> {
    status: AnnouncementStatus | null;
    showDot?: boolean;
}

function StatusBadge({
    className,
    status,
    showDot = true,
    children,
    ...props
}: StatusBadgeProps) {
    const variant = status ?? 'unknown';

    return (
        <span
            className={cn(statusBadgeVariants({ status: variant }), className)}
            {...props}
        >
            {showDot && (
                <span
                    className={cn('h-1.5 w-1.5 rounded-full', dotVariants[variant])}
                />
            )}
            {children || announcementStatusLabels[variant]}
        </span>
    );
}

export {
    type AnnouncementStatus,
    announcementStatusLabels,
    StatusBadge,
    statusBadgeVariants,
};
