// Match Service - Data access layer for SkillSeed matching system
import { supabase } from './supabase';
import type {
  Profile,
  ProfileInsert,
  ProfileUpdate,
  ProfileFilters,
  Project,
  ProjectInsert,
  ProjectUpdate,
  ProjectFilters,
  Connection,
  ConnectionInsert,
  ConnectionUpdate,
  ConnectionWithDetails,
  MatchedProfile,
  MatchedProject,
} from '../types/database';

// ============================================================================
// PROFILE OPERATIONS
// ============================================================================

/**
 * Get the current user's profile
 */
export async function getCurrentProfile(): Promise<Profile | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', user.id)
    .single();

  if (error) {
    console.error('Error fetching profile:', error);
    return null;
  }
  return data;
}

/**
 * Get a profile by user ID
 */
export async function getProfileByUserId(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error) {
    console.error('Error fetching profile:', error);
    return null;
  }
  return data;
}

/**
 * Get a profile by profile ID
 */
export async function getProfileById(profileId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', profileId)
    .single();

  if (error) {
    console.error('Error fetching profile:', error);
    return null;
  }
  return data;
}

/**
 * Update the current user's profile
 */
export async function updateProfile(updates: ProfileUpdate): Promise<Profile | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('user_id', user.id)
    .select()
    .single();

  if (error) {
    console.error('Error updating profile:', error);
    return null;
  }
  return data;
}

/**
 * Search profiles with filters
 */
export async function searchProfiles(filters?: ProfileFilters): Promise<Profile[]> {
  let query = supabase.from('profiles').select('*');

  if (filters?.role_type) {
    const roles = Array.isArray(filters.role_type) ? filters.role_type : [filters.role_type];
    query = query.in('role_type', roles);
  }

  if (filters?.skills && filters.skills.length > 0) {
    query = query.overlaps('skills', filters.skills);
  }

  if (filters?.location) {
    query = query.ilike('location', `%${filters.location}%`);
  }

  if (filters?.availability) {
    const avail = Array.isArray(filters.availability) ? filters.availability : [filters.availability];
    query = query.in('availability', avail);
  }

  if (filters?.verified !== undefined) {
    query = query.eq('verified', filters.verified);
  }

  const { data, error } = await query.order('verified', { ascending: false });

  if (error) {
    console.error('Error searching profiles:', error);
    return [];
  }
  return data || [];
}

// ============================================================================
// PROJECT OPERATIONS
// ============================================================================

/**
 * Get all open projects
 */
export async function getProjects(filters?: ProjectFilters): Promise<Project[]> {
  let query = supabase.from('projects').select('*');

  if (filters?.type) {
    const types = Array.isArray(filters.type) ? filters.type : [filters.type];
    query = query.in('type', types);
  }

  if (filters?.focus_area && filters.focus_area.length > 0) {
    query = query.overlaps('focus_area', filters.focus_area);
  }

  if (filters?.region) {
    const regions = Array.isArray(filters.region) ? filters.region : [filters.region];
    query = query.in('region', regions);
  }

  if (filters?.status) {
    const statuses = Array.isArray(filters.status) ? filters.status : [filters.status];
    query = query.in('status', statuses);
  } else {
    // Default to open projects
    query = query.eq('status', 'open');
  }

  if (filters?.skills_needed && filters.skills_needed.length > 0) {
    query = query.overlaps('skills_needed', filters.skills_needed);
  }

  const { data, error } = await query
    .order('type', { ascending: true }) // urgent first
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching projects:', error);
    return [];
  }
  return data || [];
}

/**
 * Get a single project by ID
 */
export async function getProjectById(projectId: string): Promise<Project | null> {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('id', projectId)
    .single();

  if (error) {
    console.error('Error fetching project:', error);
    return null;
  }
  return data;
}

/**
 * Get projects posted by the current user
 */
export async function getMyProjects(): Promise<Project[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('poster_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching my projects:', error);
    return [];
  }
  return data || [];
}

/**
 * Create a new project
 */
export async function createProject(project: Omit<ProjectInsert, 'poster_id'>): Promise<Project | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('projects')
    .insert({ ...project, poster_id: user.id })
    .select()
    .single();

  if (error) {
    console.error('Error creating project:', error);
    return null;
  }
  return data;
}

/**
 * Update a project
 */
export async function updateProject(projectId: string, updates: ProjectUpdate): Promise<Project | null> {
  const { data, error } = await supabase
    .from('projects')
    .update(updates)
    .eq('id', projectId)
    .select()
    .single();

  if (error) {
    console.error('Error updating project:', error);
    return null;
  }
  return data;
}

/**
 * Delete a project
 */
export async function deleteProject(projectId: string): Promise<boolean> {
  const { error } = await supabase
    .from('projects')
    .delete()
    .eq('id', projectId);

  if (error) {
    console.error('Error deleting project:', error);
    return false;
  }
  return true;
}

// ============================================================================
// MATCH OPERATIONS
// ============================================================================

/**
 * Get matched profiles for a project (using the database function)
 * This finds responders whose skills overlap with the project's required skills
 */
export async function getMatchesForProject(projectId: string): Promise<MatchedProfile[]> {
  const { data, error } = await supabase
    .rpc('get_matches_for_project', { project_uuid: projectId });

  if (error) {
    console.error('Error fetching matches for project:', error);
    return [];
  }
  return data || [];
}

/**
 * Get matching projects for the current user (using the database function)
 * This finds projects whose required skills overlap with the user's skills
 */
export async function getMatchingProjects(): Promise<MatchedProject[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .rpc('get_projects_for_user', { profile_user_id: user.id });

  if (error) {
    console.error('Error fetching matching projects:', error);
    return [];
  }
  return data || [];
}

/**
 * Alternative: Get matches using direct query (if function not available)
 */
export async function getMatchesForProjectDirect(projectId: string): Promise<Profile[]> {
  // First get the project to know required skills
  const project = await getProjectById(projectId);
  if (!project || !project.skills_needed.length) return [];

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .overlaps('skills', project.skills_needed)
    .order('verified', { ascending: false });

  if (error) {
    console.error('Error fetching matches:', error);
    return [];
  }
  return data || [];
}

// ============================================================================
// CONNECTION OPERATIONS
// ============================================================================

/**
 * Apply to a project (create connection as responder)
 */
export async function applyToProject(
  projectId: string, 
  role: 'volunteer' | 'professional',
  message?: string
): Promise<Connection | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  // Get project to find poster_id
  const project = await getProjectById(projectId);
  if (!project) return null;

  // Get responder's profile for match score calculation
  const profile = await getCurrentProfile();
  const matchScore = profile?.skills 
    ? profile.skills.filter(s => project.skills_needed.includes(s)).length 
    : 0;

  const { data, error } = await supabase
    .from('connections')
    .insert({
      project_id: projectId,
      poster_id: project.poster_id,
      responder_id: user.id,
      role,
      message,
      status: 'pending',
      match_score: matchScore,
    })
    .select()
    .single();

  if (error) {
    console.error('Error applying to project:', error);
    return null;
  }
  return data;
}

/**
 * Update connection status (accept/decline as poster)
 */
export async function updateConnectionStatus(
  connectionId: string, 
  status: 'accepted' | 'declined'
): Promise<Connection | null> {
  const { data, error } = await supabase
    .from('connections')
    .update({ status })
    .eq('id', connectionId)
    .select()
    .single();

  if (error) {
    console.error('Error updating connection:', error);
    return null;
  }
  return data;
}

/**
 * Get connections for a project (for posters)
 */
export async function getConnectionsForProject(projectId: string): Promise<ConnectionWithDetails[]> {
  const { data, error } = await supabase
    .from('connections')
    .select(`
      *,
      responder_profile:profiles!connections_responder_id_fkey(*)
    `)
    .eq('project_id', projectId)
    .order('match_score', { ascending: false });

  if (error) {
    console.error('Error fetching connections for project:', error);
    return [];
  }
  return data || [];
}

/**
 * Get my applications (for responders)
 */
export async function getMyApplications(): Promise<ConnectionWithDetails[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('connections')
    .select(`
      *,
      project:projects(*)
    `)
    .eq('responder_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching my applications:', error);
    return [];
  }
  return data || [];
}

/**
 * Get all connections for the current user (as poster or responder)
 */
export async function getMyConnections(): Promise<ConnectionWithDetails[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('connections')
    .select(`
      *,
      project:projects(*),
      responder_profile:profiles!connections_responder_id_fkey(*)
    `)
    .or(`poster_id.eq.${user.id},responder_id.eq.${user.id}`)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching connections:', error);
    return [];
  }
  return data || [];
}

/**
 * Check if current user has already applied to a project
 */
export async function hasAppliedToProject(projectId: string): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { data, error } = await supabase
    .from('connections')
    .select('id')
    .eq('project_id', projectId)
    .eq('responder_id', user.id)
    .single();

  if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
    console.error('Error checking application status:', error);
  }
  return !!data;
}

// ============================================================================
// STATS & COUNTS
// ============================================================================

/**
 * Get dashboard stats for the current user
 */
export async function getDashboardStats(): Promise<{
  matchingProjects: number;
  pendingApplications: number;
  acceptedConnections: number;
  myProjects: number;
}> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { matchingProjects: 0, pendingApplications: 0, acceptedConnections: 0, myProjects: 0 };
  }

  // Get counts in parallel
  const [matchingProjectsResult, applicationsResult, myProjectsResult] = await Promise.all([
    supabase.rpc('get_projects_for_user', { profile_user_id: user.id }),
    supabase.from('connections').select('status').eq('responder_id', user.id),
    supabase.from('projects').select('id').eq('poster_id', user.id),
  ]);

  const matchingProjects = matchingProjectsResult.data?.length || 0;
  const applications = applicationsResult.data || [];
  const pendingApplications = applications.filter(a => a.status === 'pending').length;
  const acceptedConnections = applications.filter(a => a.status === 'accepted').length;
  const myProjects = myProjectsResult.data?.length || 0;

  return {
    matchingProjects,
    pendingApplications,
    acceptedConnections,
    myProjects,
  };
}
