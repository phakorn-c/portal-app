<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('document_extractions', function (Blueprint $table) {
            $table->id();
            // One current extraction per attachment; unique FK, removed with it.
            $table->foreignId('announcement_attachment_id')->unique()->constrained()->cascadeOnDelete();
            // enum -> inline CHECK constraint on SQLite + PostgreSQL grammars.
            $table->enum('status', ['pending', 'processing', 'review', 'failed', 'approved'])->default('pending');
            $table->enum('method', ['fake_embedded_text', 'fake_ocr_placeholder', 'fake_unknown', 'portal-ocr'])->nullable();
            $table->json('candidate')->nullable();
            $table->json('confidence')->nullable();
            $table->json('warnings')->nullable();
            $table->text('raw_text')->nullable();
            $table->text('error_message')->nullable();
            $table->unsignedInteger('attempt_count')->default(0);
            $table->uuid('processing_token')->nullable();
            $table->timestamp('processing_started_at')->nullable();
            $table->timestamp('processed_at')->nullable();
            $table->timestamp('approved_at')->nullable();
            $table->foreignId('approved_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('document_extractions');
    }
};
