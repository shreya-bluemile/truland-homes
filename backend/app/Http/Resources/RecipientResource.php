<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class RecipientResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $submission = $this->relationLoaded('latestSubmission') ? $this->latestSubmission : null;

        return [
            'id' => $this->id,
            'contractor' => [
                'id' => $this->contractor->id,
                'name' => $this->contractor->name,
                'email' => $this->contractor->email,
            ],
            'status' => $this->status,
            'status_label' => $this->statusLabel(),
            'response_source' => $this->response_source,
            'sent_at' => $this->sent_at?->toIso8601String(),
            'opened_at' => $this->opened_at?->toIso8601String(),
            'responded_at' => $this->responded_at?->toIso8601String(),
            'last_reminded_at' => $this->last_reminded_at?->toIso8601String(),
            'reminder_count' => $this->reminder_count,
            'submission' => $submission ? [
                'id' => $submission->id,
                'name' => $submission->original_name,
                'size' => (int) $submission->size,
                'message' => $submission->message,
                'submitted_at' => $submission->created_at->toIso8601String(),
            ] : null,
        ];
    }
}
