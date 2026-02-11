<?php

namespace App\Http\Middleware;

use App\Models\Company;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class SetCurrentCompanyMiddleware
{
    /**
     * Verify that the authenticated user has access to the company.
     * Route model binding will resolve the company before this middleware runs.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $company = $request->route('company');

        if ($company instanceof Company && ! auth()->user()?->canAccessCompany($company)) {
            return response()->json([
                'message' => 'Access denied.',
                'errors' => [
                    'resource' => ['You do not have permission to access this resource.']
                ]
            ], 403);
        }

        return $next($request);
    }
}
