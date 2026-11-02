<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\QuotationRequest;
use App\Http\Resources\DocumentResource;
use App\Models\ContractorCategory;
use App\Models\ScopeTemplate;
use App\Services\FileStorage;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Symfony\Component\HttpFoundation\StreamedResponse;

/** Categories and their scope-of-work documents (auto-loaded into new quotations). */
class ContractorCategoryController extends Controller
{
    public function __construct(private readonly FileStorage $files) {}

    public function index(): JsonResponse
    {
        $categories = ContractorCategory::withCount('contractors')->with('scopeTemplates')->orderBy('name')->get();

        return response()->json(['data' => $categories->map(fn ($c) => $this->payload($c))]);
    }

    public function store(Request $request): JsonResponse
    {
        $category = ContractorCategory::create($this->validated($request));

        return response()->json(['data' => $this->payload($category->loadCount('contractors')->load('scopeTemplates')),
            'message' => "{$category->name} added."], 201);
    }

    public function update(Request $request, ContractorCategory $category): JsonResponse
    {
        $category->update($this->validated($request, $category));

        return response()->json(['data' => $this->payload($category->loadCount('contractors')->load('scopeTemplates')),
            'message' => 'Category updated.']);
    }

    public function destroy(ContractorCategory $category): JsonResponse
    {
        abort_if($category->contractors()->withTrashed()->exists() || $category->quotations()->exists(), 422,
            'This category has contractors or quotations, so it can’t be deleted.');
        $paths = $category->scopeTemplates()->pluck('path')->all();
        $category->delete();
        $this->files->delete($paths);

        return response()->json(['message' => 'Category deleted.']);
    }

    public function storeTemplates(Request $request, ContractorCategory $category): JsonResponse
    {
        $types = QuotationRequest::DOCUMENT_TYPES;
        $request->validate([
            'files' => ['required', 'array', 'max:20'],
            'files.*' => ['file', 'max:'.QuotationRequest::MAX_FILE_KB, 'extensions:'.$types, 'mimes:'.$types],
        ], ['files.required' => 'Choose at least one document.', 'files.*.max' => 'Each document must be 10 MB or smaller.']);

        foreach ($request->file('files') as $upload) {
            $category->scopeTemplates()->create($this->files->store($upload, "scope-templates/{$category->id}"));
        }

        return response()->json(['data' => $this->payload($category->loadCount('contractors')->load('scopeTemplates')),
            'message' => 'Documents added.'], 201);
    }

    public function destroyTemplate(ContractorCategory $category, ScopeTemplate $template): JsonResponse
    {
        $this->files->delete($template->path);
        $template->delete();

        return response()->json(['message' => 'Document removed.']);
    }

    public function downloadTemplate(ContractorCategory $category, ScopeTemplate $template): StreamedResponse
    {
        return Storage::disk(FileStorage::DISK)->download($template->path, $template->name);
    }

    private function validated(Request $request, ?ContractorCategory $category = null): array
    {
        return $request->validate([
            'name' => ['required', 'string', 'max:100', Rule::unique('contractor_categories', 'name')->ignore($category?->id)],
        ]);
    }

    private function payload(ContractorCategory $category): array
    {
        return [
            'id' => $category->id,
            'name' => $category->name,
            'contractors_count' => $category->contractors_count ?? 0,
            'templates' => DocumentResource::collection($category->scopeTemplates),
        ];
    }
}
