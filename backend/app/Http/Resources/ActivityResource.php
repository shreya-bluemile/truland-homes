<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ActivityResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'action' => $this->action,
            'actor_name' => $this->actor_name,
            'description' => $this->description,
            'created_at' => $this->created_at->toIso8601String(),
        ];
    }
}
