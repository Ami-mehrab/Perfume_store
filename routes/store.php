<?php

use App\Http\Controllers\Admin\CustomerController;
use App\Http\Controllers\Admin\DashboardController;
use App\Http\Controllers\Admin\InventoryController;
use App\Http\Controllers\Admin\MerchandisingController;
use App\Http\Controllers\Admin\OrderController;
use App\Http\Controllers\Admin\ProductController;
use App\Http\Controllers\Admin\ReviewController as AdminReviewController;
use App\Http\Controllers\Admin\SettingController;
use App\Http\Controllers\Store\ReviewController;
use App\Http\Controllers\Store\AccountController;
use App\Http\Controllers\Store\LocaleController;
use App\Http\Controllers\Store\CartController;
use App\Http\Controllers\Admin\PreorderController as AdminPreorderController;
use App\Http\Controllers\Store\CheckoutController;
use App\Http\Controllers\Store\PreorderController;
use App\Http\Controllers\Store\PaymentController;
use App\Http\Controllers\Store\SitemapController;
use App\Http\Controllers\Store\StorefrontController;
use App\Http\Controllers\Store\WishlistController;
use App\Models\User;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Laravel\Fortify\Features;

Route::post('/locale', [LocaleController::class, 'update'])->name('locale.update');
Route::get('/', [StorefrontController::class, 'home'])->name('home');
Route::get('/shop', [StorefrontController::class, 'shop'])->name('shop');
Route::get('/collections/{collection}', [StorefrontController::class, 'collection'])->name('collections.show');
Route::get('/brands', [StorefrontController::class, 'brands'])->name('brands.index');
Route::get('/brands/{brand}', [StorefrontController::class, 'brand'])->name('brands.show');
Route::get('/products/{product}', [StorefrontController::class, 'product'])->name('products.show');
Route::post('/products/{product}/reviews', [ReviewController::class, 'store'])
    ->middleware(['auth', 'customer'])
    ->name('products.reviews.store');
Route::get('/sitemap.xml', SitemapController::class)->name('sitemap');

Route::get('/cart', [CartController::class, 'show'])->name('cart.show');
Route::post('/cart', [CartController::class, 'store'])->name('cart.store');
Route::patch('/cart/items/{item}', [CartController::class, 'update'])->name('cart.items.update');
Route::delete('/cart/items/{item}', [CartController::class, 'destroy'])->name('cart.items.destroy');
Route::post('/cart/coupon', [CartController::class, 'coupon'])->name('cart.coupon');
Route::delete('/cart/coupon', [CartController::class, 'removeCoupon'])->name('cart.coupon.destroy');
Route::post('/cart/shipping', [CartController::class, 'shipping'])->name('cart.shipping');

Route::get('/wishlist', [WishlistController::class, 'index'])->name('wishlist.index');
Route::post('/wishlist', [WishlistController::class, 'store'])->name('wishlist.store');
Route::delete('/wishlist/{product}', [WishlistController::class, 'destroy'])->name('wishlist.destroy');

Route::get('/checkout', [CheckoutController::class, 'show'])->name('checkout.show');
Route::post('/checkout', [CheckoutController::class, 'store'])->name('checkout.store');
Route::post('/preorders', [PreorderController::class, 'store'])->middleware('throttle:10,1')->name('preorders.store');

Route::get('/orders/track', [AccountController::class, 'showTracker'])->name('orders.track');
Route::post('/orders/track', [AccountController::class, 'track'])->middleware('throttle:10,1')->name('orders.track.store');
Route::get('/orders/{order}', [AccountController::class, 'confirmation'])->name('orders.confirmation');

Route::match(['get', 'post'], '/payments/sslcommerz/{order}/success', [PaymentController::class, 'success'])->name('payments.sslcommerz.success');
Route::match(['get', 'post'], '/payments/sslcommerz/{order}/fail', [PaymentController::class, 'fail'])->name('payments.sslcommerz.fail');
Route::match(['get', 'post'], '/payments/sslcommerz/{order}/cancel', [PaymentController::class, 'cancel'])->name('payments.sslcommerz.cancel');
Route::match(['get', 'post'], '/payments/sslcommerz/{order}/ipn', [PaymentController::class, 'ipn'])->name('payments.sslcommerz.ipn');

Route::redirect('/email/verify', '/customer-account');

// Customer panel (shopper-only).
Route::get('/customer-account', [AccountController::class, 'index'])->name('account.index');
Route::post('/customer-account/login', [AccountController::class, 'login'])->middleware('throttle:10,1')->name('account.login');

Route::middleware(['auth', 'customer'])->prefix('customer-account')->group(function () {
    Route::get('/orders', [AccountController::class, 'orders'])->name('account.orders');
    Route::get('/orders/{number}', [AccountController::class, 'show'])->name('account.orders.show');
    Route::post('/orders/{number}/returns', [AccountController::class, 'requestReturn'])->name('account.returns.store');
    Route::get('/addresses', [AccountController::class, 'addresses'])->name('account.addresses');
    Route::post('/addresses', [AccountController::class, 'storeAddress'])->name('account.addresses.store');
    Route::patch('/addresses/{address}', [AccountController::class, 'updateAddress'])->name('account.addresses.update');
    Route::delete('/addresses/{address}', [AccountController::class, 'destroyAddress'])->name('account.addresses.destroy');
});

// Legacy /account aliases — same handlers so old cached JS POSTs still save.
Route::redirect('/account', '/customer-account');
Route::get('/account/orders', fn () => redirect()->route('account.orders'));
Route::get('/account/orders/{number}', fn (string $number) => redirect()->route('account.orders.show', $number));
Route::get('/account/addresses', fn () => redirect()->route('account.addresses'));
Route::post('/account/login', [AccountController::class, 'login'])->middleware('throttle:10,1');
Route::middleware(['auth', 'customer'])->group(function () {
    Route::post('/account/orders/{number}/returns', [AccountController::class, 'requestReturn']);
    Route::post('/account/addresses', [AccountController::class, 'storeAddress']);
    Route::patch('/account/addresses/{address}', [AccountController::class, 'updateAddress']);
    Route::delete('/account/addresses/{address}', [AccountController::class, 'destroyAddress']);
});

Route::middleware('admin.guest')->get('/admin/login', function () {
    return Inertia::render('auth/login', [
        'canResetPassword' => Features::enabled(Features::resetPasswords()),
        'status' => session('status'),
    ]);
})->name('admin.login');

Route::middleware(['auth'])->group(function () {
    Route::get('dashboard', function () {
        $user = auth()->user();

        if ($user instanceof User && $user->isAdmin()) {
            return redirect()->route('admin.dashboard');
        }

        return redirect()->route('account.index');
    })->name('dashboard');
});

Route::middleware(['auth', 'admin'])->prefix('admin')->name('admin.')->group(function () {
    Route::get('/', DashboardController::class)->name('dashboard');

    Route::get('/products', [ProductController::class, 'index'])->name('products.index');
    Route::get('/products/create', [ProductController::class, 'create'])->name('products.create');
    Route::post('/products', [ProductController::class, 'store'])->name('products.store');
    Route::get('/products/{product}/edit', [ProductController::class, 'edit'])->name('products.edit');
    Route::put('/products/{product}', [ProductController::class, 'update'])->name('products.update');
    Route::delete('/products/{product}', [ProductController::class, 'destroy'])->name('products.destroy');

    Route::get('/inventory', [InventoryController::class, 'index'])->name('inventory.index');
    Route::patch('/inventory/{variant}', [InventoryController::class, 'update'])->name('inventory.update');

    Route::get('/reviews', [AdminReviewController::class, 'index'])->name('reviews.index');
    Route::patch('/reviews/{review}', [AdminReviewController::class, 'update'])->name('reviews.update');
    Route::delete('/reviews/{review}', [AdminReviewController::class, 'destroy'])->name('reviews.destroy');

    Route::get('/preorders', [AdminPreorderController::class, 'index'])->name('preorders.index');
    Route::patch('/preorders/{preorder}', [AdminPreorderController::class, 'update'])->name('preorders.update');
    Route::delete('/preorders/{preorder}', [AdminPreorderController::class, 'destroy'])->name('preorders.destroy');

    // Bind by id so admin URLs never collide with public /orders/{tracking_token}.
    Route::get('/orders', [OrderController::class, 'index'])->name('orders.index');
    Route::get('/orders/{order:id}', [OrderController::class, 'show'])->name('orders.show');
    Route::patch('/orders/{order:id}', [OrderController::class, 'update'])->name('orders.update');
    Route::delete('/orders/{order:id}', [OrderController::class, 'destroy'])->name('orders.destroy');
    Route::post('/orders/{order:id}/refunds', [OrderController::class, 'storeRefund'])->name('refunds.store');
    Route::get('/returns', [OrderController::class, 'returns'])->name('returns.index');
    Route::patch('/returns/{returnRequest}', [OrderController::class, 'updateReturn'])->name('returns.update');
    Route::delete('/returns/{returnRequest}', [OrderController::class, 'destroyReturn'])->name('returns.destroy');

    Route::get('/customers', [CustomerController::class, 'index'])->name('customers.index');
    Route::get('/customers/{customer}', [CustomerController::class, 'show'])->name('customers.show');
    Route::delete('/customers/{customer}', [CustomerController::class, 'destroy'])->name('customers.destroy');

    Route::get('/brands', [MerchandisingController::class, 'brands'])->name('brands.index');
    Route::post('/brands', [MerchandisingController::class, 'storeBrand'])->name('brands.store');
    Route::put('/brands/{brand}', [MerchandisingController::class, 'updateBrand'])->name('brands.update');
    Route::delete('/brands/{brand}', [MerchandisingController::class, 'destroyBrand'])->name('brands.destroy');

    Route::get('/collections', [MerchandisingController::class, 'collections'])->name('collections.index');
    Route::post('/collections', [MerchandisingController::class, 'storeCollection'])->name('collections.store');
    Route::put('/collections/{collection}', [MerchandisingController::class, 'updateCollection'])->name('collections.update');
    Route::delete('/collections/{collection}', [MerchandisingController::class, 'destroyCollection'])->name('collections.destroy');

    Route::get('/coupons', [MerchandisingController::class, 'coupons'])->name('coupons.index');
    Route::post('/coupons', [MerchandisingController::class, 'storeCoupon'])->name('coupons.store');
    Route::put('/coupons/{coupon}', [MerchandisingController::class, 'updateCoupon'])->name('coupons.update');
    Route::delete('/coupons/{coupon}', [MerchandisingController::class, 'destroyCoupon'])->name('coupons.destroy');

    Route::get('/banners', [MerchandisingController::class, 'banners'])->name('banners.index');
    Route::post('/banners', [MerchandisingController::class, 'storeBanner'])->name('banners.store');
    Route::put('/banners/{banner}', [MerchandisingController::class, 'updateBanner'])->name('banners.update');
    Route::delete('/banners/{banner}', [MerchandisingController::class, 'destroyBanner'])->name('banners.destroy');

    Route::get('/settings', [SettingController::class, 'edit'])->name('settings.edit');
    Route::put('/settings', [SettingController::class, 'update'])->name('settings.update');
});
