<?php

use App\Jobs\ProcessDocumentExtraction;
use App\Models\AnnouncementAttachment;
use App\Models\DocumentExtraction;
use App\Models\User;
use App\Support\Procurement\Extraction\DocumentExtractor;
use App\Support\Procurement\Extraction\ExtractionRequest;
use App\Support\Procurement\Extraction\ExtractionResult;
use Illuminate\Contracts\Bus\Dispatcher;
use Illuminate\Contracts\Queue\ShouldBeUnique;
use Illuminate\Contracts\Queue\ShouldBeUniqueUntilProcessing;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Date;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\Str;

use function Pest\Laravel\assertDatabaseCount;

function extractionForJob(string $filename = 'kku-text-demo.pdf', array $attributes = []): DocumentExtraction
{
    $attachment = AnnouncementAttachment::factory()->create([
        'filename' => $filename,
        'document_kind' => $attributes['document_kind'] ?? 'unknown',
    ]);

    unset($attributes['document_kind']);

    return DocumentExtraction::factory()->create([
        'announcement_attachment_id' => $attachment->id,
        ...$attributes,
    ]);
}

function runExtractionJob(DocumentExtraction $extraction, ?int $expectedAttempt = null, ?string $token = null): string
{
    $invocationToken = $token ?? Str::uuid()->toString();
    $job = new ProcessDocumentExtraction(
        $extraction->id,
        $expectedAttempt ?? $extraction->attempt_count + 1,
        $invocationToken,
    );

    $job->handle(app(DocumentExtractor::class));

    return $invocationToken;
}

beforeEach(function () {
    Cache::flush();
});

afterEach(function () {
    Date::setTestNow();
});

test('job exposes the exact unique queue configuration without automatic retry', function () {
    $token = Str::uuid()->toString();
    $job = new ProcessDocumentExtraction(42, 2, $token);

    expect($job)->toBeInstanceOf(ShouldQueue::class)
        ->and($job)->toBeInstanceOf(ShouldBeUnique::class)
        ->and($job)->toBeInstanceOf(ShouldBeUniqueUntilProcessing::class)
        ->and($job->extractionId)->toBe(42)
        ->and($job->expectedAttempt)->toBe(2)
        ->and($job->invocationToken)->toBe($token)
        ->and($job->uniqueId())->toBe('42')
        ->and($job->uniqueFor)->toBe(300)
        ->and($job->tries)->toBe(1)
        ->and($job->timeout)->toBe(120)
        ->and($job->failOnTimeout)->toBeTrue()
        ->and($job->afterCommit)->toBeTrue()
        ->and(property_exists($job, 'backoff'))->toBeFalse();
});

test('enqueue failure releases the unique lock for an immediate retry', function () {
    $extraction = extractionForJob();
    $failingDispatcher = Mockery::mock(Dispatcher::class);
    $failingDispatcher->shouldReceive('dispatch')
        ->once()
        ->andThrow(new RuntimeException('queue unavailable'));
    app()->instance(Dispatcher::class, $failingDispatcher);

    expect(fn () => ProcessDocumentExtraction::dispatchFor($extraction->id))
        ->toThrow(RuntimeException::class, 'queue unavailable');

    $extraction->update(['status' => 'failed']);
    $retryDispatcher = Mockery::mock(Dispatcher::class);
    $retryDispatcher->shouldReceive('dispatch')
        ->once()
        ->with(Mockery::on(fn (ProcessDocumentExtraction $job): bool => $job->extractionId === $extraction->id));
    app()->instance(Dispatcher::class, $retryDispatcher);

    expect(ProcessDocumentExtraction::dispatchFor($extraction->id))->toBeTrue()
        ->and($extraction->refresh()->status)->toBe('pending');
});

test('database queue reservation outlives the extraction timeout with margin', function () {
    $job = new ProcessDocumentExtraction(42, 1, Str::uuid()->toString());
    $retryAfter = config('queue.connections.database.retry_after');

    expect($retryAfter)->toBeInt()
        ->and($retryAfter)->toBeGreaterThanOrEqual($job->timeout + 30);
});

test('dispatch helper computes the next attempt and a fresh token', function () {
    Queue::fake();

    $first = extractionForJob(attributes: ['attempt_count' => 1]);
    $second = extractionForJob(attributes: ['attempt_count' => 0]);

    expect(ProcessDocumentExtraction::dispatchFor($first->id))->toBeTrue()
        ->and(ProcessDocumentExtraction::dispatchFor($second->id))->toBeTrue();

    $tokens = [];
    Queue::assertPushed(ProcessDocumentExtraction::class, function (ProcessDocumentExtraction $job) use ($first, &$tokens): bool {
        if ($job->extractionId !== $first->id) {
            return false;
        }

        $tokens[] = $job->invocationToken;

        return $job->expectedAttempt === 2
            && Str::isUuid($job->invocationToken)
            && $job->afterCommit === true;
    });
    Queue::assertPushed(ProcessDocumentExtraction::class, function (ProcessDocumentExtraction $job) use ($second, &$tokens): bool {
        if ($job->extractionId !== $second->id) {
            return false;
        }

        $tokens[] = $job->invocationToken;

        return $job->expectedAttempt === 1
            && Str::isUuid($job->invocationToken)
            && $job->afterCommit === true;
    });

    expect($tokens)->toHaveCount(2)
        ->and($tokens[0])->not()->toBe($tokens[1]);
    Queue::assertPushedTimes(ProcessDocumentExtraction::class, 2);
});

test('pending extraction persists the candidate and reaches review without mutating its announcement', function () {
    $extraction = extractionForJob();
    $announcement = $extraction->attachment->announcement;
    $announcementBefore = $announcement->getRawOriginal();

    $token = runExtractionJob($extraction);

    $fresh = $extraction->refresh();
    expect($fresh->status)->toBe('review')
        ->and($fresh->attempt_count)->toBe(1)
        ->and($fresh->processing_token)->toBe($token)
        ->and($fresh->processing_started_at)->not()->toBeNull()
        ->and($fresh->processed_at)->not()->toBeNull()
        ->and($fresh->method)->toBe('fake_embedded_text')
        ->and($fresh->candidate['organization'])->toBe('มหาวิทยาลัยขอนแก่น')
        ->and($fresh->candidate['budget'])->toBe(1500000)
        ->and($fresh->confidence['title'])->toBe(0.99)
        ->and($fresh->warnings)->toBe([])
        ->and($fresh->raw_text)->toBe('ข้อมูลสาธิต Text PDF')
        ->and($fresh->error_message)->toBeNull()
        ->and($fresh->attachment->document_kind)->toBe('text_pdf')
        ->and($announcement->refresh()->getRawOriginal())->toBe($announcementBefore);
    assertDatabaseCount('document_extractions', 1);
});

test('unknown filenames complete in review with fake unknown and no error', function () {
    $extraction = extractionForJob('not-a-demo-fixture.pdf');

    runExtractionJob($extraction);

    $fresh = $extraction->refresh();
    expect($fresh->status)->toBe('review')
        ->and($fresh->method)->toBe('fake_unknown')
        ->and($fresh->candidate)->toBeNull()
        ->and($fresh->confidence)->toBe([])
        ->and($fresh->warnings)->toBe(['Unknown filename; review is required and no candidate data was guessed.'])
        ->and($fresh->raw_text)->toBeNull()
        ->and($fresh->error_message)->toBeNull()
        ->and($fresh->attachment->document_kind)->toBe('unknown');
});

test('typed failure fixture reaches failed without duplicates or announcement mutation', function () {
    $extraction = extractionForJob('thanyarak-khon-kaen-failure-demo.pdf');
    $announcement = $extraction->attachment->announcement;
    $announcementBefore = $announcement->getRawOriginal();

    runExtractionJob($extraction);

    $fresh = $extraction->refresh();
    expect($fresh->status)->toBe('failed')
        ->and($fresh->attempt_count)->toBe(1)
        ->and($fresh->method)->toBeNull()
        ->and($fresh->candidate)->toBeNull()
        ->and($fresh->confidence)->toBe([])
        ->and($fresh->warnings)->toBe([])
        ->and($fresh->raw_text)->toBeNull()
        ->and($fresh->error_message)->toBe('DEMO_EXTRACTION_FAILURE')
        ->and($fresh->processed_at)->not()->toBeNull()
        ->and($fresh->attachment->document_kind)->toBe('unknown')
        ->and($announcement->refresh()->getRawOriginal())->toBe($announcementBefore);
    assertDatabaseCount('document_extractions', 1);
});

test('old expected attempt is rejected before processing', function () {
    $extraction = extractionForJob(attributes: ['attempt_count' => 1]);
    $before = $extraction->getRawOriginal();

    runExtractionJob($extraction, expectedAttempt: 1);

    expect($extraction->refresh()->getRawOriginal())->toEqual($before)
        ->and($extraction->status)->toBe('pending');
});

test('completion is fenced when a newer attempt and token take ownership', function () {
    $extraction = extractionForJob();
    $firstToken = Str::uuid()->toString();
    $newToken = Str::uuid()->toString();
    $extractor = new class($extraction->id, $newToken) implements DocumentExtractor
    {
        public function __construct(private int $extractionId, private string $newToken) {}

        public function extract(ExtractionRequest $request): ExtractionResult
        {
            expect($request->originalClientFilename)->toBe('kku-text-demo.pdf');

            DocumentExtraction::query()->whereKey($this->extractionId)->update([
                'attempt_count' => 2,
                'processing_token' => $this->newToken,
                'processing_started_at' => now(),
            ]);

            return new ExtractionResult(
                document_kind: 'text_pdf',
                method: 'fake_embedded_text',
                candidate: ['title' => 'stale result'],
                confidence: ['title' => 1.0],
                warnings: [],
                raw_text: 'stale result',
                error_message: null,
            );
        }
    };

    (new ProcessDocumentExtraction($extraction->id, 1, $firstToken))->handle($extractor);

    $fresh = $extraction->refresh();
    expect($fresh->status)->toBe('processing')
        ->and($fresh->attempt_count)->toBe(2)
        ->and($fresh->processing_token)->toBe($newToken)
        ->and($fresh->method)->toBeNull()
        ->and($fresh->candidate)->toBeNull()
        ->and($fresh->attachment->document_kind)->toBe('unknown');
});

test('failed callback fences by both attempt and token even on a fresh job instance', function () {
    $currentToken = Str::uuid()->toString();
    $extraction = extractionForJob(attributes: [
        'status' => 'processing',
        'attempt_count' => 2,
        'processing_token' => $currentToken,
        'processing_started_at' => now(),
    ]);
    $before = $extraction->getRawOriginal();

    $freshStaleJob = new ProcessDocumentExtraction($extraction->id, 1, Str::uuid()->toString());
    $freshStaleJob->failed(new RuntimeException('stale worker failure'));

    expect($extraction->refresh()->getRawOriginal())->toEqual($before);

    $currentJob = new ProcessDocumentExtraction($extraction->id, 2, $currentToken);
    $currentJob->failed(new RuntimeException('current worker failure'));

    $fresh = $extraction->refresh();
    expect($fresh->status)->toBe('failed')
        ->and($fresh->attempt_count)->toBe(2)
        ->and($fresh->processing_token)->toBe($currentToken)
        ->and($fresh->error_message)->toBe('current worker failure')
        ->and($fresh->processed_at)->not()->toBeNull();
});

test('stale processing at 360 seconds recovers to pending and dispatches the next attempt', function () {
    Queue::fake();
    Date::setTestNow('2026-08-11 12:00:00');
    $extraction = extractionForJob(attributes: [
        'status' => 'processing',
        'attempt_count' => 1,
        'processing_token' => Str::uuid()->toString(),
        'processing_started_at' => now()->subSeconds(360),
    ]);

    expect(ProcessDocumentExtraction::dispatchFor($extraction->id))->toBeTrue();

    $fresh = $extraction->refresh();
    expect($fresh->status)->toBe('pending')
        ->and($fresh->attempt_count)->toBe(1)
        ->and($fresh->processing_token)->toBeNull()
        ->and($fresh->processing_started_at)->toBeNull();
    Queue::assertPushed(ProcessDocumentExtraction::class, fn (ProcessDocumentExtraction $job): bool => $job->extractionId === $extraction->id
        && $job->expectedAttempt === 2
        && Str::isUuid($job->invocationToken));
});

test('non-stale processing cannot be recovered or dispatched', function () {
    Queue::fake();
    Date::setTestNow('2026-08-11 12:00:00');
    $token = Str::uuid()->toString();
    $extraction = extractionForJob(attributes: [
        'status' => 'processing',
        'attempt_count' => 1,
        'processing_token' => $token,
        'processing_started_at' => now()->subSeconds(359),
    ]);
    $before = $extraction->getRawOriginal();

    expect(ProcessDocumentExtraction::dispatchFor($extraction->id))->toBeFalse()
        ->and($extraction->refresh()->getRawOriginal())->toEqual($before);
    Queue::assertNothingPushed();
});

test('review and failed retries clear extracted and approval fields before dispatch', function (string $status) {
    Queue::fake();
    $approver = User::factory()->admin()->create();
    $extraction = extractionForJob(attributes: [
        'document_kind' => 'text_pdf',
        'status' => $status,
        'method' => 'fake_embedded_text',
        'candidate' => ['title' => 'candidate'],
        'confidence' => ['title' => 0.9],
        'warnings' => ['warning'],
        'raw_text' => 'raw',
        'error_message' => 'error',
        'attempt_count' => 1,
        'processing_token' => Str::uuid()->toString(),
        'processing_started_at' => now()->subMinute(),
        'processed_at' => now()->subSeconds(30),
        'approved_at' => now()->subSeconds(20),
        'approved_by' => $approver->id,
    ]);

    expect(ProcessDocumentExtraction::dispatchFor($extraction->id))->toBeTrue();

    $fresh = $extraction->refresh();
    expect($fresh->status)->toBe('pending')
        ->and($fresh->method)->toBeNull()
        ->and($fresh->candidate)->toBeNull()
        ->and($fresh->confidence)->toBeNull()
        ->and($fresh->warnings)->toBeNull()
        ->and($fresh->raw_text)->toBeNull()
        ->and($fresh->error_message)->toBeNull()
        ->and($fresh->processing_token)->toBeNull()
        ->and($fresh->processing_started_at)->toBeNull()
        ->and($fresh->processed_at)->toBeNull()
        ->and($fresh->approved_at)->toBeNull()
        ->and($fresh->approved_by)->toBeNull()
        ->and($fresh->attachment->document_kind)->toBe('unknown');
    Queue::assertPushed(ProcessDocumentExtraction::class, fn (ProcessDocumentExtraction $job): bool => $job->extractionId === $extraction->id
        && $job->expectedAttempt === 2);
})->with(['review', 'failed']);

test('third failed attempt is terminal and dispatches nothing', function () {
    $extraction = extractionForJob('thanyarak-khon-kaen-failure-demo.pdf', [
        'attempt_count' => 2,
    ]);

    runExtractionJob($extraction);

    Queue::fake();
    $before = $extraction->refresh()->getRawOriginal();

    expect(ProcessDocumentExtraction::dispatchFor($extraction->id))->toBeFalse()
        ->and($extraction->refresh()->getRawOriginal())->toEqual($before)
        ->and($extraction->status)->toBe('failed')
        ->and($extraction->attempt_count)->toBe(3);
    Queue::assertNothingPushed();
});

test('stale processing at the third attempt becomes terminal failed', function () {
    Queue::fake();
    Date::setTestNow('2026-08-11 12:00:00');
    $extraction = extractionForJob(attributes: [
        'status' => 'processing',
        'attempt_count' => 3,
        'processing_token' => Str::uuid()->toString(),
        'processing_started_at' => now()->subSeconds(360),
    ]);

    expect(ProcessDocumentExtraction::dispatchFor($extraction->id))->toBeFalse();

    $fresh = $extraction->refresh();
    expect($fresh->status)->toBe('failed')
        ->and($fresh->attempt_count)->toBe(3)
        ->and($fresh->error_message)->toBe('Maximum extraction attempts reached.')
        ->and($fresh->processed_at)->not()->toBeNull();
    Queue::assertNothingPushed();
});

test('approved extraction is terminal for direct execution and retry dispatch', function () {
    Queue::fake();
    $extraction = extractionForJob(attributes: [
        'status' => 'approved',
        'attempt_count' => 1,
        'approved_at' => now(),
    ]);
    $before = $extraction->getRawOriginal();

    runExtractionJob($extraction, expectedAttempt: 2);

    expect(ProcessDocumentExtraction::dispatchFor($extraction->id))->toBeFalse()
        ->and($extraction->refresh()->getRawOriginal())->toEqual($before)
        ->and($extraction->status)->toBe('approved');
    Queue::assertNothingPushed();
});

test('deleted attachment and extraction make an already queued job a no-op', function () {
    $extraction = extractionForJob();
    $extractionId = $extraction->id;
    $extraction->attachment->delete();

    $job = new ProcessDocumentExtraction($extractionId, 1, Str::uuid()->toString());
    $job->handle(app(DocumentExtractor::class));
    $job->failed(new RuntimeException('attachment was deleted'));

    expect(DocumentExtraction::query()->find($extractionId))->toBeNull();
    assertDatabaseCount('document_extractions', 0);
});
