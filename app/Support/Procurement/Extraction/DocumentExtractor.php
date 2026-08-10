<?php

namespace App\Support\Procurement\Extraction;

interface DocumentExtractor
{
    public function extract(ExtractionRequest $request): ExtractionResult;
}
