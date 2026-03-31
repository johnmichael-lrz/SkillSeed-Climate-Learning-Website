import { useState, useEffect, useRef, useMemo } from "react";
import { Link, useNavigate } from "react-router";
import { motion, useReducedMotion } from "motion/react";
import {
  Sprout,
  Users,
  ArrowRight,
  Leaf,
  Zap,
  Wrench,
  Building2,
  Star,
  Globe,
  Clock,
  TrendingUp,
  Heart,
  Eye,
  Loader2,
} from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { fetchAllQuests } from "../utils/questService";
import type { Quest } from "../types/database";

const LANDING_VIEWPORT = { once: true as const, margin: "-48px 0px", amount: 0.2 as const };

function HeroAmbience({ reduced }: { reduced: boolean }) {
  if (reduced) return null;
  return (
    <>
      <motion.div
        aria-hidden
        className="pointer-events-none absolute -top-28 -left-20 w-[min(58vw,400px)] h-[min(58vw,400px)] rounded-full blur-3xl opacity-[0.38] dark:opacity-[0.22]"
        style={{ background: "radial-gradient(circle, #2F8F6B 0%, transparent 68%)" }}
        animate={{ x: [0, 28, 0], y: [0, 20, 0], scale: [1, 1.06, 1] }}
        transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        aria-hidden
        className="pointer-events-none absolute top-24 -right-24 w-[min(52vw,340px)] h-[min(52vw,340px)] rounded-full blur-3xl opacity-[0.28] dark:opacity-[0.18]"
        style={{ background: "radial-gradient(circle, #86efac 0%, transparent 70%)" }}
        animate={{ x: [0, -24, 0], y: [0, 32, 0], scale: [1, 1.08, 1] }}
        transition={{ duration: 19, repeat: Infinity, ease: "easeInOut", delay: 1.2 }}
      />
      <motion.div
        aria-hidden
        className="pointer-events-none absolute bottom-8 left-1/2 -translate-x-1/2 w-[min(92vw,560px)] h-40 rounded-full blur-3xl opacity-[0.22] dark:opacity-[0.12]"
        style={{ background: "radial-gradient(ellipse at center, rgba(52,211,153,0.45) 0%, transparent 70%)" }}
        animate={{ opacity: [0.18, 0.32, 0.18], scaleX: [1, 1.04, 1] }}
        transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
      />
    </>
  );
}

function FloatingSeeds({ reduced }: { reduced: boolean }) {
  if (reduced) return null;
  return (
    <>
      <motion.div
        aria-hidden
        className="pointer-events-none absolute top-[18%] right-[8%] text-[#2F8F6B]/25 dark:text-emerald-400/20"
        animate={{ y: [0, -10, 0], rotate: [0, 6, 0] }}
        transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut" }}>
        <Leaf className="w-12 h-12 md:w-16 md:h-16" strokeWidth={1.25} />
      </motion.div>
      <motion.div
        aria-hidden
        className="pointer-events-none absolute bottom-[22%] left-[6%] text-[#2F8F6B]/20 dark:text-emerald-400/15"
        animate={{ y: [0, 12, 0], rotate: [0, -8, 0] }}
        transition={{ duration: 6.8, repeat: Infinity, ease: "easeInOut", delay: 0.8 }}>
        <Sprout className="w-10 h-10 md:w-14 md:h-14" strokeWidth={1.25} />
      </motion.div>
    </>
  );
}

function useCounter(target: number, duration = 2000, trigger = false) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!trigger) return;
    let start = 0;
    const increment = target / (duration / 16);
    const timer = setInterval(() => {
      start += increment;
      if (start >= target) { setCount(target); clearInterval(timer); }
      else setCount(Math.floor(start));
    }, 16);
    return () => clearInterval(timer);
  }, [trigger, target, duration]);
  return count;
}

function AnimatedStat({ value, suffix, label, desc, recencyLabel = "Updated monthly" }: { value: number; suffix: string; label: string; desc?: string; recencyLabel?: string }) {
  const [triggered, setTriggered] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const count = useCounter(value, 2000, triggered);
  useEffect(() => {
    const observer = new IntersectionObserver(([e]) => { if (e.isIntersecting) setTriggered(true); }, { threshold: 0.5 });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);
  return (
    <div ref={ref} className="text-center">
      <div className="text-4xl sm:text-5xl mb-1" style={{ fontFamily: "'Manrope', sans-serif", fontWeight: 800, color: "white" }}>
        {count.toLocaleString()}{suffix}
      </div>
      <div className="text-sm" style={{ color: "rgba(255,255,255,0.9)", fontWeight: 600 }}>{label}</div>
      {desc && <div className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.68)" }}>{desc}</div>}
      {recencyLabel && (
        <div className="text-[10px] mt-2 leading-tight" style={{ color: "rgba(255,255,255,0.55)" }}>{recencyLabel}</div>
      )}
    </div>
  );
}

/** Visual variety when API returns the same badge for every quest */
function getQuestDisplayIcon(quest: Quest): string {
  if (quest.badge_icon && quest.badge_icon !== "🏆") return quest.badge_icon;
  const c = quest.category?.toLowerCase() ?? "";
  if (c.includes("community") || c.includes("barangay")) return "��";
  if (c.includes("circular") || c.includes("repair")) return "🔧";
  if (c.includes("waste") || c.includes("compost") || c.includes("zero")) return "♻️";
  if (c.includes("energy")) return "⚡";
  if (c.includes("water")) return "💧";
  if (c.includes("tree") || c.includes("forest")) return "🌳";
  return quest.badge_icon || "🌿";
}

const testimonials = [
  { name: "Maria Santos", role: "Urban Gardener · Quezon City", text: "SkillSeed helped me turn my rooftop into a productive food garden. The composting mission changed everything — I now teach my neighbors!", avatar: "MS", stars: 5 },
  { name: "James Reyes", role: "Solar Installer · Manila", text: "I completed the energy-saving missions and landed a job with a solar NGO. The hands-on format is incredible for real learning.", avatar: "JR", stars: 5 },
  { name: "Lena Cruz", role: "Community Organizer · Cebu", text: "Our barangay is running 3 repair cafés after learning through SkillSeed. The community challenges keep everyone motivated.", avatar: "LC", stars: 5 },
];

export function LandingPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const prefersReducedMotion = useReducedMotion();
  const reduceMotion = prefersReducedMotion === true;
  const [quests, setQuests] = useState<Quest[]>([]);
  const [questsLoading, setQuestsLoading] = useState(true);

  const heroItem = useMemo(
    () =>
      reduceMotion
        ? { hidden: { opacity: 1, y: 0 }, show: { opacity: 1, y: 0 } }
        : {
            hidden: { opacity: 0, y: 22 },
            show: { opacity: 1, y: 0, transition: { duration: 0.52, ease: [0.22, 1, 0.36, 1] as const } },
          },
    [reduceMotion]
  );

  const scrollFade = useMemo(
    () =>
      reduceMotion
        ? { hidden: { opacity: 1, y: 0 }, show: { opacity: 1, y: 0 } }
        : {
            hidden: { opacity: 0, y: 28 },
            show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] as const } },
          },
    [reduceMotion]
  );

  const staggerWrap = useMemo(
    () => ({
      hidden: {},
      show: { transition: { staggerChildren: reduceMotion ? 0 : 0.12, delayChildren: reduceMotion ? 0 : 0.04 } },
    }),
    [reduceMotion]
  );

  const staggerInView = useMemo(
    () => ({
      hidden: {},
      show: { transition: { staggerChildren: reduceMotion ? 0 : 0.14, delayChildren: reduceMotion ? 0 : 0.06 } },
    }),
    [reduceMotion]
  );

  const staggerCard = useMemo(
    () =>
      reduceMotion
        ? { hidden: { opacity: 1, y: 0, scale: 1 }, show: { opacity: 1, y: 0, scale: 1 } }
        : {
            hidden: { opacity: 0, y: 22, scale: 0.96 },
            show: {
              opacity: 1,
              y: 0,
              scale: 1,
              transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const },
            },
          },
    [reduceMotion]
  );

  // Fetch real quests on mount
  useEffect(() => {
    async function loadQuests() {
      try {
        const data = await fetchAllQuests();
        setQuests(data);
      } catch (err) {
        console.error("Error fetching quests for landing:", err);
      } finally {
        setQuestsLoading(false);
      }
    }
    loadQuests();
  }, []);

  // Take first 4 quests for display
  const displayQuests = quests.slice(0, 4);

  // Role card routing — auth-aware
  const handleRoleClick = (roleId: string) => {
    if (!user) {
      navigate("/auth");
      return;
    }
    // Logged-in users go to the appropriate page
    switch (roleId) {
      case "learner":
        navigate("/hands-on");
        break;
      case "jobready":
        navigate("/dashboard");
        break;
      case "org":
        navigate("/post-project");
        break;
      default:
        navigate("/dashboard");
    }
  };

  // Auth-aware CTA
  const handleJoinProject = () => {
    if (!user) {
      navigate("/auth");
    } else {
      navigate("/dashboard");
    }
  };

  const roles = [
    {
      id: "learner",
      icon: Sprout,
      title: "I'm a Learner",
      subtitle: "Beginner-friendly",
      desc: "Build climate skills from scratch with guided quests. No experience needed.",
      cta: "Start Learning",
      featured: false,
    },
    {
      id: "jobready",
      icon: Wrench,
      title: "I'm a Volunteer",
      subtitle: "Recommended",
      desc: "Deploy your skills on real climate projects. Build a verified impact portfolio.",
      cta: "Find Projects",
      featured: true,
    },
    {
      id: "org",
      icon: Building2,
      title: "I'm an Organization",
      subtitle: "Post projects",
      desc: "Get matched with skilled volunteers for your climate initiatives.",
      cta: "Post a Project",
      featured: false,
    },
  ];

  return (
    <div className="overflow-x-hidden">

      {/* ════════════════ HERO ════════════════ */}
      <section className="relative pt-20 pb-16 md:pb-20 lg:pb-24 overflow-hidden bg-white dark:bg-[#0D1F18]">
        {/* subtle dot pattern */}
        <div className="absolute inset-0 opacity-[0.02]" style={{ backgroundImage: "radial-gradient(#0F3D2E 1px, transparent 1px)", backgroundSize: "32px 32px" }} aria-hidden="true" />
        <HeroAmbience reduced={reduceMotion} />
        <FloatingSeeds reduced={reduceMotion} />

        <motion.div
          className="relative max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center"
          initial="hidden"
          animate="show"
          variants={staggerWrap}>
          <motion.p variants={heroItem} className="text-xs uppercase tracking-widest text-slate-500 dark:text-[#6DD4A8] mb-5 font-semibold">
            Climate skills platform
          </motion.p>
          <motion.h1
            variants={heroItem}
            className="mb-5 text-slate-900 dark:text-[#BEEBD7] text-balance"
            style={{ fontFamily: "'Manrope', sans-serif", fontWeight: 800, fontSize: "clamp(2.25rem, 5vw, 3.25rem)", lineHeight: 1.1, letterSpacing: "-0.02em" }}>
            Where climate action<br className="hidden sm:block" />
            <span className="text-[#2F8F6B] dark:text-[#6DD4A8]">finds its people.</span>
          </motion.h1>

          <motion.p
            variants={heroItem}
            className="mb-10 mx-auto text-base sm:text-lg text-slate-600 dark:text-[#94C8AF] text-pretty"
            style={{ lineHeight: 1.7, maxWidth: "520px" }}>
            Connect with short, real-world climate missions. Learn by doing. Build verified skills. Make measurable impact.
          </motion.p>

          <motion.div variants={heroItem} className="flex flex-col sm:flex-row gap-3 justify-center mb-10">
            <motion.button
              type="button"
              onClick={handleJoinProject}
              whileHover={reduceMotion ? undefined : { y: -1 }}
              whileTap={reduceMotion ? undefined : { scale: 0.98 }}
              className="inline-flex items-center justify-center gap-2 min-h-[48px] px-6 rounded-lg text-white font-semibold transition-all duration-200 cursor-pointer bg-[#0F3D2E] hover:bg-[#1a5241] active:scale-[0.98]"
              style={{ fontFamily: "'Manrope', sans-serif" }}>
              <Users className="w-4 h-4" /> Join a Project
            </motion.button>
            <motion.div whileHover={reduceMotion ? undefined : { y: -1 }} className="inline-flex justify-center">
              <Link to="/hands-on"
                className="inline-flex items-center justify-center gap-2 min-h-[48px] px-6 rounded-lg transition-all duration-200 bg-white border border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50 dark:bg-transparent dark:border-[#6DD4A8]/60 dark:text-[#BEEBD7] dark:hover:bg-white/10 font-semibold active:scale-[0.98]"
                style={{ fontFamily: "'Manrope', sans-serif" }}>
                <Sprout className="w-4 h-4" /> Browse Quests
              </Link>
            </motion.div>
          </motion.div>

          {/* Social proof - compact trust indicators */}
          <motion.div variants={heroItem} className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm text-slate-500">
            <div className="flex items-center gap-2">
              <div className="flex -space-x-1.5">
                {["MS", "JR", "LC", "AB"].map((i, idx) => (
                  <div
                    key={idx}
                    className="w-7 h-7 rounded-full border-2 border-white flex items-center justify-center text-[10px] text-white font-semibold"
                    style={{ background: ["#2F8F6B", "#059669", "#0F3D2E", "#34D399"][idx] }}>
                    {i}
                  </div>
                ))}
              </div>
              <span><strong className="text-slate-700">12k+</strong> members</span>
            </div>
            <span className="hidden sm:inline text-slate-300">|</span>
            <span className="flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5" /> 87 countries
            </span>
            <span className="hidden sm:inline text-slate-300">|</span>
            <span>Free to join</span>
          </motion.div>
        </motion.div>

        {/* Mission & Vision cards */}
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mt-16 md:mt-20">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <motion.div
              className="rounded-xl p-6 sm:p-7 text-left bg-slate-50 dark:bg-[#132B23] border border-slate-100 dark:border-[#6DD4A8]/20"
              variants={scrollFade}
              initial="hidden"
              whileInView="show"
              viewport={LANDING_VIEWPORT}
              transition={{ delay: reduceMotion ? 0 : 0.05 }}
              whileHover={reduceMotion ? undefined : { y: -3, transition: { duration: 0.2 } }}>
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-[#0F3D2E]">
                  <Heart className="w-4 h-4 text-white" />
                </div>
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-[#6DD4A8]">Mission</span>
              </div>
              <h3 className="mb-2.5 text-slate-900 dark:text-[#BEEBD7]" style={{ fontFamily: "'Manrope', sans-serif", fontWeight: 700, fontSize: "1.05rem", lineHeight: 1.4 }}>
                Build capacity. Deploy people. Solve climate challenges.
              </h3>
              <p className="text-slate-600 dark:text-[#94C8AF] text-sm leading-relaxed">
                Starting in the Philippines and growing globally. Rooted in community, driven by people.
              </p>
            </motion.div>
            <motion.div
              className="rounded-xl p-6 sm:p-7 text-left bg-slate-50 dark:bg-[#132B23] border border-slate-100 dark:border-[#6DD4A8]/20"
              variants={scrollFade}
              initial="hidden"
              whileInView="show"
              viewport={LANDING_VIEWPORT}
              transition={{ delay: reduceMotion ? 0 : 0.12 }}
              whileHover={reduceMotion ? undefined : { y: -3, transition: { duration: 0.2 } }}>
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-[#0F3D2E]">
                  <Eye className="w-4 h-4 text-white" />
                </div>
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-[#6DD4A8]">Vision</span>
              </div>
              <h3 className="mb-2.5 text-slate-900 dark:text-[#BEEBD7]" style={{ fontFamily: "'Manrope', sans-serif", fontWeight: 700, fontSize: "1.05rem", lineHeight: 1.4 }}>
                A world where no climate crisis goes unanswered.
              </h3>
              <p className="text-slate-600 dark:text-[#94C8AF] text-sm leading-relaxed">
                The people and skills to respond already exist in every community.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ════════════════ HOW IT WORKS ════════════════ */}
      <section className="py-20 md:py-24 bg-white dark:bg-[#0D1F18]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="text-center mb-12"
            variants={scrollFade}
            initial="hidden"
            whileInView="show"
            viewport={LANDING_VIEWPORT}>
            <h2 className="mb-3 text-slate-900 dark:text-[#BEEBD7]" style={{ fontFamily: "'Manrope', sans-serif", fontWeight: 800, fontSize: "clamp(1.5rem, 3vw, 2rem)" }}>
              How it works
            </h2>
            <p className="max-w-md mx-auto text-slate-600 dark:text-[#94C8AF]">
              From skill building to real-world action in three steps.
            </p>
          </motion.div>

          <motion.div
            className="grid grid-cols-1 md:grid-cols-3 gap-5"
            variants={staggerInView}
            initial="hidden"
            whileInView="show"
            viewport={LANDING_VIEWPORT}>
            {[
              { step: "1", icon: Sprout, title: "Browse or Post", desc: "Explore climate missions that match your interests, or post a project needing volunteers." },
              { step: "2", icon: Users, title: "Match & Connect", desc: "Get matched with the right people. Learners find mentors. Organizations find skilled volunteers." },
              { step: "3", icon: TrendingUp, title: "Make Impact", desc: "Complete missions, earn verified credentials, and track your environmental impact." },
            ].map(({ step, icon: Icon, title, desc }) => (
              <motion.div
                key={step}
                variants={staggerCard}
                whileHover={reduceMotion ? undefined : { y: -3 }}
                className="relative bg-slate-50 dark:bg-[#132B23] rounded-xl p-6 text-center border border-slate-100 dark:border-[#6DD4A8]/15">
                <div className="relative inline-flex items-center justify-center w-12 h-12 rounded-lg mb-4 bg-[#0F3D2E]">
                  <Icon className="w-5 h-5 text-white" />
                  <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full text-[#0F3D2E] bg-white flex items-center justify-center text-[10px] font-bold ring-2 ring-slate-50 dark:ring-[#132B23]">
                    {step}
                  </span>
                </div>
                <h3 className="mb-2 text-slate-900 dark:text-[#BEEBD7]" style={{ fontFamily: "'Manrope', sans-serif", fontWeight: 700 }}>{title}</h3>
                <p className="text-sm text-slate-600 dark:text-[#94C8AF] leading-relaxed">{desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ════════════════ STATS ════════════════ */}
      <section className="py-16 md:py-20 relative overflow-hidden bg-[#0F3D2E]">
        {!reduceMotion && (
          <motion.div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-25"
            style={{
              background: "radial-gradient(ellipse 70% 50% at 50% 50%, rgba(109,212,168,0.3) 0%, transparent 60%)",
            }}
            animate={{ opacity: [0.2, 0.3, 0.2] }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          />
        )}
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-[1]">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6 md:gap-8">
            <AnimatedStat value={12840} suffix="+" label="Active Members" desc="across 87 countries" />
            <AnimatedStat value={1240} suffix="+" label="Missions Completed" desc="verified impact" />
            <AnimatedStat value={87} suffix="" label="Countries Reached" desc="and growing" />
          </div>
          <p className="text-center text-xs mt-8 text-white/50">
            Figures updated monthly
          </p>
        </div>
      </section>

      {/* ════════════════ WHO IT'S FOR ════════════════ */}
      <section className="py-20 md:py-24 bg-slate-50 dark:bg-[#0D1F18]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="text-center mb-12"
            variants={scrollFade}
            initial="hidden"
            whileInView="show"
            viewport={LANDING_VIEWPORT}>
            <h2 className="mb-3 text-slate-900 dark:text-[#BEEBD7]" style={{ fontFamily: "'Manrope', sans-serif", fontWeight: 800, fontSize: "clamp(1.5rem, 3vw, 2rem)" }}>
              Built for everyone
            </h2>
            <p className="max-w-md mx-auto text-slate-600 dark:text-[#94C8AF]">
              Whether you're learning, volunteering, or leading projects.
            </p>
          </motion.div>

          <motion.div
            className="grid grid-cols-1 md:grid-cols-3 gap-4"
            variants={staggerInView}
            initial="hidden"
            whileInView="show"
            viewport={LANDING_VIEWPORT}>
            {roles.map(({ id, icon: Icon, title, subtitle, desc, cta, featured }) => (
              <motion.button
                key={id}
                type="button"
                variants={staggerCard}
                whileHover={reduceMotion ? undefined : { y: -3 }}
                whileTap={reduceMotion ? undefined : { scale: 0.98 }}
                className={`min-h-[200px] rounded-xl p-6 flex flex-col text-left cursor-pointer transition-all duration-200 bg-white dark:bg-[#132B23] border focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2F8F6B] focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[#0D1F18] ${
                  featured
                    ? "border-[#2F8F6B] ring-1 ring-[#2F8F6B]/30 shadow-md shadow-[#2F8F6B]/10 dark:border-[#6DD4A8] dark:ring-[#6DD4A8]/20"
                    : "border-slate-200 hover:border-slate-300 dark:border-[#1E3B34] dark:hover:border-[#2F8F6B]/50"
                }`}
                onClick={() => handleRoleClick(id)}>
                {/* Icon tile */}
                <div className={`w-11 h-11 rounded-lg flex items-center justify-center mb-4 ${
                  featured 
                    ? "bg-[#0F3D2E] dark:bg-[#2F8F6B]" 
                    : "bg-slate-100 dark:bg-[#1E3B34]"
                }`}>
                  <Icon className={`w-5 h-5 ${featured ? "text-white" : "text-[#0F3D2E] dark:text-[#6DD4A8]"}`} />
                </div>
                {/* Subtitle pill */}
                <span className={`inline-flex items-center text-[11px] uppercase tracking-wide font-semibold mb-2 ${
                  featured 
                    ? "text-[#2F8F6B] dark:text-[#6DD4A8]" 
                    : "text-slate-400 dark:text-[#94C8AF]"
                }`}>
                  {featured && <span className="w-1.5 h-1.5 rounded-full bg-[#2F8F6B] dark:bg-[#6DD4A8] mr-1.5" />}
                  {subtitle}
                </span>
                {/* Title */}
                <h3 className="mb-2 text-slate-900 dark:text-[#BEEBD7]" style={{ fontFamily: "'Manrope', sans-serif", fontWeight: 700, fontSize: "1.05rem" }}>
                  {title}
                </h3>
                {/* Description */}
                <p className="text-sm mb-5 flex-1 leading-relaxed text-slate-600 dark:text-[#94C8AF]">
                  {desc}
                </p>
                {/* CTA */}
                <span className="mt-auto inline-flex items-center gap-1.5 text-sm font-semibold text-[#0F3D2E] dark:text-[#6DD4A8] group-hover:gap-2 transition-all">
                  {cta} <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </motion.button>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ════════════════ FEATURED QUESTS ════════════════ */}
      <section className="py-20 md:py-24 bg-white dark:bg-[#10271f]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-10"
            variants={scrollFade}
            initial="hidden"
            whileInView="show"
            viewport={LANDING_VIEWPORT}>
            <div>
              <h2 className="text-slate-900 dark:text-emerald-50" style={{ fontFamily: "'Manrope', sans-serif", fontWeight: 800, fontSize: "clamp(1.5rem, 3vw, 2rem)" }}>
                Featured quests
              </h2>
              <p className="text-slate-600 dark:text-emerald-200/75 text-sm mt-1">Hands-on climate missions you can start today.</p>
            </div>
            <Link
              to="/hands-on"
              className="hidden sm:inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-slate-900 dark:text-emerald-300 dark:hover:text-emerald-100 transition-colors">
              View all <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </motion.div>

          {questsLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
            </div>
          ) : displayQuests.length > 0 ? (
            <motion.div
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
              variants={staggerInView}
              initial="hidden"
              whileInView="show"
              viewport={LANDING_VIEWPORT}>
              {displayQuests.map((quest) => {
                return (
                  <motion.div key={quest.id} variants={staggerCard} className="h-full" whileHover={reduceMotion ? undefined : { y: -3 }}>
                  <Link to={`/quests/${quest.id}`} className="group flex flex-col h-full rounded-xl overflow-hidden border border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm transition-all dark:border-emerald-400/25 dark:bg-[#132B23]">
                    <div className="relative h-36 shrink-0 overflow-hidden flex items-center justify-center bg-slate-100 dark:bg-[#0D1F18]">
                      <span className="text-5xl transition-transform duration-300 group-hover:scale-110">{getQuestDisplayIcon(quest)}</span>
                      <span className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded text-[10px] font-semibold bg-white text-slate-700 dark:bg-[#0F3D2E] dark:text-emerald-200">
                        {quest.category || quest.tier}
                      </span>
                    </div>
                    <div className="px-4 pt-3.5 pb-4 flex flex-col flex-1">
                      <span className="text-[10px] uppercase tracking-wide text-slate-400 mb-1 font-medium">{quest.tier === "beginner" ? "Badge Quest" : "Certificate Quest"}</span>
                      <h3 className="mb-3 text-slate-900 dark:text-emerald-50 text-sm font-semibold leading-snug">{quest.title}</h3>
                      <div className="flex items-center justify-between pt-3 mt-auto border-t border-slate-100 dark:border-white/10 text-xs text-slate-500 dark:text-emerald-200/70">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {quest.estimated_days}d
                        </span>
                        <span className="flex items-center gap-1 font-semibold text-amber-600 dark:text-amber-400">
                          <Zap className="w-3 h-3" /> {quest.points_reward} pts
                        </span>
                      </div>
                    </div>
                  </Link>
                  </motion.div>
                );
              })}
            </motion.div>
          ) : (
            <div className="text-center py-10 bg-slate-50 rounded-xl border border-slate-100">
              <p className="text-sm text-slate-500">Quests coming soon.</p>
            </div>
          )}

          <div className="text-center mt-6 sm:hidden">
            <Link
              to="/hands-on"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">
              View all quests <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* ════════════════ TESTIMONIALS ════════════════ */}
      <section className="py-20 md:py-24 bg-slate-50 dark:bg-[#10271f]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="text-center mb-10"
            variants={scrollFade}
            initial="hidden"
            whileInView="show"
            viewport={LANDING_VIEWPORT}>
            <h2 className="text-slate-900 dark:text-emerald-50" style={{ fontFamily: "'Manrope', sans-serif", fontWeight: 800, fontSize: "clamp(1.5rem, 3vw, 2rem)" }}>
              What members say
            </h2>
          </motion.div>
          <motion.div
            className="grid grid-cols-1 md:grid-cols-3 gap-4"
            variants={staggerInView}
            initial="hidden"
            whileInView="show"
            viewport={LANDING_VIEWPORT}>
            {testimonials.map((t) => (
              <motion.div
                key={t.name}
                variants={staggerCard}
                whileHover={reduceMotion ? undefined : { y: -3 }}
                className="p-5 rounded-xl flex flex-col bg-white border border-slate-100 dark:border-emerald-400/20 dark:bg-[#132b23]">
                <div className="flex gap-0.5 mb-3">
                  {Array.from({ length: t.stars }).map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-sm mb-5 flex-1 text-slate-600 dark:text-emerald-100/90 leading-relaxed">"{t.text}"</p>
                <div className="flex items-center gap-3 pt-4 border-t border-slate-100 dark:border-white/10">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs text-white font-semibold bg-[#0F3D2E]">
                    {t.avatar}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-slate-900 dark:text-emerald-50">{t.name}</div>
                    <div className="text-xs text-slate-500 dark:text-emerald-200/70">{t.role}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ════════════════ FINAL CTA ════════════════ */}
      <section className="py-20 md:py-24 bg-[#0F3D2E] relative overflow-hidden">
        <motion.div
          className="relative z-10 max-w-2xl mx-auto px-4 text-center"
          variants={staggerWrap}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.35 }}>
          <motion.h2 variants={heroItem} className="text-white mb-4" style={{ fontFamily: "'Manrope', sans-serif", fontWeight: 800, fontSize: "clamp(1.5rem, 4vw, 2.25rem)", lineHeight: 1.2 }}>
            Ready to make an impact?
          </motion.h2>
          <motion.p variants={heroItem} className="mb-8 text-white/70 text-base sm:text-lg">
            Join thousands building real climate skills. Start your first mission today.
          </motion.p>
          <motion.div variants={heroItem} className="flex flex-wrap gap-3 justify-center">
            <motion.div whileHover={reduceMotion ? undefined : { y: -1 }} whileTap={reduceMotion ? undefined : { scale: 0.98 }} className="inline-flex">
              <Link to="/auth"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-semibold bg-white text-[#0F3D2E] hover:bg-slate-100 transition-colors"
                style={{ fontFamily: "'Manrope', sans-serif" }}>
                <Sprout className="w-4 h-4" /> Get started free
              </Link>
            </motion.div>
            <motion.div whileHover={reduceMotion ? undefined : { y: -1 }} className="inline-flex">
              <Link to="/hands-on"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-lg text-sm text-white/90 font-medium border border-white/30 hover:bg-white/10 transition-colors">
                Browse quests <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </motion.div>
          </motion.div>
        </motion.div>
      </section>
    </div>
  );
}
