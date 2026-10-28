<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('banners', function (Blueprint $table) {
            $table->string('kind')->default('homepage')->after('id');
            $table->string('placement')->nullable()->after('link_url');
            $table->foreignId('product_id')->nullable()->after('placement')->constrained()->nullOnDelete();
            $table->foreignId('collection_id')->nullable()->after('product_id')->constrained('collections')->nullOnDelete();
            $table->index('kind');
        });

        DB::table('banners')->update(['kind' => 'homepage']);

        $productId = DB::table('products')->orderBy('id')->value('id');
        $collectionId = DB::table('collections')->orderBy('id')->value('id');

        if (! DB::table('banners')->where('kind', 'promo')->exists()) {
            DB::table('banners')->insert([
                [
                    'kind' => 'promo',
                    'eyebrow' => null,
                    'title' => 'Best sellers showcase',
                    'subtitle' => null,
                    'image_path' => 'banners/promo-best-sellers.jpg',
                    'link_url' => null,
                    'placement' => 'best_sellers',
                    'product_id' => $productId,
                    'collection_id' => null,
                    'is_active' => true,
                    'sort_order' => 0,
                    'created_at' => now(),
                    'updated_at' => now(),
                ],
                [
                    'kind' => 'promo',
                    'eyebrow' => null,
                    'title' => 'Trending collection',
                    'subtitle' => null,
                    'image_path' => 'banners/promo-trending.jpg',
                    'link_url' => null,
                    'placement' => 'trending',
                    'product_id' => null,
                    'collection_id' => $collectionId,
                    'is_active' => true,
                    'sort_order' => 1,
                    'created_at' => now(),
                    'updated_at' => now(),
                ],
            ]);
        }
    }

    public function down(): void
    {
        DB::table('banners')->where('kind', 'promo')->delete();

        Schema::table('banners', function (Blueprint $table) {
            $table->dropForeign(['product_id']);
            $table->dropForeign(['collection_id']);
            $table->dropIndex(['kind']);
            $table->dropColumn(['kind', 'placement', 'product_id', 'collection_id']);
        });
    }
};
