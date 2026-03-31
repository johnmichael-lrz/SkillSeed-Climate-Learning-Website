import { useEffect, useState } from 'react';
import { User, Session, AuthError } from '@supabase/supabase-js';
import { supabase } from '../utils/supabase';

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
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
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

  const signInWithGoogle = async (): Promise<{ error: AuthError | null }> => {
    // Google blocks OAuth screens inside iframes/webviews ("This content is blocked").
    // Use `skipBrowserRedirect` so we can open the provider URL in a real tab.
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=/dashboard`,
        skipBrowserRedirect: true,
      },
    });

    if (!error && data?.url) {
      if (window.self !== window.top) {
        // Embedded preview: open provider flow in a new tab.
        const w = window.open(data.url, "_blank", "noopener,noreferrer");
        // If popups are blocked, fall back to same-frame navigation (may be blocked by Google).
        if (!w) window.location.href = data.url;
      } else {
        // Normal browser: redirect in the current tab.
        window.location.href = data.url;
      }
    }

    return { error };
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
