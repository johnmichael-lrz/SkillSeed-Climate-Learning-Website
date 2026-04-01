import { useState, useEffect, useRef } from "react";
import { Link } from "react-router";
import {
  Search,
  MapPin,
  Users,
  Clock,
  ChevronRight,
  AlertTriangle,
  Sprout,
  Sun,
  TreePine,
  Recycle,
  Droplets,
  Target,
  Loader2,
  Briefcase,
  Heart,
  BookOpen,
  Trash2,
  X,
  SlidersHorizontal,
  Bookmark,
  ArrowRight,
  Building2,
  Zap,
  Globe,
  CheckCircle2,
  RefreshCw,
  Plus,
} from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { getProjects, getMyProjects, deleteProject, getMatchingProjects } from "../utils/matchService";
import { supabase } from "../utils/supabase";
import type { ConnectionStatus, Project } from "../types/database";

// ============================================================================
// Constants
// ============================================================================

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  "renewable energy": <Sun className="w-5 h-5" />,
  "solar": <Sun className="w-5 h-5" />,
  "disaster": <AlertTriangle className="w-5 h-5" />,
  "emergency": <AlertTriangle className="w-5 h-5" />,
  "education": <BookOpen className="w-5 h-5" />,
  "water": <Droplets className="w-5 h-5" />,
  "conservation": <Droplets className="w-5 h-5" />,
  "urban": <Building2 className="w-5 h-5" />,
  "infrastructure": <Building2 className="w-5 h-5" />,
  "forest": <TreePine className="w-5 h-5" />,
  "reforestation": <TreePine className="w-5 h-5" />,
  "waste": <Recycle className="w-5 h-5" />,
  "circular": <Recycle className="w-5 h-5" />,
  "default": <Sprout className="w-5 h-5" />,
};

const CATEGORY_GRADIENTS: Record<string, string> = {
  "renewable energy": "from-amber-500/20 to-orange-500/10",
  "solar": "from-amber-500/20 to-orange-500/10",
  "disaster": "from-red-500/20 to-rose-500/10",
  "emergency": "from-red-500/20 to-rose-500/10",
  "education": "from-blue-500/20 to-indigo-500/10",
  "water": "from-cyan-500/20 to-blue-500/10",
  "conservation": "from-cyan-500/20 to-blue-500/10",
  "urban": "from-slate-500/20 to-gray-500/10",
  "infrastructure": "from-slate-500/20 to-gray-500/10",
  "forest": "from-green-500/20 to-emerald-500/10",
  "reforestation": "from-green-500/20 to-emerald-500/10",
  "waste": "from-lime-500/20 to-green-500/10",
  "circular": "from-lime-500/20 to-green-500/10",
  "default": "from-[#2F8F6B]/20 to-[#0F3D2E]/10",
};

function getCategoryIcon(focusArea: string[] | undefined): React.ReactNode {
  const area = (focusArea?.[0] || "").toLowerCase();
  for (const [key, icon] of Object.entries(CATEGORY_ICONS)) {
    if (area.includes(key)) return icon;
  }
  return CATEGORY_ICONS.default;
}

function getCategoryGradient(focusArea: string[] | undefined): string {
  const area = (focusArea?.[0] || "").toLowerCase();
  for (const [key, gradient] of Object.entries(CATEGORY_GRADIENTS)) {
    if (area.includes(key)) return gradient;
  }
  return CATEGORY_GRADIENTS.default;
}

const CATEGORIES = ["All", "Renewable Energy", "Education", "Disaster Response", "Urban Planning", "Conservation", "Waste Reduction"];
const REGIONS = ["All Regions", "Philippines", "Global", "Southeast Asia", "Remote"];

type MissionCard = Project & {
  matched_skills?: string[];
  match_score?: number;
};

// ============================================================================
// Skeleton Components
// ============================================================================

function MissionCardSkeleton() {
  return (
    <div className="bg-white dark:bg-[#132B23] rounded-xl border border-slate-200 dark:border-[#1E3B34] overflow-hidden animate-pulse">
      <div className="h-28 bg-slate-100 dark:bg-[#1E3B34]" />
      <div className="p-4">
        <div className="h-3 w-20 bg-slate-100 dark:bg-[#1E3B34] rounded mb-3" />
        <div className="h-4 w-3/4 bg-slate-100 dark:bg-[#1E3B34] rounded mb-2" />
        <div className="h-3 w-1/2 bg-slate-100 dark:bg-[#1E3B34] rounded mb-4" />
        <div className="flex gap-2 mb-4">
          <div className="h-6 w-16 bg-slate-100 dark:bg-[#1E3B34] rounded-full" />
          <div className="h-6 w-20 bg-slate-100 dark:bg-[#1E3B34] rounded-full" />
        </div>
        <div className="h-9 w-full bg-slate-100 dark:bg-[#1E3B34] rounded-lg" />
      </div>
    </div>
  );
}

function FilterBarSkeleton() {
  return (
    <div className="bg-white dark:bg-[#132B23] rounded-xl border border-slate-200 dark:border-[#1E3B34] p-4 animate-pulse">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 h-10 bg-slate-100 dark:bg-[#1E3B34] rounded-lg" />
        <div className="h-10 w-32 bg-slate-100 dark:bg-[#1E3B34] rounded-lg" />
        <div className="h-10 w-28 bg-slate-100 dark:bg-[#1E3B34] rounded-lg" />
      </div>
      <div className="flex gap-2 mt-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-7 w-20 bg-slate-100 dark:bg-[#1E3B34] rounded-full" />
        ))}
      </div>
    </div>
  );
}

function KPIStripSkeleton() {
  return (
    <div className="grid grid-cols-3 gap-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="bg-white dark:bg-[#132B23] rounded-xl border border-slate-200 dark:border-[#1E3B34] p-4 animate-pulse">
          <div className="h-3 w-16 bg-slate-100 dark:bg-[#1E3B34] rounded mb-2" />
          <div className="h-7 w-10 bg-slate-100 dark:bg-[#1E3B34] rounded" />
        </div>
      ))}
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function MissionDashboard() {
  const { user } = useAuth();
  const [workTab, setWorkTab] = useState<"volunteers" | "professionals" | "my_projects">("volunteers");
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedRegion, setSelectedRegion] = useState("All Regions");
  const [participantType, setParticipantType] = useState<"all" | "volunteer" | "professional">("all");
  const [sortBy, setSortBy] = useState<"best_match" | "urgent_first" | "newest">("best_match");
  const [urgentOnly, setUrgentOnly] = useState(false);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const filterSheetRef = useRef<HTMLDivElement>(null);
  
  // Real data from Supabase
  const [missions, setMissions] = useState<MissionCard[]>([]);
  const [myProjects, setMyProjects] = useState<Project[]>([]);
  const [joinedCounts, setJoinedCounts] = useState<
    Record<string, { volunteers_joined: number; professionals_joined: number; pending_applicants: number }>
  >({});
  const [applicationStatusByProject, setApplicationStatusByProject] = useState<Record<string, ConnectionStatus>>({});
  const [posterVerifiedByUserId, setPosterVerifiedByUserId] = useState<
    Record<string, { verified: boolean; name?: string | null; avatar_url?: string | null }>
  >({});
  const [pipelineByProject, setPipelineByProject] = useState<
    Record<string, { pending: number; accepted: number; declined: number }>
  >({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Close mobile filters on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (filterSheetRef.current && !filterSheetRef.current.contains(event.target as Node)) {
        setShowMobileFilters(false);
      }
    }
    if (showMobileFilters) {
      document.addEventListener("mousedown", handleClickOutside);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.body.style.overflow = "";
    };
  }, [showMobileFilters]);

  // Fetch projects on mount
  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const [missionsData, userProjects] = await Promise.all([
          user ? getMatchingProjects() : getProjects(),
          getMyProjects(),
        ]);

        setMissions(missionsData);
        setMyProjects(userProjects);

        const allProjectIds = Array.from(
          new Set([...(missionsData ?? []).map((p) => p.id), ...(userProjects ?? []).map((p) => p.id)])
        );

        if (allProjectIds.length > 0) {
          const { data: joinedRows, error: joinedError } = await supabase.rpc(
            "get_joined_counts_for_projects",
            { project_ids: allProjectIds }
          );

          if (!joinedError && Array.isArray(joinedRows)) {
            const joinedMap: typeof joinedCounts = {};
            for (const row of joinedRows) {
              joinedMap[String(row.project_id)] = {
                volunteers_joined: Number(row.volunteers_joined ?? 0),
                professionals_joined: Number(row.professionals_joined ?? 0),
                pending_applicants: Number(row.pending_applicants ?? 0),
              };
            }
            setJoinedCounts(joinedMap);
          }
        }

        const posterUserIds = Array.from(new Set(missionsData.map((p) => String(p.poster_id))));
        if (posterUserIds.length > 0) {
          const { data: posters } = await supabase
            .from("profiles")
            .select("user_id, verified, name, avatar_url")
            .in("user_id", posterUserIds);

          if (Array.isArray(posters)) {
            const verifiedMap: typeof posterVerifiedByUserId = {};
            for (const row of posters) {
              verifiedMap[String(row.user_id)] = {
                verified: Boolean(row.verified),
                name: row.name ?? null,
                avatar_url: row.avatar_url ?? null,
              };
            }
            setPosterVerifiedByUserId(verifiedMap);
          }
        }

        if (user) {
          const projectIdsForStatus = Array.from(
            new Set([...(missionsData ?? []).map((p) => p.id), ...(userProjects ?? []).map((p) => p.id)])
          );

          const { data: myConnections } = await supabase
            .from("connections")
            .select("project_id, status")
            .eq("responder_id", user.id)
            .in("project_id", projectIdsForStatus);

          if (Array.isArray(myConnections)) {
            const statusMap: typeof applicationStatusByProject = {};
            for (const row of myConnections) {
              statusMap[String(row.project_id)] = row.status as ConnectionStatus;
            }
            setApplicationStatusByProject(statusMap);
          }
        }

        if (user && userProjects.length > 0) {
          const userProjectIds = userProjects.map((p) => p.id);
          const { data: posterConnections } = await supabase
            .from("connections")
            .select("project_id, status")
            .eq("poster_id", user.id)
            .in("project_id", userProjectIds);

          if (Array.isArray(posterConnections)) {
            const pipelineMap: typeof pipelineByProject = {};
            for (const id of userProjectIds) {
              pipelineMap[id] = { pending: 0, accepted: 0, declined: 0 };
            }
            for (const row of posterConnections) {
              const key = String(row.project_id);
              if (!pipelineMap[key]) pipelineMap[key] = { pending: 0, accepted: 0, declined: 0 };
              if (row.status === "pending") pipelineMap[key].pending += 1;
              if (row.status === "accepted") pipelineMap[key].accepted += 1;
              if (row.status === "declined") pipelineMap[key].declined += 1;
            }
            setPipelineByProject(pipelineMap);
          }
        }
      } catch (err) {
        setError("Failed to load missions. Please try again.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [user]);

  // Validation: Filter out test/placeholder missions
  function isValidMission(m: Project): boolean {
    const title = m.title?.trim() ?? "";
    // Too short
    if (title.length < 6) return false;
    // Repeated characters (e.g. "ssssss", "aaaa")
    if (/^(.)\1{4,}$/.test(title)) return false;
    // Mostly repeated characters (80%+ same char)
    const charCounts = new Map<string, number>();
    for (const c of title.toLowerCase()) {
      charCounts.set(c, (charCounts.get(c) || 0) + 1);
    }
    const maxCount = Math.max(...charCounts.values());
    if (title.length > 3 && maxCount / title.length > 0.8) return false;
    // Random gibberish: too many consonants in a row (6+)
    if (/[bcdfghjklmnpqrstvwxz]{6,}/i.test(title)) return false;
    // All numbers or special chars
    if (/^[\d\W_]+$/.test(title)) return false;
    return true;
  }

  // Filtering logic
  const filtered = missions.filter((m) => {
    // First check validity
    if (!isValidMission(m)) return false;

    const matchSearch =
      m.title.toLowerCase().includes(search.toLowerCase()) ||
      (m.description?.toLowerCase().includes(search.toLowerCase()) || false) ||
      (m.skills_needed?.some((s) => s.toLowerCase().includes(search.toLowerCase())) || false);
    const matchCat =
      selectedCategory === "All" ||
      (m.focus_area?.some((f) => f.toLowerCase().includes(selectedCategory.toLowerCase())) || false);
    const matchRegion = selectedRegion === "All Regions" || m.region === selectedRegion || (selectedRegion === "Remote" && !m.location);
    const matchUrgent = !urgentOnly || m.type === "urgent";
    const matchParticipantType =
      participantType === "all" ||
      (participantType === "professional" && (m.professionals_needed ?? 0) > 0) ||
      (participantType === "volunteer" && (m.volunteers_needed ?? 0) > 0);
    const matchWorkTab =
      workTab === "my_projects"
        ? true
        : workTab === "volunteers"
        ? (m.volunteers_needed ?? 0) > 0
        : (m.professionals_needed ?? 0) > 0;
    return matchSearch && matchCat && matchRegion && matchUrgent && matchWorkTab && matchParticipantType;
  });

  const urgent = filtered.filter((m) => m.type === "urgent");

  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === "newest") {
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    }
    if (sortBy === "best_match") {
      const scoreDiff = (b.match_score ?? 0) - (a.match_score ?? 0);
      if (scoreDiff !== 0) return scoreDiff;
    }
    if (sortBy === "urgent_first") {
      const urgentDiff = Number(b.type === "urgent") - Number(a.type === "urgent");
      if (urgentDiff !== 0) return urgentDiff;
    }
    return 0;
  });

  const pendingApplicationsCount = Object.values(applicationStatusByProject).filter((s) => s === "pending").length;

  const hasActiveFilters =
    search !== "" ||
    selectedRegion !== "All Regions" ||
    selectedCategory !== "All" ||
    urgentOnly ||
    participantType !== "all" ||
    sortBy !== "best_match";

  function clearAllFilters() {
    setSearch("");
    setSelectedRegion("All Regions");
    setSelectedCategory("All");
    setUrgentOnly(false);
    setParticipantType("all");
    setSortBy("best_match");
  }

  // ══════════════════════════════════════════════════════════════════════════
  // Loading State
  // ══════════════════════════════════════════════════════════════════════════
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#0D1F18]">
        {/* Header skeleton */}
        <div className="bg-white dark:bg-[#132B23] border-b border-slate-200 dark:border-[#1E3B34]">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="h-4 w-24 bg-slate-100 dark:bg-[#1E3B34] rounded mb-2 animate-pulse" />
            <div className="h-8 w-48 bg-slate-100 dark:bg-[#1E3B34] rounded mb-3 animate-pulse" />
            <div className="h-4 w-72 bg-slate-100 dark:bg-[#1E3B34] rounded animate-pulse" />
          </div>
        </div>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
          <KPIStripSkeleton />
          <FilterBarSkeleton />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <MissionCardSkeleton key={i} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // Error State
  // ══════════════════════════════════════════════════════════════════════════
  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#0D1F18] flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <div className="w-14 h-14 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-7 h-7 text-red-600 dark:text-red-400" />
          </div>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">Something went wrong</h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#0F3D2E] text-white text-sm font-medium rounded-lg hover:bg-[#1a5241] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2F8F6B] focus-visible:ring-offset-2"
          >
            <RefreshCw className="w-4 h-4" />
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // Main Render
  // ══════════════════════════════════════════════════════════════════════════
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0D1F18]">
      {/* ─────────────────────────────────────────────────────────────────────
          Page Header
      ───────────────────────────────────────────────────────────────────── */}
      <header className="bg-white dark:bg-[#132B23] border-b border-slate-200 dark:border-[#1E3B34]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-[#2F8F6B] dark:text-[#6DD4A8] mb-1">
                Mission Board
              </p>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white" style={{ fontFamily: "'Manrope', sans-serif" }}>
                Find Your Mission
              </h1>
              <p className="text-sm text-slate-600 dark:text-[#94C8AF] mt-1">
                Browse climate projects that need your skills. Apply in minutes.
              </p>
            </div>
            <Link
              to="/post-project"
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-medium rounded-lg border border-slate-200 dark:border-[#1E3B34] bg-white dark:bg-transparent text-slate-700 dark:text-[#BEEBD7] hover:bg-slate-50 dark:hover:bg-[#1E3B34] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2F8F6B] whitespace-nowrap"
            >
              <Building2 className="w-4 h-4" />
              Post a Project
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-5">
        {/* ─────────────────────────────────────────────────────────────────────
            KPI Strip
        ───────────────────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-3 gap-3">
          <button
            onClick={() => { setUrgentOnly(false); clearAllFilters(); }}
            className="text-left bg-white dark:bg-[#132B23] rounded-xl border border-slate-200 dark:border-[#1E3B34] p-4 hover:border-[#2F8F6B]/50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2F8F6B]"
          >
            <p className="text-xs text-slate-500 dark:text-[#94C8AF] font-medium mb-1">Open Missions</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{sorted.length}</p>
          </button>
          <button
            onClick={() => setUrgentOnly(true)}
            className="text-left bg-white dark:bg-[#132B23] rounded-xl border border-slate-200 dark:border-[#1E3B34] p-4 hover:border-red-300 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
          >
            <p className="text-xs text-slate-500 dark:text-[#94C8AF] font-medium mb-1 flex items-center gap-1">
              <Zap className="w-3 h-3 text-red-500" />
              Urgent
            </p>
            <p className="text-2xl font-bold text-red-600 dark:text-red-400">{urgent.length}</p>
          </button>
          <div className="bg-white dark:bg-[#132B23] rounded-xl border border-slate-200 dark:border-[#1E3B34] p-4">
            <p className="text-xs text-slate-500 dark:text-[#94C8AF] font-medium mb-1">My Applications</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{pendingApplicationsCount}</p>
          </div>
        </div>

        {/* ─────────────────────────────────────────────────────────────────────
            Tab Bar
        ───────────────────────────────────────────────────────────────────── */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {[
            { key: "volunteers" as const, label: "Volunteers", icon: Heart },
            { key: "professionals" as const, label: "Professionals", icon: Briefcase },
            ...(user ? [{ key: "my_projects" as const, label: "My Projects", icon: Target }] : []),
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setWorkTab(key)}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2F8F6B] min-h-[40px] ${
                workTab === key
                  ? "bg-[#0F3D2E] text-white"
                  : "bg-white dark:bg-[#132B23] border border-slate-200 dark:border-[#1E3B34] text-slate-600 dark:text-[#94C8AF] hover:border-[#2F8F6B]/50"
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>

        {/* ─────────────────────────────────────────────────────────────────────
            Search & Filters
        ───────────────────────────────────────────────────────────────────── */}
        {workTab !== "my_projects" && (
          <>
            <div className="bg-white dark:bg-[#132B23] rounded-xl border border-slate-200 dark:border-[#1E3B34] p-4">
              {/* Search row */}
              <div className="flex gap-3">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search missions, skills, organizations..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full min-h-[44px] pl-10 pr-4 py-2.5 border border-slate-200 dark:border-[#1E3B34] rounded-lg text-sm bg-white dark:bg-[#0D1F18] text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-[#6B8F7F] focus:outline-none focus:ring-2 focus:ring-[#2F8F6B]/50 focus:border-[#2F8F6B]"
                  />
                </div>

                {/* Desktop filters */}
                <div className="hidden md:flex items-center gap-2">
                  <select
                    value={selectedRegion}
                    onChange={(e) => setSelectedRegion(e.target.value)}
                    className="min-h-[44px] px-3 py-2 border border-slate-200 dark:border-[#1E3B34] rounded-lg text-sm bg-white dark:bg-[#0D1F18] text-slate-700 dark:text-[#BEEBD7] focus:outline-none focus:ring-2 focus:ring-[#2F8F6B]/50"
                  >
                    {REGIONS.map((r) => (
                      <option key={r}>{r}</option>
                    ))}
                  </select>
                  <button
                    onClick={() => setUrgentOnly(!urgentOnly)}
                    className={`min-h-[44px] flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2F8F6B] ${
                      urgentOnly
                        ? "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-700 dark:text-red-400"
                        : "border-slate-200 dark:border-[#1E3B34] text-slate-600 dark:text-[#94C8AF] hover:border-[#2F8F6B]/50"
                    }`}
                  >
                    <Zap className="w-4 h-4" />
                    Urgent
                  </button>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                    className="min-h-[44px] px-3 py-2 border border-slate-200 dark:border-[#1E3B34] rounded-lg text-sm bg-white dark:bg-[#0D1F18] text-slate-700 dark:text-[#BEEBD7] focus:outline-none focus:ring-2 focus:ring-[#2F8F6B]/50"
                  >
                    <option value="best_match">Best Match</option>
                    <option value="urgent_first">Urgent First</option>
                    <option value="newest">Newest</option>
                  </select>
                </div>

                {/* Mobile filter button */}
                <button
                  onClick={() => setShowMobileFilters(true)}
                  className="md:hidden min-h-[44px] min-w-[44px] flex items-center justify-center border border-slate-200 dark:border-[#1E3B34] rounded-lg text-slate-600 dark:text-[#94C8AF] hover:border-[#2F8F6B]/50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2F8F6B]"
                >
                  <SlidersHorizontal className="w-5 h-5" />
                </button>
              </div>

              {/* Category chips */}
              <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`text-xs font-medium px-3 py-1.5 rounded-full whitespace-nowrap transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2F8F6B] ${
                      selectedCategory === cat
                        ? "bg-[#0F3D2E] text-white"
                        : "bg-slate-100 dark:bg-[#1E3B34] text-slate-600 dark:text-[#94C8AF] hover:bg-[#E8F5EF] dark:hover:bg-[#0F3D2E]/50"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Active filters */}
              {hasActiveFilters && (
                <div className="flex items-center gap-2 mt-3 flex-wrap">
                  <span className="text-xs text-slate-500 dark:text-[#6B8F7F]">Active filters:</span>
                  {search && (
                    <span className="text-xs px-2 py-1 rounded-full bg-[#E8F5EF] dark:bg-[#1E3B34] text-[#0F3D2E] dark:text-[#6DD4A8]">
                      "{search}"
                    </span>
                  )}
                  {selectedRegion !== "All Regions" && (
                    <span className="text-xs px-2 py-1 rounded-full bg-[#E8F5EF] dark:bg-[#1E3B34] text-[#0F3D2E] dark:text-[#6DD4A8]">
                      {selectedRegion}
                    </span>
                  )}
                  {urgentOnly && (
                    <span className="text-xs px-2 py-1 rounded-full bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400">
                      Urgent only
                    </span>
                  )}
                  <button
                    onClick={clearAllFilters}
                    className="text-xs font-medium text-[#2F8F6B] hover:text-[#0F3D2E] dark:hover:text-[#6DD4A8] underline focus:outline-none"
                  >
                    Clear all
                  </button>
                </div>
              )}
            </div>

            {/* ─────────────────────────────────────────────────────────────────────
                Urgent Banner
            ───────────────────────────────────────────────────────────────────── */}
            {urgent.length > 0 && !urgentOnly && (
              <button
                onClick={() => setUrgentOnly(true)}
                className="w-full flex items-center justify-between gap-3 px-4 py-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 rounded-xl text-left hover:border-amber-300 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center flex-shrink-0">
                    <Zap className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-amber-800 dark:text-amber-200">
                      {urgent.length} urgent mission{urgent.length > 1 ? "s" : ""} need help now
                    </p>
                    <p className="text-xs text-amber-600 dark:text-amber-400">Critical deadlines approaching</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0" />
              </button>
            )}

            {/* ────────────────────────────────────────────────────────────────�����────
                Results Count
            ───────────────────────────────────────────────────────────────────── */}
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-500 dark:text-[#6B8F7F]">
                <span className="font-semibold text-slate-900 dark:text-white">{sorted.length}</span> missions found
              </p>
            </div>

            {/* ─────────────────────────────────────────────────────────────────────
                Mission Cards Grid
            ───────────────────────────────────────────────────────────────────── */}
            {sorted.length === 0 ? (
              <div className="bg-white dark:bg-[#132B23] rounded-xl border border-slate-200 dark:border-[#1E3B34] p-12 text-center">
                <div className="w-14 h-14 rounded-full bg-slate-100 dark:bg-[#1E3B34] flex items-center justify-center mx-auto mb-4">
                  {hasActiveFilters ? (
                    <Search className="w-6 h-6 text-slate-400 dark:text-[#6B8F7F]" />
                  ) : (
                    <Briefcase className="w-6 h-6 text-slate-400 dark:text-[#6B8F7F]" />
                  )}
                </div>
                <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-1">
                  {hasActiveFilters ? "No missions match your filters" : "No missions available yet"}
                </h3>
                <p className="text-sm text-slate-500 dark:text-[#6B8F7F] mb-4">
                  {hasActiveFilters 
                    ? "Try adjusting your search or clearing some filters."
                    : "Be the first to post a climate project and find skilled volunteers."}
                </p>
                {hasActiveFilters ? (
                  <button
                    onClick={clearAllFilters}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#0F3D2E] text-white text-sm font-medium rounded-lg hover:bg-[#1a5241] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2F8F6B] focus-visible:ring-offset-2"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Reset Filters
                  </button>
                ) : (
                  <Link
                    to={user ? "/projects/new" : "/auth"}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#0F3D2E] text-white text-sm font-medium rounded-lg hover:bg-[#1a5241] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2F8F6B] focus-visible:ring-offset-2"
                  >
                    <Plus className="w-4 h-4" />
                    Post a Project
                  </Link>
                )}
                {!hasActiveFilters && (
                  <p className="text-xs text-slate-400 dark:text-[#6B8F7F] mt-3">Check back soon for new opportunities</p>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {sorted.map((mission) => {
                  const isOwner = user && String(mission.poster_id) === String(user.id);
                  const posterInfo = posterVerifiedByUserId[String(mission.poster_id)];
                  const joined = joinedCounts[mission.id];
                  const appStatus = applicationStatusByProject[mission.id];
                  const matchSkills =
                    mission.matched_skills && mission.matched_skills.length > 0
                      ? mission.matched_skills
                      : mission.skills_needed ?? [];

                  return (
                    <article
                      key={mission.id}
                      className="bg-white dark:bg-[#132B23] rounded-xl border border-slate-200 dark:border-[#1E3B34] overflow-hidden hover:border-[#2F8F6B]/50 hover:shadow-sm transition-all duration-200 flex flex-col group"
                    >
                      {/* Card header with icon */}
                      <div
                        className={`relative h-24 flex items-center justify-center bg-gradient-to-br ${getCategoryGradient(mission.focus_area)}`}
                      >
                        <div className="w-11 h-11 rounded-lg bg-white/80 dark:bg-[#0D1F18]/80 backdrop-blur-sm flex items-center justify-center text-[#0F3D2E] dark:text-[#6DD4A8] shadow-sm">
                          {getCategoryIcon(mission.focus_area)}
                        </div>
                        {/* Urgent badge only */}
                        {mission.type === "urgent" && (
                          <span className="absolute top-2.5 left-2.5 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-500 text-white text-[10px] font-semibold uppercase tracking-wide">
                            <Zap className="w-2.5 h-2.5" />
                            Urgent
                          </span>
                        )}
                      </div>

                      {/* Card body */}
                      <div className="p-4 flex flex-col flex-1">
                        {/* Category chip + org */}
                        <div className="flex items-center gap-2 mb-2">
                          <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-[#1E3B34] text-slate-600 dark:text-[#94C8AF] text-[10px] font-medium">
                            {mission.focus_area?.[0] || "Project"}
                          </span>
                          <span className="text-[10px] text-slate-400 dark:text-[#6B8F7F]">by</span>
                          <span className="flex items-center gap-1 text-[10px] text-slate-500 dark:text-[#6B8F7F] truncate">
                            {posterInfo?.name || "Community"}
                            {posterInfo?.verified && (
                              <CheckCircle2 className="w-2.5 h-2.5 text-[#2F8F6B] dark:text-[#6DD4A8]" />
                            )}
                          </span>
                        </div>

                        {/* Title */}
                        <h3 className="text-sm font-semibold text-slate-900 dark:text-white leading-snug mb-2 line-clamp-2 group-hover:text-[#0F3D2E] dark:group-hover:text-[#6DD4A8] transition-colors">
                          {mission.title}
                        </h3>

                        {/* Meta row: Location - Duration */}
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-400 dark:text-[#6B8F7F] mb-3">
                          <MapPin className="w-3 h-3 flex-shrink-0" />
                          <span>{mission.location || "Remote"}</span>
                          <span className="text-slate-300 dark:text-[#1E3B34]">-</span>
                          <Clock className="w-3 h-3 flex-shrink-0" />
                          <span>{mission.duration || "Flexible"}</span>
                        </div>

                        {/* Slots needed */}
                        <div className="flex items-center gap-2 flex-wrap mb-3">
                          {(mission.volunteers_needed ?? 0) > 0 && (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 text-xs font-medium">
                              <Users className="w-3 h-3" />
                              {(joined?.volunteers_joined ?? 0)}/{mission.volunteers_needed}
                            </span>
                          )}
                          {(mission.professionals_needed ?? 0) > 0 && (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 text-xs font-medium">
                              <Briefcase className="w-3 h-3" />
                              {(joined?.professionals_joined ?? 0)}/{mission.professionals_needed}
                            </span>
                          )}
                        </div>

                        {/* Skills tags */}
                        <div className="flex flex-wrap gap-1 mb-4">
                          {matchSkills.slice(0, 2).map((skill) => (
                            <span
                              key={skill}
                              className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-[#1E3B34] text-slate-600 dark:text-[#94C8AF]"
                            >
                              {skill}
                            </span>
                          ))}
                          {matchSkills.length > 2 && (
                            <span className="text-[10px] text-slate-400 dark:text-[#6B8F7F] px-1">
                              +{matchSkills.length - 2}
                            </span>
                          )}
                        </div>

                        {/* Spacer */}
                        <div className="flex-1" />

                        {/* CTA */}
                        <Link
                          to={user ? `/missions/${mission.id}` : "/auth"}
                          className={`w-full min-h-[44px] flex items-center justify-center gap-1.5 text-sm font-medium rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2F8F6B] ${
                            isOwner
                              ? "border border-[#2F8F6B] text-[#0F3D2E] dark:text-[#6DD4A8] hover:bg-[#E8F5EF] dark:hover:bg-[#1E3B34]"
                              : appStatus === "pending"
                              ? "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400"
                              : appStatus === "accepted"
                              ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400"
                              : "bg-[#0F3D2E] text-white hover:bg-[#1a5241]"
                          }`}
                        >
                          {isOwner
                            ? "View Project"
                            : appStatus === "pending"
                            ? "Application Pending"
                            : appStatus === "accepted"
                            ? "Connected"
                            : user
                            ? "View & Apply"
                            : "Sign in to Apply"}
                          <ChevronRight className="w-4 h-4" />
                        </Link>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* ─────────────────────────────────────────────────────────────────────
            My Projects Tab
        ───────────────────────────────────────────────────────────────────── */}
        {workTab === "my_projects" && (
          <MyProjectsView
            projects={myProjects}
            joinedCounts={joinedCounts}
            pipelineByProject={pipelineByProject}
            onDelete={(projectId) => setMyProjects((prev) => prev.filter((p) => p.id !== projectId))}
          />
        )}
      </div>

      {/* ─────────────────────────────────────────────────────────────────────
          Mobile Filter Sheet
      ───────────────────────────────────────────────────────────────────── */}
      {showMobileFilters && (
        <div className="fixed inset-0 z-50 bg-black/50 md:hidden">
          <div
            ref={filterSheetRef}
            className="absolute bottom-0 left-0 right-0 bg-white dark:bg-[#132B23] rounded-t-2xl p-5 max-h-[80vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Filters</h3>
              <button
                onClick={() => setShowMobileFilters(false)}
                className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-100 dark:bg-[#1E3B34] text-slate-600 dark:text-[#94C8AF]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-[#BEEBD7] mb-2 block">Region</label>
                <select
                  value={selectedRegion}
                  onChange={(e) => setSelectedRegion(e.target.value)}
                  className="w-full min-h-[44px] px-3 py-2 border border-slate-200 dark:border-[#1E3B34] rounded-lg text-sm bg-white dark:bg-[#0D1F18] text-slate-700 dark:text-[#BEEBD7]"
                >
                  {REGIONS.map((r) => (
                    <option key={r}>{r}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-[#BEEBD7] mb-2 block">Sort by</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                  className="w-full min-h-[44px] px-3 py-2 border border-slate-200 dark:border-[#1E3B34] rounded-lg text-sm bg-white dark:bg-[#0D1F18] text-slate-700 dark:text-[#BEEBD7]"
                >
                  <option value="best_match">Best Match</option>
                  <option value="urgent_first">Urgent First</option>
                  <option value="newest">Newest</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-[#BEEBD7] mb-2 block">Urgency</label>
                <button
                  onClick={() => setUrgentOnly(!urgentOnly)}
                  className={`w-full min-h-[44px] flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                    urgentOnly
                      ? "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-700 dark:text-red-400"
                      : "border-slate-200 dark:border-[#1E3B34] text-slate-600 dark:text-[#94C8AF]"
                  }`}
                >
                  <Zap className="w-4 h-4" />
                  Urgent Only
                </button>
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  onClick={() => {
                    clearAllFilters();
                    setShowMobileFilters(false);
                  }}
                  className="flex-1 min-h-[44px] px-4 py-2 border border-slate-200 dark:border-[#1E3B34] rounded-lg text-sm font-medium text-slate-600 dark:text-[#94C8AF]"
                >
                  Reset
                </button>
                <button
                  onClick={() => setShowMobileFilters(false)}
                  className="flex-1 min-h-[44px] px-4 py-2 bg-[#0F3D2E] text-white rounded-lg text-sm font-medium"
                >
                  Apply Filters
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// My Projects View
// ============================================================================

function MyProjectsView({
  projects,
  joinedCounts,
  pipelineByProject,
  onDelete,
}: {
  projects: Project[];
  joinedCounts: Record<string, { volunteers_joined: number; professionals_joined: number; pending_applicants: number }>;
  pipelineByProject: Record<string, { pending: number; accepted: number; declined: number }>;
  onDelete: (id: string) => void;
}) {
  const [deleting, setDeleting] = useState<string | null>(null);

  const handleDelete = async (projectId: string) => {
    const confirmed = window.confirm("Are you sure you want to delete this project? This cannot be undone.");
    if (!confirmed) return;

    setDeleting(projectId);
    try {
      const success = await deleteProject(projectId);
      if (success) {
        onDelete(projectId);
      } else {
        alert("Failed to delete project.");
      }
    } catch (err) {
      console.error("Error deleting project:", err);
      alert("Failed to delete project.");
    } finally {
      setDeleting(null);
    }
  };

  if (projects.length === 0) {
    return (
      <div className="bg-white dark:bg-[#132B23] rounded-xl border border-slate-200 dark:border-[#1E3B34] p-12 text-center">
        <div className="w-14 h-14 rounded-full bg-slate-100 dark:bg-[#1E3B34] flex items-center justify-center mx-auto mb-4">
          <Target className="w-6 h-6 text-slate-400 dark:text-[#6B8F7F]" />
        </div>
        <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-1">No projects yet</h3>
        <p className="text-sm text-slate-500 dark:text-[#6B8F7F] mb-6">
          Create your first project to start finding volunteers.
        </p>
        <Link
          to="/post-project"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#0F3D2E] text-white text-sm font-medium rounded-lg hover:bg-[#1a5241] transition-colors"
        >
          <Building2 className="w-4 h-4" />
          Post a Project
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total Projects", value: projects.length, color: "bg-slate-50 dark:bg-[#1E3B34] text-slate-700 dark:text-white" },
          {
            label: "Pending",
            value: Object.values(pipelineByProject).reduce((sum, row) => sum + row.pending, 0),
            color: "bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400",
          },
          {
            label: "Accepted",
            value: Object.values(pipelineByProject).reduce((sum, row) => sum + row.accepted, 0),
            color: "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400",
          },
          {
            label: "Declined",
            value: Object.values(pipelineByProject).reduce((sum, row) => sum + row.declined, 0),
            color: "bg-slate-50 dark:bg-[#1E3B34] text-slate-500 dark:text-[#6B8F7F]",
          },
        ].map((item) => (
          <div key={item.label} className={`rounded-xl p-4 ${item.color}`}>
            <p className="text-xs font-medium opacity-70 mb-1">{item.label}</p>
            <p className="text-2xl font-bold">{item.value}</p>
          </div>
        ))}
      </div>

      {/* Project list */}
      <div className="space-y-3">
        {projects.map((project) => (
          <div
            key={project.id}
            className="bg-white dark:bg-[#132B23] rounded-xl border border-slate-200 dark:border-[#1E3B34] p-5"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <h3 className="font-semibold text-slate-900 dark:text-white">{project.title}</h3>
                  {project.type === "urgent" && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-xs font-medium">
                      <Zap className="w-3 h-3" />
                      Urgent
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 dark:text-[#6B8F7F] mb-3">
                  {project.location || "Remote"} · {project.duration || "Flexible"}
                </p>
                <div className="flex gap-4 text-sm">
                  <div>
                    <span className="text-slate-500 dark:text-[#6B8F7F]">Volunteers: </span>
                    <span className="font-semibold text-slate-900 dark:text-white">
                      {joinedCounts[project.id]?.volunteers_joined ?? 0}/{project.volunteers_needed ?? 0}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 dark:text-[#6B8F7F]">Professionals: </span>
                    <span className="font-semibold text-slate-900 dark:text-white">
                      {joinedCounts[project.id]?.professionals_joined ?? 0}/{project.professionals_needed ?? 0}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {(joinedCounts[project.id]?.pending_applicants ?? 0) > 0 && (
                  <span className="text-xs font-medium px-2 py-1 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400">
                    {joinedCounts[project.id]?.pending_applicants} pending
                  </span>
                )}
                <Link
                  to={`/missions/${project.id}`}
                  className="min-h-[40px] px-4 py-2 text-sm font-medium text-[#0F3D2E] dark:text-[#6DD4A8] border border-[#2F8F6B]/30 rounded-lg hover:bg-[#E8F5EF] dark:hover:bg-[#1E3B34] transition-colors"
                >
                  {(joinedCounts[project.id]?.pending_applicants ?? 0) > 0 ? "Review" : "View"}
                </Link>
                <button
                  onClick={() => handleDelete(project.id)}
                  disabled={deleting === project.id}
                  className="min-h-[40px] min-w-[40px] flex items-center justify-center text-red-500 border border-red-200 dark:border-red-800/50 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50"
                >
                  {deleting === project.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
