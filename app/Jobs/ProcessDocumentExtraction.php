<?php

namespace App\Jobs;

use App\Models\AnnouncementAttachment;
use App\Models\DocumentExtraction;
use App\Support\Procurement\Extraction\DocumentExtractor;
use App\Support\Procurement\Extraction\ExtractionRequest;
use App\Support\Procurement\Extraction\ExtractionResult;
use Illuminate\Contracts\Queue\ShouldBeUnique;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Throwable;

class ProcessDocumentExtraction implements ShouldBeUnique, ShouldQueue
{
    use Queueable;

    public int $uniqueFor = 300;

    public int $tries = 1;

    public int $timeout = 120;

    public bool $failOnTimeout = true;

    private const MAX_ATTEMPTS = 3;

    private const STALE_PROCESSING_SECONDS = 360;

    public function __construct(
        public int $extractionId,
        public int $expectedAttempt,
        public string $invocationToken,
    ) {
        $this->afterCommit();
    }

    public function uniqueId(): string
    {
        return (string) $this->extractionId;
    }

    public static function dispatchFor(int $extractionId): bool
    {
        $payload = DB::transaction(function () use ($extractionId): ?array {
            $extraction = DocumentExtraction::query()
                ->lockForUpdate()
                ->find($extractionId);

            if (! $extraction || $extraction->status === 'approved') {
                return null;
            }

            if ($extraction->status === 'processing') {
                if (! self::isStale($extraction)) {
                    return null;
                }

                if ($extraction->attempt_count >= self::MAX_ATTEMPTS) {
                    $extraction->update([
                        'status' => 'failed',
                        'error_message' => $extraction->error_message ?? 'Maximum extraction attempts reached.',
                        'processed_at' => now(),
                    ]);

                    return null;
                }

                self::resetForRetry($extraction);
            } elseif (in_array($extraction->status, ['review', 'failed'], true)) {
                if ($extraction->attempt_count >= self::MAX_ATTEMPTS) {
                    return null;
                }

                self::resetForRetry($extraction);
            }

            if ($extraction->status !== 'pending' || $extraction->attempt_count >= self::MAX_ATTEMPTS) {
                return null;
            }

            return [
                'expectedAttempt' => $extraction->attempt_count + 1,
                'invocationToken' => Str::uuid()->toString(),
            ];
        });

        if ($payload === null) {
            return false;
        }

        self::dispatch($extractionId, $payload['expectedAttempt'], $payload['invocationToken']);

        return true;
    }

    public function handle(DocumentExtractor $extractor): void
    {
        $filename = $this->beginProcessing();

        if ($filename === null) {
            return;
        }

        $result = $extractor->extract(new ExtractionRequest($filename));

        $this->complete($result);
    }

    public function failed(?Throwable $exception): void
    {
        DB::transaction(function () use ($exception): void {
            $extraction = DocumentExtraction::query()
                ->lockForUpdate()
                ->find($this->extractionId);

            if (! $extraction || ! $this->owns($extraction)) {
                return;
            }

            $extraction->update([
                'status' => 'failed',
                'error_message' => $exception?->getMessage() ?? 'Document extraction failed.',
                'processed_at' => now(),
            ]);
        });
    }

    private function beginProcessing(): ?string
    {
        return DB::transaction(function (): ?string {
            $extraction = DocumentExtraction::query()
                ->lockForUpdate()
                ->find($this->extractionId);

            if (! $extraction || $extraction->status === 'approved') {
                return null;
            }

            if ($extraction->status === 'processing') {
                if (! self::isStale($extraction)) {
                    return null;
                }

                self::resetForRetry($extraction);
            }

            $isExpectedAttempt = $extraction->attempt_count + 1 === $this->expectedAttempt;

            if ($extraction->status !== 'pending'
                || ! $isExpectedAttempt
                || $this->expectedAttempt > self::MAX_ATTEMPTS) {
                return null;
            }

            $attachment = AnnouncementAttachment::query()
                ->lockForUpdate()
                ->find($extraction->announcement_attachment_id);

            if (! $attachment) {
                return null;
            }

            $extraction->update([
                'status' => 'processing',
                'attempt_count' => $this->expectedAttempt,
                'processing_token' => $this->invocationToken,
                'processing_started_at' => now(),
            ]);

            return $attachment->filename;
        });
    }

    private function complete(ExtractionResult $result): void
    {
        DB::transaction(function () use ($result): void {
            $extraction = DocumentExtraction::query()
                ->lockForUpdate()
                ->find($this->extractionId);

            if (! $extraction || ! $this->owns($extraction)) {
                return;
            }

            $attachment = AnnouncementAttachment::query()
                ->lockForUpdate()
                ->find($extraction->announcement_attachment_id);

            if (! $attachment) {
                return;
            }

            $attachment->update(['document_kind' => $result->document_kind]);
            $extraction->update([
                'status' => $result->error_message === null ? 'review' : 'failed',
                'method' => $result->method,
                'candidate' => $result->candidate,
                'confidence' => $result->confidence,
                'warnings' => $result->warnings,
                'raw_text' => $result->raw_text,
                'error_message' => $result->error_message,
                'processed_at' => now(),
            ]);
        });
    }

    private function owns(DocumentExtraction $extraction): bool
    {
        return $extraction->status === 'processing'
            && $extraction->attempt_count === $this->expectedAttempt
            && is_string($extraction->processing_token)
            && hash_equals($extraction->processing_token, $this->invocationToken);
    }

    private static function isStale(DocumentExtraction $extraction): bool
    {
        return $extraction->processing_started_at === null
            || $extraction->processing_started_at->lte(now()->subSeconds(self::STALE_PROCESSING_SECONDS));
    }

    private static function resetForRetry(DocumentExtraction $extraction): void
    {
        $attachment = AnnouncementAttachment::query()
            ->lockForUpdate()
            ->find($extraction->announcement_attachment_id);
        $attachment?->update(['document_kind' => 'unknown']);

        $extraction->update([
            'status' => 'pending',
            'method' => null,
            'candidate' => null,
            'confidence' => null,
            'warnings' => null,
            'raw_text' => null,
            'error_message' => null,
            'processing_token' => null,
            'processing_started_at' => null,
            'processed_at' => null,
            'approved_at' => null,
            'approved_by' => null,
        ]);
    }
}
