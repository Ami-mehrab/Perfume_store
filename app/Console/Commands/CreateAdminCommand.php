<?php

namespace App\Console\Commands;

use App\Enums\UserRole;
use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Str;

class CreateAdminCommand extends Command
{
    protected $signature = 'store:admin {email} {--name=Store Admin} {--password=}';

    protected $description = 'Create an administrator or promote an existing account. Registration cannot do this.';

    public function handle(): int
    {
        $email = strtolower((string) $this->argument('email'));
        $password = $this->option('password');
        $generated = ! is_string($password) || $password === '';

        if ($generated) {
            $password = Str::password(20);
        }

        $user = User::query()->where('email', $email)->first();

        if ($user === null) {
            $user = User::query()->create([
                'name' => (string) $this->option('name'),
                'email' => $email,
                'password' => $password,
            ]);
        } else {
            $user->name = (string) $this->option('name');
            $user->password = $password;
        }

        $user->email_verified_at = now();
        $user->forceFill(['role' => UserRole::Admin])->save();

        $this->info("Administrator ready: {$user->email}");

        if ($generated) {
            $this->line('Password: '.$password);
            $this->comment('Store this password now. It will not be shown again.');
        }

        return self::SUCCESS;
    }
}
