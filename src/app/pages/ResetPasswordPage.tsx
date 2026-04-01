import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import { Eye, EyeOff, Leaf, Loader2, CheckCircle, AlertTriangle, Lock } from "lucide-react";
import { supabase, isSupabaseConfigured } from "../utils/supabase";
import { ConfigError } from "../components/ui/config-error";

type PageState = "loading" | "ready" | "success" | "error" | "invalid";

export function ResetPasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [pageState, setPageState] = useState<PageState>("loading");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check if supabase is configured
  if (!isSupabaseConfigured) {
    return <ConfigError />;
  }

  // Handle Supabase recovery tokens from URL
  useEffect(() => {
    const handleRecoveryToken = async () => {
      // Check for tokens in hash (Supabase default) or query params
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const accessToken = hashParams.get("access_token") || searchParams.get("access_token");
      const refreshToken = hashParams.get("refresh_token") || searchParams.get("refresh_token");
      const type = hashParams.get("type") || searchParams.get("type");

      // If we have recovery tokens, set the session
      if (accessToken && refreshToken && type === "recovery") {
        try {
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (error) {
            console.error("[v0] Failed to set session:", error.message);
            setPageState("invalid");
            setError("This password reset link is invalid or has expired.");
          } else {
            setPageState("ready");
          }
        } catch (err) {
          console.error("[v0] Error setting session:", err);
          setPageState("invalid");
          setError("An error occurred while verifying your reset link.");
        }
      } else {
        // No tokens - check if user already has a session (came from email link)
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          setPageState("ready");
        } else {
          setPageState("invalid");
          setError("No password reset token found. Please request a new reset link.");
        }
      }
    };

    handleRecoveryToken();
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({ password });

      if (error) {
        setError(error.message);
        setLoading(false);
      } else {
        setPageState("success");
        // Redirect to login after short delay
        setTimeout(() => {
          navigate("/auth?tab=login");
        }, 3000);
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
      setLoading(false);
    }
  };

  // Loading state
  if (pageState === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-[#0D1F18]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-[#2F8F6B] mx-auto mb-3" />
          <p className="text-sm text-slate-600 dark:text-slate-300">Verifying reset link...</p>
        </div>
      </div>
    );
  }

  // Invalid/expired token state
  if (pageState === "invalid" || pageState === "error") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-[#0D1F18] p-6">
        <div className="w-full max-w-md bg-white dark:bg-[#132B23] rounded-2xl p-8 text-center shadow-lg border border-red-200 dark:border-red-900/50">
          <div className="mx-auto mb-4 w-14 h-14 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
            <AlertTriangle className="w-7 h-7 text-red-600 dark:text-red-400" />
          </div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
            Invalid Reset Link
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-300 mb-6">
            {error || "This password reset link is invalid or has expired."}
          </p>
          <Link
            to="/auth?tab=login"
            className="inline-flex items-center justify-center w-full py-3 rounded-xl text-white font-semibold"
            style={{ background: "linear-gradient(135deg, #0F3D2E 0%, #2F8F6B 100%)" }}
          >
            Back to Login
          </Link>
        </div>
      </div>
    );
  }

  // Success state
  if (pageState === "success") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-[#0D1F18] p-6">
        <div className="w-full max-w-md bg-white dark:bg-[#132B23] rounded-2xl p-8 text-center shadow-lg border border-[#2F8F6B]/20">
          <div className="mx-auto mb-4 w-14 h-14 rounded-full bg-[#E6F4EE] dark:bg-[#1E3B34] flex items-center justify-center">
            <CheckCircle className="w-7 h-7 text-[#2F8F6B]" />
          </div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
            Password Reset Successful
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-300 mb-6">
            Your password has been updated. You will be redirected to the login page shortly.
          </p>
          <Link
            to="/auth?tab=login"
            className="inline-flex items-center justify-center w-full py-3 rounded-xl text-white font-semibold"
            style={{ background: "linear-gradient(135deg, #0F3D2E 0%, #2F8F6B 100%)" }}
          >
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  // Ready state - show form
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-[#0D1F18] p-6">
      <div className="w-full max-w-md">
        {/* Logo */}
        <Link to="/" className="flex items-center justify-center gap-2 mb-8">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-[#0F3D2E]">
            <Leaf className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl text-[#0F3D2E] dark:text-[#BEEBD7]" style={{ fontFamily: "'Manrope', sans-serif", fontWeight: 800 }}>
            SkillSeed
          </span>
        </Link>

        {/* Form card */}
        <div className="bg-white dark:bg-[#132B23] rounded-2xl p-8 shadow-lg border border-slate-200 dark:border-[#1E3B34]">
          <div className="text-center mb-6">
            <div className="mx-auto mb-4 w-12 h-12 rounded-xl bg-[#E6F4EE] dark:bg-[#1E3B34] flex items-center justify-center">
              <Lock className="w-6 h-6 text-[#2F8F6B]" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-1">
              Set New Password
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Enter your new password below.
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-xl text-sm bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                New Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Min. 8 characters"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full px-4 py-3 pr-10 rounded-xl text-sm border border-slate-200 dark:border-[#1E3B34] bg-white dark:bg-[#0D1F18] text-slate-900 dark:text-white outline-none focus:border-[#2F8F6B] dark:focus:border-[#6DD4A8]"
                  required
                  minLength={8}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Confirm Password
              </label>
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Confirm your password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl text-sm border border-slate-200 dark:border-[#1E3B34] bg-white dark:bg-[#0D1F18] text-slate-900 dark:text-white outline-none focus:border-[#2F8F6B] dark:focus:border-[#6DD4A8]"
                required
                minLength={8}
              />
            </div>

            <button
              type="submit"
              disabled={loading || !password || !confirmPassword}
              className="w-full py-3.5 rounded-xl text-white font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
              style={{ background: "linear-gradient(135deg, #0F3D2E 0%, #2F8F6B 100%)" }}
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Reset Password"}
            </button>
          </form>

          <p className="text-center text-xs text-slate-500 dark:text-slate-400 mt-4">
            Remember your password?{" "}
            <Link to="/auth?tab=login" className="text-[#2F8F6B] font-semibold">
              Log in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
