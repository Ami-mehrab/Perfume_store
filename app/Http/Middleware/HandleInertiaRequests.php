<?php

namespace App\Http\Middleware;

use App\Models\FragranceCollection;
use App\Models\User;
use App\Services\CartService;
use App\Services\StoreSettings;
use App\Services\WishlistService;
use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that's loaded on the first page visit.
     *
     * @see https://inertiajs.com/server-side-setup#root-template
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determines the current asset version.
     *
     * @see https://inertiajs.com/asset-versioning
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @see https://inertiajs.com/shared-data
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        $user = $request->user();

        return [
            ...parent::share($request),
            'name' => config('app.name'),
            'auth' => [
                'user' => $user instanceof User ? [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'role' => $user->isAdmin() ? 'admin' : 'customer',
                    'email_verified_at' => $user->email_verified_at?->toIso8601String(),
                ] : null,
            ],
            'sidebarOpen' => ! $request->hasCookie('sidebar_state') || $request->cookie('sidebar_state') === 'true',
            'store' => fn () => app(StoreSettings::class)->publicPayload(),
            'cartCount' => fn () => app(CartService::class)->count(),
            'cart' => fn () => app(CartService::class)->payload(),
            'locale' => fn (): string => app()->getLocale(),
            'wishlistIds' => fn () => app(WishlistService::class)->ids(),
            'sections' => fn () => FragranceCollection::query()
                ->where('is_active', true)
                ->whereNotNull('audience')
                ->orderBy('sort_order')
                ->get()
                ->map(fn (FragranceCollection $section): array => [
                    'name' => $section->name,
                    'name_bn' => $section->name_bn,
                    'slug' => $section->slug,
                    'audience' => $section->audience,
                    'image' => $section->imageUrl(),
                ])
                ->all(),
        ];
    }
}
