-- SkillSeed Match System Schema
-- Migration: 001_match_schema.sql
-- Created: 2026-03-07

-- =============================================================================
-- PROFILES TABLE
-- Extends Supabase auth.users with profile details
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  name TEXT NOT NULL,
  org_name TEXT,
  org_type TEXT, -- nonprofit, government, private, academic, community
  role_type TEXT NOT NULL CHECK (role_type IN ('volunteer', 'professional', 'student')),
  bio TEXT,
  location TEXT,
  availability TEXT, -- full-time, part-time, weekends, flexible
  skills TEXT[] DEFAULT '{}',
  verified BOOLEAN DEFAULT FALSE,
  credentials_url TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- PROJECTS TABLE
-- Posted projects/missions from poster users
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  poster_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('project', 'urgent')),
  focus_area TEXT[] DEFAULT '{}', -- climate adaptation, renewable energy, etc.
  location TEXT,
  region TEXT, -- Global, North America, Europe, Asia, etc.
  description TEXT,
  volunteers_needed INTEGER DEFAULT 0,
  professionals_needed INTEGER DEFAULT 0,
  skills_needed TEXT[] DEFAULT '{}',
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in-progress', 'completed', 'closed')),
  duration TEXT, -- 2 weeks, 1 month, ongoing, etc.
  start_date DATE,
  points INTEGER DEFAULT 100,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- CONNECTIONS TABLE
-- Tracks matches/applications between responders and projects
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  poster_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  responder_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('volunteer', 'professional')),
  message TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  match_score INTEGER DEFAULT 0, -- Computed skill overlap score
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(project_id, responder_id)
);

-- =============================================================================
-- INDEXES
-- =============================================================================
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_skills ON public.profiles USING GIN(skills);
CREATE INDEX IF NOT EXISTS idx_profiles_location ON public.profiles(location);
CREATE INDEX IF NOT EXISTS idx_profiles_verified ON public.profiles(verified);

CREATE INDEX IF NOT EXISTS idx_projects_poster_id ON public.projects(poster_id);
CREATE INDEX IF NOT EXISTS idx_projects_skills_needed ON public.projects USING GIN(skills_needed);
CREATE INDEX IF NOT EXISTS idx_projects_focus_area ON public.projects USING GIN(focus_area);
CREATE INDEX IF NOT EXISTS idx_projects_region ON public.projects(region);
CREATE INDEX IF NOT EXISTS idx_projects_status ON public.projects(status);

CREATE INDEX IF NOT EXISTS idx_connections_project_id ON public.connections(project_id);
CREATE INDEX IF NOT EXISTS idx_connections_responder_id ON public.connections(responder_id);
CREATE INDEX IF NOT EXISTS idx_connections_status ON public.connections(status);

-- =============================================================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.connections ENABLE ROW LEVEL SECURITY;

-- PROFILES POLICIES
-- Anyone authenticated can read profiles
CREATE POLICY "Profiles are viewable by authenticated users"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

-- Users can only update their own profile
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can insert their own profile
CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- PROJECTS POLICIES
-- Anyone authenticated can view open projects
CREATE POLICY "Projects are viewable by authenticated users"
  ON public.projects FOR SELECT
  TO authenticated
  USING (true);

-- Only poster can create projects (poster_id must match auth.uid())
CREATE POLICY "Posters can create projects"
  ON public.projects FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = poster_id);

-- Only poster can update their own projects
CREATE POLICY "Posters can update own projects"
  ON public.projects FOR UPDATE
  TO authenticated
  USING (auth.uid() = poster_id)
  WITH CHECK (auth.uid() = poster_id);

-- Only poster can delete their own projects
CREATE POLICY "Posters can delete own projects"
  ON public.projects FOR DELETE
  TO authenticated
  USING (auth.uid() = poster_id);

-- CONNECTIONS POLICIES
-- Posters can view connections for their projects, responders can view their own
CREATE POLICY "Users can view relevant connections"
  ON public.connections FOR SELECT
  TO authenticated
  USING (auth.uid() = poster_id OR auth.uid() = responder_id);

-- Responders can create connections (apply to projects)
CREATE POLICY "Responders can apply to projects"
  ON public.connections FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = responder_id);

-- Posters can update connection status (accept/decline)
CREATE POLICY "Posters can update connection status"
  ON public.connections FOR UPDATE
  TO authenticated
  USING (auth.uid() = poster_id)
  WITH CHECK (auth.uid() = poster_id);

-- =============================================================================
-- FUNCTIONS
-- =============================================================================

-- Function to get matched profiles for a project based on skills overlap
CREATE OR REPLACE FUNCTION get_matches_for_project(project_uuid UUID)
RETURNS TABLE (
  profile_id UUID,
  user_id UUID,
  name TEXT,
  role_type TEXT,
  bio TEXT,
  location TEXT,
  availability TEXT,
  skills TEXT[],
  verified BOOLEAN,
  credentials_url TEXT,
  avatar_url TEXT,
  matched_skills TEXT[],
  match_score INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id AS profile_id,
    p.user_id,
    p.name,
    p.role_type,
    p.bio,
    p.location,
    p.availability,
    p.skills,
    p.verified,
    p.credentials_url,
    p.avatar_url,
    (p.skills & proj.skills_needed) AS matched_skills,
    COALESCE(array_length(p.skills & proj.skills_needed, 1), 0) AS match_score
  FROM public.profiles p
  CROSS JOIN public.projects proj
  WHERE proj.id = project_uuid
    AND p.skills && proj.skills_needed
  ORDER BY 
    p.verified DESC,
    COALESCE(array_length(p.skills & proj.skills_needed, 1), 0) DESC
  LIMIT 50;
END;
$$;

-- Function to get matching projects for a user based on their skills
CREATE OR REPLACE FUNCTION get_projects_for_user(profile_user_id UUID)
RETURNS TABLE (
  project_id UUID,
  poster_id UUID,
  title TEXT,
  type TEXT,
  focus_area TEXT[],
  location TEXT,
  region TEXT,
  description TEXT,
  volunteers_needed INTEGER,
  professionals_needed INTEGER,
  skills_needed TEXT[],
  status TEXT,
  duration TEXT,
  start_date DATE,
  points INTEGER,
  created_at TIMESTAMPTZ,
  matched_skills TEXT[],
  match_score INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    proj.id AS project_id,
    proj.poster_id,
    proj.title,
    proj.type,
    proj.focus_area,
    proj.location,
    proj.region,
    proj.description,
    proj.volunteers_needed,
    proj.professionals_needed,
    proj.skills_needed,
    proj.status,
    proj.duration,
    proj.start_date,
    proj.points,
    proj.created_at,
    (prof.skills & proj.skills_needed) AS matched_skills,
    COALESCE(array_length(prof.skills & proj.skills_needed, 1), 0) AS match_score
  FROM public.projects proj
  CROSS JOIN public.profiles prof
  WHERE prof.user_id = profile_user_id
    AND proj.status = 'open'
    AND prof.skills && proj.skills_needed
  ORDER BY 
    (CASE WHEN proj.type = 'urgent' THEN 0 ELSE 1 END),
    COALESCE(array_length(prof.skills & proj.skills_needed, 1), 0) DESC,
    proj.created_at DESC
  LIMIT 50;
END;
$$;

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_connections_updated_at
  BEFORE UPDATE ON public.connections
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- AUTO-CREATE PROFILE ON USER SIGNUP
-- =============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, name, role_type)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'user_type', 'volunteer')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-create profile on signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
