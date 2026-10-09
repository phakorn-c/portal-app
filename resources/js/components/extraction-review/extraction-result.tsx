import {
    fieldLabels,
    formatCandidateValue,
    MetaItem,
    type CandidateValue,
    type ReviewExtraction,
} from '@/components/extraction-review/shared';

type ExtractionResultProps = {
    extraction: ReviewExtraction;
};

function CandidateEntry({
    field,
    value,
}: {
    field: string;
    value: CandidateValue;
}) {
    if (
        field === 'source_values' &&
        typeof value === 'object' &&
        value !== null &&
        !Array.isArray(value)
    ) {
        return (
            <div className="md:col-span-2">
                <details className="rounded-md border border-border">
                    <summary className="cursor-pointer px-3 py-2 text-sm font-semibold text-foreground">
                        {fieldLabels[field] ?? field}
                    </summary>
                    <pre
                        className="overflow-x-auto border-t border-border bg-muted p-3 text-xs whitespace-pre-wrap text-muted-foreground"
                        data-test="extraction-source-values"
                    >
                        {JSON.stringify(value, null, 2)}
                    </pre>
                </details>
            </div>
        );
    }

    return (
        <MetaItem
            label={fieldLabels[field] ?? field}
            value={formatCandidateValue(value)}
        />
    );
}

export function ExtractionResult({ extraction }: ExtractionResultProps) {
    const confidenceEntries = Object.entries(extraction.confidence ?? {});
    const warnings = extraction.warnings ?? [];

    return (
        <>
            {extraction.error_message && (
                <div
                    className="rounded-md bg-destructive/15 p-4 text-sm text-destructive"
                    data-test="extraction-error"
                >
                    การสกัดล้มเหลว: {extraction.error_message}
                </div>
            )}
            {extraction.candidate ? (
                <dl
                    className="grid gap-3 text-sm md:grid-cols-2"
                    data-test="extraction-candidates"
                >
                    {Object.entries(extraction.candidate).map(
                        ([key, value]) => (
                            <CandidateEntry
                                key={key}
                                field={key}
                                value={value}
                            />
                        ),
                    )}
                </dl>
            ) : (
                <p
                    className="text-sm text-muted-foreground"
                    data-test="extraction-candidates"
                >
                    ไม่มีข้อมูลที่สกัดได้
                </p>
            )}
            <div data-test="extraction-confidence">
                <p className="text-sm font-semibold">ความมั่นใจของการสกัด</p>
                <ul className="list-inside list-disc text-sm text-muted-foreground">
                    {confidenceEntries.map(([key, value]) => (
                        <li key={key}>
                            {fieldLabels[key] ?? key}: {Math.round(value * 100)}
                            %
                        </li>
                    ))}
                    {confidenceEntries.length === 0 && (
                        <li>ไม่มีข้อมูลความมั่นใจ</li>
                    )}
                </ul>
            </div>
            <div data-test="extraction-warnings">
                <p className="text-sm font-semibold">คำเตือน</p>
                <ul className="list-inside list-disc text-sm text-amber-700">
                    {warnings.map((warning) => (
                        <li key={warning}>{warning}</li>
                    ))}
                    {warnings.length === 0 && (
                        <li className="text-muted-foreground">ไม่มีคำเตือน</li>
                    )}
                </ul>
            </div>
            <div>
                <p className="text-sm font-semibold">
                    ข้อความดิบ (เฉพาะผู้ดูแลระบบ)
                </p>
                <pre
                    className="overflow-x-auto rounded-md bg-muted p-4 text-sm whitespace-pre-wrap"
                    data-test="extraction-raw-text"
                >
                    {extraction.raw_text ?? 'ไม่มีข้อความดิบ'}
                </pre>
            </div>
        </>
    );
}
