/**
 * =====================================================
 * Supabase Client Configuration
 * =====================================================
 * Provides configured Supabase clients for different contexts:
 * - Browser client (client components)
 * - Server client (server components)
 * - Admin client (API routes with elevated permissions)
 * =====================================================
 */

import { createBrowserClient, createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// =====================================================
// Environment Variables Validation
// =====================================================

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables. Please check your .env.local file.'
  );
}

// =====================================================
// Browser Client (Client Components)
// =====================================================

/**
 * Creates a Supabase client for use in client components.
 * This client respects Row Level Security (RLS) policies.
 *
 * Usage:
 * ```typescript
 * 'use client';
 * import { createBrowserSupabaseClient } from '@/lib/supabase/client';
 *
 * const supabase = createBrowserSupabaseClient();
 * const { data, error } = await supabase.from('organizations').select('*');
 * ```
 */
export function createBrowserSupabaseClient() {
  return createBrowserClient<Database>(supabaseUrl!, supabaseAnonKey!);
}

// =====================================================
// Server Client (Server Components & API Routes)
// =====================================================

/**
 * Creates a Supabase client for use in server components and API routes.
 * This client respects Row Level Security (RLS) policies.
 *
 * IMPORTANT: This must be called within the request context to access cookies.
 *
 * Usage in Server Component:
 * ```typescript
 * import { createServerSupabaseClient } from '@/lib/supabase/client';
 *
 * const supabase = createServerSupabaseClient();
 * const { data, error } = await supabase.from('organizations').select('*');
 * ```
 *
 * Usage in API Route:
 * ```typescript
 * import { createServerSupabaseClient } from '@/lib/supabase/client';
 *
 * export async function GET(request: Request) {
 *   const supabase = createServerSupabaseClient();
 *   // ... your logic
 * }
 * ```
 */
export async function createServerSupabaseClient() {
  const { cookies } = await import('next/headers');
  const cookieStore = await cookies();

  return createServerClient<Database>(
    supabaseUrl!,
    supabaseAnonKey!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch (error) {
            // Cookie setting might fail in Server Components
            // This is okay as it will be retried in middleware
          }
        },
        remove(name: string, options: any) {
          try {
            cookieStore.set({ name, value: '', ...options });
          } catch (error) {
            // Cookie removal might fail in Server Components
          }
        },
      },
    }
  );
}

// =====================================================
// Admin Client (Service Role - Bypasses RLS)
// =====================================================

/**
 * Creates a Supabase client with service role permissions.
 * This client BYPASSES all Row Level Security (RLS) policies.
 *
 * WARNING: Only use this in secure server-side contexts!
 * NEVER expose this client to the browser.
 *
 * Use cases:
 * - Admin operations that need to bypass RLS
 * - Background jobs and cron tasks
 * - Data migrations and seeding
 * - System-level operations
 *
 * Usage in API Route:
 * ```typescript
 * import { createAdminSupabaseClient } from '@/lib/supabase/client';
 *
 * export async function POST(request: Request) {
 *   const supabase = createAdminSupabaseClient();
 *
 *   // This bypasses RLS - use with caution!
 *   const { data, error } = await supabase
 *     .from('organizations')
 *     .select('*');
 *
 *   return Response.json({ data });
 * }
 * ```
 */
export function createAdminSupabaseClient() {
  if (!supabaseServiceRoleKey) {
    throw new Error(
      'SUPABASE_SERVICE_ROLE_KEY is not set. This is required for admin operations.'
    );
  }

  if (typeof window !== 'undefined') {
    throw new Error(
      'Admin client should never be used in the browser! This is a security risk.'
    );
  }

  return createClient<Database>(supabaseUrl!, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

// =====================================================
// Utility Functions
// =====================================================

/**
 * Gets the current authenticated user from the Supabase client.
 *
 * Usage:
 * ```typescript
 * const supabase = createServerSupabaseClient();
 * const user = await getCurrentUser(supabase);
 *
 * if (!user) {
 *   return Response.json({ error: 'Unauthorized' }, { status: 401 });
 * }
 * ```
 */
export async function getCurrentUser(supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>) {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  return user;
}

/**
 * Gets the current session from the Supabase client.
 *
 * Usage:
 * ```typescript
 * const supabase = createServerSupabaseClient();
 * const session = await getCurrentSession(supabase);
 * ```
 */
export async function getCurrentSession(supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>) {
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error || !session) {
    return null;
  }

  return session;
}

/**
 * Checks if the current user is authenticated.
 *
 * Usage:
 * ```typescript
 * const supabase = createServerSupabaseClient();
 * const isAuthenticated = await isUserAuthenticated(supabase);
 * ```
 */
export async function isUserAuthenticated(
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>
): Promise<boolean> {
  const user = await getCurrentUser(supabase);
  return user !== null;
}

/**
 * Type guard to check if an error is a Supabase error.
 */
export function isSupabaseError(error: any): error is { message: string; code?: string } {
  return error && typeof error === 'object' && 'message' in error;
}

/**
 * Formats a Supabase error into a user-friendly message.
 */
export function formatSupabaseError(error: any): string {
  if (!isSupabaseError(error)) {
    return 'An unexpected error occurred';
  }

  // Map common error codes to user-friendly messages
  const errorMessages: Record<string, string> = {
    '23505': 'A record with this information already exists',
    '23503': 'This operation would violate data integrity',
    '42501': 'You do not have permission to perform this action',
    PGRST116: 'No rows found',
    PGRST301: 'You do not have permission to access this resource',
  };

  if (error.code && errorMessages[error.code]) {
    return errorMessages[error.code];
  }

  return error.message || 'An error occurred';
}

// =====================================================
// Export Types
// =====================================================

export type SupabaseClient = ReturnType<typeof createBrowserSupabaseClient>;
export type SupabaseServerClient = Awaited<ReturnType<typeof createServerSupabaseClient>>;
export type SupabaseAdminClient = ReturnType<typeof createAdminSupabaseClient>;
