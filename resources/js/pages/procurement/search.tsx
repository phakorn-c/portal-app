import { Head, Link, usePage } from '@inertiajs/react';
import { Search } from 'lucide-react';
import { useState } from 'react';
import {
    AnnouncementCard,
    type SearchAnnouncement,
} from '@/components/procurement-search/announcement-card';
import { FilterSidebar } from '@/components/procurement-search/filter-sidebar';
import { ResultToolbar } from '@/components/procurement-search/result-toolbar';
import { SavedSearchDialog } from '@/components/procurement-search/saved-search-dialog';
import {
    type SearchTaxonomy,
    type SearchCriteria,
    useSearchFilters,
} from '@/components/procurement-search/search-filters';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Pagination } from '@/components/ui/pagination';
import AppHeaderLayout from '@/layouts/app/app-header-layout';
import type { SharedData } from '@/types';

type AnnouncementPagination = {
    data: SearchAnnouncement[];
    total: number;
    current_page: number;
    last_page: number;
};

type PageProps = SharedData & {
    announcements: AnnouncementPagination;
    filters: SearchCriteria;
    pagination: AnnouncementPagination;
    taxonomy: SearchTaxonomy;
};

export default function ProcurementSearch() {
    const { auth, announcements, filters, pagination, taxonomy } =
        usePage<PageProps>().props;
    const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);
    const [saveSearchSuccess, setSaveSearchSuccess] = useState<string | null>(
        null,
    );
    const search = useSearchFilters(filters, taxonomy, () =>
        setSaveSearchSuccess(null),
    );
    const canCreateSavedSearch =
        auth.user !== null && auth.user.email_verified_at !== null;

    return (
        <AppHeaderLayout>
            <Head title="ประกาศจัดซื้อจัดจ้าง" />
            <div className="flex flex-col gap-8 px-4 py-6 md:px-8">
                <div className="rounded-2xl bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-6 md:p-10">
                    <div className="flex flex-col gap-6">
                        <div className="space-y-3">
                            <h1 className="text-3xl font-black tracking-tight text-foreground md:text-4xl">
                                ค้นหาและประกาศ{' '}
                                <span className="inline-block text-primary">
                                    จัดซื้อจัดจ้าง
                                </span>
                            </h1>
                            <p className="max-w-2xl text-base text-muted-foreground md:text-lg">
                                ตรวจสอบความโปร่งใสในการใช้จ่ายภาครัฐ
                                ค้นหาโอกาสในการยื่นข้อเสนอโครงการ{' '}
                                <span className="whitespace-nowrap">
                                    จัดซื้อจัดจ้าง
                                </span>
                                ทั่วจังหวัดขอนแก่น
                            </p>
                        </div>
                        <div className="flex flex-col gap-3 md:flex-row">
                            <div className="flex-1">
                                <label
                                    htmlFor="procurement-query"
                                    className="mb-2 block text-sm font-medium text-foreground"
                                >
                                    คำค้นประกาศ
                                </label>
                                <div className="relative">
                                    <Search className="pointer-events-none absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2 text-primary/70" />
                                    <Input
                                        id="procurement-query"
                                        value={search.query}
                                        onChange={(event) => {
                                            const nextQuery =
                                                event.target.value;
                                            search.setQuery(nextQuery);
                                            search.submitFilters({
                                                ...search.criteria,
                                                query: nextQuery,
                                            });
                                        }}
                                        placeholder="ค้นหาด้วยคำสำคัญ, เลขที่โครงการ หรือชื่อหน่วยงาน..."
                                        className="h-14 rounded-xl border-none bg-card pr-28 pl-12 text-base shadow-md ring-1 ring-border focus-visible:ring-2 focus-visible:ring-primary"
                                    />
                                    <Button
                                        className="absolute top-1.5 right-1.5 h-11 rounded-lg px-6"
                                        onClick={() =>
                                            search.submitFilters(
                                                search.criteria,
                                            )
                                        }
                                    >
                                        ค้นหา
                                    </Button>
                                </div>
                            </div>
                            {!auth.user && (
                                <Button
                                    asChild
                                    variant="outline"
                                    className="h-14 rounded-xl px-6 md:self-end"
                                >
                                    <Link href="/register">ลงทะเบียน</Link>
                                </Button>
                            )}
                        </div>
                    </div>
                </div>

                <div className="grid gap-8 lg:grid-cols-12">
                    <FilterSidebar search={search} taxonomy={taxonomy} />
                    <div className="space-y-6 lg:col-span-9">
                        <h2 className="sr-only">ผลการค้นหา</h2>
                        <ResultToolbar
                            search={search}
                            total={pagination.total}
                            canCreateSavedSearch={canCreateSavedSearch}
                            saveSearchSuccess={saveSearchSuccess}
                            onSaveClick={() => setIsSaveDialogOpen(true)}
                        />
                        <div className="space-y-4">
                            {announcements.data.map((announcement) => (
                                <AnnouncementCard
                                    key={announcement.id}
                                    announcement={announcement}
                                    methodLabels={taxonomy.methodLabels}
                                />
                            ))}
                        </div>
                        {pagination.last_page > 1 && (
                            <div className="mt-8">
                                <Pagination
                                    currentPage={pagination.current_page}
                                    totalPages={pagination.last_page}
                                    onPageChange={(page) =>
                                        search.submitFilters(
                                            search.criteria,
                                            page,
                                        )
                                    }
                                />
                            </div>
                        )}
                    </div>
                </div>
            </div>
            <SavedSearchDialog
                open={isSaveDialogOpen}
                onOpenChange={setIsSaveDialogOpen}
                criteria={search.criteria}
                onSaved={setSaveSearchSuccess}
            />
        </AppHeaderLayout>
    );
}
