<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\PreorderRequest;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class PreorderController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('admin/preorders', [
            'requests' => PreorderRequest::query()->latest()->paginate(20),
        ]);
    }

    public function update(Request $request, PreorderRequest $preorder): RedirectResponse
    {
        $data = $request->validate([
            'status' => ['required', Rule::in(['new', 'contacted'])],
        ]);

        $preorder->update(['status' => $data['status']]);

        return back();
    }

    public function destroy(PreorderRequest $preorder): RedirectResponse
    {
        $preorder->delete();
        Inertia::flash('toast', ['type' => 'success', 'message' => 'Pre-order request deleted.']);

        return back();
    }
}
