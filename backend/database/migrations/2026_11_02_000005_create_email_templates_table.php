<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('email_templates', function (Blueprint $table) {
            $table->id();
            // Set for templates the system sends itself (e.g. "quotation_request"); null for others.
            $table->string('key', 60)->nullable()->unique();
            $table->string('name', 150);
            $table->string('description', 255)->nullable();
            $table->string('subject', 255);
            $table->longText('body');
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('email_templates');
    }
};
