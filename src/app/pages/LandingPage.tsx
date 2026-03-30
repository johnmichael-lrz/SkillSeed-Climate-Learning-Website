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
  CheckCircle2,
  Clock,
  TrendingUp,
  Heart,
  Eye,
  Loader2,
} from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { fetchAllQuests } from "../utils/questService";
import type { Quest } from "../types/database";

const IMG_COMMUNITY = "https://images.unsplash.com/photo-1768306662463-4e3f6c858889?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjbGltYXRlJTIwYWN0aW9uJTIwdm9sdW50ZWVyJTIwY29tbXVuaXR5JTIwb3V0ZG9vcnxlbnwxfHx8fDE3NzI4NTQ4ODJ8MA&ixlib=rb-4.1.0&q=80&w=1080";

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

// Tier-based color mapping for quest cards
function getQuestColor(quest: Quest): string {
  if (quest.category?.toLowerCase().includes("energy")) return "#F59E0B";
  if (quest.category?.toLowerCase().includes("waste") || quest.category?.toLowerCase().includes("soil")) return "#2F8F6B";
  if (quest.category?.toLowerCase().includes("nature") || quest.category?.toLowerCase().includes("tree") || quest.category?.toLowerCase().includes("forest")) return "#059669";
  if (quest.tier === "advanced") return "#3B82F6";
  return "#2F8F6B";
}

/** Visual variety when API returns the same badge for every quest */
function getQuestDisplayIcon(quest: Quest): string {
  if (quest.badge_icon && quest.badge_icon !== "🏆") return quest.badge_icon;
  const c = quest.category?.toLowerCase() ?? "";
  if (c.includes("community") || c.includes("barangay")) return "🤝";
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
      desc: "Build green skills from scratch and participate in real climate missions — no experience needed.",
      cta: "Start Learning",
      bg: "#0F3D2E",
      border: "#1e6b52",
      iconBg: "rgba(255,255,255,0.15)",
      iconColor: "white",
      emphasis: true,
    },
    {
      id: "jobready",
      icon: Wrench,
      title: "I'm Job Ready",
      subtitle: "Skilled volunteer",
      desc: "Deploy your existing skills on real climate projects and build a verified impact portfolio.",
      cta: "Offer My Skills",
      bg: "#F0F7FF",
      border: "#BAE0FD",
      iconBg: "#DBEAFE",
      iconColor: "#1E6B9A",
      textColor: "#1E3A5F",
      emphasis: false,
    },
    {
      id: "org",
      icon: Building2,
      title: "I'm an Organization",
      subtitle: "Project coordinator",
      desc: "Post climate projects and get matched with skilled volunteers and professionals immediately.",
      cta: "Partner with us",
      bg: "#F0FDF6",
      border: "#BBF7D0",
      iconBg: "#E6F4EE",
      iconColor: "#2F8F6B",
      emphasis: false,
    },
  ];

  return (
    <div className="overflow-x-hidden">

      {/* ════════════════ HERO ════════════════ */}
      <section className="relative pt-16 pb-16 md:pb-20 lg:pb-24 overflow-hidden dark:!bg-[#0c1815]" style={{ background: "white" }}>
        <div
          className="pointer-events-none absolute inset-0 opacity-0 dark:opacity-[0.22] dark:mix-blend-multiply dark:saturate-75"
          style={{ backgroundImage: `url(${IMG_COMMUNITY})`, backgroundSize: "cover", backgroundPosition: "center top" }}
        />
        {/* subtle dot pattern */}
        <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.04]" style={{ backgroundImage: "radial-gradient(#0F3D2E 1px, transparent 1px)", backgroundSize: "24px 24px" }} />
        <HeroAmbience reduced={reduceMotion} />
        <FloatingSeeds reduced={reduceMotion} />

        <motion.div
          className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center"
          initial="hidden"
          animate="show"
          variants={staggerWrap}>
          <motion.p variants={heroItem} className="text-[10px] sm:text-xs uppercase tracking-[0.18em] text-[#2F8F6B]/85 dark:text-emerald-300/75 mb-3 font-semibold">
            Mission-based climate learning
          </motion.p>
          <motion.h1
            variants={heroItem}
            className="mb-5 text-[#0F3D2E] dark:text-[#B7C96A]"
            style={{ fontFamily: "'Manrope', sans-serif", fontWeight: 800, fontSize: "clamp(2.4rem, 5.5vw, 4rem)", lineHeight: 1.1, letterSpacing: "-0.02em" }}>
            Where climate action<br />
            <span className="text-[#2F8F6B] dark:text-[#BEEBD7]">finds its people.</span>
          </motion.h1>

          <motion.p
            variants={heroItem}
            className="mb-8 mx-auto text-lg text-[#4b5563] dark:!text-emerald-200/88"
            style={{ lineHeight: 1.7, maxWidth: "580px" }}>
            SkillSeed connects learners, skilled volunteers, and organizations to short, real-world climate missions. Learn by doing. Track your impact. Join the movement.
          </motion.p>

          <motion.div variants={heroItem} className="flex flex-wrap gap-3 justify-center mb-10">
            <motion.button
              type="button"
              onClick={handleJoinProject}
              whileHover={reduceMotion ? undefined : { scale: 1.02, y: -2 }}
              whileTap={reduceMotion ? undefined : { scale: 0.98 }}
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl text-white transition-shadow duration-200 cursor-pointer"
              style={{ background: "linear-gradient(135deg, #0F3D2E 0%, #2F8F6B 100%)", fontWeight: 700, fontFamily: "'Manrope', sans-serif", boxShadow: "0 4px 20px rgba(47,143,107,0.4)", border: "none" }}>
              <Users className="w-4 h-4" /> Join a Project
            </motion.button>
            <motion.div whileHover={reduceMotion ? undefined : { y: -2 }} className="inline-flex">
              <Link to="/hands-on"
                className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl transition-colors duration-200 bg-white dark:!bg-transparent border-2 border-[#0F3D2E] dark:border-emerald-400/55 text-[#0F3D2E] dark:text-emerald-50 hover:bg-[#F0FDF6] dark:hover:!bg-white/10"
                style={{ fontWeight: 700, fontFamily: "'Manrope', sans-serif" }}>
                <Sprout className="w-4 h-4" /> Learn New Skills
              </Link>
            </motion.div>
          </motion.div>

          {/* Social proof */}
          <motion.div variants={heroItem} className="flex flex-wrap items-center justify-center gap-6 mb-6">
            <div className="flex items-center gap-2">
              <div className="flex -space-x-2">
                {["MS", "JR", "LC", "AB", "DK"].map((i, idx) => (
                  <motion.div
                    key={idx}
                    className="w-8 h-8 rounded-full border-2 border-white flex items-center justify-center text-xs text-white"
                    style={{ background: ["#2F8F6B", "#059669", "#1EB89A", "#0F3D2E", "#34D399"][idx], fontWeight: 700 }}
                    initial={reduceMotion ? false : { opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={
                      reduceMotion
                        ? { duration: 0 }
                        : { type: "spring", stiffness: 420, damping: 22, delay: 0.45 + idx * 0.06 }
                    }>
                    {i}
                  </motion.div>
                ))}
              </div>
              <span className="text-sm" style={{ color: "#6B7280" }}><strong style={{ color: "#0F3D2E" }}>12,840+</strong> members</span>
            </div>
            {[
              { icon: Globe, label: "87 countries" },
              { icon: CheckCircle2, label: "Verified missions" },
              { icon: Leaf, label: "Free to join" },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-1.5">
                <Icon className="w-4 h-4" style={{ color: "#2F8F6B" }} />
                <span className="text-sm" style={{ color: "#6B7280", fontWeight: 500 }}>{label}</span>
              </div>
            ))}
          </motion.div>
        </motion.div>

        {/* Mission & Vision cards */}
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 md:mt-16">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <motion.div
              className="rounded-2xl p-8 text-left bg-[#F0FDF6] border border-[#BBF7D0] dark:border-emerald-400/30 dark:!bg-[#10271f] ring-2 ring-[#2F8F6B]/25 dark:ring-emerald-400/25 shadow-sm dark:shadow-none"
              style={{ background: "#F0FDF6" }}
              variants={scrollFade}
              initial="hidden"
              whileInView="show"
              viewport={LANDING_VIEWPORT}
              transition={{ delay: reduceMotion ? 0 : 0.05 }}
              whileHover={reduceMotion ? undefined : { y: -4, transition: { duration: 0.22 } }}>
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "#E6F4EE" }}>
                  <Heart className="w-5 h-5" style={{ color: "#2F8F6B" }} />
                </div>
                <span className="text-xs font-bold uppercase tracking-wider" style={{ color: "#2F8F6B", letterSpacing: "0.1em" }}>Our Mission</span>
              </div>
              <h3 className="mb-3 text-[#0F3D2E] dark:text-emerald-50" style={{ fontFamily: "'Manrope', sans-serif", fontWeight: 800, fontSize: "1.15rem", lineHeight: 1.4 }}>
                Connect. Build capacity. Deploy the people the climate crisis needs.
              </h3>
              <p className="text-[#374151] dark:!text-emerald-200/80" style={{ lineHeight: 1.9, fontSize: "0.9rem" }}>
                Starting in the Philippines, where the need is greatest, and growing into a global network. Rooted in community, driven by people, and open to every nation ready to act.
              </p>
            </motion.div>
            <motion.div
              className="rounded-2xl p-8 text-left bg-[#F0F7FF] border border-[#BAE0FD] dark:border-sky-400/25 dark:!bg-[#10271f]"
              style={{ background: "#F0F7FF" }}
              variants={scrollFade}
              initial="hidden"
              whileInView="show"
              viewport={LANDING_VIEWPORT}
              transition={{ delay: reduceMotion ? 0 : 0.12 }}
              whileHover={reduceMotion ? undefined : { y: -4, transition: { duration: 0.22 } }}>
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "#DBEAFE" }}>
                  <Eye className="w-5 h-5" style={{ color: "#1E6B9A" }} />
                </div>
                <span className="text-xs font-bold uppercase tracking-wider" style={{ color: "#1E6B9A", letterSpacing: "0.1em" }}>Our Vision</span>
              </div>
              <h3 className="mb-3 text-[#1E3A5F] dark:text-sky-100" style={{ fontFamily: "'Manrope', sans-serif", fontWeight: 800, fontSize: "1.15rem", lineHeight: 1.4 }}>
                A world where no climate crisis goes unanswered.
              </h3>
              <p className="text-[#374151] dark:!text-emerald-200/80" style={{ lineHeight: 1.9, fontSize: "0.9rem" }}>
                Because the people and skills to respond already exist in every community. The Philippines leads the way: the nation that faces the most, teaches the most. From its shores, Skill Seed grows outward — because every climate issue has a human-driven solution.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ════════════════ HOW IT WORKS ════════════════ */}
      <section className="pt-16 pb-24 md:pt-20 md:pb-32 dark:!bg-[#10271f]" style={{ background: "#F0F9F5" }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="text-center mb-14"
            variants={scrollFade}
            initial="hidden"
            whileInView="show"
            viewport={LANDING_VIEWPORT}>
            <span className="inline-block px-3 py-1 rounded-full text-xs mb-3"
              style={{ background: "#E6F4EE", color: "#2F8F6B", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" }}>
              How It Works
            </span>
            <h2 className="mb-3 text-[#0F3D2E] dark:text-emerald-50" style={{ fontFamily: "'Manrope', sans-serif", fontWeight: 800, fontSize: "clamp(1.8rem, 3vw, 2.5rem)" }}>
              Simple. Mission-Driven. Impactful.
            </h2>
            <p className="max-w-md mx-auto text-[#4b5563] dark:!text-emerald-200/85" style={{ lineHeight: 1.7 }}>
              From skill building to real-world action — SkillSeed makes climate participation accessible to everyone.
            </p>
          </motion.div>

          <motion.div
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
            variants={staggerInView}
            initial="hidden"
            whileInView="show"
            viewport={LANDING_VIEWPORT}>
            {[
              { step: "01", icon: Sprout, title: "Browse or Post", desc: "Explore short climate missions that match your interests, or post a project needing skilled volunteers.", color: "#2F8F6B", bg: "#E6F4EE" },
              { step: "02", icon: Users, title: "Match & Connect", desc: "Get matched with the right people. Learners find mentors. Organizations find skilled volunteers instantly.", color: "#1EB89A", bg: "#D1FAE5" },
              { step: "03", icon: TrendingUp, title: "Learn & Make Impact", desc: "Complete missions, earn verified points, and see your real environmental impact measured and celebrated.", color: "#059669", bg: "#A7F3D0" },
            ].map(({ step, icon: Icon, title, desc, color, bg }) => (
              <motion.div
                key={step}
                variants={staggerCard}
                whileHover={reduceMotion ? undefined : { y: -6, boxShadow: "0 16px 40px rgba(15,61,46,0.12)" }}
                className="relative bg-white rounded-2xl p-8 text-center border border-gray-200 dark:border-emerald-400/35"
                style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
                <motion.div
                  className="relative inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-5"
                  style={{ background: bg }}
                  whileHover={reduceMotion ? undefined : { rotate: [0, -4, 4, 0], transition: { duration: 0.5 } }}>
                  <Icon className="w-7 h-7" style={{ color }} />
                  <span className="absolute -top-2 -right-2 w-7 h-7 rounded-full text-white flex items-center justify-center text-sm ring-2 ring-white shadow-md"
                    style={{ background: color, fontWeight: 800 }}>{step.slice(1)}</span>
                </motion.div>
                <h3 className="mb-3 text-[#0F3D2E] dark:text-emerald-50" style={{ fontFamily: "'Manrope', sans-serif", fontWeight: 700 }}>{title}</h3>
                <p className="text-sm text-[#4b5563] dark:!text-emerald-200/82" style={{ lineHeight: 1.7 }}>{desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ════════════════ STATS ════════════════ */}
      <section className="py-16 relative overflow-hidden" style={{ background: "#0F3D2E" }}>
        {!reduceMotion && (
          <motion.div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-30"
            style={{
              background: "radial-gradient(ellipse 80% 60% at 50% 50%, rgba(52,211,153,0.35) 0%, transparent 55%)",
            }}
            animate={{ opacity: [0.22, 0.38, 0.22], scale: [1, 1.03, 1] }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          />
        )}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-[1]">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
            <AnimatedStat value={12840} suffix="+" label="Active Members" desc="across 87 countries" />
            <AnimatedStat value={1240} suffix="+" label="Missions Completed" desc="verified impact" />
            <AnimatedStat value={87} suffix="" label="Countries Reached" desc="and growing" />
          </div>
          <p className="text-center text-xs mt-10 max-w-md mx-auto px-4" style={{ color: "rgba(255,255,255,0.62)", lineHeight: 1.5 }}>
            Figures updated monthly. Totals reflect activity across the platform.
          </p>
        </div>
      </section>

      {/* ════════════════ WHO IT'S FOR ════════════════ */}
      <section className="py-20 dark:!bg-[#10271f]" style={{ background: "white" }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="text-center mb-12"
            variants={scrollFade}
            initial="hidden"
            whileInView="show"
            viewport={LANDING_VIEWPORT}>
            <span className="inline-block px-3 py-1 rounded-full text-xs mb-3"
              style={{ background: "#E6F4EE", color: "#2F8F6B", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" }}>
              For Everyone
            </span>
            <h2 className="mb-3 text-[#0F3D2E] dark:text-emerald-50" style={{ fontFamily: "'Manrope', sans-serif", fontWeight: 800, fontSize: "clamp(1.8rem, 3vw, 2.5rem)" }}>
              However you show up, you belong here
            </h2>
            <p className="max-w-md mx-auto text-[#4b5563] dark:!text-emerald-200/88" style={{ lineHeight: 1.7 }}>
              SkillSeed is built for every kind of climate participant — from curious beginners to seasoned professionals to leading organizations.
            </p>
          </motion.div>

          <motion.div
            className="grid grid-cols-1 md:grid-cols-3 gap-5 md:gap-6 items-stretch"
            variants={staggerInView}
            initial="hidden"
            whileInView="show"
            viewport={LANDING_VIEWPORT}>
            {roles.map(({ id, icon: Icon, title, subtitle, desc, cta, bg, border, iconBg, iconColor, emphasis }) => (
              <motion.div
                key={id}
                variants={staggerCard}
                whileHover={reduceMotion ? undefined : { y: -5 }}
                whileTap={reduceMotion ? undefined : { scale: 0.99 }}
                className={`rounded-2xl p-8 pb-10 flex flex-col group transition-shadow duration-300 cursor-pointer ${
                  emphasis
                    ? "md:scale-[1.03] md:z-[1] md:shadow-xl md:shadow-black/15 dark:md:shadow-black/40 ring-2 ring-[#2F8F6B]/45 dark:ring-emerald-400/40"
                    : "dark:!bg-[#152a24] dark:!border-emerald-400/22"
                }`}
                style={{ background: bg, border: `1.5px solid ${border}` }}
                onClick={() => handleRoleClick(id)}>
                <div className="w-14 h-14 rounded-xl flex items-center justify-center mb-5" style={{ background: iconBg }}>
                  <Icon className="w-6 h-6" style={{ color: iconColor }} />
                </div>
                {emphasis && (
                  <span
                    className="text-[10px] uppercase tracking-wider mb-2 px-2.5 py-1 rounded-full w-fit bg-white/15 text-white"
                    style={{ fontWeight: 700 }}>
                    New? Start here
                  </span>
                )}
                <span
                  className={`text-xs mb-2 px-2 py-0.5 rounded-full w-fit font-semibold ${
                    emphasis ? "" : "dark:!bg-white/12 dark:!text-emerald-200"
                  }`}
                  style={{
                    background: emphasis ? "rgba(255,255,255,0.15)" : "#E6F4EE",
                    color: emphasis ? "rgba(255,255,255,0.9)" : "#2F8F6B",
                    fontWeight: 600,
                  }}>
                  {subtitle}
                </span>
                <h3
                  className={`mb-2 ${
                    emphasis
                      ? "text-white"
                      : id === "jobready"
                        ? "text-[#1E3A5F] dark:text-sky-100"
                        : "text-[#0F3D2E] dark:text-emerald-50"
                  }`}
                  style={{ fontFamily: "'Manrope', sans-serif", fontWeight: 800, fontSize: "1.2rem" }}>
                  {title}
                </h3>
                <p
                  className={`text-sm mb-6 flex-1 ${emphasis ? "text-white/85" : "text-[#4b5563] dark:!text-emerald-200/85"}`}
                  style={{ lineHeight: 1.7 }}>
                  {desc}
                </p>
                <span
                  className={`mt-auto pt-2 inline-flex items-center gap-2 text-sm ${
                    emphasis
                      ? "text-white"
                      : id === "jobready"
                        ? "text-[#1E3A5F] dark:text-sky-100"
                        : "text-[#0F3D2E] dark:text-emerald-100"
                  }`}
                  style={{ fontWeight: 700, fontFamily: "'Manrope', sans-serif" }}>
                  {cta} <ArrowRight className="w-4 h-4" />
                </span>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ════════════════ FEATURED QUESTS ════════════════ */}
      <section className="pt-14 pb-20 md:pt-16 dark:!bg-[#10271f]" style={{ background: "#F9FAFB" }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-10"
            variants={scrollFade}
            initial="hidden"
            whileInView="show"
            viewport={LANDING_VIEWPORT}>
            <div>
              <span className="inline-block px-3 py-1 rounded-full text-xs mb-3"
                style={{ background: "#E6F4EE", color: "#2F8F6B", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" }}>
                Quests
              </span>
              <h2 className="text-[#0F3D2E] dark:text-emerald-50" style={{ fontFamily: "'Manrope', sans-serif", fontWeight: 800, fontSize: "clamp(1.6rem, 3vw, 2.2rem)" }}>
                Start Your Climate Journey
              </h2>
            </div>
            <Link
              to="/hands-on"
              className="hidden sm:inline-flex items-center gap-1.5 text-sm font-semibold rounded-lg px-3 py-2 border-2 border-[#2F8F6B]/30 text-[#2F8F6B] hover:bg-[#E6F4EE] dark:border-emerald-400/40 dark:text-emerald-300 dark:hover:bg-white/5 transition-colors">
              View all quests <ArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>

          {questsLoading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin" style={{ color: "#2F8F6B" }} />
            </div>
          ) : displayQuests.length > 0 ? (
            <motion.div
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5"
              variants={staggerInView}
              initial="hidden"
              whileInView="show"
              viewport={LANDING_VIEWPORT}>
              {displayQuests.map((quest) => {
                const color = getQuestColor(quest);
                return (
                  <motion.div key={quest.id} variants={staggerCard} className="h-full min-h-0" whileHover={reduceMotion ? undefined : { y: -5 }}>
                  <Link to={`/quests/${quest.id}`} className="group flex flex-col h-full rounded-2xl overflow-hidden transition-all duration-300 border border-gray-200 dark:border-emerald-400/35 bg-white"
                    style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}
                    onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 8px 28px rgba(15,61,46,0.12)"; }}
                    onMouseLeave={e => { e.currentTarget.style.boxShadow = "0 1px 4px rgba(0,0,0,0.04)"; }}>
                    <div className="relative h-44 shrink-0 overflow-hidden flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${color}15, ${color}35)` }}>
                      <div className="pointer-events-none absolute inset-0 bg-transparent dark:bg-[#061510]/45 dark:mix-blend-multiply" aria-hidden />
                      <span className="relative z-[1] text-6xl transition-transform duration-500 group-hover:scale-110 inline-block">{getQuestDisplayIcon(quest)}</span>
                      <span className="absolute top-3 left-3 z-[2] px-2.5 py-1 rounded-full text-xs"
                        style={{ background: "rgba(255,255,255,0.92)", color: color, fontWeight: 700 }}>
                        {quest.category || quest.tier}
                      </span>
                      <span className="absolute top-3 right-3 z-[2] px-2.5 py-1 rounded-full text-xs"
                        style={{ background: "rgba(0,0,0,0.45)", color: "white", fontWeight: 600 }}>
                        {quest.tier === "beginner" ? "Beginner" : "Advanced"}
                      </span>
                    </div>
                    <div className="px-5 pt-4 pb-6 flex flex-col flex-1 min-h-0">
                      <p className="text-xs mb-1 text-[#9CA3AF] dark:text-emerald-200/75">{quest.tier === "beginner" ? "🌱 Badge Quest" : "🏆 Certificate Quest"}</p>
                      <h3 className="mb-4 text-[#0F3D2E] dark:text-emerald-50" style={{ fontFamily: "'Manrope', sans-serif", fontWeight: 700, fontSize: "0.95rem" }}>{quest.title}</h3>
                      <div className="flex items-center justify-between pt-4 mt-auto border-t border-[#F3F4F6] dark:border-white/10">
                        <span className="text-xs flex items-center gap-1 text-[#9CA3AF] dark:text-emerald-200/70">
                          <Clock className="w-3 h-3" /> ~{quest.estimated_days} days
                        </span>
                        <span className="text-xs flex items-center gap-1" style={{ color: "#FBBF24", fontWeight: 700 }}>
                          <Zap className="w-3 h-3 fill-current" /> {quest.points_reward} pts
                        </span>
                      </div>
                    </div>
                  </Link>
                  </motion.div>
                );
              })}
            </motion.div>
          ) : (
            <div className="text-center py-12 bg-white rounded-2xl border border-gray-100">
              <p className="text-sm" style={{ color: "#9CA3AF" }}>Quests coming soon — check back shortly!</p>
            </div>
          )}

          <div className="text-center mt-8 sm:hidden">
            <Link
              to="/hands-on"
              className="inline-flex items-center gap-1.5 text-sm font-semibold rounded-lg px-3 py-2 border-2 border-[#2F8F6B]/30 text-[#2F8F6B] hover:bg-[#E6F4EE] dark:border-emerald-400/40 dark:text-emerald-300 dark:hover:bg-white/5 transition-colors">
              View all quests <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ════════════════ TESTIMONIALS ════════════════ */}
      <section className="pt-20 pb-24 md:pb-28 dark:!bg-[#10271f]" style={{ background: "white" }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="text-center mb-12 md:mb-14"
            variants={scrollFade}
            initial="hidden"
            whileInView="show"
            viewport={LANDING_VIEWPORT}>
            <span className="inline-block px-3 py-1 rounded-full text-xs mb-3"
              style={{ background: "#E6F4EE", color: "#2F8F6B", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" }}>
              Community Stories
            </span>
            <h2 className="text-[#0F3D2E] dark:text-emerald-50" style={{ fontFamily: "'Manrope', sans-serif", fontWeight: 800, fontSize: "clamp(1.8rem, 3vw, 2.2rem)" }}>
              What Our Members Say
            </h2>
          </motion.div>
          <motion.div
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
            variants={staggerInView}
            initial="hidden"
            whileInView="show"
            viewport={LANDING_VIEWPORT}>
            {testimonials.map((t) => (
              <motion.div
                key={t.name}
                variants={staggerCard}
                whileHover={reduceMotion ? undefined : { y: -4, boxShadow: "0 14px 36px rgba(15,61,46,0.1)" }}
                className="p-7 rounded-2xl flex flex-col bg-[#F9FAFB] border border-[#F3F4F6] dark:border-emerald-400/25 dark:!bg-[#132b23]"
                style={{ background: "#F9FAFB" }}>
                <div className="flex gap-0.5 mb-4">
                  {Array.from({ length: t.stars }).map((_, i) => (
                    <Star key={i} className="w-4 h-4" style={{ fill: "#FBBF24", color: "#FBBF24" }} />
                  ))}
                </div>
                <p className="text-sm mb-6 flex-1 text-[#374151] dark:!text-emerald-100/90" style={{ lineHeight: 1.8 }}>"{t.text}"</p>
                <div className="flex items-center gap-3 pt-5" style={{ borderTop: "1px solid #E5E7EB" }}>
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm text-white"
                    style={{ background: "linear-gradient(135deg, #0F3D2E, #2F8F6B)", fontWeight: 700 }}>
                    {t.avatar}
                  </div>
                  <div>
                    <div className="text-sm font-bold text-[#0F3D2E] dark:text-emerald-50">{t.name}</div>
                    <div className="text-xs text-[#6B7280] dark:text-emerald-200/75">{t.role}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ════════════════ FINAL CTA ════════════════ */}
      <section className="py-24 md:py-28 relative overflow-hidden" style={{ background: "#0F3D2E" }}>
        <div
          className="absolute inset-0 opacity-10 dark:opacity-[0.28] dark:mix-blend-multiply dark:saturate-75 dark:brightness-90"
          style={{ backgroundImage: `url(${IMG_COMMUNITY})`, backgroundSize: "cover", backgroundPosition: "center" }}
        />
        <div className="absolute inset-0" style={{ background: "linear-gradient(135deg, rgba(15,61,46,0.95) 0%, rgba(47,143,107,0.85) 100%)" }} />
        {!reduceMotion && (
          <>
            <motion.div
              aria-hidden
              className="pointer-events-none absolute -top-16 -right-10 w-72 h-72 rounded-full blur-3xl opacity-35"
              style={{ background: "radial-gradient(circle, rgba(167,243,208,0.55) 0%, transparent 68%)" }}
              animate={{ x: [0, -18, 0], y: [0, 22, 0] }}
              transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.div
              aria-hidden
              className="pointer-events-none absolute bottom-0 -left-12 w-64 h-64 rounded-full blur-3xl opacity-25"
              style={{ background: "radial-gradient(circle, rgba(52,211,153,0.4) 0%, transparent 70%)" }}
              animate={{ x: [0, 20, 0], y: [0, -12, 0] }}
              transition={{ duration: 11, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
            />
          </>
        )}
        <motion.div
          className="relative z-10 max-w-3xl mx-auto px-4 text-center"
          variants={staggerWrap}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.35 }}>
          <motion.div variants={heroItem} className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-6"
            style={{ background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.2)" }}>
            <Leaf className="w-3.5 h-3.5 text-green-300" />
            <span className="text-sm text-white" style={{ fontWeight: 600 }}>Start free · No experience needed</span>
          </motion.div>
          <motion.p variants={heroItem} className="text-[10px] sm:text-xs uppercase tracking-[0.18em] text-white/55 mb-3 font-semibold">
            Mission-based climate learning
          </motion.p>
          <motion.h2 variants={heroItem} className="text-white mb-4" style={{ fontFamily: "'Manrope', sans-serif", fontWeight: 800, fontSize: "clamp(1.8rem, 4vw, 2.8rem)", lineHeight: 1.15 }}>
            Every skill planted grows a better future.
          </motion.h2>
          <motion.p variants={heroItem} className="mb-8" style={{ color: "rgba(255,255,255,0.72)", lineHeight: 1.7, fontSize: "1.1rem" }}>
            Start your first climate mission today — it only takes 10 minutes to get going.
          </motion.p>
          <motion.div variants={heroItem} className="flex flex-wrap gap-3 justify-center">
            <motion.div whileHover={reduceMotion ? undefined : { scale: 1.04, y: -2 }} whileTap={reduceMotion ? undefined : { scale: 0.98 }} className="inline-flex">
              <Link to="/auth"
                className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl text-sm font-bold transition-colors bg-white text-[#0F3D2E] hover:bg-emerald-50 shadow-lg shadow-black/20"
                style={{ fontFamily: "'Manrope', sans-serif" }}>
                <Sprout className="w-4 h-4" /> Join for Free
              </Link>
            </motion.div>
            <motion.div whileHover={reduceMotion ? undefined : { y: -2 }} className="inline-flex">
              <Link to="/hands-on"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl text-sm text-white transition-colors border-2 border-white/45 bg-transparent hover:bg-white/10"
                style={{ fontWeight: 600 }}>
                Browse Quests <ArrowRight className="w-4 h-4" />
              </Link>
            </motion.div>
          </motion.div>
        </motion.div>
      </section>
    </div>
  );
}
