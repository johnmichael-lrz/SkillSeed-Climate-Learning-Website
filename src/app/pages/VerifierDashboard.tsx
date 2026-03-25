import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router';
import { Loader2 } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { getCurrentProfile } from '../utils/matchService';
import { supabase } from '../utils/supabase';
import {
  fetchPendingSubmissions,
  verifySubmission,
  rejectSubmission
} from '../utils/questService';
import type { Profile, QuestProgressWithDetails } from '../types/database';
import { toast } from 'sonner';

export function VerifierDashboard() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  // State
  const [profile, setProfile] = useState<Profile | null>(null);
  const [submissions, setSubmissions] = useState<QuestProgressWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  // Load data
  useEffect(() => {
    if (authLoading) return;

    async function loadData() {
      setLoading(true);
      try {
        if (!user) {
          navigate('/auth');
          return;
        }

        const profileData = await getCurrentProfile();
        if (!profileData?.id || !profileData.is_verifier) {
          toast.error('Access denied. Verifier privileges required.');
          navigate('/hands-on');
          return;
        }

        setProfile(profileData);

        const submissionsData = await fetchPendingSubmissions();
        setSubmissions(submissionsData);
      } catch (err) {
        console.error('Error loading submissions:', err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [user, authLoading, navigate]);

  // Handle verify
  const handleVerify = async (submission: QuestProgressWithDetails) => {
    if (!profile?.id) return;

    setProcessingId(submission.id);
    try {
      await verifySubmission(
        submission.id,
        submission.user_id,
        submission.quest_id,
        profile.id
      );
      toast.success('Submission verified and certificate awarded!');
      setSubmissions(prev => prev.filter(s => s.id !== submission.id));
    } catch (err) {
      console.error('Error verifying:', err);
      toast.error('Failed to verify submission.');
    } finally {
      setProcessingId(null);
    }
  };

  // Handle reject
  const handleReject = async (submission: QuestProgressWithDetails) => {
    const reason = window.prompt('Rejection reason (will be shown to user):');
    if (!reason) return;

    setProcessingId(submission.id);
    try {
      await rejectSubmission(
        submission.id,
        reason,
        profile.id,
        submission.user_id,
        submission.quest_id
      );
      toast.success('Submission rejected with feedback.');
      setSubmissions(prev => prev.filter(s => s.id !== submission.id));
    } catch (err) {
      console.error('Error rejecting:', err);
      toast.error('Failed to reject submission.');
    } finally {
      setProcessingId(null);
    }
  };

  // Loading state
  if (loading || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-[#2F8F6B]" />
          <p className="text-gray-500">Loading submissions...</p>
        </div>
      </div>
    );
  }

  // Auth guard
  if (!user || !profile?.is_verifier) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-xl font-bold mb-2 text-[#0F3D2E]">Access Denied</h2>
          <p className="mb-4 text-gray-500">
            You need verifier privileges to access this page.
          </p>
          <Link to="/verifier-login" className="text-[#2F8F6B] font-semibold">
            Go to Verifier Login →
          </Link>
        </div>
      </div>
    );
  }

  // Sign out handler
  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/verifier-login');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-[#1a3a2a] px-8 py-6">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-white font-bold text-lg">SkillSeed</span>
              <span className="bg-green-500 text-white text-xs px-2 py-0.5 rounded-full">
                Verifier Portal
              </span>
            </div>
            <p className="text-green-300 text-sm">
              {submissions.length} submission{submissions.length !== 1 ? 's' : ''} awaiting review
            </p>
          </div>
          <button
            onClick={handleSignOut}
            className="border border-green-500 text-green-300 text-xs px-4 py-2 rounded-full hover:bg-green-800 transition"
          >
            Sign Out
          </button>
        </div>
      </div>

      {/* Queue */}
      <div className="max-w-4xl mx-auto px-8 py-10">

        {submissions.length === 0 ? (
          <div className="text-center py-24">
            <p className="text-5xl mb-4">🎉</p>
            <p className="text-gray-500 font-medium text-lg">
              All caught up!
            </p>
            <p className="text-gray-400 text-sm mt-1">
              No submissions pending review.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            {submissions.map(sub => {
              const questData = sub.quests as unknown as {
                title?: string;
                tier?: string;
                certificate_name?: string;
                badge_name?: string;
                description?: string;
              } | undefined;
              const profileData = sub.profiles as unknown as {
                name?: string;
                avatar_url?: string;
                location?: string;
              } | undefined;

              return (
                <div key={sub.id}
                  className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">

                  {/* User + quest info */}
                  <div className="flex items-start justify-between mb-5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center font-bold text-green-700">
                        {profileData?.name?.charAt(0) || '?'}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 text-sm">
                          {profileData?.name || 'Unknown User'}
                        </p>
                        <p className="text-xs text-gray-400">
                          {profileData?.location || 'Unknown location'} · Submitted{' '}
                          {sub.submitted_at
                            ? new Date(sub.submitted_at).toLocaleDateString('en-PH', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric'
                              })
                            : 'N/A'}
                        </p>
                      </div>
                    </div>
                    <span className={`text-xs px-3 py-1 rounded-full font-medium ${
                      questData?.tier === 'advanced'
                        ? 'bg-yellow-50 text-yellow-700'
                        : 'bg-green-50 text-green-700'
                    }`}>
                      {questData?.tier === 'advanced' ? '🏆' : '🌱'}{' '}
                      {questData?.title || 'Unknown Quest'}
                    </span>
                  </div>

                  {/* AI Screening Result */}
                  {sub.ai_confidence !== null && sub.ai_confidence !== undefined ? (
                    <div className={`rounded-2xl p-4 mb-5 border ${
                      sub.ai_recommendation === 'approve'
                        ? 'bg-green-50 border-green-200'
                        : sub.ai_recommendation === 'reject'
                        ? 'bg-red-50 border-red-200'
                        : 'bg-yellow-50 border-yellow-200'
                    }`}>
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-xs font-semibold text-gray-700">
                          🤖 AI Pre-screening Result
                        </p>
                        <div className="flex items-center gap-2">
                          <div className="w-28 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${
                                sub.ai_confidence >= 70
                                  ? 'bg-green-500'
                                  : sub.ai_confidence >= 40
                                  ? 'bg-yellow-400'
                                  : 'bg-red-400'
                              }`}
                              style={{ width: `${sub.ai_confidence}%` }}
                            />
                          </div>
                          <span className="text-xs font-bold text-gray-700">
                            {sub.ai_confidence}%
                          </span>
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                            sub.ai_recommendation === 'approve'
                              ? 'bg-green-200 text-green-800'
                              : sub.ai_recommendation === 'reject'
                              ? 'bg-red-200 text-red-800'
                              : 'bg-yellow-200 text-yellow-800'
                          }`}>
                            {sub.ai_recommendation === 'approve'
                              ? '✓ Recommend Approve'
                              : sub.ai_recommendation === 'reject'
                              ? '✗ Recommend Reject'
                              : '⚠ Needs Review'}
                          </span>
                        </div>
                      </div>
                      <p className="text-xs text-gray-600 leading-relaxed">
                        {sub.ai_reasoning}
                      </p>
                    </div>
                  ) : (
                    <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 mb-5">
                      <p className="text-xs text-gray-400">
                        ⚠ AI screening unavailable — please review manually.
                      </p>
                    </div>
                  )}

                  {/* Photo */}
                  {sub.photo_url && (
                    <div className="mb-5">
                      <p className="text-xs font-medium text-gray-500 mb-2">
                        Proof Photo
                      </p>
                      <img
                        src={sub.photo_url}
                        className="w-full h-56 object-cover rounded-xl"
                        alt="Submission proof"
                      />
                    </div>
                  )}

                  {/* Reflection */}
                  <div className="mb-5">
                    <p className="text-xs font-medium text-gray-500 mb-2">
                      Reflection
                    </p>
                    <p className="text-sm text-gray-700 bg-gray-50 rounded-xl p-4 leading-relaxed">
                      "{sub.reflection}"
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3">
                    <button
                      onClick={() => handleVerify(sub)}
                      disabled={processingId === sub.id}
                      className="flex-1 bg-[#1a3a2a] text-white text-sm py-3 rounded-xl hover:bg-green-900 transition font-medium disabled:opacity-50"
                    >
                      {processingId === sub.id ? (
                        <span className="flex items-center justify-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Processing...
                        </span>
                      ) : (
                        <>✓ Verify & Award {questData?.tier === 'advanced' ? 'Certificate' : 'Badge'}</>
                      )}
                    </button>
                    <button
                      onClick={() => handleReject(sub)}
                      disabled={processingId === sub.id}
                      className="flex-1 border border-red-200 text-red-500 text-sm py-3 rounded-xl hover:bg-red-50 transition font-medium disabled:opacity-50"
                    >
                      ✗ Reject with Feedback
                    </button>
                  </div>

                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default VerifierDashboard;
