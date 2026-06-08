<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class AdminSettingsController extends Controller
{
    /**
     * Update the hero text settings.
     */
    public function updateHeroSettings(Request $request): JsonResponse
    {
        $data = $request->validate([
            'hero_badge'       => ['required', 'string', 'max:255'],
            'hero_title'       => ['required', 'string', 'max:255'],
            'hero_description' => ['required', 'string'],
        ]);

        Setting::setValue('hero_badge', $data['hero_badge']);
        Setting::setValue('hero_title', $data['hero_title']);
        Setting::setValue('hero_description', $data['hero_description']);

        return response()->json([
            'message' => 'Configuración del Hero actualizada correctamente.',
            'data' => [
                'hero_badge'       => Setting::getValue('hero_badge'),
                'hero_title'       => Setting::getValue('hero_title'),
                'hero_description' => Setting::getValue('hero_description'),
                'hero_bg_url'      => Setting::getValue('hero_bg_url', '/storage/hero/hero_law_bg.png'),
            ]
        ]);
    }

    /**
     * Upload or replace the Hero background image.
     */
    public function uploadHeroBgImage(Request $request): JsonResponse
    {
        $request->validate([
            'image' => ['required', 'file', 'image', 'mimes:jpg,jpeg,png,webp,avif', 'max:5120'],
        ]);

        $currentBg = Setting::getValue('hero_bg_url');

        // Delete current background image if it is local and not the default one
        if ($currentBg && 
            !preg_match('#^https?://#i', $currentBg) && 
            $currentBg !== '/storage/hero/hero_law_bg.png' && 
            $currentBg !== 'storage/hero/hero_law_bg.png'
        ) {
            $relativePath = str_replace('/storage/', '', $currentBg);
            Storage::disk('public')->delete($relativePath);
        }

        $file = $request->file('image');
        $extension = strtolower($file->getClientOriginalExtension() ?: $file->extension());
        $filename = 'hero-bg-' . now()->format('YmdHis') . '-' . Str::random(5) . '.' . $extension;
        $path = $file->storeAs('hero', $filename, 'public');

        $fullUrl = '/storage/' . ltrim($path, '/');
        Setting::setValue('hero_bg_url', $fullUrl);

        return response()->json([
            'message'     => 'Imagen de fondo del Hero cargada correctamente.',
            'hero_bg_url' => $fullUrl,
        ]);
    }

    /**
     * Update the general home page sections settings.
     */
    public function updateHomeSections(Request $request): JsonResponse
    {
        $data = $request->validate([
            'home_mission_vision_values' => ['nullable', 'array'],
            'home_impact_stats'          => ['nullable', 'array'],
            'home_testimonials'          => ['nullable', 'array'],
            'home_convenios_enabled'     => ['nullable', 'boolean'],
            'home_convenios_logos'       => ['nullable', 'array'],
        ]);

        if (isset($data['home_mission_vision_values'])) {
            Setting::setValue('home_mission_vision_values', json_encode($data['home_mission_vision_values'], JSON_UNESCAPED_UNICODE));
        }
        if (isset($data['home_impact_stats'])) {
            Setting::setValue('home_impact_stats', json_encode($data['home_impact_stats'], JSON_UNESCAPED_UNICODE));
        }
        if (isset($data['home_testimonials'])) {
            Setting::setValue('home_testimonials', json_encode($data['home_testimonials'], JSON_UNESCAPED_UNICODE));
        }
        if (isset($data['home_convenios_enabled'])) {
            Setting::setValue('home_convenios_enabled', $data['home_convenios_enabled'] ? '1' : '0');
        }
        if (isset($data['home_convenios_logos'])) {
            Setting::setValue('home_convenios_logos', json_encode($data['home_convenios_logos'], JSON_UNESCAPED_UNICODE));
        }

        return response()->json([
            'message' => 'Configuración de secciones del Home actualizada correctamente.',
            'data' => [
                'home_mission_vision_values' => json_decode(Setting::getValue('home_mission_vision_values', '{}'), true),
                'home_impact_stats'          => json_decode(Setting::getValue('home_impact_stats', '{}'), true),
                'home_testimonials'          => json_decode(Setting::getValue('home_testimonials', '[]'), true),
                'home_convenios_enabled'     => Setting::getValue('home_convenios_enabled', '1') === '1',
                'home_convenios_logos'       => json_decode(Setting::getValue('home_convenios_logos', '[]'), true),
            ]
        ]);
    }

    /**
     * Upload a file for a general setting (testimonial photo, video, etc.).
     */
    public function uploadSettingFile(Request $request): JsonResponse
    {
        $allowedExtensions = implode(',', config('uploads.content_item_extensions'));

        $request->validate([
            'file'   => ['required', 'file', 'max:51200', "mimes:{$allowedExtensions}"],
            'folder' => ['required', 'string', 'in:testimonials_photos,testimonials_videos,convenios,tenant_logos,payment_logos'],
        ]);

        $file = $request->file('file');
        $folder = $request->input('folder');

        $extension = strtolower($file->getClientOriginalExtension() ?: $file->extension());
        $filename = 'setting-' . $folder . '-' . now()->format('YmdHis') . '-' . Str::random(5) . '.' . $extension;
        $path = $file->storeAs('settings/' . $folder, $filename, 'public');

        $fullUrl = '/storage/' . ltrim($path, '/');

        return response()->json([
            'message'  => 'Archivo cargado correctamente.',
            'url'      => $fullUrl,
        ]);
    }

    /**
     * Update the active tenant name and branding colors.
     */
    public function updateTenantSettings(Request $request): JsonResponse
    {
        $tenantManager = app(\App\Services\TenantManager::class);
        $tenant = $tenantManager->getTenant();

        if (!$tenant) {
            return response()->json([
                'error' => 'No active tenant context.'
            ], 400);
        }

        $data = $request->validate([
            'name'            => ['required', 'string', 'max:255'],
            'primary_color'   => ['required', 'string', 'regex:/^#([A-Fa-f0-9]{6})$/'],
            'secondary_color' => ['required', 'string', 'regex:/^#([A-Fa-f0-9]{6})$/'],
            'logo_path'       => ['nullable', 'string', 'max:255'],
            'payment_methods' => ['nullable', 'array'],
        ]);

        $updateData = [
            'name'            => $data['name'],
            'primary_color'   => $data['primary_color'],
            'secondary_color' => $data['secondary_color'],
            'logo_path'       => $data['logo_path'],
        ];

        if ($request->has('payment_methods')) {
            $updateData['payment_methods'] = $data['payment_methods'];
        }

        $tenant->update($updateData);

        return response()->json([
            'message' => 'Configuración institucional del aula actualizada.',
            'data'    => [
                'id'              => $tenant->id,
                'name'            => $tenant->name,
                'slug'            => $tenant->slug,
                'domain'          => $tenant->domain,
                'logo_path'       => $tenant->logo_path,
                'primary_color'   => $tenant->primary_color,
                'secondary_color' => $tenant->secondary_color,
                'payment_methods' => $tenant->payment_methods,
            ]
        ]);
    }

    /**
     * Update the modular landing page sections.
     */
    public function updateLandingSections(Request $request): JsonResponse
    {
        $data = $request->validate([
            'sections' => ['required', 'array'],
        ]);

        Setting::setValue('home_landing_sections', json_encode($data['sections'], JSON_UNESCAPED_UNICODE));

        return response()->json([
            'message' => 'Estructura de la portada actualizada correctamente.',
            'data' => json_decode(Setting::getValue('home_landing_sections', '[]'), true)
        ]);
    }
}
