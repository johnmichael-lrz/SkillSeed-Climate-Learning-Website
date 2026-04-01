import { AlertTriangle, Settings } from "lucide-react";

interface ConfigErrorProps {
  title?: string;
  message?: string;
}

export function ConfigError({
  title = "Configuration Required",
  message = "The database connection is not configured. Please add the required environment variables.",
}: ConfigErrorProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-[#0D1F18] p-6">
      <div className="max-w-md w-full bg-white dark:bg-[#132B23] rounded-2xl border border-amber-200 dark:border-amber-900/50 p-8 text-center shadow-lg">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-amber-100 dark:bg-amber-900/30">
          <AlertTriangle className="h-7 w-7 text-amber-600 dark:text-amber-400" />
        </div>
        <h2 className="mb-2 text-lg font-bold text-slate-900 dark:text-white">
          {title}
        </h2>
        <p className="mb-6 text-sm text-slate-600 dark:text-slate-300">
          {message}
        </p>
        <div className="rounded-xl bg-slate-100 dark:bg-[#0D1F18] p-4 text-left">
          <div className="flex items-center gap-2 mb-3">
            <Settings className="h-4 w-4 text-slate-500 dark:text-slate-400" />
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Required Environment Variables
            </span>
          </div>
          <code className="block text-xs text-slate-600 dark:text-slate-400 font-mono space-y-1">
            <div className="bg-slate-200 dark:bg-[#1E3B34] px-2 py-1 rounded">VITE_SUPABASE_URL</div>
            <div className="bg-slate-200 dark:bg-[#1E3B34] px-2 py-1 rounded mt-1">VITE_SUPABASE_ANON_KEY</div>
          </code>
        </div>
        <p className="mt-4 text-xs text-slate-500 dark:text-slate-400">
          Add these to your <code className="bg-slate-100 dark:bg-[#1E3B34] px-1.5 py-0.5 rounded">.env.local</code> file and restart the development server.
        </p>
      </div>
    </div>
  );
}
