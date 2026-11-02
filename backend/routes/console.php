<?php

use Illuminate\Support\Facades\Schedule;

// Requires the Laravel scheduler to run every minute on the server:
//   * * * * * cd /path/to/backend && php artisan schedule:run >> /dev/null 2>&1
Schedule::command('quotations:send-reminders')->dailyAt('08:00');
