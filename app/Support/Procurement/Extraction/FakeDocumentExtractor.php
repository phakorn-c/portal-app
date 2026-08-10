<?php

namespace App\Support\Procurement\Extraction;

final class FakeDocumentExtractor implements DocumentExtractor
{
    public function extract(ExtractionRequest $request): ExtractionResult
    {
        return match ($request->originalClientFilename) {
            'kku-text-demo.pdf' => $this->textPdfResult(),
            'khon-kaen-municipality-scanned-demo.pdf' => $this->scannedPdfResult(),
            'thanyarak-khon-kaen-failure-demo.pdf' => $this->failureResult(),
            default => $this->unknownResult(),
        };
    }

    private function textPdfResult(): ExtractionResult
    {
        $candidate = [
            'title' => 'ประกาศจ้างพัฒนาระบบสารสนเทศเพื่อการบริหารงาน มหาวิทยาลัยขอนแก่น',
            'organization' => 'มหาวิทยาลัยขอนแก่น',
            'category' => 'services',
            'method' => 'e-bidding',
            'budget' => 2450000.00,
            'location' => 'อำเภอเมืองขอนแก่น จังหวัดขอนแก่น',
            'reference_price' => 2400000.00,
            'contact_name' => 'งานพัสดุ มหาวิทยาลัยขอนแก่น',
            'contact_phone' => '043-000-111',
            'description' => 'จ้างพัฒนาระบบสารสนเทศเพื่อสนับสนุนการบริหารงานภายในมหาวิทยาลัย',
            'deadline' => '2026-09-30',
            'status' => 'open',
        ];

        return new ExtractionResult(
            document_kind: 'text_pdf',
            method: 'fake_embedded_text',
            candidate: $candidate,
            confidence: array_fill_keys(array_keys($candidate), 0.98),
            warnings: [],
            raw_text: 'มหาวิทยาลัยขอนแก่น ประกาศจ้างพัฒนาระบบสารสนเทศ งบประมาณ 2,450,000 บาท',
            error_message: null,
        );
    }

    private function scannedPdfResult(): ExtractionResult
    {
        return new ExtractionResult(
            document_kind: 'scanned_pdf',
            method: 'fake_ocr_placeholder',
            candidate: [
                'title' => 'ประกาศซื้อวัสดุสำนักงาน เทศบาลนครขอนแก่น',
                'organization' => 'เทศบาลนครขอนแก่น',
                'category' => 'goods',
                'method' => 'specific',
                'location' => 'เทศบาลนครขอนแก่น',
                'status' => 'open',
            ],
            confidence: [
                'title' => 0.70,
                'organization' => 0.95,
                'category' => 0.70,
                'method' => 0.70,
                'location' => 0.75,
                'status' => 0.65,
            ],
            warnings: ['This is a deterministic OCR placeholder for demonstration only, not model output; review is required.'],
            raw_text: null,
            error_message: null,
        );
    }

    private function failureResult(): ExtractionResult
    {
        return new ExtractionResult(
            document_kind: 'unknown',
            method: 'fake_unknown',
            candidate: null,
            confidence: [],
            warnings: ['Deterministic failure fixture; no candidate data was produced.'],
            raw_text: null,
            error_message: 'Deterministic fake extraction failure for thanyarak-khon-kaen-failure-demo.pdf.',
        );
    }

    private function unknownResult(): ExtractionResult
    {
        return new ExtractionResult(
            document_kind: 'unknown',
            method: 'fake_unknown',
            candidate: null,
            confidence: [],
            warnings: ['Unknown filename; review is required and no candidate data was guessed.'],
            raw_text: null,
            error_message: null,
        );
    }
}
