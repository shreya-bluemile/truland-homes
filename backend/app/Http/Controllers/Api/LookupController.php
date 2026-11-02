<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\DocumentResource;
use App\Models\ContractorCategory;
use App\Models\Lot;
use Illuminate\Http\JsonResponse;

/** Options for the dropdowns in the filters and the Create Quotation drawer. */
class LookupController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json([
            'lots' => Lot::orderBy('address')->get(['id', 'address', 'floor_plan']),
            'categories' => ContractorCategory::orderBy('name')->get(['id', 'name']),
        ]);
    }

    /** Active contractors and auto-loaded scope documents for one category. */
    public function category(ContractorCategory $category): JsonResponse
    {
        return response()->json([
            'contractors' => $category->contractors()->where('is_active', true)->orderBy('name')->get(['id', 'name', 'email']),
            'templates' => DocumentResource::collection($category->scopeTemplates),
        ]);
    }
}
