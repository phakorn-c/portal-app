<?php

namespace App\Http\Controllers\User;

use App\Http\Controllers\Controller;
use App\Models\NotificationPreference;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class NotificationController extends Controller
{
    public function index(Request $request): Response
    {
        $notifications = $request->user()
            ->notifications()
            ->latest()
            ->paginate(20)
            ->withQueryString();

        $preferences = $request->user()->notificationPreference
            ?? NotificationPreference::query()->firstOrCreate(
                ['user_id' => $request->user()->id],
                ['website_enabled' => true, 'email_enabled' => false],
            );

        $alerts = $request->user()
            ->savedSearches()
            ->where('alert_enabled', true)
            ->latest()
            ->get();

        return Inertia::render('user/notifications', [
            'notifications' => $notifications,
            'preferences' => $preferences,
            'alerts' => $alerts,
        ]);
    }

    public function markRead(Request $request, string $notification): RedirectResponse
    {
        $record = $request->user()
            ->notifications()
            ->findOrFail($notification);

        $record->markAsRead();

        return back();
    }
}
