<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\BookController;
use App\Http\Controllers\Api\CategoryController;
use App\Http\Controllers\Api\CheckpointController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\KelasController;
use App\Http\Controllers\Api\PeminjamanController;
use App\Http\Controllers\Api\PenerbitController;
use App\Http\Controllers\Api\RakBukuController;
use App\Http\Controllers\Api\SettingController;

use App\Http\Controllers\Api\UserController;
use Illuminate\Support\Facades\Route;

// ─── Public ──────────────────────────────────────────────
Route::post('/login', [AuthController::class, 'login']);

// ─── Authenticated ───────────────────────────────────────
Route::middleware('auth:sanctum')->group(function () {

    // Auth
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);
    Route::post('/profile', [AuthController::class, 'updateProfile']);
    Route::post('/change-password', [AuthController::class, 'changePassword']);

    // Dashboard
    Route::get('/dashboard', [DashboardController::class, 'index']);

    // ─── Admin & Guru ────────────────────────────────────
    Route::middleware('role:admin,guru')->group(function () {
        // Peminjaman
        Route::get('/peminjaman', [PeminjamanController::class, 'index']);
        Route::post('/peminjaman', [PeminjamanController::class, 'store']);
        Route::get('/peminjaman/{peminjaman}', [PeminjamanController::class, 'show']);
        Route::post('/peminjaman/{peminjaman}/return', [PeminjamanController::class, 'returnBook']);



        // Checkpoints
        Route::get('/checkpoints', [CheckpointController::class, 'index']);
        Route::get('/checkpoints/{checkpoint}', [CheckpointController::class, 'show']);
    });

    // ─── Admin Only ──────────────────────────────────────
    Route::middleware('role:admin')->group(function () {
        // Categories
        Route::apiResource('categories', CategoryController::class);

        // Rak Buku
        Route::apiResource('rak-buku', RakBukuController::class)->parameters([
            'rak-buku' => 'rakBuku',
        ]);

        // Penerbit
        Route::apiResource('penerbit', PenerbitController::class);

        // Books
        Route::apiResource('books', BookController::class);

        // Users
        Route::apiResource('users', UserController::class);

        // Kelas
        Route::apiResource('kelas', KelasController::class);

        // Peminjaman - delete
        Route::delete('/peminjaman/{peminjaman}', [PeminjamanController::class, 'destroy']);

        // Settings
        Route::get('/settings', [SettingController::class, 'index']);
        Route::put('/settings', [SettingController::class, 'update']);
        Route::post('/settings/logo', [SettingController::class, 'uploadLogo']);
    });

    // ─── Read-only for all authenticated ─────────────────
    Route::get('/books-list', [BookController::class, 'index']);
    Route::get('/books-list/{book}', [BookController::class, 'show']);
    Route::get('/categories-list', [CategoryController::class, 'index']);
    Route::get('/my-peminjaman', [PeminjamanController::class, 'myIndex']);

    // ─── Self-borrow (siswa borrows for themselves) ──────
    Route::post('/borrow', [PeminjamanController::class, 'selfBorrow']);
});
