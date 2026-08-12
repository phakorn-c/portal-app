<?php

namespace App\Support\Procurement\Extraction;

final readonly class ExtractionResult
{
    /**
     * @param  array<string, float|int|string|null>|null  $candidate
     * @param  array<string, float>  $confidence
     * @param  list<string>  $warnings
     */
    public function __construct(
        public string $document_kind,
        public ?string $method,
        public ?array $candidate,
        public array $confidence,
        public array $warnings,
        public ?string $raw_text,
        public ?string $error_message,
    ) {}
}
