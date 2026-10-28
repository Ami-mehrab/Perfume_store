<?php

namespace App\Http\Controllers\Admin;

use App\Enums\OrderStatus;
use App\Enums\PaymentStatus;
use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\ReturnRequest;
use App\Models\User;
use App\Services\StoreSettings;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function __invoke(StoreSettings $settings): Response
    {
        return Inertia::render('admin/dashboard', [
            'stats' => [
                'orders' => Order::query()->count(),
                'revenue_cents' => (int) Order::query()->where('payment_status', PaymentStatus::Paid)->sum('total_cents'),
                'pending_orders' => Order::query()->where('status', OrderStatus::Pending)->count(),
                'customers' => User::query()->where('role', 'customer')->count(),
                'products' => Product::query()->count(),
                'low_stock' => ProductVariant::query()->where('stock', '<=', (int) $settings->get('low_stock_threshold'))->count(),
                'open_returns' => ReturnRequest::query()->whereIn('status', ['requested', 'approved'])->count(),
            ],
            'recentOrders' => Order::query()->latest('placed_at')->limit(6)->get(['id', 'number', 'tracking_token', 'customer_name', 'total_cents', 'status', 'payment_status', 'placed_at']),
        ]);
    }
}
