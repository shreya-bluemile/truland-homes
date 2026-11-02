<?php

namespace App\Http\Resources;

use App\Models\QuotationContractor;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** A quotation as shown in the list. Expects lot, category, creator and recipients to be loaded. */
class QuotationListResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $recipients = $this->recipients;

        return [
            'id' => $this->id,
            'quote_no' => $this->quote_no,
            'status' => $this->status,
            'display_status' => $this->displayStatus(),
            'lot' => ['id' => $this->lot->id, 'address' => $this->lot->address, 'floor_plan' => $this->lot->floor_plan],
            'category' => $this->category ? ['id' => $this->category->id, 'name' => $this->category->name] : null,
            'due_date' => $this->due_date?->format('Y-m-d'),
            'created_by' => ['id' => $this->creator->id, 'name' => $this->creator->name],
            'created_at' => $this->created_at->toIso8601String(),
            'sent_at' => $this->sent_at?->toIso8601String(),
            'counts' => [
                'contractors' => $recipients->count(),
                'quoted' => $recipients->where('status', QuotationContractor::RECEIVED)->count(),
                'opened' => $recipients->whereNotNull('opened_at')->count(),
            ],
        ];
    }
}
