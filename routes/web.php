<?php

use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
|
| Semua route web diarahkan ke view 'app' yang memuat React SPA.
| React Router akan menangani semua routing di sisi client.
| API routes didefinisikan di routes/api.php.
|
*/

// Serve uploaded files from storage (avatars, covers, logos)
Route::get('/storage/{path}', function (string $path) {
    $fullPath = storage_path('app/public/' . $path);
    if (!file_exists($fullPath)) {
        abort(404);
    }
    return response()->file($fullPath);
})->where('path', '.*');

// Catch-all route: semua request diarahkan ke React SPA
Route::get('/{any?}', function () {
    return view('app');
})->where('any', '.*');
