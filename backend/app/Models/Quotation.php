<?php

namespace App\Models;

use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Quotation extends Model
{
    use HasFactory;

    public const DRAFT = 'draft';

    public const SENT = 'sent';

    /** Days before the due date that automatic reminders can be set to. */
    public const REMINDER_OPTIONS = [1, 2, 3, 5, 7];

    protected $fillable = [
        'lot_id', 'contractor_category_id', 'due_date', 'reminder_days', 'notes',
        'status', 'email_subject', 'email_body', 'created_by', 'sent_at',
    ];

    protected function casts(): array
    {
        return [
            'due_date' => 'immutable_date',
            'sent_at' => 'immutable_datetime',
            'reminder_days' => 'integer',
        ];
    }

    protected static function booted(): void
    {
        // Quote numbers follow the record id: Q-0001, Q-0002, …
        static::created(function (Quotation $quotation) {
            $quotation->forceFill(['quote_no' => sprintf('Q-%04d', $quotation->id)])->saveQuietly();
        });
    }

    public function lot(): BelongsTo
    {
        return $this->belongsTo(Lot::class);
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(ContractorCategory::class, 'contractor_category_id');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function documents(): HasMany
    {
        return $this->hasMany(QuotationDocument::class)->orderBy('id');
    }

    public function recipients(): HasMany
    {
        return $this->hasMany(QuotationContractor::class)->orderBy('id');
    }

    public function notes(): HasMany
    {
        return $this->hasMany(QuotationNote::class)->latest('id');
    }

    public function activities(): HasMany
    {
        return $this->hasMany(QuotationActivity::class)->latest('id');
    }

    public function isDraft(): bool
    {
        return $this->status === self::DRAFT;
    }

    /**
     * Overall status shown in the list and drawer, derived from each contractor's response:
     *  - Draft: not sent yet
     *  - Not Quoting: every contractor declined
     *  - Received: everyone has responded, or the due date has passed and at least one quote is in
     *  - Overdue: the due date has passed and no quote has come in
     *  - Awaiting: otherwise
     *
     * @return array{key: string, label: string, overdue_days: int|null}
     */
    public function displayStatus(?CarbonImmutable $today = null): array
    {
        if ($this->isDraft()) {
            return ['key' => 'draft', 'label' => 'Draft', 'overdue_days' => null];
        }

        $recipients = $this->recipients;
        $total = $recipients->count();
        $received = $recipients->where('status', QuotationContractor::RECEIVED)->count();
        $declined = $recipients->where('status', QuotationContractor::NOT_QUOTING)->count();
        $awaiting = $total - $received - $declined;

        if ($total > 0 && $declined === $total) {
            return ['key' => 'not_quoting', 'label' => 'Not Quoting', 'overdue_days' => null];
        }
        if ($total > 0 && $awaiting === 0) {
            return ['key' => 'received', 'label' => 'Received', 'overdue_days' => null];
        }

        $today ??= CarbonImmutable::today();
        if ($this->due_date && $this->due_date->lt($today)) {
            if ($received > 0) {
                return ['key' => 'received', 'label' => 'Received', 'overdue_days' => null];
            }

            return ['key' => 'overdue', 'label' => 'Overdue', 'overdue_days' => (int) $this->due_date->diffInDays($today)];
        }

        return ['key' => 'awaiting', 'label' => 'Awaiting', 'overdue_days' => null];
    }
}
