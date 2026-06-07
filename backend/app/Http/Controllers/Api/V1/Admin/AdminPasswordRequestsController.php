<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Models\PasswordRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminPasswordRequestsController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = PasswordRequest::with('user')->latest();

        if ($status = $request->query('status', 'pending')) {
            $query->where('status', $status);
        }

        return response()->json($query->paginate((int) $request->query('per_page', 50)));
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'email' => ['required', 'email', 'max:255'],
            'user_id' => ['nullable', 'integer', 'exists:users,id'],
        ]);

        return response()->json(PasswordRequest::create($data), 201);
    }

    public function resolve(Request $request, PasswordRequest $passwordRequest): JsonResponse
    {
        $action = $request->input('action', 'approve'); // approve or reject

        if ($action === 'approve') {
            $user = $passwordRequest->user;
            if ($user) {
                $newPassword = \Illuminate\Support\Str::random(8);
                $user->password = \Illuminate\Support\Facades\Hash::make($newPassword);
                $user->save();

                try {
                    \Illuminate\Support\Facades\Mail::to($user->email)->send(new \App\Mail\PasswordResetApprovedMail($newPassword));
                } catch (\Exception $e) {
                    \Illuminate\Support\Facades\Log::error("Failed to send password reset email to {$user->email}: " . $e->getMessage());
                }
            }
            
            $passwordRequest->update([
                'status' => 'approved',
                'resolved_at' => now(),
            ]);
        } else {
            $passwordRequest->update([
                'status' => 'rejected',
                'resolved_at' => now(),
            ]);
        }

        return response()->json($passwordRequest->fresh()->load('user'));
    }
}
