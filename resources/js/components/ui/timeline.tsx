import * as React from 'react';

import { cn } from '@/lib/utils';

export interface TimelineItem {
    date: string;
    title: string;
    description?: string;
    status: 'completed' | 'current' | 'upcoming';
    icon?: React.ReactNode;
}

export interface TimelineProps extends React.HTMLAttributes<HTMLOListElement> {
    items: TimelineItem[];
}

const statusColors: Record<TimelineItem['status'], string> = {
    completed: 'bg-emerald-500 text-white',
    current: 'bg-primary text-primary-foreground',
    upcoming: 'bg-muted text-muted-foreground',
};

function Timeline({ items, className, ...props }: TimelineProps) {
    return (
        <ol
            className={cn('relative ml-3 border-l-2 border-border', className)}
            {...props}
        >
            {items.map((item, index) => (
                <li key={index} className="mb-6 ml-6 last:mb-0">
                    <span
                        className={cn(
                            'absolute -left-3 flex h-6 w-6 items-center justify-center rounded-full ring-4 ring-background',
                            statusColors[item.status],
                        )}
                    >
                        {item.icon || (
                            <span className="h-2 w-2 rounded-full bg-current opacity-70" />
                        )}
                    </span>
                    <h3 className="text-sm font-semibold text-foreground">
                        {item.title}
                    </h3>
                    <time className="text-xs text-muted-foreground">
                        {item.date}
                    </time>
                    {item.description && (
                        <p className="mt-1 text-sm text-muted-foreground">
                            {item.description}
                        </p>
                    )}
                </li>
            ))}
        </ol>
    );
}

export { Timeline };
