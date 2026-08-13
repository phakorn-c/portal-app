export type TaxonomyOption = { value: string; label: string };

export type ReviewAnnouncement = {
    id: number;
    title: string;
    source_url: string | null;
    source_reference: string | null;
};

export type ReviewAttachment = {
    filename: string;
    file_size: number;
    document_kind: string;
};

export type ReviewExtraction = {
    id: number;
    status: string;
    method: string | null;
    candidate: Record<string, string | number | null> | null;
    confidence: Record<string, number> | null;
    warnings: string[] | null;
    raw_text: string | null;
    error_message: string | null;
    attempt_count: number;
    approved_by: number | null;
};

export type ReviewTaxonomy = {
    organizations: TaxonomyOption[];
    methods: TaxonomyOption[];
    categories: TaxonomyOption[];
};

export type ApprovalFormData = {
    title: string;
    organization: string;
    category: string;
    method: string;
    budget: string;
    location: string;
    reference_price: string;
    contact_name: string;
    contact_phone: string;
    description: string;
    deadline: string;
    status: string;
};

export type ApprovalFormErrors = Partial<
    Record<keyof ApprovalFormData | 'payload' | 'extraction', string>
>;

export const statusLabels: Record<string, string> = {
    pending: 'รอดำเนินการ',
    processing: 'กำลังประมวลผล',
    review: 'รอตรวจสอบ',
    failed: 'ล้มเหลว',
    approved: 'อนุมัติแล้ว',
};

export const fieldLabels: Record<string, string> = {
    title: 'ชื่อโครงการ',
    organization: 'หน่วยงาน',
    category: 'หมวดหมู่',
    method: 'วิธีการจัดซื้อจัดจ้าง',
    budget: 'งบประมาณ (บาท)',
    location: 'สถานที่',
    reference_price: 'ราคากลาง (บาท)',
    contact_name: 'ผู้ติดต่อ',
    contact_phone: 'เบอร์ติดต่อ',
    description: 'รายละเอียด',
    deadline: 'วันสิ้นสุดรับข้อเสนอ',
    status: 'สถานะประกาศ',
};

export function FieldError({ message }: { message?: string }) {
    if (!message) {
        return null;
    }
    return <p className="text-sm text-destructive">{message}</p>;
}

export function MetaItem({ label, value }: { label: string; value: string }) {
    return (
        <div>
            <dt className="font-semibold text-foreground">{label}</dt>
            <dd className="break-all text-muted-foreground">{value}</dd>
        </div>
    );
}
