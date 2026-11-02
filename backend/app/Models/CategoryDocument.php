<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CategoryDocument extends Model
{
    protected $fillable = ['contractor_category_id', 'name', 'path', 'size'];
}
