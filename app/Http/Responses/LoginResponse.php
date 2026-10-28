<?php

namespace App\Http\Responses;

use App\Models\User;
use Illuminate\Http\JsonResponse;
use Laravel\Fortify\Contracts\LoginResponse as LoginResponseContract;
use Symfony\Component\HttpFoundation\Response;

class LoginResponse implements LoginResponseContract
{
    public function toResponse($request): Response
    {
        $user = $request->user();

        if ($user instanceof User && $user->isAdmin()) {
            // Staff always land in /admin — never follow a storefront intended URL.
            $request->session()->forget('url.intended');

            return $request->wantsJson()
                ? new JsonResponse(['two_factor' => false], 200)
                : redirect()->route('admin.dashboard');
        }

        // Shoppers never follow an /admin intended URL into the atelier.
        $intended = $request->session()->get('url.intended');
        $intendedPath = is_string($intended) ? (parse_url($intended, PHP_URL_PATH) ?? '') : '';

        if ($intendedPath === '/admin' || str_starts_with($intendedPath, '/admin/')) {
            $request->session()->forget('url.intended');
        }

        return $request->wantsJson()
            ? new JsonResponse(['two_factor' => false], 200)
            : redirect()->intended(route('account.index'));
    }
}
