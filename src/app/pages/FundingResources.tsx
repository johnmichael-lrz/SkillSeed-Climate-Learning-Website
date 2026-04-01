import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router";
import {
  Search,
  ExternalLink,
  Bookmark,
  BookmarkCheck,
  Calendar,
  Globe,
  ChevronDown,
  ChevronRight,
  Leaf,
  TrendingUp,
  Plus,
  CheckCircle2,
  AlertTriangle,
  Pencil,
  X,
  SlidersHorizontal,
  DollarSign,
  Clock,
  RefreshCw,
  Banknote,
  Users,
  FileText,
} from "lucide-react";
import { supabase } from "../utils/supabase";
import { PostFundingModal } from "../components/PostFundingModal";

// ============================================================================
// Types
// ============================================================================

interface Profile {
  id: string;
  name: string;
  org_name: string | null;
  org_type: string | null;
  verified: boolean;
}

interface FundingOpportunity {
  id: string;
  poster_id: string | null;
  title: string;
  description: string | null;
  funder_name: string | null;
  type: string | null;
  focus_areas: string[] | null;
  eligibility: string | null;
  amount_min: number | null;
  amount_max: number | null;
  currency: string;
  region: string | null;
  deadline: string | null;
  apply_url: string | null;
  is_closing_soon: boolean;
  status: string;
  saved_count: number;
  created_at: string;
  profiles: Profile | null;
}

// ============================================================================
// Constants
// ============================================================================

const RESOURCE_SECTIONS = [
  {
    title: "Grant Writing Resources",
    icon: FileText,
    items: [
      "How to Write a Winning Climate Grant Proposal",
      "Logic Model Template for Environmental Projects",
      "M&E Framework for Climate Initiatives",
      "Sample Budget Template (UNDP/USAID format)",
    ],
  },
  {
    title: "Legal & Compliance",
    icon: CheckCircle2,
    items: [
      "NGO Registration Guide (Philippines)",
      "Reporting Requirements for International Grants",
      "Financial Management for Grant Recipients",
    ],
  },
  {
    title: "Impact Measurement",
    icon: TrendingUp,
    items: [
      "Carbon Footprint Calculation Methodologies",
      "Community Impact Assessment Templates",
      "Biodiversity Monitoring Protocols",
    ],
  },
];

const TYPES = ["All", "Grant", "Fellowship", "In-kind Support", "Partnership"];
const FOCUS_FILTERS = ["All Focus Areas", "Reforestation", "Marine", "Urban", "Agriculture", "Energy", "Disaster Response"];

// ============================================================================
// Helpers
// ============================================================================

const formatAmount = (min: number | null, max: number | null, currency: string) => {
  if (!min && !max) return null;
  const symbol = currency === "PHP" ? "₱" : currency === "EUR" ? "€" : "$";
  if (!min) return `Up to ${symbol}${max!.toLocaleString()}`;
  if (!max) return `From ${symbol}${min.toLocaleString()}`;
  return `${symbol}${min.toLocaleString()} – ${symbol}${max.toLocaleString()}`;
};

// ============================================================================
// Skeleton Components
// ============================================================================

function FundingCardSkeleton() {
  return (
    <div className="bg-white dark:bg-[#132B23] rounded-xl border border-slate-200 dark:border-[#1E3B34] p-4 animate-pulse">
      <div className="flex gap-2 mb-3">
        <div className="h-4 w-20 bg-slate-100 dark:bg-[#1E3B34] rounded" />
        <div className="h-4 w-16 bg-slate-100 dark:bg-[#1E3B34] rounded" />
      </div>
      <div className="h-5 w-3/4 bg-slate-100 dark:bg-[#1E3B34] rounded mb-2" />
      <div className="h-4 w-full bg-slate-100 dark:bg-[#1E3B34] rounded mb-3" />
      <div className="flex gap-3 mb-4">
        <div className="h-3 w-24 bg-slate-100 dark:bg-[#1E3B34] rounded" />
        <div className="h-3 w-20 bg-slate-100 dark:bg-[#1E3B34] rounded" />
      </div>
      <div className="flex gap-2">
        <div className="h-9 flex-1 bg-slate-100 dark:bg-[#1E3B34] rounded-lg" />
        <div className="h-9 w-20 bg-slate-100 dark:bg-[#1E3B34] rounded-lg" />
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
// FundingCard Component (matches Missions card pattern)
// ============================================================================

interface FundingCardProps {
  opportunity: FundingOpportunity;
  currentProfileId: string | null;
  isSaved: boolean;
  onToggleSave: (id: string) => void;
  onViewDetails: (opportunity: FundingOpportunity) => void;
  onEdit?: (id: string) => void;
}

function FundingCard({
  opportunity,
  currentProfileId,
  isSaved,
  onToggleSave,
  onViewDetails,
  onEdit,
}: FundingCardProps) {
  const isOwner = currentProfileId && String(opportunity.poster_id) === String(currentProfileId);
  const isVerifiedOrg = opportunity.profiles?.verified && opportunity.profiles?.org_type;
  const isClosingSoon = opportunity.is_closing_soon;

  return (
    <article className="group bg-white dark:bg-[#132B23] rounded-xl border border-slate-200 dark:border-[#1E3B34] overflow-hidden hover:border-[#2F8F6B]/40 dark:hover:border-[#6DD4A8]/40 hover:shadow-md transition-all duration-200">
      <div className="p-4">
        {/* Top row: Type chip + Funder + Verified badge */}
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          {opportunity.type && (
            <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-[#1E3B34] text-slate-600 dark:text-[#94C8AF] text-[10px] font-medium">
              {opportunity.type}
            </span>
          )}
          <span className="text-[10px] text-slate-400 dark:text-[#6B8F7F]">by</span>
          <span className="flex items-center gap-1 text-[10px] text-slate-500 dark:text-[#6B8F7F] truncate">
            {opportunity.funder_name ?? opportunity.profiles?.name ?? "Community"}
            {isVerifiedOrg && (
              <CheckCircle2 className="w-2.5 h-2.5 text-[#2F8F6B] dark:text-[#6DD4A8]" />
            )}
          </span>
          {isClosingSoon && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 text-[10px] font-medium">
              <Clock className="w-2.5 h-2.5" />
              Closing soon
            </span>
          )}
        </div>

        {/* Title */}
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white leading-snug mb-2 line-clamp-2 group-hover:text-[#0F3D2E] dark:group-hover:text-[#6DD4A8] transition-colors">
          {opportunity.title}
        </h3>

        {/* Description */}
        {opportunity.description && (
          <p className="text-xs text-slate-500 dark:text-[#94C8AF] line-clamp-2 leading-relaxed mb-3">
            {opportunity.description}
          </p>
        )}

        {/* Meta row: Deadline - Amount - Region */}
        <div className="flex items-center gap-1.5 text-[11px] text-slate-400 dark:text-[#6B8F7F] mb-3 flex-wrap">
          {opportunity.deadline && (
            <>
              <Calendar className="w-3 h-3 flex-shrink-0" />
              <span>
                {new Date(opportunity.deadline).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })}
              </span>
              <span className="text-slate-300 dark:text-[#1E3B34]">-</span>
            </>
          )}
          {formatAmount(opportunity.amount_min, opportunity.amount_max, opportunity.currency) && (
            <>
              <DollarSign className="w-3 h-3 flex-shrink-0 text-[#2F8F6B] dark:text-[#6DD4A8]" />
              <span className="text-[#2F8F6B] dark:text-[#6DD4A8] font-medium">
                {formatAmount(opportunity.amount_min, opportunity.amount_max, opportunity.currency)}
              </span>
              <span className="text-slate-300 dark:text-[#1E3B34]">-</span>
            </>
          )}
          {opportunity.region && (
            <>
              <Globe className="w-3 h-3 flex-shrink-0" />
              <span>{opportunity.region}</span>
            </>
          )}
        </div>

        {/* Focus area tags */}
        {opportunity.focus_areas && opportunity.focus_areas.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {opportunity.focus_areas.slice(0, 3).map((area) => (
              <span
                key={area}
                className="px-2 py-0.5 rounded bg-[#E6F4EE] dark:bg-[#1E3B34] text-[#0F3D2E] dark:text-[#6DD4A8] text-[10px] font-medium"
              >
                {area}
              </span>
            ))}
            {opportunity.focus_areas.length > 3 && (
              <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-[#1E3B34] text-slate-500 dark:text-[#94C8AF] text-[10px]">
                +{opportunity.focus_areas.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          {isOwner ? (
            <button
              onClick={() => onEdit?.(opportunity.id)}
              className="flex-1 min-h-[40px] border border-slate-200 dark:border-[#1E3B34] text-slate-700 dark:text-[#BEEBD7] text-sm font-medium py-2 rounded-lg hover:bg-slate-50 dark:hover:bg-[#1E3B34] transition-colors inline-flex items-center justify-center gap-1.5"
            >
              <Pencil className="w-3.5 h-3.5" />
              Edit
            </button>
          ) : (
            <button
              onClick={() => onViewDetails(opportunity)}
              className="flex-1 min-h-[40px] bg-[#0F3D2E] text-white text-sm font-semibold py-2 rounded-lg hover:bg-[#2F8F6B] transition-colors inline-flex items-center justify-center gap-1.5"
            >
              View Details
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            onClick={() => onToggleSave(opportunity.id)}
            className={`min-h-[40px] px-3 py-2 rounded-lg border text-sm font-medium transition-colors inline-flex items-center gap-1.5 ${
              isSaved
                ? "border-[#2F8F6B] text-[#2F8F6B] bg-[#E6F4EE] dark:border-[#6DD4A8] dark:text-[#6DD4A8] dark:bg-[#1E3B34]"
                : "border-slate-200 dark:border-[#1E3B34] text-slate-500 dark:text-[#94C8AF] hover:border-[#2F8F6B]/50"
            }`}
          >
            {isSaved ? (
              <BookmarkCheck className="w-4 h-4" />
            ) : (
              <Bookmark className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>
    </article>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function FundingResources() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");
  const [focusFilter, setFocusFilter] = useState("All Focus Areas");
  const [sortBy, setSortBy] = useState<"recommended" | "closing" | "largest" | "newest">("recommended");
  const [showFilters, setShowFilters] = useState(false);
  const [openSection, setOpenSection] = useState<string | null>(null);
  const [selectedOpportunity, setSelectedOpportunity] = useState<FundingOpportunity | null>(null);

  // Data state
  const [opportunities, setOpportunities] = useState<FundingOpportunity[]>([]);
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [currentProfile, setCurrentProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Fetch current user profile
  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from("profiles")
          .select("id, name, org_name, org_type, verified")
          .eq("user_id", user.id)
          .single();
        setCurrentProfile(data);
      }
    };
    fetchProfile();
  }, []);

  // Fetch opportunities
  useEffect(() => {
    fetchOpportunities();
  }, [typeFilter, focusFilter, search]);

  // Fetch saved when profile loads
  useEffect(() => {
    if (currentProfile?.id) {
      fetchSaved();
    }
  }, [currentProfile?.id]);

  const fetchOpportunities = async () => {
    setLoading(true);
    setError(null);
    try {
      let query = supabase
        .from("funding_opportunities_view")
        .select("*, profiles(name, org_name, org_type, verified)")
        .eq("status", "active")
        .order("deadline", { ascending: true, nullsFirst: false })
        .order("created_at", { ascending: false });

      if (typeFilter !== "All") {
        query = query.eq("type", typeFilter);
      }

      if (focusFilter !== "All Focus Areas") {
        query = query.contains("focus_areas", [focusFilter]);
      }

      if (search) {
        query = query.or(
          `title.ilike.%${search}%,description.ilike.%${search}%,funder_name.ilike.%${search}%`
        );
      }

      const { data, error: fetchError } = await query;
      if (fetchError) throw fetchError;
      setOpportunities((data as FundingOpportunity[]) ?? []);
    } catch (err) {
      console.error("Error fetching opportunities:", err);
      setError("Failed to load funding opportunities. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const fetchSaved = async () => {
    if (!currentProfile?.id) return;
    try {
      const { data } = await supabase
        .from("saved_funding")
        .select("funding_id")
        .eq("user_id", currentProfile.id);
      setSavedIds(data?.map(s => s.funding_id) ?? []);
    } catch (err) {
      console.error("Error fetching saved:", err);
    }
  };

  const handleToggleSave = async (fundingId: string) => {
    if (!currentProfile?.id) {
      navigate("/auth");
      return;
    }

    const isSaved = savedIds.includes(fundingId);
    try {
      if (isSaved) {
        await supabase
          .from("saved_funding")
          .delete()
          .eq("funding_id", fundingId)
          .eq("user_id", currentProfile.id);
        setSavedIds(ids => ids.filter(id => id !== fundingId));
      } else {
        await supabase
          .from("saved_funding")
          .insert({ funding_id: fundingId, user_id: currentProfile.id });
        setSavedIds(ids => [...ids, fundingId]);
      }
    } catch (err) {
      console.error("Error toggling save:", err);
    }
  };

  const handlePostClick = () => {
    if (!currentProfile) {
      navigate("/auth");
      return;
    }
    setIsModalOpen(true);
  };

  const closingSoonCount = opportunities.filter(o => o.is_closing_soon).length;
  const communityPostedCount = opportunities.filter(o => !!o.poster_id).length;

  const displayedOpportunities = [...opportunities].sort((a, b) => {
    if (sortBy === "newest") {
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    }
    if (sortBy === "largest") {
      return (b.amount_max ?? b.amount_min ?? 0) - (a.amount_max ?? a.amount_min ?? 0);
    }
    if (sortBy === "closing") {
      const aDeadline = a.deadline ? new Date(a.deadline).getTime() : Number.MAX_SAFE_INTEGER;
      const bDeadline = b.deadline ? new Date(b.deadline).getTime() : Number.MAX_SAFE_INTEGER;
      return aDeadline - bDeadline;
    }
    // recommended
    if (a.is_closing_soon && !b.is_closing_soon) return -1;
    if (!a.is_closing_soon && b.is_closing_soon) return 1;
    const aSaved = a.saved_count ?? 0;
    const bSaved = b.saved_count ?? 0;
    if (bSaved !== aSaved) return bSaved - aSaved;
    const aDeadline = a.deadline ? new Date(a.deadline).getTime() : Number.MAX_SAFE_INTEGER;
    const bDeadline = b.deadline ? new Date(b.deadline).getTime() : Number.MAX_SAFE_INTEGER;
    return aDeadline - bDeadline;
  });

  const hasActiveFilters = search !== "" || typeFilter !== "All" || focusFilter !== "All Focus Areas" || sortBy !== "recommended";

  const clearAllFilters = () => {
    setSearch("");
    setTypeFilter("All");
    setFocusFilter("All Focus Areas");
    setSortBy("recommended");
  };

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
            <div className="h-8 w-56 bg-slate-100 dark:bg-[#1E3B34] rounded mb-3 animate-pulse" />
            <div className="h-4 w-72 bg-slate-100 dark:bg-[#1E3B34] rounded animate-pulse" />
          </div>
        </div>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
          <KPIStripSkeleton />
          <div className="bg-white dark:bg-[#132B23] rounded-xl border border-slate-200 dark:border-[#1E3B34] p-4 animate-pulse">
            <div className="flex gap-3">
              <div className="flex-1 h-10 bg-slate-100 dark:bg-[#1E3B34] rounded-lg" />
              <div className="h-10 w-24 bg-slate-100 dark:bg-[#1E3B34] rounded-lg" />
              <div className="h-10 w-28 bg-slate-100 dark:bg-[#1E3B34] rounded-lg" />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <FundingCardSkeleton key={i} />
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
          Page Header (matches Missions pattern)
      ───────────────────────────────────────────────────────────────────── */}
      <header className="bg-white dark:bg-[#132B23] border-b border-slate-200 dark:border-[#1E3B34]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-[#2F8F6B] dark:text-[#6DD4A8] mb-1">
                Funding Opportunities
              </p>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white" style={{ fontFamily: "'Manrope', sans-serif" }}>
                Fund Your Project
              </h1>
              <p className="text-sm text-slate-600 dark:text-[#94C8AF] mt-1">
                Discover grants, fellowships, and partnerships to power your environmental mission.
              </p>
            </div>
            <button
              onClick={handlePostClick}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-medium rounded-lg border border-slate-200 dark:border-[#1E3B34] bg-white dark:bg-transparent text-slate-700 dark:text-[#BEEBD7] hover:bg-slate-50 dark:hover:bg-[#1E3B34] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2F8F6B] whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              Post Opportunity
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-5">
        {/* ─────────────────────────────────────────────────────────────────────
            KPI Strip (matches Missions pattern)
        ───────────────────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white dark:bg-[#132B23] rounded-xl border border-slate-200 dark:border-[#1E3B34] p-4">
            <p className="text-xs text-slate-500 dark:text-[#94C8AF] font-medium mb-1">Total Opportunities</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{opportunities.length}</p>
          </div>
          <button
            onClick={() => setSortBy("closing")}
            className={`text-left bg-white dark:bg-[#132B23] rounded-xl border p-4 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 ${
              sortBy === "closing" ? "border-amber-400" : "border-slate-200 dark:border-[#1E3B34] hover:border-amber-300"
            }`}
          >
            <p className="text-xs text-slate-500 dark:text-[#94C8AF] font-medium mb-1 flex items-center gap-1">
              <Clock className="w-3 h-3 text-amber-500" />
              Closing Soon
            </p>
            <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{closingSoonCount}</p>
          </button>
          <div className="bg-white dark:bg-[#132B23] rounded-xl border border-slate-200 dark:border-[#1E3B34] p-4">
            <p className="text-xs text-slate-500 dark:text-[#94C8AF] font-medium mb-1 flex items-center gap-1">
              <Users className="w-3 h-3" />
              Community Posted
            </p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{communityPostedCount}</p>
          </div>
        </div>

        {/* ─────────────────────────────────────────────────────────────────────
            Filter Bar (matches Missions pattern)
        ───────────────────────────────────────────────────────────────────── */}
        <div className="bg-white dark:bg-[#132B23] rounded-xl border border-slate-200 dark:border-[#1E3B34] p-4">
          <div className="flex flex-col md:flex-row gap-3">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search grants, funders, focus areas..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full min-h-[40px] pl-10 pr-4 py-2 border border-slate-200 dark:border-[#1E3B34] bg-white dark:bg-[#0D1F18] rounded-lg text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2F8F6B]/30 focus:border-[#2F8F6B] transition-all text-slate-900 dark:text-white"
              />
            </div>
            {/* Filters toggle */}
            <button
              onClick={() => setShowFilters((v) => !v)}
              className="min-h-[40px] px-4 py-2 rounded-lg border border-slate-200 dark:border-[#1E3B34] text-sm font-medium text-slate-700 dark:text-[#BEEBD7] hover:bg-slate-50 dark:hover:bg-[#1E3B34] transition-colors inline-flex items-center gap-2"
            >
              <SlidersHorizontal className="w-4 h-4" />
              Filters
            </button>
            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as "recommended" | "closing" | "largest" | "newest")}
              className="min-h-[40px] px-3 py-2 border border-slate-200 dark:border-[#1E3B34] rounded-lg text-sm bg-white dark:bg-[#0D1F18] text-slate-700 dark:text-[#BEEBD7] focus:outline-none focus:ring-2 focus:ring-[#2F8F6B]/30"
            >
              <option value="recommended">Recommended</option>
              <option value="closing">Closing soon</option>
              <option value="largest">Largest amount</option>
              <option value="newest">Newest</option>
            </select>
          </div>

          {/* Expanded filters */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t border-slate-200 dark:border-[#1E3B34] space-y-3">
              {/* Type filter chips */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs text-slate-400 dark:text-[#6B8F7F] mr-1">Type:</span>
                {TYPES.map(type => (
                  <button
                    key={type}
                    onClick={() => setTypeFilter(type)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                      typeFilter === type
                        ? "bg-[#0F3D2E] text-white"
                        : "bg-slate-100 dark:bg-[#1E3B34] text-slate-600 dark:text-[#94C8AF] hover:bg-slate-200 dark:hover:bg-[#2F8F6B]/20"
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
              {/* Focus filter chips */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs text-slate-400 dark:text-[#6B8F7F] mr-1">Focus:</span>
                {FOCUS_FILTERS.map(area => (
                  <button
                    key={area}
                    onClick={() => setFocusFilter(area)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                      focusFilter === area
                        ? "bg-[#2F8F6B] text-white"
                        : "bg-slate-100 dark:bg-[#1E3B34] text-slate-600 dark:text-[#94C8AF] hover:bg-slate-200 dark:hover:bg-[#2F8F6B]/20"
                    }`}
                  >
                    {area}
                  </button>
                ))}
              </div>
              {/* Clear filters */}
              {hasActiveFilters && (
                <button
                  onClick={clearAllFilters}
                  className="text-sm font-medium text-[#2F8F6B] dark:text-[#6DD4A8] hover:underline"
                >
                  Clear all filters
                </button>
              )}
            </div>
          )}
        </div>

        {/* Results count */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-600 dark:text-[#94C8AF]">
            <span className="font-semibold text-slate-900 dark:text-white">{displayedOpportunities.length}</span> opportunities found
          </p>
        </div>

        {/* ─────────────────────────────────────────────────────────────────────
            Funding Cards Grid
        ───────────────────────────────────────────────────────────────────── */}
        {displayedOpportunities.length === 0 ? (
          <div className="bg-white dark:bg-[#132B23] rounded-xl border border-slate-200 dark:border-[#1E3B34] p-12 text-center">
            <div className="w-14 h-14 rounded-full bg-slate-100 dark:bg-[#1E3B34] flex items-center justify-center mx-auto mb-4">
              <TrendingUp className="w-7 h-7 text-slate-400 dark:text-[#6B8F7F]" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">No opportunities found</h3>
            <p className="text-sm text-slate-600 dark:text-[#94C8AF] mb-6">Try adjusting your filters or search terms.</p>
            <div className="flex justify-center gap-3">
              <button
                onClick={clearAllFilters}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-slate-100 dark:bg-[#1E3B34] text-slate-700 dark:text-[#BEEBD7] hover:bg-slate-200 dark:hover:bg-[#2F8F6B]/20 transition-colors"
              >
                Clear filters
              </button>
              <button
                onClick={handlePostClick}
                className="px-4 py-2 rounded-lg text-sm font-semibold bg-[#0F3D2E] text-white hover:bg-[#2F8F6B] transition-colors"
              >
                Post opportunity
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {displayedOpportunities.map(opportunity => (
              <FundingCard
                key={opportunity.id}
                opportunity={opportunity}
                currentProfileId={currentProfile?.id ?? null}
                isSaved={savedIds.includes(opportunity.id)}
                onToggleSave={handleToggleSave}
                onViewDetails={setSelectedOpportunity}
                onEdit={id => navigate(`/edit-funding/${id}`)}
              />
            ))}
          </div>
        )}

        {/* ─────────────────────────────────────────────────────────────────────
            Resource Library
        ───────────────────────────────────────────────────────────────────── */}
        <div className="pt-6">
          <div className="flex items-center gap-2 mb-4">
            <Leaf className="w-4 h-4 text-[#2F8F6B] dark:text-[#6DD4A8]" />
            <h2 className="text-lg font-bold text-slate-900 dark:text-white" style={{ fontFamily: "'Manrope', sans-serif" }}>
              Resource Library
            </h2>
          </div>
          <div className="space-y-3">
            {RESOURCE_SECTIONS.map(section => {
              const SectionIcon = section.icon;
              return (
                <div
                  key={section.title}
                  className="bg-white dark:bg-[#132B23] rounded-xl border border-slate-200 dark:border-[#1E3B34] overflow-hidden"
                >
                  <button
                    onClick={() => setOpenSection(openSection === section.title ? null : section.title)}
                    className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-slate-50 dark:hover:bg-[#1E3B34] transition-colors"
                  >
                    <span className="flex items-center gap-2.5">
                      <SectionIcon className="w-4 h-4 text-[#2F8F6B] dark:text-[#6DD4A8]" />
                      <span className="text-sm font-semibold text-slate-900 dark:text-white" style={{ fontFamily: "'Manrope', sans-serif" }}>
                        {section.title}
                      </span>
                    </span>
                    {openSection === section.title ? (
                      <ChevronDown className="w-4 h-4 text-slate-400 dark:text-[#6B8F7F]" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-slate-400 dark:text-[#6B8F7F]" />
                    )}
                  </button>
                  {openSection === section.title && (
                    <div className="px-5 pb-4 border-t border-slate-200 dark:border-[#1E3B34] pt-3 space-y-1">
                      {section.items.map(item => (
                        <a
                          key={item}
                          href="#"
                          className="flex items-center gap-2 py-2 text-sm text-slate-600 dark:text-[#94C8AF] hover:text-[#2F8F6B] dark:hover:text-[#6DD4A8] transition-colors"
                        >
                          <ExternalLink className="w-3.5 h-3.5 flex-shrink-0" />
                          {item}
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Post Funding Modal */}
      <PostFundingModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        currentProfileId={currentProfile?.id ?? null}
        onSuccess={() => fetchOpportunities()}
      />

      {/* ─────────────────────────────────────────────────────────────────────
          Details Drawer
      ───────────────────────────────────────────────────────────────────── */}
      {selectedOpportunity && (
        <div className="fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-black/30 backdrop-blur-sm"
            onClick={() => setSelectedOpportunity(null)}
            role="button"
            aria-label="Close funding details"
          />
          <div className="absolute right-0 top-0 h-full w-full sm:w-[480px] bg-white dark:bg-[#132B23] shadow-2xl border-l border-slate-200 dark:border-[#1E3B34] overflow-y-auto">
            {/* Drawer header */}
            <div className="sticky top-0 bg-white dark:bg-[#132B23] p-5 border-b border-slate-200 dark:border-[#1E3B34] flex items-start justify-between gap-3 z-10">
              <div className="min-w-0">
                <p className="text-xs font-semibold text-[#2F8F6B] dark:text-[#6DD4A8] uppercase tracking-wide mb-1">Funding details</p>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white" style={{ fontFamily: "'Manrope', sans-serif" }}>
                  {selectedOpportunity.title}
                </h2>
                <p className="text-sm text-slate-500 dark:text-[#94C8AF] mt-1">
                  {selectedOpportunity.funder_name ?? selectedOpportunity.profiles?.name ?? "Community"} · {selectedOpportunity.type ?? "Grant"}
                </p>
              </div>
              <button
                onClick={() => setSelectedOpportunity(null)}
                className="p-2 rounded-lg border border-slate-200 dark:border-[#1E3B34] text-slate-500 dark:text-[#94C8AF] hover:bg-slate-50 dark:hover:bg-[#1E3B34] transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-5">
              {/* Focus area tags */}
              {selectedOpportunity.focus_areas && selectedOpportunity.focus_areas.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {selectedOpportunity.focus_areas.map((area) => (
                    <span key={area} className="px-2.5 py-1 rounded bg-[#E6F4EE] dark:bg-[#1E3B34] text-[#0F3D2E] dark:text-[#6DD4A8] text-xs font-medium">
                      {area}
                    </span>
                  ))}
                  {selectedOpportunity.is_closing_soon && (
                    <span className="px-2.5 py-1 rounded bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 text-xs font-medium">
                      Closing soon
                    </span>
                  )}
                </div>
              )}

              {/* Description */}
              {selectedOpportunity.description && (
                <p className="text-sm text-slate-700 dark:text-[#BEEBD7] leading-relaxed">{selectedOpportunity.description}</p>
              )}

              {/* Stats grid */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-slate-50 dark:bg-[#0D1F18] rounded-lg p-3 text-center">
                  <p className="text-xs text-slate-400 dark:text-[#6B8F7F]">Deadline</p>
                  <p className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">
                    {selectedOpportunity.deadline
                      ? new Date(selectedOpportunity.deadline).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
                      : "Open"}
                  </p>
                </div>
                <div className="bg-slate-50 dark:bg-[#0D1F18] rounded-lg p-3 text-center">
                  <p className="text-xs text-slate-400 dark:text-[#6B8F7F]">Amount</p>
                  <p className="text-sm font-bold text-[#2F8F6B] dark:text-[#6DD4A8] mt-0.5">
                    {formatAmount(selectedOpportunity.amount_min, selectedOpportunity.amount_max, selectedOpportunity.currency) ?? "N/A"}
                  </p>
                </div>
                <div className="bg-slate-50 dark:bg-[#0D1F18] rounded-lg p-3 text-center">
                  <p className="text-xs text-slate-400 dark:text-[#6B8F7F]">Region</p>
                  <p className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">{selectedOpportunity.region ?? "Global"}</p>
                </div>
              </div>

              {/* Eligibility */}
              {selectedOpportunity.eligibility && (
                <div className="bg-slate-50 dark:bg-[#0D1F18] rounded-lg p-4">
                  <p className="text-sm font-semibold text-slate-900 dark:text-white mb-1">Eligibility</p>
                  <p className="text-sm text-slate-600 dark:text-[#94C8AF]">{selectedOpportunity.eligibility}</p>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2">
                {selectedOpportunity.apply_url ? (
                  <a
                    href={selectedOpportunity.apply_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 min-h-[44px] py-2.5 rounded-lg text-sm font-semibold bg-[#0F3D2E] text-white hover:bg-[#2F8F6B] transition-colors text-center inline-flex items-center justify-center gap-1.5"
                  >
                    Apply Now <ExternalLink className="w-4 h-4" />
                  </a>
                ) : (
                  <button
                    type="button"
                    disabled
                    className="flex-1 min-h-[44px] py-2.5 rounded-lg text-sm font-semibold bg-slate-100 dark:bg-[#1E3B34] text-slate-400 dark:text-[#6B8F7F] cursor-not-allowed"
                  >
                    No application link
                  </button>
                )}
                <button
                  onClick={() => handleToggleSave(selectedOpportunity.id)}
                  className={`min-h-[44px] px-4 py-2.5 rounded-lg border text-sm font-medium transition-colors ${
                    savedIds.includes(selectedOpportunity.id)
                      ? "border-[#2F8F6B] text-[#2F8F6B] bg-[#E6F4EE] dark:border-[#6DD4A8] dark:text-[#6DD4A8] dark:bg-[#1E3B34]"
                      : "border-slate-200 dark:border-[#1E3B34] text-slate-600 dark:text-[#94C8AF] hover:border-[#2F8F6B]/50"
                  }`}
                >
                  {savedIds.includes(selectedOpportunity.id) ? "Saved" : "Save"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default FundingResources;
