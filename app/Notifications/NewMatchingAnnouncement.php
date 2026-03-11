<?php

namespace App\Notifications;

use App\Models\Announcement;
use App\Models\SavedSearch;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class NewMatchingAnnouncement extends Notification
{
    use Queueable;

    public function __construct(
        private readonly Announcement $announcement,
        private readonly SavedSearch $savedSearch,
    ) {}

    public function via(object $notifiable): array
    {
        $preference = $notifiable->notificationPreference;

        if (! $preference) {
            return ['database'];
        }

        $channels = [];

        if ($preference->website_enabled) {
            $channels[] = 'database';
        }

        if ($preference->email_enabled) {
            $channels[] = 'mail';
        }

        return $channels;
    }

    public function toDatabase(object $_notifiable): array
    {
        is_object($_notifiable);

        return [
            'announcement_id' => $this->announcement->id,
            'announcement_title' => $this->announcement->title,
            'saved_search_id' => $this->savedSearch->id,
            'saved_search_name' => $this->savedSearch->name,
        ];
    }

    public function toMail(object $_notifiable): MailMessage
    {
        $greetingName = property_exists($_notifiable, 'name') ? (string) $_notifiable->name : 'ผู้ใช้งาน';

        return (new MailMessage)
            ->subject('ประกาศใหม่ที่ตรงกับการแจ้งเตือนของคุณ')
            ->greeting("สวัสดี {$greetingName}")
            ->line("พบประกาศใหม่: {$this->announcement->title}")
            ->line("จากการค้นหาที่บันทึกไว้: {$this->savedSearch->name}")
            ->action('ดูประกาศ', route('procurement.show', $this->announcement));
    }
}
