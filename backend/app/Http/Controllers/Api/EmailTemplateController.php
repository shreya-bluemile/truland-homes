<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\EmailTemplateResource;
use App\Models\EmailTemplate;
use App\Services\EmailTemplateRenderer;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class EmailTemplateController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $filters = $request->validate([
            'search' => ['nullable', 'string', 'max:100'],
            'status' => ['nullable', 'in:active,inactive'],
        ]);

        $templates = EmailTemplate::query()
            ->when($filters['search'] ?? null, fn ($q, $s) => $q->where(fn ($q) => $q
                ->where('name', 'like', "%{$s}%")->orWhere('description', 'like', "%{$s}%")))
            ->when($filters['status'] ?? null, fn ($q, $status) => $q->where('is_active', $status === 'active'))
            ->orderBy('name')
            ->paginate(10)
            ->withQueryString();

        return EmailTemplateResource::collection($templates)
            ->additional(['placeholders' => EmailTemplateRenderer::quotationPlaceholders()]);
    }

    public function store(Request $request): JsonResponse
    {
        $template = EmailTemplate::create($this->validated($request));

        return (new EmailTemplateResource($template))->additional(['message' => 'Email template created.'])
            ->response()->setStatusCode(201);
    }

    public function update(Request $request, EmailTemplate $emailTemplate): EmailTemplateResource
    {
        $data = $this->validated($request);
        if ($emailTemplate->isSystem() && ! $data['is_active']) {
            abort(422, 'This template is used to email contractors, so it can’t be made inactive.');
        }
        $emailTemplate->update($data);

        return (new EmailTemplateResource($emailTemplate))->additional(['message' => 'Email template saved.']);
    }

    private function validated(Request $request): array
    {
        return $request->validate([
            'name' => ['required', 'string', 'max:150'],
            'description' => ['nullable', 'string', 'max:255'],
            'subject' => ['required', 'string', 'max:255'],
            'body' => ['required', 'string', 'max:65000'],
            'is_active' => ['required', 'boolean'],
        ]);
    }
}
