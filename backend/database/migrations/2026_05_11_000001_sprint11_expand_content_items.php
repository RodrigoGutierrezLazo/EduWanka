<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('content_items', function (Blueprint $table) {
            $table->text('body_html')->nullable()->after('url');
            $table->unsignedBigInteger('referenced_id')->nullable()->after('body_html');
            $table->json('meta')->nullable()->after('referenced_id');
            $table->unsignedInteger('order')->default(0)->after('meta');
            $table->boolean('published')->default(true)->after('order');
        });

        // Ensure type column supports all 9 content types
        // (in MySQL it's already a VARCHAR, so we just leave it as-is)
        // Optionally rename if type was an enum — check and alter if needed
    }

    public function down(): void
    {
        Schema::table('content_items', function (Blueprint $table) {
            $table->dropColumn(['body_html', 'referenced_id', 'meta', 'order', 'published']);
        });
    }
};
