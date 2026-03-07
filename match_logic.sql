-- SkillSeed Match Engine
-- Function: get_project_matches(p_project_id UUID)
-- Returns verified profiles whose skills overlap with the project's skills_needed,
-- ordered by match score (number of overlapping skills).

CREATE OR REPLACE FUNCTION get_project_matches(p_project_id UUID)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  name TEXT,
  org_name TEXT,
  org_type TEXT,
  role_type TEXT,
  bio TEXT,
  location TEXT,
  availability TEXT,
  skills TEXT[],
  verified BOOLEAN,
  credentials_url TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  match_score BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.user_id,
    p.name,
    p.org_name,
    p.org_type,
    p.role_type,
    p.bio,
    p.location,
    p.availability,
    p.skills,
    p.verified,
    p.credentials_url,
    p.avatar_url,
    p.created_at,
    p.updated_at,
    (SELECT COUNT(*)::BIGINT FROM unnest(p.skills) AS s WHERE s = ANY(proj.skills_needed)) AS match_score
  FROM public.profiles p
  CROSS JOIN public.projects proj
  WHERE proj.id = p_project_id
    AND p.skills && proj.skills_needed
    AND p.verified = true
  ORDER BY (SELECT COUNT(*)::BIGINT FROM unnest(p.skills) AS s WHERE s = ANY(proj.skills_needed)) DESC
  LIMIT 50;
END;
$$;
