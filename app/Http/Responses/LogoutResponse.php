<?php

namespace App\Http\Responses;

use Illuminate\Http\JsonResponse;
use Laravel\Fortify\Contracts\LogoutResponse as LogoutResponseContract;
use Symfony\Component\HttpFoundation\Response;

class LogoutResponse implements LogoutResponseContract
{
    public function toResponse($request): Response
    {
        // Always land on the public storefront after sign-out — never bounce
        // into the opposite panel via a stale intended URL.
        $request->session()->forget('url.intended');

        return $request->wantsJson()
            ? new JsonResponse('', 204)
            : redirect()->to('/');
    }
}
