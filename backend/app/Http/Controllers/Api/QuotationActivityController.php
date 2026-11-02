<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Quotation;
use Illuminate\Http\JsonResponse;

class QuotationActivityController extends Controller
{
    public function index(Quotation $quotation): JsonResponse
    {
        $page = $quotation->activities()->latest('created_at')->latest('id')->paginate(9);

        return response()->json([
            'data' => collect($page->items())->map(fn ($a) => [
                'id' => $a->id,
                'actor' => $a->actor_name,
                'description' => $a->description,
                'created_at' => $a->created_at?->toIso8601String(),
            ]),
            'current_page' => $page->currentPage(),
            'last_page' => $page->lastPage(),
        ]);
    }
}
