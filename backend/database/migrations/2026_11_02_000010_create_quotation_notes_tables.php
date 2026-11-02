<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('quotation_notes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('quotation_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->restrictOnDelete();
            $table->text('body');
            $table->timestamps();
        });

        Schema::create('quotation_note_attachments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('quotation_note_id')->constrained()->cascadeOnDelete();
            $table->string('name', 255);
            $table->string('path', 500);
            $table->unsignedBigInteger('size');
            $table->string('mime_type', 150)->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('quotation_note_attachments');
        Schema::dropIfExists('quotation_notes');
    }
};
