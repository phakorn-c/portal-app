import { Link } from '@inertiajs/react';

import { show as reviewShow } from '@/routes/admin/announcements/extractions';

type Extraction = {
    readonly id: number;
    readonly status: string;
};

type Props = {
    readonly announcementId: number;
    readonly attachments: readonly {
        readonly filename: string;
        readonly extraction?: Extraction | null;
    }[];
};

const extractionLabels: Readonly<Record<string, string>> = {
    review: 'รอตรวจสอบ',
    failed: 'ล้มเหลว',
};

export function DashboardExtractionLinks({
    announcementId,
    attachments,
}: Props) {
    const reviewLinks = attachments.flatMap((attachment) =>
        attachment.extraction
            ? [
                  {
                      extraction: attachment.extraction,
                      filename: attachment.filename,
                  },
              ]
            : [],
    );

    return reviewLinks.length > 0 ? (
        <div className="flex flex-col gap-1">
            {reviewLinks.map(({ extraction, filename }) => (
                <Link
                    key={extraction.id}
                    href={reviewShow.url([announcementId, extraction.id])}
                    data-test={`extraction-review-link-${announcementId}`}
                    className="w-fit whitespace-nowrap text-primary underline underline-offset-4 hover:text-primary/80 focus-visible:rounded-sm focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                >
                    {filename} ·{' '}
                    {extractionLabels[extraction.status] ?? extraction.status}
                </Link>
            ))}
        </div>
    ) : null;
}
