import { useMemo, useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router';
import { BookOpen, Filter, Search, ShieldCheck, Sparkles, RefreshCw, AlertTriangle, Leaf } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useDemoMode } from '../hooks/useDemoMode';
import { getCurrentProfile } from '../utils/matchService';
import { 
  fetchAllQuests, 
  fetchUserQuestProgress,
  fetchUserBadges,
  fetchQuestStats,
  startQuest
} from '../utils/questService';
import { QuestCard } from '../components/QuestCard';
import { GridSkeleton } from '../components/ui/loading-skeleton';
import { EmptyState } from '../components/ui/empty-state';
import type { Profile, Quest, QuestProgress } from '../types/database';

type TabType = 'beginner' | 'advanced' | 'my-quests';

// ============================================================================
// Skeleton Components
// ============================================================================

function QuestCardSkeleton() {
  return (
    <div className="bg-white dark:bg-[#132B23] rounded-xl border border-slate-200 dark:border-[#1E3B34] overflow-hidden animate-pulse">
      <div className="h-24 bg-slate-100 dark:bg-[#1E3B34]" />
      <div className="p-4">
        <div className="flex gap-2 mb-3">
          <div className="h-4 w-16 bg-slate-100 dark:bg-[#1E3B34] rounded" />
          <div className="h-4 w-20 bg-slate-100 dark:bg-[#1E3B34] rounded" />
        </div>
        <div className="h-4 w-3/4 bg-slate-100 dark:bg-[#1E3B34] rounded mb-2" />
        <div className="h-3 w-full bg-slate-100 dark:bg-[#1E3B34] rounded mb-3" />
        <div className="h-3 w-1/2 bg-slate-100 dark:bg-[#1E3B34] rounded mb-4" />
        <div className="h-9 w-full bg-slate-100 dark:bg-[#1E3B34] rounded-lg" />
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

function FilterBarSkeleton() {
  return (
    <div className="bg-white dark:bg-[#132B23] rounded-xl border border-slate-200 dark:border-[#1E3B34] p-4 animate-pulse">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 h-10 bg-slate-100 dark:bg-[#1E3B34] rounded-lg" />
        <div className="h-10 w-32 bg-slate-100 dark:bg-[#1E3B34] rounded-lg" />
        <div className="h-10 w-28 bg-slate-100 dark:bg-[#1E3B34] rounded-lg" />
      </div>
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function HandsOnQuests() {
  const { user, loading: authLoading } = useAuth();
  const { demoMode } = useDemoMode();
  const navigate = useNavigate();

  // State
  const [profile, setProfile] = useState<Profile | null>(null);
  const [quests, setQuests] = useState<Quest[]>([]);
  const [progressMap, setProgressMap] = useState<Record<string, QuestProgress>>({});
  const [userBadgeCount, setUserBadgeCount] = useState(0);
  const [stats, setStats] = useState({ beginnerCount: 0, advancedCount: 0 });
  const [activeTab, setActiveTab] = useState<TabType>('beginner');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'not_started' | 'in_progress' | 'submitted' | 'verified' | 'rejected'>('all');
  const [sortBy, setSortBy] = useState<'recommended' | 'time' | 'points'>('recommended');
  const [showFilters, setShowFilters] = useState(false);

  // Fetch data
  useEffect(() => {
    if (authLoading) return;

    async function loadData() {
      setLoading(true);
      setError(null);
      try {
        // Fetch quests and stats (always available)
        const [questsData, statsData] = await Promise.all([
          fetchAllQuests(),
          fetchQuestStats()
        ]);
        setQuests(questsData);
        setStats(statsData);

        // Fetch user-specific data if logged in
        if (user) {
          const profileData = await getCurrentProfile();
          if (profileData?.id) {
            setProfile(profileData);
            
            const [progressData, badgesData] = await Promise.all([
              fetchUserQuestProgress(profileData.id),
              fetchUserBadges(profileData.id)
            ]);

            // Build progress map
            const pMap: Record<string, QuestProgress> = {};
            progressData.forEach(p => {
              pMap[p.quest_id] = p;
            });
            setProgressMap(pMap);
            setUserBadgeCount(badgesData.length);
          }
        }
      } catch (err) {
        console.error('Error loading quests:', err);
        setError('Failed to load quests. Please try again.');
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [user, authLoading]);

  const progressList = useMemo(() => Object.values(progressMap ?? {}), [progressMap]);
  const completedCount = useMemo(
    () => progressList.filter((p) => p.status === 'verified').length,
    [progressList]
  );
  const inProgressCount = useMemo(
    () => progressList.filter((p) => p.status === 'in_progress').length,
    [progressList]
  );
  const pendingCount = useMemo(
    () => progressList.filter((p) => p.status === 'submitted').length,
    [progressList]
  );
  const needsResubmissionCount = useMemo(
    () => progressList.filter((p) => p.status === 'rejected').length,
    [progressList]
  );

  // Handle starting a quest
  const handleStartQuest = async (quest: Quest) => {
    if (!user) {
      if (demoMode) {
        navigate(`/quests/${quest.id}`);
      } else {
        navigate('/auth');
      }
      return;
    }

    if (!profile?.id) {
      console.error('No profile found');
      return;
    }

    // Start quest if not already started
    const existing = progressMap[quest.id];
    if (!existing) {
      await startQuest(quest.id, profile.id);
    }

    // Navigate to quest detail
    navigate(`/quests/${quest.id}`);
  };

  // Filter quests by tab
  const baseQuests = activeTab === 'my-quests'
    ? quests.filter(q => progressMap[q.id])
    : quests.filter(q => q.tier === activeTab);

  const filteredQuests = baseQuests
    .filter((q) => {
      if (!query) return true;
      const hay = `${q.title} ${(q.description ?? '')} ${(q.category ?? '')}`.toLowerCase();
      return hay.includes(query.toLowerCase());
    })
    .filter((q) => {
      if (statusFilter === 'all') return true;
      const status = progressMap[q.id]?.status ?? 'not_started';
      return status === statusFilter;
    })
    .sort((a, b) => {
      const aProgress = progressMap[a.id];
      const bProgress = progressMap[b.id];

      if (sortBy === 'points') return (b.points_reward ?? 0) - (a.points_reward ?? 0);
      if (sortBy === 'time') return (a.estimated_days ?? 0) - (b.estimated_days ?? 0);

      // recommended: in-progress first, then rejected, then shortest time, then higher points.
      const rank = (p?: QuestProgress) => {
        if (!p) return 3;
        if (p.status === 'in_progress') return 0;
        if (p.status === 'rejected') return 1;
        if (p.status === 'submitted') return 2;
        if (p.status === 'verified') return 4;
        return 3;
      };
      const r = rank(aProgress) - rank(bProgress);
      if (r !== 0) return r;
      const t = (a.estimated_days ?? 0) - (b.estimated_days ?? 0);
      if (t !== 0) return t;
      return (b.points_reward ?? 0) - (a.points_reward ?? 0);
    });

  // My quests with progress
  const myQuestsWithProgress = filteredQuests.map(q => ({
    quest: q,
    progress: progressMap[q.id] ?? null
  }));

  const hasActiveFilters = query !== '' || statusFilter !== 'all' || sortBy !== 'recommended';

  function clearAllFilters() {
    setQuery('');
    setStatusFilter('all');
    setSortBy('recommended');
  }

  // ══════════════════════════════════════════════════════════════════════════
  // Loading State
  // ══════════════════════════════════════════════════════════════════════════
  if (loading || authLoading) {
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
              <QuestCardSkeleton key={i} />
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
                Hands-on Learning
              </p>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white" style={{ fontFamily: "'Manrope', sans-serif" }}>
                Learn by Doing
              </h1>
              <p className="text-sm text-slate-600 dark:text-[#94C8AF] mt-1">
                Complete real-world quests, earn badges, and build a verified record of climate action.
              </p>
            </div>
            {/* Verifier link (if user is verifier) */}
            {profile?.is_verifier && (
              <Link
                to="/verifier"
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-medium rounded-lg border border-slate-200 dark:border-[#1E3B34] bg-white dark:bg-transparent text-slate-700 dark:text-[#BEEBD7] hover:bg-slate-50 dark:hover:bg-[#1E3B34] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2F8F6B] whitespace-nowrap"
              >
                <ShieldCheck className="w-4 h-4" />
                Verifier Dashboard
              </Link>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-5">
        {/* ─────────────────────────────────────────────────────────────────────
            KPI Strip (matches Missions pattern)
        ───────────────────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-3 gap-3">
          <button
            onClick={() => setActiveTab('beginner')}
            className={`text-left bg-white dark:bg-[#132B23] rounded-xl border p-4 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2F8F6B] ${
              activeTab === 'beginner' 
                ? 'border-[#2F8F6B] dark:border-[#6DD4A8]' 
                : 'border-slate-200 dark:border-[#1E3B34] hover:border-[#2F8F6B]/50'
            }`}
          >
            <p className="text-xs text-slate-500 dark:text-[#94C8AF] font-medium mb-1">Beginner Quests</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.beginnerCount}</p>
          </button>
          <button
            onClick={() => setActiveTab('advanced')}
            className={`text-left bg-white dark:bg-[#132B23] rounded-xl border p-4 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 ${
              activeTab === 'advanced' 
                ? 'border-amber-400 dark:border-amber-500' 
                : 'border-slate-200 dark:border-[#1E3B34] hover:border-amber-300'
            }`}
          >
            <p className="text-xs text-slate-500 dark:text-[#94C8AF] font-medium mb-1">Advanced Quests</p>
            <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{stats.advancedCount}</p>
          </button>
          {user ? (
            <button
              onClick={() => setActiveTab('my-quests')}
              className={`text-left bg-white dark:bg-[#132B23] rounded-xl border p-4 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2F8F6B] ${
                activeTab === 'my-quests' 
                  ? 'border-[#2F8F6B] dark:border-[#6DD4A8]' 
                  : 'border-slate-200 dark:border-[#1E3B34] hover:border-[#2F8F6B]/50'
              }`}
            >
              <p className="text-xs text-slate-500 dark:text-[#94C8AF] font-medium mb-1 flex items-center gap-1">
                My Progress
                {needsResubmissionCount > 0 && (
                  <span className="inline-flex items-center gap-0.5 text-amber-600 dark:text-amber-400">
                    <Sparkles className="w-3 h-3" />
                  </span>
                )}
              </p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">
                {completedCount}<span className="text-sm font-normal text-slate-400 dark:text-[#6B8F7F]">/{inProgressCount + completedCount + pendingCount}</span>
              </p>
            </button>
          ) : (
            <div className="bg-white dark:bg-[#132B23] rounded-xl border border-slate-200 dark:border-[#1E3B34] p-4">
              <p className="text-xs text-slate-500 dark:text-[#94C8AF] font-medium mb-1">Badges Earned</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{userBadgeCount}</p>
            </div>
          )}
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
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search quests, skills, categories..."
                className="w-full min-h-[40px] pl-10 pr-4 py-2 border border-slate-200 dark:border-[#1E3B34] bg-white dark:bg-[#0D1F18] rounded-lg text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2F8F6B]/30 focus:border-[#2F8F6B] transition-all text-slate-900 dark:text-white"
              />
            </div>
            {/* Filters toggle */}
            <button
              onClick={() => setShowFilters((v) => !v)}
              className="min-h-[40px] px-4 py-2 rounded-lg border border-slate-200 dark:border-[#1E3B34] text-sm font-medium text-slate-700 dark:text-[#BEEBD7] hover:bg-slate-50 dark:hover:bg-[#1E3B34] transition-colors inline-flex items-center gap-2"
            >
              <Filter className="w-4 h-4" />
              Filters
            </button>
            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'recommended' | 'time' | 'points')}
              className="min-h-[40px] px-3 py-2 border border-slate-200 dark:border-[#1E3B34] rounded-lg text-sm bg-white dark:bg-[#0D1F18] text-slate-700 dark:text-[#BEEBD7] focus:outline-none focus:ring-2 focus:ring-[#2F8F6B]/30"
              aria-label="Sort quests"
            >
              <option value="recommended">Recommended</option>
              <option value="time">Shortest first</option>
              <option value="points">Most points</option>
            </select>
          </div>

          {/* Expanded filters */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t border-slate-200 dark:border-[#1E3B34] flex flex-col sm:flex-row gap-3">
              <select
                value={statusFilter}
                onChange={(e) =>
                  setStatusFilter(
                    e.target.value as 'all' | 'not_started' | 'in_progress' | 'submitted' | 'verified' | 'rejected'
                  )
                }
                className="min-h-[40px] px-3 py-2 border border-slate-200 dark:border-[#1E3B34] rounded-lg text-sm bg-white dark:bg-[#0D1F18] text-slate-700 dark:text-[#BEEBD7] focus:outline-none focus:ring-2 focus:ring-[#2F8F6B]/30"
                aria-label="Status filter"
              >
                <option value="all">All statuses</option>
                <option value="not_started">Not started</option>
                <option value="in_progress">In progress</option>
                <option value="submitted">Pending review</option>
                <option value="verified">Completed</option>
                <option value="rejected">Needs resubmission</option>
              </select>

              {hasActiveFilters && (
                <button
                  onClick={clearAllFilters}
                  className="min-h-[40px] px-4 py-2 rounded-lg text-sm font-medium text-[#2F8F6B] dark:text-[#6DD4A8] hover:underline"
                >
                  Clear filters
                </button>
              )}
            </div>
          )}
        </div>

        {/* ─────────────────────────────────────────────────────────────────────
            Quest Cards Grid
        ───────────────────────────────────────────────────────────────────── */}
        {filteredQuests.length === 0 ? (
          activeTab === 'my-quests' ? (
            <EmptyState
              icon={Leaf}
              title="No quests started yet"
              description="Start your first quest to begin your climate action journey."
              action={{
                label: "Browse beginner quests",
                onClick: () => setActiveTab('beginner')
              }}
            />
          ) : (
            <EmptyState
              icon={Search}
              title="No quests found"
              description="Try adjusting your search or filters to find what you're looking for."
              action={{
                label: "Clear filters",
                onClick: clearAllFilters
              }}
            />
          )
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {myQuestsWithProgress.map(({ quest, progress }) => (
              <QuestCard
                key={quest.id}
                quest={quest}
                progress={progress}
                onStart={handleStartQuest}
              />
            ))}
          </div>
        )}

        {/* ─────────────────────────────────────────────────────────────────────
            Sign-in prompt for guests
        ──────────────────────────────────��────────────────────────────────── */}
        {!user && (
          <div className="bg-white dark:bg-[#132B23] rounded-xl border border-slate-200 dark:border-[#1E3B34] p-6 text-center">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
              Ready to start learning?
            </h3>
            <p className="text-sm text-slate-600 dark:text-[#94C8AF] mb-5 max-w-md mx-auto">
              Sign in to track your progress, earn badges, and get certified.
            </p>
            <Link
              to="/auth"
              className="inline-flex items-center justify-center min-h-[44px] bg-[#0F3D2E] text-white px-6 py-2.5 rounded-lg text-sm font-semibold hover:bg-[#2F8F6B] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2F8F6B] focus-visible:ring-offset-2"
            >
              Sign In to Start
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

export default HandsOnQuests;
