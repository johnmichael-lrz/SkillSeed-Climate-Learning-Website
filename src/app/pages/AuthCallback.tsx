import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { Loader2, AlertTriangle, Leaf } from "lucide-react";
import { supabase, isSupabaseConfigured } from "../utils/supabase";
import { ConfigError } from "../components/ui/config-error";

type CallbackState = "processing" | "success" | "error";

/**
 * AuthCallback handles OAuth redirects from providers like Google.
 * It processes the auth tokens and redirects to the intended page.
 */
export function AuthCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const [state, setState] = useState<CallbackState>("processing");
  const [error, setError] = useState<string | null>(null);

  // Check if supabase is configured
  if (!isSupabaseConfigured) {
    return <ConfigError />;
  }

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Get the intended redirect destination (default to dashboard)
        const next = searchParams.get("next") || "/dashboard";

        // Supabase automatically handles the token exchange from the URL hash
        // We just need to verify the session was created
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) {
          console.error("[v0] Auth callback error:", sessionError.message);
          setError(sessionError.message);
          setState("error");
          return;
        }

        if (session) {
          setState("success");
          // Short delay to show success state, then redirect
          setTimeout(() => {
            navigate(next, { replace: true });
          }, 500);
        } else {
          // No session - might still be processing or failed
          // Wait a moment and check again
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          const { data: { session: retrySession } } = await supabase.auth.getSession();
          
          if (retrySession) {
            setState("success");
            setTimeout(() => {
              navigate(next, { replace: true });
            }, 500);
          } else {
            setError("Authentication failed. Please try again.");
            setState("error");
          }
        }
      } catch (err) {
        console.error("[v0] Unexpected auth callback error:", err);
        setError("An unexpected error occurred during authentication.");
        setState("error");
      }
    };

    handleAuthCallback();
  }, [navigate, searchParams]);

  // Processing state
  if (state === "processing") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-[#0D1F18]">
        <div className="text-center">
          <div className="mb-6 flex items-center justify-center gap-2">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-[#0F3D2E]">
              <Leaf className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl text-[#0F3D2E] dark:text-[#BEEBD7]" style={{ fontFamily: "'Manrope', sans-serif", fontWeight: 800 }}>
              SkillSeed
            </span>
          </div>
          <Loader2 className="w-8 h-8 animate-spin text-[#2F8F6B] mx-auto mb-3" />
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Completing sign in...
          </p>
        </div>
      </div>
    );
  }

  // Error state
  if (state === "error") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-[#0D1F18] p-6">
        <div className="w-full max-w-md bg-white dark:bg-[#132B23] rounded-2xl p-8 text-center shadow-lg border border-red-200 dark:border-red-900/50">
          <div className="mx-auto mb-4 w-14 h-14 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
            <AlertTriangle className="w-7 h-7 text-red-600 dark:text-red-400" />
          </div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
            Authentication Failed
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-300 mb-6">
            {error || "We could not complete the sign in process."}
          </p>
          <button
            onClick={() => navigate("/auth", { replace: true })}
            className="w-full py-3 rounded-xl text-white font-semibold"
            style={{ background: "linear-gradient(135deg, #0F3D2E 0%, #2F8F6B 100%)" }}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Success state (brief flash before redirect)
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-[#0D1F18]">
      <div className="text-center">
        <div className="mb-6 flex items-center justify-center gap-2">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-[#0F3D2E]">
            <Leaf className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl text-[#0F3D2E] dark:text-[#BEEBD7]" style={{ fontFamily: "'Manrope', sans-serif", fontWeight: 800 }}>
            SkillSeed
          </span>
        </div>
        <div className="w-8 h-8 rounded-full bg-[#E6F4EE] dark:bg-[#1E3B34] flex items-center justify-center mx-auto mb-3">
          <Loader2 className="w-4 h-4 animate-spin text-[#2F8F6B]" />
        </div>
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Sign in successful. Redirecting...
        </p>
      </div>
    </div>
  );
}
