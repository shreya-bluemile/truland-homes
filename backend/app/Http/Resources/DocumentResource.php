<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** A stored file: quotation document, scope template, note attachment or submission. */
class DocumentResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name ?? $this->original_name,
            'size' => (int) $this->size,
            'mime_type' => $this->mime_type,
            'is_template' => isset($this->scope_template_id) && $this->scope_template_id !== null,
        ];
    }
}
