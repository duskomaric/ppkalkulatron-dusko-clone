<?php

use App\Http\Middleware\SetCurrentCompanyMiddleware;
use App\Http\Middleware\AdminMiddleware;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Validation\ValidationException;
use Illuminate\Auth\Access\AuthorizationException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Symfony\Component\HttpKernel\Exception\MethodNotAllowedHttpException;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;
use Illuminate\Http\Request;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->alias([
            'company' => SetCurrentCompanyMiddleware::class,
            'admin' => AdminMiddleware::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        // Validation errors (422)
        $exceptions->render(function (ValidationException $e, Request $request) {
            if ($request->is('api/*')) {
                return response()->json([
                    'message' => 'Dati podaci su bili nevažeći.',
                    'errors' => $e->errors(),
                ], 422);
            }
        });

        // Authentication errors (401)
        $exceptions->render(function (AuthenticationException $e, Request $request) {
            if ($request->is('api/*')) {
                return response()->json([
                    'message' => 'Unauthenticated.',
                    'errors' => [
                        'auth' => ['Authentication required. Please provide a valid token.']
                    ]
                ], 401);
            }
        });

        // Authorization errors (403)
        $exceptions->render(function (AuthorizationException $e, Request $request) {
            if ($request->is('api/*')) {
                return response()->json([
                    'message' => 'Forbidden.',
                    'errors' => [
                        'authorization' => ['You do not have permission to perform this action.']
                    ]
                ], 403);
            }
        });

        // Access denied errors (403)
        $exceptions->render(function (AccessDeniedHttpException $e, Request $request) {
            if ($request->is('api/*')) {
                return response()->json([
                    'message' => 'Forbidden.',
                    'errors' => [
                        'access' => ['Access denied.']
                    ]
                ], 403);
            }
        });

        // Not found errors (404)
        $exceptions->render(function (NotFoundHttpException $e, Request $request) {
            if ($request->is('api/*')) {
                return response()->json([
                    'message' => 'Record not found.',
                    'errors' => [
                        'resource' => ['The requested resource was not found.']
                    ]
                ], 404);
            }
        });

        // Method not allowed errors (405)
        $exceptions->render(function (MethodNotAllowedHttpException $e, Request $request) {
            if ($request->is('api/*')) {
                return response()->json([
                    'message' => 'Method not allowed.',
                    'errors' => [
                        'method' => ['The HTTP method is not allowed for this endpoint.']
                    ]
                ], 405);
            }
        });

        // Generic server errors (500)
        $exceptions->render(function (\Throwable $e, Request $request) {
            if ($request->is('api/*')) {
                // In production, don't expose detailed error information
                $shouldExposeErrorDetails = config('app.debug');

                $response = [
                    'message' => $shouldExposeErrorDetails ? $e->getMessage() : 'Server error.',
                    'errors' => $shouldExposeErrorDetails ? [
                        'exception' => get_class($e),
                        'file' => $e->getFile(),
                        'line' => $e->getLine(),
                    ] : [
                        'server' => ['An internal server error occurred.']
                    ]
                ];

                return response()->json($response, 500);
            }
        });
    })->create();
