<?php

namespace App\Jobs;

use App\Models\Announcement;
use App\Models\SavedSearch;
use App\Notifications\NewMatchingAnnouncement;
use App\Support\Procurement\AnnouncementSearch;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class EvaluateSavedSearchAlerts implements ShouldQueue
{
    use Dispatchable;
    use Queueable;
    use SerializesModels;

    public function __construct(public Announcement $announcement) {}

    public function handle(AnnouncementSearch $search): void
    {
        $announcement = Announcement::query()
            ->published()
            ->find($this->announcement->id);

        if (! $announcement || ! $announcement->published_at) {
            return;
        }

        SavedSearch::query()
            ->where('alert_enabled', true)
            ->with(['user.notificationPreference'])
            ->chunkById(100, function ($savedSearches) use ($search, $announcement): void {
                foreach ($savedSearches as $savedSearch) {
                    $user = $savedSearch->user;

                    if (! $user) {
                        continue;
                    }

                    $alreadyNotified = $savedSearch->last_notified_at !== null
                        && $savedSearch->last_notified_at->greaterThanOrEqualTo($announcement->published_at);

                    if ($alreadyNotified) {
                        continue;
                    }

                    $matchesAnnouncement = $search
                        ->apply($savedSearch->criteria ?? [])
                        ->where('announcements.id', $announcement->id)
                        ->exists();

                    if (! $matchesAnnouncement) {
                        continue;
                    }

                    $savedSearch->update(['last_notified_at' => now()]);

                    try {
                        $user->notify(new NewMatchingAnnouncement($announcement, $savedSearch));
                    } catch (\Throwable $e) {
                        Log::warning('Notification delivery failed for saved search '.$savedSearch->id, [
                            'announcement_id' => $announcement->id,
                            'user_id' => $user->id,
                            'exception' => $e->getMessage(),
                        ]);
                    }
                }
            });
    }
}
