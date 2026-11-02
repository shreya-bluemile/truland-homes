<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('quotations', function (Blueprint $table) {
            $table->id();
            $table->string('quote_no', 20)->nullable()->unique();
            $table->foreignId('lot_id')->constrained()->restrictOnDelete();
            $table->foreignId('contractor_category_id')->nullable()->constrained()->restrictOnDelete();
            $table->date('due_date')->nullable();
            $table->unsignedTinyInteger('reminder_days')->nullable();
            $table->text('notes')->nullable();
            $table->string('status', 20)->default('draft'); // draft | sent
            // Snapshot of the email as sent, shown in the Details tab.
            $table->string('email_subject', 255)->nullable();
            $table->longText('email_body')->nullable();
            $table->foreignId('created_by')->constrained('users')->restrictOnDelete();
            $table->timestamp('sent_at')->nullable();
            $table->timestamps();

            $table->index(['status', 'created_at']);
            $table->index('due_date');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('quotations');
    }
};
