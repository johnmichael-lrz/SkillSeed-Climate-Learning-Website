-- =============================================================================
-- Migration: 010_admin_roles.sql
-- Adds super_admin and admin_role fields to profiles.
-- Super admins can manage other admin accounts from the Verifier Portal.
-- =============================================================================

-- Step 1: Add admin role columns to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_super_admin BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS admin_role TEXT CHECK (
    admin_role IN ('content_moderator', 'challenge_manager', 'user_manager', 'super_admin')
  );

COMMENT ON COLUMN public.profiles.is_super_admin IS
  'Super admins can manage all admin accounts and permissions from the Verifier Portal.';
COMMENT ON COLUMN public.profiles.admin_role IS
  'Admin permission level: content_moderator | challenge_manager | user_manager | super_admin';

-- Step 2: Index for quick admin lookups
CREATE INDEX IF NOT EXISTS idx_profiles_is_super_admin ON public.profiles(is_super_admin);
CREATE INDEX IF NOT EXISTS idx_profiles_admin_role     ON public.profiles(admin_role);
CREATE INDEX IF NOT EXISTS idx_profiles_is_verifier    ON public.profiles(is_verifier);

-- Step 3: Admin invite tokens table
-- Super admins generate a one-time token; the invitee signs up and the token links their profile.
CREATE TABLE IF NOT EXISTS public.admin_invites (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email       TEXT NOT NULL,
  admin_role  TEXT NOT NULL CHECK (
    admin_role IN ('content_moderator', 'challenge_manager', 'user_manager', 'super_admin')
  ),
  invited_by  UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  token       TEXT NOT NULL UNIQUE DEFAULT gen_random_uuid()::TEXT,
  used        BOOLEAN NOT NULL DEFAULT false,
  expires_at  TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '7 days',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admin_invites_email   ON public.admin_invites(email);
CREATE INDEX IF NOT EXISTS idx_admin_invites_token   ON public.admin_invites(token);
CREATE INDEX IF NOT EXISTS idx_admin_invites_used    ON public.admin_invites(used);

ALTER TABLE public.admin_invites ENABLE ROW LEVEL SECURITY;

-- Only super admins can read/create invites
CREATE POLICY "Super admins can manage invites"
  ON public.admin_invites FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.user_id = auth.uid() AND p.is_super_admin = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.user_id = auth.uid() AND p.is_super_admin = true
    )
  );

-- Step 4: RLS policies for profiles — super admins can update admin fields
CREATE POLICY "Super admins can update admin fields"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.user_id = auth.uid() AND p.is_super_admin = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.user_id = auth.uid() AND p.is_super_admin = true
    )
  );

-- Step 5: View for admin directory (used by the management UI)
CREATE OR REPLACE VIEW public.admin_directory AS
SELECT
  id,
  user_id,
  name,
  avatar_url,
  location,
  is_verifier,
  is_super_admin,
  admin_role,
  created_at
FROM public.profiles
WHERE is_verifier = true OR is_super_admin = true OR admin_role IS NOT NULL
ORDER BY is_super_admin DESC, admin_role, name;

GRANT SELECT ON public.admin_directory TO authenticated;

-- NOTE: To bootstrap your first super admin, run in Supabase SQL editor:
-- UPDATE profiles SET is_super_admin = true, is_verifier = true, admin_role = 'super_admin'
-- WHERE user_id = '<your-auth-user-uuid>';