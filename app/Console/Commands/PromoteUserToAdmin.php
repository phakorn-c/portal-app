<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;

class PromoteUserToAdmin extends Command
{
    protected $signature = 'user:promote {email}';

    protected $description = 'Promote a registered user to admin by email';

    public function handle(): int
    {
        $email = (string) $this->argument('email');
        $user = User::query()->where('email', $email)->first();

        if (! $user instanceof User) {
            $this->error("User with email {$email} was not found.");

            return self::FAILURE;
        }

        if ($user->isAdmin()) {
            $this->info("User {$email} is already an admin.");

            return self::SUCCESS;
        }

        $user->update(['role' => 'admin']);

        $this->info("User {$email} promoted to admin successfully.");

        return self::SUCCESS;
    }
}
