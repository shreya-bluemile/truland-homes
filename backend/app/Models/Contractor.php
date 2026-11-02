<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Contractor extends Model
{
    protected $fillable = ['contractor_category_id', 'name', 'email'];

    public function category(): BelongsTo
    {
        return $this->belongsTo(ContractorCategory::class, 'contractor_category_id');
    }
}
