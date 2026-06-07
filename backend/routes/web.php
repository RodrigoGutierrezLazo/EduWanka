<?php

use Illuminate\Support\Facades\Route;

$serveSpa = function () {
    $index = public_path('spa/index.html');
    if (! is_file($index)) {
        return response(
            'EduWanka: el frontend no está construido. En la carpeta frontend ejecuta: npm install && npm run build',
            503
        );
    }

    return response()->file($index, [
        'Content-Type' => 'text/html; charset=UTF-8',
    ]);
};

Route::get('/', $serveSpa);
Route::get('{any}', $serveSpa)->where('any', '^(?!api|sanctum|storage).*$');
