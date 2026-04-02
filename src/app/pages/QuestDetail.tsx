import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router';
import { Loader2, ArrowLeft, Upload, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useDemoMode } from '../hooks/useDemoMode';
import { getCurrentProfile } from '../utils/matchService';
import { PageSkeleton } from '../components/ui/loading-skeleton';
import { EmptyState } from '../components/ui/empty-state';
import {
  fetchQuestById,
  fetchQuestProgress,
  startQuest,
  updateQuestStep,
  uploadQuestPhoto,
  awardBadge
} from '../utils/questService';
import { runAiScreening } from '../utils/aiScreening';
import { supabase } from '../utils/supabase';
import { AiCoachPanel } from '../components/AiCoachPanel';
import type { Profile, Quest, QuestProgress } from '../types/database';
import { toast } from 'sonner';

export function QuestDetail() {
  const { questId } = useParams<{ questId: string }>();
  const { user, loading: authLoading } = useAuth();
  const { demoMode } = useDemoMode();
  const navigate = useNavigate();

  // State
  const [profile, setProfile] = useState<Profile | null>(null);
  const [quest, setQuest] = useState<Quest | null>(null);
  const [progress, setProgress] = useState<QuestProgress | null>(null);
  const [loading, setLoading] = useState(true);

  // Submission state
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [reflection, setReflection] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);

  // Load data
  useEffect(() => {
    if (!questId || authLoading) return;

    const currentQuestId = questId; // Capture for async closure

    async function loadData() {
      setLoading(true);
      try {
        // Fetch quest
        const questData = await fetchQuestById(currentQuestId);
        if (!questData) {
          navigate('/hands-on');
          return;
        }
        setQuest(questData);

        // Fetch user data if logged in
        if (user) {
          const profileData = await getCurrentProfile();
          if (profileData?.id) {
            setProfile(profileData);

            // Fetch or create progress
            let progressData = await fetchQuestProgress(currentQuestId, profileData.id);
            if (!progressData) {
              progressData = await startQuest(currentQuestId, profileData.id);
            }
            setProgress(progressData);
          }
        }
      } catch (err) {
        console.error('Error loading quest:', err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [questId, user, authLoading, navigate]);

  // Mark step as complete
  const markStepComplete = async (stepIndex: number) => {
    if (!user) {
      toast.error("Sign in to track progress.");
      navigate("/auth");
      return;
    }
    if (!quest || !profile?.id || !questId) return;

    const newStep = stepIndex + 1;
    await updateQuestStep(questId, profile.id, newStep);
    setProgress(prev => prev ? { ...prev, current_step: newStep } : null);
    toast.success(`Step ${stepIndex + 1} completed!`);
  };

  // Handle photo change
  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle submission
  const handleSubmit = async () => {
    if (!user) {
      toast.error("Sign in to submit proof.");
      navigate("/auth");
      return;
    }
    if (!quest || !profile?.id || !questId || !photoFile) {
      toast.error('Please upload a photo.');
      return;
    }
    if (reflection.trim().length < 50) {
      toast.error('Reflection must be at least 50 characters.');
      return;
    }

    setSubmitting(true);

    try {
      // 1. Upload photo to Supabase Storage
      const photoUrl = await uploadQuestPhoto(profile.id, questId, photoFile);

      // 2. Run AI screening
      toast.loading('Analysing your submission...', { id: 'ai-screen' });
      const aiResult = await runAiScreening(photoUrl, reflection, quest);
      toast.dismiss('ai-screen');

      // 3. Determine auto-approval logic
      // Beginner + AI confidence >= 70 + recommendation = approve → auto verify
      // Advanced → always needs human verifier
      // AI failed → goes to manual review
      const autoVerify = 
        quest.tier === 'beginner' && 
        aiResult !== null && 
        aiResult.confidence >= 70 &&
        aiResult.recommendation === 'approve';

      // 4. Save submission
      // First check if row exists
      const { data: existingProgress } = await supabase
        .from('quest_progress')
        .select('id')
        .eq('quest_id', quest.id)
        .eq('user_id', profile.id)
        .single();

      // Base submission data (without AI fields in case columns don't exist yet)
      // Also clear rejection_reason on resubmit
      const isResubmit = progress?.status === 'rejected';
      const baseData = {
        status: autoVerify ? 'verified' : 'submitted',
        photo_url: photoUrl,
        reflection: reflection.trim(),
        submitted_at: new Date().toISOString(),
        verified_at: autoVerify ? new Date().toISOString() : null,
        rejection_reason: null // clear previous rejection reason
      };

      // Try with AI fields first, fall back to without if columns don't exist
      const dataWithAI = {
        ...baseData,
        ai_confidence: aiResult?.confidence ?? null,
        ai_reasoning: aiResult?.reasoning ?? null,
        ai_recommendation: aiResult?.recommendation ?? null
      };

      if (existingProgress) {
        // Update existing row - try with AI fields first
        let { error: updateError } = await supabase
          .from('quest_progress')
          .update(dataWithAI)
          .eq('id', existingProgress.id);

        // If AI columns don't exist, retry without them
        if (updateError && updateError.message?.includes('column')) {
          console.warn('AI columns may not exist, retrying without them...');
          const { error: retryError } = await supabase
            .from('quest_progress')
            .update(baseData)
            .eq('id', existingProgress.id);
          updateError = retryError;
        }

        if (updateError) {
          console.error('Update error:', updateError);
          throw updateError;
        }
      } else {
        // Insert new row
        const insertDataWithAI = {
          quest_id: quest.id,
          user_id: profile.id,
          current_step: quest.steps?.length ?? 0,
          ...dataWithAI
        };

        let { error: insertError } = await supabase
          .from('quest_progress')
          .insert(insertDataWithAI);

        // If AI columns don't exist, retry without them
        if (insertError && insertError.message?.includes('column')) {
          console.warn('AI columns may not exist, retrying without them...');
          const { error: retryError } = await supabase
            .from('quest_progress')
            .insert({
              quest_id: quest.id,
              user_id: profile.id,
              current_step: quest.steps?.length ?? 0,
              ...baseData
            });
          insertError = retryError;
        }

        if (insertError) {
          console.error('Insert error:', insertError);
          throw insertError;
        }
      }

      // 5. Auto-award badge if beginner + high confidence
      if (autoVerify) {
        await awardBadge(questId, profile.id);
        toast.success('🏅 Badge earned! Submission auto-verified.');
      } else if (isResubmit) {
        toast.success("📬 Resubmitted! Under review again.");
      } else if (quest.tier === 'beginner') {
        toast.success("📬 Submitted! Being reviewed — you'll be notified shortly.");
      } else {
        toast.success('📬 Submitted for verification. Certificate issued after review.');
      }

      navigate('/hands-on');
    } catch (err) {
      console.error('Submission error:', err);
      toast.error('Submission failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Check if all steps are done
  const allStepsDone = quest?.steps
    ? (progress?.current_step ?? 0) >= quest.steps.length
    : false;

  // Loading state
  if (loading || authLoading) {
    return <PageSkeleton hasHero={false} />;
  }

  // Auth guard (allow read-only preview in demo mode)
  if (!user && !demoMode) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F9FAFB] dark:bg-[#0D1F18] px-4">
        <EmptyState
          icon={ArrowLeft}
          title="Sign in to continue"
          description="You need to be logged in to access quests."
          action={{
            label: "Sign in",
            onClick: () => navigate('/auth')
          }}
        />
      </div>
    );
  }

  if (!quest) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F9FAFB] dark:bg-[#0D1F18] px-4">
        <EmptyState
          icon={ArrowLeft}
          title="Quest not found"
          description="This quest may have been removed or does not exist."
          action={{
            label: "Browse quests",
            onClick: () => navigate('/hands-on')
          }}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F9FAFB] dark:bg-[#0D1F18]">
      {/* Back navigation */}
      <div className="bg-[#0F3D2E] px-6 md:px-8 py-4">
        <div className="max-w-7xl mx-auto">
          <button
            onClick={() => navigate('/hands-on')}
            className="flex items-center gap-2 text-[#BEEBD7] text-sm font-medium hover:text-white transition-colors min-h-[44px]"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Quests
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-7xl mx-auto px-6 md:px-8 py-8 md:py-10 flex flex-col lg:flex-row gap-8">
        {/* LEFT — Quest steps */}
        <div className="flex-1 min-w-0">
          {/* Quest header */}
          <div className="mb-8">
            <span className="text-4xl">{quest.badge_icon}</span>
            <h1 className="text-2xl font-bold text-card-foreground mt-3 text-balance">{quest.title}</h1>
            <p className="text-muted-foreground text-sm mt-2 leading-relaxed max-w-xl">{quest.description}</p>
            <div className="flex flex-wrap items-center gap-3 mt-4">
              <span
                className={`text-xs px-3 py-1.5 rounded-lg font-semibold ${
                  quest.tier === 'beginner'
                    ? 'bg-[#E6F4EE] dark:bg-[#1E3B34] text-[#0F3D2E] dark:text-[#6DD4A8]'
                    : 'bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300'
                }`}
              >
                {quest.tier === 'beginner' ? 'Beginner' : 'Advanced'}
              </span>
              <span className="text-xs text-muted-foreground">
                ~{quest.estimated_days} days
              </span>
              <span className="text-xs text-muted-foreground">
                +{quest.points_reward} pts
              </span>
            </div>
          </div>

          {/* Progress indicator */}
          <div className="mb-8 p-4 bg-white dark:bg-[#132B23] rounded-xl border border-border dark:border-[#1E3B34]">
            <div className="flex items-center justify-between text-sm mb-3">
              <span className="font-medium text-card-foreground">Progress</span>
              <span className="text-muted-foreground">
                {progress?.current_step ?? 0} / {quest.steps?.length ?? 0} steps
              </span>
            </div>
            <div className="w-full bg-muted dark:bg-[#0D1F18] rounded-full h-2">
              <div
                className="bg-[#2F8F6B] dark:bg-[#6DD4A8] h-2 rounded-full transition-all duration-500"
                style={{
                  width: `${
                    quest.steps?.length
                      ? ((progress?.current_step ?? 0) / quest.steps.length) * 100
                      : 0
                  }%`
                }}
              />
            </div>
          </div>

          {/* Steps */}
          <div className="flex flex-col gap-3 mb-8">
            {quest.steps?.map((step, index) => {
              const isCompleted = (progress?.current_step ?? 0) > index;
              const isCurrent = (progress?.current_step ?? 0) === index;

              return (
                <div
                  key={step.step}
                  className={`rounded-xl border p-5 transition-all duration-200 ${
                    isCompleted
                      ? 'border-[#2F8F6B]/30 dark:border-[#6DD4A8]/30 bg-[#E6F4EE] dark:bg-[#1E3B34]'
                      : isCurrent
                      ? 'border-[#0F3D2E] dark:border-[#6DD4A8] bg-white dark:bg-[#132B23] shadow-sm'
                      : 'border-border dark:border-[#1E3B34] bg-muted/50 dark:bg-[#0D1F18] opacity-60'
                  }`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                        isCompleted
                          ? 'bg-[#2F8F6B] dark:bg-[#6DD4A8] text-white dark:text-[#0A2E20]'
                          : isCurrent
                          ? 'bg-[#0F3D2E] dark:bg-[#6DD4A8] text-white dark:text-[#0A2E20]'
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : step.step}
                    </div>
                    <h3 className="text-sm font-semibold text-card-foreground">
                      {step.title}
                    </h3>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed ml-11">
                    {step.instruction}
                  </p>
                  {isCurrent && progress?.status === 'in_progress' && (
                    <button
                      onClick={() => markStepComplete(index)}
                      className="ml-11 mt-4 min-h-[40px] bg-[linear-gradient(135deg,#0F3D2E_0%,#2F8F6B_100%)] text-white text-sm font-semibold px-5 py-2 rounded-lg shadow-sm hover:shadow-md transition-all active:scale-[0.98]"
                    >
                      Mark as Done
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          {/* Submission form — shown when all steps done and (in_progress OR rejected) */}
          {allStepsDone && (progress?.status === 'in_progress' || progress?.status === 'rejected') && (
            <div className="bg-white dark:bg-[#132B23] border border-border dark:border-[#1E3B34] rounded-xl p-6">
              <h2 className="text-lg font-bold text-card-foreground mb-1">
                {progress?.status === 'rejected' 
                  ? 'Resubmit Your Proof' 
                  : 'Submit for Verification'
                }
              </h2>

              {/* Show rejection reason prominently above the form */}
              {progress?.status === 'rejected' && progress?.rejection_reason && (
                <div className="bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 rounded-lg px-4 py-3 mb-5 mt-3">
                  <p className="text-rose-700 dark:text-rose-300 text-sm font-semibold mb-1">
                    Previous submission was rejected
                  </p>
                  <p className="text-rose-600 dark:text-rose-400 text-sm">
                    Reason: {progress.rejection_reason}
                  </p>
                  <p className="text-rose-500 dark:text-rose-400 text-xs mt-2">
                    Please address the feedback above and resubmit.
                  </p>
                </div>
              )}

              <p className="text-sm text-muted-foreground mb-5">
                {quest.tier === 'beginner'
                  ? 'Upload proof to earn your badge.'
                  : 'Upload proof for verifier review. Certificate issued after approval.'}
              </p>

              {/* Photo upload */}
              <div className="mb-5">
                <label className="text-sm font-medium text-card-foreground mb-2 block">
                  Proof Photo *
                </label>
                <div
                  onClick={() => photoInputRef.current?.click()}
                  className="border-2 border-dashed border-border dark:border-[#1E3B34] rounded-xl p-8 text-center cursor-pointer hover:border-[#2F8F6B] dark:hover:border-[#6DD4A8] transition-colors bg-muted/30 dark:bg-[#0D1F18]"
                >
                  {photoPreview ? (
                    <img
                      src={photoPreview}
                      alt="Preview"
                      className="max-h-48 mx-auto rounded-lg"
                    />
                  ) : (
                    <div className="py-4">
                      <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-muted-foreground text-sm">Click to upload photo</p>
                    </div>
                  )}
                </div>
                <input
                  ref={photoInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handlePhotoChange}
                />
              </div>

              {/* Reflection */}
              <div className="mb-6">
                <label className="text-sm font-medium text-card-foreground mb-2 block">
                  Reflection * (min 50 characters)
                </label>
                <textarea
                  value={reflection}
                  onChange={e => setReflection(e.target.value)}
                  placeholder="What did you do? What did you learn? What impact did it make?"
                  rows={4}
                  className="w-full border border-border dark:border-[#1E3B34] bg-input-background dark:bg-[#0D1F18] rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#2F8F6B]/30 focus:border-[#2F8F6B] resize-none"
                />
                <p
                  className={`text-xs mt-2 text-right font-medium ${
                    reflection.length < 50 ? 'text-rose-500' : 'text-muted-foreground'
                  }`}
                >
                  {reflection.length}/50 min
                </p>
              </div>

              <button
                onClick={handleSubmit}
                disabled={!photoFile || reflection.length < 50 || submitting}
                className="w-full min-h-[48px] bg-[linear-gradient(135deg,#0F3D2E_0%,#2F8F6B_100%)] text-white py-3 rounded-xl text-sm font-bold disabled:opacity-40 disabled:cursor-not-allowed shadow-sm hover:shadow-md transition-all active:scale-[0.98]"
              >
                {submitting 
                  ? 'Submitting...' 
                  : progress?.status === 'rejected'
                  ? 'Resubmit for Verification'
                  : 'Submit for Verification'
                }
              </button>
            </div>
          )}

          {/* Status messages */}
          {progress?.status === 'submitted' && (
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-6 text-center">
              <p className="text-amber-700 dark:text-amber-300 font-semibold text-lg">Awaiting Verification</p>
              <p className="text-amber-600 dark:text-amber-400 text-sm mt-2">
                Your submission is being reviewed. You will be notified when it is verified.
              </p>
            </div>
          )}

          {progress?.status === 'verified' && (
            <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl p-6 text-center">
              <CheckCircle2 className="w-10 h-10 mx-auto mb-3 text-emerald-600 dark:text-emerald-400" />
              <p className="text-emerald-700 dark:text-emerald-300 font-bold text-lg">Quest Completed!</p>
              <p className="text-emerald-600 dark:text-emerald-400 text-sm mt-2">
                Congratulations! You have earned the{' '}
                <strong>{quest.badge_name || quest.certificate_name}</strong>{' '}
                {quest.tier === 'beginner' ? 'badge' : 'certificate'}.
              </p>
            </div>
          )}
        </div>

        {/* RIGHT — AI Coach Side Panel */}
        <div className="w-full lg:w-80 flex-shrink-0">
          <AiCoachPanel quest={quest} />
        </div>
      </div>
    </div>
  );
}

export default QuestDetail;
