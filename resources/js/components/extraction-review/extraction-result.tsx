import {
    fieldLabels,
    MetaItem,
    type ReviewExtraction,
} from '@/components/extraction-review/shared';

type ExtractionResultProps = {
    extraction: ReviewExtraction;
};

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
                            <MetaItem
                                key={key}
                                label={fieldLabels[key] ?? key}
                                value={String(value ?? '-')}
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
