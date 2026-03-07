import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { Leaf, Eye, EyeOff, CheckCircle, Globe, Sprout, ChevronRight, ArrowLeft, Loader2 } from "lucide-react";
import { useAuth } from "../hooks/useAuth";

export function AuthPage() {
  const navigate = useNavigate();
  const { signUp, signIn, signInWithGoogle } = useAuth();
  
  const [tab, setTab] = useState<"signup" | "login">("signup");
  const [userType, setUserType] = useState<"poster" | "responder" | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    region: "",
  });

  const [loginData, setLoginData] = useState({
    email: "",
    password: "",
    remember: false,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setError(null);
  };

  const handleLoginChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setLoginData(prev => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
    setError(null);
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (step === 1 && userType) {
      setStep(2);
      return;
    }
  };

  const handleFinalSignup = async () => {
    if (!userType) return;
    
    setLoading(true);
    setError(null);
    
    const { error } = await signUp({
      email: formData.email,
      password: formData.password,
      fullName: formData.fullName,
      region: formData.region,
      userType,
    });

    setLoading(false);

    if (error) {
      setError(error.message);
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
    
    const { error } = await signInWithGoogle();
    
    if (error) {
      setLoading(false);
      setError(error.message);
    }
    // Note: On success, the user will be redirected by Supabase
  };

  return (
    <div className="min-h-screen bg-[#F9FDFB] flex">
      {/* Left panel */}
      <div className="hidden lg:flex w-1/2 bg-[#0F3D2E] flex-col justify-between p-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0F3D2E] to-[#1A5C43]" />
        <div className="absolute bottom-0 left-0 w-80 h-80 rounded-full bg-[#2F8F6B]/10 blur-3xl" />
        <div className="absolute top-20 right-0 w-60 h-60 rounded-full bg-[#6DD4A8]/5 blur-3xl" />
        <div className="relative">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-9 h-9 bg-[#2F8F6B] rounded-xl flex items-center justify-center">
              <Leaf className="w-5 h-5 text-white" />
            </div>
            <span className="text-white font-[Manrope] font-bold text-xl">
              Skill<span className="text-[#6DD4A8]">Seed</span>
            </span>
          </Link>
        </div>
        <div className="relative">
          <h2 className="text-white font-[Manrope] font-bold text-3xl mb-4 leading-tight">
            Join the climate<br />skills movement
          </h2>
          <p className="text-[#A8D5BF] text-base leading-relaxed mb-8">
            Connect your skills with climate projects that matter. Learn, act, and build a greener future together.
          </p>
          <div className="space-y-3">
            {[
              "Match with 847 active climate projects",
              "Earn verified impact credentials",
              "Join 12,000+ climate champions",
              "Access funding for your projects",
            ].map((item) => (
              <div key={item} className="flex items-center gap-3 text-sm text-[#A8D5BF]">
                <CheckCircle className="w-4 h-4 text-[#6DD4A8] flex-shrink-0" />
                {item}
              </div>
            ))}
          </div>
        </div>
        <div className="relative flex items-center gap-3 bg-white/10 rounded-2xl p-4">
          <div className="w-10 h-10 bg-[#2F8F6B] rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">
            AL
          </div>
          <div>
            <p className="text-white font-semibold text-sm">"SkillSeed helped me find purpose through action."</p>
            <p className="text-[#A8D5BF] text-xs mt-0.5">Ana Lim, Climate Volunteer · Manila</p>
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-[#0F3D2E] rounded-lg flex items-center justify-center">
                <Leaf className="w-5 h-5 text-white" />
              </div>
              <span className="text-[#0F3D2E] font-[Manrope] font-bold text-xl">
                Skill<span className="text-[#2F8F6B]">Seed</span>
              </span>
            </Link>
          </div>

          {/* Tab switcher */}
          <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-8">
            {(["signup", "login"] as const).map(t => (
              <button
                key={t}
                onClick={() => { setTab(t); setStep(1); setError(null); }}
                className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
                  tab === t ? "bg-white text-[#0F3D2E] shadow-sm" : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {t === "signup" ? "Create Account" : "Log In"}
              </button>
            ))}
          </div>

          {/* Error display */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
              {error}
            </div>
          )}

          {tab === "signup" && (
            <>
              {step === 1 && (
                <>
                  <div className="mb-6">
                    <h1 className="text-[#0F3D2E] font-[Manrope] font-bold text-2xl mb-1">Join SkillSeed</h1>
                    <p className="text-gray-500 text-sm">Start your climate journey today.</p>
                  </div>

                  {/* User type selector */}
                  <div className="mb-6">
                    <label className="text-sm font-semibold text-[#0F3D2E] block mb-3">I want to:</label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setUserType("poster")}
                        className={`p-4 rounded-xl border-2 text-left transition-all ${
                          userType === "poster"
                            ? "border-teal-500 bg-teal-50"
                            : "border-gray-200 hover:border-[#2F8F6B]/50"
                        }`}
                      >
                        <Globe className={`w-6 h-6 mb-2 ${userType === "poster" ? "text-teal-600" : "text-gray-400"}`} />
                        <p className="font-semibold text-sm text-[#0F3D2E]">Post a Project</p>
                        <p className="text-xs text-gray-500 mt-0.5">I need people</p>
                      </button>
                      <button
                        type="button"
                        onClick={() => setUserType("responder")}
                        className={`p-4 rounded-xl border-2 text-left transition-all ${
                          userType === "responder"
                            ? "border-[#2F8F6B] bg-[#E6F4EE]"
                            : "border-gray-200 hover:border-[#2F8F6B]/50"
                        }`}
                      >
                        <Sprout className={`w-6 h-6 mb-2 ${userType === "responder" ? "text-[#2F8F6B]" : "text-gray-400"}`} />
                        <p className="font-semibold text-sm text-[#0F3D2E]">Offer Skills</p>
                        <p className="text-xs text-gray-500 mt-0.5">I have skills</p>
                      </button>
                    </div>
                  </div>

                  <form onSubmit={handleSignup} className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700 block mb-1.5">Full Name</label>
                      <input
                        name="fullName"
                        type="text"
                        value={formData.fullName}
                        onChange={handleChange}
                        placeholder="Your full name"
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2F8F6B]/30 focus:border-[#2F8F6B]"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700 block mb-1.5">Email Address</label>
                      <input
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="you@example.com"
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2F8F6B]/30 focus:border-[#2F8F6B]"
                        required
                      />
                    </div>
                    <div className="relative">
                      <label className="text-sm font-medium text-gray-700 block mb-1.5">Password</label>
                      <input
                        name="password"
                        type={showPassword ? "text" : "password"}
                        value={formData.password}
                        onChange={handleChange}
                        placeholder="Min. 8 characters"
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2F8F6B]/30 focus:border-[#2F8F6B] pr-10"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-9 text-gray-400 hover:text-gray-600"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700 block mb-1.5">Region</label>
                      <select
                        name="region"
                        value={formData.region}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2F8F6B]/30 bg-white"
                      >
                        <option value="">Select your region</option>
                        <option>Luzon</option>
                        <option>Visayas</option>
                        <option>Mindanao</option>
                        <option>Other</option>
                      </select>
                    </div>

                    <button
                      type="submit"
                      disabled={!userType}
                      className="w-full bg-[#0F3D2E] text-white py-3.5 rounded-xl font-semibold hover:bg-[#2F8F6B] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
                    >
                      Create My Account
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </form>

                  <div className="relative my-4">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-200" />
                    </div>
                    <div className="relative flex justify-center">
                      <span className="bg-[#F9FDFB] px-3 text-xs text-gray-500">or</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleGoogleAuth}
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-3 py-3 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
                  >
                    <svg viewBox="0 0 24 24" className="w-5 h-5" xmlns="http://www.w3.org/2000/svg">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                    </svg>
                    Continue with Google
                  </button>

                  <p className="text-xs text-gray-400 text-center mt-4">
                    By signing up you agree to our{" "}
                    <Link to="/" className="text-[#2F8F6B] hover:underline">Terms</Link>.
                    {" "}All profiles are subject to vetting.
                  </p>
                </>
              )}

              {step === 2 && (
                <OnboardingStep 
                  userType={userType!} 
                  onBack={() => setStep(1)} 
                  onComplete={handleFinalSignup}
                  loading={loading}
                />
              )}
            </>
          )}

          {tab === "login" && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="mb-2">
                <h1 className="text-[#0F3D2E] font-[Manrope] font-bold text-2xl mb-1">Welcome back</h1>
                <p className="text-gray-500 text-sm">Log in to your SkillSeed account.</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1.5">Email Address</label>
                <input
                  name="email"
                  type="email"
                  value={loginData.email}
                  onChange={handleLoginChange}
                  placeholder="you@example.com"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2F8F6B]/30 focus:border-[#2F8F6B]"
                  required
                />
              </div>
              <div className="relative">
                <label className="text-sm font-medium text-gray-700 block mb-1.5">Password</label>
                <input
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={loginData.password}
                  onChange={handleLoginChange}
                  placeholder="Your password"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2F8F6B]/30 focus:border-[#2F8F6B] pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-9 text-gray-400"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-sm text-gray-600">
                  <input 
                    type="checkbox" 
                    name="remember"
                    checked={loginData.remember}
                    onChange={handleLoginChange}
                    className="rounded" 
                  />
                  Remember me
                </label>
                <Link to="/" className="text-sm text-[#2F8F6B] hover:underline">Forgot password?</Link>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-[#0F3D2E] text-white py-3.5 rounded-xl font-semibold hover:bg-[#2F8F6B] transition-colors disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Log In"}
              </button>

              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200" /></div>
                <div className="relative flex justify-center"><span className="bg-[#F9FDFB] px-3 text-xs text-gray-500">or</span></div>
              </div>

              <button 
                type="button" 
                onClick={handleGoogleAuth}
                disabled={loading}
                className="w-full flex items-center justify-center gap-3 py-3 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                <svg viewBox="0 0 24 24" className="w-5 h-5" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
                Continue with Google
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

function OnboardingStep({ userType, onBack, onComplete, loading }: { 
  userType: "poster" | "responder"; 
  onBack: () => void;
  onComplete: () => void;
  loading: boolean;
}) {
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
  };

  const posterTags = ["Disaster Response", "Reforestation", "Marine", "Urban", "Agriculture", "Education"];
  const responderSkills = ["GIS Mapping", "Soil Science", "Forestry", "Disaster Response", "Community Organising", "Urban Farming", "Solar Installation", "Teaching", "Medical", "Construction"];

  return (
    <div>
      <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-[#0F3D2E] mb-4 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back
      </button>
      {/* Progress bar */}
      <div className="mb-6">
        <div className="flex justify-between text-xs text-gray-500 mb-1.5">
          <span>Step 2 of 2: {userType === "poster" ? "Organisation Details" : "Your Profile"}</span>
          <span className="font-semibold text-[#2F8F6B]">Almost done!</span>
        </div>
        <div className="h-2 bg-gray-100 rounded-full">
          <div className="h-full bg-[#2F8F6B] rounded-full w-full transition-all" />
        </div>
      </div>

      <h2 className="text-[#0F3D2E] font-[Manrope] font-bold text-xl mb-4">
        {userType === "poster" ? "Tell us about your organisation" : "Share your skills"}
      </h2>

      <div className="space-y-4">
        {userType === "poster" ? (
          <>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1.5">Organisation Name</label>
              <input type="text" placeholder="e.g. GreenCity Initiative" className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2F8F6B]/30 focus:border-[#2F8F6B]" />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1.5">Organisation Type</label>
              <select className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#2F8F6B]/30">
                <option>Select type...</option>
                <option>NGO</option>
                <option>Government</option>
                <option>Community Group</option>
                <option>Private</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-2">Focus Areas</label>
              <div className="flex flex-wrap gap-2">
                {posterTags.map(tag => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleTag(tag)}
                    className={`text-xs font-medium px-3 py-1.5 rounded-full border transition-colors ${
                      selectedTags.includes(tag)
                        ? "bg-[#0F3D2E] text-white border-[#0F3D2E]"
                        : "border-gray-200 text-gray-600 hover:border-[#2F8F6B]"
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          </>
        ) : (
          <>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1.5">Location</label>
              <input type="text" placeholder="Barangay, Municipality, Province" className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2F8F6B]/30 focus:border-[#2F8F6B]" />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-2">Your Skills</label>
              <div className="flex flex-wrap gap-2">
                {responderSkills.map(skill => (
                  <button
                    key={skill}
                    type="button"
                    onClick={() => toggleTag(skill)}
                    className={`text-xs font-medium px-3 py-1.5 rounded-full border transition-colors ${
                      selectedTags.includes(skill)
                        ? "bg-[#2F8F6B] text-white border-[#2F8F6B]"
                        : "border-gray-200 text-gray-600 hover:border-[#2F8F6B]"
                    }`}
                  >
                    {skill}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1.5">Availability</label>
              <select className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#2F8F6B]/30">
                <option>Select availability...</option>
                <option>Weekends</option>
                <option>Full-time</option>
                <option>Project-based</option>
                <option>Emergency only</option>
              </select>
            </div>
          </>
        )}

        <button
          type="button"
          onClick={onComplete}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 bg-[#0F3D2E] text-white py-3.5 rounded-xl font-semibold hover:bg-[#2F8F6B] transition-colors mt-2 disabled:opacity-50"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <>
              {userType === "poster" ? "Save and Continue" : "Build My Profile"}
              <ChevronRight className="w-4 h-4" />
            </>
          )}
        </button>
        <button type="button" className="w-full text-center text-sm text-gray-400 hover:text-gray-600 py-2">
          Skip for Now
        </button>
      </div>
    </div>
  );
}
