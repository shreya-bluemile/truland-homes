<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('contractors', function (Blueprint $table) {
            $table->id();
            $table->foreignId('contractor_category_id')->constrained()->restrictOnDelete();
            $table->string('name', 150);
            $table->string('email', 190);
            $table->string('phone', 30)->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->softDeletes();

            $table->index(['contractor_category_id', 'is_active']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('contractors');
    }
};
