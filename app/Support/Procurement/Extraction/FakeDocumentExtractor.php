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
            'title' => 'ประกวดราคาซื้อครุภัณฑ์คอมพิวเตอร์',
            'organization' => 'มหาวิทยาลัยขอนแก่น',
            'category' => 'goods',
            'method' => 'e-bidding',
            'budget' => 1500000,
            'location' => 'มหาวิทยาลัยขอนแก่น',
            'reference_price' => 1480000,
            'contact_name' => 'งานพัสดุ',
            'contact_phone' => '043-000-601',
            'description' => 'ข้อมูลสาธิตจาก PDF ที่มีชั้นข้อความ',
            'deadline' => '2026-09-30',
            'status' => 'open',
        ];

        return new ExtractionResult(
            document_kind: 'text_pdf',
            method: 'fake_embedded_text',
            candidate: $candidate,
            confidence: ['title' => 0.99, 'budget' => 0.98],
            warnings: [],
            raw_text: 'ข้อมูลสาธิต Text PDF',
            error_message: null,
        );
    }

    private function scannedPdfResult(): ExtractionResult
    {
        return new ExtractionResult(
            document_kind: 'scanned_pdf',
            method: 'fake_ocr_placeholder',
            candidate: [
                'title' => 'จ้างปรับปรุงระบบระบายน้ำเทศบาล',
                'organization' => 'เทศบาลนครขอนแก่น',
                'category' => 'construction',
                'method' => 'e-bidding',
                'budget' => 2750000,
                'location' => 'เทศบาลนครขอนแก่น',
                'reference_price' => 2700000,
                'contact_name' => 'กองคลัง',
                'contact_phone' => '043-000-602',
                'description' => 'ข้อมูลสาธิต Scanned PDF',
                'deadline' => '2026-10-15',
                'status' => 'open',
            ],
            confidence: [
                'title' => 0.86,
                'budget' => 0.82,
            ],
            warnings: ['deterministic OCR placeholder; not model output'],
            raw_text: 'ข้อมูลสาธิต Scanned PDF',
            error_message: null,
        );
    }

    private function failureResult(): ExtractionResult
    {
        return new ExtractionResult(
            document_kind: 'unknown',
            method: null,
            candidate: null,
            confidence: [],
            warnings: [],
            raw_text: null,
            error_message: 'DEMO_EXTRACTION_FAILURE',
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
