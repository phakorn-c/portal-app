import { Link } from '@inertiajs/react';
import { ChevronRight, FileText, Search } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Pagination } from '@/components/ui/pagination';
import { StatusBadge } from '@/components/ui/status-badge';
import { TabsContent } from '@/components/ui/tabs';
import { serializeCriteria } from '@/components/user-history/serialize-criteria';
import { formatThaiBudget } from '@/lib/procurement-format';

export type PaginatedData<T> = {
    data: T[];
    current_page: number;
    last_page: number;
    total: number;
    per_page: number;
};

export type HistoryListingItem = {
    id: number;
    viewed_at: string;
    announcement: {
        id: number;
        title: string;
        organization: string;
        budget: number | string | null;
        status: 'open' | 'urgent' | 'closing' | 'closed' | null;
    };
};

export type HistorySearchItem = {
    id: number;
    criteria: Record<string, unknown>;
    result_count: number;
    searched_at: string;
};

export function ListingHistoryPanel({
    listingHistory,
}: {
    listingHistory: PaginatedData<HistoryListingItem>;
}) {
    return (
        <TabsContent value="listings">
            <Card>
                <CardContent className="p-0">
                    <div className="divide-y divide-border">
                        {listingHistory.data.map((item) => (
                            <Link
                                key={item.id}
                                href={`/procurement/announcements/${item.announcement.id}`}
                                className="group flex items-start gap-4 p-4 transition-colors hover:bg-muted"
                                data-test="history-row"
                            >
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                    <FileText className="h-5 w-5" />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2">
                                        <StatusBadge
                                            status={item.announcement.status}
                                        />
                                        <span className="text-xs text-muted-foreground">
                                            {new Date(
                                                item.viewed_at,
                                            ).toLocaleDateString('th-TH', {
                                                year: 'numeric',
                                                month: 'short',
                                                day: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit',
                                            })}
                                        </span>
                                    </div>
                                    <p className="mt-1 truncate font-medium text-foreground group-hover:text-primary">
                                        {item.announcement.title}
                                    </p>
                                    <p className="mt-0.5 text-sm text-muted-foreground">
                                        {item.announcement.organization} ·{' '}
                                        {formatThaiBudget(
                                            item.announcement.budget,
                                        )}
                                    </p>
                                </div>
                                <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary" />
                            </Link>
                        ))}
                        {listingHistory.data.length === 0 && (
                            <div className="p-8 text-center text-muted-foreground">
                                ยังไม่มีประวัติการดูประกาศ
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
            {listingHistory.last_page > 1 && (
                <div className="mt-4">
                    <Pagination
                        currentPage={listingHistory.current_page}
                        totalPages={listingHistory.last_page}
                        onPageChange={(page) => {
                            window.location.href = `/user/history?listing_page=${page}`;
                        }}
                    />
                </div>
            )}
        </TabsContent>
    );
}

export function SearchHistoryPanel({
    searchHistory,
}: {
    searchHistory: PaginatedData<HistorySearchItem>;
}) {
    return (
        <TabsContent value="searches">
            <Card>
                <CardContent className="p-0">
                    <div className="divide-y divide-border">
                        {searchHistory.data.map((item) => (
                            <Link
                                key={item.id}
                                href={`/procurement?${serializeCriteria(item.criteria)}`}
                                className="group flex items-start gap-4 p-4 transition-colors hover:bg-muted"
                                data-test="history-row"
                            >
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                    <Search className="h-5 w-5" />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs text-muted-foreground">
                                            {new Date(
                                                item.searched_at,
                                            ).toLocaleDateString('th-TH', {
                                                year: 'numeric',
                                                month: 'short',
                                                day: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit',
                                            })}
                                        </span>
                                    </div>
                                    <p className="mt-1 truncate font-medium text-foreground group-hover:text-primary">
                                        {typeof item.criteria.query === 'string'
                                            ? item.criteria.query
                                            : 'ค้นหาทั้งหมด'}
                                    </p>
                                    <p className="mt-0.5 text-sm text-muted-foreground">
                                        พบ {item.result_count} รายการ
                                    </p>
                                </div>
                                <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary" />
                            </Link>
                        ))}
                        {searchHistory.data.length === 0 && (
                            <div className="p-8 text-center text-muted-foreground">
                                ยังไม่มีประวัติการค้นหา
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
            {searchHistory.last_page > 1 && (
                <div className="mt-4">
                    <Pagination
                        currentPage={searchHistory.current_page}
                        totalPages={searchHistory.last_page}
                        onPageChange={(page) => {
                            window.location.href = `/user/history?search_page=${page}`;
                        }}
                    />
                </div>
            )}
        </TabsContent>
    );
}
