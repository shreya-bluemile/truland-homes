<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class NoteResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'body' => $this->body,
            'author' => ['id' => $this->author->id, 'name' => $this->author->name],
            'can_edit' => $request->user()?->id === $this->user_id,
            'created_at' => $this->created_at->toIso8601String(),
            'updated_at' => $this->updated_at->toIso8601String(),
            'attachments' => DocumentResource::collection($this->attachments),
        ];
    }
}
