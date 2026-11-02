<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('quotation_documents', function (Blueprint $table) {
            $table->id();
            $table->foreignId('quotation_id')->constrained()->cascadeOnDelete();
            // Set when the document was copied from a category's scope template.
            $table->foreignId('scope_template_id')->nullable()->constrained()->nullOnDelete();
            $table->string('name', 255);
            $table->string('path', 500);
            $table->unsignedBigInteger('size');
            $table->string('mime_type', 150)->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('quotation_documents');
    }
};
