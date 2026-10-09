export type CandidateScalar = string | number | boolean | null;

export type CandidateValue =
    CandidateScalar | CandidateValue[] | { [key: string]: CandidateValue };

export type TaxonomyOption = { value: string; label: string };

export type ReviewAnnouncement = {
    id: number;
    title: string;
    source_document_key: string | null;
    source_url: string | null;
    source_reference: string | null;
};

export type ReviewAttachment = {
    filename: string;
    file_size: number;
    document_kind: string;
    mime_type: string;
};

export type ReviewExtraction = {
    id: number;
    status: string;
    method: string | null;
    candidate: Record<string, CandidateValue> | null;
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

export type BidderFormRow = {
    name: string;
    price: string;
};

export type ApprovalFormData = {
    title: string;
    organization: string;
    category: string;
    method: string;
    budget: string;
    deadline: string;
    status: string;
    reference_price: string;
    contact_name: string;
    contact_phone: string;
    description: string;
    location: string;
    notice_type: string;
    procurement_category: string;
    tags: string;
    display_price: string;
    display_price_source: string;
    province: string;
    district: string;
    subdistrict: string;
    location_source: string;
    contact_website: string;
    announcer_name: string;
    announcer_position: string;
    winner_name: string;
    winning_price: string;
    bidders: BidderFormRow[];
    announced_at: string;
    submission_deadline: string;
    award_announced_at: string;
    process_status: string;
    project_key: string;
    project_no: string;
    source_id: string;
};

export type ApprovalFormErrors = Partial<
    Record<keyof ApprovalFormData | 'payload' | 'extraction', string>
> &
    Record<string, string | undefined>;

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
    notice_type: 'ประเภทประกาศ',
    procurement_category: 'หมวดจัดซื้อ',
    tags: 'ป้ายกำกับ',
    display_price: 'ราคาที่แสดง (บาท)',
    display_price_source: 'แหล่งที่มาของราคา',
    province: 'จังหวัด',
    district: 'อำเภอ/เขต',
    subdistrict: 'ตำบล/แขวง',
    location_source: 'แหล่งที่มาของสถานที่',
    contact_website: 'เว็บไซต์ติดต่อ',
    announcer_name: 'ผู้ประกาศ',
    announcer_position: 'ตำแหน่งผู้ประกาศ',
    winner_name: 'ผู้ชนะการเสนอราคา',
    winning_price: 'ราคาที่เสนอชนะ (บาท)',
    bidders: 'ผู้ยื่นข้อเสนอ',
    announced_at: 'วันที่ประกาศ',
    submission_deadline: 'วันสิ้นสุดยื่นข้อเสนอ',
    award_announced_at: 'วันที่ประกาศผู้ชนะ',
    process_status: 'สถานะกระบวนการ',
    project_key: 'รหัสโครงการ (key)',
    project_no: 'เลขที่โครงการ',
    source_id: 'แหล่งข้อมูล',
    source_values: 'ค่าดิบจาก OCR',
    record_key: 'รหัสบันทึก',
    agency: 'หน่วยงาน (ดิบ)',
    base_price: 'ราคากลาง (ดิบ)',
    announce_date: 'วันที่ประกาศ (ดิบ)',
    bid_open_date: 'วันเปิดซอง (ดิบ)',
    end_date: 'วันสิ้นสุด (ดิบ)',
    duration: 'ระยะเวลา',
    contact_status: 'ตำแหน่งผู้ติดต่อ',
    details: 'รายละเอียด (ดิบ)',
    ocr_engine: 'กลไก OCR',
    extraction_method: 'วิธีสกัด',
    procurement_type: 'ประเภทการจัดซื้อ (ดิบ)',
    pdf_path: 'ไฟล์ต้นฉบับ',
    validation_flags: 'คำเตือนจากการตรวจสอบ',
    raw_text: 'ข้อความดิบ',
    source_url: 'ลิงก์แหล่งที่มา',
};

function isCandidateObject(
    value: CandidateValue,
): value is { [key: string]: CandidateValue } {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function formatCandidateValue(value: CandidateValue): string {
    if (value === null || value === '') {
        return '-';
    }

    if (Array.isArray(value)) {
        if (value.length === 0) {
            return '-';
        }

        return value
            .map((item) =>
                isCandidateObject(item) ? JSON.stringify(item) : String(item),
            )
            .join(', ');
    }

    if (isCandidateObject(value)) {
        return JSON.stringify(value);
    }

    return String(value);
}

export function candidateScalar(
    candidate: Record<string, CandidateValue> | null,
    key: string,
): string {
    const value = candidate?.[key];

    return typeof value === 'string' || typeof value === 'number'
        ? String(value)
        : '';
}

export function candidateArray(
    candidate: Record<string, CandidateValue> | null,
    key: string,
): CandidateValue[] {
    const value = candidate?.[key];

    return Array.isArray(value) ? value : [];
}

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
