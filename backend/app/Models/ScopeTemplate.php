<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ScopeTemplate extends Model
{
    protected $fillable = ['contractor_category_id', 'name', 'path', 'size', 'mime_type'];

    public function category(): BelongsTo
    {
        return $this->belongsTo(ContractorCategory::class, 'contractor_category_id');
    }
}
