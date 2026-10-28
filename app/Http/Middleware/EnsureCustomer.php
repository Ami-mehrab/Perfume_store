<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class EnsureCustomer
{
    /**
     * /customer-account/* shopper pages only.
     * Guests → customer sign-in. Staff are signed out and sent to the same
     * public sign-in page (never bounce a customer URL into /admin).
     *
     * @param  Closure(Request): Response  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if ($user === null) {
            return redirect()->guest(route('account.index'));
        }

        if ($user->isAdmin() || ! $user->isCustomer()) {
            $request->session()->forget('url.intended');
            Auth::logout();
            $request->session()->invalidate();
            $request->session()->regenerateToken();

            return redirect()->route('account.index');
        }

        return $next($request);
    }
}
