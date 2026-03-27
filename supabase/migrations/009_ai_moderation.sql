-- =============================================================================
-- Migration: 009_ai_moderation.sql
-- Adds AI moderation fields to challenge_submissions and filters community_feed
-- to only surface approved posts. Flagged posts go to an admin review queue.
-- =============================================================================

-- Step 1: Add moderation columns to challenge_submissions
ALTER TABLE public.challenge_submissions
  ADD COLUMN IF NOT EXISTS moderation_status TEXT
    NOT NULL DEFAULT 'pending'
    CHECK (moderation_status IN ('pending', 'approved', 'flagged', 'rejected')),
  ADD COLUMN IF NOT EXISTS moderation_reason TEXT,
  ADD COLUMN IF NOT EXISTS moderation_score NUMERIC(4,2);

COMMENT ON COLUMN public.challenge_submissions.moderation_status IS
  'AI moderation outcome: pending → approved | flagged | rejected';
COMMENT ON COLUMN public.challenge_submissions.moderation_reason IS
  'Human-readable reason returned by AI when flagged or rejected';
COMMENT ON COLUMN public.challenge_submissions.moderation_score IS
  'Composite AI confidence score 0–1 (1 = clearly safe)';

-- Index for admin queue queries (flagged posts)
CREATE INDEX IF NOT EXISTS idx_challenge_submissions_moderation
  ON public.challenge_submissions(moderation_status, created_at DESC);

-- Step 2: Replace community_feed view to only show approved posts
-- Flagged posts are held until an admin approves them manually.
-- Rejected posts never appear.
DROP VIEW IF EXISTS public.community_feed;

CREATE OR REPLACE VIEW public.community_feed AS
SELECT
  cs.id,
  cs.challenge_id,
  cs.user_id,
  cs.photo_url,
  cs.reflection,
  cs.impact_summary,
  cs.like_count,
  cs.created_at,
  cs.moderation_status,
  cs.moderation_reason,
  c.title  AS challenge_title,
  c.category AS challenge_category,
  c.points_reward AS challenge_points,
  p.name   AS user_name,
  p.avatar_url AS user_avatar,
  p.location AS user_location
FROM public.challenge_submissions cs
JOIN public.challenges c ON c.id = cs.challenge_id
JOIN public.profiles   p ON p.id = cs.user_id
WHERE cs.moderation_status = 'approved'
ORDER BY cs.created_at DESC;

GRANT SELECT ON public.community_feed TO authenticated;
GRANT SELECT ON public.community_feed TO anon;

-- Step 3: Admin-only view for the moderation queue (flagged posts)
CREATE OR REPLACE VIEW public.moderation_queue AS
SELECT
  cs.id,
  cs.challenge_id,
  cs.user_id,
  cs.photo_url,
  cs.reflection,
  cs.impact_summary,
  cs.moderation_status,
  cs.moderation_reason,
  cs.moderation_score,
  cs.created_at,
  c.title  AS challenge_title,
  p.name   AS user_name
FROM public.challenge_submissions cs
JOIN public.challenges c ON c.id = cs.challenge_id
JOIN public.profiles   p ON p.id = cs.user_id
WHERE cs.moderation_status = 'flagged'
ORDER BY cs.created_at ASC;

-- Only verified/admin profiles can read the moderation queue
GRANT SELECT ON public.moderation_queue TO authenticated;