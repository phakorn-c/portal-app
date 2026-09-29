import { Head, usePage } from '@inertiajs/react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    ListingHistoryPanel,
    SearchHistoryPanel,
} from '@/components/user-history/history-panels';
import type {
    HistoryListingItem,
    HistorySearchItem,
    PaginatedData,
} from '@/components/user-history/history-panels';
import { HistorySidebar } from '@/components/user-history/history-sidebar';
import AppHeaderLayout from '@/layouts/app/app-header-layout';
import type { SharedData } from '@/types';

export default function UserHistory({
    listingHistory,
    searchHistory,
}: {
    listingHistory: PaginatedData<HistoryListingItem>;
    searchHistory: PaginatedData<HistorySearchItem>;
}) {
    const { auth } = usePage<SharedData>().props;
    const user = auth.user;

    return (
        <AppHeaderLayout>
            <Head title="ประวัติการเข้าชม" />
            <div className="flex min-h-[calc(100vh-4rem)]">
                <HistorySidebar user={user} />

                <main className="flex-1 overflow-y-auto">
                    <div className="flex flex-col gap-8 p-6 md:p-8">
                        <div>
                            <h1 className="text-3xl font-black tracking-tight text-foreground">
                                ประวัติการเข้าชม
                            </h1>
                            <p className="mt-1 text-muted-foreground">
                                ประวัติการดูประกาศและการค้นหาของคุณ
                            </p>
                        </div>

                        <Tabs defaultValue="listings" className="w-full">
                            <TabsList className="mb-4">
                                <TabsTrigger value="listings">
                                    ประวัติการดูประกาศ
                                </TabsTrigger>
                                <TabsTrigger value="searches">
                                    ประวัติการค้นหา
                                </TabsTrigger>
                            </TabsList>

                            <ListingHistoryPanel
                                listingHistory={listingHistory}
                            />
                            <SearchHistoryPanel searchHistory={searchHistory} />
                        </Tabs>
                    </div>
                </main>
            </div>
        </AppHeaderLayout>
    );
}
