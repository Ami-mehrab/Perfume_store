<?php

namespace App\Services;

use App\Models\Product;
use App\Models\User;
use App\Models\Wishlist;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;

class WishlistService
{
    public function token(): string
    {
        $token = session('wishlist_token');

        if (! is_string($token) || $token === '') {
            $token = Str::random(40);
            session(['wishlist_token' => $token]);
        }

        return $token;
    }

    /**
     * @return array<int, int>
     */
    public function ids(): array
    {
        return $this->query()->pluck('product_id')->map(fn (mixed $id): int => (int) $id)->all();
    }

    public function toggle(Product $product): bool
    {
        $existing = $this->query()->where('product_id', $product->id)->first();

        if ($existing !== null) {
            $existing->delete();

            return false;
        }

        $userId = Auth::id();

        Wishlist::query()->create([
            'user_id' => $userId ? (int) $userId : null,
            'guest_token' => $userId ? null : $this->token(),
            'product_id' => $product->id,
        ]);

        return true;
    }

    public function mergeForUser(User $user): void
    {
        $token = session('wishlist_token');

        if (! is_string($token) || $token === '') {
            return;
        }

        $guestItems = Wishlist::query()->where('guest_token', $token)->get();

        foreach ($guestItems as $item) {
            $owned = Wishlist::query()->where('user_id', $user->id)->where('product_id', $item->product_id)->exists();

            if ($owned) {
                $item->delete();

                continue;
            }

            $item->update([
                'user_id' => $user->id,
                'guest_token' => null,
            ]);
        }
    }

    /**
     * @return \Illuminate\Database\Eloquent\Builder<Wishlist>
     */
    private function query()
    {
        $userId = Auth::id();

        if ($userId) {
            return Wishlist::query()->where('user_id', $userId);
        }

        $token = session('wishlist_token');

        if (! is_string($token) || $token === '') {
            return Wishlist::query()->whereRaw('1 = 0');
        }

        return Wishlist::query()->where('guest_token', $token);
    }
}
