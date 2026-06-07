<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Storage;

class CleanCertificatePreviews extends Command
{
    protected $signature = 'certificates:clean-previews';

    protected $description = 'Delete certificate preview PDFs older than 1 hour';

    public function handle(): int
    {
        $disk = Storage::disk('public');
        $directory = 'certificate-previews';

        if (! $disk->exists($directory)) {
            $this->info('No certificate-previews directory found. Nothing to clean.');
            return self::SUCCESS;
        }

        $files = $disk->files($directory);
        $threshold = now()->subHour()->getTimestamp();
        $deleted = 0;

        foreach ($files as $file) {
            if (! str_ends_with(strtolower($file), '.pdf')) {
                continue;
            }

            if ($disk->lastModified($file) < $threshold) {
                $disk->delete($file);
                $deleted++;
            }
        }

        $this->info("Cleaned {$deleted} expired certificate preview(s).");

        return self::SUCCESS;
    }
}
