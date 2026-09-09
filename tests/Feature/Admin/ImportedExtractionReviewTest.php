<?php

use App\Models\Announcement;
use App\Models\DocumentExtraction;
use App\Models\User;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;

use function Pest\Laravel\actingAs;
use function Pest\Laravel\artisan;
use function Pest\Laravel\get;
use function Pest\Laravel\putJson;

test('an imported portal ocr extraction is reviewable and approval keeps its announcement draft', function () {
    Storage::fake('local');
    $admin = User::factory()->admin()->create();
    $importPath = base_path('tests/Fixtures/Procurement/portal-import-round-trip/portal_import.json');

    artisan('portal:import', ['path' => $importPath])
        ->expectsOutput('Import complete: imported=1 skipped=0 errors=0')
        ->assertSuccessful();

    $announcement = Announcement::query()->sole();
    $extraction = DocumentExtraction::query()->sole();

    actingAs($admin);
    get('/admin')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('admin/dashboard', false)
            ->where('announcements.data.0.id', $announcement->id)
            ->where('announcements.data.0.attachments.0.extraction.id', $extraction->id)
            ->where('announcements.data.0.attachments.0.extraction.status', 'review'));

    $reviewUrl = "/admin/announcements/{$announcement->id}/extractions/{$extraction->id}";

    get($reviewUrl)
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('admin/extraction-review', false)
            ->where('announcement.publication_status', 'draft')
            ->where('extraction.method', 'portal-ocr')
            ->where('extraction.candidate.title', $extraction->candidate['title'])
            ->where('extraction.raw_text', $extraction->raw_text));

    $corrected = [
        ...$extraction->candidate,
        'title' => 'ประกวดราคาจ้างปรับปรุงระบบระบายน้ำ ฉบับตรวจแก้',
        'contact_name' => 'กองคลัง งานพัสดุ (ตรวจสอบแล้ว)',
    ];

    putJson("{$reviewUrl}/approve", $corrected)
        ->assertRedirect($reviewUrl);

    expect($announcement->fresh()->title)->toBe($corrected['title'])
        ->and($announcement->fresh()->contact_name)->toBe($corrected['contact_name'])
        ->and($announcement->fresh()->publication_status)->toBe('draft')
        ->and($announcement->fresh()->published_at)->toBeNull()
        ->and($extraction->fresh()->status)->toBe('approved')
        ->and($extraction->fresh()->approved_by)->toBe($admin->id);
});
