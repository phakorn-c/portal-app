type ProcurementMethodLabelProps = {
    readonly label: string;
};

export function ProcurementMethodLabel({ label }: ProcurementMethodLabelProps) {
    const parentheticalStart = label.lastIndexOf(' (');

    if (parentheticalStart < 0 || !label.endsWith(')')) {
        return label;
    }

    return <span className="whitespace-nowrap">{label}</span>;
}
