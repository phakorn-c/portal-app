<?php

use App\Models\Announcement;
use App\Models\AnnouncementAttachment;
use Illuminate\Database\Events\QueryExecuted;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

use function Pest\Laravel\artisan;

const RECONCILIATION_ROOT = 'attachments/managed';

beforeEach(function () {
    Storage::fake('local');
});

test('reconciliation defaults to dry run and lists only aged managed orphans', function () {
    $referenced = RECONCILIATION_ROOT.'/referenced.pdf';
    $orphan = RECONCILIATION_ROOT.'/orphan.pdf';
    $uploading = RECONCILIATION_ROOT.'/abandoned.pdf.uploading';
    $fresh = RECONCILIATION_ROOT.'/in-flight.pdf.uploading';
    $ignored = RECONCILIATION_ROOT.'/notes.txt';
    $legacy = 'attachments/demo-smart-traffic-tor.pdf';

    putReconciliationFile($referenced, 25);
    putReconciliationFile($orphan, 25);
    putReconciliationFile($uploading, 25);
    putReconciliationFile($fresh, 1);
    putReconciliationFile($ignored, 25);
    putReconciliationFile($legacy, 25);
    AnnouncementAttachment::factory()->create(['stored_filename' => $referenced]);

    artisan('procurement:reconcile-attachments')
        ->expectsOutputToContain("DRY-RUN {$orphan}")
        ->expectsOutputToContain("DRY-RUN {$uploading}")
        ->assertSuccessful();

    foreach ([$referenced, $orphan, $uploading, $fresh, $ignored, $legacy] as $key) {
        expect(Storage::disk('local')->exists($key))->toBeTrue();
    }
});

test('delete mode removes only aged unreferenced regular managed files', function () {
    $orphan = RECONCILIATION_ROOT.'/orphan.pdf';
    $uploading = RECONCILIATION_ROOT.'/abandoned.pdf.uploading';
    $referenced = RECONCILIATION_ROOT.'/referenced.pdf';
    $fresh = RECONCILIATION_ROOT.'/young.pdf.uploading';
    $ignored = RECONCILIATION_ROOT.'/ignored.bin';
    $legacy = 'attachments/demo-smart-traffic-tor.pdf';

    foreach ([$orphan, $uploading, $referenced, $ignored, $legacy] as $key) {
        putReconciliationFile($key, 25);
    }
    putReconciliationFile($fresh, 1);
    AnnouncementAttachment::factory()->create(['stored_filename' => $referenced]);

    artisan('procurement:reconcile-attachments', ['--delete' => true])
        ->expectsOutputToContain("DELETED {$orphan}")
        ->expectsOutputToContain("DELETED {$uploading}")
        ->assertSuccessful();

    expect(Storage::disk('local')->exists($orphan))->toBeFalse()
        ->and(Storage::disk('local')->exists($uploading))->toBeFalse();
    foreach ([$referenced, $fresh, $ignored, $legacy] as $key) {
        expect(Storage::disk('local')->exists($key))->toBeTrue();
    }
});

test('reconciliation rejects ages lower than twenty four hours', function () {
    $orphan = RECONCILIATION_ROOT.'/too-young-policy.pdf';
    putReconciliationFile($orphan, 25);

    artisan('procurement:reconcile-attachments', ['--age' => 23, '--delete' => true])
        ->expectsOutputToContain('at least 24 hours')
        ->assertFailed();

    expect(Storage::disk('local')->exists($orphan))->toBeTrue();
});

test('an in flight upload survives when the shared storage lock is held', function () {
    $uploading = RECONCILIATION_ROOT.'/in-flight.pdf.uploading';
    putReconciliationFile($uploading, 1);
    $lock = Cache::lock('procurement:attachment-storage', 60);
    expect($lock->get())->toBeTrue();

    try {
        artisan('procurement:reconcile-attachments', ['--delete' => true])
            ->expectsOutputToContain('attachment storage lock is held')
            ->assertFailed();
    } finally {
        $lock->release();
    }

    expect(Storage::disk('local')->exists($uploading))->toBeTrue();
});

test('delete mode rechecks mtime immediately before deleting', function () {
    $orphan = RECONCILIATION_ROOT.'/mtime-race.pdf';
    putReconciliationFile($orphan, 25);
    $changed = false;

    DB::listen(function (QueryExecuted $query) use (&$changed, $orphan): void {
        if ($changed || ! str_contains($query->sql, 'announcement_attachments')) {
            return;
        }

        $changed = true;
        touch(Storage::disk('local')->path($orphan), now()->timestamp);
    });

    artisan('procurement:reconcile-attachments', ['--delete' => true])
        ->expectsOutputToContain("WARNING changed before deletion: {$orphan}")
        ->assertSuccessful();

    expect($changed)->toBeTrue()
        ->and(Storage::disk('local')->exists($orphan))->toBeTrue();
});

test('delete mode rechecks database references immediately before deleting', function () {
    $orphan = RECONCILIATION_ROOT.'/reference-race.pdf';
    putReconciliationFile($orphan, 25);
    $announcement = Announcement::factory()->create();
    $inserted = false;

    DB::listen(function (QueryExecuted $query) use (&$inserted, $announcement, $orphan): void {
        if ($inserted || ! str_contains($query->sql, 'announcement_attachments')) {
            return;
        }

        $inserted = true;
        $statement = DB::connection()->getPdo()->prepare(
            'insert into announcement_attachments '
            .'(announcement_id, filename, stored_filename, file_size, mime_type, document_kind, created_at, updated_at) '
            .'values (?, ?, ?, ?, ?, ?, ?, ?)'
        );
        $timestamp = now()->format('Y-m-d H:i:s');
        $statement->execute([
            $announcement->id,
            'reference-race.pdf',
            $orphan,
            1024,
            'application/pdf',
            'unknown',
            $timestamp,
            $timestamp,
        ]);
    });

    artisan('procurement:reconcile-attachments', ['--delete' => true])
        ->expectsOutputToContain("WARNING referenced before deletion: {$orphan}")
        ->assertSuccessful();

    expect($inserted)->toBeTrue()
        ->and(Storage::disk('local')->exists($orphan))->toBeTrue()
        ->and(AnnouncementAttachment::query()->where('stored_filename', $orphan)->exists())->toBeTrue();
});

test('reconciliation warns about symlink entries without following them', function () {
    $target = 'outside/symlink-target.pdf';
    $link = RECONCILIATION_ROOT.'/linked.pdf';
    putReconciliationFile($target, 25);
    Storage::disk('local')->makeDirectory(RECONCILIATION_ROOT);
    symlink(Storage::disk('local')->path($target), Storage::disk('local')->path($link));

    artisan('procurement:reconcile-attachments', ['--delete' => true])
        ->expectsOutputToContain("WARNING symlink skipped: {$link}")
        ->assertSuccessful();

    expect(is_link(Storage::disk('local')->path($link)))->toBeTrue()
        ->and(Storage::disk('local')->exists($target))->toBeTrue();
});

test('reconciliation refuses a symlinked managed root', function () {
    $outside = 'outside-root';
    $target = $outside.'/guarded.pdf';
    Storage::disk('local')->makeDirectory(RECONCILIATION_ROOT);
    putReconciliationFile($target, 25);
    rmdir(Storage::disk('local')->path(RECONCILIATION_ROOT));
    symlink(Storage::disk('local')->path($outside), Storage::disk('local')->path(RECONCILIATION_ROOT));

    artisan('procurement:reconcile-attachments', ['--delete' => true])
        ->expectsOutputToContain('managed root must be a regular directory')
        ->assertFailed();

    expect(Storage::disk('local')->exists($target))->toBeTrue();
});

function putReconciliationFile(string $key, int $ageHours): void
{
    Storage::disk('local')->put($key, 'reconciliation-content');
    touch(Storage::disk('local')->path($key), now()->subHours($ageHours)->timestamp);
}
