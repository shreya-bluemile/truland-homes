<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Carbon;

class Quotation extends Model
{
    public const DRAFT = 'draft';
    public const SENT = 'sent';

    protected $fillable = [
        'number', 'lot_id', 'contractor_category_id', 'created_by', 'due_date', 'reminder_days', 'status', 'sent_at',
    ];

    protected function casts(): array
    {
        return ['due_date' => 'date', 'sent_at' => 'datetime', 'reminder_days' => 'integer'];
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
        return $this->hasMany(QuotationDocument::class);
    }

    public function recipients(): HasMany
    {
        return $this->hasMany(QuotationRecipient::class);
    }

    public function notes(): HasMany
    {
        return $this->hasMany(QuotationNote::class);
    }

    public function activities(): HasMany
    {
        return $this->hasMany(QuotationActivity::class);
    }

    /** Next number in the Q-0001 sequence. */
    public static function nextNumber(): string
    {
        $last = static::query()->pluck('number')
            ->map(fn ($number) => (int) preg_replace('/\D/', '', $number))
            ->max() ?? 0;

        return sprintf('Q-%04d', $last + 1);
    }

    /** The reference contractors see ("CQ-0148"). */
    public function contractorReference(): string
    {
        return 'C'.$this->number;
    }

    public function emailSubject(): string
    {
        return "Quotation Request {$this->number} – {$this->category->name} – {$this->lot->lot_number}";
    }

    public function log(string $actorName, string $description): void
    {
        $this->activities()->create(['actor_name' => $actorName, 'description' => $description]);
    }

    /**
     * Overall status shown in the list and the drawer header:
     * draft, awaiting, overdue (past the due date and someone hasn't responded),
     * received (everyone has responded and at least one quote came in) or not_quoting.
     *
     * @return array{status: string, overdue_days: int|null}
     */
    public function overallStatus(): array
    {
        if ($this->status === self::DRAFT) {
            return ['status' => 'draft', 'overdue_days' => null];
        }

        $recipients = $this->recipients;
        if ($recipients->contains(fn ($r) => ! $r->hasResponded())) {
            $today = Carbon::today();
            if ($this->due_date && $this->due_date->lt($today)) {
                return ['status' => 'overdue', 'overdue_days' => (int) $this->due_date->diffInDays($today)];
            }

            return ['status' => 'awaiting', 'overdue_days' => null];
        }

        $anyQuote = $recipients->contains(
            fn ($r) => in_array($r->status, [QuotationRecipient::QUOTED, QuotationRecipient::RECEIVED], true)
        );

        return ['status' => $anyQuote ? 'received' : 'not_quoting', 'overdue_days' => null];
    }
}
