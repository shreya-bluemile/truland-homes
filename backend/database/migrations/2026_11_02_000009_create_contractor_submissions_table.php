<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

// Quotation files uploaded by contractors through their link.
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('contractor_submissions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('quotation_contractor_id')->constrained()->cascadeOnDelete();
            $table->string('original_name', 255);
            $table->string('path', 500);
            $table->unsignedBigInteger('size');
            $table->string('mime_type', 150)->nullable();
            $table->text('message')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('contractor_submissions');
    }
};
