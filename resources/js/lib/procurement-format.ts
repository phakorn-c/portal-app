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

export function formatThaiDate(value: string | null): string {
    if (!value) {
        return '-';
    }

    const date = new Date(value);

    return Number.isNaN(date.getTime())
        ? value
        : thaiDateFormatter.format(date);
}

export function formatThaiBudget(value: number | string): string {
    const amount = typeof value === 'number' ? value : Number(value);

    return Number.isFinite(amount)
        ? `฿ ${thaiBudgetFormatter.format(amount)}`
        : '-';
}
