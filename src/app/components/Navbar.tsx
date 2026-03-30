import { useState, useRef, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import { Menu, X, Sprout, ChevronDown, User, LogOut, Moon, Sun, Monitor } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { useTheme } from "next-themes";

const navLinks = [
  { label: "Missions",     href: "/browse",    comingSoon: false },
  { label: "Community", href: "/community", comingSoon: false },
  { label: "Hands-on",   href: "/hands-on",   comingSoon: false },
  { label: "Funding",   href: "/funding",   comingSoon: false },
];

export function Navbar() {
  const { user, signOut } = useAuth();
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

  return (
    <nav
      className="sticky top-0 z-50 bg-white dark:bg-[#0D1F18] border-b border-gray-100 dark:border-[#1E3B34]"
      style={{ boxShadow: "0 1px 12px rgba(15,61,46,0.07)" }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

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
          <div className="hidden md:flex items-center gap-0.5">
            {navLinks.map((link) => (
              <div key={link.label} className="relative">
                {link.comingSoon ? (
                  <span className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-gray-400 cursor-default select-none text-sm">
                    {link.label}
                    <span className="text-xs px-1.5 py-0.5 rounded-full"
                      style={{ background: "#E6F4EE", color: "#2F8F6B", fontSize: "10px", fontWeight: 600 }}>
                      Soon
                    </span>
                  </span>
                ) : (
                  <Link
                    to={link.href}
                    className={`px-3 py-2 rounded-lg text-sm transition-colors duration-150 ${
                      location.pathname === link.href
                        ? "dark:!bg-emerald-900/40 dark:!text-emerald-50 dark:!font-semibold"
                        : "dark:!text-emerald-200/95 dark:hover:!bg-white/[0.06] dark:hover:!text-emerald-50"
                    }`}
                    style={{
                      color: location.pathname === link.href ? "#0F3D2E" : "#374151",
                      background: location.pathname === link.href ? "#E6F4EE" : "transparent",
                      fontWeight: location.pathname === link.href ? 600 : 400,
                    }}
                  >
                    {link.label}
                  </Link>
                )}
              </div>
            ))}
          </div>

          {/* ── Right Side (desktop) ── */}
          <div className="hidden md:flex items-center gap-2">
            {mounted && (
              <button
                onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
                className="p-2 rounded-lg border transition-colors"
                style={{
                  borderColor: mounted && theme === "dark" ? "#1E3B34" : "#E5E7EB",
                  background: mounted && theme === "dark" ? "#132B23" : "white",
                  color: mounted && theme === "dark" ? "#E8F5EF" : "#0F3D2E",
                }}
                title={resolvedTheme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
                aria-label={resolvedTheme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
              >
                {resolvedTheme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>
            )}
            {user ? (
              /* ── LOGGED IN ── */
              <>
                {/* Avatar + Dropdown */}
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-xl transition-all"
                    style={{ border: "1.5px solid #E5E7EB" }}
                    onMouseEnter={e => (e.currentTarget.style.borderColor = "#2F8F6B")}
                    onMouseLeave={e => (!dropdownOpen && (e.currentTarget.style.borderColor = "#E5E7EB"))}
                  >
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-sm"
                      style={{ background: "linear-gradient(135deg, #0F3D2E, #2F8F6B)", fontWeight: 700 }}>
                      {getAvatarInitials()}
                    </div>
                    <span
                      className="text-sm"
                      style={{ fontWeight: 500, color: mounted && theme === "dark" ? "#BEEBD7" : "#374151" }}
                    >
                      {getUserName().split(" ")[0]}
                    </span>
                    <ChevronDown className="w-3.5 h-3.5" style={{ color: "#9CA3AF", transform: dropdownOpen ? "rotate(180deg)" : "none", transition: "transform 0.2s" }} />
                  </button>

                  {/* Dropdown menu */}
                  {dropdownOpen && (
                    <div
                      className="absolute right-0 mt-2 w-56 rounded-2xl overflow-hidden"
                      style={{ background: mounted && theme === "dark" ? "#132B23" : "white", border: mounted && theme === "dark" ? "1px solid #1E3B34" : "1px solid #E5E7EB", boxShadow: "0 8px 24px rgba(0,0,0,0.12)", zIndex: 100 }}
                    >
                      {/* User info */}
                      <div className="px-4 py-3.5" style={{ borderBottom: "1px solid #F3F4F6" }}>
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white"
                            style={{ background: "linear-gradient(135deg, #0F3D2E, #2F8F6B)", fontWeight: 700 }}>
                            {getAvatarInitials()}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm truncate" style={{ fontWeight: 700, color: "#0F3D2E" }}>{getUserName()}</p>
                            <p className="text-xs truncate" style={{ color: mounted && theme === "dark" ? "#A8D5BF" : "#9CA3AF" }}>{user.email}</p>
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
                            className="flex items-center gap-3 px-4 py-2.5 text-sm transition-colors"
                            style={{ color: mounted && theme === "dark" ? "#E8F5EF" : "#374151" }}
                            onMouseEnter={e => (e.currentTarget.style.background = mounted && theme === "dark" ? "#17342B" : "#F9FAFB")}
                            onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                          >
                            <Icon className="w-4 h-4" style={{ color: mounted && theme === "dark" ? "#A8D5BF" : "#9CA3AF" }} />
                            {label}
                          </Link>
                        ))}
                      </div>

                      {/* Theme selector */}
                      <div style={{ borderTop: mounted && theme === "dark" ? "1px solid #1E3B34" : "1px solid #F3F4F6" }} className="py-2 px-3">
                        <p className="text-xs font-semibold mb-2" style={{ color: mounted && theme === "dark" ? "#A8D5BF" : "#6B7280" }}>
                          Theme
                        </p>
                        <div className="grid grid-cols-3 gap-2">
                          {[
                            { id: "light", label: "Light", icon: Sun },
                            { id: "dark", label: "Dark", icon: Moon },
                            { id: "system", label: "System", icon: Monitor },
                          ].map(({ id, label, icon: Icon }) => {
                            const active = (theme ?? "system") === id;
                            return (
                              <button
                                key={id}
                                onClick={() => setTheme(id)}
                                className="px-2 py-2 rounded-lg text-xs font-medium transition-colors inline-flex flex-col items-center gap-1"
                                style={{
                                  background: active ? "#E6F4EE" : "transparent",
                                  color: active ? "#0F3D2E" : mounted && theme === "dark" ? "#E8F5EF" : "#374151",
                                  border: active ? "1px solid #BFE5D4" : mounted && theme === "dark" ? "1px solid #1E3B34" : "1px solid #E5E7EB",
                                }}
                              >
                                <Icon className="w-3.5 h-3.5" />
                                {label}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <div style={{ borderTop: "1px solid #F3F4F6" }} className="py-1.5">
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors text-left"
                          style={{ color: "#EF4444" }}
                          onMouseEnter={e => (e.currentTarget.style.background = "#FFF5F5")}
                          onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
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
                  onClick={() => navigate("/auth?tab=login")}
                  className="px-4 py-2 rounded-lg text-sm transition-colors duration-150"
                  style={{ color: "#374151", fontWeight: 500 }}
                  onMouseEnter={e => (e.currentTarget.style.background = "#F9FAFB")}
                  onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                >
                  Log In
                </button>
                <button
                  onClick={() => navigate("/auth?tab=signup")}
                  className="px-4 py-2 rounded-lg text-white text-sm transition-all flex items-center gap-1.5"
                  style={{ background: "linear-gradient(135deg, #0F3D2E 0%, #2F8F6B 100%)", fontWeight: 600, boxShadow: "0 2px 8px rgba(47,143,107,0.35)" }}
                >
                  <Sprout className="w-3.5 h-3.5" />
                  Sign Up
                </button>
              </>
            )}
          </div>

          {/* ── Mobile controls ── */}
          <div className="md:hidden flex items-center gap-1">
            {mounted && (
              <button
                onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
                className="p-2 rounded-lg border transition-colors"
                style={{
                  borderColor: mounted && theme === "dark" ? "#1E3B34" : "#E5E7EB",
                  background: mounted && theme === "dark" ? "#132B23" : "white",
                  color: mounted && theme === "dark" ? "#E8F5EF" : "#0F3D2E",
                }}
                title={resolvedTheme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
                aria-label={resolvedTheme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
              >
                {resolvedTheme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>
            )}
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
              <span className="text-xs text-gray-500">Theme</span>
              <div className="flex items-center gap-1">
                {[
                  { id: "light", icon: Sun },
                  { id: "dark", icon: Moon },
                  { id: "system", icon: Monitor },
                ].map(({ id, icon: Icon }) => {
                  const active = (theme ?? "system") === id;
                  return (
                    <button
                      key={id}
                      onClick={() => setTheme(id)}
                      className="p-2 rounded-lg border transition-colors"
                      style={{
                        borderColor: active ? "#2F8F6B" : "#E5E7EB",
                        background: active ? "#E6F4EE" : "white",
                        color: active ? "#0F3D2E" : "#6B7280",
                      }}
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
