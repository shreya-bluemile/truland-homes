<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/** A contractor a quotation was sent to: their secure upload link and how they responded. */
class QuotationRecipient extends Model
{
    public const AWAITING = 'awaiting';
    public const QUOTED = 'quoted';         // uploaded a quote through the secure link
    public const RECEIVED = 'received';     // staff marked it received (e.g. the quote came by email)
    public const NOT_QUOTING = 'not_quoting';

    /** Statuses staff can pick from the dropdown in the Contractors tab. */
    public const MANUAL_STATUSES = [self::RECEIVED, self::AWAITING, self::NOT_QUOTING];

    protected $fillable = [
        'quotation_id', 'contractor_id', 'token', 'status', 'sent_at', 'opened_at', 'responded_at',
        'reminded_at', 'auto_reminded_at', 'quote_name', 'quote_path', 'quote_size', 'message',
    ];

    protected function casts(): array
    {
        return [
            'sent_at' => 'datetime',
            'opened_at' => 'datetime',
            'responded_at' => 'datetime',
            'reminded_at' => 'datetime',
            'auto_reminded_at' => 'datetime',
        ];
    }

    public function quotation(): BelongsTo
    {
        return $this->belongsTo(Quotation::class);
    }

    public function contractor(): BelongsTo
    {
        return $this->belongsTo(Contractor::class);
    }

    public function hasResponded(): bool
    {
        return $this->status !== self::AWAITING;
    }

    public function uploadUrl(): string
    {
        return rtrim(config('app.frontend_url'), '/').'/quote/'.$this->token;
    }
}
