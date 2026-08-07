<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('announcement_attachments', function (Blueprint $table) {
            $table->string('sha256', 64)->nullable()->unique();
            // enum compiles to an inline CHECK constraint on both the SQLite
            // and PostgreSQL grammars, so out-of-set kinds are rejected by
            // the database on either driver.
            $table->enum('document_kind', ['unknown', 'text_pdf', 'scanned_pdf'])->default('unknown');
        });
    }

    public function down(): void
    {
        Schema::table('announcement_attachments', function (Blueprint $table) {
            $table->dropUnique(['sha256']);
            $table->dropColumn(['sha256', 'document_kind']);
        });
    }
};
