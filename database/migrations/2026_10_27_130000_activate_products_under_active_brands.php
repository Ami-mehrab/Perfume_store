<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Imported catalog bottles were often left hidden; brand search needs them visible
        // even at 0 stock (stock-out is shown on the card, not by hiding the perfume).
        DB::table('products')
            ->whereIn('brand_id', function ($query): void {
                $query->select('id')
                    ->from('brands')
                    ->where('is_active', true);
            })
            ->where('is_active', false)
            ->update([
                'is_active' => true,
                'updated_at' => now(),
            ]);
    }

    public function down(): void
    {
        // Irreversible data repair — do not re-hide the catalogue.
    }
};
