<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Announcement;
use App\Models\User;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function index()
    {
        $announcements = Announcement::with('attachments')
            ->latest()
            ->paginate(15);

        $stats = [
            'total_announcements' => Announcement::count(),
            'published_announcements' => Announcement::where('publication_status', 'published')->count(),
            'draft_announcements' => Announcement::where('publication_status', 'draft')->count(),
            'total_users' => User::count(),
        ];

        return Inertia::render('admin/dashboard', [
            'announcements' => $announcements,
            'stats' => $stats,
        ]);
    }
}
