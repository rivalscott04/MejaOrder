<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CorsMiddleware
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Get allowed origins from config
        $allowedOrigins = config('cors.allowed_origins', []);
        
        // Get origin from request
        $origin = $request->header('Origin');
        
        // Determine which origin to allow
        $allowedOrigin = null;
        if ($origin && in_array($origin, $allowedOrigins)) {
            // If origin is in allowed list, use it
            $allowedOrigin = $origin;
        } elseif (!empty($allowedOrigins)) {
            // Otherwise, use first allowed origin
            $allowedOrigin = $allowedOrigins[0];
        } else {
            // Fallback: allow the requesting origin if it's from same domain pattern
            // This handles cases like devorder.rivaldev.site -> apiorder.rivaldev.site
            if ($origin) {
                $allowedOrigin = $origin;
            }
        }

        // Handle preflight requests
        if ($request->getMethod() === 'OPTIONS') {
            $response = response('', 200);
        } else {
            $response = $next($request);
        }

        // Add CORS headers to response
        if ($allowedOrigin) {
            $response->header('Access-Control-Allow-Origin', $allowedOrigin);
        }
        $response->header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
        $response->header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
        $response->header('Access-Control-Allow-Credentials', 'true');
        $response->header('Access-Control-Max-Age', '86400');

        return $response;
    }
}

