<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/** The app has no login: requests act as the first (main) user. */
class AuthTest extends TestCase
{
    use RefreshDatabase;

    public function test_requests_act_as_the_main_user_without_logging_in(): void
    {
        $admin = User::factory()->create(['name' => 'Admin']);
        User::factory()->create(['name' => 'Someone Else']);

        $this->getJson('/api/auth/me')
            ->assertOk()
            ->assertJsonPath('user.id', $admin->id)
            ->assertJsonPath('user.name', 'Admin');
    }

    public function test_clear_error_when_no_user_has_been_seeded(): void
    {
        $this->getJson('/api/auth/me')
            ->assertStatus(503)
            ->assertJsonPath('message', 'No user account exists yet. Run: php artisan db:seed');
    }

    public function test_login_routes_no_longer_exist(): void
    {
        $this->postJson('/api/auth/login', ['email' => 'a@b.com', 'password' => 'x'])->assertNotFound();
        $this->postJson('/api/auth/logout')->assertNotFound();
    }
}
