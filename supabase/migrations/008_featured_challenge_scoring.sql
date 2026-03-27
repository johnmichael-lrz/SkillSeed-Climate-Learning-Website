-- =============================================================================
-- Migration: 008_featured_challenge_scoring.sql
-- Adds is_pinned (admin override) to challenges table and replaces the
-- featured_challenge view with a multi-factor scoring algorithm.
--
-- Scoring formula:
--   score = participant_score + time_sensitivity_bonus + recency_bonus + points_bonus
-- Where:
--   participant_score     = participant_count * 3         (max weight: engagement)
--   time_sensitivity_bonus= 80 if deadline within 7 days,
--                           40 if deadline within 14 days, else 0
--   recency_bonus         = 60 if created within 3 days,
--                           30 if created within 7 days, else 0
--   points_bonus          = FLOOR(points_reward / 10)     (e.g. 150pts → 15 bonus)
--   admin_pin             = pinned challenges always rank first (is_pinned = true)
-- =============================================================================

-- Step 1: Add is_pinned column (admin override flag)
ALTER TABLE public.challenges
  ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN NOT NULL DEFAULT false;

-- Allow admins (service_role) to update is_pinned.
-- Regular authenticated users cannot pin a challenge.
COMMENT ON COLUMN public.challenges.is_pinned IS
  'Admin override: when true, this challenge is always shown as Featured regardless of score.';

-- Step 2: Drop old view and replace with multi-factor scoring view
DROP VIEW IF EXISTS public.featured_challenge;

CREATE OR REPLACE VIEW public.featured_challenge AS
SELECT
  *,
  -- Full scoring breakdown as a single computed column
  (
    -- Factor 1: Participant engagement (highest weight)
    (participant_count * 3)

    -- Factor 2: Time sensitivity boost (challenges ending soon rank higher)
    + CASE
        WHEN deadline IS NOT NULL AND deadline BETWEEN NOW() AND NOW() + INTERVAL '7 days'  THEN 80
        WHEN deadline IS NOT NULL AND deadline BETWEEN NOW() AND NOW() + INTERVAL '14 days' THEN 40
        ELSE 0
      END

    -- Factor 3: Recency boost (newly created challenges get visibility)
    + CASE
        WHEN created_at > NOW() - INTERVAL '3 days' THEN 60
        WHEN created_at > NOW() - INTERVAL '7 days' THEN 30
        ELSE 0
      END

    -- Factor 4: Points value (higher reward = more appealing)
    + FLOOR(points_reward / 10)
  ) AS activity_score

FROM public.challenges
WHERE
  status = 'active'
  AND (deadline IS NULL OR deadline > NOW())

ORDER BY
  -- Admin-pinned challenges always surface first
  is_pinned DESC,
  -- Then rank by computed score
  activity_score DESC,
  -- Tiebreak: challenges ending sooner win
  deadline ASC NULLS LAST

LIMIT 1;

-- Re-grant access (grants are dropped with the old view)
GRANT SELECT ON public.featured_challenge TO authenticated;
GRANT SELECT ON public.featured_challenge TO anon;