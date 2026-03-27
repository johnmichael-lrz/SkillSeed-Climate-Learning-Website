import { useState, useEffect } from "react";
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
  Grid,
  List,
  Target,
  Loader2,
  Briefcase,
  Heart,
  BookOpen,
  Trash2,
} from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { getProjects, getMyProjects, deleteProject, getMatchingProjects } from "../utils/matchService";
import { supabase } from "../utils/supabase";
import type { ConnectionStatus, Project } from "../types/database";

// Helper function to get category color based on focus area
function getCategoryStyle(focusArea: string[] | undefined): { color: string; icon: React.ReactNode } {
  const area = focusArea?.[0]?.toLowerCase() || '';
  if (area.includes('energy') || area.includes('solar') || area.includes('renewable')) {
    return { color: 'bg-amber-100 text-amber-700', icon: <Sun className="w-4 h-4" /> };
  }
  if (area.includes('disaster') || area.includes('emergency')) {
    return { color: 'bg-red-100 text-red-700', icon: <AlertTriangle className="w-4 h-4" /> };
  }
  if (area.includes('education') || area.includes('literacy')) {
    return { color: 'bg-blue-100 text-blue-700', icon: <BookOpen className="w-4 h-4" /> };
  }
  if (area.includes('water') || area.includes('conservation')) {
    return { color: 'bg-cyan-100 text-cyan-700', icon: <Droplets className="w-4 h-4" /> };
  }
  if (area.includes('urban') || area.includes('infrastructure')) {
    return { color: 'bg-emerald-100 text-emerald-700', icon: <Sprout className="w-4 h-4" /> };
  }
  if (area.includes('forest') || area.includes('reforestation')) {
    return { color: 'bg-green-100 text-green-700', icon: <TreePine className="w-4 h-4" /> };
  }
  return { color: 'bg-lime-100 text-lime-700', icon: <Recycle className="w-4 h-4" /> };
}

// Pick a mission image using mission keywords first, then focus area.
function getProjectImage(mission: Pick<Project, "title" | "description" | "focus_area">): string {
  const keywordText = `${mission.title || ""} ${mission.description || ""} ${(mission.focus_area || []).join(" ")}`
    .toLowerCase();

  const imageRules: Array<{ keywords: string[]; url: string }> = [
    {
      keywords: ["flood", "relief", "evacuation", "disaster", "emergency"],
      url: "https://images.unsplash.com/photo-1593113598332-cd288d649433?w=800&fit=crop",
    },
    {
      keywords: ["typhoon", "storm", "coastal", "response"],
      url: "https://images.unsplash.com/photo-1527004013197-933c4bb611b3?w=800&fit=crop",
    },
    {
      keywords: ["reforestation", "forest", "tree", "mangrove", "planting"],
      url: "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=800&fit=crop",
    },
    {
      keywords: ["compost", "waste", "recycling", "circular", "repair"],
      url: "https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?w=800&fit=crop",
    },
    {
      keywords: ["solar", "energy", "renewable", "microgrid", "electric"],
      url: "https://images.unsplash.com/photo-1509391366360-2e959784a276?w=800&fit=crop",
    },
    {
      keywords: ["water", "marine", "ocean", "river", "clean water"],
      url: "https://images.unsplash.com/photo-1484291470158-b8f8d608850d?w=800&fit=crop",
    },
    {
      keywords: ["urban", "city", "infrastructure", "corridor", "mapping"],
      url: "https://images.unsplash.com/photo-1518005020951-eccb494ad742?w=800&fit=crop",
    },
    {
      keywords: ["education", "school", "literacy", "training", "youth"],
      url: "https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?w=800&fit=crop",
    },
    {
      keywords: ["research", "science", "data", "policy", "analysis"],
      url: "https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=800&fit=crop",
    },
    {
      keywords: ["community", "volunteer", "grassroots", "organizing"],
      url: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=800&fit=crop",
    },
    {
      keywords: ["agriculture", "farming", "food", "rice", "soil"],
      url: "https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=800&fit=crop",
    },
    {
      keywords: ["media", "storytelling", "video", "documentary", "content"],
      url: "https://images.unsplash.com/photo-1485846234645-a62644f84728?w=800&fit=crop",
    },
  ];

  for (const rule of imageRules) {
    if (rule.keywords.some((keyword) => keywordText.includes(keyword))) {
      return rule.url;
    }
  }

  return "https://images.unsplash.com/photo-1552799446-159ba9523315?w=800&fit=crop";
}

const categories = ["All", "climate science", "renewable energy", "education", "urban planning", "climate finance", "technology", "advocacy"];
const regions = ["All Regions", "Philippines", "Global", "Southeast Asia", "North America", "Africa", "Caribbean"];

type MissionCard = Project & {
  matched_skills?: string[];
  match_score?: number;
};

export function MissionDashboard() {
  const { user } = useAuth();
  const [workTab, setWorkTab] = useState<"volunteers" | "professionals" | "my_projects">("volunteers");
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedRegion, setSelectedRegion] = useState("All Regions");
  const [participantType, setParticipantType] = useState<"all" | "volunteer" | "student" | "professional">("all");
  const [sortBy, setSortBy] = useState<"best_match" | "urgent_first" | "most_needed" | "newest">("best_match");
  const [urgentOnly, setUrgentOnly] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  
  // Real data from Supabase
  const [missions, setMissions] = useState<MissionCard[]>([]);
  const [myProjects, setMyProjects] = useState<Project[]>([]);
  const [joinedCounts, setJoinedCounts] = useState<
    Record<
      string,
      {
        volunteers_joined: number;
        professionals_joined: number;
        pending_applicants: number;
      }
    >
  >({});
  const [applicationStatusByProject, setApplicationStatusByProject] = useState<
    Record<string, ConnectionStatus>
  >({});
  const [posterVerifiedByUserId, setPosterVerifiedByUserId] = useState<
    Record<string, { verified: boolean; name?: string | null; avatar_url?: string | null }>
  >({});
  const [pipelineByProject, setPipelineByProject] = useState<
    Record<string, { pending: number; accepted: number; declined: number }>
  >({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch projects on mount
  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        // Responder view uses matching results when logged in; poster view always uses "my projects".
        const [missionsData, userProjects] = await Promise.all([
          user ? getMatchingProjects() : getProjects(),
          getMyProjects(),
        ]);

        setMissions(missionsData);
        setMyProjects(userProjects);

        // Derived UI data (joined/needed counts + application state + poster verification)
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
          } else {
            console.warn("Joined counts RPC failed (non-fatal):", joinedError);
          }
        }

        // Poster verification: show "Verified Organisation" on mission cards
        const posterUserIds = Array.from(new Set(missionsData.map((p) => String(p.poster_id))));
        if (posterUserIds.length > 0) {
          const { data: posters, error: posterError } = await supabase
            .from("profiles")
            .select("user_id, verified, name, avatar_url")
            .in("user_id", posterUserIds);

          if (!posterError && Array.isArray(posters)) {
            const verifiedMap: typeof posterVerifiedByUserId = {};
            for (const row of posters) {
              verifiedMap[String(row.user_id)] = {
                verified: Boolean(row.verified),
                name: row.name ?? null,
                avatar_url: row.avatar_url ?? null,
              };
            }
            setPosterVerifiedByUserId(verifiedMap);
          } else {
            console.warn("Poster verification query failed (non-fatal):", posterError);
          }
        }

        // Responder application state: used to make CTA state-aware
        if (user) {
          const projectIdsForStatus = Array.from(
            new Set([
              ...(missionsData ?? []).map((p) => p.id),
              ...(userProjects ?? []).map((p) => p.id),
            ])
          );

          const { data: myConnections, error: connError } = await supabase
            .from("connections")
            .select("project_id, status")
            .eq("responder_id", user.id)
            .in("project_id", projectIdsForStatus);

          if (!connError && Array.isArray(myConnections)) {
            const statusMap: typeof applicationStatusByProject = {};
            for (const row of myConnections) {
              statusMap[String(row.project_id)] = row.status as ConnectionStatus;
            }
            setApplicationStatusByProject(statusMap);
          } else {
            console.warn("My connections query failed (non-fatal):", connError);
          }
        } else {
          setApplicationStatusByProject({});
        }

        // Poster pipeline metrics for "My Projects": pending / accepted / declined.
        if (user && userProjects.length > 0) {
          const userProjectIds = userProjects.map((p) => p.id);
          const { data: posterConnections, error: posterConnError } = await supabase
            .from("connections")
            .select("project_id, status")
            .eq("poster_id", user.id)
            .in("project_id", userProjectIds);

          if (!posterConnError && Array.isArray(posterConnections)) {
            const pipelineMap: typeof pipelineByProject = {};
            for (const id of userProjectIds) {
              pipelineMap[id] = { pending: 0, accepted: 0, declined: 0 };
            }
            for (const row of posterConnections) {
              const key = String(row.project_id);
              if (!pipelineMap[key]) {
                pipelineMap[key] = { pending: 0, accepted: 0, declined: 0 };
              }
              if (row.status === "pending") pipelineMap[key].pending += 1;
              if (row.status === "accepted") pipelineMap[key].accepted += 1;
              if (row.status === "declined") pipelineMap[key].declined += 1;
            }
            setPipelineByProject(pipelineMap);
          } else {
            console.warn("Poster pipeline query failed (non-fatal):", posterConnError);
            setPipelineByProject({});
          }
        } else {
          setPipelineByProject({});
        }
      } catch (err) {
        setError("Failed to load projects");
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const filtered = missions.filter((m) => {
    const matchSearch = m.title.toLowerCase().includes(search.toLowerCase()) ||
      (m.description?.toLowerCase().includes(search.toLowerCase()) || false) ||
      (m.skills_needed?.some(s => s.toLowerCase().includes(search.toLowerCase())) || false);
    const matchCat = selectedCategory === "All" || (m.focus_area?.some(f => f.toLowerCase().includes(selectedCategory.toLowerCase())) || false);
    const matchRegion = selectedRegion === "All Regions" || m.region === selectedRegion;
    const matchUrgent = !urgentOnly || m.type === "urgent";
    const matchParticipantType =
      participantType === "all" ||
      (participantType === "professional" && (m.professionals_needed ?? 0) > 0) ||
      ((participantType === "volunteer" || participantType === "student") && (m.volunteers_needed ?? 0) > 0);
    // Filter by work tab (only for volunteers/professionals, not my_projects)
    const matchWorkTab = workTab === "my_projects" ? true :
      workTab === "volunteers" 
        ? (m.volunteers_needed ?? 0) > 0 
        : (m.professionals_needed ?? 0) > 0;
    // Note: We no longer filter out own projects — instead we show "Your Project" label on the card
    return matchSearch && matchCat && matchRegion && matchUrgent && matchWorkTab && matchParticipantType;
  });

  const urgent = filtered.filter(m => m.type === "urgent");
  const regular = filtered.filter(m => m.type !== "urgent");
  
  // Sort helper: prioritize Philippines, then Remote/Global, then others
  const regionPriority = (region: string | undefined) => {
    if (region === 'Philippines') return 0;
    if (region === 'Global' || region?.toLowerCase() === 'remote') return 1;
    return 2;
  };
  
  const neededTotal = (project: MissionCard) =>
    (project.volunteers_needed ?? 0) + (project.professionals_needed ?? 0);

  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === "most_needed") {
      return neededTotal(b) - neededTotal(a);
    }
    if (sortBy === "newest") {
      if (a.created_at && b.created_at) {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
      return 0;
    }
    if (sortBy === "best_match") {
      const scoreDiff = (b.match_score ?? 0) - (a.match_score ?? 0);
      if (scoreDiff !== 0) return scoreDiff;
    }
    if (sortBy === "urgent_first") {
      const urgentDiff = Number(b.type === "urgent") - Number(a.type === "urgent");
      if (urgentDiff !== 0) return urgentDiff;
    }
    const regionDiff = regionPriority(a.region) - regionPriority(b.region);
    if (regionDiff !== 0) return regionDiff;
    if (a.start_date && b.start_date) {
      return new Date(a.start_date).getTime() - new Date(b.start_date).getTime();
    }
    return 0;
  });

  const pendingApplicationsTotal = Object.values(pipelineByProject).reduce(
    (sum, row) => sum + row.pending,
    0
  );

  const activeFilterChips: string[] = [
    search ? `Search: ${search}` : "",
    selectedRegion !== "All Regions" ? selectedRegion : "",
    selectedCategory !== "All" ? selectedCategory : "",
    urgentOnly ? "Urgent only" : "",
    participantType !== "all" ? `Role: ${participantType}` : "",
    sortBy !== "best_match" ? `Sort: ${sortBy.replace("_", " ")}` : "",
  ].filter(Boolean);

  function clearAllFilters() {
    setSearch("");
    setSelectedRegion("All Regions");
    setSelectedCategory("All");
    setUrgentOnly(false);
    setParticipantType("all");
    setSortBy("best_match");
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-[#F9FDFB] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#2F8F6B]" />
        <span className="ml-3 text-gray-600 font-medium">Loading missions...</span>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-[#F9FDFB] flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 font-medium">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 px-4 py-2 bg-[#2F8F6B] text-white rounded-lg hover:bg-[#0F3D2E] transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F9FDFB]">
      {/* Header */}
      <div className="bg-[#0F3D2E] py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-[#6DD4A8] font-semibold text-sm uppercase tracking-wider mb-1">Mission Board</p>
          <h1 className="text-white font-[Manrope] font-bold text-3xl md:text-4xl">
            Find Your Mission
          </h1>
          <p className="text-[#A8D5BF] mt-2">
            Based on your profile, <span className="text-white font-semibold">{sorted.length} projects match you right now.</span>
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-5">
            <div className="rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 px-4 py-3 shadow-[0_8px_24px_rgba(0,0,0,0.12)]">
              <p className="text-xs text-[#A8D5BF]">Open missions</p>
              <p className="text-2xl font-bold text-white">{sorted.length}</p>
            </div>
            <div className="rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 px-4 py-3 shadow-[0_8px_24px_rgba(0,0,0,0.12)]">
              <p className="text-xs text-[#A8D5BF]">Urgent missions</p>
              <p className="text-2xl font-bold text-white">{urgent.length}</p>
            </div>
            <div className="rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 px-4 py-3 shadow-[0_8px_24px_rgba(0,0,0,0.12)]">
              <p className="text-xs text-[#A8D5BF]">Pending applications</p>
              <p className="text-2xl font-bold text-white">{pendingApplicationsTotal}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Sub-tab bar */}
      <div className="bg-white border-b border-gray-200 sticky top-16 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-3">
            <div className="flex gap-2">
              <button
                onClick={() => setWorkTab('volunteers')}
                className={`px-5 min-h-10 py-2 rounded-full text-sm font-medium transition flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2F8F6B]/50 ${
                  workTab === 'volunteers'
                    ? 'bg-[#1a3a2a] text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Heart className="w-4 h-4" />
                Volunteers
              </button>
              <button
                onClick={() => setWorkTab('professionals')}
                className={`px-5 min-h-10 py-2 rounded-full text-sm font-medium transition flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2F8F6B]/50 ${
                  workTab === 'professionals'
                    ? 'bg-[#1a3a2a] text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Briefcase className="w-4 h-4" />
                Professionals
              </button>
              {user && (
              <button
                onClick={() => setWorkTab('my_projects')}
                className={`px-5 min-h-10 py-2 rounded-full text-sm font-medium transition flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2F8F6B]/50 ${
                  workTab === 'my_projects'
                    ? 'bg-[#1a3a2a] text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Target className="w-4 h-4" />
                My Projects
              </button>
              )}
            </div>
            <Link
              to="/post-project"
              className="bg-[#1a3a2a] text-white px-4 min-h-10 py-2 rounded-full text-sm font-medium hover:bg-green-900 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2F8F6B]/50"
            >
              + Post a Project
            </Link>
          </div>
          <p className="text-xs text-gray-500 pb-3">
            {workTab === "my_projects"
              ? "Track applicants and fill project roles quickly."
              : "Find missions matched to your skills and availability."}
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Search & Filter Bar */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_6px_20px_rgba(15,61,46,0.08)] p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search missions, organisations, skills..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full min-h-10 pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2F8F6B]/30 focus:border-[#2F8F6B]"
              />
            </div>
            <select
              value={selectedRegion}
              onChange={(e) => setSelectedRegion(e.target.value)}
              className="px-3 min-h-10 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2F8F6B]/30 bg-white"
            >
              {regions.map(r => <option key={r}>{r}</option>)}
            </select>
            <button
              onClick={() => setUrgentOnly(!urgentOnly)}
              className={`flex items-center gap-2 px-4 min-h-10 py-2.5 rounded-xl text-sm font-medium border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2F8F6B]/50 ${
                urgentOnly
                  ? "bg-red-50 border-red-200 text-red-700"
                  : "border-gray-200 text-gray-600 hover:border-[#2F8F6B]"
              }`}
            >
              <AlertTriangle className="w-4 h-4" />
              Urgent Only
            </button>
            <select
              value={participantType}
              onChange={(e) => setParticipantType(e.target.value as "all" | "volunteer" | "student" | "professional")}
              className="px-3 min-h-10 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2F8F6B]/30 bg-white"
              aria-label="Participant type filter"
            >
              <option value="all">All participants</option>
              <option value="volunteer">Volunteer</option>
              <option value="student">Student</option>
              <option value="professional">Professional</option>
            </select>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as "best_match" | "urgent_first" | "most_needed" | "newest")}
              className="px-3 min-h-10 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2F8F6B]/30 bg-white"
              aria-label="Sort missions"
            >
              <option value="best_match">Best Match</option>
              <option value="urgent_first">Urgent First</option>
              <option value="most_needed">Most Needed</option>
              <option value="newest">Newest</option>
            </select>
            <div className="flex items-center gap-1 border border-gray-200 rounded-xl p-1">
              <button
                onClick={() => setViewMode("grid")}
                className={`min-h-10 min-w-10 p-2 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2F8F6B]/50 ${viewMode === "grid" ? "bg-[#E6F4EE] text-[#0F3D2E]" : "text-gray-400 hover:text-gray-600"}`}
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`min-h-10 min-w-10 p-2 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2F8F6B]/50 ${viewMode === "list" ? "bg-[#E6F4EE] text-[#0F3D2E]" : "text-gray-400 hover:text-gray-600"}`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Category pills */}
          <div className="flex gap-2 mt-3 flex-wrap">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`text-xs font-medium px-3 py-1.5 rounded-full transition-colors ${
                  selectedCategory === cat
                    ? "bg-[#0F3D2E] text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-[#E6F4EE] hover:text-[#0F3D2E]"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {activeFilterChips.length > 0 && (
            <div className="flex items-center gap-2 mt-3 flex-wrap">
              {activeFilterChips.map((chip) => (
                <span
                  key={chip}
                  className="text-xs font-medium px-3 py-1 rounded-full bg-[#E6F4EE] text-[#0F3D2E]"
                >
                  {chip}
                </span>
              ))}
              <button
                onClick={clearAllFilters}
                className="text-xs font-semibold text-[#2F8F6B] hover:text-[#0F3D2E] underline"
              >
                Clear all
              </button>
            </div>
          )}
        </div>

        {/* Results count */}
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-gray-500">
            <span className="font-semibold text-[#0F3D2E]">{sorted.length}</span>{" "}
            {workTab === 'volunteers' ? 'volunteer' : workTab === "professionals" ? "professional" : "project"} results
            {urgent.length > 0 && (
              <span className="ml-2 text-red-600 font-medium">· {urgent.length} urgent</span>
            )}
          </p>
        </div>

        {workTab !== "my_projects" && (
          <>
            {/* Urgent banner */}
            {urgent.length > 0 && !urgentOnly && (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4 mb-6 flex items-start gap-3">
                <span className="text-amber-500 text-xl">⚠️</span>
                <div>
                  <p className="text-amber-700 font-semibold text-sm">
                    {urgent.length} urgent mission{urgent.length > 1 ? 's' : ''} need immediate help
                  </p>
                  <p className="text-amber-700/70 text-xs mt-0.5">
                    These projects have critical deadlines — your skills are needed now.
                  </p>
                </div>
              </div>
            )}

            {viewMode === "grid" ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {sorted.map((mission) => {
                  const isOwner = user && String(mission.poster_id) === String(user.id);
                  const posterInfo = posterVerifiedByUserId[String(mission.poster_id)];
                  const joined = joinedCounts[mission.id];
                  const appStatus = applicationStatusByProject[mission.id];
                  const pendingCount = joined?.pending_applicants ?? 0;
                  const matchSkills = mission.matched_skills && mission.matched_skills.length > 0 ? mission.matched_skills : (mission.skills_needed ?? []);
                  return (
                    <div
                      key={mission.id}
                      className="bg-white rounded-2xl overflow-hidden shadow-[0_6px_20px_rgba(15,61,46,0.08)] border border-gray-100 hover:shadow-[0_14px_28px_rgba(15,61,46,0.12)] transition-all duration-200 group flex flex-col"
                    >
                      {/* Image — fixed shorter height */}
                      <div className="relative h-40 overflow-hidden">
                        <img 
                          src={getProjectImage(mission)} 
                          alt={mission.title} 
                          className="w-full h-full object-cover group-hover:scale-105 transition duration-300" 
                        />
                        {/* Urgent badge */}
                        {mission.type === "urgent" && (
                          <span className="absolute top-3 left-3 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" />
                            URGENT
                          </span>
                        )}
                        {/* Category badge */}
                        <span className="absolute top-3 right-3 bg-black/60 text-white text-xs px-2 py-1 rounded-full">
                          {mission.focus_area?.[0] || "Project"}
                        </span>
                      </div>

                      {/* Card body — flex column to push button to bottom */}
                      <div className="p-4 flex flex-col flex-1">
                        {/* Org name + verification */}
                        <p className="text-xs text-gray-400 mb-1 flex items-center gap-2">
                          <span className="truncate">{posterInfo?.name || mission.region || "Organisation"}</span>
                          {posterInfo?.verified ? (
                            <span className="text-green-500 flex items-center gap-1" title="Verified Organization">
                              ✓ Verified
                            </span>
                          ) : (
                            <span className="text-gray-300">Community</span>
                          )}
                        </p>

                        {/* Match score / why */}
                        {typeof mission.match_score === "number" && (
                          <div className="mb-2 flex items-center gap-2">
                            <span className="bg-emerald-50 text-emerald-700 border border-emerald-100 text-xs font-semibold px-3 py-1 rounded-full">
                              Match: {mission.match_score}
                            </span>
                            {matchSkills.length > 0 && (
                              <span className="text-[11px] text-gray-500">
                                Why you match: {matchSkills[0]}
                              </span>
                            )}
                          </div>
                        )}

                        {/* Title */}
                        <h3 className="text-sm font-semibold text-gray-900 leading-snug mb-2 line-clamp-2">
                          {mission.title}
                        </h3>

                        {/* Meta row */}
                        <div className="flex items-center gap-3 text-xs text-gray-500 mb-3">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {mission.location || "Remote"}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {mission.duration || "Flexible"}
                          </span>
                        </div>

                        {/* Joined vs needed (pending + accepted) */}
                        <div className="flex items-center gap-2 flex-wrap mb-3">
                          {(mission.volunteers_needed ?? 0) > 0 && (
                            <span className="bg-green-50 text-green-700 text-xs px-2 py-1 rounded-full flex items-center gap-1">
                              <Users className="w-3 h-3" />
                              {(joined?.volunteers_joined ?? 0)}/{mission.volunteers_needed} volunteers
                            </span>
                          )}
                          {(mission.professionals_needed ?? 0) > 0 && (
                            <span className="bg-blue-50 text-blue-700 text-xs px-2 py-1 rounded-full flex items-center gap-1">
                              <Briefcase className="w-3 h-3" />
                              {(joined?.professionals_joined ?? 0)}/{mission.professionals_needed} professionals
                            </span>
                          )}
                        </div>

                        {/* Compensation badge - Professionals tab only */}
                        {(mission.professionals_needed ?? 0) > 0 && workTab === 'professionals' && (
                          <div className="mb-3">
                            {mission.compensation_min ? (
                              <span className="bg-blue-50 border border-blue-100 text-blue-700 
                                               text-xs font-semibold px-3 py-1 rounded-full">
                                💰 ₱{mission.compensation_min.toLocaleString()} – ₱{mission.compensation_max?.toLocaleString()}
                              </span>
                            ) : (
                              <span className="bg-gray-50 border border-gray-100 text-gray-400 
                                               text-xs px-3 py-1 rounded-full">
                                💰 Compensation negotiable
                              </span>
                            )}
                          </div>
                        )}

                        {/* Match skills — max 2 shown */}
                        <div className="flex flex-wrap gap-1 mb-4">
                          {matchSkills.slice(0, 2).map((skill) => (
                            <span key={skill} className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-full">
                              {skill}
                            </span>
                          ))}
                          {matchSkills.length > 2 && (
                            <span className="text-gray-400 text-xs px-1">
                              +{matchSkills.length - 2} more
                            </span>
                          )}
                        </div>

                        {/* Spacer pushes button to bottom */}
                        <div className="flex-1" />

                        {/* CTA — outline for owners, filled for others */}
                        <Link 
                          to={`/missions/${mission.id}`}
                          className={`w-full text-sm py-2 rounded-xl transition flex items-center justify-center gap-1 font-medium ${
                            isOwner
                              ? "border-2 border-[#1a3a2a] text-[#1a3a2a] hover:bg-green-50"
                              : "bg-[#1a3a2a] text-white hover:bg-green-900"
                          }`}
                        >
                          {isOwner
                            ? pendingCount > 0
                              ? `Review Applications (${pendingCount})`
                              : "View Your Project"
                            : appStatus === "pending"
                            ? "Application Pending"
                            : appStatus === "accepted"
                            ? "Connected — View"
                            : appStatus === "declined"
                            ? "Declined — View"
                            : "View & Apply"}
                          <ChevronRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="space-y-3">
                {sorted.map((mission) => {
                  const isOwner = user && String(mission.poster_id) === String(user.id);
                  const posterInfo = posterVerifiedByUserId[String(mission.poster_id)];
                  const joined = joinedCounts[mission.id];
                  const appStatus = applicationStatusByProject[mission.id];
                  const pendingCount = joined?.pending_applicants ?? 0;
                  const matchSkills =
                    mission.matched_skills && mission.matched_skills.length > 0
                      ? mission.matched_skills
                      : mission.skills_needed ?? [];
                  return (
                    <div
                      key={mission.id}
                      className="bg-white rounded-2xl border border-gray-100 shadow-[0_6px_20px_rgba(15,61,46,0.08)] hover:shadow-[0_14px_28px_rgba(15,61,46,0.12)] transition-all duration-200 flex overflow-hidden group"
                    >
                      <img src={getProjectImage(mission)} alt={mission.title} className="w-36 h-full object-cover group-hover:scale-105 transition-transform duration-300 flex-shrink-0" />
                      <div className="p-4 flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="font-[Manrope] font-bold text-[#0F3D2E] text-base">{mission.title}</h3>
                              {mission.type === "urgent" && (
                                <span className="flex items-center gap-1 bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                                  <AlertTriangle className="w-3 h-3" />
                                  URGENT
                                </span>
                              )}
                              {typeof mission.match_score === "number" && (
                                <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-100 text-[11px] font-semibold px-2 py-0.5 rounded-full">
                                  Match: {mission.match_score}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-2 flex-wrap">
                              <span>{posterInfo?.name || mission.region || "Organisation"}</span>
                              <span>· {mission.location || "Remote"}</span>
                              {posterInfo?.verified && (
                                <span className="inline-flex items-center gap-1 text-green-700 bg-green-50 border border-green-100 rounded-full px-2 py-0.5 text-[11px]">
                                  ✓ Verified
                                </span>
                              )}
                            </p>
                          </div>
                          <span className="bg-black/70 text-white text-xs px-2.5 py-1 rounded-full flex-shrink-0">
                            {mission.focus_area?.[0] || "Project"}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mt-2 line-clamp-2">{mission.description}</p>
                        <div className="flex items-center justify-between mt-3">
                          <div className="flex gap-3 text-xs text-gray-500 flex-wrap items-center">
                            <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{mission.duration || "Flexible"}</span>
                            {(mission.volunteers_needed ?? 0) > 0 && (
                              <span className="flex items-center gap-1 text-green-700">
                                <Users className="w-3 h-3" />
                                {(joined?.volunteers_joined ?? 0)}/{mission.volunteers_needed} volunteers
                              </span>
                            )}
                            {(mission.professionals_needed ?? 0) > 0 && (
                              <span className="flex items-center gap-1 text-blue-700">
                                <Briefcase className="w-3 h-3" />
                                {(joined?.professionals_joined ?? 0)}/{mission.professionals_needed} professionals
                              </span>
                            )}
                            {/* Compensation badge - Professionals tab only */}
                            {(mission.professionals_needed ?? 0) > 0 && workTab === 'professionals' && (
                              mission.compensation_min ? (
                                <span className="bg-blue-50 border border-blue-100 text-blue-700 
                                                 text-xs font-semibold px-2 py-0.5 rounded-full">
                                  💰 ₱{mission.compensation_min.toLocaleString()} – ₱{mission.compensation_max?.toLocaleString()}
                                </span>
                              ) : (
                                <span className="bg-gray-50 border border-gray-100 text-gray-400 
                                                 text-xs px-2 py-0.5 rounded-full">
                                  💰 Negotiable
                                </span>
                              )
                            )}
                          </div>
                          {/* CTA — outline for owners, filled for others */}
                          <Link
                            to={`/missions/${mission.id}`}
                            className={`text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1 transition ${
                              isOwner
                                ? "border-2 border-[#1a3a2a] text-[#1a3a2a] hover:bg-green-50"
                                : "bg-[#1a3a2a] text-white hover:bg-green-900"
                            }`}
                          >
                            {isOwner
                              ? pendingCount > 0
                                ? `Review Applications (${pendingCount})`
                                : "View Your Project"
                              : appStatus === "pending"
                              ? "Application Pending"
                              : appStatus === "accepted"
                              ? "Connected — View"
                              : appStatus === "declined"
                              ? "Declined — View"
                              : "View & Apply"}{" "}
                            <ChevronRight className="w-3.5 h-3.5" />
                          </Link>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {workTab === "my_projects" && (
          <MyProjectsView 
            projects={myProjects} 
            joinedCounts={joinedCounts}
            pipelineByProject={pipelineByProject}
            onDelete={(projectId) => setMyProjects(prev => prev.filter(p => p.id !== projectId))}
          />
        )}
      </div>
    </div>
  );
}

function MyProjectsView({
  projects,
  joinedCounts,
  pipelineByProject,
  onDelete,
}: {
  projects: Project[];
  joinedCounts: Record<
    string,
    {
      volunteers_joined: number;
      professionals_joined: number;
      pending_applicants: number;
    }
  >;
  pipelineByProject: Record<string, { pending: number; accepted: number; declined: number }>;
  onDelete: (id: string) => void;
}) {
  const activeProjects = projects.filter(p => p.status === 'open' && p.type !== 'urgent');
  const urgentProjects = projects.filter(p => p.type === 'urgent');
  const [deleting, setDeleting] = useState<string | null>(null);

  const handleDelete = async (projectId: string) => {
    const confirmed = window.confirm(
      'Are you sure you want to delete this project? This cannot be undone.'
    );
    if (!confirmed) return;

    setDeleting(projectId);
    try {
      const success = await deleteProject(projectId);
      if (success) {
        onDelete(projectId);
      } else {
        alert('Failed to delete project.');
      }
    } catch (err) {
      console.error('Error deleting project:', err);
      alert('Failed to delete project.');
    } finally {
      setDeleting(null);
    }
  };

  const getStatusBadge = (project: Project) => {
    if (project.type === 'urgent') {
      return <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-red-100 text-red-700 flex items-center gap-1"><AlertTriangle className="w-3 h-3" />Urgent</span>;
    }
    return <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-green-100 text-green-700">Active</span>;
  };

  if (projects.length === 0) {
    return (
      <div className="text-center py-16">
        <Target className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-600 mb-2">No projects yet</h3>
        <p className="text-gray-400 text-sm mb-6">Create your first project to start finding volunteers and professionals.</p>
        <Link 
          to="/post-project" 
          className="inline-flex items-center gap-2 bg-[#1a3a2a] text-white px-6 py-3 rounded-xl font-medium hover:bg-green-900 transition"
        >
          + Post a Project
        </Link>
      </div>
    );
  }

  return (
    <div>
      {/* Summary strip */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        {[
          { label: "Active Projects", value: activeProjects.length, color: "bg-green-50 text-green-700 border-green-100" },
          { label: "Urgent Projects", value: urgentProjects.length, color: "bg-red-50 text-red-700 border-red-100" },
          {
            label: "Pending",
            value: Object.values(pipelineByProject).reduce((sum, row) => sum + row.pending, 0),
            color: "bg-amber-50 text-amber-700 border-amber-100",
          },
          {
            label: "Accepted",
            value: Object.values(pipelineByProject).reduce((sum, row) => sum + row.accepted, 0),
            color: "bg-emerald-50 text-emerald-700 border-emerald-100",
          },
          {
            label: "Declined",
            value: Object.values(pipelineByProject).reduce((sum, row) => sum + row.declined, 0),
            color: "bg-gray-50 text-gray-700 border-gray-200",
          },
        ].map(item => (
          <div key={item.label} className={`rounded-xl border p-4 text-center ${item.color}`}>
            <div className="text-3xl font-[Manrope] font-bold">{item.value}</div>
            <div className="text-xs font-medium mt-0.5">{item.label}</div>
          </div>
        ))}
      </div>

      <div className="space-y-4">
        {projects.map(project => (
          <div key={project.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <h3 className="font-[Manrope] font-bold text-[#0F3D2E]">{project.title}</h3>
                  {getStatusBadge(project)}
                </div>
                <p className="text-xs text-gray-500 mb-3">{project.location || 'No location'} · {project.duration || 'Flexible'}</p>
                <div className="flex gap-6">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Volunteers</p>
                    <span className="text-sm font-semibold text-[#0F3D2E]">
                      {(joinedCounts[project.id]?.volunteers_joined ?? 0)}/{project.volunteers_needed ?? 0}
                    </span>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Professionals</p>
                    <span className="text-sm font-semibold text-[#0F3D2E]">
                      {(joinedCounts[project.id]?.professionals_joined ?? 0)}/{project.professionals_needed ?? 0}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2 mt-3 flex-wrap">
                  <span className="text-xs px-2 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-100">
                    Pending: {pipelineByProject[project.id]?.pending ?? 0}
                  </span>
                  <span className="text-xs px-2 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100">
                    Accepted: {pipelineByProject[project.id]?.accepted ?? 0}
                  </span>
                  <span className="text-xs px-2 py-1 rounded-full bg-gray-50 text-gray-700 border border-gray-200">
                    Declined: {pipelineByProject[project.id]?.declined ?? 0}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {((joinedCounts[project.id]?.pending_applicants ?? 0) > 0) && (
                  <span className="text-xs font-semibold px-2 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-100">
                    {joinedCounts[project.id]?.pending_applicants ?? 0} pending applications
                  </span>
                )}
                <Link 
                  to={`/missions/${project.id}`}
                  className="text-sm font-semibold text-[#2F8F6B] border border-[#2F8F6B]/30 px-3 py-1.5 rounded-lg hover:bg-[#E6F4EE] transition-colors"
                >
                  {(joinedCounts[project.id]?.pending_applicants ?? 0) > 0
                    ? `Review Applications (${joinedCounts[project.id]?.pending_applicants ?? 0})`
                    : "View"}
                </Link>
                <Link 
                  to={`/post-project?edit=${project.id}`}
                  className="text-sm font-medium text-gray-500 border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Edit
                </Link>
                <button
                  onClick={() => handleDelete(project.id)}
                  disabled={deleting === project.id}
                  className="text-sm font-medium text-red-400 border border-red-200 px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50 flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  {deleting === project.id ? '...' : ''}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
