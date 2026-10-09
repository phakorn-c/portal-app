<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (DB::getDriverName() === 'pgsql') {
            DB::statement('ALTER TABLE announcements ALTER COLUMN status DROP NOT NULL');
        } else {
            Schema::table('announcements', function (Blueprint $table) {
                $table->enum('status', ['open', 'urgent', 'closing', 'closed'])->nullable()->change();
            });
        }

        Schema::table('announcements', function (Blueprint $table) {
            $table->decimal('budget', 15, 2)->nullable()->change();
            $table->date('deadline')->nullable()->change();
            $table->string('source_document_key', 64)->nullable()->unique();
            $table->string('project_key')->nullable();
            $table->string('project_no')->nullable();
            $table->string('notice_type')->nullable();
            $table->string('procurement_category')->nullable();
            $table->json('tags')->nullable();
            $table->decimal('display_price', 15, 2)->nullable();
            $table->string('display_price_source')->nullable();
            $table->string('province')->nullable();
            $table->string('district')->nullable();
            $table->string('subdistrict')->nullable();
            $table->string('location_source')->nullable();
            $table->text('contact_website')->nullable();
            $table->string('announcer_name')->nullable();
            $table->string('announcer_position')->nullable();
            $table->text('winner_name')->nullable();
            $table->decimal('winning_price', 15, 2)->nullable();
            $table->json('bidders')->nullable();
            $table->date('announced_at')->nullable();
            $table->date('submission_deadline')->nullable();
            $table->date('award_announced_at')->nullable();
            $table->string('process_status')->nullable();
            $table->string('source_id')->nullable();
        });

        Schema::table('announcement_attachments', function (Blueprint $table) {
            $table->dropUnique(['sha256']);
            $table->index('sha256');
        });
    }

    public function down(): void
    {
        Schema::table('announcement_attachments', function (Blueprint $table) {
            $table->dropIndex(['sha256']);
            $table->unique('sha256');
        });

        Schema::table('announcements', function (Blueprint $table) {
            $table->dropUnique(['source_document_key']);
            $table->dropColumn([
                'source_document_key', 'project_key', 'project_no', 'notice_type',
                'procurement_category', 'tags', 'display_price', 'display_price_source',
                'province', 'district', 'subdistrict', 'location_source',
                'contact_website', 'announcer_name', 'announcer_position',
                'winner_name', 'winning_price', 'bidders', 'announced_at',
                'submission_deadline', 'award_announced_at', 'process_status', 'source_id',
            ]);
            $table->decimal('budget', 15, 2)->nullable(false)->change();
            $table->date('deadline')->nullable(false)->change();
        });

        if (DB::getDriverName() === 'pgsql') {
            DB::statement('ALTER TABLE announcements ALTER COLUMN status SET NOT NULL');
        } else {
            Schema::table('announcements', function (Blueprint $table) {
                $table->enum('status', ['open', 'urgent', 'closing', 'closed'])->nullable(false)->change();
            });
        }
    }
};
