import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Trophy,
  Users,
  Clock,
  Star,
  Flame,
  TrendingUp,
  MapPin,
  ChevronRight,
  Plus,
  Share2,
  CheckCircle,
  Leaf,
  Target,
  Award,
  ArrowUp,
  Loader2,
  Camera,
  Heart,
} from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { supabase } from "../utils/supabase";
import {
  fetchActiveChallenges,
  fetchJoinedChallenges,
  fetchLeaderboard,
  fetchCommunityStats,
  fetchUserChallengeStats,
  fetchUserRank,
  fetchFeaturedChallenge,
  joinChallenge,
  leaveChallenge,
  createChallenge,
  subscribeToChallenges,
  unsubscribeFromChannel,
  fetchCommunityFeed,
  fetchUserLikedSubmissions,
  subscribeToFeed,
  hasUserSubmitted,
} from "../utils/challengeService";
import { CreateChallengeModal } from "../components/CreateChallengeModal";
import { SubmissionModal } from "../components/SubmissionModal";
import { FeedCard } from "../components/FeedCard";
import type { Challenge, FeaturedChallenge, LeaderboardEntry, CreateChallengeInput, FeedItem } from "../types/database";

// Category color mapping
const CATEGORY_COLORS: Record<string, string> = {
  "Waste Reduction": "bg-lime-100 text-lime-700",
  "Solar Energy": "bg-amber-100 text-amber-700",
  "Urban Greening": "bg-green-100 text-green-700",
  "Water Conservation": "bg-blue-100 text-blue-700",
  "Energy Efficiency": "bg-orange-100 text-orange-700",
  "Mixed": "bg-purple-100 text-purple-700",
};

// Helper to calculate days remaining
function getDaysRemaining(deadline: string | null): number {
  if (!deadline) return 30;
  const now = new Date();
  const deadlineDate = new Date(deadline);
  const diffTime = deadlineDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
}

// Helper to get initials from name
function getInitials(name: string | null): string {
  if (!name) return "??";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function CommunityChallenges() {
  const { user } = useAuth();
  
  // Data state
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [joinedChallengeIds, setJoinedChallengeIds] = useState<Set<string>>(new Set());
  const [completedChallengeIds, setCompletedChallengeIds] = useState<Set<string>>(new Set());
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [communityStats, setCommunityStats] = useState({
    totalChallengers: 0,
    activeChallenges: 0,
    totalActions: 0,
  });
  const [userStats, setUserStats] = useState({
    totalPoints: 0,
    activeChallenges: 0,
    completedChallenges: 0,
  });
  const [userRank, setUserRank] = useState<number | null>(null);
  const [userProfileId, setUserProfileId] = useState<string | null>(null);
  const [featuredChallenge, setFeaturedChallenge] = useState<FeaturedChallenge | null>(null);
  
  // Feed state
  const [feedItems, setFeedItems] = useState<FeedItem[]>([]);
  const [likedSubmissionIds, setLikedSubmissionIds] = useState<Set<string>>(new Set());

  // UI state
  const [loading, setLoading] = useState(true);
  const [joiningId, setJoiningId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"all" | "joined" | "featured" | "feed">("all");
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("All Categories");
  const [difficultyFilter, setDifficultyFilter] = useState<string>("All Levels");
  const [joinedOnly, setJoinedOnly] = useState(false);
  const [minPoints, setMinPoints] = useState<number>(0);
  const [timeLeftFilter, setTimeLeftFilter] = useState<"any" | "7" | "3">("any");
  const [sortBy, setSortBy] = useState<"trending" | "ending_soon" | "most_participants" | "most_points">(
    "trending"
  );
  const [lastUpdatedAt, setLastUpdatedAt] = useState<Date | null>(null);
  const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [submissionModalOpen, setSubmissionModalOpen] = useState(false);
  const [selectedChallengeForSubmission, setSelectedChallengeForSubmission] = useState<Challenge | null>(null);

  const challengeById = useMemo(() => {
    const map = new Map<string, Challenge>();
    challenges.forEach((c) => map.set(c.id, c));
    return map;
  }, [challenges]);

  // Fetch user's profile ID
  const fetchUserProfile = useCallback(async () => {
    if (!user?.id) return null;
    const { data } = await supabase
      .from("profiles")
      .select("id")
      .eq("user_id", user.id)
      .single();
    return data?.id || null;
  }, [user?.id]);

  // Fetch all data
  const fetchData = useCallback(async () => {
    try {
      // Fetch challenges, community stats, leaderboard, featured challenge, and feed in parallel
      const [challengesData, statsData, leaderboardData, featuredData, feedData] = await Promise.all([
        fetchActiveChallenges(),
        fetchCommunityStats(),
        fetchLeaderboard(10),
        fetchFeaturedChallenge(),
        fetchCommunityFeed(20),
      ]);

      setChallenges(challengesData);
      setCommunityStats(statsData);
      setLeaderboard(leaderboardData);
      setFeaturedChallenge(featuredData);
      setFeedItems(feedData);
      setLastUpdatedAt(new Date());

      // If user is logged in, fetch their data
      if (user?.id) {
        const profileId = await fetchUserProfile();
        setUserProfileId(profileId);

        if (profileId) {
          const [joinedData, userStatsData, rankData, likedData] = await Promise.all([
            fetchJoinedChallenges(profileId),
            fetchUserChallengeStats(profileId),
            fetchUserRank(profileId),
            fetchUserLikedSubmissions(profileId),
          ]);

          setJoinedChallengeIds(new Set(joinedData.map((j) => j.challenge_id)));
          // Track which joined challenges user has already completed
          const completedIds = joinedData
            .filter((j) => j.status === "completed")
            .map((j) => j.challenge_id);
          setCompletedChallengeIds(new Set(completedIds));
          setUserStats(userStatsData);
          setUserRank(rankData);
          setLikedSubmissionIds(new Set(likedData));
        }
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  }, [user?.id, fetchUserProfile]);

  // Initial data fetch
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Real-time subscription
  useEffect(() => {
    const challengesChannel = subscribeToChallenges(() => {
      fetchData();
    });
    
    const feedChannel = subscribeToFeed(() => {
      fetchData();
    });

    return () => {
      unsubscribeFromChannel(challengesChannel);
      unsubscribeFromChannel(feedChannel);
    };
  }, [fetchData]);

  // Handle join/leave challenge
  const handleJoin = async (challengeId: string) => {
    if (!user || !userProfileId) {
      // Optionally redirect to login
      return;
    }

    setJoiningId(challengeId);
    try {
      const isJoined = joinedChallengeIds.has(challengeId);
      
      if (isJoined) {
        await leaveChallenge(challengeId, userProfileId);
        setJoinedChallengeIds((prev) => {
          const newSet = new Set(prev);
          newSet.delete(challengeId);
          return newSet;
        });
      } else {
        await joinChallenge(challengeId, userProfileId);
        setJoinedChallengeIds((prev) => new Set(prev).add(challengeId));
      }

      // Refresh data to get updated counts
      fetchData();
    } catch (error) {
      console.error("Error joining/leaving challenge:", error);
    } finally {
      setJoiningId(null);
    }
  };

  // Handle create challenge
  const handleCreateChallenge = async (data: CreateChallengeInput) => {
    if (!userProfileId) return;
    await createChallenge(userProfileId, data);
    fetchData();
  };

  // Handle opening submission modal
  const handleOpenSubmissionModal = (challenge: Challenge) => {
    setSelectedChallengeForSubmission(challenge);
    setSubmissionModalOpen(true);
  };

  // Handle successful submission
  const handleSubmissionSuccess = () => {
    fetchData();
  };

  // Get challenge status for a user
  const getChallengeStatus = (challengeId: string): "not-joined" | "joined" | "completed" => {
    if (completedChallengeIds.has(challengeId)) return "completed";
    if (joinedChallengeIds.has(challengeId)) return "joined";
    return "not-joined";
  };

  // Handle like update from feed card
  const handleLikeUpdate = (submissionId: string, newCount: number, isLiked: boolean) => {
    setLikedSubmissionIds((prev) => {
      const newSet = new Set(prev);
      if (isLiked) {
        newSet.add(submissionId);
      } else {
        newSet.delete(submissionId);
      }
      return newSet;
    });
  };

  // Filter and sort challenges - algorithmically computed featured challenge appears first
  const categories = ["All Categories", ...Array.from(new Set(challenges.map((c) => c.category || "General")))];
  const difficulties = ["All Levels", ...Array.from(new Set(challenges.map((c) => c.difficulty || "Beginner")))];

  const filteredChallenges = challenges
    .filter((c) => {
      if (activeTab === "feed") return false;
      if (activeTab === "joined") return joinedChallengeIds.has(c.id);
      if (activeTab === "featured") return c.id === featuredChallenge?.id;
      return true;
    })
    .filter((c) => {
      const matchesSearch =
        !search ||
        c.title.toLowerCase().includes(search.toLowerCase()) ||
        (c.description ?? "").toLowerCase().includes(search.toLowerCase()) ||
        (c.category ?? "").toLowerCase().includes(search.toLowerCase());
      const matchesCategory =
        categoryFilter === "All Categories" || (c.category ?? "General") === categoryFilter;
      const matchesDifficulty =
        difficultyFilter === "All Levels" || (c.difficulty ?? "Beginner") === difficultyFilter;
      const matchesJoinedOnly = !joinedOnly || joinedChallengeIds.has(c.id);
      const matchesPoints = (c.points_reward ?? 0) >= minPoints;
      const daysLeft = getDaysRemaining(c.deadline);
      const matchesTimeLeft =
        timeLeftFilter === "any" ||
        (timeLeftFilter === "7" && daysLeft <= 7) ||
        (timeLeftFilter === "3" && daysLeft <= 3);
      return matchesSearch && matchesCategory && matchesDifficulty && matchesJoinedOnly && matchesPoints && matchesTimeLeft;
    })
    .sort((a, b) => {
      // Always pin featured to the top in All/Joined lists.
      if ((activeTab === "all" || activeTab === "joined") && a.id === featuredChallenge?.id) return -1;
      if ((activeTab === "all" || activeTab === "joined") && b.id === featuredChallenge?.id) return 1;

      if (sortBy === "ending_soon") {
        return getDaysRemaining(a.deadline) - getDaysRemaining(b.deadline);
      }
      if (sortBy === "most_participants") {
        return (b.participant_count ?? 0) - (a.participant_count ?? 0);
      }
      if (sortBy === "most_points") {
        return (b.points_reward ?? 0) - (a.points_reward ?? 0);
      }
      // trending: prioritize featured score if present, then participants, then ending soon.
      const aScore = a.id === featuredChallenge?.id ? featuredChallenge?.activity_score ?? 0 : 0;
      const bScore = b.id === featuredChallenge?.id ? featuredChallenge?.activity_score ?? 0 : 0;
      const scoreDiff = bScore - aScore;
      if (scoreDiff !== 0) return scoreDiff;
      const participantDiff = (b.participant_count ?? 0) - (a.participant_count ?? 0);
      if (participantDiff !== 0) return participantDiff;
      return getDaysRemaining(a.deadline) - getDaysRemaining(b.deadline);
    });

  // Check if a challenge is the featured one
  const isFeatured = (challengeId: string) => challengeId === featuredChallenge?.id;

  // Calculate points to next rank
  const getPointsToNextRank = () => {
    if (!userRank || userRank <= 1 || leaderboard.length < 2) return null;
    const currentUserEntry = leaderboard.find((e) => e.user_id === userProfileId);
    const nextRankEntry = leaderboard[userRank - 2]; // -2 because rank is 1-indexed
    if (!currentUserEntry || !nextRankEntry) return null;
    return nextRankEntry.total_points - currentUserEntry.total_points;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F9FDFB]">
        <div className="bg-gradient-to-br from-[#0F3D2E] to-[#1A5C43] py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="h-8 w-72 bg-white/20 rounded animate-pulse mb-3" />
            <div className="h-5 w-96 bg-white/10 rounded animate-pulse" />
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-24 bg-white/10 rounded-xl animate-pulse" />
              ))}
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-44 bg-white rounded-2xl border border-gray-100 animate-pulse" />
            ))}
          </div>
          <div className="space-y-4">
            <div className="h-64 bg-white rounded-2xl border border-gray-100 animate-pulse" />
            <div className="h-40 bg-white rounded-2xl border border-gray-100 animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  const pointsToNext = getPointsToNextRank();

  const activeFilterChips: string[] = [
    search ? `Search: ${search}` : "",
    categoryFilter !== "All Categories" ? categoryFilter : "",
    difficultyFilter !== "All Levels" ? difficultyFilter : "",
    joinedOnly ? "Joined only" : "",
    minPoints > 0 ? `Min points: ${minPoints}` : "",
    timeLeftFilter !== "any" ? `${timeLeftFilter}d left` : "",
    sortBy !== "trending" ? `Sort: ${sortBy.replace("_", " ")}` : "",
  ].filter(Boolean);

  const clearAllFilters = () => {
    setSearch("");
    setCategoryFilter("All Categories");
    setDifficultyFilter("All Levels");
    setJoinedOnly(false);
    setMinPoints(0);
    setTimeLeftFilter("any");
    setSortBy("trending");
  };

  const weeklyGoal = Math.max(500, Math.ceil((communityStats.totalActions + 1) / 500) * 500);
  const weeklyProgress = Math.min(1, communityStats.totalActions / weeklyGoal);
  const featured = featuredChallenge ?? null;

  return (
    <div className="min-h-screen bg-[#F9FDFB]">
      {/* Create Challenge Modal */}
      <CreateChallengeModal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        onSubmit={handleCreateChallenge}
      />

      {/* Submission Modal */}
      {selectedChallengeForSubmission && userProfileId && (
        <SubmissionModal
          open={submissionModalOpen}
          onOpenChange={setSubmissionModalOpen}
          challenge={selectedChallengeForSubmission}
          userId={userProfileId}
          onSuccess={handleSubmissionSuccess}
        />
      )}

      {/* Header */}
      <div className="bg-gradient-to-br from-[#0F3D2E] to-[#1A5C43] py-12 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 rounded-full bg-[#2F8F6B]/10 blur-3xl" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Trophy className="w-6 h-6 text-amber-400" />
                <span className="text-[#6DD4A8] font-semibold text-sm uppercase tracking-wider">Community Challenges</span>
              </div>
              <h1 className="text-white font-[Manrope] font-bold text-3xl md:text-4xl mb-2">
                Compete. Collaborate. Impact.
              </h1>
              <p className="text-[#A8D5BF] max-w-lg">
                Join collective challenges that multiply your impact. Every action counts toward a shared climate goal.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => setCreateModalOpen(true)}
                disabled={!user}
                className="flex items-center gap-2 bg-[#2F8F6B] text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-[#257A5B] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Plus className="w-4 h-4" />
                Create Challenge
              </button>
            </div>
          </div>

          {/* Community stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8">
            <div className="bg-white/10 backdrop-blur rounded-xl p-4 text-center">
              <div className="flex justify-center mb-1 text-[#6DD4A8]">
                <Users className="w-5 h-5" />
              </div>
              <div className="text-2xl font-[Manrope] font-bold text-white">
                {communityStats.totalChallengers.toLocaleString()}
              </div>
              <div className="text-[#A8D5BF] text-xs mt-0.5">Active Challengers</div>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-xl p-4 text-center">
              <div className="flex justify-center mb-1 text-[#6DD4A8]">
                <Target className="w-5 h-5" />
              </div>
              <div className="text-2xl font-[Manrope] font-bold text-white">
                {communityStats.activeChallenges}
              </div>
              <div className="text-[#A8D5BF] text-xs mt-0.5">Challenges Running</div>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-xl p-4 text-center">
              <div className="flex justify-center mb-1 text-[#6DD4A8]">
                <Leaf className="w-5 h-5" />
              </div>
              <div className="text-2xl font-[Manrope] font-bold text-white">
                {communityStats.totalActions.toLocaleString()}
              </div>
              <div className="text-[#A8D5BF] text-xs mt-0.5">Impact Actions</div>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-xl p-4 text-center">
              <div className="flex justify-center mb-1 text-[#6DD4A8]">
                <MapPin className="w-5 h-5" />
              </div>
              <div className="text-2xl font-[Manrope] font-bold text-white">
                {challenges.length}
              </div>
              <div className="text-[#A8D5BF] text-xs mt-0.5">Active Challenges</div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main challenges */}
          <div className="lg:col-span-2">
            {/* Weekly community goal */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_6px_20px_rgba(15,61,46,0.08)] p-5 mb-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Community goal (this week)</p>
                  <p className="font-[Manrope] font-bold text-[#0F3D2E] text-lg mt-1">
                    Reach {weeklyGoal.toLocaleString()} impact actions together
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    Small actions compound into real community resilience.
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-bold text-[#0F3D2E]">{communityStats.totalActions.toLocaleString()}</p>
                  <p className="text-xs text-gray-400">actions so far</p>
                </div>
              </div>
              <div className="mt-4">
                <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                  <div className="h-full bg-[#2F8F6B]" style={{ width: `${Math.round(weeklyProgress * 100)}%` }} />
                </div>
                <div className="flex items-center justify-between mt-2 text-xs text-gray-400">
                  <span>Progress</span>
                  <span>{Math.round(weeklyProgress * 100)}%</span>
                </div>
              </div>
            </div>

            {/* Tab filter */}
            <div className="flex gap-1 bg-white rounded-xl border border-gray-100 shadow-sm p-1 mb-6 w-fit">
              {(["all", "featured", "joined", "feed"] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-colors ${
                    activeTab === tab ? "bg-[#0F3D2E] text-white" : "text-gray-600 hover:bg-[#E6F4EE]"
                  }`}
                >
                  {tab === "all" ? "All Challenges" : tab === "featured" ? "Top Challenge" : tab === "feed" ? `Feed (${feedItems.length})` : `Joined (${joinedChallengeIds.size})`}
                </button>
              ))}
            </div>

            {/* Search / filters / sort (hidden on feed) */}
            {activeTab !== "feed" && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_6px_20px_rgba(15,61,46,0.08)] p-4 mb-6">
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="flex-1">
                    <input
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Search challenges, categories, keywords..."
                      className="w-full min-h-10 px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2F8F6B]/30 focus:border-[#2F8F6B]"
                    />
                  </div>
                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="min-h-10 px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#2F8F6B]/30"
                    aria-label="Category filter"
                  >
                    {categories.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                  <select
                    value={difficultyFilter}
                    onChange={(e) => setDifficultyFilter(e.target.value)}
                    className="min-h-10 px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#2F8F6B]/30"
                    aria-label="Difficulty filter"
                  >
                    {difficulties.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                  <select
                    value={sortBy}
                    onChange={(e) =>
                      setSortBy(e.target.value as "trending" | "ending_soon" | "most_participants" | "most_points")
                    }
                    className="min-h-10 px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#2F8F6B]/30"
                    aria-label="Sort challenges"
                  >
                    <option value="trending">Trending</option>
                    <option value="ending_soon">Ending soon</option>
                    <option value="most_participants">Most participants</option>
                    <option value="most_points">Most points</option>
                  </select>
                </div>
                <div className="flex flex-wrap items-center gap-3 mt-3">
                  <label className="inline-flex items-center gap-2 text-sm text-gray-600">
                    <input
                      type="checkbox"
                      checked={joinedOnly}
                      onChange={(e) => setJoinedOnly(e.target.checked)}
                      className="rounded border-gray-300 text-[#2F8F6B] focus:ring-[#2F8F6B]"
                    />
                    Joined only
                  </label>
                  <select
                    value={String(minPoints)}
                    onChange={(e) => setMinPoints(Number(e.target.value))}
                    className="min-h-10 px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#2F8F6B]/30"
                    aria-label="Minimum points"
                  >
                    <option value="0">Any points</option>
                    <option value="25">25+ points</option>
                    <option value="50">50+ points</option>
                    <option value="75">75+ points</option>
                    <option value="100">100+ points</option>
                  </select>
                  <select
                    value={timeLeftFilter}
                    onChange={(e) => setTimeLeftFilter(e.target.value as "any" | "7" | "3")}
                    className="min-h-10 px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#2F8F6B]/30"
                    aria-label="Time left filter"
                  >
                    <option value="any">Any deadline</option>
                    <option value="7">Ending in 7 days</option>
                    <option value="3">Ending in 3 days</option>
                  </select>
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
            )}

            {activeTab !== "feed" && featured && (
              <div className="bg-white rounded-2xl border border-[#2F8F6B]/30 shadow-[0_6px_20px_rgba(15,61,46,0.08)] overflow-hidden mb-6">
                <div className="bg-gradient-to-r from-[#2F8F6B] to-[#0F3D2E] px-4 py-2 flex items-center justify-between">
                  <span className="text-white text-xs font-bold uppercase tracking-wide">Featured this week</span>
                  <span className="text-[#D4F3E6] text-[11px]">Most completions + urgency score</span>
                </div>
                <div className="p-4 sm:p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-[Manrope] font-bold text-[#0F3D2E] text-xl">{featured.title}</h3>
                      <p className="text-sm text-gray-500 mt-1">
                        Why featured: highest community activity this week with strong momentum.
                      </p>
                    </div>
                    <span className="text-sm font-bold text-[#2F8F6B]">+{featured.points_reward} pts</span>
                  </div>
                  <div className="flex flex-wrap gap-3 mt-4 text-xs text-gray-500">
                    <span className="inline-flex items-center gap-1"><Users className="w-3.5 h-3.5" /> {featured.participant_count.toLocaleString()} joined</span>
                    <span className="inline-flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {getDaysRemaining(featured.deadline)} days left</span>
                    <span className="inline-flex items-center gap-1"><Flame className="w-3.5 h-3.5 text-amber-500" /> score {featured.activity_score}</span>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <button
                      onClick={() => handleJoin(featured.id)}
                      disabled={!user || joiningId === featured.id}
                      className="px-4 py-2 rounded-xl text-sm font-semibold bg-[#0F3D2E] text-white hover:bg-[#2F8F6B] transition-colors disabled:opacity-50"
                    >
                      {joiningId === featured.id ? "Joining..." : joinedChallengeIds.has(featured.id) ? "Joined" : "Join in 1 tap"}
                    </button>
                    <button
                      onClick={() => setSelectedChallenge(featured)}
                      className="px-4 py-2 rounded-xl text-sm font-semibold border border-gray-200 text-gray-700 hover:border-[#2F8F6B]/50"
                    >
                      View details
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "feed" ? (
              // Feed view - narrower centered column
              feedItems.length === 0 ? (
                <div className="max-w-xl mx-auto">
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
                    <div className="w-16 h-16 rounded-full bg-[#E6F4EE] flex items-center justify-center mx-auto mb-4">
                      <Camera className="w-8 h-8 text-[#2F8F6B]" />
                    </div>
                    <h3 className="font-[Manrope] font-bold text-[#0F3D2E] text-lg mb-2">
                      No Submissions Yet
                    </h3>
                    <p className="text-gray-500 text-sm">
                      Be the first to complete a challenge and share your impact!
                    </p>
                  </div>
                </div>
              ) : (
                <div className="max-w-xl mx-auto flex flex-col gap-4 py-4">
                  {feedItems.map((item) => (
                    <FeedCard
                      key={item.id}
                      item={item}
                      isLiked={likedSubmissionIds.has(item.id)}
                      userId={userProfileId}
                      onOpenChallenge={(challengeId) => {
                        const challenge = challengeById.get(challengeId);
                        if (challenge) setSelectedChallenge(challenge);
                      }}
                      onLikeUpdate={handleLikeUpdate}
                    />
                  ))}
                </div>
              )
            ) : filteredChallenges.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
                <div className="w-16 h-16 rounded-full bg-[#E6F4EE] flex items-center justify-center mx-auto mb-4">
                  <Trophy className="w-8 h-8 text-[#2F8F6B]" />
                </div>
                <h3 className="font-[Manrope] font-bold text-[#0F3D2E] text-lg mb-2">
                  {activeTab === "joined" ? "No Joined Challenges" : activeTab === "featured" ? "No Top Challenge Yet" : "No Challenges Found"}
                </h3>
                <p className="text-gray-500 text-sm">
                  {activeTab === "joined"
                    ? "Join a challenge to start making an impact!"
                    : activeTab === "featured"
                    ? "The top challenge is calculated based on activity. Check back soon!"
                    : "Check back soon for new challenges."}
                </p>
                <div className="flex flex-wrap justify-center gap-2 mt-5">
                  {activeTab !== "featured" && (
                    <button
                      onClick={clearAllFilters}
                      className="px-4 py-2 rounded-xl text-sm font-semibold bg-[#E6F4EE] text-[#0F3D2E] hover:bg-[#d9efe4] transition-colors"
                    >
                      Clear filters
                    </button>
                  )}
                  <button
                    onClick={() => setActiveTab("all")}
                    className="px-4 py-2 rounded-xl text-sm font-semibold bg-[#0F3D2E] text-white hover:bg-[#2F8F6B] transition-colors"
                  >
                    Browse challenges
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-5">
                {filteredChallenges.map((challenge) => {
                  const challengeStatus = getChallengeStatus(challenge.id);
                  const isJoined = challengeStatus !== "not-joined";
                  const isCompleted = challengeStatus === "completed";
                  const daysLeft = getDaysRemaining(challenge.deadline);
                  const challengeIsFeatured = isFeatured(challenge.id);
                  const categoryColor = CATEGORY_COLORS[challenge.category || ""] || "bg-gray-100 text-gray-700";

                  return (
                    <div
                      key={challenge.id}
                      className={`bg-white rounded-2xl border shadow-[0_6px_20px_rgba(15,61,46,0.08)] overflow-hidden transition-all duration-200 hover:shadow-[0_14px_28px_rgba(15,61,46,0.12)] ${
                        challengeIsFeatured ? "border-[#2F8F6B]/30" : "border-gray-100"
                      }`}
                    >
                      {challengeIsFeatured && (
                        <div className="bg-gradient-to-r from-[#2F8F6B] to-[#0F3D2E] px-4 py-1.5 flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <Flame className="w-3.5 h-3.5 text-amber-300" />
                            <span className="text-white text-xs font-bold">
                              {challenge.is_pinned ? "Pinned by admin" : "Featured challenge"}
                            </span>
                          </div>
                          {!challenge.is_pinned && featuredChallenge && (
                            <span className="text-[#A8D5BF] text-[10px] font-medium">
                              Score: {featuredChallenge.activity_score}
                            </span>
                          )}
                        </div>
                      )}
                      <div className="flex flex-col sm:flex-row">
                        <div className="relative sm:w-48 h-40 sm:h-auto flex-shrink-0">
                          <img
                            src={challenge.banner_url || "https://images.unsplash.com/photo-1759503407810-f0402fd9f237?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=600"}
                            alt={challenge.title}
                            className="w-full h-full object-cover"
                            loading="lazy"
                            decoding="async"
                          />
                          {daysLeft <= 7 && (
                            <div
                              className={`absolute top-2 left-2 text-white text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                                daysLeft <= 3 ? "bg-red-500" : "bg-amber-500"
                              }`}
                            >
                              <Clock className="w-3 h-3" />
                              {daysLeft}d left
                            </div>
                          )}
                        </div>
                        <div className="p-5 flex-1">
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${categoryColor}`}>
                                  {challenge.category || "General"}
                                </span>
                                <span className="text-xs text-gray-400">{challenge.difficulty}</span>
                                {activeTab === "joined" && (
                                  <span className="text-xs px-2 py-0.5 rounded-full bg-gray-50 text-gray-700 border border-gray-200">
                                    {isCompleted ? "Completed" : daysLeft === 0 ? "Expired" : "Active"}
                                  </span>
                                )}
                              </div>
                              <h3 className="font-[Manrope] font-bold text-[#0F3D2E] text-lg">{challenge.title}</h3>
                              {challengeIsFeatured && !challenge.is_pinned && (
                                <p className="text-xs text-gray-500 mt-1">Why featured: highest community activity this week.</p>
                              )}
                            </div>
                            <div className="text-right flex-shrink-0">
                              <div className="text-sm font-bold text-[#2F8F6B] flex items-center gap-1">
                                <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                                +{challenge.points_reward} pts
                              </div>
                            </div>
                          </div>
                          <p className="text-sm text-gray-500 leading-relaxed mb-3">{challenge.description}</p>
                          <div className="flex items-center gap-4 text-xs text-gray-500 mb-4">
                            <span className="flex items-center gap-1">
                              <Users className="w-3.5 h-3.5" />
                              {challenge.participant_count.toLocaleString()} participants
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5" />
                              {daysLeft} days remaining
                            </span>
                          </div>
                          <div className="flex gap-2">
                            {isCompleted ? (
                              <div className="flex-1 py-2 rounded-xl text-sm font-semibold bg-emerald-100 text-emerald-700 flex items-center justify-center gap-1.5">
                                <CheckCircle className="w-4 h-4" /> Completed
                              </div>
                            ) : isJoined ? (
                              <>
                                <button
                                  onClick={() => handleOpenSubmissionModal(challenge)}
                                  disabled={!user}
                                  className="flex-1 py-2 rounded-xl text-sm font-semibold bg-[#f5a623] text-[#1a3a2a] hover:bg-[#d4891f] transition-colors disabled:opacity-50"
                                >
                                  <span className="flex items-center justify-center gap-1.5">
                                    <Camera className="w-4 h-4" /> Continue
                                  </span>
                                </button>
                                <button
                                  onClick={() => handleJoin(challenge.id)}
                                  disabled={!user || joiningId === challenge.id}
                                  className="px-3 py-2 rounded-xl border border-gray-200 text-gray-500 hover:border-red-300 hover:text-red-500 transition-colors text-sm"
                                >
                                  {joiningId === challenge.id ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                  ) : (
                                    "Leave"
                                  )}
                                </button>
                              </>
                            ) : (
                              <button
                                onClick={() => handleJoin(challenge.id)}
                                disabled={!user || joiningId === challenge.id}
                                className="flex-1 py-2 rounded-xl text-sm font-semibold bg-[#0F3D2E] text-white hover:bg-[#2F8F6B] transition-colors disabled:opacity-50"
                              >
                                {joiningId === challenge.id ? (
                                  <span className="flex items-center justify-center gap-1.5">
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                  </span>
                                ) : (
                                  <span className="flex items-center justify-center gap-1.5">
                                    <Plus className="w-4 h-4" /> Join Challenge
                                  </span>
                                )}
                              </button>
                            )}
                            <button
                              onClick={() => setSelectedChallenge(challenge)}
                              className="px-3 py-2 rounded-xl border border-gray-200 text-gray-500 hover:border-[#2F8F6B]/50 transition-colors"
                              aria-label="View details"
                              title="View details"
                            >
                              <ChevronRight className="w-4 h-4" />
                            </button>
                            <button className="px-3 py-2 rounded-xl border border-gray-200 text-gray-500 hover:border-[#2F8F6B]/50 transition-colors" title="Share">
                              <Share2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Sidebar — leaderboard */}
          <div className="space-y-5">

            {/* Leaderboard */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-center gap-2 mb-4">
                <Trophy className="w-5 h-5 text-amber-500" />
                <div className="flex-1 min-w-0">
                  <h3 className="font-[Manrope] font-bold text-[#0F3D2E]">Global Leaderboard</h3>
                  <p className="text-xs text-gray-400">
                    {lastUpdatedAt ? `Updated ${lastUpdatedAt.toLocaleTimeString()}` : "Updated recently"} · Points earned by completing challenges
                  </p>
                </div>
              </div>
              {leaderboard.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">No leaderboard data yet</p>
              ) : (
                <div className="space-y-3">
                  {leaderboard.map((entry, index) => {
                    const rank = index + 1;
                    const isYou = entry.user_id === userProfileId;
                    return (
                      <div
                        key={entry.user_id}
                        className={`flex items-center gap-3 p-2 rounded-xl transition-colors ${
                          isYou ? "bg-[#E6F4EE] border border-[#2F8F6B]/20" : "hover:bg-gray-50"
                        }`}
                      >
                        <div
                          className={`w-6 text-center text-sm font-bold flex-shrink-0 ${
                            rank === 1 ? "text-amber-500" : rank === 2 ? "text-gray-400" : rank === 3 ? "text-amber-700" : "text-gray-400"
                          }`}
                        >
                          {rank}
                        </div>
                        {entry.avatar_url ? (
                          <img
                            src={entry.avatar_url}
                            alt={entry.name}
                            className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                            loading="lazy"
                            decoding="async"
                          />
                        ) : (
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                            isYou ? "bg-[#2F8F6B] text-white" : "bg-[#E6F4EE] text-[#0F3D2E]"
                          }`}>
                            {getInitials(entry.name)}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1">
                            <p className="text-sm font-semibold text-[#0F3D2E] truncate">{entry.name}</p>
                            {isYou && <span className="text-xs text-[#2F8F6B] font-medium">(You)</span>}
                          </div>
                          <p className="text-xs text-gray-400">{entry.location || "Unknown"} · {entry.missions_completed} missions</p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-sm font-bold text-[#0F3D2E]">{entry.total_points.toLocaleString()}</p>
                          <p className="text-xs text-gray-400">pts</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              <button className="w-full mt-3 text-sm font-medium text-[#2F8F6B] hover:text-[#0F3D2E] py-2 transition-colors flex items-center justify-center gap-1">
                Full Leaderboard <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* My challenge summary */}
            {user && (
              <div className="bg-[#0F3D2E] rounded-2xl p-5 text-white">
                <div className="flex items-center gap-2 mb-4">
                  <Award className="w-5 h-5 text-[#6DD4A8]" />
                  <span className="font-semibold">My Challenge Stats</span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/10 rounded-xl p-3 text-center">
                    <div className="text-2xl font-[Manrope] font-bold text-white">{userStats.activeChallenges}</div>
                    <div className="text-[#A8D5BF] text-xs mt-0.5">Active</div>
                  </div>
                  <div className="bg-white/10 rounded-xl p-3 text-center">
                    <div className="text-2xl font-[Manrope] font-bold text-white">{userStats.completedChallenges}</div>
                    <div className="text-[#A8D5BF] text-xs mt-0.5">Completed</div>
                  </div>
                  <div className="bg-white/10 rounded-xl p-3 text-center">
                    <div className="text-2xl font-[Manrope] font-bold text-[#6DD4A8]">{userStats.totalPoints.toLocaleString()}</div>
                    <div className="text-[#A8D5BF] text-xs mt-0.5">Challenge pts</div>
                  </div>
                  <div className="bg-white/10 rounded-xl p-3 text-center">
                    <div className="text-2xl font-[Manrope] font-bold text-white">#{userRank || "-"}</div>
                    <div className="text-[#A8D5BF] text-xs mt-0.5">Global rank</div>
                  </div>
                </div>
                {pointsToNext && userRank && userRank > 1 && (
                  <div className="mt-4 flex items-center gap-2 bg-white/10 rounded-xl p-3">
                    <ArrowUp className="w-4 h-4 text-[#6DD4A8]" />
                    <p className="text-[#A8D5BF] text-xs">
                      You're <span className="text-white font-semibold">{pointsToNext} points</span> away from rank #{userRank - 1}!
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Trending skills */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="w-5 h-5 text-[#2F8F6B]" />
                <h3 className="font-[Manrope] font-bold text-[#0F3D2E]">Trending Skills</h3>
              </div>
              <div className="space-y-2.5">
                {[
                  { skill: "Urban Farming", count: 4200, delta: "+12%" },
                  { skill: "Solar Installation", count: 3100, delta: "+8%" },
                  { skill: "GIS Mapping", count: 2800, delta: "+24%" },
                  { skill: "Composting", count: 2400, delta: "+5%" },
                  { skill: "Community Organising", count: 1900, delta: "+18%" },
                ].map((item) => (
                  <div key={item.skill} className="flex items-center justify-between">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <span className="text-sm text-gray-700 truncate">{item.skill}</span>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <div className="h-1.5 w-16 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#2F8F6B] rounded-full"
                          style={{ width: `${(item.count / 4200) * 100}%` }}
                        />
                      </div>
                      <span className="text-xs font-semibold text-[#2F8F6B] w-10 text-right">{item.delta}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Challenge details drawer */}
      {selectedChallenge && (
        <div className="fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-black/30"
            onClick={() => setSelectedChallenge(null)}
            role="button"
            aria-label="Close challenge details"
          />
          <div className="absolute right-0 top-0 h-full w-full sm:w-[460px] bg-white shadow-2xl border-l border-gray-100 overflow-y-auto">
            <div className="p-5 border-b border-gray-100">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Challenge details</p>
                  <h2 className="font-[Manrope] font-bold text-[#0F3D2E] text-xl mt-1 truncate">
                    {selectedChallenge.title}
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">
                    {(selectedChallenge.category ?? "General")} · {(selectedChallenge.difficulty ?? "Beginner")}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedChallenge(null)}
                  className="px-3 py-1.5 rounded-xl border border-gray-200 text-gray-600 hover:border-gray-300"
                >
                  Close
                </button>
              </div>
            </div>

            <div className="p-5 space-y-5">
              <div className="rounded-2xl overflow-hidden border border-gray-100">
                <img
                  src={
                    selectedChallenge.banner_url ||
                    "https://images.unsplash.com/photo-1759503407810-f0402fd9f237?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=900"
                  }
                  alt={selectedChallenge.title}
                  className="w-full h-44 object-cover"
                  loading="lazy"
                  decoding="async"
                />
              </div>

              <div>
                <p className="text-sm text-gray-700 leading-relaxed">{selectedChallenge.description}</p>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="bg-[#F9FDFB] border border-gray-100 rounded-2xl p-3">
                  <p className="text-xs text-gray-400">Participants</p>
                  <p className="text-sm font-bold text-[#0F3D2E] mt-0.5">
                    {selectedChallenge.participant_count.toLocaleString()}
                  </p>
                </div>
                <div className="bg-[#F9FDFB] border border-gray-100 rounded-2xl p-3">
                  <p className="text-xs text-gray-400">Time left</p>
                  <p className="text-sm font-bold text-[#0F3D2E] mt-0.5">
                    {getDaysRemaining(selectedChallenge.deadline)}d
                  </p>
                </div>
                <div className="bg-[#F9FDFB] border border-gray-100 rounded-2xl p-3">
                  <p className="text-xs text-gray-400">Reward</p>
                  <p className="text-sm font-bold text-[#2F8F6B] mt-0.5">+{selectedChallenge.points_reward} pts</p>
                </div>
              </div>

              <div className="bg-white border border-gray-100 rounded-2xl p-4">
                <p className="text-sm font-semibold text-[#0F3D2E]">How to complete</p>
                <ul className="mt-2 space-y-2 text-sm text-gray-600">
                  <li className="flex gap-2">
                    <span className="text-[#2F8F6B] font-bold">1.</span>
                    Do the action in real life (safely, locally, and respectfully).
                  </li>
                  <li className="flex gap-2">
                    <span className="text-[#2F8F6B] font-bold">2.</span>
                    Upload a proof photo and optional reflection.
                  </li>
                  <li className="flex gap-2">
                    <span className="text-[#2F8F6B] font-bold">3.</span>
                    Earn points and show up on the community feed + leaderboard.
                  </li>
                </ul>
              </div>

              <div className="flex gap-2">
                {(() => {
                  const status = getChallengeStatus(selectedChallenge.id);
                  const isJoined = status !== "not-joined";
                  const isCompleted = status === "completed";

                  if (isCompleted) {
                    return (
                      <div className="flex-1 py-2 rounded-xl text-sm font-semibold bg-emerald-100 text-emerald-700 flex items-center justify-center gap-1.5">
                        <CheckCircle className="w-4 h-4" /> Completed
                      </div>
                    );
                  }

                  if (isJoined) {
                    return (
                      <>
                        <button
                          onClick={() => handleOpenSubmissionModal(selectedChallenge)}
                          disabled={!user}
                          className="flex-1 py-2 rounded-xl text-sm font-semibold bg-[#f5a623] text-[#1a3a2a] hover:bg-[#d4891f] transition-colors disabled:opacity-50"
                        >
                          <span className="flex items-center justify-center gap-1.5">
                            <Camera className="w-4 h-4" /> Continue
                          </span>
                        </button>
                        <button
                          onClick={() => handleJoin(selectedChallenge.id)}
                          disabled={!user || joiningId === selectedChallenge.id}
                          className="px-3 py-2 rounded-xl border border-gray-200 text-gray-500 hover:border-red-300 hover:text-red-500 transition-colors text-sm"
                        >
                          {joiningId === selectedChallenge.id ? <Loader2 className="w-4 h-4 animate-spin" /> : "Leave"}
                        </button>
                      </>
                    );
                  }

                  return (
                    <button
                      onClick={() => handleJoin(selectedChallenge.id)}
                      disabled={!user || joiningId === selectedChallenge.id}
                      className="flex-1 py-2 rounded-xl text-sm font-semibold bg-[#0F3D2E] text-white hover:bg-[#2F8F6B] transition-colors disabled:opacity-50"
                    >
                      {joiningId === selectedChallenge.id ? (
                        <span className="flex items-center justify-center gap-1.5">
                          <Loader2 className="w-4 h-4 animate-spin" />
                        </span>
                      ) : (
                        <span className="flex items-center justify-center gap-1.5">
                          <Plus className="w-4 h-4" /> Join Challenge
                        </span>
                      )}
                    </button>
                  );
                })()}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
