<?php

namespace App\Http\Requests\Admin;

use App\Support\Procurement\Taxonomy;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateAnnouncementRequest extends FormRequest
{
    protected function prepareForValidation(): void
    {
        $this->merge([
            'organization' => $this->has('organization')
                ? preg_replace('/\s+/', ' ', trim($this->input('organization')))
                : null,
        ]);
    }

    public function rules(): array
    {
        $imported = $this->route('announcement')?->source_document_key !== null;

        return [
            'title' => ['required', 'string', 'max:255'],
            'organization' => $imported ? ['required', 'string', 'max:255'] : ['required', Rule::in(Taxonomy::organizations())],
            'category' => ['required', Rule::in(array_keys(Taxonomy::categories()))],
            'method' => $imported ? ['required', 'string', 'max:255'] : ['required', Rule::in(array_keys(Taxonomy::methods()))],
            'budget' => [$imported ? 'nullable' : 'required', 'numeric', 'min:0'],
            'location' => ['nullable', 'string', 'max:255'],
            'reference_price' => ['nullable', 'numeric', 'min:0'],
            'contact_name' => ['nullable', 'string', 'max:255'],
            'contact_phone' => ['nullable', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'status' => [$imported ? 'nullable' : 'required', Rule::in(['open', 'urgent', 'closing', 'closed'])],
            'publication_status' => ['required', Rule::in(['draft', 'published', 'hidden'])],
            'deadline' => [$imported ? 'nullable' : 'required', 'date_format:Y-m-d'],
            'source_url' => ['nullable', 'url:http,https', 'max:2048'],
            'source_reference' => ['nullable', 'string', 'max:255'],
            'attachment' => ['nullable', 'file', 'mimes:pdf', 'mimetypes:application/pdf', 'max:20480'],
        ];
    }
}
