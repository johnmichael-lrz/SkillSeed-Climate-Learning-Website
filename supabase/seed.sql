-- SkillSeed Demo Seed Data
-- Run this after creating the schema migration
-- =============================================================================

-- =============================================================================
-- DISABLE FOREIGN KEY CONSTRAINTS FOR DEMO DATA
-- =============================================================================
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_user_id_fkey;
ALTER TABLE public.projects DROP CONSTRAINT IF EXISTS projects_poster_id_fkey;
ALTER TABLE public.connections DROP CONSTRAINT IF EXISTS connections_poster_id_fkey;
ALTER TABLE public.connections DROP CONSTRAINT IF EXISTS connections_responder_id_fkey;
ALTER TABLE public.connections DROP CONSTRAINT IF EXISTS connections_project_id_fkey;

-- =============================================================================
-- DEMO PROFILES
-- =============================================================================

-- Demo Responder Profiles (volunteers/professionals)
INSERT INTO public.profiles (id, user_id, name, org_name, org_type, role_type, bio, location, availability, skills, verified, credentials_url, avatar_url) VALUES
-- Verified Professionals
('11111111-1111-1111-1111-111111111111', '11111111-0000-0000-0000-000000000001', 
 'Dr. Sarah Chen', 'Stanford Climate Lab', 'academic', 'professional',
 'Climate scientist with 10+ years experience in carbon sequestration research and policy development.',
 'San Francisco, CA', 'part-time',
 ARRAY['climate science', 'data analysis', 'research', 'policy development', 'carbon accounting'],
 true, 'https://linkedin.com/in/sarahchen', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah'),

('11111111-1111-1111-1111-111111111112', '11111111-0000-0000-0000-000000000002',
 'Marcus Johnson', 'Green Energy Solutions', 'private', 'professional',
 'Renewable energy engineer specializing in solar and wind installations for underserved communities.',
 'Austin, TX', 'full-time',
 ARRAY['renewable energy', 'solar installation', 'project management', 'community engagement', 'electrical engineering'],
 true, 'https://linkedin.com/in/marcusjohnson', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Marcus'),

('11111111-1111-1111-1111-111111111113', '11111111-0000-0000-0000-000000000003',
 'Aisha Patel', 'EcoDesign Studio', 'private', 'professional',
 'UX designer passionate about creating accessible climate education platforms and environmental apps.',
 'New York, NY', 'flexible',
 ARRAY['UX design', 'UI design', 'user research', 'accessibility', 'prototyping', 'figma'],
 true, 'https://aishapatel.design', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Aisha'),

('11111111-1111-1111-1111-111111111114', '11111111-0000-0000-0000-000000000004',
 'Dr. James Okonkwo', 'African Climate Foundation', 'nonprofit', 'professional',
 'Environmental economist focusing on climate finance and green investment strategies for Africa.',
 'Lagos, Nigeria', 'part-time',
 ARRAY['climate finance', 'economics', 'policy development', 'grant writing', 'stakeholder management'],
 true, 'https://linkedin.com/in/jamesokonkwo', 'https://api.dicebear.com/7.x/avataaars/svg?seed=James'),

('11111111-1111-1111-1111-111111111115', '11111111-0000-0000-0000-000000000005',
 'Emma Rodriguez', 'City of Seattle', 'government', 'professional',
 'Urban planner specializing in green infrastructure and climate-resilient city design.',
 'Seattle, WA', 'weekends',
 ARRAY['urban planning', 'GIS mapping', 'green infrastructure', 'stakeholder management', 'community engagement'],
 true, 'https://linkedin.com/in/emmarodriguez', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Emma'),

-- Verified Volunteers
('11111111-1111-1111-1111-111111111116', '11111111-0000-0000-0000-000000000006',
 'Tyler Brooks', NULL, NULL, 'volunteer',
 'Marketing professional volunteering to help climate organizations with communications and outreach.',
 'Denver, CO', 'weekends',
 ARRAY['social media', 'marketing', 'content creation', 'communications', 'copywriting'],
 true, NULL, 'https://api.dicebear.com/7.x/avataaars/svg?seed=Tyler'),

('11111111-1111-1111-1111-111111111117', '11111111-0000-0000-0000-000000000007',
 'Sofia Andersen', NULL, NULL, 'volunteer',
 'Data analyst eager to apply skills to environmental monitoring and climate impact assessment.',
 'Chicago, IL', 'flexible',
 ARRAY['data analysis', 'python', 'excel', 'visualization', 'statistics'],
 true, NULL, 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sofia'),

-- Students
('11111111-1111-1111-1111-111111111118', '11111111-0000-0000-0000-000000000008',
 'Alex Kim', 'UC Berkeley', 'academic', 'student',
 'Environmental science major seeking hands-on experience in conservation and sustainability projects.',
 'Berkeley, CA', 'part-time',
 ARRAY['research', 'field work', 'data collection', 'report writing', 'GIS mapping'],
 false, NULL, 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex'),

('11111111-1111-1111-1111-111111111119', '11111111-0000-0000-0000-000000000009',
 'Priya Sharma', 'MIT', 'academic', 'student',
 'Computer science student interested in applying ML/AI to climate modeling and prediction.',
 'Boston, MA', 'part-time',
 ARRAY['machine learning', 'python', 'data analysis', 'climate modeling', 'research'],
 false, NULL, 'https://api.dicebear.com/7.x/avataaars/svg?seed=Priya'),

('11111111-1111-1111-1111-111111111120', '11111111-0000-0000-0000-000000000010',
 'Jordan Williams', 'Howard University', 'academic', 'student',
 'Environmental justice advocate studying the intersection of climate change and social equity.',
 'Washington, DC', 'flexible',
 ARRAY['community engagement', 'research', 'advocacy', 'event planning', 'public speaking'],
 false, NULL, 'https://api.dicebear.com/7.x/avataaars/svg?seed=Jordan'),

-- Non-verified Professionals
('11111111-1111-1111-1111-111111111121', '11111111-0000-0000-0000-000000000011',
 'Michael Torres', 'Freelance', NULL, 'professional',
 'Full-stack developer interested in building climate tech applications and environmental monitoring tools.',
 'Miami, FL', 'full-time',
 ARRAY['web development', 'react', 'node.js', 'database design', 'API development'],
 false, 'https://github.com/migueltorres', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Michael'),

('11111111-1111-1111-1111-111111111122', '11111111-0000-0000-0000-000000000012',
 'Lisa Chang', 'GreenTech Consulting', 'private', 'professional',
 'Project manager with experience leading sustainability initiatives and carbon reduction programs.',
 'Portland, OR', 'part-time',
 ARRAY['project management', 'sustainability', 'carbon accounting', 'stakeholder management', 'reporting'],
 false, NULL, 'https://api.dicebear.com/7.x/avataaars/svg?seed=Lisa'),

-- More Volunteers
('11111111-1111-1111-1111-111111111123', '11111111-0000-0000-0000-000000000013',
 'David Osei', NULL, NULL, 'volunteer',
 'Photographer documenting climate impact and environmental conservation efforts worldwide.',
 'Accra, Ghana', 'flexible',
 ARRAY['photography', 'videography', 'storytelling', 'content creation', 'field work'],
 true, 'https://davidoseiphoto.com', 'https://api.dicebear.com/7.x/avataaars/svg?seed=David'),

('11111111-1111-1111-1111-111111111124', '11111111-0000-0000-0000-000000000014',
 'Maria Santos', NULL, NULL, 'volunteer',
 'Bilingual community organizer experienced in grassroots environmental justice campaigns.',
 'Los Angeles, CA', 'weekends',
 ARRAY['community engagement', 'translation', 'event planning', 'advocacy', 'outreach'],
 true, NULL, 'https://api.dicebear.com/7.x/avataaars/svg?seed=Maria'),

('11111111-1111-1111-1111-111111111125', '11111111-0000-0000-0000-000000000015',
 'Hannah Mueller', NULL, NULL, 'volunteer',
 'Grant writer and fundraiser supporting environmental nonprofits and climate initiatives.',
 'Minneapolis, MN', 'part-time',
 ARRAY['grant writing', 'fundraising', 'communications', 'research', 'reporting'],
 false, NULL, 'https://api.dicebear.com/7.x/avataaars/svg?seed=Hannah')

ON CONFLICT (id) DO NOTHING;


-- =============================================================================
-- DEMO PROJECTS
-- =============================================================================

INSERT INTO public.projects (id, poster_id, title, type, focus_area, location, region, description, volunteers_needed, professionals_needed, skills_needed, status, duration, start_date, points) VALUES

-- Urgent Projects
('22222222-2222-2222-2222-222222222201', '11111111-0000-0000-0000-000000000001',
 'Emergency Flood Response Data Collection', 'urgent',
 ARRAY['disaster response', 'climate adaptation'],
 'Houston, TX', 'North America',
 'Urgent need for volunteers to help collect and analyze flood damage data following recent storms. Data will inform city resilience planning and aid distribution.',
 5, 2,
 ARRAY['data collection', 'field work', 'GIS mapping', 'data analysis', 'community engagement'],
 'open', '2 weeks', '2026-03-10', 250),

('22222222-2222-2222-2222-222222222202', '11111111-0000-0000-0000-000000000002',
 'Solar Panel Installation - Community Center', 'urgent',
 ARRAY['renewable energy', 'community resilience'],
 'Oakland, CA', 'North America',
 'Installing solar panels at a community center serving as a cooling/warming shelter. Need electricians and helpers for weekend installation.',
 3, 1,
 ARRAY['solar installation', 'electrical engineering', 'project management'],
 'open', '1 weekend', '2026-03-15', 200),

-- Regular Projects
('22222222-2222-2222-2222-222222222203', '11111111-0000-0000-0000-000000000003',
 'Climate Education App for Youth', 'project',
 ARRAY['education', 'climate literacy'],
 'Remote', 'Global',
 'Developing an interactive mobile app teaching climate science concepts to middle school students. Need UX designers, developers, and climate educators.',
 2, 3,
 ARRAY['UX design', 'UI design', 'react', 'education', 'content creation'],
 'open', '3 months', '2026-04-01', 300),

('22222222-2222-2222-2222-222222222204', '11111111-0000-0000-0000-000000000004',
 'African Climate Finance Research Report', 'project',
 ARRAY['climate finance', 'policy'],
 'Remote', 'Africa',
 'Research project analyzing green finance flows in Sub-Saharan Africa. Looking for researchers and data analysts to compile a comprehensive report.',
 1, 2,
 ARRAY['research', 'data analysis', 'climate finance', 'report writing', 'economics'],
 'open', '2 months', '2026-03-20', 350),

('22222222-2222-2222-2222-222222222205', '11111111-0000-0000-0000-000000000005',
 'Urban Forest Mapping Initiative', 'project',
 ARRAY['urban planning', 'conservation'],
 'Seattle, WA', 'North America',
 'Mapping urban tree coverage to identify areas for new planting and assess carbon sequestration potential. GIS skills essential.',
 4, 1,
 ARRAY['GIS mapping', 'data collection', 'field work', 'data analysis', 'urban planning'],
 'open', '6 weeks', '2026-04-15', 200),

('22222222-2222-2222-2222-222222222206', '11111111-0000-0000-0000-000000000001',
 'Carbon Footprint Calculator Tool', 'project',
 ARRAY['carbon accounting', 'technology'],
 'Remote', 'Global',
 'Building an open-source carbon footprint calculator for small businesses. Need developers and carbon accounting experts.',
 2, 2,
 ARRAY['web development', 'react', 'carbon accounting', 'UX design', 'API development'],
 'open', '2 months', '2026-04-01', 280),

('22222222-2222-2222-2222-222222222207', '11111111-0000-0000-0000-000000000002',
 'Community Solar Workshop Series', 'project',
 ARRAY['renewable energy', 'education'],
 'Austin, TX', 'North America',
 'Organizing monthly workshops teaching community members about solar energy basics and installation. Need presenters and event coordinators.',
 5, 1,
 ARRAY['renewable energy', 'public speaking', 'event planning', 'community engagement', 'education'],
 'open', 'ongoing', '2026-03-25', 150),

('22222222-2222-2222-2222-222222222208', '11111111-0000-0000-0000-000000000004',
 'Climate Storytelling Documentary', 'project',
 ARRAY['communications', 'advocacy'],
 'Multiple locations', 'Africa',
 'Producing a documentary highlighting climate change impacts on African communities. Need filmmakers, photographers, and storytellers.',
 3, 2,
 ARRAY['videography', 'photography', 'storytelling', 'content creation', 'translation'],
 'open', '4 months', '2026-05-01', 400),

('22222222-2222-2222-2222-222222222209', '11111111-0000-0000-0000-000000000003',
 'Sustainable Fashion Impact Report', 'project',
 ARRAY['sustainability', 'research'],
 'Remote', 'Global',
 'Research project quantifying the environmental impact of fast fashion and developing sustainability guidelines for consumers.',
 2, 1,
 ARRAY['research', 'data analysis', 'report writing', 'sustainability', 'communications'],
 'open', '6 weeks', '2026-04-10', 180),

('22222222-2222-2222-2222-222222222210', '11111111-0000-0000-0000-000000000005',
 'Green Infrastructure Grant Proposal', 'project',
 ARRAY['green infrastructure', 'funding'],
 'Seattle, WA', 'North America',
 'Writing a federal grant proposal for green stormwater infrastructure projects. Need experienced grant writers and project planners.',
 1, 2,
 ARRAY['grant writing', 'green infrastructure', 'project management', 'stakeholder management', 'reporting'],
 'open', '1 month', '2026-03-18', 220)

ON CONFLICT (id) DO NOTHING;


-- =============================================================================
-- DEMO CONNECTIONS (Sample matches/applications)
-- =============================================================================

INSERT INTO public.connections (id, project_id, poster_id, responder_id, role, message, status, match_score) VALUES

-- Accepted connections
('33333333-3333-3333-3333-333333333301',
 '22222222-2222-2222-2222-222222222201', -- Flood Response
 '11111111-0000-0000-0000-000000000001', -- Poster
 '11111111-0000-0000-0000-000000000007', -- Sofia (data analyst)
 'volunteer',
 'I have experience with data analysis and would love to help with flood damage assessment.',
 'accepted', 3),

('33333333-3333-3333-3333-333333333302',
 '22222222-2222-2222-2222-222222222203', -- Climate Education App
 '11111111-0000-0000-0000-000000000003', -- Poster
 '11111111-0000-0000-0000-000000000011', -- Michael (developer)
 'professional',
 'Full-stack developer with React experience. Excited about climate education!',
 'accepted', 2),

-- Pending connections
('33333333-3333-3333-3333-333333333303',
 '22222222-2222-2222-2222-222222222205', -- Urban Forest Mapping
 '11111111-0000-0000-0000-000000000005', -- Poster
 '11111111-0000-0000-0000-000000000008', -- Alex (student with GIS)
 'volunteer',
 'Environmental science student with GIS experience. Looking to gain field experience.',
 'pending', 2),

('33333333-3333-3333-3333-333333333304',
 '22222222-2222-2222-2222-222222222208', -- Documentary
 '11111111-0000-0000-0000-000000000004', -- Poster
 '11111111-0000-0000-0000-000000000013', -- David (photographer)
 'volunteer',
 'Professional photographer with climate documentation experience in West Africa.',
 'pending', 4),

('33333333-3333-3333-3333-333333333305',
 '22222222-2222-2222-2222-222222222210', -- Grant Proposal
 '11111111-0000-0000-0000-000000000005', -- Poster
 '11111111-0000-0000-0000-000000000015', -- Hannah (grant writer)
 'volunteer',
 'Experienced grant writer for environmental nonprofits. Have written successful EPA grants.',
 'pending', 2),

-- Sample declined
('33333333-3333-3333-3333-333333333306',
 '22222222-2222-2222-2222-222222222202', -- Solar Installation
 '11111111-0000-0000-0000-000000000002', -- Poster
 '11111111-0000-0000-0000-000000000008', -- Alex (no electrical skills)
 'volunteer',
 'Interested in learning about solar installation.',
 'declined', 0)

ON CONFLICT (id) DO NOTHING;


-- =============================================================================
-- USEFUL QUERIES FOR TESTING
-- =============================================================================

-- Test: Get all matched profiles for a project
-- SELECT * FROM get_matches_for_project('22222222-2222-2222-2222-222222222201');

-- Test: Get all matching projects for a user
-- SELECT * FROM get_projects_for_user('11111111-0000-0000-0000-000000000007');

-- Test: View all profiles with skills
-- SELECT name, role_type, skills, verified FROM profiles ORDER BY verified DESC;

-- Test: View all open projects
-- SELECT title, type, skills_needed, status FROM projects WHERE status = 'open';

-- Test: View connection status
-- SELECT p.title, pr.name as responder, c.status, c.match_score 
-- FROM connections c 
-- JOIN projects p ON c.project_id = p.id 
-- JOIN profiles pr ON c.responder_id = pr.user_id;
