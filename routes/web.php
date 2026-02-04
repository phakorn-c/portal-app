<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Laravel\Fortify\Features;

Route::get('/', function () {
    return Inertia::render('welcome', [
        'canRegister' => Features::enabled(Features::registration()),
    ]);
})->name('home');

Route::get('dashboard', function () {
    return Inertia::render('dashboard');
})->middleware(['auth', 'verified'])->name('dashboard');

Route::get('procurement', function () {
    return Inertia::render('procurement/search');
})->name('procurement.search');

Route::get('procurement/announcements/{announcement}', function (string $announcement) {
    return Inertia::render('procurement/show', [
        'announcementId' => $announcement,
    ]);
})->name('procurement.show');

Route::get('admin', function () {
    return Inertia::render('admin/dashboard');
})->middleware(['auth', 'verified'])->name('admin.dashboard');

// User Dashboard and Features
Route::middleware(['auth', 'verified'])->group(function () {
    // User Dashboard
    Route::get('user/dashboard', function () {
        return Inertia::render('user/dashboard');
    })->name('user.dashboard');

    // Notification Settings
    Route::get('user/notifications', function () {
        return Inertia::render('user/notifications');
    })->name('user.notifications');

    // Saved Searches
    Route::get('user/saved-searches', function () {
        return Inertia::render('user/saved-searches');
    })->name('user.saved-searches');

    // Viewing History
    Route::get('user/history', function () {
        return Inertia::render('user/history');
    })->name('user.history');
});

require __DIR__.'/settings.php';
