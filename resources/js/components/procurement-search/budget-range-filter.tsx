import type { SearchFilters } from '@/components/procurement-search/search-filters';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';

export function BudgetRangeFilter({ search }: { search: SearchFilters }) {
    const { budgetRange, setBudgetRange, criteria, submitFilters } = search;

    return (
        <div className="space-y-4">
            <h3 className="text-sm font-bold tracking-wide text-foreground uppercase">
                ช่วงราคาที่แสดง
            </h3>
            <div className="px-1">
                <Slider
                    value={[budgetRange[0], budgetRange[1] ?? 10000000]}
                    onValueChange={(value) => {
                        const next: [number, number | null] = [
                            value[0] ?? 0,
                            value[1] === 10000000 ? null : (value[1] ?? null),
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
                    thumbLabels={['ราคาต่ำสุด', 'ราคาสูงสุด']}
                    className="w-full"
                />
                <div className="mt-3 flex justify-between text-sm text-muted-foreground">
                    <span>0 บาท</span>
                    <span>10 ล้านขึ้นไป: ไม่จำกัด</span>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2">
                    <div className="relative">
                        <label
                            htmlFor="price-minimum"
                            className="mb-1 block text-xs text-muted-foreground"
                        >
                            ราคาต่ำสุด
                        </label>
                        <span className="absolute bottom-2 left-2 text-xs text-muted-foreground">
                            ฿
                        </span>
                        <Input
                            id="price-minimum"
                            placeholder="ต่ำสุด"
                            className="h-9 pl-6 text-sm"
                            value={budgetRange[0]}
                            readOnly
                        />
                    </div>
                    <div className="relative">
                        <label
                            htmlFor="price-maximum"
                            className="mb-1 block text-xs text-muted-foreground"
                        >
                            ราคาสูงสุด
                        </label>
                        <span className="absolute bottom-2 left-2 text-xs text-muted-foreground">
                            ฿
                        </span>
                        <Input
                            id="price-maximum"
                            placeholder="สูงสุด"
                            className="h-9 pl-6 text-sm"
                            value={budgetRange[1] ?? 'ไม่จำกัด'}
                            readOnly
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
