import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';
import * as React from 'react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface PaginationProps extends React.HTMLAttributes<HTMLElement> {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    siblingCount?: number;
}

function generatePaginationRange(
    currentPage: number,
    totalPages: number,
    siblingCount: number = 1,
): (number | 'ellipsis')[] {
    const totalPageNumbers = siblingCount * 2 + 5;

    if (totalPages <= totalPageNumbers) {
        return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const leftSiblingIndex = Math.max(currentPage - siblingCount, 1);
    const rightSiblingIndex = Math.min(currentPage + siblingCount, totalPages);

    const shouldShowLeftDots = leftSiblingIndex > 2;
    const shouldShowRightDots = rightSiblingIndex < totalPages - 1;

    if (!shouldShowLeftDots && shouldShowRightDots) {
        const leftItemCount = 3 + 2 * siblingCount;
        const leftRange = Array.from({ length: leftItemCount }, (_, i) => i + 1);
        return [...leftRange, 'ellipsis', totalPages];
    }

    if (shouldShowLeftDots && !shouldShowRightDots) {
        const rightItemCount = 3 + 2 * siblingCount;
        const rightRange = Array.from(
            { length: rightItemCount },
            (_, i) => totalPages - rightItemCount + i + 1,
        );
        return [1, 'ellipsis', ...rightRange];
    }

    const middleRange = Array.from(
        { length: rightSiblingIndex - leftSiblingIndex + 1 },
        (_, i) => leftSiblingIndex + i,
    );

    return [1, 'ellipsis', ...middleRange, 'ellipsis', totalPages];
}

function Pagination({
    currentPage,
    totalPages,
    onPageChange,
    siblingCount = 1,
    className,
    ...props
}: PaginationProps) {
    const pages = generatePaginationRange(currentPage, totalPages, siblingCount);

    return (
        <nav
            role="navigation"
            aria-label="pagination"
            className={cn('flex items-center justify-center gap-1', className)}
            {...props}
        >
            <Button
                variant="outline"
                size="icon"
                className="h-10 w-10"
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1}
                aria-label="Go to previous page"
            >
                <ChevronLeft className="h-4 w-4" />
            </Button>

            {pages.map((page, index) =>
                page === 'ellipsis' ? (
                    <span
                        key={`ellipsis-${index}`}
                        className="flex h-10 w-10 items-center justify-center"
                        aria-hidden
                    >
                        <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                    </span>
                ) : (
                    <Button
                        key={page}
                        variant={page === currentPage ? 'default' : 'outline'}
                        size="icon"
                        className="h-10 w-10"
                        onClick={() => onPageChange(page)}
                        aria-label={`Go to page ${page}`}
                        aria-current={page === currentPage ? 'page' : undefined}
                    >
                        {page}
                    </Button>
                ),
            )}

            <Button
                variant="outline"
                size="icon"
                className="h-10 w-10"
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                aria-label="Go to next page"
            >
                <ChevronRight className="h-4 w-4" />
            </Button>
        </nav>
    );
}

export { Pagination };
