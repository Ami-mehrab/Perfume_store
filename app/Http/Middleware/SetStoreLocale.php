<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class SetStoreLocale
{
    public function handle(Request $request, Closure $next): Response
    {
        $locale = $request->cookie('locale');

        if (! in_array($locale, ['en', 'bn'], true)) {
            $locale = 'bn';
        }

        app()->setLocale($locale);

        return $next($request);
    }
}
