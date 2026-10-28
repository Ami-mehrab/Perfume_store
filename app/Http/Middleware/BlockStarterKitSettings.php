<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Starter-kit /settings/* is not part of the store. Keep panels separate:
 * customers → /account, staff → /admin/settings.
 */
class BlockStarterKitSettings
{
    /**
     * @param  Closure(Request): Response  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if ($user !== null && $user->isAdmin()) {
            return redirect()->route('admin.settings.edit');
        }

        return redirect()->route('account.index');
    }
}
