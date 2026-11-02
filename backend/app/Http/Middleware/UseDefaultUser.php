<?php

namespace App\Http\Middleware;

use App\Models\User;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

/**
 * The app has no login screen (client decision). Every staff request acts as the main
 * user (the first account, "Admin" from the seeder), so "created by", notes and the
 * activity log still record a name.
 *
 * To bring login back, swap this middleware for 'auth:sanctum' in routes/api.php
 * and restore the login page in the frontend.
 */
class UseDefaultUser
{
    public function handle(Request $request, Closure $next): Response
    {
        if (! Auth::check()) {
            $user = User::query()->orderBy('id')->first();
            abort_unless($user, 503, 'No user account exists yet. Run: php artisan db:seed');
            Auth::setUser($user);
        }

        return $next($request);
    }
}
