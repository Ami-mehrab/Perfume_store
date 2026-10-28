<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('collections', function (Blueprint $table) {
            $table->string('name_bn')->nullable();
            $table->string('audience')->nullable();
        });

        $now = now();

        foreach ([
            ['Men', 'পুরুষ', 'men', 'masculine', 0],
            ['Women', 'নারী', 'women', 'feminine', 1],
            ['Unisex', 'উভয়', 'unisex', 'unisex', 2],
        ] as [$name, $nameBn, $slug, $audience, $sort]) {
            if (DB::table('collections')->where('slug', $slug)->exists()) {
                continue;
            }

            DB::table('collections')->insert([
                'name' => $name,
                'name_bn' => $nameBn,
                'slug' => $slug,
                'description' => null,
                'swatch' => '#9d174d',
                'audience' => $audience,
                'is_featured' => true,
                'is_active' => true,
                'sort_order' => $sort,
                'created_at' => $now,
                'updated_at' => $now,
            ]);
        }
    }

    public function down(): void
    {
        Schema::table('collections', function (Blueprint $table) {
            $table->dropColumn(['name_bn', 'audience']);
        });
    }
};
