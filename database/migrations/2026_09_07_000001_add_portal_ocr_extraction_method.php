<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    private const LEGACY_METHODS = [
        'fake_embedded_text',
        'fake_ocr_placeholder',
        'fake_unknown',
    ];

    private const METHODS = [
        ...self::LEGACY_METHODS,
        'portal-ocr',
    ];

    public function up(): void
    {
        $this->replaceMethodConstraint(self::METHODS);
    }

    public function down(): void
    {
        DB::table('document_extractions')->where('method', 'portal-ocr')->update(['method' => null]);
        $this->replaceMethodConstraint(self::LEGACY_METHODS);
    }

    private function replaceMethodConstraint(array $methods): void
    {
        match (DB::getDriverName()) {
            'pgsql' => $this->replacePostgresConstraint($methods),
            'sqlite' => $this->rebuildSqliteTable($methods),
            default => throw new RuntimeException('Unsupported database driver for extraction method migration.'),
        };
    }

    private function replacePostgresConstraint(array $methods): void
    {
        $values = implode(', ', array_map(
            fn (string $method): string => DB::getPdo()->quote($method),
            $methods,
        ));

        DB::statement('ALTER TABLE document_extractions DROP CONSTRAINT document_extractions_method_check');
        DB::statement("ALTER TABLE document_extractions ADD CONSTRAINT document_extractions_method_check CHECK (method IN ({$values}))");
    }

    private function rebuildSqliteTable(array $methods): void
    {
        Schema::disableForeignKeyConstraints();

        try {
            DB::statement('DROP INDEX IF EXISTS document_extractions_announcement_attachment_id_unique');
            DB::statement('DROP INDEX IF EXISTS document_extractions_rebuild_announcement_attachment_id_unique');

            Schema::create('document_extractions_rebuild', function (Blueprint $table) use ($methods): void {
                $table->id();
                $table->foreignId('announcement_attachment_id')->unique()->constrained()->cascadeOnDelete();
                $table->enum('status', ['pending', 'processing', 'review', 'failed', 'approved'])->default('pending');
                $table->enum('method', $methods)->nullable();
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

            DB::statement('INSERT INTO document_extractions_rebuild SELECT * FROM document_extractions');
            Schema::drop('document_extractions');
            Schema::rename('document_extractions_rebuild', 'document_extractions');
        } finally {
            Schema::enableForeignKeyConstraints();
        }
    }
};
