<?php

namespace App\Console\Commands;

use App\Models\Course;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class CleanOrphanedStorage extends Command
{
    protected $signature = 'storage:clean-orphaned {--dry-run : List orphaned folders without deleting}';

    protected $description = 'Delete storage folders for courses, content-items, and materials that no longer exist in the database';

    public function handle(): int
    {
        $disk = Storage::disk('public');
        $dryRun = $this->option('dry-run');

        if ($dryRun) {
            $this->warn('Running in dry-run mode. No files will be deleted.');
        }

        $totalCleaned = 0;

        // --- Courses ---
        $totalCleaned += $this->cleanDirectory(
            $disk,
            'courses',
            'courses',
            $dryRun
        );

        // --- Content Items ---
        $totalCleaned += $this->cleanDirectory(
            $disk,
            'content-items',
            'content_items',
            $dryRun
        );

        // --- Materials ---
        $totalCleaned += $this->cleanDirectory(
            $disk,
            'materials',
            'materials',
            $dryRun
        );

        $this->newLine();
        $action = $dryRun ? 'would be cleaned' : 'cleaned';
        $this->info("Total: {$totalCleaned} orphaned folder(s) {$action}.");

        return self::SUCCESS;
    }

    private function cleanDirectory($disk, string $storageDir, string $tableName, bool $dryRun): int
    {
        if (! $disk->exists($storageDir)) {
            $this->line("[{$storageDir}] Directory not found. Skipping.");
            return 0;
        }

        $folders = $disk->directories($storageDir);
        if (empty($folders)) {
            $this->line("[{$storageDir}] No subfolders found.");
            return 0;
        }

        // Get all existing IDs from the table
        $existingIds = DB::table($tableName)->pluck('id')->map(fn ($id) => (string) $id)->toArray();
        $existingIds = array_flip($existingIds);

        $deleted = 0;

        foreach ($folders as $folder) {
            $folderId = basename($folder);

            // Only process folders that look like numeric IDs
            if (! ctype_digit($folderId)) {
                continue;
            }

            if (! isset($existingIds[$folderId])) {
                $this->line("  Orphaned: {$folder}");

                if (! $dryRun) {
                    $disk->deleteDirectory($folder);
                }

                $deleted++;
            }
        }

        $action = $dryRun ? 'found' : 'removed';
        $this->info("[{$storageDir}] {$deleted} orphaned folder(s) {$action}.");

        return $deleted;
    }
}
