<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\UpdateUserRoleRequest;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Symfony\Component\HttpFoundation\Response;

class UserController extends Controller
{
    public function index()
    {
        $users = User::orderBy('created_at', 'desc')->paginate(20);

        return \Inertia\Inertia::render('admin/users', [
            'users' => $users,
        ]);
    }

    public function updateRole(UpdateUserRoleRequest $request, User $user): JsonResponse
    {
        $nextRole = $request->string('role')->toString();

        if ($user->role === 'admin' && $nextRole !== 'admin') {
            if (User::where('role', 'admin')->count() <= 1) {
                abort(422, 'Cannot remove the last admin');
            }
        }

        $user->update(['role' => $nextRole]);

        return response()->json($user->refresh());
    }

    public function destroy(User $user): Response
    {
        if ($user->role === 'admin') {
            if (User::where('role', 'admin')->count() <= 1) {
                abort(422, 'Cannot remove the last admin');
            }
        }

        $user->delete();

        return response()->noContent();
    }
}
