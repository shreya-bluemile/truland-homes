<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class EmailTemplateResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'key' => $this->key,
            'is_system' => $this->isSystem(),
            'name' => $this->name,
            'description' => $this->description,
            'subject' => $this->subject,
            'body' => $this->body,
            'is_active' => $this->is_active,
            'updated_at' => $this->updated_at->toIso8601String(),
        ];
    }
}
