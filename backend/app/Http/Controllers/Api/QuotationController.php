<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\QuotationRequest;
use App\Http\Resources\QuotationListResource;
use App\Http\Resources\QuotationResource;
use App\Models\Quotation;
use App\Services\QuotationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use RuntimeException;

class QuotationController extends Controller
{
    public function __construct(private readonly QuotationService $service) {}

    /** List with the filters shown above the table: quote no., lot, category and created date. */
    public function index(Request $request): AnonymousResourceCollection
    {
        $filters = $request->validate([
            'search' => ['nullable', 'string', 'max:50'],
            'lot_id' => ['nullable', 'integer'],
            'category_id' => ['nullable', 'integer'],
            'date' => ['nullable', 'in:today,7d,30d,month'],
            'per_page' => ['nullable', 'integer', 'min:5', 'max:100'],
        ]);

        $quotations = Quotation::query()
            ->with(['lot', 'category', 'creator:id,name', 'recipients:id,quotation_id,status,opened_at'])
            ->when($filters['search'] ?? null, fn ($q, $s) => $q->where('quote_no', 'like', '%'.addcslashes($s, '%_').'%'))
            ->when($filters['lot_id'] ?? null, fn ($q, $id) => $q->where('lot_id', $id))
            ->when($filters['category_id'] ?? null, fn ($q, $id) => $q->where('contractor_category_id', $id))
            ->when($filters['date'] ?? null, fn ($q, $range) => $q->where('created_at', '>=', match ($range) {
                'today' => today(),
                '7d' => today()->subDays(6),
                '30d' => today()->subDays(29),
                'month' => today()->startOfMonth(),
            }))
            ->latest('id')
            ->paginate($filters['per_page'] ?? 15)
            ->withQueryString();

        return QuotationListResource::collection($quotations);
    }

    public function store(QuotationRequest $request): JsonResponse
    {
        return $this->save(null, $request, 201);
    }

    public function show(Quotation $quotation): QuotationResource
    {
        return new QuotationResource($this->loadDetail($quotation));
    }

    public function update(QuotationRequest $request, Quotation $quotation): JsonResponse
    {
        abort_unless($quotation->isDraft(), 422, 'Only drafts can be edited. This quotation has already been sent.');

        return $this->save($quotation, $request, 200);
    }

    public function destroy(Quotation $quotation): JsonResponse
    {
        abort_unless($quotation->isDraft(), 422, 'Only drafts can be deleted. This quotation has already been sent.');
        $this->service->deleteDraft($quotation);

        return response()->json(['message' => 'Draft deleted.']);
    }

    private function save(?Quotation $quotation, QuotationRequest $request, int $status): JsonResponse
    {
        $send = $request->input('action') === 'send';

        try {
            $result = $this->service->save($quotation, $request->safe()->except(['action', 'files']),
                $request->file('files', []), $request->user(), $send);
        } catch (RuntimeException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }

        $saved = $result['quotation'];
        $message = match (true) {
            ! $send => "Draft {$saved->quote_no} saved.",
            $result['failed'] !== [] => "{$saved->quote_no} sent, but the email to ".implode(', ', $result['failed']).' could not be sent.',
            default => "Quotation {$saved->quote_no} sent.",
        };

        return (new QuotationResource($this->loadDetail($saved)))
            ->additional(['message' => $message, 'failed' => $result['failed']])
            ->response()
            ->setStatusCode($status);
    }

    private function loadDetail(Quotation $quotation): Quotation
    {
        return $quotation->load(['lot', 'category', 'creator:id,name', 'documents', 'recipients.contractor', 'recipients.latestSubmission']);
    }
}
