<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureAdmin
{
    /**
     * /admin/* is staff-only.
     * Guests → admin login. Customers → customer panel (never stay in /admin).
     *
     * @param  Closure(Request): Response  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if ($user === null) {
            // Only remember intended URLs that belong to /admin.
            return redirect()->guest(route('admin.login'));
        }

        if (! $user->isAdmin()) {
            $request->session()->forget('url.intended');

            return redirect()->route('account.index');
        }

        return $next($request);
    }
}
