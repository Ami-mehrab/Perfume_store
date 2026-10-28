<?php

namespace App\Support;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

final class Slugs
{
    /**
     * @param  class-string<Model>  $model
     */
    public static function unique(string $model, string $source, ?int $ignoreId = null): string
    {
        $base = Str::slug($source);
        $base = $base !== '' ? $base : Str::lower(Str::random(8));
        $slug = $base;
        $suffix = 1;

        while ($model::query()
            ->where('slug', $slug)
            ->when($ignoreId !== null, fn ($query) => $query->whereKeyNot($ignoreId))
            ->exists()) {
            $slug = $base.'-'.$suffix;
            $suffix++;
        }

        return $slug;
    }
}
