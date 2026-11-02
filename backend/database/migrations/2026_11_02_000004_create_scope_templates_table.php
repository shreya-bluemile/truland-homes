<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

// Scope-of-work documents that are auto-loaded into a new quotation for their category.
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('scope_templates', function (Blueprint $table) {
            $table->id();
            $table->foreignId('contractor_category_id')->constrained()->cascadeOnDelete();
            $table->string('name', 255);
            $table->string('path', 500);
            $table->unsignedBigInteger('size');
            $table->string('mime_type', 150)->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('scope_templates');
    }
};
