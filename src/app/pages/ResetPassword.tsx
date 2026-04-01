import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router";
import { Eye, EyeOff, Loader2, Lock, CheckCircle2, AlertCircle } from "lucide-react";
import { supabase } from "../utils/supabase";

function getParamsFromHash(hash: string): URLSearchParams {
  const h = hash.startsWith("#") ? hash.slice(1) : hash;
  return new URLSearchParams(h);
}

export function ResetPassword() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const tokenInfo = useMemo(() => {
    const qs = new URLSearchParams(window.location.search);
    const hs = getParamsFromHash(window.location.hash);
    return {
      accessToken: qs.get("access_token") || hs.get("access_token"),
      refreshToken: qs.get("refresh_token") || hs.get("refresh_token"),
      type: qs.get("type") || hs.get("type"),
      // Supabase may also send code flows; we handle those by relying on an existing session.
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function ensureSession() {
      setError(null);
      // If tokens are present, set the session so updateUser works.
      if (tokenInfo.accessToken && tokenInfo.refreshToken) {
        const { error: sessionErr } = await supabase.auth.setSession({
          access_token: tokenInfo.accessToken,
          refresh_token: tokenInfo.refreshToken,
        });
        if (!cancelled && sessionErr) {
          setError("Reset link is invalid or expired. Please request a new one.");
        }
      } else {
        // If no tokens, user may already have a session; that's fine.
        const { data } = await supabase.auth.getSession();
        if (!cancelled && !data.session) {
          setError("Reset link is invalid or expired. Please request a new one.");
        }
      }
    }
    ensureSession();
    return () => {
      cancelled = true;
    };
  }, [tokenInfo.accessToken, tokenInfo.refreshToken]);

  const canSubmit =
    !loading &&
    password.length >= 8 &&
    password === confirm &&
    !done &&
    error === null;

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setLoading(true);
    setError(null);
    try {
      const { error: updateErr } = await supabase.auth.updateUser({ password });
      if (updateErr) {
        setError(updateErr.message || "Failed to update password.");
      } else {
        setDone(true);
        // Optional: sign out to ensure fresh login, then send them to auth.
        await supabase.auth.signOut();
        setTimeout(() => navigate("/auth?tab=login", { replace: true }), 900);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F9FAFB] dark:bg-[#0D1F18] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md bg-white dark:bg-[#132B23] border border-gray-100 dark:border-white/10 rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.08)] p-7">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-10 h-10 rounded-xl bg-[#E6F4EE] dark:bg-white/10 flex items-center justify-center">
            <Lock className="w-5 h-5 text-[#2F8F6B] dark:text-emerald-200" />
          </div>
          <h1 className="text-lg font-bold text-[#0F3D2E] dark:text-emerald-50">
            Reset your password
          </h1>
        </div>
        <p className="text-sm text-[#4b5563] dark:text-emerald-100/70 mb-6">
          Choose a new password (minimum 8 characters).
        </p>

        {error && (
          <div className="mb-5 rounded-xl border border-red-200 bg-red-50 dark:bg-red-950/30 dark:border-red-400/30 p-4 text-sm text-red-700 dark:text-red-200 flex gap-2">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <div>
              <div className="font-semibold">Can’t reset password</div>
              <div className="opacity-90">{error}</div>
              <div className="mt-2">
                <Link className="underline" to="/auth?tab=login">
                  Back to sign in
                </Link>
              </div>
            </div>
          </div>
        )}

        {done ? (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 dark:bg-emerald-950/30 dark:border-emerald-400/30 p-4 text-sm text-emerald-800 dark:text-emerald-200 flex gap-2">
            <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
            <div>
              <div className="font-semibold">Password updated</div>
              <div className="opacity-90">Redirecting you to sign in…</div>
            </div>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#374151] dark:text-emerald-100/80 mb-2">
                New password
              </label>
              <div className="relative">
                <input
                  type={show ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#0D1F18] px-4 py-3 text-sm text-[#0F3D2E] dark:text-emerald-50 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#2F8F6B]/35"
                  placeholder="Enter a new password"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShow((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-md text-gray-500 dark:text-emerald-100/70 hover:text-[#0F3D2E] dark:hover:text-emerald-50"
                  aria-label={show ? "Hide password" : "Show password"}
                >
                  {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#374151] dark:text-emerald-100/80 mb-2">
                Confirm password
              </label>
              <input
                type={show ? "text" : "password"}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className="w-full rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#0D1F18] px-4 py-3 text-sm text-[#0F3D2E] dark:text-emerald-50 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#2F8F6B]/35"
                placeholder="Re-enter your new password"
                autoComplete="new-password"
              />
              {confirm.length > 0 && password !== confirm && (
                <p className="mt-2 text-xs text-red-600 dark:text-red-200/90">
                  Passwords do not match.
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={!canSubmit}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-white bg-[#0F3D2E] hover:bg-[#2F8F6B] disabled:opacity-50 disabled:hover:bg-[#0F3D2E] transition-colors"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              Update password
            </button>

            <div className="text-center">
              <Link to="/auth?tab=login" className="text-sm text-[#2F8F6B] hover:underline">
                Back to sign in
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

