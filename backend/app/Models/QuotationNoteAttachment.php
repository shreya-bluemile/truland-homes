<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class QuotationNoteAttachment extends Model
{
    protected $fillable = ['quotation_note_id', 'name', 'path', 'size', 'mime_type'];

    public function note(): BelongsTo
    {
        return $this->belongsTo(QuotationNote::class, 'quotation_note_id');
    }
}
