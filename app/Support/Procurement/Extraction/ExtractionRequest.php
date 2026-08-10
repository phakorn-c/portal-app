<?php

namespace App\Support\Procurement\Extraction;

final readonly class ExtractionRequest
{
    public function __construct(
        public string $originalClientFilename,
    ) {}
}
