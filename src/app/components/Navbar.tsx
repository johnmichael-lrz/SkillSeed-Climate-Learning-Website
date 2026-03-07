import { useState } from "react";
import { Link, useLocation } from "react-router";
import { Leaf, Menu, X, Plus, LogOut, User, Settings, Target } from "lucide-react";
import { useAuth } from "../hooks/useAuth";

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [avatarMenuOpen, setAvatarMenuOpen] = useState(false);
  const location = useLocation();
  const { user, signOut } = useAuth();

  const isActive = (path: string) =>
    location.pathname === path || location.pathname.startsWith(path + "/");

  const handleSignOut = async () => {
    await signOut();
    setAvatarMenuOpen(false);
  };

  return (
    <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-[#E6F4EE] shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 bg-[#0F3D2E] rounded-lg flex items-center justify-center group-hover:bg-[#2F8F6B] transition-colors">
              <Leaf className="w-5 h-5 text-white" />
            </div>
            <span className="text-[#0F3D2E] font-[Manrope] font-bold text-xl tracking-tight">
              Skill<span className="text-[#2F8F6B]">Seed</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            <Link
              to="/dashboard"
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive("/dashboard")
                  ? "bg-[#E6F4EE] text-[#0F3D2E]"
                  : "text-gray-600 hover:text-[#0F3D2E] hover:bg-[#E6F4EE]"
              }`}
            >
              Match
            </Link>

            {/* Academy - shown to all users */}
            <div className="relative group">
              <button className="px-4 py-2 rounded-lg text-sm font-medium text-gray-400 flex items-center gap-1 cursor-default">
                Academy
                <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full font-semibold ml-1">
                  Soon
                </span>
              </button>
            </div>

            <Link
              to="/funding"
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive("/funding")
                  ? "bg-[#E6F4EE] text-[#0F3D2E]"
                  : "text-gray-600 hover:text-[#0F3D2E] hover:bg-[#E6F4EE]"
              }`}
            >
              Funding
            </Link>
            <Link
              to="/community"
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive("/community")
                  ? "bg-[#E6F4EE] text-[#0F3D2E]"
                  : "text-gray-600 hover:text-[#0F3D2E] hover:bg-[#E6F4EE]"
              }`}
            >
              Community
            </Link>
          </div>

          {/* Right side actions */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <>
                {/* Logged in: Post a Project + Avatar */}
                <Link
                  to="/post-project"
                  className="text-sm font-medium bg-[#2F8F6B] text-white px-4 py-2 rounded-lg hover:bg-[#0F3D2E] transition-colors flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  Post a Project
                </Link>
                
                {/* Avatar with dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setAvatarMenuOpen(!avatarMenuOpen)}
                    className="w-9 h-9 bg-[#0F3D2E] rounded-full flex items-center justify-center text-white font-semibold text-sm hover:bg-[#2F8F6B] transition-colors"
                  >
                    {user.user_metadata?.full_name?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase() || 'U'}
                  </button>
                  
                  {avatarMenuOpen && (
                    <>
                      <div 
                        className="fixed inset-0 z-10" 
                        onClick={() => setAvatarMenuOpen(false)}
                      />
                      <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-100 z-20 py-1">
                        <div className="px-4 py-3 border-b border-gray-100">
                          <p className="text-sm font-medium text-[#0F3D2E] truncate">
                            {user.user_metadata?.full_name || 'User'}
                          </p>
                          <p className="text-xs text-gray-500 truncate">{user.email}</p>
                        </div>
                        <Link
                          to="/profile"
                          onClick={() => setAvatarMenuOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-[#E6F4EE] hover:text-[#0F3D2E]"
                        >
                          <User className="w-4 h-4" />
                          Profile
                        </Link>
                        <Link
                          to="/progress"
                          onClick={() => setAvatarMenuOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-[#E6F4EE] hover:text-[#0F3D2E]"
                        >
                          <Target className="w-4 h-4" />
                          Tracker
                        </Link>
                        <Link
                          to="/settings"
                          onClick={() => setAvatarMenuOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-[#E6F4EE] hover:text-[#0F3D2E]"
                        >
                          <Settings className="w-4 h-4" />
                          Settings
                        </Link>
                        <div className="border-t border-gray-100 mt-1 pt-1">
                          <button
                            onClick={handleSignOut}
                            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50"
                          >
                            <LogOut className="w-4 h-4" />
                            Log out
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </>
            ) : (
              <>
                {/* Logged out: Log In + Sign Up */}
                <Link
                  to="/auth"
                  className="text-sm font-medium text-gray-600 hover:text-[#0F3D2E] transition-colors px-3 py-2"
                >
                  Log In
                </Link>
                <Link
                  to="/auth"
                  className="text-sm font-medium bg-[#0F3D2E] text-white px-4 py-2 rounded-lg hover:bg-[#2F8F6B] transition-colors"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 rounded-lg text-gray-600 hover:bg-[#E6F4EE]"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileOpen && (
          <div className="md:hidden border-t border-[#E6F4EE] py-3 space-y-1">
            <Link
              to="/dashboard"
              onClick={() => setMobileOpen(false)}
              className="block px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-[#E6F4EE] hover:text-[#0F3D2E] rounded-lg"
            >
              Match
            </Link>

            {/* Academy - shown to all users */}
            <div className="px-4 py-2.5 text-sm font-medium text-gray-400 flex items-center gap-2">
              Academy
              <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full font-semibold">
                Soon
              </span>
            </div>

            <Link
              to="/funding"
              onClick={() => setMobileOpen(false)}
              className="block px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-[#E6F4EE] hover:text-[#0F3D2E] rounded-lg"
            >
              Funding
            </Link>
            <Link
              to="/community"
              onClick={() => setMobileOpen(false)}
              className="block px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-[#E6F4EE] hover:text-[#0F3D2E] rounded-lg"
            >
              Community
            </Link>

            <div className="pt-2 border-t border-[#E6F4EE] px-4">
              {user ? (
                <>
                  {/* Logged in mobile actions */}
                  <Link
                    to="/post-project"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center justify-center gap-1.5 w-full text-sm font-medium bg-[#2F8F6B] text-white px-3 py-2.5 rounded-lg mb-2"
                  >
                    <Plus className="w-4 h-4" />
                    Post a Project
                  </Link>
                  <div className="flex items-center gap-3 py-2">
                    <div className="w-9 h-9 bg-[#0F3D2E] rounded-full flex items-center justify-center text-white font-semibold text-sm">
                      {user.user_metadata?.full_name?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[#0F3D2E] truncate">
                        {user.user_metadata?.full_name || 'User'}
                      </p>
                      <p className="text-xs text-gray-500 truncate">{user.email}</p>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-2">
                    <Link
                      to="/profile"
                      onClick={() => setMobileOpen(false)}
                      className="flex-1 text-center text-sm font-medium text-gray-600 border border-gray-200 px-3 py-2 rounded-lg"
                    >
                      Profile
                    </Link>
                    <Link
                      to="/progress"
                      onClick={() => setMobileOpen(false)}
                      className="flex-1 text-center text-sm font-medium text-gray-600 border border-gray-200 px-3 py-2 rounded-lg"
                    >
                      Tracker
                    </Link>
                  </div>
                  <button
                    onClick={() => { handleSignOut(); setMobileOpen(false); }}
                    className="w-full mt-2 text-center text-sm font-medium text-red-600 border border-red-200 px-3 py-2 rounded-lg"
                  >
                    Log out
                  </button>
                </>
              ) : (
                <>
                  {/* Logged out mobile actions */}
                  <div className="flex gap-2">
                    <Link
                      to="/auth"
                      onClick={() => setMobileOpen(false)}
                      className="flex-1 text-center text-sm font-medium text-gray-600 border border-gray-200 px-3 py-2 rounded-lg"
                    >
                      Log In
                    </Link>
                    <Link
                      to="/auth"
                      onClick={() => setMobileOpen(false)}
                      className="flex-1 text-center text-sm font-medium bg-[#0F3D2E] text-white px-3 py-2 rounded-lg"
                    >
                      Sign Up
                    </Link>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
