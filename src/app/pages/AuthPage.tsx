import { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import {
  Eye, EyeOff, Sprout, Wrench, Building2, Leaf, ArrowLeft, Loader2, Mail, CheckCircle,
} from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { isSupabaseConfigured } from "../utils/supabase";
import { ConfigError } from "../components/ui/config-error";
import {
  validateFullName, validateEmail, validatePassword, validateRegion,
  validateSignupForm,
} from "../utils/validation";

// ─── Constants ────────────────────────────────────────────────────────────────

const SKILLS = [
  "GIS Mapping", "Soil Science", "Forestry", "Disaster Response",
  "Community Organising", "Urban Farming", "Solar Installation",
  "Teaching", "Medical", "Construction", "Water Systems", "Marine Conservation",
];

const LEARNING_INTERESTS = [
  "Composting & Soil", "Urban Gardening", "Solar Energy", "Repair & Upcycling",
  "Water Conservation", "Reforestation", "Marine Conservation", "Disaster Prep",
  "Community Organizing", "Sustainable Food", "Climate Education", "Zero Waste",
];

const FOCUS_AREAS = [
  "Disaster Response", "Reforestation", "Marine", "Urban", "Agriculture", "Education",
];

// ─── Role definitions (design's 3-role model) ─────────────────────────────────
// "learner" and "jobready" both map to backend userType "responder"
// "organization" maps to backend userType "poster"

type RoleType = "learner" | "jobready" | "organization" | null;

const ROLES = [
  {
    id: "learner" as RoleType,
    icon: Sprout,
    title: "I'm a Learner",
    description: "Build green skills from scratch and join climate missions.",
    tag: "Beginner-friendly",
    featured: false,
    backendType: "responder" as const,
  },
  {
    id: "jobready" as RoleType,
    icon: Wrench,
    title: "I'm a Volunteer",
    description: "Deploy your skills on real climate projects and build an impact portfolio.",
    tag: "Recommended",
    featured: true,
    backendType: "responder" as const,
  },
  {
    id: "organization" as RoleType,
    icon: Building2,
    title: "I'm an Organization",
    description: "Post projects and get matched with skilled volunteers.",
    tag: "Post projects",
    featured: false,
    backendType: "poster" as const,
  },
];

// ─── Main Component ────────────────────────────────────────────────────────────

export function AuthPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { signUp, signIn, signInWithGoogle, resetPassword } = useAuth();

  // UI state
  const [tab, setTab] = useState<"signup" | "login">("signup");
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotSuccess, setForgotSuccess] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotError, setForgotError] = useState<string | null>(null);
  const oauthPopupPollRef = useRef<number | null>(null);

  // Read tab from URL on mount
  useEffect(() => {
    const urlTab = searchParams.get("tab");
    if (urlTab === "login" || urlTab === "signup") {
      setTab(urlTab);
    }
  }, [searchParams]);

  // Google OAuth pop-up completes in a child window; callback posts here so we can navigate the main tab.
  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      if (event.data?.type === "skillseed-oauth-success") {
        if (oauthPopupPollRef.current !== null) {
          window.clearInterval(oauthPopupPollRef.current);
          oauthPopupPollRef.current = null;
        }
        setLoading(false);
        navigate(typeof event.data.next === "string" ? event.data.next : "/dashboard", { replace: true });
      }
    };
    window.addEventListener("message", onMessage);
    return () => {
      window.removeEventListener("message", onMessage);
      if (oauthPopupPollRef.current !== null) {
        window.clearInterval(oauthPopupPollRef.current);
        oauthPopupPollRef.current = null;
      }
    };
  }, [navigate]);

  const [role, setRole] = useState<RoleType>(null);
  const [step, setStep] = useState(1);
  const [showPass, setShowPass] = useState(false);

  // Onboarding selections
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [selectedFocus, setSelectedFocus] = useState<string[]>([]);

  // Backend state (from original)
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: "", email: "", password: "", region: "",
    orgName: "", orgType: "", bio: "",
    subRole: "volunteer", location: "", availability: "",
  });

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [fieldTouched, setFieldTouched] = useState<Record<string, boolean>>({});

  const [loginData, setLoginData] = useState({
    email: "", password: "", remember: false,
  });

  // Check if supabase is configured (placed AFTER all hooks to obey Rules of Hooks)
  if (!isSupabaseConfigured) {
    return <ConfigError />;
  }

  // ── Helpers ──────────────────────────────────────────────────────────────────

  const selectedRole = ROLES.find(r => r.id === role);

  const toggleSkill = (s: string) =>
    setSelectedSkills(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);
  const toggleInterest = (i: string) =>
    setSelectedInterests(prev => prev.includes(i) ? prev.filter(x => x !== i) : [...prev, i]);
  const toggleFocus = (a: string) =>
    setSelectedFocus(prev => prev.includes(a) ? prev.filter(x => x !== a) : [...prev, a]);

  // ── Real-time field validation ────────────────────────────────────────────────
  const validators: Record<string, (v: string) => string | null> = {
    name: validateFullName,
    email: validateEmail,
    password: validatePassword,
    region: validateRegion,
  };

  const handleFieldChange = (field: string, value: string) => {
    setForm(f => ({ ...f, [field]: value }));
    // Only show/clear errors for fields the user has already interacted with
    if (fieldTouched[field]) {
      const validator = validators[field];
      if (validator) {
        const err = validator(value);
        setFieldErrors(prev => {
          const next = { ...prev };
          if (err) next[field] = err;
          else delete next[field];
          return next;
        });
      }
    }
  };

  const handleFieldBlur = (field: string) => {
    setFieldTouched(prev => ({ ...prev, [field]: true }));
    const validator = validators[field];
    if (validator) {
      const err = validator(form[field as keyof typeof form] as string);
      setFieldErrors(prev => {
        const next = { ...prev };
        if (err) next[field] = err;
        else delete next[field];
        return next;
      });
    }
  };

  const handleContinueToStep3 = () => {
    // Mark all fields as touched so errors show
    setFieldTouched({ name: true, email: true, password: true, region: true });
    const errors = validateSignupForm(form);
    setFieldErrors(errors);
    if (Object.keys(errors).length === 0) {
      setStep(3);
    }
  };

  /** Returns the border color style based on validation state */
  const fieldBorderColor = (field: string): string => {
    if (fieldErrors[field]) return "#EF4444";           // red for error
    if (fieldTouched[field] && !fieldErrors[field]) return "#2F8F6B"; // green for valid
    return "#E5E7EB";                                    // default gray
  };

  // ── Backend handlers (from original) ─────────────────────────────────────────

  const handleFinalSignup = async () => {
    if (!role || !selectedRole) return;
    setLoading(true);
    setError(null);

    const { error } = await signUp({
      email: form.email,
      password: form.password,
      fullName: form.name,
      region: form.region,
      userType: selectedRole.backendType,
    });

    setLoading(false);
    if (error) {
      setError(error.message);
      setStep(2); // send back to details step so user can fix
    } else {
      navigate("/dashboard");
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await signIn({
      email: loginData.email,
      password: loginData.password,
    });

    setLoading(false);
    if (error) {
      setError(error.message);
    } else {
      navigate("/dashboard");
    }
  };

  const handleGoogleAuth = async () => {
    setLoading(true);
    setError(null);
    const { error, oauthPopup } = await signInWithGoogle();
    if (error) {
      setLoading(false);
      setError(error.message);
      return;
    }
    if (oauthPopup) {
      if (oauthPopupPollRef.current !== null) window.clearInterval(oauthPopupPollRef.current);
      oauthPopupPollRef.current = window.setInterval(() => {
        if (oauthPopup.closed) {
          if (oauthPopupPollRef.current !== null) {
            window.clearInterval(oauthPopupPollRef.current);
            oauthPopupPollRef.current = null;
          }
          setLoading(false);
        }
      }, 600);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail) return;
    
    setForgotLoading(true);
    setForgotError(null);
    
    const { error } = await resetPassword(forgotEmail);
    
    setForgotLoading(false);
    if (error) {
      setForgotError(error.message);
    } else {
      setForgotSuccess(true);
    }
  };

  // ─── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen flex bg-[#F9FAFB] dark:bg-[#0D1F18]">

      {/* ── Left panel (no redundant logo - navbar has it) ── */}
      <div className="hidden lg:flex flex-col justify-between w-[420px] shrink-0 p-10 bg-[#0F3D2E]">
        {/* Top spacer */}
        <div />

        {/* Main content */}
        <div>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/10 text-white/80 text-xs font-medium mb-4">
            <Leaf className="w-3 h-3" /> Early Access
          </span>
          <h2 className="text-white mb-4" style={{ fontFamily: "'Manrope', sans-serif", fontWeight: 800, fontSize: "1.75rem", lineHeight: 1.3 }}>
            Every skill planted grows into real climate action.
          </h2>
          <p className="text-white/65 text-sm leading-relaxed">
            Be among the first to join a community tackling climate change through real-world missions.
          </p>

          <div className="mt-8 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-white/10">
                <Leaf className="w-4 h-4 text-[#6DD4A8]" />
              </div>
              <span className="text-sm text-white/80 font-medium">Complete real-world climate missions</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-white/10">
                <Wrench className="w-4 h-4 text-[#6DD4A8]" />
              </div>
              <span className="text-sm text-white/80 font-medium">Connect with skilled volunteers</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-white/10">
                <Sprout className="w-4 h-4 text-[#6DD4A8]" />
              </div>
              <span className="text-sm text-white/80 font-medium">Track your environmental impact</span>
            </div>
          </div>
        </div>

        {/* Bottom - honest footer */}
        <p className="text-xs text-white/40">
          All profiles are verified before matching.
        </p>
      </div>

      {/* ── Right panel ── */}
      <div className="flex-1 flex items-start justify-center p-6 overflow-y-auto">
        <div className="w-full max-w-lg py-8">

          {/* Mobile logo + beta badge */}
          <Link to="/" className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-[#0F3D2E]">
              <Leaf className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg text-[#0F3D2E] dark:text-[#BEEBD7]" style={{ fontFamily: "'Manrope', sans-serif", fontWeight: 800 }}>SkillSeed</span>
            <span className="px-1.5 py-0.5 rounded bg-[#E8F5EF] dark:bg-[#1E3B34] text-[#2F8F6B] dark:text-[#6DD4A8] text-[10px] font-semibold">Beta</span>
          </Link>

          {/* Tabs */}
          <div className="flex rounded-xl p-1 mb-8 bg-slate-100 dark:bg-[#1E3B34]">
            {(["login", "signup"] as const).map(t => (
              <button
                key={t}
                onClick={() => { setTab(t); setStep(1); setRole(null); setError(null); }}
                className={`flex-1 py-2.5 rounded-lg text-sm capitalize transition-all duration-200 ${
                  tab === t 
                    ? "bg-white dark:bg-[#132B23] text-[#0F3D2E] dark:text-[#BEEBD7] font-bold shadow-sm" 
                    : "text-slate-500 dark:text-[#94C8AF] font-medium"
                }`}
              >
                {t === "signup" ? "Create Account" : "Log In"}
              </button>
            ))}
          </div>

          {/* Global error banner */}
          {error && (
            <div className="mb-5 p-3 rounded-xl text-sm" style={{ background: "#FEF2F2", border: "1px solid #FECACA", color: "#DC2626" }}>
              {error}
            </div>
          )}

          {/* ═══ SIGN UP — STEP 1: Role Selection ═══ */}
          {tab === "signup" && step === 1 && (
            <div>
              <h2 className="mb-1" style={{ fontFamily: "'Manrope', sans-serif", fontWeight: 800, color: "#0F3D2E", fontSize: "1.6rem" }}>
                Who are you?
              </h2>
              <p className="text-sm mb-7" style={{ color: "#6B7280", lineHeight: 1.6 }}>
                Choose the option that best describes how you want to participate in climate action.
              </p>

              <div className="flex flex-col gap-3 mb-7">
                {ROLES.map(({ id, icon: Icon, title, description, tag, featured }) => {
                  const selected = role === id;
                  return (
                    <button
                      key={id}
                      onClick={() => setRole(id)}
                      className={`relative text-left rounded-xl p-5 transition-all duration-200 border-2 bg-white dark:bg-[#132B23] ${
                        selected 
                          ? "border-[#2F8F6B] ring-2 ring-[#2F8F6B]/20 shadow-md" 
                          : featured 
                            ? "border-[#2F8F6B]/40 dark:border-[#6DD4A8]/30" 
                            : "border-slate-200 dark:border-[#1E3B34]"
                      }`}
                    >
                      {featured && !selected && (
                        <div className="absolute -top-2.5 left-4 px-2 py-0.5 rounded bg-[#2F8F6B] text-white text-[10px] font-semibold">
                          Recommended
                        </div>
                      )}
                      <div className="flex items-start gap-4">
                        <div className={`w-11 h-11 rounded-lg flex items-center justify-center shrink-0 ${
                          selected ? "bg-[#0F3D2E]" : "bg-slate-100 dark:bg-[#1E3B34]"
                        }`}>
                          <Icon className={`w-5 h-5 ${selected ? "text-white" : "text-[#0F3D2E] dark:text-[#6DD4A8]"}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className="text-sm text-slate-900 dark:text-[#BEEBD7]" style={{ fontFamily: "'Manrope', sans-serif", fontWeight: 700 }}>
                              {title}
                            </span>
                            <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-[#1E3B34] text-slate-600 dark:text-[#94C8AF] text-[10px] font-medium">
                              {tag}
                            </span>
                          </div>
                          <p className="text-xs leading-relaxed text-slate-500 dark:text-[#6B8F7F]">{description}</p>
                        </div>
                        <div className={`w-5 h-5 rounded-full border-2 shrink-0 flex items-center justify-center transition-all ${
                          selected ? "border-[#2F8F6B] bg-[#2F8F6B]" : "border-slate-300 dark:border-[#1E3B34]"
                        }`}>
                          {selected && <div className="w-2 h-2 rounded-full bg-white" />}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              <button
                onClick={() => role && setStep(2)}
                disabled={!role}
                className="w-full py-3.5 rounded-xl text-white transition-all duration-200"
                style={{
                  background: role ? "linear-gradient(135deg, #0F3D2E 0%, #2F8F6B 100%)" : "#D1D5DB",
                  fontWeight: 700,
                  fontFamily: "'Manrope', sans-serif",
                  cursor: role ? "pointer" : "not-allowed",
                  boxShadow: role ? "0 4px 16px rgba(47,143,107,0.35)" : "none",
                }}
              >
                {role ? `Continue as ${selectedRole?.title.replace("I'm ", "")} →` : "Select your role to continue"}
              </button>

              <div className="relative my-5 flex items-center gap-3">
                <div className="flex-1 h-px" style={{ background: "#E5E7EB" }} />
                <span className="text-xs" style={{ color: "#9CA3AF" }}>or</span>
                <div className="flex-1 h-px" style={{ background: "#E5E7EB" }} />
              </div>

              <button
                onClick={handleGoogleAuth}
                disabled={loading}
                className="w-full py-3 rounded-xl text-sm flex items-center justify-center gap-3 transition-all disabled:opacity-50"
                style={{ border: "1.5px solid #E5E7EB", background: "white", color: "#374151", fontWeight: 600 }}
                onMouseEnter={e => (e.currentTarget.style.background = "#F9FAFB")}
                onMouseLeave={e => (e.currentTarget.style.background = "white")}
              >
                <GoogleIcon />
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Continue with Google"}
              </button>

              <p className="text-center text-xs mt-5" style={{ color: "#9CA3AF", lineHeight: 1.6 }}>
                By signing up you agree to the{" "}
                <Link to="/" style={{ color: "#2F8F6B", fontWeight: 600 }}>Terms</Link>.
                {" "}All profiles are subject to vetting.
              </p>
            </div>
          )}

          {/* ═══ SIGN UP — STEP 2: Account Details ═══ */}
          {tab === "signup" && step === 2 && (
            <div>
              {/* Progress — 3 steps */}
              <div className="flex items-center gap-2 mb-7">
                <button onClick={() => setStep(1)} style={{ color: "#2F8F6B" }}>
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <div className="flex items-center gap-1.5 flex-1">
                  {/* Step 1 — done */}
                  <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs text-white shrink-0" style={{ background: "#2F8F6B", fontWeight: 700 }}>✓</div>
                  {/* Line 1 — done */}
                  <div className="flex-1 h-1 rounded-full" style={{ background: "#2F8F6B" }} />
                  {/* Step 2 — active */}
                  <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs text-white shrink-0" style={{ background: "#0F3D2E", fontWeight: 700 }}>2</div>
                  <span className="text-xs shrink-0" style={{ color: "#0F3D2E", fontWeight: 600 }}>Details</span>
                  {/* Line 2 — upcoming */}
                  <div className="flex-1 h-1 rounded-full" style={{ background: "#E5E7EB" }} />
                  {/* Step 3 — upcoming */}
                  <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs shrink-0" style={{ background: "#E5E7EB", color: "#9CA3AF", fontWeight: 700 }}>3</div>
                  <span className="text-xs shrink-0" style={{ color: "#9CA3AF", fontWeight: 600 }}>Profile</span>
                </div>
              </div>

              {/* Role reminder chip */}
              {selectedRole && (
                <div className="flex items-center gap-3 p-3 rounded-xl mb-5 bg-slate-50 dark:bg-[#1E3B34] border border-slate-200 dark:border-[#1E3B34]">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-slate-100 dark:bg-[#132B23]">
                    <selectedRole.icon className="w-4 h-4 text-[#0F3D2E] dark:text-[#6DD4A8]" />
                  </div>
                  <span className="text-sm text-slate-700 dark:text-[#BEEBD7] font-semibold">{selectedRole.title}</span>
                  <button onClick={() => setStep(1)} className="ml-auto text-xs text-slate-400 dark:text-[#6B8F7F] font-medium hover:text-slate-600 dark:hover:text-[#94C8AF]">Change</button>
                </div>
              )}

              <h2 className="mb-1" style={{ fontFamily: "'Manrope', sans-serif", fontWeight: 800, color: "#0F3D2E", fontSize: "1.4rem" }}>
                Create your account
              </h2>
              <p className="text-sm mb-5" style={{ color: "#6B7280" }}>
                Join the SkillSeed climate community for free.
              </p>

              <div className="space-y-3">
                <Field label="Full Name" error={fieldErrors.name}>
                  <input type="text" placeholder="Your full name" value={form.name}
                    onChange={e => handleFieldChange('name', e.target.value)}
                    onBlur={() => handleFieldBlur('name')}
                    className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                    style={{ ...inputStyle, borderColor: fieldBorderColor('name') }} />
                </Field>
                <Field label="Email Address" error={fieldErrors.email}>
                  <input type="email" placeholder="you@example.com" value={form.email}
                    onChange={e => handleFieldChange('email', e.target.value)}
                    onBlur={() => handleFieldBlur('email')}
                    className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                    style={{ ...inputStyle, borderColor: fieldBorderColor('email') }} />
                </Field>
                <Field label="Password" error={fieldErrors.password}>
                  <div className="relative">
                    <input type={showPass ? "text" : "password"} placeholder="Min. 8 characters" value={form.password}
                      onChange={e => handleFieldChange('password', e.target.value)}
                      onBlur={() => handleFieldBlur('password')}
                      className="w-full px-4 py-3 rounded-xl text-sm outline-none pr-10"
                      style={{ ...inputStyle, borderColor: fieldBorderColor('password') }} />
                    <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2">
                      {showPass ? <EyeOff className="w-4 h-4" style={{ color: "#9CA3AF" }} /> : <Eye className="w-4 h-4" style={{ color: "#9CA3AF" }} />}
                    </button>
                  </div>
                </Field>
                <Field label="Region" error={fieldErrors.region}>
                  <select value={form.region} onChange={e => handleFieldChange('region', e.target.value)}
                    onBlur={() => handleFieldBlur('region')}
                    className="w-full px-4 py-3 rounded-xl text-sm outline-none appearance-none"
                    style={{ ...inputStyle, borderColor: fieldBorderColor('region'), color: form.region ? "#374151" : "#9CA3AF" }}>
                    <option value="">Select region</option>
                    <option>Luzon</option><option>Visayas</option><option>Mindanao</option><option>Other</option>
                  </select>
                </Field>
              </div>

              <button
                onClick={handleContinueToStep3}
                className="w-full py-3.5 rounded-xl text-white mt-5 transition-all"
                style={{ background: "linear-gradient(135deg, #0F3D2E 0%, #2F8F6B 100%)", fontWeight: 700, fontFamily: "'Manrope', sans-serif", boxShadow: "0 4px 16px rgba(47,143,107,0.35)" }}
              >
                Continue →
              </button>

              <p className="text-center text-xs mt-4" style={{ color: "#9CA3AF", lineHeight: 1.6 }}>
                By signing up you agree to the{" "}
                <Link to="/" style={{ color: "#2F8F6B", fontWeight: 600 }}>Terms</Link>.
                {" "}All profiles are subject to vetting.
              </p>
            </div>
          )}

          {/* ═══ SIGN UP — STEP 3: Onboarding Profile ═══ */}
          {tab === "signup" && step === 3 && (
            <div>
              {/* Progress */}
              <div className="flex items-center gap-2 mb-6">
                <button onClick={() => setStep(2)} style={{ color: "#2F8F6B" }}>
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <div className="flex-1 flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs text-white" style={{ background: "#2F8F6B", fontWeight: 700 }}>✓</div>
                  <div className="flex-1 h-1 rounded-full" style={{ background: "#2F8F6B" }} />
                  <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs text-white" style={{ background: "#2F8F6B", fontWeight: 700 }}>✓</div>
                  <div className="flex-1 h-1 rounded-full mx-2" style={{ background: "#E5E7EB" }}>
                    <div className="h-1 rounded-full w-1/2" style={{ background: "#2F8F6B" }} />
                  </div>
                  <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs text-white" style={{ background: "#0F3D2E", fontWeight: 700 }}>3</div>
                  <span className="text-xs" style={{ color: "#0F3D2E", fontWeight: 600 }}>Profile</span>
                </div>
              </div>

              {/* ── Learner onboarding ── */}
              {role === "learner" && (
                <div>
                  <h2 className="mb-1" style={{ fontFamily: "'Manrope', sans-serif", fontWeight: 800, color: "#0F3D2E", fontSize: "1.3rem" }}>
                    What do you want to learn?
                  </h2>
                  <p className="text-sm mb-5" style={{ color: "#6B7280" }}>
                    Select your climate interests so we can match you with the right missions.
                  </p>
                  <div className="space-y-4">
                    <Field label="Climate Interests">
                      <div className="flex flex-wrap gap-2">
                        {LEARNING_INTERESTS.map(interest => (
                          <TagButton key={interest} label={interest} selected={selectedInterests.includes(interest)} onToggle={() => toggleInterest(interest)} />
                        ))}
                      </div>
                    </Field>
                    <Field label="Location (optional)">
                      <input type="text" placeholder="City, Province or Country"
                        value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
                        onFocus={focusStyle} onBlur={blurStyle}
                        className="w-full px-4 py-3 rounded-xl text-sm outline-none" style={inputStyle} />
                    </Field>
                    <div className="p-4 rounded-xl" style={{ background: "#E6F4EE", border: "1px solid #C3E6D8" }}>
                      <div className="flex items-center gap-2 mb-1">
                        <Sprout className="w-4 h-4" style={{ color: "#2F8F6B" }} />
                        <span className="text-xs" style={{ color: "#0F3D2E", fontWeight: 700 }}>Learner Path</span>
                      </div>
                      <p className="text-xs" style={{ color: "#374151", lineHeight: 1.6 }}>
                        You'll receive beginner-friendly mission recommendations, skill guides, and connect with other learners in your area.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* ── Job Ready onboarding ── */}
              {role === "jobready" && (
                <div>
                  <h2 className="mb-1" style={{ fontFamily: "'Manrope', sans-serif", fontWeight: 800, color: "#0F3D2E", fontSize: "1.3rem" }}>
                    Build your skills profile
                  </h2>
                  <p className="text-sm mb-5" style={{ color: "#6B7280" }}>
                    Tell us what you bring so we can match you with real projects.
                  </p>
                  <div className="space-y-4">
                    <Field label="I am a...">
                      <div className="flex gap-2">
                        {["Volunteer", "Professional", "Student"].map(r => (
                          <button key={r} onClick={() => setForm(f => ({ ...f, subRole: r.toLowerCase() }))}
                            className="flex-1 py-2.5 rounded-xl text-xs transition-all"
                            style={{ background: form.subRole === r.toLowerCase() ? "#0F3D2E" : "#F3F4F6", color: form.subRole === r.toLowerCase() ? "white" : "#6B7280", fontWeight: form.subRole === r.toLowerCase() ? 700 : 500 }}>
                            {r}
                          </button>
                        ))}
                      </div>
                    </Field>
                    <Field label="Location">
                      <input type="text" placeholder="Barangay, Municipality, Province"
                        value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
                        onFocus={focusStyle} onBlur={blurStyle}
                        className="w-full px-4 py-3 rounded-xl text-sm outline-none" style={inputStyle} />
                    </Field>
                    <Field label="Your Skills">
                      <div className="flex flex-wrap gap-2">
                        {SKILLS.map(skill => (
                          <TagButton key={skill} label={skill} selected={selectedSkills.includes(skill)} onToggle={() => toggleSkill(skill)} />
                        ))}
                      </div>
                    </Field>
                    <Field label="Availability">
                      <select value={form.availability} onChange={e => setForm(f => ({ ...f, availability: e.target.value }))}
                        onFocus={focusStyle} onBlur={blurStyle}
                        className="w-full px-4 py-3 rounded-xl text-sm outline-none appearance-none"
                        style={{ ...inputStyle, color: form.availability ? "#374151" : "#9CA3AF" }}>
                        <option value="">Select availability</option>
                        <option>Weekends</option><option>Full-time</option><option>Project-based</option><option>Emergency only</option>
                      </select>
                    </Field>
                  </div>
                </div>
              )}

              {/* ── Organization onboarding ── */}
              {role === "organization" && (
                <div>
                  <h2 className="mb-1" style={{ fontFamily: "'Manrope', sans-serif", fontWeight: 800, color: "#0F3D2E", fontSize: "1.3rem" }}>
                    Organisation Details
                  </h2>
                  <p className="text-sm mb-5" style={{ color: "#6B7280" }}>
                    Tell us about your organisation so we can connect you with the right people.
                  </p>
                  <div className="space-y-3">
                    <Field label="Organisation Name">
                      <input type="text" placeholder="e.g. EcoAction PH"
                        value={form.orgName} onChange={e => setForm(f => ({ ...f, orgName: e.target.value }))}
                        onFocus={focusStyle} onBlur={blurStyle}
                        className="w-full px-4 py-3 rounded-xl text-sm outline-none" style={inputStyle} />
                    </Field>
                    <Field label="Organisation Type">
                      <select value={form.orgType} onChange={e => setForm(f => ({ ...f, orgType: e.target.value }))}
                        onFocus={focusStyle} onBlur={blurStyle}
                        className="w-full px-4 py-3 rounded-xl text-sm outline-none appearance-none"
                        style={{ ...inputStyle, color: form.orgType ? "#374151" : "#9CA3AF" }}>
                        <option value="">Select type</option>
                        <option>NGO</option><option>Government</option><option>Community Group</option><option>Private</option>
                      </select>
                    </Field>
                    <Field label="Focus Areas">
                      <div className="flex flex-wrap gap-2">
                        {FOCUS_AREAS.map(area => (
                          <TagButton key={area} label={area} selected={selectedFocus.includes(area)} onToggle={() => toggleFocus(area)} />
                        ))}
                      </div>
                    </Field>
                    <Field label="Short Bio">
                      <textarea rows={3} placeholder="Describe your organisation's mission (150 words)..."
                        value={form.bio} onChange={e => setForm(f => ({ ...f, bio: e.target.value }))}
                        onFocus={focusStyle} onBlur={blurStyle}
                        className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                        style={{ ...inputStyle, resize: "vertical" }} />
                    </Field>
                  </div>
                </div>
              )}

              {/* CTA */}
              <div className="flex gap-3 mt-6">
                <button
                  onClick={handleFinalSignup}
                  disabled={loading}
                  className="flex-1 py-3.5 rounded-xl text-white text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                  style={{ background: "linear-gradient(135deg, #0F3D2E 0%, #2F8F6B 100%)", fontWeight: 700, fontFamily: "'Manrope', sans-serif", boxShadow: "0 4px 16px rgba(47,143,107,0.35)" }}
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                    role === "organization" ? "Save & Continue 🌱" : role === "jobready" ? "Build My Profile 🌱" : "Start Learning 🌱"
                  )}
                </button>
              </div>
              <div className="text-center mt-3">
                <button onClick={() => navigate("/dashboard")} className="text-xs" style={{ color: "#9CA3AF" }}>
                  Skip for now →
                </button>
              </div>
            </div>
          )}

          {/* ═══ LOG IN ═══ */}
          {tab === "login" && (
            <form onSubmit={handleLogin} className="space-y-3">
              <div className="mb-2">
                <h2 className="mb-1" style={{ fontFamily: "'Manrope', sans-serif", fontWeight: 800, color: "#0F3D2E", fontSize: "1.4rem" }}>
                  Welcome back
                </h2>
                <p className="text-sm" style={{ color: "#6B7280" }}>
                  Log in to continue your climate journey.
                </p>
              </div>

              <Field label="Email Address">
                <input type="email" placeholder="you@example.com"
                  value={loginData.email} onChange={e => setLoginData(l => ({ ...l, email: e.target.value }))}
                  onFocus={focusStyle} onBlur={blurStyle}
                  className="w-full px-4 py-3 rounded-xl text-sm outline-none" style={inputStyle} required />
              </Field>

              <Field label="Password">
                <div className="relative">
                  <input type={showPass ? "text" : "password"} placeholder="Your password"
                    value={loginData.password} onChange={e => setLoginData(l => ({ ...l, password: e.target.value }))}
                    onFocus={focusStyle} onBlur={blurStyle}
                    className="w-full px-4 py-3 rounded-xl text-sm outline-none pr-10" style={inputStyle} required />
                  <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2">
                    {showPass ? <EyeOff className="w-4 h-4" style={{ color: "#9CA3AF" }} /> : <Eye className="w-4 h-4" style={{ color: "#9CA3AF" }} />}
                  </button>
                </div>
              </Field>

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-xs" style={{ color: "#6B7280" }}>
                  <input type="checkbox" checked={loginData.remember}
                    onChange={e => setLoginData(l => ({ ...l, remember: e.target.checked }))}
                    className="rounded" />
                  Remember me
                </label>
                <button 
                  type="button" 
                  onClick={() => { setShowForgotPassword(true); setForgotError(null); setForgotSuccess(false); setForgotEmail(""); }}
                  className="text-xs" 
                  style={{ color: "#2F8F6B", fontWeight: 600 }}
                >
                  Forgot password?
                </button>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-xl text-white flex items-center justify-center gap-2 mt-2 disabled:opacity-50"
                style={{ background: "linear-gradient(135deg, #0F3D2E 0%, #2F8F6B 100%)", fontWeight: 700, fontFamily: "'Manrope', sans-serif", boxShadow: "0 4px 16px rgba(47,143,107,0.35)" }}
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Log In →"}
              </button>

              <div className="relative my-4 flex items-center gap-3">
                <div className="flex-1 h-px" style={{ background: "#E5E7EB" }} />
                <span className="text-xs" style={{ color: "#9CA3AF" }}>or</span>
                <div className="flex-1 h-px" style={{ background: "#E5E7EB" }} />
              </div>

              <button
                type="button"
                onClick={handleGoogleAuth}
                disabled={loading}
                className="w-full py-3 rounded-xl text-sm flex items-center justify-center gap-3 transition-all disabled:opacity-50"
                style={{ border: "1.5px solid #E5E7EB", background: "white", color: "#374151", fontWeight: 600 }}
                onMouseEnter={e => (e.currentTarget.style.background = "#F9FAFB")}
                onMouseLeave={e => (e.currentTarget.style.background = "white")}
              >
                <GoogleIcon />
                Continue with Google
              </button>

              <p className="text-center text-xs mt-4" style={{ color: "#9CA3AF" }}>
                Don't have an account?{" "}
                <button type="button" onClick={() => setTab("signup")} style={{ color: "#2F8F6B", fontWeight: 600 }}>
                  Sign up free
                </button>
              </p>
            </form>
          )}

        </div>
      </div>

      {/* ═══ FORGOT PASSWORD MODAL ═══ */}
      {showForgotPassword && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md bg-white dark:bg-[#132B23] rounded-2xl p-6 shadow-xl">
            {forgotSuccess ? (
              // Success state
              <div className="text-center py-4">
                <div className="mx-auto mb-4 w-14 h-14 rounded-full bg-[#E6F4EE] dark:bg-[#1E3B34] flex items-center justify-center">
                  <CheckCircle className="w-7 h-7 text-[#2F8F6B]" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                  Check your email
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-300 mb-6">
                  We sent a password reset link to <strong>{forgotEmail}</strong>. 
                  Click the link in the email to reset your password.
                </p>
                <button
                  onClick={() => { setShowForgotPassword(false); setForgotSuccess(false); }}
                  className="w-full py-3 rounded-xl text-white font-semibold"
                  style={{ background: "linear-gradient(135deg, #0F3D2E 0%, #2F8F6B 100%)" }}
                >
                  Back to Login
                </button>
              </div>
            ) : (
              // Form state
              <form onSubmit={handleForgotPassword}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                    Reset Password
                  </h3>
                  <button
                    type="button"
                    onClick={() => setShowForgotPassword(false)}
                    className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">
                  Enter your email address and we will send you a link to reset your password.
                </p>

                {forgotError && (
                  <div className="mb-4 p-3 rounded-xl text-sm bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400">
                    {forgotError}
                  </div>
                )}

                <div className="mb-4">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="email"
                      placeholder="you@example.com"
                      value={forgotEmail}
                      onChange={e => setForgotEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 rounded-xl text-sm border border-slate-200 dark:border-[#1E3B34] bg-white dark:bg-[#0D1F18] text-slate-900 dark:text-white outline-none focus:border-[#2F8F6B] dark:focus:border-[#6DD4A8]"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={forgotLoading || !forgotEmail}
                  className="w-full py-3 rounded-xl text-white font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
                  style={{ background: "linear-gradient(135deg, #0F3D2E 0%, #2F8F6B 100%)" }}
                >
                  {forgotLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    "Send Reset Link"
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setShowForgotPassword(false)}
                  className="w-full mt-3 py-2.5 text-sm text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                >
                  Back to Login
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Small reusable helpers ────────────────────────────────────────────────────

const inputStyle: React.CSSProperties = {
  border: "1.5px solid #E5E7EB",
  background: "white",
  color: "#374151",
};

const focusStyle = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
  e.currentTarget.style.borderColor = "#2F8F6B";
};
const blurStyle = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
  e.currentTarget.style.borderColor = "#E5E7EB";
};

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-foreground mb-1.5">{label}</label>
      {children}
      {error && (
        <p className="mt-1 text-xs font-medium" style={{ color: "#EF4444" }}>
          {error}
        </p>
      )}
    </div>
  );
}

function TagButton({ label, selected, onToggle }: { label: string; selected: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
        selected 
          ? "bg-[#0F3D2E] text-white" 
          : "bg-[#F3F4F6] dark:bg-[#1E3B34] text-muted-foreground hover:bg-[#E6F4EE] dark:hover:bg-[#132B23]"
      }`}
    >
      {selected && "✓ "}{label}
    </button>
  );
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-4 h-4">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );
}
