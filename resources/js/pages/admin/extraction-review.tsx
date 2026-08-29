import { Head, useForm } from '@inertiajs/react';
import type { FormEvent } from 'react';
import { ApprovalForm } from '@/components/extraction-review/approval-form';
import { ExtractionResult } from '@/components/extraction-review/extraction-result';
import { RetryControl } from '@/components/extraction-review/retry-control';
import { ReviewHeader } from '@/components/extraction-review/review-header';
import {
    type ApprovalFormData,
    type ApprovalFormErrors,
    type ReviewAnnouncement,
    type ReviewAttachment,
    type ReviewExtraction,
    type ReviewTaxonomy,
} from '@/components/extraction-review/shared';
import { SourceFileCard } from '@/components/extraction-review/source-file-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import AppHeaderLayout from '@/layouts/app/app-header-layout';
import { approve, retry } from '@/routes/admin/announcements/extractions';

type Props = {
    announcement: ReviewAnnouncement;
    attachment: ReviewAttachment;
    extraction: ReviewExtraction;
    taxonomy: ReviewTaxonomy;
};

export default function ExtractionReview({
    announcement,
    attachment,
    extraction,
    taxonomy,
}: Props) {
    const candidateValue = (key: string) =>
        String(extraction.candidate?.[key] ?? '');
    const { data, setData, put, processing, errors, transform } =
        useForm<ApprovalFormData>({
            title: candidateValue('title'),
            organization: candidateValue('organization'),
            category: candidateValue('category'),
            method: candidateValue('method'),
            budget: candidateValue('budget'),
            location: candidateValue('location'),
            reference_price: candidateValue('reference_price'),
            contact_name: candidateValue('contact_name'),
            contact_phone: candidateValue('contact_phone'),
            description: candidateValue('description'),
            deadline: candidateValue('deadline'),
            status: candidateValue('status'),
        });
    const formErrors = errors as ApprovalFormErrors;
    const retryForm = useForm({});
    const retryErrors = retryForm.errors as Record<string, string | undefined>;

    const canRetry =
        ['review', 'failed'].includes(extraction.status) &&
        extraction.attempt_count < 3;

    const submitApproval = (event: FormEvent) => {
        event.preventDefault();
        transform((formData) => ({
            ...formData,
            budget: formData.budget === '' ? null : Number(formData.budget),
            location: formData.location || null,
            reference_price:
                formData.reference_price === ''
                    ? null
                    : Number(formData.reference_price),
            contact_name: formData.contact_name || null,
            contact_phone: formData.contact_phone || null,
            description: formData.description || null,
        }));
        put(approve.url([announcement.id, extraction.id]));
    };
    const submitRetry = () => {
        retryForm.post(retry.url([announcement.id, extraction.id]), {
            preserveScroll: true,
        });
    };

    return (
        <AppHeaderLayout>
            <Head title="ตรวจสอบการสกัดเอกสาร - Admin" />
            <div
                className="flex flex-col gap-8 px-4 py-6 md:px-8"
                data-test="extraction-review-page"
            >
                <ReviewHeader
                    title={announcement.title}
                    status={extraction.status}
                    attemptCount={extraction.attempt_count}
                    approvedBy={extraction.approved_by}
                />
                <SourceFileCard
                    announcement={announcement}
                    attachment={attachment}
                    method={extraction.method}
                />
                <Card>
                    <CardHeader>
                        <CardTitle className="text-xl">ผลการสกัด</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <ExtractionResult extraction={extraction} />
                        {extraction.status === 'review' && (
                            <ApprovalForm
                                data={data}
                                setData={setData}
                                errors={formErrors}
                                processing={processing}
                                taxonomy={taxonomy}
                                onSubmit={submitApproval}
                            />
                        )}
                        {extraction.status === 'approved' && (
                            <p
                                className="text-sm text-muted-foreground"
                                data-test="extraction-approved-note"
                            >
                                อนุมัติเรียบร้อยแล้ว ประกาศยังคงเป็นฉบับร่าง
                            </p>
                        )}
                        {['pending', 'processing'].includes(
                            extraction.status,
                        ) && (
                            <p className="text-sm text-muted-foreground">
                                กำลังรอการประมวลผล โปรดรอสักครู่
                            </p>
                        )}
                        {canRetry && (
                            <RetryControl
                                processing={retryForm.processing}
                                error={retryErrors.extraction}
                                onRetry={submitRetry}
                            />
                        )}
                    </CardContent>
                </Card>
            </div>
        </AppHeaderLayout>
    );
}
