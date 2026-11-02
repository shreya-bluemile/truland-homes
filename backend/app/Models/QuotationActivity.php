<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class QuotationActivity extends Model
{
    public const UPDATED_AT = null;

    protected $fillable = ['quotation_id', 'actor_name', 'description'];
}
