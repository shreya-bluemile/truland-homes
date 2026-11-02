<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class LotDocument extends Model
{
    protected $fillable = ['lot_id', 'name', 'path', 'size'];
}
