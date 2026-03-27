-- =============================================================================
-- Project joined counts (pending + accepted) for Missions tab
-- Used to display: joined vs needed for both posters and responders.
-- =============================================================================

CREATE OR REPLACE FUNCTION public.get_joined_counts_for_projects(project_ids UUID[])
RETURNS TABLE (
  project_id UUID,
  volunteers_joined BIGINT,
  professionals_joined BIGINT,
  pending_applicants BIGINT
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    pid AS project_id,
    COUNT(c.id) FILTER (
      WHERE c.role = 'volunteer'
        AND c.status IN ('pending', 'accepted')
    )::BIGINT AS volunteers_joined,
    COUNT(c.id) FILTER (
      WHERE c.role = 'professional'
        AND c.status IN ('pending', 'accepted')
    )::BIGINT AS professionals_joined,
    COUNT(c.id) FILTER (
      WHERE c.status = 'pending'
    )::BIGINT AS pending_applicants
  FROM unnest(project_ids) AS pid
  LEFT JOIN public.connections c
    ON c.project_id = pid
  GROUP BY pid
  ORDER BY pid;
$$;

REVOKE ALL ON FUNCTION public.get_joined_counts_for_projects(UUID[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_joined_counts_for_projects(UUID[]) TO anon;
GRANT EXECUTE ON FUNCTION public.get_joined_counts_for_projects(UUID[]) TO authenticated;

