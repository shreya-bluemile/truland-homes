<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\ContractorResource;
use App\Models\Contractor;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Validation\Rule;

class ContractorController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $filters = $request->validate([
            'search' => ['nullable', 'string', 'max:100'],
            'category_id' => ['nullable', 'integer'],
        ]);

        $contractors = Contractor::with('category')
            ->when($filters['search'] ?? null, fn ($q, $s) => $q->where(fn ($q) => $q
                ->where('name', 'like', "%{$s}%")->orWhere('email', 'like', "%{$s}%")))
            ->when($filters['category_id'] ?? null, fn ($q, $id) => $q->where('contractor_category_id', $id))
            ->orderBy('name')
            ->paginate(15)
            ->withQueryString();

        return ContractorResource::collection($contractors);
    }

    public function store(Request $request): JsonResponse
    {
        $contractor = Contractor::create($this->validated($request));

        return (new ContractorResource($contractor->load('category')))
            ->additional(['message' => "{$contractor->name} added."])->response()->setStatusCode(201);
    }

    public function update(Request $request, Contractor $contractor): ContractorResource
    {
        $contractor->update($this->validated($request));

        return (new ContractorResource($contractor->load('category')))->additional(['message' => 'Contractor updated.']);
    }

    /** Soft delete, so quotations already sent to this contractor keep their history. */
    public function destroy(Contractor $contractor): JsonResponse
    {
        $contractor->delete();

        return response()->json(['message' => "{$contractor->name} removed."]);
    }

    private function validated(Request $request): array
    {
        return $request->validate([
            'name' => ['required', 'string', 'max:150'],
            'email' => ['required', 'email', 'max:190'],
            'phone' => ['nullable', 'string', 'max:30'],
            'contractor_category_id' => ['required', 'integer', Rule::exists('contractor_categories', 'id')],
            'is_active' => ['required', 'boolean'],
        ], [], ['contractor_category_id' => 'category']);
    }
}
