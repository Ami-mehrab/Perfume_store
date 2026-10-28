<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CustomerController extends Controller
{
    public function index(Request $request): Response
    {
        $customers = User::query()
            ->where('role', 'customer')
            ->withCount('orders')
            ->when($request->string('q')->toString(), function ($query, string $search): void {
                $query->where(function ($inner) use ($search): void {
                    $inner->where('name', 'like', '%'.$search.'%')
                        ->orWhere('email', 'like', '%'.$search.'%');
                });
            })
            ->latest()
            ->paginate(20)
            ->withQueryString();

        return Inertia::render('admin/customers/index', [
            'customers' => $customers,
            'filters' => ['q' => $request->string('q')->toString()],
        ]);
    }

    public function show(User $customer): Response
    {
        abort_if($customer->isAdmin(), 404);

        return Inertia::render('admin/customers/show', [
            'customer' => $customer->only(['id', 'name', 'email', 'created_at', 'email_verified_at']),
            'orders' => $customer->orders()->latest('placed_at')->get(),
            'addresses' => $customer->addresses,
        ]);
    }

    public function destroy(User $customer): RedirectResponse
    {
        abort_if($customer->isAdmin(), 404);

        $customer->delete();
        Inertia::flash('toast', ['type' => 'success', 'message' => 'Customer deleted. Their past orders stay in the order list.']);

        return to_route('admin.customers.index');
    }
}
