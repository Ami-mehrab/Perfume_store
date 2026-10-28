<?php

namespace App\Http\Controllers\Store;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Services\SslCommerzGateway;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Inertia\Inertia;

class PaymentController extends Controller
{
    public function __construct(private readonly SslCommerzGateway $gateway) {}

    public function success(Request $request, Order $order): RedirectResponse
    {
        $this->assertTransaction($request, $order);

        return $this->settle($request, $order);
    }

    public function ipn(Request $request, Order $order): Response
    {
        $this->assertTransaction($request, $order);
        $this->settle($request, $order, false);

        return response('OK');
    }

    public function fail(Request $request, Order $order): RedirectResponse
    {
        $this->assertTransaction($request, $order);
        $this->gateway->fail($order, 'fail');

        return redirect()->route('orders.confirmation', $order);
    }

    public function cancel(Request $request, Order $order): RedirectResponse
    {
        $this->assertTransaction($request, $order);
        $this->gateway->fail($order, 'cancel');

        return redirect()->route('orders.confirmation', $order);
    }

    private function assertTransaction(Request $request, Order $order): void
    {
        $tranId = (string) $request->input('tran_id', '');

        if ($tranId !== '' && $tranId !== $order->number) {
            abort(404);
        }
    }

    private function settle(Request $request, Order $order, bool $redirect = true): RedirectResponse
    {
        $validationId = (string) $request->input('val_id', '');
        $accepted = false;

        if ($validationId !== '' && $this->gateway->configured()) {
            $validation = $this->gateway->validate($validationId);
            $accepted = is_array($validation) && $this->gateway->accept($order, $validationId, $validation);
        }

        session()->forget('checkout.idempotency_key');

        if (! $accepted) {
            Inertia::flash('toast', [
                'type' => 'error',
                'message' => 'Payment was not confirmed. If money left your account, it will not be treated as paid until SSLCOMMERZ validates it.',
            ]);
        }

        if (! $redirect) {
            return redirect()->route('orders.confirmation', $order);
        }

        return redirect()->route('orders.confirmation', $order);
    }
}
