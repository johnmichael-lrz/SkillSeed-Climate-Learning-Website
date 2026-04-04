import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router";
import { MapPin, Clock, Award, Trophy, Target, Flame, Edit2 } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { getCurrentProfile, withdrawMyPendingApplications } from "../utils/matchService";
import { supabase } from "../utils/supabase";
import { resetMyChallengeSubmissions, deleteMyCreatedChallenges } from "../utils/challengeService";
import { PageSkeleton } from "../components/ui/loading-skeleton";
import { EmptyState } from "../components/ui/empty-state";
import { toast } from "sonner";
import type { Profile } from "../types/database";
import { useShowBlockingFullPageLoader } from "../hooks/useShowBlockingFullPageLoader";

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

/** Matches profile UI: anything not accepted/declined shows as "Pending". */
function isOpenMissionApplication(m: MissionWithProject): boolean {
  const s = (m.status ?? "").trim().toLowerCase();
  return s !== "accepted" && s !== "declined";
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
  const [initialLoadDone, setInitialLoadDone] = useState(false);
  const [resettingCommunityDemo, setResettingCommunityDemo] = useState(false);
  const [withdrawingPendingMissions, setWithdrawingPendingMissions] = useState(false);

  // Derived
  const completedChallenges = challenges.filter(c => c.status === "completed").length;

  // ── Data Fetching ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (!user || authLoading) {
      setLoading(false);
      if (!user) setInitialLoadDone(false);
      return;
    }

    async function fetchAllData() {
      setLoading(true);
      try {
        const profileData = await getCurrentProfile();
        setProfile(profileData);

        // connections.responder_id is auth user id (same as applyToProject / Mission board), not profiles.id
        const authUserId = user.id;
        const profileId = profileData?.id;

        const parallel: Promise<void>[] = [fetchMissions(authUserId)];
        if (profileId) {
          parallel.push(
            fetchChallenges(profileId),
            fetchBadges(profileId),
            fetchLeaderboardRank(profileId),
            fetchStreak(profileId),
          );
        }
        await Promise.all(parallel);
      } catch (err) {
        console.error("Error fetching profile data:", err);
      } finally {
        setInitialLoadDone(true);
        setLoading(false);
      }
    }

    fetchAllData();
  }, [user, authLoading]);

  const showBlockingLoader = useShowBlockingFullPageLoader(
    authLoading || loading,
    initialLoadDone
  );

  // Mission applications (responder_id = Supabase auth user id, not profile row id)
  const fetchMissions = async (authUserId: string): Promise<boolean> => {
    const { data, error } = await supabase
      .from("connections")
      .select("id, status, role, created_at, projects(title, location, duration, focus_area, status, type)")
      .eq("responder_id", authUserId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching missions:", error);
      toast.error("Could not refresh mission list", { description: error.message });
      return false;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    setMissions((data as any) ?? []);
    return true;
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

  const handleWithdrawPendingMissions = async () => {
    if (!user?.id) return;
    const openCount = missions.filter(isOpenMissionApplication).length;
    if (openCount === 0) {
      toast.message("Nothing to withdraw", { description: "No open applications on this list." });
      return;
    }
    const ok = window.confirm(
      `Withdraw all ${openCount} open mission application${openCount === 1 ? "" : "s"}? You can apply again from the mission pages.`,
    );
    if (!ok) return;
    setWithdrawingPendingMissions(true);
    try {
      const { deleted, withdrawnIds } = await withdrawMyPendingApplications(user.id);
      if (deleted === 0) {
        toast.error("No applications were removed", {
          description:
            "Run SQL migration 014_withdraw_my_open_connections_rpc.sql in Supabase, then try again.",
        });
        return;
      }
      setMissions((prev) => prev.filter((m) => !withdrawnIds.includes(m.id)));
      window.dispatchEvent(new Event("skillseed:withdrew-mission-applications"));
      const refreshed = await fetchMissions(user.id);
      toast.success(`Withdrew ${deleted} application${deleted === 1 ? "" : "s"}`);
      if (!refreshed) {
        toast.message("List may be stale", { description: "Refresh the page if rows reappear." });
      }
    } catch (err) {
      console.error("Withdraw pending missions failed:", err);
      const msg = err instanceof Error ? err.message : String(err);
      toast.error("Could not withdraw applications", { description: msg, duration: 12_000 });
    } finally {
      setWithdrawingPendingMissions(false);
    }
  };

  const handleResetCommunityChallengesForDemo = async () => {
    if (!profile?.id) return;
    const ok = window.confirm(
      "Delete community challenges you created, leave finished challenges, and remove your feed posts? You can start a fresh demo on Community afterward.",
    );
    if (!ok) return;
    setResettingCommunityDemo(true);
    try {
      await deleteMyCreatedChallenges(profile.id);
      await resetMyChallengeSubmissions(profile.id);
      await fetchChallenges(profile.id);
      await fetchLeaderboardRank(profile.id);
      await fetchStreak(profile.id);
    } catch (err) {
      console.error("Reset community challenges failed:", err);
      window.alert(
        "Could not reset. Ensure Supabase allows deleting your challenges, challenge_participants, and challenge_submissions.",
      );
    } finally {
      setResettingCommunityDemo(false);
    }
  };

  // ── Loading / Auth Guards ───────────────────────────────────────────────────
  if (showBlockingLoader) {
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
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
          <h2 className="text-lg font-bold text-card-foreground">My Missions</h2>
          {missions.some(isOpenMissionApplication) && user?.id ? (
            <button
              type="button"
              disabled={withdrawingPendingMissions}
              onClick={handleWithdrawPendingMissions}
              title="Remove all pending applications from your profile"
              className="inline-flex items-center justify-center px-3 py-2 rounded-lg text-xs font-semibold border border-slate-200 dark:border-[#1E3B34] bg-white dark:bg-[#132B23] text-slate-700 dark:text-[#BEEBD7] hover:bg-slate-50 dark:hover:bg-[#1E3B34] hover:border-[#2F8F6B]/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2F8F6B]/40 disabled:opacity-50 disabled:pointer-events-none transition-colors min-h-[36px] shrink-0"
            >
              {withdrawingPendingMissions ? "Withdrawing…" : "Withdraw open applications"}
            </button>
          ) : null}
        </div>

        {missions.length === 0 ? (
          <EmptyState
            icon={Target}
            title="No missions yet"
            description="Browse available missions and apply to make an impact."
            action={{
              label: "Browse Missions",
              onClick: () => navigate("/browse")
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
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
          <h2 className="text-lg font-bold text-card-foreground">My Challenges</h2>
          {challenges.length > 0 && profile?.id ? (
            <button
              type="button"
              disabled={resettingCommunityDemo}
              onClick={handleResetCommunityChallengesForDemo}
              title="Leave community challenges and clear feed posts so you can join again"
              className="inline-flex items-center justify-center px-3 py-2 rounded-lg text-xs font-semibold border border-slate-200 dark:border-[#1E3B34] bg-white dark:bg-[#132B23] text-slate-700 dark:text-[#BEEBD7] hover:bg-slate-50 dark:hover:bg-[#1E3B34] hover:border-[#2F8F6B]/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2F8F6B]/40 disabled:opacity-50 disabled:pointer-events-none transition-colors min-h-[36px] shrink-0"
            >
              {resettingCommunityDemo ? "Resetting…" : "Reset for demo"}
            </button>
          ) : null}
        </div>

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
