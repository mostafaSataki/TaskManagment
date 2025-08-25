import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

// Define public routes that don't require authentication
const publicRoutes = [
  '/',
  '/login',
  '/register',
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/logout',
  '/api/health',
];

// Define protected route patterns
const protectedRoutes = [
  '/dashboard',
  '/workspace',
  '/project',
  '/profile',
  '/settings',
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if the current path is a public route
  const isPublicRoute = publicRoutes.some(route => 
    pathname === route || pathname.startsWith(route + '/')
  );

  // If it's a public route, allow access
  if (isPublicRoute) {
    return NextResponse.next();
  }

  // Check if the current path is a protected route
  const isProtectedRoute = protectedRoutes.some(route => 
    pathname.startsWith(route)
  );

  // If it's not a protected route, allow access
  if (!isProtectedRoute) {
    return NextResponse.next();
  }

  // For protected routes, check for authentication token
  const token = request.cookies.get('auth-token')?.value;

  // If no token is found, redirect to login
  if (!token) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  try {
    // Verify the JWT token
    const secret = new TextEncoder().encode(process.env.JWT_SECRET!);
    const { payload } = await jwtVerify(token, secret);

    // Token is valid, allow access
    const response = NextResponse.next();
    
    // Add user info to headers for server-side use
    response.headers.set('x-user-id', payload.userId as string);
    response.headers.set('x-user-email', payload.email as string);
    
    return response;

  } catch (error) {
    // Token is invalid or expired
    console.error('JWT verification failed:', error);
    
    // Clear the invalid token cookie and redirect to login
    const response = NextResponse.redirect(new URL('/login', request.url));
    response.cookies.delete('auth-token');
    
    return response;
  }
}

// Configure which routes the middleware should run on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};