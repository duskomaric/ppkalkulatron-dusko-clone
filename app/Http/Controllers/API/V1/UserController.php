<?php

namespace App\Http\Controllers\API\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\API\V1\StoreUserRequest;
use App\Http\Requests\API\V1\UpdateUserRequest;
use App\Http\Resources\API\V1\UserResource;
use App\Models\User;
use Dedoc\Scramble\Attributes\Endpoint;
use Dedoc\Scramble\Attributes\Group;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

#[Group('Users', weight: 1)]
class UserController extends Controller
{
    #[Endpoint(operationId: 'getUsers', title: 'Get users', description: 'Get all users')]
    public function index(): AnonymousResourceCollection
    {
        $users = User::with('companies')->get();

        return UserResource::collection($users);
    }

    #[Endpoint(operationId: 'storeUser', title: 'Store user', description: 'Create a new user')]
    public function store(StoreUserRequest $request): UserResource
    {
        $validated = $request->validated();
        $validated['password'] = bcrypt($validated['password']);

        // Set default role if not provided
        $validated['role'] = $validated['role'] ?? 'user';

        $user = User::create($validated);

        return new UserResource($user);
    }

    #[Endpoint(operationId: 'showUser', title: 'Show user', description: 'Get user by ID')]
    public function show(User $user): UserResource
    {
        $user->load('companies');

        return new UserResource($user);
    }

    #[Endpoint(operationId: 'updateUser', title: 'Update user', description: 'Update user by ID')]
    public function update(UpdateUserRequest $request, User $user): UserResource
    {
        $validated = $request->validated();

        if (isset($validated['password'])) {
            $validated['password'] = bcrypt($validated['password']);
        }

        $user->update($validated);

        return new UserResource($user);
    }

    #[Endpoint(operationId: 'destroyUser', title: 'Destroy user', description: 'Delete user by ID')]
    public function destroy(User $user): \Illuminate\Http\JsonResponse
    {
        $user->delete();

        return response()->json(['message' => 'User deleted successfully']);
    }
}
