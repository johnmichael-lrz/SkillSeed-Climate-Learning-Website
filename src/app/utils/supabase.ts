import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

// Important: do not throw on missing env vars. We want the app to render a friendly
// configuration error (demo-safe) instead of crashing at import time.
const clientUrl = isSupabaseConfigured ? (supabaseUrl as string) : "http://localhost:54321";
const clientKey = isSupabaseConfigured ? (supabaseAnonKey as string) : "invalid-anon-key";

export const supabase = createClient(clientUrl, clientKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

export type SafeQueryResult<T> = {
  data: T | null;
  error: unknown | null;
  userMessage: string | null;
};

export async function safeQuery<T>(fn: () => Promise<T>): Promise<SafeQueryResult<T>> {
  if (!isSupabaseConfigured) {
    return {
      data: null,
      error: new Error("Supabase is not configured"),
      userMessage:
        "Supabase isn’t configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY, then reload.",
    };
  }

  try {
    const data = await fn();
    return { data, error: null, userMessage: null };
  } catch (error) {
    const message = typeof error === "object" && error && "message" in error ? String((error as any).message) : "";
    const lower = message.toLowerCase();
    const userMessage =
      lower.includes("permission") || lower.includes("rls") || lower.includes("not allowed") || lower.includes("unauthorized")
        ? "You don’t have permission to do that. Try signing in again."
        : message || "Something went wrong. Please try again.";
    return { data: null, error, userMessage };
  }
}

export default supabase;
