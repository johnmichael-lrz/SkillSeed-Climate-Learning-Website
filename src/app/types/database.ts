// Database Types for SkillSeed
// Auto-generated from Supabase schema

export type RoleType = 'volunteer' | 'professional' | 'student';
export type OrgType = 'nonprofit' | 'government' | 'private' | 'academic' | 'community';
export type ProjectType = 'project' | 'urgent';
export type ProjectStatus = 'open' | 'in-progress' | 'completed' | 'closed';
export type ConnectionStatus = 'pending' | 'accepted' | 'declined';
export type ConnectionRole = 'volunteer' | 'professional';
export type Availability = 'full-time' | 'part-time' | 'weekends' | 'flexible';

// ============================================================================
// Database Tables
// ============================================================================

export interface Profile {
  id: string;
  user_id: string;
  name: string;
  org_name: string | null;
  org_type: OrgType | null;
  role_type: RoleType;
  bio: string | null;
  location: string | null;
  availability: Availability | null;
  skills: string[];
  verified: boolean;
  credentials_url: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Project {
  id: string;
  poster_id: string;
  title: string;
  type: ProjectType;
  focus_area: string[];
  location: string | null;
  region: string | null;
  description: string | null;
  volunteers_needed: number;
  professionals_needed: number;
  skills_needed: string[];
  status: ProjectStatus;
  duration: string | null;
  start_date: string | null;
  points: number;
  created_at: string;
  updated_at: string;
}

export interface Connection {
  id: string;
  project_id: string;
  poster_id: string;
  responder_id: string;
  role: ConnectionRole;
  message: string | null;
  status: ConnectionStatus;
  match_score: number;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// Function Return Types (from Supabase functions)
// ============================================================================

export interface MatchedProfile extends Profile {
  profile_id: string;
  matched_skills: string[];
  match_score: number;
}

export interface MatchedProject extends Project {
  project_id: string;
  matched_skills: string[];
  match_score: number;
}

// ============================================================================
// Extended Types (with relations)
// ============================================================================

export interface ConnectionWithDetails extends Connection {
  project?: Project;
  responder_profile?: Profile;
  poster_profile?: Profile;
}

export interface ProjectWithPoster extends Project {
  poster?: Profile;
}

export interface ProfileWithConnections extends Profile {
  connections?: Connection[];
}

// ============================================================================
// Insert/Update Types (for forms)
// ============================================================================

export interface ProfileInsert {
  user_id: string;
  name: string;
  org_name?: string | null;
  org_type?: OrgType | null;
  role_type: RoleType;
  bio?: string | null;
  location?: string | null;
  availability?: Availability | null;
  skills?: string[];
  verified?: boolean;
  credentials_url?: string | null;
  avatar_url?: string | null;
}

export interface ProfileUpdate {
  name?: string;
  org_name?: string | null;
  org_type?: OrgType | null;
  role_type?: RoleType;
  bio?: string | null;
  location?: string | null;
  availability?: Availability | null;
  skills?: string[];
  credentials_url?: string | null;
  avatar_url?: string | null;
}

export interface ProjectInsert {
  poster_id: string;
  title: string;
  type: ProjectType;
  focus_area?: string[];
  location?: string | null;
  region?: string | null;
  description?: string | null;
  volunteers_needed?: number;
  professionals_needed?: number;
  skills_needed?: string[];
  status?: ProjectStatus;
  duration?: string | null;
  start_date?: string | null;
  points?: number;
}

export interface ProjectUpdate {
  title?: string;
  type?: ProjectType;
  focus_area?: string[];
  location?: string | null;
  region?: string | null;
  description?: string | null;
  volunteers_needed?: number;
  professionals_needed?: number;
  skills_needed?: string[];
  status?: ProjectStatus;
  duration?: string | null;
  start_date?: string | null;
  points?: number;
}

export interface ConnectionInsert {
  project_id: string;
  poster_id: string;
  responder_id: string;
  role: ConnectionRole;
  message?: string | null;
  status?: ConnectionStatus;
  match_score?: number;
}

export interface ConnectionUpdate {
  status?: ConnectionStatus;
  message?: string | null;
}

// ============================================================================
// Filter Types (for queries)
// ============================================================================

export interface ProfileFilters {
  role_type?: RoleType | RoleType[];
  skills?: string[];
  location?: string;
  availability?: Availability | Availability[];
  verified?: boolean;
}

export interface ProjectFilters {
  type?: ProjectType | ProjectType[];
  focus_area?: string[];
  region?: string | string[];
  status?: ProjectStatus | ProjectStatus[];
  skills_needed?: string[];
}

// ============================================================================
// Skills Reference (for dropdowns/filters)
// ============================================================================

export const SKILL_OPTIONS = [
  // Technical Skills
  'data analysis',
  'data collection',
  'GIS mapping',
  'machine learning',
  'python',
  'web development',
  'react',
  'node.js',
  'API development',
  'database design',
  'climate modeling',
  
  // Design Skills
  'UX design',
  'UI design',
  'prototyping',
  'figma',
  'accessibility',
  'user research',
  
  // Domain Expertise
  'climate science',
  'carbon accounting',
  'renewable energy',
  'solar installation',
  'electrical engineering',
  'urban planning',
  'green infrastructure',
  'sustainability',
  'climate finance',
  'economics',
  'policy development',
  
  // Soft Skills
  'project management',
  'stakeholder management',
  'community engagement',
  'public speaking',
  'event planning',
  'grant writing',
  'fundraising',
  'research',
  'report writing',
  'communications',
  'marketing',
  'social media',
  'content creation',
  'copywriting',
  'translation',
  'advocacy',
  'outreach',
  
  // Creative Skills
  'photography',
  'videography',
  'storytelling',
  
  // Field Skills
  'field work',
  'education',
] as const;

export type Skill = typeof SKILL_OPTIONS[number];

export const FOCUS_AREA_OPTIONS = [
  'climate adaptation',
  'disaster response',
  'renewable energy',
  'community resilience',
  'education',
  'climate literacy',
  'climate finance',
  'policy',
  'urban planning',
  'conservation',
  'carbon accounting',
  'technology',
  'communications',
  'advocacy',
  'sustainability',
  'research',
  'green infrastructure',
  'funding',
] as const;

export type FocusArea = typeof FOCUS_AREA_OPTIONS[number];

export const REGION_OPTIONS = [
  'Global',
  'North America',
  'South America',
  'Europe',
  'Africa',
  'Asia',
  'Oceania',
] as const;

export type Region = typeof REGION_OPTIONS[number];
