import { Head, useForm } from '@inertiajs/react';
import type { FormEvent } from 'react';
import { ApprovalForm } from '@/components/extraction-review/approval-form';
import { ExtractionResult } from '@/components/extraction-review/extraction-result';
import { RetryControl } from '@/components/extraction-review/retry-control';
import { ReviewHeader } from '@/components/extraction-review/review-header';
import {
    type ApprovalFormData,
    type ApprovalFormErrors,
    type BidderFormRow,
    candidateArray,
    candidateScalar,
    type CandidateValue,
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

function isRecordValue(
    value: CandidateValue,
): value is { [key: string]: CandidateValue } {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function scalarText(value: CandidateValue | undefined): string {
    return typeof value === 'string' || typeof value === 'number'
        ? String(value)
        : '';
}

function seedBidders(
    candidate: ReviewExtraction['candidate'],
): BidderFormRow[] {
    return candidateArray(candidate, 'bidders').map((item) => {
        if (isRecordValue(item)) {
            const name = item.name ?? item.bidder_name;
            const price = item.price ?? item.bid_price;

            return { name: scalarText(name), price: scalarText(price) };
        }

        return { name: scalarText(item), price: '' };
    });
}

function seedTags(candidate: ReviewExtraction['candidate']): string {
    return candidateArray(candidate, 'tags')
        .map((item) => scalarText(item))
        .filter((item) => item !== '')
        .join(', ');
}

function nullableNumber(value: string): number | null {
    return value.trim() === '' ? null : Number(value);
}

function nullableText(value: string): string | null {
    return value.trim() === '' ? null : value;
}

function nullableDate(value: string): string | null {
    return value === '' ? null : value;
}

export default function ExtractionReview({
    announcement,
    attachment,
    extraction,
    taxonomy,
}: Props) {
    const candidate = extraction.candidate;
    const scalar = (key: string) => candidateScalar(candidate, key);
    const { data, setData, put, processing, errors, transform } =
        useForm<ApprovalFormData>({
            title: scalar('title'),
            organization: scalar('organization'),
            category: scalar('category'),
            method: scalar('method'),
            budget: scalar('budget'),
            deadline: scalar('deadline'),
            status: scalar('status'),
            reference_price: scalar('reference_price'),
            contact_name: scalar('contact_name'),
            contact_phone: scalar('contact_phone'),
            description: scalar('description'),
            location: scalar('location'),
            notice_type: scalar('notice_type'),
            procurement_category: scalar('procurement_category'),
            tags: seedTags(candidate),
            display_price: scalar('display_price'),
            display_price_source: scalar('display_price_source'),
            province: scalar('province'),
            district: scalar('district'),
            subdistrict: scalar('subdistrict'),
            location_source: scalar('location_source'),
            contact_website: scalar('contact_website'),
            announcer_name: scalar('announcer_name'),
            announcer_position: scalar('announcer_position'),
            winner_name: scalar('winner_name'),
            winning_price: scalar('winning_price'),
            bidders: seedBidders(candidate),
            announced_at: scalar('announced_at'),
            submission_deadline: scalar('submission_deadline'),
            award_announced_at: scalar('award_announced_at'),
            process_status: scalar('process_status'),
            project_key: scalar('project_key'),
            project_no: scalar('project_no'),
            source_id: scalar('source_id'),
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
            budget: nullableNumber(formData.budget),
            deadline: nullableDate(formData.deadline),
            status: nullableText(formData.status),
            reference_price: nullableNumber(formData.reference_price),
            contact_name: nullableText(formData.contact_name),
            contact_phone: nullableText(formData.contact_phone),
            description: nullableText(formData.description),
            location: nullableText(formData.location),
            notice_type: nullableText(formData.notice_type),
            procurement_category: nullableText(formData.procurement_category),
            tags: formData.tags
                .split(',')
                .map((tag) => tag.trim())
                .filter((tag) => tag !== ''),
            display_price: nullableNumber(formData.display_price),
            display_price_source: nullableText(formData.display_price_source),
            province: nullableText(formData.province),
            district: nullableText(formData.district),
            subdistrict: nullableText(formData.subdistrict),
            location_source: nullableText(formData.location_source),
            contact_website: nullableText(formData.contact_website),
            announcer_name: nullableText(formData.announcer_name),
            announcer_position: nullableText(formData.announcer_position),
            winner_name: nullableText(formData.winner_name),
            winning_price: nullableNumber(formData.winning_price),
            bidders: formData.bidders
                .filter(
                    (row) => row.name.trim() !== '' || row.price.trim() !== '',
                )
                .map((row) => ({
                    name: row.name.trim(),
                    price: nullableNumber(row.price),
                })),
            announced_at: nullableDate(formData.announced_at),
            submission_deadline: nullableDate(formData.submission_deadline),
            award_announced_at: nullableDate(formData.award_announced_at),
            process_status: nullableText(formData.process_status),
            project_key: nullableText(formData.project_key),
            project_no: nullableText(formData.project_no),
            source_id: nullableText(formData.source_id),
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
                                rawSource={
                                    announcement.source_document_key !== null
                                }
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
