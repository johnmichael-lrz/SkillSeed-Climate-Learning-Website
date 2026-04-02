import { Link, useNavigate } from "react-router";
import { Eye, X } from "lucide-react";
import { useDemoMode } from "../hooks/useDemoMode";

export function DemoBanner() {
  const navigate = useNavigate();
  const { disableDemoMode } = useDemoMode();

  return (
    <div className="border-b border-slate-200/70 dark:border-[#1E3B34] bg-[#F2FBF6] dark:bg-[#0F2C22]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs sm:text-sm text-[#0F3D2E] dark:text-[#BEEBD7]">
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-white/70 dark:bg-[#132B23] border border-[#2F8F6B]/20 dark:border-[#1E3B34] text-[11px] font-semibold">
            <Eye className="w-3.5 h-3.5 text-[#2F8F6B] dark:text-[#6DD4A8]" />
            Demo mode
          </span>
          <span className="hidden sm:inline opacity-80">Browse everything. Actions require sign-in.</span>
          <span className="sm:hidden opacity-80">Read-only preview.</span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Link
            to="/auth?tab=login"
            className="inline-flex items-center justify-center px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#0F3D2E] text-white hover:bg-[#2F8F6B] transition-colors min-h-[32px]"
          >
            Sign in
          </Link>
          <button
            onClick={() => {
              disableDemoMode();
              navigate("/", { replace: true });
            }}
            className="inline-flex items-center justify-center px-2.5 py-1.5 rounded-lg text-xs font-semibold border border-slate-200 dark:border-[#1E3B34] bg-white/70 dark:bg-[#132B23] text-slate-700 dark:text-[#BEEBD7] hover:bg-white dark:hover:bg-[#17342B] transition-colors min-h-[32px]"
            aria-label="Exit demo mode"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

