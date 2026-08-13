import { RotateCcw } from 'lucide-react';
import { FieldError } from '@/components/extraction-review/shared';
import { Button } from '@/components/ui/button';

type RetryControlProps = {
    processing: boolean;
    error?: string;
    onRetry: () => void;
};

export function RetryControl({
    processing,
    error,
    onRetry,
}: RetryControlProps) {
    return (
        <div className="flex items-center gap-3 border-t border-border pt-6">
            <Button
                type="button"
                variant="outline"
                className="gap-2"
                disabled={processing}
                onClick={onRetry}
                data-test="extraction-retry"
            >
                <RotateCcw className="h-4 w-4" />
                ลองสกัดอีกครั้ง
            </Button>
            <FieldError message={error} />
        </div>
    );
}
