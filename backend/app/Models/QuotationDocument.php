<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class QuotationDocument extends Model
{
    protected $fillable = ['quotation_id', 'scope_template_id', 'name', 'path', 'size', 'mime_type'];

    public function quotation(): BelongsTo
    {
        return $this->belongsTo(Quotation::class);
    }
}
