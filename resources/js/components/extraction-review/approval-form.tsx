import { Plus, X } from 'lucide-react';
import type { FormEvent } from 'react';
import {
    FieldError,
    fieldLabels,
    type ApprovalFormData,
    type ApprovalFormErrors,
    type BidderFormRow,
    type ReviewTaxonomy,
    type TaxonomyOption,
} from '@/components/extraction-review/shared';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    displayPriceSourceLabels,
    noticeTypeLabels,
    procurementCategoryLabels,
    processStatusLabels,
} from '@/lib/procurement-format';

type StringFormKey = {
    [K in keyof ApprovalFormData]: ApprovalFormData[K] extends string
        ? K
        : never;
}[keyof ApprovalFormData];

type TextFieldDef = {
    kind: 'text';
    id: StringFormKey;
    type: 'text' | 'number' | 'date';
    hint?: string;
};

type SelectFieldDef = {
    kind: 'select';
    id: StringFormKey;
    options: TaxonomyOption[];
    nullable?: boolean;
};

type FieldDef = TextFieldDef | SelectFieldDef;

const statusOptions: TaxonomyOption[] = [
    { value: 'open', label: 'เปิดรับข้อเสนอ' },
    { value: 'urgent', label: 'ด่วน' },
    { value: 'closing', label: 'ใกล้ปิดรับ' },
    { value: 'closed', label: 'ปิดรับแล้ว' },
];

function optionsFromLabels(labels: Record<string, string>): TaxonomyOption[] {
    return Object.entries(labels).map(([value, label]) => ({
        value,
        label,
    }));
}

type ApprovalFormProps = {
    data: ApprovalFormData;
    setData: <K extends keyof ApprovalFormData>(
        field: K,
        value: ApprovalFormData[K],
    ) => void;
    errors: ApprovalFormErrors;
    processing: boolean;
    taxonomy: ReviewTaxonomy;
    rawSource: boolean;
    onSubmit: (event: FormEvent) => void;
};

function SectionHeading({ title }: { title: string }) {
    return (
        <h3 className="text-xs font-semibold tracking-wider text-muted-foreground uppercase md:col-span-2">
            {title}
        </h3>
    );
}

export function ApprovalForm({
    data,
    setData,
    errors,
    processing,
    taxonomy,
    rawSource,
    onSubmit,
}: ApprovalFormProps) {
    const sections: { id: string; title: string; fields: FieldDef[] }[] = [
        {
            id: 'basic',
            title: 'ข้อมูลประกาศ',
            fields: [
                { kind: 'text', id: 'title', type: 'text' },
                rawSource
                    ? { kind: 'text', id: 'organization', type: 'text' }
                    : {
                          kind: 'select',
                          id: 'organization',
                          options: taxonomy.organizations,
                      },
                {
                    kind: 'select',
                    id: 'category',
                    options: taxonomy.categories,
                },
                rawSource
                    ? { kind: 'text', id: 'method', type: 'text' }
                    : {
                          kind: 'select',
                          id: 'method',
                          options: taxonomy.methods,
                      },
            ],
        },
        {
            id: 'pricing',
            title: 'ราคาและการจำแนก',
            fields: [
                { kind: 'text', id: 'budget', type: 'number' },
                { kind: 'text', id: 'reference_price', type: 'number' },
                { kind: 'text', id: 'display_price', type: 'number' },
                {
                    kind: 'select',
                    id: 'display_price_source',
                    options: optionsFromLabels(displayPriceSourceLabels),
                    nullable: true,
                },
                {
                    kind: 'select',
                    id: 'notice_type',
                    options: optionsFromLabels(noticeTypeLabels).filter(
                        (option) => option.value !== 'unknown',
                    ),
                    nullable: true,
                },
                {
                    kind: 'select',
                    id: 'procurement_category',
                    options: optionsFromLabels(procurementCategoryLabels),
                    nullable: true,
                },
                {
                    kind: 'text',
                    id: 'tags',
                    type: 'text',
                    hint: 'คั่นหลายค่าด้วยเครื่องหมายจุลภาค (,)',
                },
            ],
        },
        {
            id: 'contact',
            title: 'สถานที่และผู้ติดต่อ',
            fields: [
                { kind: 'text', id: 'province', type: 'text' },
                { kind: 'text', id: 'district', type: 'text' },
                { kind: 'text', id: 'subdistrict', type: 'text' },
                { kind: 'text', id: 'location_source', type: 'text' },
                { kind: 'text', id: 'location', type: 'text' },
                { kind: 'text', id: 'contact_name', type: 'text' },
                { kind: 'text', id: 'contact_phone', type: 'text' },
                { kind: 'text', id: 'contact_website', type: 'text' },
            ],
        },
        {
            id: 'award',
            title: 'ผู้ประกาศและผลการเสนอราคา',
            fields: [
                { kind: 'text', id: 'announcer_name', type: 'text' },
                { kind: 'text', id: 'announcer_position', type: 'text' },
                { kind: 'text', id: 'winner_name', type: 'text' },
                { kind: 'text', id: 'winning_price', type: 'number' },
            ],
        },
        {
            id: 'schedule',
            title: 'กำหนดการและสถานะ',
            fields: [
                { kind: 'text', id: 'deadline', type: 'date' },
                { kind: 'text', id: 'submission_deadline', type: 'date' },
                { kind: 'text', id: 'announced_at', type: 'date' },
                { kind: 'text', id: 'award_announced_at', type: 'date' },
                {
                    kind: 'select',
                    id: 'status',
                    options: statusOptions,
                    nullable: true,
                },
                {
                    kind: 'select',
                    id: 'process_status',
                    options: optionsFromLabels(processStatusLabels),
                    nullable: true,
                },
            ],
        },
        {
            id: 'identity',
            title: 'ตัวระบุโครงการ',
            fields: [
                { kind: 'text', id: 'project_key', type: 'text' },
                { kind: 'text', id: 'project_no', type: 'text' },
                { kind: 'text', id: 'source_id', type: 'text' },
            ],
        },
    ];

    const updateBidder = (index: number, patch: Partial<BidderFormRow>) => {
        setData(
            'bidders',
            data.bidders.map((row, rowIndex) =>
                rowIndex === index ? { ...row, ...patch } : row,
            ),
        );
    };

    return (
        <form
            className="space-y-4 border-t border-border pt-6"
            onSubmit={onSubmit}
            data-test="extraction-approve-form"
        >
            <div className="grid gap-4 md:grid-cols-2">
                {sections.map((section) => (
                    <div key={section.id} className="contents">
                        <SectionHeading title={section.title} />
                        {section.fields.map((field) => (
                            <div key={field.id} className="space-y-2">
                                <Label htmlFor={field.id}>
                                    {fieldLabels[field.id]}
                                </Label>
                                {field.kind === 'select' ? (
                                    <select
                                        id={field.id}
                                        className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none"
                                        value={data[field.id]}
                                        onChange={(event) =>
                                            setData(
                                                field.id,
                                                event.target.value,
                                            )
                                        }
                                    >
                                        {field.nullable && (
                                            <option value="">ไม่ระบุ</option>
                                        )}
                                        {field.options.map((option) => (
                                            <option
                                                key={option.value}
                                                value={option.value}
                                            >
                                                {option.label}
                                            </option>
                                        ))}
                                    </select>
                                ) : (
                                    <>
                                        <Input
                                            id={field.id}
                                            type={field.type}
                                            step={
                                                field.type === 'number'
                                                    ? '0.01'
                                                    : undefined
                                            }
                                            value={data[field.id]}
                                            onChange={(event) =>
                                                setData(
                                                    field.id,
                                                    event.target.value,
                                                )
                                            }
                                        />
                                        {field.kind === 'text' &&
                                            field.hint && (
                                                <p className="text-xs text-muted-foreground">
                                                    {field.hint}
                                                </p>
                                            )}
                                    </>
                                )}
                                <FieldError message={errors[field.id]} />
                            </div>
                        ))}
                        {section.id === 'basic' && (
                            <div className="space-y-2 md:col-span-2">
                                <Label htmlFor="description">
                                    {fieldLabels.description}
                                </Label>
                                <textarea
                                    id="description"
                                    className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none"
                                    value={data.description}
                                    onChange={(event) =>
                                        setData(
                                            'description',
                                            event.target.value,
                                        )
                                    }
                                />
                                <FieldError message={errors.description} />
                            </div>
                        )}
                        {section.id === 'award' && (
                            <div className="space-y-2 md:col-span-2">
                                <Label>{fieldLabels.bidders}</Label>
                                <div
                                    className="space-y-2"
                                    data-test="extraction-approve-bidders"
                                >
                                    {data.bidders.map((row, index) => (
                                        <div
                                            key={index}
                                            className="flex flex-wrap items-center gap-2"
                                        >
                                            <Input
                                                aria-label={`ชื่อผู้ยื่นข้อเสนอ ${index + 1}`}
                                                type="text"
                                                placeholder="ชื่อผู้ยื่นข้อเสนอ"
                                                className="min-w-0 flex-1 basis-full sm:basis-auto"
                                                value={row.name}
                                                onChange={(event) =>
                                                    updateBidder(index, {
                                                        name: event.target
                                                            .value,
                                                    })
                                                }
                                            />
                                            <Input
                                                aria-label={`ราคาที่เสนอ ${index + 1}`}
                                                type="number"
                                                step="0.01"
                                                placeholder="ราคาที่เสนอ (บาท)"
                                                className="w-40 shrink-0"
                                                value={row.price}
                                                onChange={(event) =>
                                                    updateBidder(index, {
                                                        price: event.target
                                                            .value,
                                                    })
                                                }
                                            />
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                aria-label={`ลบผู้ยื่นข้อเสนอ ${index + 1}`}
                                                onClick={() =>
                                                    setData(
                                                        'bidders',
                                                        data.bidders.filter(
                                                            (_, rowIndex) =>
                                                                rowIndex !==
                                                                index,
                                                        ),
                                                    )
                                                }
                                            >
                                                <X className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    ))}
                                    {data.bidders.length === 0 && (
                                        <p className="text-xs text-muted-foreground">
                                            ไม่มีผู้ยื่นข้อเสนอ กดเพิ่มเพื่อระบุ
                                        </p>
                                    )}
                                </div>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="gap-2"
                                    onClick={() =>
                                        setData('bidders', [
                                            ...data.bidders,
                                            { name: '', price: '' },
                                        ])
                                    }
                                >
                                    <Plus className="h-4 w-4" />
                                    เพิ่มผู้ยื่นข้อเสนอ
                                </Button>
                                <FieldError message={errors.bidders} />
                            </div>
                        )}
                    </div>
                ))}
            </div>
            <FieldError message={errors.payload} />
            <FieldError message={errors.extraction} />
            <Button
                type="submit"
                disabled={processing}
                data-test="extraction-approve-submit"
            >
                {processing ? 'กำลังอนุมัติ...' : 'อนุมัติข้อมูลที่แก้ไข'}
            </Button>
        </form>
    );
}
