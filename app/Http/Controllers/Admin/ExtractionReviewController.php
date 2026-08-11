<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\ApproveExtractionRequest;
use App\Jobs\ProcessDocumentExtraction;
use App\Models\Announcement;
use App\Models\DocumentExtraction;
use App\Support\Procurement\AttachmentStorage;
use App\Support\Procurement\Taxonomy;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class ExtractionReviewController extends Controller
{
    public function show(Announcement $announcement, DocumentExtraction $extraction): Response
    {
        $extraction = $this->scopedExtraction($announcement, $extraction);
        $attachment = $extraction->attachment;

        return Inertia::render('admin/extraction-review', [
            'announcement' => $announcement->only([
                'id',
                'title',
                'organization',
                'category',
                'method',
                'budget',
                'location',
                'reference_price',
                'contact_name',
                'contact_phone',
                'description',
                'deadline',
                'status',
                'publication_status',
                'source_url',
                'source_reference',
            ]),
            'attachment' => $attachment->only([
                'id',
                'filename',
                'file_size',
                'mime_type',
                'document_kind',
            ]),
            'extraction' => [
                'id' => $extraction->id,
                'status' => $extraction->status,
                'method' => $extraction->method,
                'candidate' => $extraction->candidate,
                'confidence' => $extraction->confidence,
                'warnings' => $extraction->warnings,
                'raw_text' => $extraction->raw_text,
                'error_message' => $extraction->error_message,
                'attempt_count' => $extraction->attempt_count,
                'processed_at' => $extraction->processed_at,
                'approved_at' => $extraction->approved_at,
                'approved_by' => $extraction->approved_by,
            ],
            'taxonomy' => Taxonomy::forInertia(),
        ]);
    }

    public function approve(
        ApproveExtractionRequest $request,
        Announcement $announcement,
        DocumentExtraction $extraction,
        AttachmentStorage $attachmentStorage,
    ): RedirectResponse {
        DB::transaction(function () use ($request, $announcement, $extraction, $attachmentStorage): void {
            $parent = Announcement::query()->lockForUpdate()->findOrFail($announcement->id);
            $lockedExtraction = $this->lockedScopedExtraction($parent, $extraction->id);

            if ($lockedExtraction->status !== 'review') {
                throw ValidationException::withMessages([
                    'extraction' => 'Only an extraction awaiting review may be approved.',
                ]);
            }

            $attachmentStorage->updateAnnouncement($parent, $request->validated());
            $lockedExtraction->update([
                'status' => 'approved',
                'approved_at' => now(),
                'approved_by' => $request->user()->id,
            ]);
        });

        return redirect()
            ->route('admin.announcements.extractions.show', [$announcement, $extraction])
            ->with('success', 'Extraction approved successfully.');
    }

    public function retry(
        Announcement $announcement,
        DocumentExtraction $extraction,
    ): RedirectResponse {
        $extraction = $this->scopedExtraction($announcement, $extraction);

        if (! in_array($extraction->status, ['review', 'failed'], true)) {
            throw ValidationException::withMessages([
                'extraction' => 'Only review or failed extractions may be retried.',
            ]);
        }

        if (! ProcessDocumentExtraction::dispatchFor($extraction->id)) {
            throw ValidationException::withMessages([
                'extraction' => 'The extraction cannot be retried because its attempt limit was reached.',
            ]);
        }

        return redirect()
            ->route('admin.announcements.extractions.show', [$announcement, $extraction])
            ->with('success', 'Extraction retry queued successfully.');
    }

    private function scopedExtraction(
        Announcement $announcement,
        DocumentExtraction $extraction,
    ): DocumentExtraction {
        abort_unless(
            $extraction->attachment()->where('announcement_id', $announcement->id)->exists(),
            404,
        );

        return $extraction;
    }

    private function lockedScopedExtraction(Announcement $announcement, int $extractionId): DocumentExtraction
    {
        return DocumentExtraction::query()
            ->whereKey($extractionId)
            ->whereHas('attachment', fn ($query) => $query->where('announcement_id', $announcement->id))
            ->lockForUpdate()
            ->firstOrFail();
    }
}
