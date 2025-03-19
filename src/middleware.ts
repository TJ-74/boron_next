import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// This function can be marked `async` if using `await` inside
export function middleware(request: NextRequest) {
  // Get the path the user is trying to access
  const path = request.nextUrl.pathname;
  
  // Define public and protected paths
  const isPublicPath = path === '/login';
  const isProtectedPath = path === '/profile';
  
  // Get auth token from cookie
  const token = request.cookies.get('auth_token')?.value;
  const isAuthenticated = !!token;
  
  // Redirects based on authentication state
  if (isPublicPath && isAuthenticated) {
    // Redirect authenticated users away from login page
    return NextResponse.redirect(new URL('/profile', request.url));
  }
  
  if (isProtectedPath && !isAuthenticated) {
    // Redirect unauthenticated users away from protected pages
    return NextResponse.redirect(new URL('/login', request.url));
  }
  
  // Allow the request to proceed normally
  return NextResponse.next();
}

// Configure matcher to run middleware only on specific paths
export const config = {
  matcher: ['/profile', '/login']
}; 