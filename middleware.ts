import { type NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

/**
 * =====================================================
 * Authentication Middleware
 * =====================================================
 * Protects routes that require authentication
 * - Checks if user has valid session
 * - Redirects to /login if no session
 * - Logs auth events for debugging
 * =====================================================
 */

// Routes that require authentication
const PROTECTED_ROUTES = ['/dashboard', '/chat', '/todo']
const AUTH_ROUTES = ['/login', '/signup']

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  console.log(`🔍 [Middleware] Processing request: ${pathname}`)

  // Create Supabase client for server-side
  const supabaseClient = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          let response = NextResponse.next()
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
          return response
        },
      },
    }
  )

  try {
    // Get current session
    const { data: { session } } = await supabaseClient.auth.getSession()

    console.log(`📊 [Middleware] Session check:`, {
      pathname,
      hasSession: !!session,
      userId: session?.user.id?.substring(0, 8) + '...' || 'none',
    })

    // Check if route is protected
    const isProtectedRoute = PROTECTED_ROUTES.some(route => pathname.startsWith(route))
    const isAuthRoute = AUTH_ROUTES.some(route => pathname.startsWith(route))

    // If user is on auth route but has session, redirect to dashboard
    if (isAuthRoute && session) {
      console.log(`✅ [Middleware] User already logged in, redirecting to dashboard`)
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }

    // If route is protected but no session, redirect to login
    if (isProtectedRoute && !session) {
      console.log(`⛔ [Middleware] Protected route without session, redirecting to login`)
      return NextResponse.redirect(new URL('/login', request.url))
    }

    // Allow request to continue
    console.log(`✅ [Middleware] Access granted`)
    return NextResponse.next()
  } catch (error) {
    console.error(`❌ [Middleware] Error:`, error)
    // In case of error, allow the request to continue
    return NextResponse.next()
  }
}

// Configure which routes to run middleware on
export const config = {
  matcher: [
    // Match protected and auth routes
    '/dashboard/:path*',
    '/chat/:path*',
    '/todo/:path*',
    '/login/:path*',
    '/signup/:path*',
    // Exclude public assets
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
