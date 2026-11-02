<?php

use App\Mail\QuotationRequestMail;
use App\Models\Quotation;
use App\Models\QuotationRecipient;
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Automatic reminders: emails contractors who haven't responded, N days before the due date
// (as chosen in the quotation's Reminder field). Each contractor gets one automatic reminder.
Artisan::command('quotations:send-reminders', function () {
    $sent = 0;
    $quotations = Quotation::with('recipients.contractor')
        ->where('status', Quotation::SENT)
        ->whereNotNull('reminder_days')
        ->whereDate('due_date', '>=', Carbon::today())
        ->get();

    foreach ($quotations as $quotation) {
        if (Carbon::today()->lt($quotation->due_date->copy()->subDays($quotation->reminder_days))) {
            continue;
        }
        foreach ($quotation->recipients as $recipient) {
            if ($recipient->status !== QuotationRecipient::AWAITING || $recipient->auto_reminded_at) {
                continue;
            }
            Mail::to($recipient->contractor->email)->send(new QuotationRequestMail($recipient, reminder: true));
            $recipient->update(['auto_reminded_at' => now(), 'reminded_at' => now()]);
            $quotation->log('System', "Automatic reminder sent to {$recipient->contractor->name}.");
            $sent++;
        }
    }

    $this->info("Sent {$sent} reminder(s).");
})->purpose('Email automatic reminders to contractors who have not responded');

Schedule::command('quotations:send-reminders')->dailyAt('08:00');
