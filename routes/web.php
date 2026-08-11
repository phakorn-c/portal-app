<?php

use App\Http\Controllers\Admin\AnnouncementController;
use App\Http\Controllers\Admin\ExtractionReviewController;
use App\Http\Controllers\Admin\UserController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\Procurement\PdfController;
use App\Http\Controllers\Procurement\SearchController;
use App\Http\Controllers\Procurement\ShowController;
use App\Http\Controllers\User\NotificationController;
use App\Http\Controllers\User\NotificationPreferenceController;
use App\Http\Controllers\User\SavedSearchController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('procurement/search');
})->name('home');

Route::get('dashboard', [DashboardController::class, 'index'])->middleware(['auth', 'verified'])->name('dashboard');

Route::get('procurement', [SearchController::class, 'index'])->name('procurement.search');

Route::get('procurement/announcements/{announcement}', [ShowController::class, 'show'])->name('procurement.show');
Route::get('procurement/announcements/{announcement}/pdf/{attachment}', [PdfController::class, 'show'])->name('procurement.pdf');
Route::get('procurement/announcements/{announcement}/pdf/{attachment}/download', [PdfController::class, 'download'])->name('procurement.pdf.download');

Route::get('admin', [\App\Http\Controllers\Admin\DashboardController::class, 'index'])->middleware(['auth', 'verified', 'role:admin'])->name('admin.dashboard');

Route::middleware(['auth', 'verified', 'role:admin'])->prefix('admin/announcements')->name('admin.announcements.')->group(function () {
    Route::get('/', [AnnouncementController::class, 'index'])->name('index');
    Route::post('/', [AnnouncementController::class, 'store'])->name('store');
    Route::get('{announcement}', [AnnouncementController::class, 'show'])->name('show');
    Route::put('{announcement}', [AnnouncementController::class, 'update'])->name('update');
    Route::delete('{announcement}', [AnnouncementController::class, 'destroy'])->name('destroy');
    Route::patch('{announcement}/publish', [AnnouncementController::class, 'publish'])->name('publish');
    Route::patch('{announcement}/hide', [AnnouncementController::class, 'hide'])->name('hide');
    Route::get('{announcement}/extractions/{extraction}', [ExtractionReviewController::class, 'show'])->name('extractions.show');
    Route::put('{announcement}/extractions/{extraction}/approve', [ExtractionReviewController::class, 'approve'])->name('extractions.approve');
    Route::post('{announcement}/extractions/{extraction}/retry', [ExtractionReviewController::class, 'retry'])->name('extractions.retry');
});

// TODO: add role:admin middleware - Task 3
Route::middleware(['auth', 'verified', 'role:admin'])->prefix('admin/users')->name('admin.users.')->group(function () {
    Route::get('/', [UserController::class, 'index'])->name('index');
    Route::patch('{user}/role', [UserController::class, 'updateRole'])->name('update-role');
    Route::delete('{user}', [UserController::class, 'destroy'])->name('destroy');
});

// User Dashboard and Features
Route::middleware(['auth', 'verified'])->group(function () {
    // User Dashboard
    Route::get('user/dashboard', [\App\Http\Controllers\User\DashboardController::class, 'index'])->name('user.dashboard');

    // Notification Settings
    Route::get('user/notifications', [NotificationController::class, 'index'])->name('user.notifications');
    Route::patch('user/notifications/{notification}/read', [NotificationController::class, 'markRead'])->name('user.notifications.read');

    Route::get('user/saved-searches', [SavedSearchController::class, 'index'])->name('user.saved-searches.index');
    Route::post('user/saved-searches', [SavedSearchController::class, 'store'])->name('user.saved-searches.store');
    Route::put('user/saved-searches/{savedSearch}', [SavedSearchController::class, 'update'])->name('user.saved-searches.update');
    Route::delete('user/saved-searches/{savedSearch}', [SavedSearchController::class, 'destroy'])->name('user.saved-searches.destroy');
    Route::post('user/saved-searches/{savedSearch}/run', [SavedSearchController::class, 'run'])->name('user.saved-searches.run');

    Route::get('user/notification-preferences', [NotificationPreferenceController::class, 'show'])->name('user.notification-preferences.show');
    Route::put('user/notification-preferences', [NotificationPreferenceController::class, 'update'])->name('user.notification-preferences.update');

    // Viewing History
    Route::get('user/history', [\App\Http\Controllers\User\HistoryController::class, 'index'])->name('user.history');
});

require __DIR__.'/settings.php';
