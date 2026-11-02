<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;

/** Full quotation for the detail drawer and for editing drafts. */
class QuotationResource extends QuotationListResource
{
    public function toArray(Request $request): array
    {
        return array_merge(parent::toArray($request), [
            'reminder_days' => $this->reminder_days,
            'notes' => $this->notes,
            'contractor_ids' => $this->recipients->pluck('contractor_id')->all(),
            'documents' => DocumentResource::collection($this->documents),
            'recipients' => RecipientResource::collection($this->recipients),
            'email' => $this->email_subject ? ['subject' => $this->email_subject, 'body' => $this->email_body] : null,
        ]);
    }
}
