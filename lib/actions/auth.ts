"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/client";
import {
  loginSchema,
  signupSchema,
  type LoginInput,
  type SignupInput,
} from "@/lib/validations/auth";

/**
 * =====================================================
 * Authentication Server Actions
 * =====================================================
 */

interface ActionResponse {
  success: boolean;
  error?: string;
  field?: string;
}

/**
 * Sign in a user with email and password
 */
export async function signIn(data: LoginInput): Promise<ActionResponse> {
  try {
    // Validate input
    const validatedData = loginSchema.parse(data);

    const supabase = await createServerSupabaseClient();

    // Sign in with Supabase Auth
    const { data: authData, error: authError } =
      await supabase.auth.signInWithPassword({
        email: validatedData.email,
        password: validatedData.password,
      });

    if (authError) {
      console.error("Sign in error:", authError);

      // Map Supabase errors to user-friendly messages
      if (authError.message.includes("Invalid login credentials")) {
        return {
          success: false,
          error: "Invalid email or password",
        };
      }

      if (authError.message.includes("Email not confirmed")) {
        return {
          success: false,
          error: "Please verify your email before signing in",
        };
      }

      return {
        success: false,
        error: authError.message || "Failed to sign in",
      };
    }

    if (!authData.user) {
      return {
        success: false,
        error: "Failed to sign in",
      };
    }
       //console.log("Supabase session:", session)
      //console.log("Cookies:", request.headers.get("cookie")
    // Log auth session for debugging///////////////////////
    console.log("✅ Auth Session Created:", {
      user_id: authData.user.id,
      email: authData.user.email,
      user_metadata: authData.user.user_metadata,
      timestamp: new Date().toISOString(),
    });
    
    if (authData.session) {
      console.log("🔐 Session Details:", {
        access_token: authData.session.access_token.substring(0, 20) + "...",
        refresh_token: authData.session.refresh_token?.substring(0, 20) + "...",
        expires_at: new Date(authData.session.expires_at! * 1000).toISOString(),
      });
    }

    // Check if user profile exists in users table
    const { data: profile, error: profileError } = await supabase
      .from("users")
      .select("id")
      .eq("id", authData.user.id)
      .single();

    // If profile doesn't exist, create it
    if (profileError && profileError.code === "PGRST116") {
      const { error: insertError } = await supabase.from("users").insert({
        id: authData.user.id,
        email: authData.user.email!,
        full_name: authData.user.user_metadata.full_name || null,
        avatar_url: authData.user.user_metadata.avatar_url || null,
      } as any);

      if (insertError) {
        console.error("Error creating user profile:", String(insertError));
      }
    }

    revalidatePath("/", "layout");

    return {
      success: true,
    };
  } catch (error: any) {
    console.error("Sign in action error:", String(error));

    if (error.name === "ZodError") {
      return {
        success: false,
        error: error.errors[0].message,
        field: error.errors[0].path[0],
      };
    }

    return {
      success: false,
      error: "An unexpected error occurred",
    };
  }
}

/**
 * Sign up a new user
 */
export async function signUp(data: SignupInput): Promise<ActionResponse> {
  try {
    // Validate input
    const validatedData = signupSchema.parse(data);

    const supabase = await createServerSupabaseClient();

    // Sign up with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: validatedData.email,
      password: validatedData.password,
      options: {
        data: {
          full_name: validatedData.name,
        },
        emailRedirectTo: `${
          process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
        }/api/auth/callback`,
      },
    });

    if (authError) {
      console.error("Sign up error:", authError.message);

      // Map Supabase errors to user-friendly messages
      if (authError.message.includes("already registered")) {
        return {
          success: false,
          error: "An account with this email already exists",
          field: "email",
        };
      }

      return {
        success: false,
        error: authError.message || "Failed to create account",
      };
    }

    if (!authData.user) {
      return {
        success: false,
        error: "Failed to create account",
      };
    }

    // Note: public.users profile is created automatically by the
    // `handle_new_user` DB trigger (on_auth_user_created) whenever
    // a row is inserted into auth.users. No manual insert needed here —
    // doing it again would cause a duplicate key violation.

    revalidatePath("/", "layout");

    return {
      success: true,
    };
  } catch (error: any) {
    console.error("Sign up action error:", String(error));

    if (error.name === "ZodError") {
      return {
        success: false,
        error: error.errors[0].message,
        field: error.errors[0].path[0],
      };
    }

    return {
      success: false,
      error: "An unexpected error occurred",
    };
  }
}

/**
 * Sign out the current user
 */
export async function signOut(): Promise<ActionResponse> {
  try {
    const supabase = await createServerSupabaseClient();

    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error("Sign out error:", error);
      return {
        success: false,
        error: "Failed to sign out",
      };
    }

    revalidatePath("/", "layout");
    redirect("/login");
  } catch (error) {
    console.error("Sign out action error:", error);
    return {
      success: false,
      error: "An unexpected error occurred",
    };
  }
}

/**
 * Get the current authenticated user
 */
export async function getCurrentUser() {
  try {
    const supabase = await createServerSupabaseClient();

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      return null;
    }

    // Fetch full user profile
    const { data: profile } = await supabase
      .from("users")
      .select("*")
      .eq("id", user.id)
      .single();

    return profile;
  } catch (error) {
    console.error("Get current user error:", error);
    return null;
  }
}
