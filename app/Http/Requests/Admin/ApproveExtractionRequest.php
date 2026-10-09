<?php

namespace App\Http\Requests\Admin;

use App\Models\Announcement;
use App\Models\DocumentExtraction;
use App\Support\Procurement\Taxonomy;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class ApproveExtractionRequest extends FormRequest
{
    private const CANDIDATE_FIELDS = [
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
        'project_key',
        'project_no',
        'notice_type',
        'procurement_category',
        'tags',
        'display_price',
        'display_price_source',
        'province',
        'district',
        'subdistrict',
        'location_source',
        'contact_website',
        'announcer_name',
        'announcer_position',
        'winner_name',
        'winning_price',
        'bidders',
        'announced_at',
        'submission_deadline',
        'award_announced_at',
        'process_status',
        'source_id',
    ];

    public function authorize(): bool
    {
        $announcement = $this->route('announcement');
        $extraction = $this->route('extraction');

        if ($announcement instanceof Announcement && $extraction instanceof DocumentExtraction) {
            abort_unless(
                $extraction->attachment()->where('announcement_id', $announcement->id)->exists(),
                404,
            );
        }

        return true;
    }

    protected function prepareForValidation(): void
    {
        if (is_string($this->input('organization'))) {
            $this->merge([
                'organization' => preg_replace('/\s+/', ' ', trim($this->input('organization'))),
            ]);
        }
    }

    public function rules(): array
    {
        $raw = $this->route('announcement')?->source_document_key !== null;

        return [
            'title' => ['required', 'string', 'max:255'],
            'organization' => $raw ? ['required', 'string', 'max:255'] : ['required', Rule::in(Taxonomy::organizations())],
            'category' => ['required', Rule::in(array_keys(Taxonomy::categories()))],
            'method' => $raw ? ['required', 'string', 'max:255'] : ['required', Rule::in(array_keys(Taxonomy::methods()))],
            'budget' => [$raw ? 'nullable' : 'required', 'numeric', 'min:0'],
            'location' => ['present', 'nullable', 'string', 'max:255'],
            'reference_price' => ['present', 'nullable', 'numeric', 'min:0'],
            'contact_name' => ['present', 'nullable', 'string', 'max:255'],
            'contact_phone' => ['present', 'nullable', 'string', 'max:255'],
            'description' => ['present', 'nullable', 'string'],
            'deadline' => [$raw ? 'nullable' : 'required', 'date_format:Y-m-d'],
            'status' => [$raw ? 'nullable' : 'required', Rule::in(['open', 'urgent', 'closing', 'closed'])],
            'project_key' => ['sometimes', 'nullable', 'string', 'max:255'],
            'project_no' => ['sometimes', 'nullable', 'string', 'max:255'],
            'notice_type' => ['sometimes', 'nullable', Rule::in(['invitation', 'award'])],
            'procurement_category' => ['sometimes', 'nullable', Rule::in(['works', 'supply', 'service', 'consulting', 'other'])],
            'tags' => ['sometimes', 'nullable', 'array', 'list'],
            'tags.*' => ['string', 'max:255'],
            'bidders' => ['sometimes', 'nullable', 'array', 'list'],
            'bidders.*' => ['array'],
            'display_price' => ['sometimes', 'nullable', 'numeric', 'min:0'],
            'winning_price' => ['sometimes', 'nullable', 'numeric', 'min:0'],
            'display_price_source' => ['sometimes', 'nullable', 'string', 'max:255'],
            'province' => ['sometimes', 'nullable', 'string', 'max:255'],
            'district' => ['sometimes', 'nullable', 'string', 'max:255'],
            'subdistrict' => ['sometimes', 'nullable', 'string', 'max:255'],
            'location_source' => ['sometimes', 'nullable', 'string', 'max:255'],
            'contact_website' => ['sometimes', 'nullable', 'url:http,https', 'max:2048'],
            'announcer_name' => ['sometimes', 'nullable', 'string', 'max:255'],
            'announcer_position' => ['sometimes', 'nullable', 'string', 'max:255'],
            'winner_name' => ['sometimes', 'nullable', 'string'],
            'announced_at' => ['sometimes', 'nullable', 'date_format:Y-m-d'],
            'submission_deadline' => ['sometimes', 'nullable', 'date_format:Y-m-d'],
            'award_announced_at' => ['sometimes', 'nullable', 'date_format:Y-m-d'],
            'process_status' => ['sometimes', 'nullable', 'string', 'max:255'],
            'source_id' => ['sometimes', 'nullable', 'string', 'max:255'],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator): void {
            $unknown = array_diff(array_keys($this->all()), self::CANDIDATE_FIELDS);

            if ($unknown !== []) {
                $validator->errors()->add('payload', 'The approval payload contains forbidden fields.');
            }
        });
    }
}
