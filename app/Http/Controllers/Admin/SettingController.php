<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Services\StoreSettings;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class SettingController extends Controller
{
    public function edit(StoreSettings $settings): Response
    {
        return Inertia::render('admin/settings', [
            'settings' => $settings->editable(),
        ]);
    }

    public function update(Request $request, StoreSettings $settings): RedirectResponse
    {
        $rules = [];

        foreach (array_keys(StoreSettings::DEFAULTS) as $key) {
            $rules[$key] = ['nullable', 'string', 'max:2000'];
        }

        $data = $request->validate($rules);
        $settings->update($data);
        Inertia::flash('toast', ['type' => 'success', 'message' => 'Store settings saved.']);

        return back();
    }
}
