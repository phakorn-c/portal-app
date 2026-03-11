<?php

namespace App\Http\Controllers\User;

use App\Http\Controllers\Controller;
use App\Http\Requests\User\UpdateNotificationPreferenceRequest;
use App\Models\NotificationPreference;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class NotificationPreferenceController extends Controller
{
    public function show(Request $request): JsonResponse
    {
        $preference = NotificationPreference::query()->firstOrCreate(
            ['user_id' => $request->user()->id],
            ['website_enabled' => true, 'email_enabled' => false],
        );

        return response()->json($preference);
    }

    public function update(UpdateNotificationPreferenceRequest $request): JsonResponse
    {
        $preference = NotificationPreference::query()->firstOrCreate(
            ['user_id' => $request->user()->id],
            ['website_enabled' => true, 'email_enabled' => false],
        );

        $preference->update($request->validated());

        return response()->json($preference->fresh());
    }
}
