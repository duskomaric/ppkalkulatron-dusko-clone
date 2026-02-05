<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class AdminMiddleware
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = auth()->user();

        if (! $user) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        // 1. Admins have full access
        if ($user->isAdmin()) {
            return $next($request);
        }

        // 2. Allow users to edit/view their own profile
        if ($request->is('api/v1/users/*')) {
            $userId = $request->route('user');
            // Check if $userId is numeric ID or the User model (if route model binding is used)
            $id = is_object($userId) ? $userId->id : $userId;
            
            if ($user->id == $id) {
                return $next($request);
            }
        }

        // 3. Allow users to view/edit companies they belong to
        if ($request->is('api/v1/companies/*')) {
            $companyParam = $request->route('company');
            // Check if $companyParam is the Company model
            if (is_object($companyParam) && $user->canAccessCompany($companyParam)) {
                return $next($request);
            }
            
            // If it's just an ID/slug, we might need to fetch it or check relation
            if (is_string($companyParam) || is_numeric($companyParam)) {
                $company = \App\Models\Company::where('id', $companyParam)
                    ->orWhere('slug', $companyParam)
                    ->first();
                if ($company && $user->canAccessCompany($company)) {
                    return $next($request);
                }
            }
        }

        return response()->json([
            'message' => 'Access denied.',
            'errors' => [
                'resource' => ['Admin access required.']
            ]
        ], 403);
    }
}
