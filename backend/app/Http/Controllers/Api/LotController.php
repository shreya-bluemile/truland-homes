<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Lot;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class LotController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $search = $request->validate(['search' => ['nullable', 'string', 'max:100']])['search'] ?? null;

        return response()->json(
            Lot::withCount('quotations')
                ->when($search, fn ($q, $s) => $q->where('address', 'like', "%{$s}%"))
                ->orderBy('address')
                ->paginate(15)
                ->withQueryString()
        );
    }

    public function store(Request $request): JsonResponse
    {
        $lot = Lot::create($this->validated($request));

        return response()->json(['data' => $lot, 'message' => 'Lot added.'], 201);
    }

    public function update(Request $request, Lot $lot): JsonResponse
    {
        $lot->update($this->validated($request));

        return response()->json(['data' => $lot, 'message' => 'Lot updated.']);
    }

    public function destroy(Lot $lot): JsonResponse
    {
        abort_if($lot->quotations()->exists(), 422, 'This lot has quotations, so it can’t be deleted.');
        $lot->delete();

        return response()->json(['message' => 'Lot deleted.']);
    }

    private function validated(Request $request): array
    {
        return $request->validate([
            'address' => ['required', 'string', 'max:255'],
            'floor_plan' => ['nullable', 'string', 'max:150'],
        ]);
    }
}
