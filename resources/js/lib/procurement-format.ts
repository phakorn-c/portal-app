const thaiDateFormatter = new Intl.DateTimeFormat(
    'th-TH-u-ca-buddhist-nu-latn',
    {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        timeZone: 'Asia/Bangkok',
    },
);

const thaiBudgetFormatter = new Intl.NumberFormat('th-TH-u-nu-latn', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
});

export function formatThaiDate(value: string | null | undefined): string {
    if (!value) {
        return '-';
    }

    const date = new Date(value);

    return Number.isNaN(date.getTime())
        ? value
        : thaiDateFormatter.format(date);
}

export function formatThaiBudget(
    value: number | string | null | undefined,
): string {
    if (value === null || value === undefined || value === '') {
        return '-';
    }

    const amount = typeof value === 'number' ? value : Number(value);

    return Number.isFinite(amount)
        ? `฿ ${thaiBudgetFormatter.format(amount)}`
        : '-';
}

export const noticeTypeLabels: Record<string, string> = {
    invitation: 'ประกาศเชิญชวน',
    award: 'ประกาศผู้ชนะ',
    unknown: 'ไม่ทราบประเภทประกาศ',
};

export const procurementCategoryLabels: Record<string, string> = {
    works: 'งานก่อสร้าง',
    supply: 'จัดซื้อพัสดุ',
    service: 'จ้างบริการ',
    consulting: 'จ้างที่ปรึกษา',
    other: 'อื่น ๆ',
};

export const processStatusLabels: Record<string, string> = {
    accepting: 'กำลังรับข้อเสนอ',
    award_announced: 'ประกาศผู้ชนะแล้ว',
    unknown: 'ไม่ทราบสถานะ',
};

export const displayPriceSourceLabels: Record<string, string> = {
    reference_price: 'ราคากลาง',
    budget: 'งบประมาณ',
    winning_price: 'ราคาที่ชนะการเสนอ',
    none: 'ไม่มีข้อมูลราคา',
};

export function verifiedDisplayPrice(
    displayPrice: number | string | null | undefined,
    source: string | null | undefined,
): number | string | null {
    if (
        displayPrice === null ||
        displayPrice === undefined ||
        displayPrice === ''
    ) {
        return null;
    }

    if (!source || source === 'none') {
        return null;
    }

    return displayPrice;
}

export function displayPriceLabel(source: string | null | undefined): string {
    return (
        (source !== null &&
            source !== undefined &&
            source !== 'none' &&
            displayPriceSourceLabels[source]) ||
        'งบประมาณ'
    );
}
