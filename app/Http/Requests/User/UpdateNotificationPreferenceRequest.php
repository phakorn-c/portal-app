<?php

namespace App\Http\Requests\User;

use Illuminate\Foundation\Http\FormRequest;

class UpdateNotificationPreferenceRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'website_enabled' => ['required', 'boolean'],
            'email_enabled' => ['required', 'boolean'],
        ];
    }
}
