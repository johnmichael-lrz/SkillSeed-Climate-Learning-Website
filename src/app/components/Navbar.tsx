import { useState, useRef, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import { Menu, X, Sprout, ChevronDown, User, LogOut, Moon, Sun } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { useDemoMode } from "../hooks/useDemoMode";
import { useTheme } from "next-themes";
import { ThemeToggle } from "./ThemeToggle";

const navLinks = [
  { label: "Missions",     href: "/browse",    comingSoon: false },
  { label: "Community", href: "/community", comingSoon: false },
  { label: "Hands-on",   href: "/hands-on",   comingSoon: false },
  { label: "Funding",   href: "/funding",   comingSoon: false },
];

export function Navbar() {
  const { user, signOut } = useAuth();
  const { demoMode, enableDemoMode, disableDemoMode } = useDemoMode();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => setMounted(true), []);

  // Helper to get user display name from Supabase user_metadata
  const getUserName = () => {
    if (!user) return "";
    return user.user_metadata?.full_name || user.email?.split("@")[0] || "User";
  };

  // Helper to get avatar initials
  const getAvatarInitials = () => {
    const name = getUserName();
    const parts = name.split(" ");
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleLogout = () => {
    signOut();
    setDropdownOpen(false);
    navigate("/");
  };

  const handleTryDemo = () => {
    enableDemoMode();
    navigate("/browse", { replace: false });
  };

  return (
    <nav
      className="sticky top-0 z-50 bg-white/95 dark:bg-[#0D1F18]/95 backdrop-blur-sm border-b border-border dark:border-[#1E3B34] shadow-sm"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 relative">

          {/* ── Logo ── */}
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <img 
              src="/logo.png" 
              alt="SkillSeed Logo" 
              className="w-8 h-8 object-contain"
            />
            <span className="text-xl" style={{ fontFamily: "'Manrope', sans-serif", fontWeight: 800 }}>
              <span className="text-[#0F3D2E] dark:text-[#BEEBD7]">Skill</span>
              <span className="text-[#2F8F6B] dark:text-[#6DD4A8]">Seed</span>
            </span>
          </Link>

          {/* ── Center Nav (desktop) ── */}
          <div className="hidden md:flex items-center gap-1 absolute left-1/2 -translate-x-1/2">
            {navLinks.map((link) => (
              <div key={link.label} className="relative">
                {link.comingSoon ? (
                  <span className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-muted-foreground cursor-default select-none text-sm">
                    {link.label}
                    <span className="text-xs px-1.5 py-0.5 rounded-md bg-[#E6F4EE] dark:bg-[#1E3B34] text-[#2F8F6B] dark:text-[#6DD4A8] font-semibold">
                      Soon
                    </span>
                  </span>
                ) : (
                  <Link
                    to={link.href}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${
                      location.pathname === link.href
                        ? "bg-[#E6F4EE] dark:bg-[#1E3B34] text-[#0F3D2E] dark:text-[#6DD4A8] font-semibold"
                        : "text-muted-foreground hover:bg-muted dark:hover:bg-[#17342B] hover:text-foreground"
                    }`}
                  >
                    {link.label}
                  </Link>
                )}
              </div>
            ))}
          </div>

          {/* ── Right Side (desktop) ── */}
          <div className="hidden md:flex items-center gap-2">
            {mounted && <ThemeToggle />}
            {user ? (
              /* ── LOGGED IN ── */
              <>
                {/* Avatar + Dropdown */}
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className={`flex items-center gap-2 pl-1.5 pr-2.5 py-1.5 rounded-xl transition-all min-h-[44px] border-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2F8F6B] ${
                      dropdownOpen 
                        ? "border-[#2F8F6B] bg-[#E8F5EF] dark:bg-[#1E3B34]" 
                        : "border-slate-200 dark:border-[#1E3B34] hover:border-[#2F8F6B]/50 dark:hover:border-[#6DD4A8]/50"
                    }`}
                  >
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-sm bg-gradient-to-br from-[#0F3D2E] to-[#2F8F6B] font-bold">
                      {getAvatarInitials()}
                    </div>
                    <span className="text-sm font-medium text-slate-700 dark:text-[#BEEBD7]">
                      {getUserName().split(" ")[0]}
                    </span>
                    <ChevronDown className={`w-3.5 h-3.5 text-slate-400 dark:text-[#94C8AF] transition-transform ${dropdownOpen ? "rotate-180" : ""}`} />
                  </button>

                  {/* Dropdown menu */}
                  {dropdownOpen && (
                    <div className="absolute right-0 mt-2 w-56 rounded-xl overflow-hidden bg-white dark:bg-[#132B23] border border-slate-200 dark:border-[#1E3B34] shadow-lg z-[100]">
                      {/* User info */}
                      <div className="px-4 py-3.5 border-b border-slate-100 dark:border-[#1E3B34]">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white bg-gradient-to-br from-[#0F3D2E] to-[#2F8F6B] font-bold">
                            {getAvatarInitials()}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-bold text-slate-900 dark:text-[#BEEBD7] truncate">{getUserName()}</p>
                            <p className="text-xs text-slate-500 dark:text-[#94C8AF] truncate">{user.email}</p>
                          </div>
                        </div>
                      </div>

                      {/* Menu items */}
                      <div className="py-1.5">
                        {[
                          { icon: User, label: "Profile", href: "/tracker" },
                        ].map(({ icon: Icon, label, href }) => (
                          <Link
                            key={label}
                            to={href}
                            onClick={() => setDropdownOpen(false)}
                            className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 dark:text-[#BEEBD7] hover:bg-slate-50 dark:hover:bg-[#1E3B34] transition-colors"
                          >
                            <Icon className="w-4 h-4 text-slate-400 dark:text-[#94C8AF]" />
                            {label}
                          </Link>
                        ))}
                      </div>

                      {/* Logout */}
                      <div className="border-t border-slate-100 dark:border-[#1E3B34] py-1.5">
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-left"
                        >
                          <LogOut className="w-4 h-4" />
                          Log Out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              /* ── LOGGED OUT ── */
              <>
                <button
                  onClick={demoMode ? () => { disableDemoMode(); navigate("/", { replace: true }); } : handleTryDemo}
                  className="min-h-[40px] px-4 py-2 rounded-lg text-sm font-semibold border border-slate-200 dark:border-[#1E3B34] bg-white/70 dark:bg-[#132B23] text-slate-700 dark:text-[#BEEBD7] hover:bg-white dark:hover:bg-[#17342B] transition-colors"
                >
                  {demoMode ? "Exit demo" : "Try demo"}
                </button>
                <button
                  onClick={() => navigate("/auth?tab=login")}
                  className="min-h-[40px] px-4 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:bg-muted dark:hover:bg-[#17342B] transition-colors"
                >
                  Log In
                </button>
                <button
                  onClick={() => navigate("/auth?tab=signup")}
                  className="min-h-[40px] px-5 py-2 rounded-lg text-white text-sm font-semibold bg-[linear-gradient(135deg,#0F3D2E_0%,#2F8F6B_100%)] shadow-sm shadow-[#2F8F6B]/25 hover:shadow-md hover:shadow-[#2F8F6B]/30 transition-all flex items-center gap-1.5 active:scale-[0.98]"
                >
                  <Sprout className="w-3.5 h-3.5" />
                  Sign Up
                </button>
              </>
            )}
          </div>

          {/* ── Mobile controls ── */}
          <div className="md:hidden flex items-center gap-1">
            {mounted && <ThemeToggle />}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="p-2 rounded-lg dark:!text-emerald-200"
              style={{ color: "#0F3D2E" }}
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* ── Mobile Menu ── */}
      {mobileOpen && (
        <div className="md:hidden border-t border-gray-100 dark:border-[#1E3B34] bg-white dark:bg-[#0D1F18] px-4 py-4 space-y-1">
          {navLinks.map((link) => (
            <div key={link.label}>
              {link.comingSoon ? (
                <span className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-gray-400 text-sm">
                  {link.label}
                  <span className="text-xs px-1.5 py-0.5 rounded-full"
                    style={{ background: "#E6F4EE", color: "#2F8F6B", fontSize: "10px", fontWeight: 600 }}>
                    Soon
                  </span>
                </span>
              ) : (
                <Link
                  to={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="block px-3 py-2.5 rounded-lg text-sm"
                  style={{ color: location.pathname === link.href ? "#0F3D2E" : "#374151", background: location.pathname === link.href ? "#E6F4EE" : "transparent", fontWeight: location.pathname === link.href ? 600 : 400 }}
                >
                  {link.label}
                </Link>
              )}
            </div>
          ))}

          <div className="pt-3 flex flex-col gap-2 border-t border-gray-100 dark:border-[#1E3B34] mt-2">
            <div className="flex items-center justify-between px-1 pb-1">
              <span className="text-xs text-slate-500 dark:text-[#94C8AF]">Theme</span>
              <div className="flex items-center gap-1">
                {[
                  { id: "light", icon: Sun, label: "Light" },
                  { id: "dark", icon: Moon, label: "Dark" },
                ].map(({ id, icon: Icon }) => {
                  const active = resolvedTheme === id;
                  return (
                    <button
                      key={id}
                      onClick={() => setTheme(id)}
                      className={`p-2.5 rounded-lg border transition-colors min-h-[44px] min-w-[44px] ${
                        active 
                          ? "border-[#2F8F6B] bg-[#E8F5EF] dark:bg-[#1E3B34] text-[#0F3D2E] dark:text-[#6DD4A8]" 
                          : "border-slate-200 dark:border-[#1E3B34] bg-white dark:bg-transparent text-slate-500 dark:text-[#94C8AF]"
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </button>
                  );
                })}
              </div>
            </div>
            {user ? (
              <>
                {/* User info strip */}
                <div className="flex items-center gap-3 px-3 py-2 rounded-xl" style={{ background: "#F9FAFB" }}>
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm"
                    style={{ background: "linear-gradient(135deg, #0F3D2E, #2F8F6B)", fontWeight: 700 }}>
                    {getAvatarInitials()}
                  </div>
                  <div>
                    <p className="text-sm" style={{ fontWeight: 600, color: "#0F3D2E" }}>{getUserName()}</p>
                    <p className="text-xs" style={{ color: "#9CA3AF" }}>{user.email}</p>
                  </div>
                </div>
                <Link to="/tracker" onClick={() => setMobileOpen(false)}
                  className="text-center px-4 py-2.5 rounded-lg text-sm"
                  style={{ color: "#0F3D2E", fontWeight: 600, border: "1.5px solid #0F3D2E" }}>
                  My Tracker
                </Link>
                <button onClick={() => { signOut(); setMobileOpen(false); navigate("/"); }}
                  className="text-center px-4 py-2.5 rounded-lg text-sm"
                  style={{ color: "#EF4444", fontWeight: 500, border: "1px solid #FECACA" }}>
                  Log Out
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => { handleTryDemo(); setMobileOpen(false); }}
                  className="text-center px-4 py-2.5 rounded-lg text-sm"
                  style={{ color: "#0F3D2E", fontWeight: 600, border: "1px solid #E5E7EB" }}
                >
                  Try demo
                </button>
                <button onClick={() => { navigate("/auth?tab=login"); setMobileOpen(false); }}
                  className="text-center px-4 py-2.5 rounded-lg text-sm"
                  style={{ color: "#0F3D2E", fontWeight: 500, border: "1px solid #E5E7EB" }}>
                  Log In
                </button>
                <button onClick={() => { navigate("/auth?tab=signup"); setMobileOpen(false); }}
                  className="text-center px-4 py-2.5 rounded-lg text-white text-sm flex items-center justify-center gap-1.5"
                  style={{ background: "linear-gradient(135deg, #0F3D2E 0%, #2F8F6B 100%)", fontWeight: 600 }}>
                  <Sprout className="w-3.5 h-3.5" />
                  Sign Up Free
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
