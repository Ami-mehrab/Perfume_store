<?php

namespace App\Http\Controllers\Admin;

use App\Enums\OrderStatus;
use App\Enums\PaymentStatus;
use App\Enums\RefundStatus;
use App\Enums\ReturnStatus;
use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\Refund;
use App\Models\ReturnRequest;
use App\Support\Money;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class OrderController extends Controller
{
    public function index(Request $request): Response
    {
        $orders = Order::query()
            ->when($request->string('q')->toString(), function ($query, string $search): void {
                $query->where(function ($inner) use ($search): void {
                    $inner->where('number', 'like', '%'.$search.'%')
                        ->orWhere('email', 'like', '%'.$search.'%')
                        ->orWhere('customer_name', 'like', '%'.$search.'%');
                });
            })
            ->when($request->filled('status'), fn ($query) => $query->where('status', $request->string('status')->toString()))
            ->latest('placed_at')
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('admin/orders/index', [
            'orders' => $orders,
            'filters' => [
                'q' => $request->string('q')->toString(),
                'status' => $request->string('status')->toString(),
            ],
            'statuses' => collect(OrderStatus::cases())->map->value,
        ]);
    }

    public function show(Order $order): Response
    {
        $order->load('items', 'payments', 'returns', 'refunds');

        return Inertia::render('admin/orders/show', [
            'order' => [
                ...$order->toPublicArray(),
                'id' => $order->id,
                'user_id' => $order->user_id,
                'payments' => $order->payments,
                'returns' => $order->returns,
                'refunds' => $order->refunds,
            ],
            'statuses' => collect(OrderStatus::cases())->map(fn (OrderStatus $status): array => [
                'value' => $status->value,
                'label' => $status->label(),
            ]),
            'paymentStatuses' => collect(PaymentStatus::cases())->map(fn (PaymentStatus $status): array => [
                'value' => $status->value,
                'label' => $status->label(),
            ]),
        ]);
    }

    public function update(Request $request, Order $order): RedirectResponse
    {
        $data = $request->validate([
            'status' => ['required', Rule::enum(OrderStatus::class)],
            'payment_status' => ['required', Rule::enum(PaymentStatus::class)],
        ]);

        $order->update($data);
        $order->refresh();

        if ($order->status === OrderStatus::Cancelled) {
            $order->restoreStock();
        }

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Order updated.']);

        return back();
    }

    public function destroy(Order $order): RedirectResponse
    {
        if ($order->stock_restored_at === null && in_array($order->status, [OrderStatus::Pending, OrderStatus::Confirmed, OrderStatus::Processing], true)) {
            $order->restoreStock();
        }

        $order->delete();
        Inertia::flash('toast', ['type' => 'success', 'message' => 'Order deleted.']);

        return to_route('admin.orders.index');
    }

    public function returns(): Response
    {
        return Inertia::render('admin/returns', [
            'returns' => ReturnRequest::query()->with('order:id,number,tracking_token,email')->latest()->paginate(20),
            'statuses' => collect(ReturnStatus::cases())->map->value,
        ]);
    }

    public function updateReturn(Request $request, ReturnRequest $returnRequest): RedirectResponse
    {
        $data = $request->validate([
            'status' => ['required', Rule::enum(ReturnStatus::class)],
            'admin_note' => ['nullable', 'string', 'max:2000'],
        ]);

        $returnRequest->update($data);

        return back();
    }

    public function destroyReturn(ReturnRequest $returnRequest): RedirectResponse
    {
        $returnRequest->delete();
        Inertia::flash('toast', ['type' => 'success', 'message' => 'Return request deleted.']);

        return back();
    }

    public function storeRefund(Request $request, Order $order): RedirectResponse
    {
        $data = $request->validate([
            'amount' => ['required', 'numeric', 'min:0.01'],
            'notes' => ['nullable', 'string', 'max:2000'],
            'return_request_id' => ['nullable', 'exists:return_requests,id'],
        ]);

        $amount = Money::toCents($data['amount']);

        if ($amount > $order->total_cents) {
            return back()->withErrors(['amount' => 'A refund cannot exceed the order total.']);
        }

        Refund::query()->create([
            'order_id' => $order->id,
            'return_request_id' => $data['return_request_id'] ?? null,
            'amount_cents' => $amount,
            'status' => RefundStatus::Completed,
            'method' => $order->payment_method->value,
            'notes' => trim(($data['notes'] ?? '')."\nRecorded in the store. Issue the gateway refund from the SSLCOMMERZ merchant panel when the payment was taken online."),
        ]);

        $refunded = (int) $order->refunds()->sum('amount_cents');
        $order->update([
            'payment_status' => $refunded >= $order->total_cents
                ? PaymentStatus::Refunded
                : PaymentStatus::PartiallyRefunded,
        ]);

        if (! empty($data['return_request_id'])) {
            ReturnRequest::query()->whereKey($data['return_request_id'])->update([
                'status' => ReturnStatus::Refunded,
            ]);
        }

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Refund recorded.']);

        return back();
    }
}
