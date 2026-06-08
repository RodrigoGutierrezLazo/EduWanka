<?php

/**
 * Configuración de uploads genéricos.
 *
 * Define la allowlist de extensiones permitidas para materiales y contenido
 * del aula virtual. Cualquier extensión no listada aquí será rechazada con
 * 422 (Unprocessable Entity).
 *
 * Objetivo: prevenir stored-XSS vía archivos HTML/SVG/JS servidos en el mismo
 * origen del SPA.
 */

return [

    /*
    |--------------------------------------------------------------------------
    | Extensiones permitidas para items de contenido (Módulos Moodle-like)
    |--------------------------------------------------------------------------
    | Usado por ModuleManagementController::storeItem
    */
    'content_item_extensions' => [
        // Documentos
        'pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx',
        'odt', 'ods', 'odp', 'txt', 'csv', 'rtf',
        // Imágenes
        'jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'tiff',
        // Video
        'mp4', 'webm', 'avi', 'mov', 'mkv', 'flv',
        // Audio
        'mp3', 'wav', 'ogg', 'm4a', 'flac', 'aac',
        // Archivos comprimidos
        'zip', 'rar', '7z', 'tar', 'gz',
    ],

    /*
    |--------------------------------------------------------------------------
    | Extensiones permitidas para materiales de sesión
    |--------------------------------------------------------------------------
    | Usado por AdminMaterialsController::storeMaterial
    */
    'material_extensions' => [
        // Documentos
        'pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx',
        'odt', 'ods', 'odp', 'txt', 'csv', 'rtf',
        // Imágenes
        'jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'tiff',
        // Video
        'mp4', 'webm', 'avi', 'mov', 'mkv', 'flv',
        // Audio
        'mp3', 'wav', 'ogg', 'm4a', 'flac', 'aac',
        // Archivos comprimidos
        'zip', 'rar', '7z', 'tar', 'gz',
    ],

    /*
    |--------------------------------------------------------------------------
    | Extensiones explícitamente bloqueadas (para documentación; la allowlist
    | es lo que realmente protege)
    |--------------------------------------------------------------------------
    */
    'blocked_extensions' => [
        'html', 'htm', 'svg', 'js', 'mjs', 'css', 'php', 'phtml',
        'exe', 'bat', 'cmd', 'sh', 'msi', 'dll', 'so', 'py', 'rb',
        'jsp', 'asp', 'aspx', 'cgi', 'pl',
    ],
];
