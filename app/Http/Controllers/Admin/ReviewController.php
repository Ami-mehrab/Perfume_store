<?php

namespace App\Http\Controllers\Admin;

use App\Enums\ReviewStatus;
use App\Http\Controllers\Controller;
use App\Models\Review;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class ReviewController extends Controller
{
    public function index(Request $request): Response
    {
        $status = $request->string('status')->toString();

        $query = Review::query()
            ->with([
                'product:id,name,slug',
                'user:id,name,email',
            ])
            ->latest();

        if (in_array($status, array_column(ReviewStatus::cases(), 'value'), true)) {
            $query->where('status', $status);
        }

        return Inertia::render('admin/reviews', [
            'reviews' => $query->paginate(20)->withQueryString(),
            'filters' => [
                'status' => $status !== '' ? $status : 'all',
            ],
            'statuses' => array_map(
                fn (ReviewStatus $case): string => $case->value,
                ReviewStatus::cases(),
            ),
        ]);
    }

    public function update(Request $request, Review $review): RedirectResponse
    {
        $data = $request->validate([
            'status' => ['required', Rule::enum(ReviewStatus::class)],
            'is_featured' => ['nullable', 'boolean'],
        ]);

        $status = ReviewStatus::from($data['status']);
        $featured = $request->boolean('is_featured');

        if ($status !== ReviewStatus::Approved) {
            $featured = false;
        }

        $review->update([
            'status' => $status,
            'is_featured' => $featured,
        ]);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Review updated.']);

        return back();
    }

    public function destroy(Review $review): RedirectResponse
    {
        $review->delete();
        Inertia::flash('toast', ['type' => 'success', 'message' => 'Review deleted.']);

        return back();
    }
}
