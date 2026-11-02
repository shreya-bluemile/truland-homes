<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Support\Str;

class QuotationContractor extends Model
{
    public const AWAITING = 'awaiting';

    public const RECEIVED = 'received';

    public const NOT_QUOTING = 'not_quoting';

    public const STATUSES = [self::AWAITING, self::RECEIVED, self::NOT_QUOTING];

    public const SOURCE_PORTAL = 'portal'; // uploaded through the link → shown as "Quoted"

    public const SOURCE_EMAIL = 'email';   // marked by staff → shown as "Replied by email"

    /** How long after the due date the upload link keeps working. */
    public const LINK_GRACE_DAYS = 14;

    protected $fillable = [
        'quotation_id', 'contractor_id', 'token', 'status', 'response_source',
        'sent_at', 'opened_at', 'responded_at', 'last_reminded_at', 'auto_reminded_at', 'reminder_count',
    ];

    protected $hidden = ['token'];

    protected function casts(): array
    {
        return [
            'sent_at' => 'immutable_datetime',
            'opened_at' => 'immutable_datetime',
            'responded_at' => 'immutable_datetime',
            'last_reminded_at' => 'immutable_datetime',
            'auto_reminded_at' => 'immutable_datetime',
        ];
    }

    protected static function booted(): void
    {
        static::creating(function (QuotationContractor $recipient) {
            $recipient->token ??= Str::random(48);
        });
    }

    public function quotation(): BelongsTo
    {
        return $this->belongsTo(Quotation::class);
    }

    public function contractor(): BelongsTo
    {
        return $this->belongsTo(Contractor::class)->withTrashed();
    }

    public function submissions(): HasMany
    {
        return $this->hasMany(ContractorSubmission::class)->latest('id');
    }

    public function latestSubmission(): HasOne
    {
        return $this->hasOne(ContractorSubmission::class)->latestOfMany();
    }

    public function uploadUrl(): string
    {
        return rtrim(config('app.frontend_url'), '/').'/quote/'.$this->token;
    }

    public function linkExpired(): bool
    {
        $due = $this->quotation->due_date;

        return $due !== null && $due->addDays(self::LINK_GRACE_DAYS)->endOfDay()->isPast();
    }

    /** Label shown in the Contractors tab. */
    public function statusLabel(): string
    {
        return match (true) {
            $this->status === self::RECEIVED && $this->response_source === self::SOURCE_PORTAL => 'Quoted',
            $this->status === self::RECEIVED => 'Replied by email',
            $this->status === self::NOT_QUOTING => 'Not Quoting',
            default => 'Awaiting',
        };
    }
}
