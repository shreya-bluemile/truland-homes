<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AuthController extends Controller
{
    /** The user the app is acting as (shown in the header). */
    public function me(Request $request): JsonResponse
    {
        $user = $request->user();

        return response()->json(['user' => ['id' => $user->id, 'name' => $user->name, 'email' => $user->email]]);
    }
}
