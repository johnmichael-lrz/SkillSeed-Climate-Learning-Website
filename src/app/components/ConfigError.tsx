import { Link } from "react-router";
import { AlertTriangle, ExternalLink } from "lucide-react";

export function ConfigError() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center bg-[#F9FAFB] dark:bg-[#0D1F18] px-4 py-10">
      <div className="w-full max-w-xl rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#132B23] shadow-[0_10px_40px_rgba(0,0,0,0.08)] p-7">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-400/10 border border-amber-200 dark:border-amber-400/20 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-amber-700 dark:text-amber-200" />
          </div>
          <div className="flex-1">
            <h1 className="text-lg font-bold text-[#0F3D2E] dark:text-emerald-50">
              Supabase isn’t configured
            </h1>
            <p className="mt-1 text-sm text-[#4b5563] dark:text-emerald-100/70">
              This app needs `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` to connect to the backend.
            </p>

            <div className="mt-4 rounded-xl border border-gray-200 dark:border-white/10 bg-[#F9FAFB] dark:bg-[#0D1F18] p-4">
              <div className="text-xs font-semibold text-[#374151] dark:text-emerald-100/80 mb-1">
                Fix (local dev)
              </div>
              <ol className="text-sm text-[#374151] dark:text-emerald-50/90 list-decimal pl-4 space-y-1">
                <li>Create a `.env.local` file in the project root.</li>
                <li>Add `VITE_SUPABASE_URL=...` and `VITE_SUPABASE_ANON_KEY=...`.</li>
                <li>Restart the dev server.</li>
              </ol>
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-3">
              <Link
                to="/"
                className="inline-flex items-center justify-center rounded-xl px-4 py-2.5 text-sm font-semibold text-white bg-[#0F3D2E] hover:bg-[#2F8F6B] transition-colors"
              >
                Back to Home
              </Link>
              <a
                href="https://supabase.com/docs/guides/getting-started"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold border border-gray-200 dark:border-white/10 text-[#0F3D2E] dark:text-emerald-50 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
              >
                Supabase docs <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

