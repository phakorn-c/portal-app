import { SlidersHorizontal } from 'lucide-react';
import { ProcurementMethodLabel } from '@/components/procurement-method-label';
import type {
    SearchFilters,
    SearchTaxonomy,
} from '@/components/procurement-search/search-filters';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';

export function FilterSidebar({
    search,
    taxonomy,
}: {
    search: SearchFilters;
    taxonomy: SearchTaxonomy;
}) {
    const {
        budgetRange,
        setBudgetRange,
        criteria,
        submitFilters,
        selectedOrganizations,
        setSelectedOrganizations,
        selectedMethods,
        setSelectedMethods,
        selectedCategories,
        setSelectedCategories,
        selectedNoticeTypes,
        setSelectedNoticeTypes,
        selectedProvinces,
        setSelectedProvinces,
        selectedTags,
        setSelectedTags,
        toggleFilter,
        clearAllFilters,
        hasActiveFilters,
    } = search;

    return (
        <aside className="lg:col-span-3">
            <Card className="sticky top-24">
                <CardHeader className="border-b border-border pb-4">
                    <div className="flex items-center justify-between">
                        <CardTitle>
                            <h2 className="flex items-center gap-2 text-xl font-bold">
                                <SlidersHorizontal className="h-5 w-5 text-primary" />
                                ตัวกรอง
                            </h2>
                        </CardTitle>
                        <Button
                            variant="ghost"
                            className="h-8 px-2 text-xs text-muted-foreground hover:text-primary"
                            onClick={clearAllFilters}
                            disabled={!hasActiveFilters}
                        >
                            ล้างทั้งหมด
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="space-y-8 pt-6">
                    <div className="space-y-4">
                        <h3 className="text-sm font-bold tracking-wide text-foreground uppercase">
                            ช่วงงบประมาณ
                        </h3>
                        <div className="px-1">
                            <Slider
                                value={[
                                    budgetRange[0],
                                    budgetRange[1] ?? 10000000,
                                ]}
                                onValueChange={(value) => {
                                    const next: [number, number | null] = [
                                        value[0] ?? 0,
                                        value[1] === 10000000
                                            ? null
                                            : (value[1] ?? null),
                                    ];
                                    setBudgetRange(next);
                                    submitFilters({
                                        ...criteria,
                                        budgetRange: next,
                                    });
                                }}
                                min={0}
                                max={10000000}
                                step={100000}
                                thumbLabels={[
                                    'งบประมาณต่ำสุด',
                                    'งบประมาณสูงสุด',
                                ]}
                                className="w-full"
                            />
                            <div className="mt-3 flex justify-between text-sm text-muted-foreground">
                                <span>0 บาท</span>
                                <span>10 ล้านขึ้นไป: ไม่จำกัด</span>
                            </div>
                            <div className="mt-3 grid grid-cols-2 gap-2">
                                <div className="relative">
                                    <span className="absolute top-2 left-2 text-xs text-muted-foreground">
                                        ฿
                                    </span>
                                    <Input
                                        placeholder="ต่ำสุด"
                                        className="h-9 pl-6 text-sm"
                                        value={budgetRange[0]}
                                        readOnly
                                    />
                                </div>
                                <div className="relative">
                                    <span className="absolute top-2 left-2 text-xs text-muted-foreground">
                                        ฿
                                    </span>
                                    <Input
                                        placeholder="สูงสุด"
                                        className="h-9 pl-6 text-sm"
                                        value={budgetRange[1] ?? 'ไม่จำกัด'}
                                        readOnly
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="space-y-3">
                        <h3 className="text-sm font-bold tracking-wide text-foreground uppercase">
                            หน่วยงาน / ภาคส่วน
                        </h3>
                        <div className="custom-scrollbar max-h-48 space-y-2 overflow-y-auto pr-2">
                            {taxonomy.organizations.map((organization) => (
                                <label
                                    key={organization.value}
                                    className="group flex cursor-pointer items-start gap-3"
                                >
                                    <Checkbox
                                        checked={selectedOrganizations.includes(
                                            organization.value,
                                        )}
                                        onCheckedChange={() =>
                                            toggleFilter(
                                                organization.value,
                                                selectedOrganizations,
                                                setSelectedOrganizations,
                                                'organizations',
                                            )
                                        }
                                    />
                                    <span className="text-sm text-muted-foreground transition-colors group-hover:text-primary">
                                        {organization.label}
                                    </span>
                                </label>
                            ))}
                        </div>
                    </div>
                    <div className="space-y-3">
                        <h3 className="text-sm font-bold tracking-wide text-foreground uppercase">
                            วิธีการจัดซื้อจัดจ้าง
                        </h3>
                        <div className="space-y-2">
                            {taxonomy.methods.map((method) => (
                                <label
                                    key={method.value}
                                    className="group flex cursor-pointer items-center gap-3"
                                >
                                    <Checkbox
                                        checked={selectedMethods.includes(
                                            method.value,
                                        )}
                                        onCheckedChange={() =>
                                            toggleFilter(
                                                method.value,
                                                selectedMethods,
                                                setSelectedMethods,
                                                'methods',
                                            )
                                        }
                                    />
                                    <span className="text-sm text-muted-foreground transition-colors group-hover:text-primary">
                                        <ProcurementMethodLabel
                                            label={method.label}
                                        />
                                    </span>
                                </label>
                            ))}
                        </div>
                    </div>
                    <div className="space-y-3">
                        <h3 className="text-sm font-bold tracking-wide text-foreground uppercase">
                            หมวดหมู่ / ประเภทงาน
                        </h3>
                        <div className="space-y-2">
                            {taxonomy.categories.map((category) => (
                                <label
                                    key={category.value}
                                    className="group flex cursor-pointer items-center gap-3"
                                >
                                    <Checkbox
                                        checked={selectedCategories.includes(
                                            category.value,
                                        )}
                                        onCheckedChange={() =>
                                            toggleFilter(
                                                category.value,
                                                selectedCategories,
                                                setSelectedCategories,
                                                'categories',
                                            )
                                        }
                                    />
                                    <span className="text-sm text-muted-foreground transition-colors group-hover:text-primary">
                                        {category.label}
                                    </span>
                                </label>
                            ))}
                        </div>
                    </div>
                    {(
                        [
                            {
                                title: 'ประเภทประกาศ',
                                options: taxonomy.noticeTypes,
                                values: selectedNoticeTypes,
                                setter: setSelectedNoticeTypes,
                                key: 'noticeTypes',
                            },
                            {
                                title: 'จังหวัด',
                                options: taxonomy.provinces,
                                values: selectedProvinces,
                                setter: setSelectedProvinces,
                                key: 'provinces',
                            },
                            {
                                title: 'แท็ก',
                                options: taxonomy.tags,
                                values: selectedTags,
                                setter: setSelectedTags,
                                key: 'tags',
                            },
                        ] as const
                    ).map((facet) => (
                        <fieldset key={facet.key} className="space-y-3">
                            <legend className="text-sm font-bold tracking-wide text-foreground">
                                {facet.title}
                            </legend>
                            <div className="custom-scrollbar max-h-48 space-y-2 overflow-y-auto pr-2">
                                {facet.options.map((option) => (
                                    <label
                                        key={option.value}
                                        className="group flex cursor-pointer items-start gap-3"
                                    >
                                        <Checkbox
                                            checked={facet.values.includes(
                                                option.value,
                                            )}
                                            onCheckedChange={() =>
                                                toggleFilter(
                                                    option.value,
                                                    facet.values,
                                                    facet.setter,
                                                    facet.key,
                                                )
                                            }
                                        />
                                        <span className="text-sm text-muted-foreground transition-colors group-hover:text-primary">
                                            {option.label}
                                        </span>
                                    </label>
                                ))}
                            </div>
                        </fieldset>
                    ))}
                </CardContent>
            </Card>
        </aside>
    );
}
