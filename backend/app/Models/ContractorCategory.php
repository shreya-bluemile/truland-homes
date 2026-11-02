<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ContractorCategory extends Model
{
    use HasFactory;

    protected $fillable = ['name'];

    public function contractors(): HasMany
    {
        return $this->hasMany(Contractor::class);
    }

    public function scopeTemplates(): HasMany
    {
        return $this->hasMany(ScopeTemplate::class)->orderBy('name');
    }

    /** Used by scoped route bindings ({category}/templates/{template}). */
    public function templates(): HasMany
    {
        return $this->scopeTemplates();
    }

    public function quotations(): HasMany
    {
        return $this->hasMany(Quotation::class);
    }
}
