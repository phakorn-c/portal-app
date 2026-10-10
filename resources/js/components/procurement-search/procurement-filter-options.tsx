import type { SearchFilters } from '@/components/procurement-search/search-filters';
import { Checkbox } from '@/components/ui/checkbox';

export function ProcurementFilterOptions({
    search,
}: {
    search: SearchFilters;
}) {
    const {
        selectedPurchaseTypes,
        setSelectedPurchaseTypes,
        openProposals,
        setOpenProposals,
        toggleFilter,
        criteria,
        submitFilters,
    } = search;

    return (
        <>
            <fieldset className="space-y-3">
                <legend className="text-sm font-bold tracking-wide text-foreground">
                    ซื้อหรือจ้าง
                </legend>
                <div className="space-y-2">
                    {[
                        { value: 'purchase', label: 'ซื้อ' },
                        { value: 'hire', label: 'จ้าง' },
                    ].map((option) => (
                        <label
                            key={option.value}
                            className="flex cursor-pointer items-center gap-3"
                        >
                            <Checkbox
                                checked={selectedPurchaseTypes.includes(
                                    option.value,
                                )}
                                onCheckedChange={() =>
                                    toggleFilter(
                                        option.value,
                                        selectedPurchaseTypes,
                                        setSelectedPurchaseTypes,
                                        'purchaseTypes',
                                    )
                                }
                            />
                            <span className="text-sm text-muted-foreground">
                                {option.label}
                            </span>
                        </label>
                    ))}
                </div>
            </fieldset>
            <fieldset className="space-y-2">
                <label className="flex cursor-pointer items-center gap-3">
                    <Checkbox
                        checked={openProposals}
                        onCheckedChange={(checked) => {
                            const next = checked === true;
                            setOpenProposals(next);
                            submitFilters({
                                ...criteria,
                                openProposals: next,
                            });
                        }}
                    />
                    <span className="text-sm font-bold text-foreground">
                        ยังรับข้อเสนอ
                    </span>
                </label>
                <p className="text-xs text-muted-foreground">
                    เฉพาะประกาศเชิญชวนที่วันปิดรับยังไม่ถึง
                    ไม่รวมวันปิดรับเมื่อไม่ทราบเวลาที่แน่นอน
                </p>
            </fieldset>
        </>
    );
}
