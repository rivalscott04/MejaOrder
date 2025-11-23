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
        
        if ($origin) {
            // Check if origin is in allowed list
            if (in_array($origin, $allowedOrigins)) {
                $allowedOrigin = $origin;
            } else {
                // Check if origin matches domain pattern (e.g., *.rivaldev.site)
                $requestDomain = parse_url($origin, PHP_URL_HOST);
                
                if ($requestDomain) {
                    foreach ($allowedOrigins as $allowed) {
                        $allowedDomain = parse_url($allowed, PHP_URL_HOST);
                        
                        if ($allowedDomain) {
                            // Extract base domain (e.g., rivaldev.site from devorder.rivaldev.site)
                            $requestBase = $this->getBaseDomain($requestDomain);
                            $allowedBase = $this->getBaseDomain($allowedDomain);
                            
                            // If base domains match, allow it (handles subdomains)
                            if ($requestBase === $allowedBase) {
                                $allowedOrigin = $origin;
                                break;
                            }
                        }
                    }
                }
            }
        }
        
        // Fallback: if no match found but we have allowed origins, use first one
        if (!$allowedOrigin && !empty($allowedOrigins)) {
            $allowedOrigin = $allowedOrigins[0];
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
        $response->header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin, X-CSRF-TOKEN');
        $response->header('Access-Control-Allow-Credentials', 'true');
        $response->header('Access-Control-Max-Age', '86400');
        $response->header('Access-Control-Expose-Headers', 'Authorization');

        return $response;
    }
    
    /**
     * Extract base domain from a domain string.
     * Example: devorder.rivaldev.site -> rivaldev.site
     */
    private function getBaseDomain(string $domain): string
    {
        $parts = explode('.', $domain);
        if (count($parts) >= 2) {
            // Return last two parts (domain.tld)
            return implode('.', array_slice($parts, -2));
        }
        return $domain;
    }
}

