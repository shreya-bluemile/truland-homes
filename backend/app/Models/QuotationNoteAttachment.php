<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class QuotationNoteAttachment extends Model
{
    protected $fillable = ['quotation_note_id', 'name', 'path', 'size'];
}
