import { Link } from '@inertiajs/react';
import { BookmarkPlus, X } from 'lucide-react';
import type { SearchFilters } from '@/components/procurement-search/search-filters';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import type { FilterState } from '@/types/procurement';

export function ResultToolbar({
    search,
    total,
    canCreateSavedSearch,
    saveSearchSuccess,
    onSaveClick,
}: {
    search: SearchFilters;
    total: number;
    canCreateSavedSearch: boolean;
    saveSearchSuccess: string | null;
    onSaveClick: () => void;
}) {
    const {
        activeFilters,
        hasActiveFilters,
        clearAllFilters,
        sortBy,
        setSortBy,
        criteria,
        submitFilters,
    } = search;

    return (
        <div className="flex flex-col justify-between gap-4 rounded-xl border border-border bg-card p-4 md:flex-row md:items-center">
            <div className="space-y-2">
                <p className="flex items-center gap-2 text-sm text-muted-foreground">
                    พบทั้งหมด{' '}
                    <span className="text-lg font-bold text-foreground">
                        {total}
                    </span>{' '}
                    รายการ
                </p>
                <div className="flex flex-wrap gap-2">
                    {activeFilters.map((filter) => (
                        <Badge
                            key={filter.value}
                            variant="secondary"
                            className="gap-1.5 border border-primary/20 bg-primary/5 text-primary"
                        >
                            {filter.label}
                            <button
                                type="button"
                                aria-label={`ลบตัวกรอง ${filter.label}`}
                                onClick={filter.onRemove}
                                className="rounded-full hover:bg-primary/20"
                            >
                                <X className="h-3 w-3" />
                            </button>
                        </Badge>
                    ))}
                    {hasActiveFilters && (
                        <button
                            className="px-2 text-xs text-muted-foreground underline hover:text-primary"
                            onClick={clearAllFilters}
                        >
                            ล้างตัวกรอง
                        </button>
                    )}
                </div>
                {saveSearchSuccess && (
                    <p
                        className="text-sm font-medium text-emerald-600"
                        data-test="procurement-save-search-success"
                    >
                        {saveSearchSuccess}{' '}
                        <Link
                            href="/user/saved-searches"
                            className="underline underline-offset-4"
                        >
                            ดูรายการที่บันทึกไว้
                        </Link>
                    </p>
                )}
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                {canCreateSavedSearch && (
                    <Button
                        type="button"
                        variant="outline"
                        className="gap-2"
                        data-test="procurement-save-search-trigger"
                        onClick={onSaveClick}
                    >
                        <BookmarkPlus className="h-4 w-4" />
                        บันทึกการค้นหานี้
                    </Button>
                )}
                <Select
                    value={sortBy}
                    onValueChange={(value) => {
                        const next = value as FilterState['sortBy'];
                        setSortBy(next);
                        submitFilters({ ...criteria, sortBy: next });
                    }}
                >
                    <SelectTrigger className="w-[200px]">
                        <SelectValue placeholder="เรียงตาม" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="latest">ใหม่ล่าสุด</SelectItem>
                        <SelectItem value="deadline">
                            กำหนดส่งใกล้สุด
                        </SelectItem>
                        <SelectItem value="budget-high">
                            งบประมาณสูงสุด
                        </SelectItem>
                        <SelectItem value="budget-low">
                            งบประมาณต่ำสุด
                        </SelectItem>
                    </SelectContent>
                </Select>
            </div>
        </div>
    );
}
