import { useEffect, useState } from 'react';
import { User, Session, AuthError } from '@supabase/supabase-js';
import { supabase } from '../utils/supabase';
import { validateSignupForm } from '../utils/validation';

interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
}

interface SignUpData {
  email: string;
  password: string;
  fullName: string;
  region: string;
  userType: 'poster' | 'responder';
}

interface SignInData {
  email: string;
  password: string;
}

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    session: null,
    loading: true,
  });

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setAuthState({
        session,
        user: session?.user ?? null,
        loading: false,
      });
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setAuthState({
          session,
          user: session?.user ?? null,
          loading: false,
        });
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (data: SignUpData): Promise<{ error: AuthError | null }> => {
    const { email, password, fullName, region, userType } = data;

    // ── Server-side validation gateway ──
    const validationErrors = validateSignupForm({
      name: fullName,
      email,
      password,
      region,
    });
    if (Object.keys(validationErrors).length > 0) {
      const firstError = Object.values(validationErrors)[0];
      return { error: { message: firstError, name: 'AuthApiError', status: 400 } as AuthError };
    }

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName.trim(),
          region,
          user_type: userType,
        },
      },
    });

    return { error };
  };

  const signIn = async (data: SignInData): Promise<{ error: AuthError | null }> => {
    const { email, password } = data;
    
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    return { error };
  };

  const signInWithGoogle = async (): Promise<{
    error: AuthError | null;
    /** Pop-up when used from a normal tab; null if pop-up was blocked (full-page fallback) or iframe opened _blank. */
    oauthPopup: Window | null;
  }> => {
    const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent("/dashboard")}`;

    // Google blocks OAuth inside iframes; skipBrowserRedirect lets us open the provider in a real window.
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo,
        skipBrowserRedirect: true,
        queryParams: {
          prompt: "select_account",
        },
      },
    });

    if (error || !data?.url) {
      return { error, oauthPopup: null };
    }

    const url = data.url;

    // Embedded (iframe / webview): open provider in a new tab.
    if (window.self !== window.top) {
      const w = window.open(url, "_blank", "noopener,noreferrer");
      if (!w) window.location.assign(url);
      return { error: null, oauthPopup: w };
    }

    // Top-level: centered pop-up so the auth page stays visible; callback postsMessage to this window.
    const width = 500;
    const height = 720;
    const left = Math.max(0, (window.screen.width - width) / 2);
    const top = Math.max(0, (window.screen.height - height) / 2);
    const features = `width=${width},height=${height},left=${left},top=${top},scrollbars=yes,resizable=yes`;
    const popup = window.open(url, "skillseed-google-oauth", features);
    if (!popup) {
      // Pop-up blocked — same-tab redirect so sign-in still works.
      window.location.assign(url);
      return { error: null, oauthPopup: null };
    }
    popup.focus();
    return { error: null, oauthPopup: popup };
  };

  const signOut = async (): Promise<{ error: AuthError | null }> => {
    const { error } = await supabase.auth.signOut();
    return { error };
  };

  const resetPassword = async (email: string): Promise<{ error: AuthError | null }> => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    return { error };
  };

  return {
    user: authState.user,
    session: authState.session,
    loading: authState.loading,
    signUp,
    signIn,
    signInWithGoogle,
    signOut,
    resetPassword,
  };
}
