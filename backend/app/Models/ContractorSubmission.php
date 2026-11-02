<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ContractorSubmission extends Model
{
    protected $fillable = ['quotation_contractor_id', 'original_name', 'path', 'size', 'mime_type', 'message'];

    public function recipient(): BelongsTo
    {
        return $this->belongsTo(QuotationContractor::class, 'quotation_contractor_id');
    }
}
