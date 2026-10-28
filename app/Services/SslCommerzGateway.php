<?php

namespace App\Services;

use App\Enums\OrderStatus;
use App\Enums\PaymentStatus;
use App\Models\Order;
use App\Models\Payment;
use App\Support\Money;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class SslCommerzGateway
{
    public function configured(): bool
    {
        return $this->storeId() !== '' && $this->storePassword() !== '';
    }

    /**
     * @param  array<string, string>  $customer
     */
    public function initiate(Order $order, array $customer): ?string
    {
        $payload = [
            'store_id' => $this->storeId(),
            'store_passwd' => $this->storePassword(),
            'total_amount' => Money::major($order->total_cents),
            'currency' => $order->currency_code,
            'tran_id' => $order->number,
            'success_url' => route('payments.sslcommerz.success', $order),
            'fail_url' => route('payments.sslcommerz.fail', $order),
            'cancel_url' => route('payments.sslcommerz.cancel', $order),
            'ipn_url' => route('payments.sslcommerz.ipn', $order),
            'cus_name' => $customer['name'],
            'cus_email' => $customer['email'],
            'cus_add1' => $customer['line1'],
            'cus_add2' => $customer['line2'] ?? '',
            'cus_city' => $customer['city'],
            'cus_state' => $customer['region'] ?? $customer['city'],
            'cus_postcode' => $customer['postal_code'] !== '' ? $customer['postal_code'] : '0000',
            'cus_country' => $customer['country'],
            'cus_phone' => $customer['phone'],
            'shipping_method' => 'YES',
            'product_name' => 'Aurelle perfume',
            'product_category' => 'perfume',
            'product_profile' => 'general',
            'emi_option' => 0,
        ];

        try {
            $response = Http::asForm()->timeout(20)->post($this->sessionUrl(), $payload);
        } catch (ConnectionException $exception) {
            Log::warning('SSLCOMMERZ session failed', ['message' => $exception->getMessage()]);

            return null;
        }

        /** @var array<string, mixed> $body */
        $body = $response->json() ?? [];

        if (! $response->successful() || ($body['status'] ?? null) !== 'SUCCESS') {
            Log::warning('SSLCOMMERZ session rejected', ['body' => $body]);

            return null;
        }

        $url = $body['GatewayPageURL'] ?? null;

        return is_string($url) && $url !== '' ? $url : null;
    }

    /**
     * @return array<string, mixed>|null
     */
    public function validate(string $validationId): ?array
    {
        try {
            $response = Http::timeout(20)->get($this->validationUrl(), [
                'val_id' => $validationId,
                'store_id' => $this->storeId(),
                'store_passwd' => $this->storePassword(),
                'format' => 'json',
            ]);
        } catch (ConnectionException $exception) {
            Log::warning('SSLCOMMERZ validation failed', ['message' => $exception->getMessage()]);

            return null;
        }

        if (! $response->successful()) {
            return null;
        }

        /** @var array<string, mixed> $body */
        $body = $response->json() ?? [];

        return $body;
    }

    /**
     * @param  array<string, mixed>  $validation
     */
    public function accept(Order $order, string $validationId, array $validation): bool
    {
        return DB::transaction(function () use ($order, $validationId, $validation): bool {
            /** @var Order $locked */
            $locked = Order::query()->whereKey($order->id)->lockForUpdate()->firstOrFail();

            if ($locked->payment_status === PaymentStatus::Paid) {
                return true;
            }

            if (! $this->matches($locked, $validation)) {
                Payment::query()->create([
                    'order_id' => $locked->id,
                    'gateway' => 'sslcommerz',
                    'validation_id' => $validationId,
                    'amount_cents' => $locked->total_cents,
                    'status' => PaymentStatus::Failed,
                    'payload' => $validation,
                    'processed_at' => now(),
                ]);

                return false;
            }

            $locked->update(['payment_status' => PaymentStatus::Paid]);

            Payment::query()->create([
                'order_id' => $locked->id,
                'gateway' => 'sslcommerz',
                'transaction_id' => is_string($validation['bank_tran_id'] ?? null) ? $validation['bank_tran_id'] : $locked->number,
                'validation_id' => $validationId,
                'amount_cents' => $locked->total_cents,
                'status' => PaymentStatus::Paid,
                'payload' => $validation,
                'processed_at' => now(),
            ]);

            return true;
        });
    }

    public function fail(Order $order, string $status): void
    {
        DB::transaction(function () use ($order, $status): void {
            /** @var Order $locked */
            $locked = Order::query()->whereKey($order->id)->lockForUpdate()->firstOrFail();

            if ($locked->payment_status === PaymentStatus::Paid || $locked->stock_restored_at !== null) {
                return;
            }

            $locked->update([
                'payment_status' => PaymentStatus::Failed,
                'status' => OrderStatus::Cancelled,
            ]);
            $locked->restoreStock();

            Payment::query()->create([
                'order_id' => $locked->id,
                'gateway' => 'sslcommerz',
                'amount_cents' => $locked->total_cents,
                'status' => PaymentStatus::Failed,
                'payload' => ['callback' => $status],
                'processed_at' => now(),
            ]);
        });
    }

    /**
     * @param  array<string, mixed>  $validation
     */
    public function matches(Order $order, array $validation): bool
    {
        $status = strtoupper((string) ($validation['status'] ?? ''));

        if (! in_array($status, ['VALID', 'VALIDATED'], true)) {
            return false;
        }

        if ((string) ($validation['tran_id'] ?? '') !== $order->number) {
            return false;
        }

        if (strtoupper((string) ($validation['currency_type'] ?? $validation['currency'] ?? '')) !== strtoupper($order->currency_code)) {
            return false;
        }

        $amount = $validation['amount'] ?? $validation['currency_amount'] ?? $validation['store_amount'] ?? null;

        if (! is_numeric($amount)) {
            return false;
        }

        return Money::toCents($amount) === $order->total_cents;
    }

    private function storeId(): string
    {
        return (string) config('services.sslcommerz.store_id');
    }

    private function storePassword(): string
    {
        return (string) config('services.sslcommerz.store_password');
    }

    private function sandbox(): bool
    {
        return (bool) config('services.sslcommerz.sandbox');
    }

    private function sessionUrl(): string
    {
        return $this->sandbox()
            ? 'https://sandbox.sslcommerz.com/gwprocess/v4/api.php'
            : 'https://securepay.sslcommerz.com/gwprocess/v4/api.php';
    }

    private function validationUrl(): string
    {
        return $this->sandbox()
            ? 'https://sandbox.sslcommerz.com/validator/api/validationserverAPI.php'
            : 'https://securepay.sslcommerz.com/validator/api/validationserverAPI.php';
    }
}
