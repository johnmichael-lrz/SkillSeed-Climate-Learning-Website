-- Impact events (append-only) + verifier audit log + read-only summary RPC
-- Supports fellowship demo: measurable completions + accountable moderation

-- =============================================================================
-- IMPACT EVENTS
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.impact_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  actor_profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  quest_id UUID REFERENCES public.quests(id) ON DELETE SET NULL,
  quest_progress_id UUID REFERENCES public.quest_progress(id) ON DELETE SET NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_impact_events_type ON public.impact_events(event_type);
CREATE INDEX IF NOT EXISTS idx_impact_events_created_at ON public.impact_events(created_at DESC);

ALTER TABLE public.impact_events ENABLE ROW LEVEL SECURITY;

-- Rows are written only by SECURITY DEFINER triggers / definer RPCs (table owner bypasses RLS).
-- Clients cannot read raw events; use get_impact_summary() for aggregates.
REVOKE ALL ON public.impact_events FROM anon;
REVOKE ALL ON public.impact_events FROM authenticated;

-- =============================================================================
-- When a quest submission becomes verified, record one impact row
-- =============================================================================
CREATE OR REPLACE FUNCTION public.trg_quest_progress_verified_impact()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status <> 'verified' THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.impact_events (event_type, actor_profile_id, quest_id, quest_progress_id, metadata)
    VALUES (
      'quest_verified',
      NEW.user_id,
      NEW.quest_id,
      NEW.id,
      jsonb_build_object(
        'source', 'insert',
        'verified_by_profile_id', NEW.verified_by
      )
    );
  ELSIF TG_OP = 'UPDATE' AND (OLD.status IS DISTINCT FROM 'verified') THEN
    INSERT INTO public.impact_events (event_type, actor_profile_id, quest_id, quest_progress_id, metadata)
    VALUES (
      'quest_verified',
      NEW.user_id,
      NEW.quest_id,
      NEW.id,
      jsonb_build_object(
        'source', 'update',
        'previous_status', OLD.status,
        'verified_by_profile_id', NEW.verified_by
      )
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS quest_progress_impact_after_verify ON public.quest_progress;
CREATE TRIGGER quest_progress_impact_after_verify
  AFTER INSERT OR UPDATE ON public.quest_progress
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_quest_progress_verified_impact();

-- =============================================================================
-- VERIFIER AUDIT LOG (human decisions)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.quest_verification_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quest_progress_id UUID NOT NULL REFERENCES public.quest_progress(id) ON DELETE CASCADE,
  learner_profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  quest_id UUID NOT NULL REFERENCES public.quests(id) ON DELETE CASCADE,
  verifier_profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  action TEXT NOT NULL CHECK (action IN ('verify', 'reject')),
  rejection_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_quest_verification_audit_verifier ON public.quest_verification_audit(verifier_profile_id);
CREATE INDEX IF NOT EXISTS idx_quest_verification_audit_created ON public.quest_verification_audit(created_at DESC);

ALTER TABLE public.quest_verification_audit ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Verifiers read audit log"
  ON public.quest_verification_audit
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.user_id = auth.uid() AND p.is_verifier = true
    )
  );

CREATE POLICY "Verifiers insert own audit rows"
  ON public.quest_verification_audit
  FOR INSERT
  TO authenticated
  WITH CHECK (
    verifier_profile_id = (SELECT id FROM public.profiles WHERE user_id = auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.user_id = auth.uid() AND p.is_verifier = true
    )
  );

-- =============================================================================
-- PUBLIC summary for dashboards / landing stats (no row-level data leaked)
-- =============================================================================
CREATE OR REPLACE FUNCTION public.get_impact_summary()
RETURNS TABLE (
  total_quest_completions BIGINT,
  completions_last_30_days BIGINT,
  completions_last_7_days BIGINT
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    COUNT(*)::BIGINT AS total_quest_completions,
    COUNT(*) FILTER (
      WHERE created_at > NOW() - INTERVAL '30 days'
    )::BIGINT AS completions_last_30_days,
    COUNT(*) FILTER (
      WHERE created_at > NOW() - INTERVAL '7 days'
    )::BIGINT AS completions_last_7_days
  FROM public.impact_events
  WHERE event_type = 'quest_verified';
$$;

REVOKE ALL ON FUNCTION public.get_impact_summary() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_impact_summary() TO anon;
GRANT EXECUTE ON FUNCTION public.get_impact_summary() TO authenticated;
