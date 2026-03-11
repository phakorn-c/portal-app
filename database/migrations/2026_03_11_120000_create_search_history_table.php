<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('search_history', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->json('criteria');
            $table->unsignedInteger('result_count');
            $table->timestamp('searched_at');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('search_history');
    }
};
