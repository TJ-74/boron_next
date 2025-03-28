import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// List of paths that are public (don't require authentication)
const publicPaths = ['/', '/login', '/pricing', '/features', '/about', '/success', '/templates'];

// List of paths that require authentication
const protectedPaths = ['/profile', '/dashboard', '/settings'];

// This function can be marked `async` if using `await` inside
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Get Firebase auth token from cookies
  const token = request.cookies.get('firebase-token')?.value || 
                request.cookies.get('__session')?.value || 
                request.cookies.get('session')?.value ||
                request.cookies.get('auth_token')?.value;

  const response = NextResponse.next();

  // Add security headers with updated CSP for Google Auth and Firebase
  const cspHeader = `
    default-src 'self';
    script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://apis.google.com https://*.googleapis.com https://accounts.google.com https://*.firebaseapp.com;
    style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
    font-src 'self' https://fonts.gstatic.com;
    img-src 'self' data: https://*.stripe.com https://*.googleapis.com https://*.google.com https://*.firebaseapp.com;
    frame-src 'self' https://js.stripe.com https://hooks.stripe.com https://accounts.google.com https://apis.google.com https://*.firebaseapp.com https://*.firebaseio.com https://boronatom.vercel.app;
    connect-src 'self' https://api.stripe.com https://*.googleapis.com https://accounts.google.com https://securetoken.googleapis.com https://*.firebaseapp.com https://*.firebaseio.com;
    media-src 'self' https://videos.pexels.com;
  `.replace(/\s{2,}/g, ' ').trim();

  // Set security headers
  response.headers.set('Content-Security-Policy', cspHeader);
  
  // Remove COOP and COEP headers as they interfere with Firebase auth popups
  response.headers.delete('Cross-Origin-Opener-Policy');
  response.headers.delete('Cross-Origin-Embedder-Policy');
  
  // Allow cross-origin resource sharing for auth
  response.headers.set('Cross-Origin-Resource-Policy', 'same-site');
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Allow public paths without authentication
  if (publicPaths.some(path => pathname === path || pathname.startsWith('/public'))) {
    return response;
  }

  // Check if the path is protected and user is not authenticated
  if (protectedPaths.some(path => pathname.startsWith(path)) && !token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // If user is authenticated and trying to access login page, redirect to profile
  if (token && pathname === '/login') {
    return NextResponse.redirect(new URL('/profile', request.url));
  }

  return response;
}

// Configure matcher to run middleware only on specific paths
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!api|_next/static|_next/image|favicon.ico|public).*)',
  ],
}; 