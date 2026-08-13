import type { FormEvent } from 'react';
import {
    FieldError,
    fieldLabels,
    type ApprovalFormData,
    type ApprovalFormErrors,
    type ReviewTaxonomy,
    type TaxonomyOption,
} from '@/components/extraction-review/shared';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const statusOptions = [
    { value: 'open', label: 'เปิดรับข้อเสนอ' },
    { value: 'urgent', label: 'ด่วน' },
    { value: 'closing', label: 'ใกล้ปิดรับ' },
    { value: 'closed', label: 'ปิดรับแล้ว' },
];

const textFields = [
    { id: 'title', type: 'text' },
    { id: 'budget', type: 'number' },
    { id: 'location', type: 'text' },
    { id: 'reference_price', type: 'number' },
    { id: 'contact_name', type: 'text' },
    { id: 'contact_phone', type: 'text' },
    { id: 'deadline', type: 'date' },
] as const;

type ApprovalFormProps = {
    data: ApprovalFormData;
    setData: (field: keyof ApprovalFormData, value: string) => void;
    errors: ApprovalFormErrors;
    processing: boolean;
    taxonomy: ReviewTaxonomy;
    onSubmit: (event: FormEvent) => void;
};

export function ApprovalForm({
    data,
    setData,
    errors,
    processing,
    taxonomy,
    onSubmit,
}: ApprovalFormProps) {
    const selectFields: {
        id: keyof ApprovalFormData;
        options: TaxonomyOption[];
    }[] = [
        { id: 'organization', options: taxonomy.organizations },
        { id: 'category', options: taxonomy.categories },
        { id: 'method', options: taxonomy.methods },
        { id: 'status', options: statusOptions },
    ];

    return (
        <form
            className="space-y-4 border-t border-border pt-6"
            onSubmit={onSubmit}
            data-test="extraction-approve-form"
        >
            <div className="grid gap-4 md:grid-cols-2">
                {textFields.map((field) => (
                    <div key={field.id} className="space-y-2">
                        <Label htmlFor={field.id}>
                            {fieldLabels[field.id]}
                        </Label>
                        <Input
                            id={field.id}
                            type={field.type}
                            value={data[field.id]}
                            onChange={(event) =>
                                setData(field.id, event.target.value)
                            }
                        />
                        <FieldError message={errors[field.id]} />
                    </div>
                ))}
                {selectFields.map((field) => (
                    <div key={field.id} className="space-y-2">
                        <Label htmlFor={field.id}>
                            {fieldLabels[field.id]}
                        </Label>
                        <select
                            id={field.id}
                            className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none"
                            value={data[field.id]}
                            onChange={(event) =>
                                setData(field.id, event.target.value)
                            }
                        >
                            {field.options.map((option) => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                        <FieldError message={errors[field.id]} />
                    </div>
                ))}
                <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="description">
                        {fieldLabels.description}
                    </Label>
                    <textarea
                        id="description"
                        className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none"
                        value={data.description}
                        onChange={(event) =>
                            setData('description', event.target.value)
                        }
                    />
                    <FieldError message={errors.description} />
                </div>
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
