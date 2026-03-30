import { Link } from "react-router";
import { Leaf, Twitter, Instagram, Github, Linkedin, Mail } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-[#0A2E20] text-white">
      <div className="max-w-7xl mx-auto px-6 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
          {/* Brand */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-9 h-9 bg-[#2F8F6B] rounded-xl flex items-center justify-center">
                <Leaf className="w-5 h-5 text-white" />
              </div>
              <span className="font-[Manrope] font-extrabold text-xl text-white">
                Skill<span className="text-[#6DD4A8]">Seed</span>
              </span>
            </div>
            <p className="text-[#94C8AF] text-sm leading-relaxed max-w-xs">
              Connecting climate skills with real-world missions. Learn, act, and grow together.
            </p>
            <div className="flex gap-2 mt-5">
              <a href="#" className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center hover:bg-[#2F8F6B] transition-colors" aria-label="Twitter">
                <Twitter className="w-4 h-4" />
              </a>
              <a href="#" className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center hover:bg-[#2F8F6B] transition-colors" aria-label="Instagram">
                <Instagram className="w-4 h-4" />
              </a>
              <a href="#" className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center hover:bg-[#2F8F6B] transition-colors" aria-label="LinkedIn">
                <Linkedin className="w-4 h-4" />
              </a>
              <a href="#" className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center hover:bg-[#2F8F6B] transition-colors" aria-label="GitHub">
                <Github className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Platform */}
          <div>
            <h4 className="font-bold text-white mb-4 font-[Manrope]">Platform</h4>
            <ul className="space-y-2.5">
              {[
                { label: "Mission Dashboard", to: "/dashboard" },
                { label: "Post a Project", to: "/post-project" },
                { label: "Progress Tracker", to: "/progress" },
                { label: "Community", to: "/community" },
                { label: "Funding Resources", to: "/funding" },
              ].map((item) => (
                <li key={item.label}>
                  <Link to={item.to} className="text-[#94C8AF] text-sm hover:text-white transition-colors">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Missions */}
          <div>
            <h4 className="font-bold text-white mb-4 font-[Manrope]">Mission Types</h4>
            <ul className="space-y-2.5 text-[#94C8AF] text-sm">
              {["Urban Gardening", "Composting", "Repair & Reuse", "Energy Saving", "Reforestation", "Marine Conservation"].map((item) => (
                <li key={item}>
                  <Link to="/dashboard" className="hover:text-white transition-colors">{item}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-bold text-white mb-4 font-[Manrope]">Company</h4>
            <ul className="space-y-2.5">
              {[
                { label: "About SkillSeed", to: "/" },
                { label: "Privacy Policy", to: "/" },
                { label: "Terms of Service", to: "/" },
                { label: "Contact Us", to: "/" },
                { label: "Verifier Portal", to: "/verifier-login" },
              ].map((item) => (
                <li key={item.label}>
                  <Link to={item.to} className="text-[#94C8AF] text-sm hover:text-white transition-colors">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
            <div className="mt-5 flex items-center gap-2 text-[#94C8AF] text-sm">
              <Mail className="w-4 h-4" />
              <a href="mailto:hello@skillseed.earth" className="hover:text-white transition-colors">
                hello@skillseed.earth
              </a>
            </div>
          </div>
        </div>

        <div className="pt-8 mt-2 border-t border-white/15 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-[#6B9E86] text-xs">
            2026 SkillSeed. Made for a greener planet.
          </p>
          <p className="text-[#6B9E86] text-xs">
            Climate skills platform
          </p>
        </div>
      </div>
    </footer>
  );
}
