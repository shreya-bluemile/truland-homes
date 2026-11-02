<?php

namespace App\Console\Commands;

use App\Models\Quotation;
use App\Models\QuotationContractor;
use App\Services\QuotationService;
use Illuminate\Console\Command;
use Throwable;

/**
 * Sends the automatic "N days before the due date" reminder to contractors who haven't responded.
 * Scheduled daily (routes/console.php); each contractor gets at most one automatic reminder.
 */
class SendQuotationReminders extends Command
{
    protected $signature = 'quotations:send-reminders';

    protected $description = 'Email automatic reminders to contractors who have not responded to a quotation';

    public function handle(QuotationService $service): int
    {
        $today = today();
        $sent = 0;

        $recipients = QuotationContractor::query()
            ->with(['contractor', 'quotation.lot', 'quotation.category'])
            ->where('status', QuotationContractor::AWAITING)
            ->whereNull('auto_reminded_at')
            ->whereHas('quotation', fn ($q) => $q
                ->where('status', Quotation::SENT)
                ->whereNotNull('reminder_days')
                ->whereDate('due_date', '>=', $today))
            ->get()
            ->filter(fn (QuotationContractor $r) => $r->quotation->due_date->subDays($r->quotation->reminder_days)->lte($today));

        foreach ($recipients as $recipient) {
            try {
                $service->remind($recipient, null);
                $sent++;
            } catch (Throwable $e) {
                report($e);
                $this->error("Could not remind {$recipient->contractor->email}: {$e->getMessage()}");
            }
        }

        $this->info("Sent {$sent} automatic ".str('reminder')->plural($sent).'.');

        return self::SUCCESS;
    }
}
