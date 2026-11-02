<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Lot extends Model
{
    protected $fillable = ['lot_number', 'street', 'suburb', 'floor_plan'];

    public function documents(): HasMany
    {
        return $this->hasMany(LotDocument::class);
    }

    /** "Lot 14, 22 Harbour View Road" */
    public function address(): string
    {
        return "{$this->lot_number}, {$this->street}";
    }

    /** "Lot 14 – 22 Harbour View Road, Melbourne" (dropdown label) */
    public function label(): string
    {
        return "{$this->lot_number} – {$this->street}".($this->suburb ? ", {$this->suburb}" : '');
    }
}
