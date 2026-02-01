<?php

namespace App\Http\Controllers\API\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\API\V1\UserResource;
use App\Models\Company;
use App\Models\User;
use Dedoc\Scramble\Attributes\BodyParameter;
use Dedoc\Scramble\Attributes\Endpoint;
use Dedoc\Scramble\Attributes\Group;
use Dedoc\Scramble\Attributes\Header;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;


#[Group('Auth', weight: 0)]
class AuthController extends Controller
{

    #[BodyParameter('email', description: 'User email', type: 'string', format: 'email', example: 'admin@admin.com')]
    #[BodyParameter('password', description: 'User password', type: 'string', format: 'password', example: 'admin')]
    #[Endpoint(operationId: 'login', title: 'Login', description: 'Login user and return token and user data')]
    #[Header('X-RateLimit-Limit', 'The amount of requests allowed per minute', type: 'int')]
    /**
     * Login
     *
     * @param \Illuminate\Http\Request $request
     * @return \Illuminate\Http\JsonResponse
     * @throws \Illuminate\Validation\ValidationException
     * @throws \Illuminate\Auth\AuthenticationException
     *
     * This method is used to authenticate a user and return a JSON response containing the user's token and user data.
     *
     * @unauthenticated
     */
    public function login(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required',
        ]);

        $user = User::where('email', $request->email)->first();

        if (! $user || ! Hash::check($request->password, $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['The provided credentials are incorrect.'],
            ]);
        }

        $user->load('companies');

        if ($user->isAdmin()) {
            $user->setRelation('companies', Company::query()->get());
        }

        return response()->json([
            'token' => $user->createToken('token')->plainTextToken,
            'user' => UserResource::make($user),
        ]);
    }
}
