<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class QuotationDocument extends Model
{
    protected $fillable = ['quotation_id', 'name', 'path', 'size', 'source'];
}
