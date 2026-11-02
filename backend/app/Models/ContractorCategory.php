<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ContractorCategory extends Model
{
    protected $fillable = ['name'];

    public function contractors(): HasMany
    {
        return $this->hasMany(Contractor::class);
    }

    public function documents(): HasMany
    {
        return $this->hasMany(CategoryDocument::class);
    }
}
