import {
    MetaItem,
    type ReviewAnnouncement,
    type ReviewAttachment,
} from '@/components/extraction-review/shared';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type SourceFileCardProps = {
    announcement: ReviewAnnouncement;
    attachment: ReviewAttachment;
    method: string | null;
};

export function SourceFileCard({
    announcement,
    attachment,
    method,
}: SourceFileCardProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-xl">
                    แหล่งที่มาและไฟล์เอกสาร
                </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-6 md:grid-cols-2">
                <dl className="space-y-3 text-sm" data-test="extraction-source">
                    <MetaItem
                        label="ลิงก์แหล่งที่มา"
                        value={announcement.source_url ?? '-'}
                    />
                    <MetaItem
                        label="เลขที่อ้างอิงแหล่งที่มา"
                        value={announcement.source_reference ?? '-'}
                    />
                </dl>
                <dl className="space-y-3 text-sm" data-test="extraction-file">
                    <MetaItem
                        label="ไฟล์ต้นฉบับ"
                        value={`${attachment.filename} (${attachment.file_size} ไบต์)`}
                    />
                    <MetaItem
                        label="ประเภทเอกสาร / วิธีการสกัด"
                        value={`${attachment.document_kind} / ${method ?? '-'}`}
                    />
                </dl>
            </CardContent>
        </Card>
    );
}
