import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router";
import { MapPin, Clock, Award, Trophy, Target, Flame, Edit2 } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { getCurrentProfile } from "../utils/matchService";
import { supabase } from "../utils/supabase";
import { PageSkeleton } from "../components/ui/loading-skeleton";
import { EmptyState } from "../components/ui/empty-state";
import type { Profile } from "../types/database";

// ─── Types ────────────────────────────────────────────────────────────────────

interface MissionWithProject {
  id: string;
  status: string;
  role: string;
  created_at: string;
  projects: {
    title: string;
    location: string | null;
    duration: string | null;
    focus_area: string[];
    status: string;
    type: string;
  } | null;
}

interface ChallengeParticipantWithChallenge {
  id: string;
  challenge_id: string;
  user_id: string;
  status: string;
  actions_completed: number;
  points_earned: number;
  joined_at: string;
  challenges: {
    title: string;
    category: string | null;
    points_reward: number;
    deadline: string | null;
  } | null;
}

interface UserBadge {
  id: string;
  earned_at: string;
  badges: {
    name: string;
    icon: string;
    description: string | null;
  } | null;
}

// ─── Main Component ────────────────────────────────────────────────────────────

export function ProgressTracker() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  // State
  const [profile, setProfile] = useState<Profile | null>(null);
  const [missions, setMissions] = useState<MissionWithProject[]>([]);
  const [challenges, setChallenges] = useState<ChallengeParticipantWithChallenge[]>([]);
  const [badges, setBadges] = useState<UserBadge[]>([]);
  const [totalPoints, setTotalPoints] = useState(0);
  const [streak, setStreak] = useState(0);
  const [leaderboardRank, setLeaderboardRank] = useState<number | string>("—");
  const [loading, setLoading] = useState(true);

  // Derived
  const completedChallenges = challenges.filter(c => c.status === "completed").length;

  // ── Data Fetching ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (!user || authLoading) {
      setLoading(false);
      return;
    }

    async function fetchAllData() {
      setLoading(true);
      try {
        const profileData = await getCurrentProfile();
        if (!profileData?.id) {
          setLoading(false);
          return;
        }
        setProfile(profileData);

        // Fetch all data in parallel
        await Promise.all([
          fetchMissions(profileData.id),
          fetchChallenges(profileData.id),
          fetchBadges(profileData.id),
          fetchLeaderboardRank(profileData.id),
          fetchStreak(profileData.id),
        ]);
      } catch (err) {
        console.error("Error fetching profile data:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchAllData();
  }, [user, authLoading]);

  // Missions applied to
  const fetchMissions = async (profileId: string) => {
    const { data, error } = await supabase
      .from("connections")
      .select("id, status, role, created_at, projects(title, location, duration, focus_area, status, type)")
      .eq("responder_id", profileId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching missions:", error);
      return;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    setMissions((data as any) ?? []);
  };

  // Challenges — joined and completed
  const fetchChallenges = async (profileId: string) => {
    const { data, error } = await supabase
      .from("challenge_participants")
      .select("*, challenges(title, category, points_reward, deadline)")
      .eq("user_id", profileId)
      .order("joined_at", { ascending: false });

    if (error) {
      console.error("Error fetching challenges:", error);
      return;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    setChallenges((data as any) ?? []);
  };

  // Badges
  const fetchBadges = async (profileId: string) => {
    const { data, error } = await supabase
      .from("user_badges")
      .select("*, badges(name, icon, description)")
      .eq("user_id", profileId)
      .order("earned_at", { ascending: false });

    if (error) {
      // Table may not exist yet — silently ignore
      console.log("Badges table not available:", error.message);
      return;
    }
    setBadges((data as UserBadge[]) ?? []);
  };

  // Leaderboard rank
  const fetchLeaderboardRank = async (profileId: string) => {
    const { data, error } = await supabase
      .from("leaderboard")
      .select("user_id, total_points");

    if (error) {
      console.error("Error fetching leaderboard:", error);
      return;
    }

    const sorted = (data ?? []).sort((a, b) => b.total_points - a.total_points);
    const rank = sorted.findIndex(r => r.user_id === profileId) + 1;
    setLeaderboardRank(rank > 0 ? rank : "—");

    const userRow = sorted.find(r => r.user_id === profileId);
    setTotalPoints(userRow?.total_points ?? 0);
  };

  // Streak — count consecutive days with challenge_submissions
  const fetchStreak = async (profileId: string) => {
    const { data, error } = await supabase
      .from("challenge_submissions")
      .select("created_at")
      .eq("user_id", profileId)
      .order("created_at", { ascending: false });

    if (error) {
      console.log("Submissions table not available:", error.message);
      return;
    }

    // Calculate consecutive days
    let streakCount = 0;
    const current = new Date();
    current.setHours(0, 0, 0, 0);

    const dates = [...new Set(
      data?.map(s => new Date(s.created_at).toDateString())
    )];

    for (const dateStr of dates) {
      const d = new Date(dateStr);
      d.setHours(0, 0, 0, 0);
      const diff = Math.floor((current.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
      if (diff === streakCount) streakCount++;
      else break;
    }
    setStreak(streakCount);
  };

  // ── Loading / Auth Guards ───────────────────────────────────────────────────
  if (authLoading || loading) {
    return <PageSkeleton hasHero={true} />;
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F9FAFB] dark:bg-[#0D1F18] px-4">
        <EmptyState
          icon={Target}
          title="Sign in to continue"
          description="You need to be logged in to view your profile and progress."
          action={{
            label: "Sign in",
            onClick: () => navigate('/auth')
          }}
        />
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[#F9FAFB] dark:bg-[#0D1F18]">

      {/* ══════════════════════════════════════════════════════════════════════
          PROFILE HEADER
          ══════════════════════════════════════════════════════════════════════ */}
      <div className="bg-[linear-gradient(135deg,#0F3D2E_0%,#1A5C43_100%)] w-full px-6 md:px-8 py-10 md:py-12">
        <div className="max-w-4xl mx-auto">

          {/* Top row — avatar + name + edit button */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
            <div className="flex items-center gap-4">

              {/* Avatar */}
              <div className="w-16 h-16 rounded-xl bg-[#2F8F6B] flex items-center justify-center text-white text-2xl font-bold flex-shrink-0 overflow-hidden ring-2 ring-white/20">
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt={profile.name || ""} className="w-full h-full object-cover" />
                ) : (
                  profile?.name?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || "U"
                )}
              </div>

              {/* Name + org + location */}
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-white text-xl sm:text-2xl font-bold">{profile?.name || user?.email}</h1>
                  {profile?.verified && (
                    <span className="bg-[#6DD4A8] text-[#0A2E20] text-xs font-semibold px-2 py-0.5 rounded-lg">Verified</span>
                  )}
                </div>
                {profile?.org_name && (
                  <p className="text-[#BEEBD7] text-sm mt-0.5">{profile.org_name}</p>
                )}
                {profile?.location && (
                  <p className="text-[#94C8AF] text-xs mt-1 flex items-center gap-1">
                    <MapPin className="w-3 h-3" /> {profile.location}
                  </p>
                )}
              </div>
            </div>

            {/* Edit profile button */}
            <button
              onClick={() => navigate("/edit-profile")}
              className="min-h-[40px] border border-[#6DD4A8]/50 text-[#BEEBD7] text-sm font-medium px-4 py-2 rounded-lg hover:bg-white/10 transition-colors inline-flex items-center gap-2 self-start"
            >
              <Edit2 className="w-4 h-4" />
              Edit Profile
            </button>
          </div>

          {/* Bio */}
          {profile?.bio && (
            <p className="text-[#BEEBD7] text-sm leading-relaxed mb-6 max-w-2xl">
              {profile.bio}
            </p>
          )}

          {/* Skills */}
          {profile?.skills && profile.skills.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-6">
              {profile.skills.map(skill => (
                <span key={skill} className="bg-white/10 text-[#BEEBD7] text-xs font-medium px-3 py-1.5 rounded-lg">
                  {skill}
                </span>
              ))}
            </div>
          )}

          {/* Stats row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl px-4 py-3 text-center">
              <p className="text-[#B7C96A] text-xl font-bold">{totalPoints}</p>
              <p className="text-[#BEEBD7] text-xs mt-0.5">Points</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl px-4 py-3 text-center">
              <p className="text-white text-xl font-bold flex items-center justify-center gap-1">
                <Flame className="w-4 h-4 text-orange-400" /> {streak}d
              </p>
              <p className="text-[#BEEBD7] text-xs mt-0.5">Streak</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl px-4 py-3 text-center">
              <p className="text-white text-xl font-bold">#{leaderboardRank}</p>
              <p className="text-[#BEEBD7] text-xs mt-0.5">Global Rank</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl px-4 py-3 text-center">
              <p className="text-white text-xl font-bold">{completedChallenges}</p>
              <p className="text-[#BEEBD7] text-xs mt-0.5">Challenges</p>
            </div>
          </div>

        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          SECTION 1 — My Missions
          ══════════════════════════════════════════════════════════════════════ */}
      <div className="max-w-4xl mx-auto px-6 md:px-8 py-10">
        <h2 className="text-lg font-bold text-card-foreground mb-5">My Missions</h2>

        {missions.length === 0 ? (
          <EmptyState
            icon={Target}
            title="No missions yet"
            description="Browse available missions and apply to make an impact."
            action={{
              label: "Browse Missions",
              onClick: () => navigate("/work")
            }}
          />
        ) : (
          <div className="flex flex-col gap-3">
            {missions.map(mission => (
              <div
                key={mission.id}
                className="bg-white dark:bg-[#132B23] border border-border dark:border-[#1E3B34] rounded-xl px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:shadow-sm transition-shadow"
              >
                <div>
                  <p className="text-sm font-semibold text-card-foreground">
                    {mission.projects?.title || "Untitled Mission"}
                  </p>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground mt-1.5">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {mission.projects?.location || "Remote"}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {mission.projects?.duration || "Flexible"}
                    </span>
                    <span className="capitalize">{mission.role}</span>
                  </div>
                </div>
                <span
                  className={`text-xs px-3 py-1.5 rounded-lg font-semibold self-start sm:self-auto ${
                    mission.status === "accepted"
                      ? "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300"
                      : mission.status === "declined"
                      ? "bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-300"
                      : "bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300"
                  }`}
                >
                  {mission.status === "accepted"
                    ? "Accepted"
                    : mission.status === "declined"
                    ? "Rejected"
                    : "Pending"}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          SECTION 2 — My Challenges
          ══════════════════════════════════════════════════════════════════════ */}
      <div className="max-w-4xl mx-auto px-6 md:px-8 pb-10">
        <h2 className="text-lg font-bold text-card-foreground mb-5">My Challenges</h2>

        {challenges.length === 0 ? (
          <EmptyState
            icon={Trophy}
            title="No challenges joined"
            description="Join challenges to earn points and compete with other climate champions."
            action={{
              label: "Browse Challenges",
              onClick: () => navigate("/community")
            }}
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {challenges.map(cp => (
              <div
                key={cp.id}
                className="bg-white dark:bg-[#132B23] border border-border dark:border-[#1E3B34] rounded-xl p-4 hover:shadow-sm transition-shadow"
              >
                <div className="flex items-start justify-between mb-2">
                  <span className="bg-[#E6F4EE] dark:bg-[#1E3B34] text-[#0F3D2E] dark:text-[#6DD4A8] text-xs font-medium px-2.5 py-1 rounded-lg">
                    {cp.challenges?.category || "General"}
                  </span>
                  <span
                    className={`text-xs font-semibold px-2.5 py-1 rounded-lg ${
                      cp.status === "completed"
                        ? "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300"
                        : "bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300"
                    }`}
                  >
                    {cp.status === "completed" ? "Completed" : "In Progress"}
                  </span>
                </div>
                <p className="text-sm font-semibold text-card-foreground mb-1.5">
                  {cp.challenges?.title || "Untitled Challenge"}
                </p>
                <p className="text-xs text-[#B7C96A] font-semibold">
                  +{cp.points_earned || 0} pts earned
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          SECTION 3 — Badges Earned
          ══════════════════════════════════════════════════════════════════════ */}
      <div className="max-w-4xl mx-auto px-6 md:px-8 pb-16">
        <h2 className="text-lg font-bold text-card-foreground mb-5">Badges Earned</h2>

        {badges.length === 0 ? (
          <EmptyState
            icon={Award}
            title="No badges yet"
            description="Complete challenges and missions to earn badges and build your profile."
          />
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
            {badges.map(ub => (
              <div
                key={ub.id}
                className="bg-white dark:bg-[#132B23] border border-border dark:border-[#1E3B34] rounded-xl p-4 text-center hover:shadow-sm transition-shadow"
              >
                <div className="text-3xl mb-2">{ub.badges?.icon || "🏅"}</div>
                <p className="text-xs font-semibold text-card-foreground">
                  {ub.badges?.name || "Badge"}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                  {ub.badges?.description || ""}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
