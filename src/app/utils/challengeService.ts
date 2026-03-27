import { supabase } from './supabase';
import { moderateSubmission } from './moderationService';
import type {
  Challenge,
  FeaturedChallenge,
  ChallengeParticipant,
  ChallengeParticipantWithChallenge,
  LeaderboardEntry,
  CreateChallengeInput,
} from '../types/database';

// ============================================================================
// Challenge Queries
// ============================================================================

/**
 * Fetch all active challenges
 */
export async function fetchActiveChallenges(): Promise<Challenge[]> {
  const { data, error } = await supabase
    .from('challenges')
    .select('*')
    .eq('status', 'active')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching challenges:', error);
    throw error;
  }

  return data || [];
}

/**
 * Fetch a single challenge by ID
 */
export async function fetchChallengeById(challengeId: string): Promise<Challenge | null> {
  const { data, error } = await supabase
    .from('challenges')
    .select('*')
    .eq('id', challengeId)
    .single();

  if (error) {
    console.error('Error fetching challenge:', error);
    return null;
  }

  return data;
}

/**
 * Fetch challenges the current user has joined
 */
export async function fetchJoinedChallenges(userId: string): Promise<ChallengeParticipantWithChallenge[]> {
  const { data, error } = await supabase
    .from('challenge_participants')
    .select('*, challenges(*)')
    .eq('user_id', userId);

  if (error) {
    console.error('Error fetching joined challenges:', error);
    throw error;
  }

  return data || [];
}

/**
 * Check if user has joined a specific challenge
 */
export async function checkUserJoined(challengeId: string, userId: string): Promise<ChallengeParticipant | null> {
  const { data, error } = await supabase
    .from('challenge_participants')
    .select('*')
    .eq('challenge_id', challengeId)
    .eq('user_id', userId)
    .single();

  if (error && error.code !== 'PGRST116') {
    // PGRST116 = no rows found, which is expected
    console.error('Error checking user participation:', error);
  }

  return data || null;
}

// ============================================================================
// Challenge Mutations
// ============================================================================

/**
 * Join a challenge
 */
export async function joinChallenge(challengeId: string, userId: string): Promise<ChallengeParticipant> {
  // Insert participation record
  const { data, error } = await supabase
    .from('challenge_participants')
    .insert({
      challenge_id: challengeId,
      user_id: userId,
    })
    .select()
    .single();

  if (error) {
    console.error('Error joining challenge:', error);
    throw error;
  }

  // Increment participant count
  const { error: rpcError } = await supabase.rpc('increment_participant_count', {
    p_challenge_id: challengeId,
  });

  if (rpcError) {
    console.error('Error incrementing participant count:', rpcError);
  }

  return data;
}

/**
 * Leave a challenge
 */
export async function leaveChallenge(challengeId: string, userId: string): Promise<void> {
  const { error } = await supabase
    .from('challenge_participants')
    .delete()
    .eq('challenge_id', challengeId)
    .eq('user_id', userId);

  if (error) {
    console.error('Error leaving challenge:', error);
    throw error;
  }

  // Decrement participant count
  const { error: rpcError } = await supabase.rpc('decrement_participant_count', {
    p_challenge_id: challengeId,
  });

  if (rpcError) {
    console.error('Error decrementing participant count:', rpcError);
  }
}

/**
 * Create a new challenge
 */
export async function createChallenge(
  creatorId: string,
  input: CreateChallengeInput
): Promise<Challenge> {
  const { data, error } = await supabase
    .from('challenges')
    .insert({
      creator_id: creatorId,
      title: input.title,
      description: input.description,
      category: input.category,
      difficulty: input.difficulty,
      points_reward: input.points_reward,
      deadline: input.deadline,
      banner_url: input.banner_url || null,
      status: 'active',
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating challenge:', error);
    throw error;
  }

  return data;
}

/**
 * Update challenge progress for a participant
 */
export async function updateParticipantProgress(
  challengeId: string,
  userId: string,
  actionsCompleted: number,
  pointsEarned: number
): Promise<void> {
  const { error } = await supabase
    .from('challenge_participants')
    .update({
      actions_completed: actionsCompleted,
      points_earned: pointsEarned,
    })
    .eq('challenge_id', challengeId)
    .eq('user_id', userId);

  if (error) {
    console.error('Error updating participant progress:', error);
    throw error;
  }
}

/**
 * Mark a challenge as completed for a participant
 */
export async function completeChallenge(
  challengeId: string,
  userId: string,
  pointsEarned: number
): Promise<void> {
  const { error } = await supabase
    .from('challenge_participants')
    .update({
      status: 'completed',
      points_earned: pointsEarned,
    })
    .eq('challenge_id', challengeId)
    .eq('user_id', userId);

  if (error) {
    console.error('Error completing challenge:', error);
    throw error;
  }
}

// ============================================================================
// Leaderboard Queries
// ============================================================================

/**
 * Fetch the global leaderboard ordered by total points descending.
 * Explicit ORDER BY is required — Supabase does not guarantee view ordering.
 */
export async function fetchLeaderboard(limit: number = 10): Promise<LeaderboardEntry[]> {
  const { data, error } = await supabase
    .from('leaderboard')
    .select('*')
    .order('total_points', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching leaderboard:', error);
    throw error;
  }

  return data || [];
}

/**
 * Fetch user's rank in the leaderboard
 */
export async function fetchUserRank(userId: string): Promise<number | null> {
  const { data, error } = await supabase
    .from('leaderboard')
    .select('user_id')
    .order('total_points', { ascending: false });

  if (error) {
    console.error('Error fetching user rank:', error);
    return null;
  }

  const index = data?.findIndex((entry) => entry.user_id === userId);
  return index !== undefined && index >= 0 ? index + 1 : null;
}

/**
 * Subscribe to leaderboard changes in real time.
 * Watches challenge_participants (points_earned updates) and profiles (name/avatar changes).
 */
export function subscribeToLeaderboard(callback: () => void) {
  return supabase
    .channel('leaderboard-realtime')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'challenge_participants' },
      callback
    )
    .on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'profiles' },
      callback
    )
    .subscribe();
}

/**
 * Fetch user's total points and stats
 */
export async function fetchUserChallengeStats(userId: string): Promise<{
  totalPoints: number;
  activeChallenges: number;
  completedChallenges: number;
}> {
  const { data, error } = await supabase
    .from('challenge_participants')
    .select('status, points_earned')
    .eq('user_id', userId);

  if (error) {
    console.error('Error fetching user stats:', error);
    return { totalPoints: 0, activeChallenges: 0, completedChallenges: 0 };
  }

  const stats = (data || []).reduce(
    (acc, p) => ({
      totalPoints: acc.totalPoints + (p.points_earned || 0),
      activeChallenges: acc.activeChallenges + (p.status === 'joined' ? 1 : 0),
      completedChallenges: acc.completedChallenges + (p.status === 'completed' ? 1 : 0),
    }),
    { totalPoints: 0, activeChallenges: 0, completedChallenges: 0 }
  );

  return stats;
}

// ============================================================================
// Global Stats Queries
// ============================================================================

/**
 * Fetch global community stats for the hero section
 */
export async function fetchCommunityStats(): Promise<{
  totalChallengers: number;
  activeChallenges: number;
  totalActions: number;
}> {
  // Get total unique challengers
  const { count: totalChallengers } = await supabase
    .from('challenge_participants')
    .select('user_id', { count: 'exact', head: true });

  // Get active challenges count
  const { count: activeChallenges } = await supabase
    .from('challenges')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'active');

  // Get total action count (sum of action_count from all challenges)
  const { data: challenges } = await supabase
    .from('challenges')
    .select('action_count');

  const totalActions = (challenges || []).reduce(
    (sum, c) => sum + (c.action_count || 0),
    0
  );

  return {
    totalChallengers: totalChallengers || 0,
    activeChallenges: activeChallenges || 0,
    totalActions,
  };
}

// ============================================================================
// Featured Challenge (Algorithmic)
// ============================================================================

/**
 * Fetch the featured challenge using a multi-factor scoring algorithm.
 *
 * Scoring factors (all computed in the featured_challenge DB view):
 *   - Participant count  → participant_count * 3
 *   - Time sensitivity   → +80 if deadline ≤ 7 days, +40 if ≤ 14 days
 *   - Recency boost      → +60 if created within 3 days, +30 within 7 days
 *   - Points value       → floor(points_reward / 10)
 *   - Admin pin override → is_pinned=true challenges always rank first
 */
export async function fetchFeaturedChallenge(): Promise<FeaturedChallenge | null> {
  const { data, error } = await supabase
    .from('featured_challenge')
    .select('*')
    .single();

  if (error) {
    // PGRST116 = no rows found (no active challenges)
    if (error.code !== 'PGRST116') {
      console.error('Error fetching featured challenge:', error);
    }
    return null;
  }

  return data as FeaturedChallenge;
}

/**
 * Log a challenge action for a user
 * Increments action_count on challenge and actions_completed/points_earned on participant
 */
export async function logChallengeAction(challengeId: string, userId: string): Promise<void> {
  const { error } = await supabase.rpc('log_challenge_action', {
    p_challenge_id: challengeId,
    p_user_id: userId,
  });

  if (error) {
    console.error('Error logging challenge action:', error);
    throw error;
  }
}

// ============================================================================
// Real-time Subscriptions
// ============================================================================

/**
 * Subscribe to challenge updates
 */
export function subscribeToChallenges(callback: () => void) {
  return supabase
    .channel('challenges-realtime')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'challenges' },
      callback
    )
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'challenge_participants' },
      callback
    )
    .subscribe();
}

/**
 * Unsubscribe from channel
 */
export function unsubscribeFromChannel(channel: ReturnType<typeof supabase.channel>) {
  supabase.removeChannel(channel);
}

// ============================================================================
// Photo Upload
// ============================================================================

/**
 * Upload a proof photo to Supabase storage
 * Returns the public URL of the uploaded image
 */
export async function uploadProofPhoto(
  file: File,
  userId: string,
  challengeId: string
): Promise<string> {
  const fileExt = file.name.split('.').pop();
  const fileName = `${userId}/${challengeId}/${Date.now()}.${fileExt}`;
  const filePath = fileName;

  const { error: uploadError } = await supabase.storage
    .from('challenge-photos')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (uploadError) {
    console.error('Error uploading photo:', uploadError);
    throw uploadError;
  }

  const { data } = supabase.storage
    .from('challenge-photos')
    .getPublicUrl(filePath);

  return data.publicUrl;
}

// ============================================================================
// Challenge Submissions
// ============================================================================

import type { FeedItem, ChallengeSubmission } from '../types/database';

export type { ModerationResult } from './moderationService';

/**
 * Submit a challenge completion with AI moderation.
 *
 * Flow:
 * 1. Run AI moderation on the reflection + impact summary
 * 2. Insert the submission with the moderation outcome
 * 3. Only if approved: run the complete_challenge_rpc to award points and mark completed
 *
 * Returns the moderation result so the UI can inform the user.
 */
export async function submitChallengeCompletion(
  challengeId: string,
  userId: string,
  photoUrl: string,
  reflection?: string,
  impactSummary?: string,
  challengeTitle?: string,
  challengeCategory?: string | null,
): Promise<{ submissionId: string; moderation: import('./moderationService').ModerationResult }> {
  // Step 1: Run AI moderation
  const moderation = await moderateSubmission({
    challengeTitle: challengeTitle || 'Climate Action Challenge',
    challengeCategory: challengeCategory || null,
    reflection: reflection || '',
    impactSummary: impactSummary || '',
  });

  // Step 2: Insert submission with moderation outcome
  const { data: submission, error: insertError } = await supabase
    .from('challenge_submissions')
    .insert({
      challenge_id: challengeId,
      user_id: userId,
      photo_url: photoUrl,
      reflection: reflection || null,
      impact_summary: impactSummary || null,
      moderation_status: moderation.status,
      moderation_reason: moderation.reason,
      moderation_score: moderation.score,
    })
    .select('id')
    .single();

  if (insertError || !submission) {
    console.error('Error inserting submission:', insertError);
    throw insertError || new Error('Submission insert failed');
  }

  // Step 3: Only award points and mark completed if approved
  if (moderation.status === 'approved') {
    const { error: rpcError } = await supabase.rpc('complete_challenge_rpc', {
      p_challenge_id: challengeId,
      p_user_id: userId,
      p_photo_url: photoUrl,
      p_reflection: reflection || null,
      p_impact_summary: impactSummary || null,
    });

    if (rpcError) {
      console.error('Error completing challenge via RPC:', rpcError);
      // Don't throw — submission is saved, points can be reconciled later
    }
  }

  return { submissionId: submission.id, moderation };
}

/**
 * Fetch the community feed (all submissions)
 */
export async function fetchCommunityFeed(limit: number = 20): Promise<FeedItem[]> {
  const { data, error } = await supabase
    .from('community_feed')
    .select('*')
    .limit(limit);

  if (error) {
    console.error('Error fetching community feed:', error);
    throw error;
  }

  return data || [];
}

/**
 * Fetch submissions for a specific challenge
 */
export async function fetchChallengeSubmissions(challengeId: string): Promise<FeedItem[]> {
  const { data, error } = await supabase
    .from('community_feed')
    .select('*')
    .eq('challenge_id', challengeId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching challenge submissions:', error);
    throw error;
  }

  return data || [];
}

/**
 * Check if user has already submitted for a challenge
 */
export async function hasUserSubmitted(challengeId: string, userId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('challenge_submissions')
    .select('id')
    .eq('challenge_id', challengeId)
    .eq('user_id', userId)
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error('Error checking submission:', error);
  }

  return !!data;
}

// ============================================================================
// Submission Likes
// ============================================================================

/**
 * Toggle like on a submission (like if not liked, unlike if liked)
 * Returns the new like count
 */
export async function toggleSubmissionLike(
  submissionId: string,
  userId: string
): Promise<number> {
  const { data, error } = await supabase.rpc('toggle_submission_like', {
    p_submission_id: submissionId,
    p_user_id: userId,
  });

  if (error) {
    console.error('Error toggling like:', error);
    throw error;
  }

  return data;
}

/**
 * Check if user has liked a submission
 */
export async function hasUserLiked(submissionId: string, userId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('submission_likes')
    .select('id')
    .eq('submission_id', submissionId)
    .eq('user_id', userId)
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error('Error checking like:', error);
  }

  return !!data;
}

/**
 * Fetch liked submission IDs for a user (for batch checking)
 */
export async function fetchUserLikedSubmissions(userId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('submission_likes')
    .select('submission_id')
    .eq('user_id', userId);

  if (error) {
    console.error('Error fetching liked submissions:', error);
    return [];
  }

  return (data || []).map((like) => like.submission_id);
}

// ============================================================================
// Real-time Subscriptions for Feed
// ============================================================================

/**
 * Subscribe to feed updates
 */
export function subscribeToFeed(callback: () => void) {
  return supabase
    .channel('feed-realtime')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'challenge_submissions' },
      callback
    )
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'submission_likes' },
      callback
    )
    .subscribe();
}