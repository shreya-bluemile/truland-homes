<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

// One row per contractor a quotation is sent to: their private upload link and response.
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('quotation_contractors', function (Blueprint $table) {
            $table->id();
            $table->foreignId('quotation_id')->constrained()->cascadeOnDelete();
            $table->foreignId('contractor_id')->constrained()->restrictOnDelete();
            $table->string('token', 64)->unique();
            $table->string('status', 20)->default('awaiting'); // awaiting | received | not_quoting
            $table->string('response_source', 10)->nullable(); // portal | email
            $table->timestamp('sent_at')->nullable();
            $table->timestamp('opened_at')->nullable();
            $table->timestamp('responded_at')->nullable();
            $table->timestamp('last_reminded_at')->nullable();
            $table->timestamp('auto_reminded_at')->nullable();
            $table->unsignedSmallInteger('reminder_count')->default(0);
            $table->timestamps();

            $table->unique(['quotation_id', 'contractor_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('quotation_contractors');
    }
};
