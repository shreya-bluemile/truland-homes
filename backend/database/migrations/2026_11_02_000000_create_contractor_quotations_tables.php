<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('lots', function (Blueprint $table) {
            $table->id();
            $table->string('lot_number');      // "Lot 14"
            $table->string('street');          // "22 Harbour View Road"
            $table->string('suburb')->nullable();
            $table->string('floor_plan')->nullable();
            $table->timestamps();
        });

        // Plans and reports that belong to a lot (site plan, soil report...). Attached to every quotation for the lot.
        Schema::create('lot_documents', function (Blueprint $table) {
            $table->id();
            $table->foreignId('lot_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->string('path');
            $table->unsignedBigInteger('size')->default(0);
            $table->timestamps();
        });

        Schema::create('contractor_categories', function (Blueprint $table) {
            $table->id();
            $table->string('name')->unique();
            $table->timestamps();
        });

        // Template documents for a trade (specification, pricing schedule...), shown with a "Template" badge.
        Schema::create('category_documents', function (Blueprint $table) {
            $table->id();
            $table->foreignId('contractor_category_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->string('path');
            $table->unsignedBigInteger('size')->default(0);
            $table->timestamps();
        });

        Schema::create('contractors', function (Blueprint $table) {
            $table->id();
            $table->foreignId('contractor_category_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->string('email');
            $table->timestamps();
        });

        Schema::create('quotations', function (Blueprint $table) {
            $table->id();
            $table->string('number')->unique();            // "Q-0148"
            $table->foreignId('lot_id')->constrained();
            $table->foreignId('contractor_category_id')->constrained();
            $table->foreignId('created_by')->constrained('users');
            $table->date('due_date')->nullable();
            $table->unsignedTinyInteger('reminder_days')->nullable(); // null = reminders are sent by hand
            $table->string('status')->default('draft');    // draft | sent
            $table->timestamp('sent_at')->nullable();
            $table->timestamps();
        });

        Schema::create('quotation_documents', function (Blueprint $table) {
            $table->id();
            $table->foreignId('quotation_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->string('path');
            $table->unsignedBigInteger('size')->default(0);
            $table->string('source')->default('upload'); // lot | template | upload
            $table->timestamps();
        });

        // One row per contractor the quotation is sent to, with their secure upload link and response.
        Schema::create('quotation_recipients', function (Blueprint $table) {
            $table->id();
            $table->foreignId('quotation_id')->constrained()->cascadeOnDelete();
            $table->foreignId('contractor_id')->constrained();
            $table->string('token', 64)->unique();
            $table->string('status')->default('awaiting'); // awaiting | quoted | received | not_quoting
            $table->timestamp('sent_at')->nullable();
            $table->timestamp('opened_at')->nullable();
            $table->timestamp('responded_at')->nullable();
            $table->timestamp('reminded_at')->nullable();
            $table->timestamp('auto_reminded_at')->nullable();
            $table->string('quote_name')->nullable();
            $table->string('quote_path')->nullable();
            $table->unsignedBigInteger('quote_size')->nullable();
            $table->text('message')->nullable();
            $table->timestamps();
            $table->unique(['quotation_id', 'contractor_id']);
        });

        Schema::create('quotation_notes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('quotation_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained();
            $table->text('body');
            $table->timestamps();
        });

        Schema::create('quotation_note_attachments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('quotation_note_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->string('path');
            $table->unsignedBigInteger('size')->default(0);
            $table->timestamps();
        });

        Schema::create('quotation_activities', function (Blueprint $table) {
            $table->id();
            $table->foreignId('quotation_id')->constrained()->cascadeOnDelete();
            $table->string('actor_name');
            $table->string('description');
            $table->timestamp('created_at')->nullable();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('quotation_activities');
        Schema::dropIfExists('quotation_note_attachments');
        Schema::dropIfExists('quotation_notes');
        Schema::dropIfExists('quotation_recipients');
        Schema::dropIfExists('quotation_documents');
        Schema::dropIfExists('quotations');
        Schema::dropIfExists('contractors');
        Schema::dropIfExists('category_documents');
        Schema::dropIfExists('contractor_categories');
        Schema::dropIfExists('lot_documents');
        Schema::dropIfExists('lots');
    }
};
