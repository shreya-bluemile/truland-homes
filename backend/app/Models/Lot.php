<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Lot extends Model
{
    use HasFactory;

    protected $fillable = ['address', 'floor_plan'];

    public function quotations(): HasMany
    {
        return $this->hasMany(Quotation::class);
    }

    /** "Lot 14, 22 Harbour View Road" → "Lot 14" (used in email subjects). */
    public function shortName(): string
    {
        return trim(explode(',', $this->address)[0]);
    }
}
