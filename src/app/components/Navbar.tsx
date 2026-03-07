import { useState, useRef, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import { Menu, X, Leaf, Sprout, ChevronDown, User, Settings, LogOut, TrendingUp } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

const navLinks = [
  { label: "Match",     href: "/browse",    comingSoon: false },
  { label: "Community", href: "/community", comingSoon: false },
  { label: "Academy",   href: "/academy",   comingSoon: false },
  { label: "Funding",   href: "/funding",   comingSoon: false },
];

export function Navbar() {
  const { user, login, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const dropdownRef = useRef<HTMLDivElement>(null);

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
    logout();
    setDropdownOpen(false);
    navigate("/");
  };

  return (
    <nav
      className="sticky top-0 z-50 bg-white border-b border-gray-100"
      style={{ boxShadow: "0 1px 12px rgba(15,61,46,0.07)" }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* ── Logo ── */}
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, #0F3D2E 0%, #2F8F6B 100%)" }}>
              <Leaf className="w-4 h-4 text-white" />
            </div>
            <span className="text-xl" style={{ fontFamily: "'Manrope', sans-serif", fontWeight: 800, color: "#0F3D2E" }}>
              SkillSeed
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
                    className="px-3 py-2 rounded-lg text-sm transition-colors duration-150"
                    style={{
                      color: location.pathname === link.href ? "#0F3D2E" : "#4B5563",
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
            {user ? (
              /* ── LOGGED IN ── */
              <>
                <Link
                  to="/post-project"
                  className="px-4 py-2 rounded-lg text-sm transition-all"
                  style={{ color: "#0F3D2E", fontWeight: 600, border: "1.5px solid #0F3D2E" }}
                  onMouseEnter={e => (e.currentTarget.style.background = "#F0FAF5")}
                  onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                >
                  Post a Project
                </Link>

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
                      {user.avatar}
                    </div>
                    <span className="text-sm" style={{ fontWeight: 500, color: "#374151" }}>
                      {user.name.split(" ")[0]}
                    </span>
                    <ChevronDown className="w-3.5 h-3.5" style={{ color: "#9CA3AF", transform: dropdownOpen ? "rotate(180deg)" : "none", transition: "transform 0.2s" }} />
                  </button>

                  {/* Dropdown menu */}
                  {dropdownOpen && (
                    <div
                      className="absolute right-0 mt-2 w-56 rounded-2xl overflow-hidden"
                      style={{ background: "white", border: "1px solid #E5E7EB", boxShadow: "0 8px 24px rgba(0,0,0,0.12)", zIndex: 100 }}
                    >
                      {/* User info */}
                      <div className="px-4 py-3.5" style={{ borderBottom: "1px solid #F3F4F6" }}>
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white"
                            style={{ background: "linear-gradient(135deg, #0F3D2E, #2F8F6B)", fontWeight: 700 }}>
                            {user.avatar}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm truncate" style={{ fontWeight: 700, color: "#0F3D2E" }}>{user.name}</p>
                            <p className="text-xs truncate" style={{ color: "#9CA3AF" }}>{user.email}</p>
                          </div>
                        </div>
                      </div>

                      {/* Menu items */}
                      <div className="py-1.5">
                        {[
                          { icon: User, label: "Profile", href: "/dashboard" },
                          { icon: TrendingUp, label: "Tracker", href: "/tracker" },
                          { icon: Settings, label: "Settings", href: "/dashboard" },
                        ].map(({ icon: Icon, label, href }) => (
                          <Link
                            key={label}
                            to={href}
                            onClick={() => setDropdownOpen(false)}
                            className="flex items-center gap-3 px-4 py-2.5 text-sm transition-colors"
                            style={{ color: "#374151" }}
                            onMouseEnter={e => (e.currentTarget.style.background = "#F9FAFB")}
                            onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                          >
                            <Icon className="w-4 h-4" style={{ color: "#9CA3AF" }} />
                            {label}
                          </Link>
                        ))}
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
                  onClick={() => login()}
                  className="px-4 py-2 rounded-lg text-sm transition-colors duration-150"
                  style={{ color: "#374151", fontWeight: 500 }}
                  onMouseEnter={e => (e.currentTarget.style.background = "#F9FAFB")}
                  onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                >
                  Log In
                </button>
                <Link
                  to="/signup"
                  className="px-4 py-2 rounded-lg text-white text-sm transition-all flex items-center gap-1.5"
                  style={{ background: "linear-gradient(135deg, #0F3D2E 0%, #2F8F6B 100%)", fontWeight: 600, boxShadow: "0 2px 8px rgba(47,143,107,0.35)" }}
                >
                  <Sprout className="w-3.5 h-3.5" />
                  Sign Up
                </Link>
              </>
            )}
          </div>

          {/* ── Mobile Toggle ── */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden p-2 rounded-lg"
            style={{ color: "#0F3D2E" }}
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* ── Mobile Menu ── */}
      {mobileOpen && (
        <div className="md:hidden border-t border-gray-100 bg-white px-4 py-4 space-y-1">
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

          <div className="pt-3 flex flex-col gap-2 border-t border-gray-100 mt-2">
            {user ? (
              <>
                {/* User info strip */}
                <div className="flex items-center gap-3 px-3 py-2 rounded-xl" style={{ background: "#F9FAFB" }}>
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm"
                    style={{ background: "linear-gradient(135deg, #0F3D2E, #2F8F6B)", fontWeight: 700 }}>
                    {user.avatar}
                  </div>
                  <div>
                    <p className="text-sm" style={{ fontWeight: 600, color: "#0F3D2E" }}>{user.name}</p>
                    <p className="text-xs" style={{ color: "#9CA3AF" }}>{user.email}</p>
                  </div>
                </div>
                <Link to="/tracker" onClick={() => setMobileOpen(false)}
                  className="text-center px-4 py-2.5 rounded-lg text-sm"
                  style={{ color: "#0F3D2E", fontWeight: 600, border: "1.5px solid #0F3D2E" }}>
                  My Tracker
                </Link>
                <Link to="/post-project" onClick={() => setMobileOpen(false)}
                  className="text-center px-4 py-2.5 rounded-lg text-white text-sm"
                  style={{ background: "linear-gradient(135deg, #0F3D2E 0%, #2F8F6B 100%)", fontWeight: 600 }}>
                  Post a Project
                </Link>
                <button onClick={() => { logout(); setMobileOpen(false); navigate("/"); }}
                  className="text-center px-4 py-2.5 rounded-lg text-sm"
                  style={{ color: "#EF4444", fontWeight: 500, border: "1px solid #FECACA" }}>
                  Log Out
                </button>
              </>
            ) : (
              <>
                <button onClick={() => { login(); setMobileOpen(false); }}
                  className="text-center px-4 py-2.5 rounded-lg text-sm"
                  style={{ color: "#0F3D2E", fontWeight: 500, border: "1px solid #E5E7EB" }}>
                  Log In
                </button>
                <Link to="/signup" onClick={() => setMobileOpen(false)}
                  className="text-center px-4 py-2.5 rounded-lg text-white text-sm flex items-center justify-center gap-1.5"
                  style={{ background: "linear-gradient(135deg, #0F3D2E 0%, #2F8F6B 100%)", fontWeight: 600 }}>
                  <Sprout className="w-3.5 h-3.5" />
                  Sign Up Free
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
