<?php

use App\Http\Controllers\Api\AuthController;
use Illuminate\Support\Facades\Route;

// No login screen: staff requests act as the main user (see App\Http\Middleware\UseDefaultUser).
Route::middleware('default.user')->group(function () {
    Route::get('auth/me', [AuthController::class, 'me']);
});
