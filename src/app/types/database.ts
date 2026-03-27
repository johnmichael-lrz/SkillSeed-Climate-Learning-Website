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
  is_verifier: boolean;
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
  compensation_min: number | null;
  compensation_max: number | null;
  compensation_currency: string | null;
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
// Challenge Types
// ============================================================================

export type ChallengeStatus = 'active' | 'completed' | 'draft';
export type ChallengeDifficulty = 'Beginner' | 'Intermediate' | 'Advanced';
export type ChallengeCategory = 
  | 'Waste Reduction' 
  | 'Solar Energy' 
  | 'Urban Greening' 
  | 'Water Conservation' 
  | 'Energy Efficiency'
  | 'Mixed';

export type ParticipantStatus = 'joined' | 'completed';

export interface Challenge {
  id: string;
  creator_id: string | null;
  title: string;
  description: string | null;
  category: ChallengeCategory | string | null;
  difficulty: ChallengeDifficulty;
  points_reward: number;
  participant_count: number;
  action_count: number;
  banner_url: string | null;
  status: ChallengeStatus;
  deadline: string | null;
  /** Admin override: when true, this challenge is always shown as Featured. */
  is_pinned: boolean;
  created_at: string;
  updated_at: string;
}

/** Featured challenge — includes the computed scoring breakdown. */
export interface FeaturedChallenge extends Challenge {
  /** Multi-factor score: participant engagement + time sensitivity + recency + points value. */
  activity_score: number;
}

export interface ChallengeParticipant {
  id: string;
  challenge_id: string;
  user_id: string;
  status: ParticipantStatus;
  actions_completed: number;
  points_earned: number;
  joined_at: string;
}

export interface LeaderboardEntry {
  user_id: string;
  name: string;
  location: string | null;
  avatar_url: string | null;
  total_points: number;
  missions_completed: number;
}

// Extended types with relations
export interface ChallengeWithCreator extends Challenge {
  creator?: Profile;
}

export interface ChallengeParticipantWithChallenge extends ChallengeParticipant {
  challenges?: Challenge;
}

export interface ChallengeParticipantWithProfile extends ChallengeParticipant {
  profiles?: Profile;
}

// Form types for creating challenges
export interface CreateChallengeInput {
  title: string;
  description: string;
  category: ChallengeCategory | string;
  difficulty: ChallengeDifficulty;
  points_reward: number;
  deadline: string;
  banner_url?: string;
}

// ============================================================================
// Challenge Submission Types
// ============================================================================

export interface ChallengeSubmission {
  id: string;
  challenge_id: string;
  user_id: string;
  photo_url: string;
  reflection: string | null;
  impact_summary: string | null;
  like_count: number;
  created_at: string;
}

export interface SubmissionLike {
  id: string;
  submission_id: string;
  user_id: string;
  created_at: string;
}

// Feed item from the community_feed view
export interface FeedItem {
  id: string;
  challenge_id: string;
  user_id: string;
  photo_url: string;
  reflection: string | null;
  impact_summary: string | null;
  like_count: number;
  created_at: string;
  challenge_title: string;
  challenge_category: string | null;
  challenge_points: number;
  user_name: string;
  user_avatar: string | null;
  user_location: string | null;
}

// Extended submission with relations
export interface ChallengeSubmissionWithDetails extends ChallengeSubmission {
  challenge?: Challenge;
  profile?: Profile;
}

// Input type for creating a submission
export interface CreateSubmissionInput {
  challenge_id: string;
  photo_url: string;
  reflection?: string;
  impact_summary?: string;
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
  compensation_min?: number | null;
  compensation_max?: number | null;
  compensation_currency?: string | null;
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
  compensation_min?: number | null;
  compensation_max?: number | null;
  compensation_currency?: string | null;
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

// ============================================================================
// Quest Types (Hands-on Tab)
// ============================================================================

export type QuestTier = 'beginner' | 'advanced';
export type QuestProgressStatus = 'in_progress' | 'submitted' | 'verified' | 'rejected';

export interface QuestStep {
  step: number;
  title: string;
  instruction: string;
}

export interface Quest {
  id: string;
  title: string;
  description: string | null;
  tier: QuestTier;
  category: string | null;
  badge_name: string | null;
  badge_icon: string | null;
  certificate_name: string | null;
  steps: QuestStep[] | null;
  points_reward: number;
  estimated_days: number;
  created_at: string;
}

export interface QuestProgress {
  id: string;
  quest_id: string;
  user_id: string;
  status: QuestProgressStatus;
  current_step: number;
  photo_url: string | null;
  reflection: string | null;
  submitted_at: string | null;
  verified_at: string | null;
  verified_by: string | null;
  rejection_reason: string | null;
  ai_confidence: number | null;
  ai_reasoning: string | null;
  ai_recommendation: string | null;
  created_at: string;
}

export interface Badge {
  id: string;
  name: string;
  icon: string;
  description: string | null;
  quest_id: string | null;
  tier: QuestTier | null;
}

export interface UserBadge {
  id: string;
  user_id: string;
  badge_id: string;
  quest_id: string | null;
  earned_at: string;
}

// Extended types with relations
export interface QuestProgressWithQuest extends QuestProgress {
  quests?: Quest;
}

export interface QuestProgressWithDetails extends QuestProgress {
  quests?: Quest;
  profiles?: Profile;
}

export interface UserBadgeWithDetails extends UserBadge {
  badges?: Badge;
}

export interface QuestWithProgress extends Quest {
  quest_progress?: QuestProgress[];
}