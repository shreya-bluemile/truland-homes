<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class QuotationActivity extends Model
{
    protected $fillable = ['quotation_id', 'user_id', 'actor_name', 'action', 'description'];

    public function quotation(): BelongsTo
    {
        return $this->belongsTo(Quotation::class);
    }

    /** Records an entry in a quotation's activity log. $actor is a User or a display name. */
    public static function log(Quotation $quotation, string $action, string $description, User|string|null $actor = null): self
    {
        return self::create([
            'quotation_id' => $quotation->id,
            'user_id' => $actor instanceof User ? $actor->id : null,
            'actor_name' => $actor instanceof User ? $actor->name : ($actor ?? 'System'),
            'action' => $action,
            'description' => $description,
        ]);
    }
}
