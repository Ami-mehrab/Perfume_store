<?php

use App\Http\Middleware\HandleAppearance;
use App\Http\Middleware\HandleInertiaRequests;
use App\Http\Middleware\SetStoreLocale;
use App\Models\User;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Middleware\AddLinkHeadersForPreloadedAssets;
use Illuminate\Http\Request;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->encryptCookies(except: ['appearance', 'sidebar_state']);
        $middleware->validateCsrfTokens(except: [
            'payments/sslcommerz/*',
        ]);

        $middleware->alias([
            'admin' => \App\Http\Middleware\EnsureAdmin::class,
            'admin.guest' => \App\Http\Middleware\EnsureAdminGuest::class,
            'customer' => \App\Http\Middleware\EnsureCustomer::class,
            'block.starter.settings' => \App\Http\Middleware\BlockStarterKitSettings::class,
        ]);

        $middleware->redirectGuestsTo(function (Request $request) {
            // Staff area → /admin/login. Customer-protected pages → /customer-account.
            if ($request->is('admin', 'admin/*')) {
                return route('admin.login');
            }

            return route('account.index');
        });

        // URL only — never side-effects here.
        // Authenticated staff → /admin; authenticated shoppers → /customer-account.
        $middleware->redirectUsersTo(function (Request $request) {
            $user = $request->user();

            if ($user instanceof User && $user->isAdmin()) {
                return route('admin.dashboard');
            }

            return route('account.index');
        });

        $middleware->web(append: [
            SetStoreLocale::class,
            HandleAppearance::class,
            HandleInertiaRequests::class,
            AddLinkHeadersForPreloadedAssets::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->shouldRenderJsonWhen(
            fn (Request $request) => $request->is('api/*') || $request->expectsJson(),
        );
    })->create();
