import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router";
import {
  MapPin,
  Clock,
  Users,
  Star,
  AlertTriangle,
  CheckCircle,
  ArrowLeft,
  Leaf,
  Calendar,
  Target,
  Award,
  ChevronRight,
  Share2,
  Bookmark,
  Building2,
  Zap,
  Loader2,
  Trash2,
} from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { getProjectById, applyToProject, getConnectionsForProject, updateConnectionStatus, deleteProject } from "../utils/matchService";
import { supabase } from "../utils/supabase";
import type { ConnectionStatus, Project, ConnectionWithDetails } from "../types/database";

const missionsData: Record<string, any> = {
  "urban-garden": {
    title: "Urban Rooftop Garden Setup",
    org: "GreenCity Initiative",
    orgType: "NGO",
    location: "Manila, NCR",
    region: "Luzon",
    category: "Urban Farming",
    difficulty: "Beginner",
    duration: "4 weeks",
    startDate: "March 15, 2026",
    points: 150,
    volunteers: 12,
    volunteersNeeded: 20,
    professionals: 2,
    professionalsNeeded: 3,
    urgent: false,
    image: "https://images.unsplash.com/photo-1763897710760-2d47e1fa69ee?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1200",
    description: `Transform unused rooftop spaces into thriving urban gardens that feed communities and restore biodiversity. This mission teaches you the practical skills needed to design, build, and maintain productive rooftop gardens in urban environments.

You'll work alongside experienced urban farmers and permaculture designers to understand companion planting, soil health management, rainwater collection, and organic pest control. By the end of this mission, you'll have completed a real rooftop garden installation that benefits at least 10 families.`,
    outcomes: [
      "Design and install a rooftop garden layout",
      "Learn companion planting and soil science",
      "Master composting and organic waste recycling",
      "Set up rainwater collection systems",
      "Document and share your results with the community",
    ],
    skills: ["Urban Farming", "Composting", "Soil Science", "Community Organising"],
    volunteerSkills: ["Teaching", "Community Organising", "Urban Farming"],
    professionalSkills: ["Soil Science", "GIS Mapping", "Agriculture"],
    verified: true,
    color: "bg-emerald-100 text-emerald-700",
  },
  "solar-install": {
    title: "Community Solar Panel Installation",
    org: "SolarPH Foundation",
    orgType: "Private",
    location: "Cebu City, Cebu",
    region: "Visayas",
    category: "Energy Saving",
    difficulty: "Intermediate",
    duration: "6 weeks",
    startDate: "March 22, 2026",
    points: 250,
    volunteers: 8,
    volunteersNeeded: 15,
    professionals: 4,
    professionalsNeeded: 5,
    urgent: true,
    image: "https://images.unsplash.com/photo-1626793369994-a904d2462888?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1200",
    description: `Join a ground-breaking community solar energy project that will bring clean power to 50 low-income households in Cebu City. This is an urgent mission — we need skilled volunteers and professionals to start immediately.

You'll receive hands-on training in photovoltaic system design, safe installation practices, and electrical wiring. Our expert facilitators include licensed electrical engineers and certified solar technicians. No prior experience required for volunteer roles, but enthusiasm and safety-mindedness are essential.`,
    outcomes: [
      "Install solar panels on 5+ household rooftops",
      "Learn PV system design and sizing",
      "Practice safety protocols for electrical work",
      "Conduct energy audits for beneficiary households",
      "Earn a SkillSeed Solar Basics certification",
    ],
    skills: ["Solar Installation", "Electrical", "Energy Audit"],
    volunteerSkills: ["Construction", "Teaching", "Community Organising"],
    professionalSkills: ["Solar Installation", "Electrical", "Engineering"],
    verified: true,
    color: "bg-amber-100 text-amber-700",
  },
  "repair-skills": {
    title: "Repair Café & Reuse Workshop",
    org: "Zero Waste Collective",
    orgType: "Community Group",
    location: "Davao City, Mindanao",
    region: "Mindanao",
    category: "Repair Skills",
    difficulty: "Beginner",
    duration: "2 weeks",
    startDate: "April 1, 2026",
    points: 100,
    volunteers: 18,
    volunteersNeeded: 25,
    professionals: 1,
    professionalsNeeded: 2,
    urgent: false,
    image: "https://images.unsplash.com/photo-1585406666850-82f7532fdae3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1200",
    description: `Every repaired item is a small victory against waste. This mission teaches basic repair skills for everyday items — appliances, clothing, bicycles, and furniture — and empowers communities to reduce their waste footprint significantly.

You'll host and facilitate a Repair Café where community members bring broken items to fix together. Our skilled mentors will guide you through diagnostic techniques, safe disassembly, and repair methods for common household items.`,
    outcomes: [
      "Repair 20+ household items during the workshop",
      "Learn appliance diagnostics and basic electronics",
      "Practice sewing and textile repair",
      "Facilitate a community repair event",
      "Create a local repair skills network",
    ],
    skills: ["Repair", "Waste Reduction", "Teaching", "Construction"],
    volunteerSkills: ["Teaching", "Community Organising", "Construction"],
    professionalSkills: ["Repair", "Electronics", "Mechanical"],
    verified: false,
    color: "bg-blue-100 text-blue-700",
  },
  "reforestation": {
    title: "Coastal Reforestation Drive",
    org: "Forest Foundation PH",
    orgType: "NGO",
    location: "Surigao del Norte, Caraga",
    region: "Caraga",
    category: "Reforestation",
    difficulty: "All Levels",
    duration: "8 weeks",
    startDate: "April 5, 2026",
    points: 300,
    volunteers: 45,
    volunteersNeeded: 60,
    professionals: 3,
    professionalsNeeded: 5,
    urgent: true,
    image: "https://images.unsplash.com/photo-1752169580565-c2515f8973f1?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1200",
    description: `Join the Philippines' largest coastal reforestation initiative in Surigao del Norte. We're restoring 200 hectares of mangrove forest that was destroyed by Typhoon Odette, protecting communities from storm surges and restoring vital marine ecosystems.

This mission is open to all skill levels. Whether you're a forestry professional or a first-time volunteer, you'll play a meaningful role. Training is provided on-site by certified foresters and marine biologists.`,
    outcomes: [
      "Plant 500+ mangrove seedlings",
      "Learn species identification and ecosystem mapping",
      "Practice GIS-based monitoring techniques",
      "Document biodiversity recovery data",
      "Contribute to a 5-year restoration monitoring program",
    ],
    skills: ["Forestry", "GIS Mapping", "Soil Science", "Community Organising"],
    volunteerSkills: ["Community Organising", "Teaching", "Agriculture"],
    professionalSkills: ["Forestry", "GIS Mapping", "Marine", "Soil Science"],
    verified: true,
    color: "bg-green-100 text-green-700",
  },
};



export function MissionDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  
  // Try to get mock mission data for display fallback
  const mockMission = missionsData[id || "urban-garden"] || missionsData["urban-garden"];

  const [activeRole, setActiveRole] = useState<"volunteer" | "professional">("volunteer");
  const [motivation, setMotivation] = useState("");
  const [availability, setAvailability] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [myApplicationStatus, setMyApplicationStatus] = useState<ConnectionStatus | null>(null);
  const [saved, setSaved] = useState(false);
  const [dbProject, setDbProject] = useState<Project | null>(null);
  const [applicants, setApplicants] = useState<ConnectionWithDetails[]>([]);
  const [applicantsLoading, setApplicantsLoading] = useState(false);
  const [showApplicants, setShowApplicants] = useState(false);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [applyError, setApplyError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [relatedProjects, setRelatedProjects] = useState<Project[]>([]);
  const [relatedLoading, setRelatedLoading] = useState(false);

  // Ownership check using useAuth user.id directly
  const isOwner = user && dbProject && String(dbProject.poster_id) === String(user.id);

  // Fetch project from database
  useEffect(() => {
    async function fetchData() {
      if (!id) {
        setLoading(false);
        return;
      }

      // Check if ID looks like a UUID (database project)
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
      
      if (isUUID) {
        const project = await getProjectById(id);
        setDbProject(project);

        // Fetch related projects based on focus_area and skills_needed
        if (project) {
          setRelatedLoading(true);
          try {
            const candidates = await getProjects({
              focus_area: project.focus_area?.length ? project.focus_area : undefined,
              status: 'open',
            });
            // Exclude the current project, limit to 3
            const filtered = candidates
              .filter((p) => p.id !== project.id)
              .slice(0, 3);
            setRelatedProjects(filtered);
          } catch (err) {
            console.error('Error fetching related projects:', err);
          } finally {
            setRelatedLoading(false);
          }
        }
      }
      
      setLoading(false);
    }

    fetchData();
  }, [id]);

  // Fetch the current user's application status for this project (responder view).
  useEffect(() => {
    async function fetchMyApplicationStatus() {
      if (!dbProject?.id || !user) {
        setMyApplicationStatus(null);
        return;
      }

      const { data, error } = await supabase
        .from("connections")
        .select("status")
        .eq("project_id", dbProject.id)
        .eq("responder_id", user.id)
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          setMyApplicationStatus(null);
          return;
        }
        console.warn("Failed to fetch my application status:", error);
        setMyApplicationStatus(null);
        return;
      }

      setMyApplicationStatus((data?.status ?? null) as ConnectionStatus | null);
    }

    fetchMyApplicationStatus();
  }, [dbProject?.id, user]);

  // Fetch applicants when owner clicks "View Applicants"
  const fetchApplicants = async () => {
    if (!dbProject?.id) return;
    setApplicantsLoading(true);
    try {
      const connections = await getConnectionsForProject(dbProject.id);
      setApplicants(connections);
    } catch (err) {
      console.error('Error fetching applicants:', err);
    } finally {
      setApplicantsLoading(false);
    }
  };

  // Handle accept/decline applicant
  const handleApplicantAction = async (connectionId: string, action: 'accepted' | 'declined') => {
    const updated = await updateConnectionStatus(connectionId, action);
    if (updated) {
      setApplicants(prev => prev.map(a => a.id === connectionId ? { ...a, status: action } : a));
    }
  };

  // Handle delete project
  const handleDelete = async () => {
    if (!dbProject?.id) return;
    if (!confirm('Are you sure you want to delete this project? This cannot be undone.')) return;
    
    setDeleting(true);
    const success = await deleteProject(dbProject.id);
    setDeleting(false);
    
    if (success) {
      navigate('/missions?tab=my');
    } else {
      alert('Failed to delete project. Please try again.');
    }
  };

  // Build a unified mission object (prefer database, fallback to mock)
  const mission = dbProject ? {
    id: dbProject.id,
    title: dbProject.title,
    org: "SkillSeed Project", // DB doesn't store org name directly
    orgType: dbProject.type === 'urgent' ? 'Urgent' : 'Project',
    location: dbProject.location || 'Remote',
    region: dbProject.region || 'Global',
    category: dbProject.focus_area?.[0] || 'Climate Action',
    difficulty: 'All Levels',
    duration: dbProject.duration || 'Flexible',
    startDate: dbProject.start_date ? new Date(dbProject.start_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'TBD',
    points: dbProject.points,
    volunteers: 0, // Would need to query connections
    volunteersNeeded: dbProject.volunteers_needed,
    professionals: 0,
    professionalsNeeded: dbProject.professionals_needed,
    urgent: dbProject.type === 'urgent',
    image: 'https://images.unsplash.com/photo-1559027615-cd4628902d4a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1200',
    description: dbProject.description || 'Join this climate action project and make a difference.',
    outcomes: [
      'Contribute to real climate impact',
      'Gain hands-on experience',
      'Connect with like-minded individuals',
      'Earn impact points and recognition',
    ],
    skills: dbProject.skills_needed || [],
    volunteerSkills: dbProject.skills_needed?.slice(0, 3) || [],
    professionalSkills: dbProject.skills_needed || [],
    verified: true,
    color: dbProject.type === 'urgent' ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700',
  } : mockMission;

  // Redirect to auth if not logged in
  const requireAuth = (action: () => void) => {
    if (!user) {
      navigate("/auth");
      return;
    }
    action();
  };

  const handleSave = () => {
    requireAuth(() => setSaved(!saved));
  };

  const handleShare = () => {
    requireAuth(() => {
      // Share functionality - for now just copy URL
      navigator.clipboard.writeText(window.location.href);
      alert("Mission link copied to clipboard!");
    });
  };

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    setApplyError(null);

    if (!user) {
      navigate("/auth");
      return;
    }

    // Must have a real database project to apply
    if (!dbProject) {
      setApplyError("This is a demo mission. Please browse real projects to apply.");
      return;
    }

    // Block applying to your own project
    if (isOwner) {
      setApplyError("You can't apply to your own project.");
      return;
    }

    // If we already detected an existing application, don't allow duplicate submits.
    if (myApplicationStatus) {
      setApplyError(
        `You already have an application with status: ${myApplicationStatus}.`
      );
      return;
    }

    setApplying(true);

    try {
      const result = await applyToProject(
        dbProject.id,
        activeRole,
        motivation || undefined
      );

      if (result.connection) {
        setSubmitted(true);
        setMyApplicationStatus((result.connection.status ?? "pending") as ConnectionStatus);
      } else {
        setApplyError(result.error || "Failed to submit application.");
      }
    } catch (error) {
      console.error('Error applying to project:', error);
      setApplyError("An error occurred while submitting your application. Please try again.");
    } finally {
      setApplying(false);
    }
  };

  // Loading state
  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-[#F9FDFB] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-[#2F8F6B]" />
          <p className="text-gray-500">Loading mission details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F9FDFB]">
      {/* Hero Image */}
      <div className="relative h-64 md:h-80 overflow-hidden">
        <img src={mission.image} alt={mission.title} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0F3D2E]/80 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-6">
          <div className="max-w-7xl mx-auto">
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-1.5 text-white/80 hover:text-white text-sm font-medium mb-3 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Missions
            </Link>
            <div className="flex flex-wrap items-center gap-2">
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${mission.color}`}>
                {mission.category}
              </span>
              {mission.urgent && (
                <span className="flex items-center gap-1 bg-red-500 text-white text-xs font-bold px-2.5 py-1 rounded-full">
                  <AlertTriangle className="w-3 h-3" />
                  URGENT
                </span>
              )}
              {mission.verified && (
                <span className="flex items-center gap-1 bg-white/20 backdrop-blur text-white text-xs font-medium px-2.5 py-1 rounded-full">
                  <CheckCircle className="w-3 h-3" />
                  Verified Organisation
                </span>
              )}
            </div>
            <h1 className="text-white font-[Manrope] font-bold text-2xl md:text-3xl mt-2">{mission.title}</h1>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Meta card */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-[#E6F4EE] rounded-xl flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-[#2F8F6B]" />
                </div>
                <div>
                  <p className="font-semibold text-[#0F3D2E]">{mission.org}</p>
                  <p className="text-xs text-gray-500">{mission.orgType}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                  { icon: <MapPin className="w-4 h-4" />, label: "Location", value: mission.location },
                  { icon: <Calendar className="w-4 h-4" />, label: "Start Date", value: mission.startDate },
                  { icon: <Clock className="w-4 h-4" />, label: "Duration", value: mission.duration },
                  { icon: <Zap className="w-4 h-4" />, label: "Difficulty", value: mission.difficulty },
                ].map(item => (
                  <div key={item.label} className="text-center">
                    <div className="flex items-center justify-center gap-1 text-gray-400 mb-0.5">
                      {item.icon}
                      <span className="text-xs">{item.label}</span>
                    </div>
                    <p className="font-semibold text-[#0F3D2E] text-sm">{item.value}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Description */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h2 className="font-[Manrope] font-bold text-[#0F3D2E] text-xl mb-4">About this Mission</h2>
              <div className="text-gray-600 text-sm leading-relaxed whitespace-pre-line">
                {mission.description}
              </div>
            </div>

            {/* What you'll do */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h2 className="font-[Manrope] font-bold text-[#0F3D2E] text-xl mb-4">
                <span className="flex items-center gap-2"><Target className="w-5 h-5 text-[#2F8F6B]" /> What You'll Accomplish</span>
              </h2>
              <ul className="space-y-3">
                {mission.outcomes.map((outcome: string, i: number) => (
                  <li key={i} className="flex items-start gap-3">
                    <div className="w-5 h-5 bg-[#E6F4EE] rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <CheckCircle className="w-3 h-3 text-[#2F8F6B]" />
                    </div>
                    <span className="text-gray-600 text-sm">{outcome}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* People needed */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h2 className="font-[Manrope] font-bold text-[#0F3D2E] text-xl mb-4">
                <span className="flex items-center gap-2"><Users className="w-5 h-5 text-[#2F8F6B]" /> People Needed</span>
              </h2>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="bg-[#F9FDFB] rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-[#0F3D2E] text-sm">Volunteers</span>
                    <span className="text-sm font-bold text-[#2F8F6B]">{mission.volunteers}/{mission.volunteersNeeded} joined</span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full mb-3">
                    <div className="h-full bg-[#2F8F6B] rounded-full" style={{ width: `${(mission.volunteers / mission.volunteersNeeded) * 100}%` }} />
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {mission.volunteerSkills.map((s: string) => (
                      <span key={s} className="text-xs bg-[#E6F4EE] text-[#0F3D2E] px-2 py-0.5 rounded-full">{s}</span>
                    ))}
                  </div>
                </div>
                <div className="bg-[#F9FDFB] rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-[#0F3D2E] text-sm">Professionals</span>
                    <span className="text-sm font-bold text-teal-600">{mission.professionals}/{mission.professionalsNeeded} joined</span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full mb-3">
                    <div className="h-full bg-teal-500 rounded-full" style={{ width: `${(mission.professionals / mission.professionalsNeeded) * 100}%` }} />
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {mission.professionalSkills.map((s: string) => (
                      <span key={s} className="text-xs bg-teal-50 text-teal-700 px-2 py-0.5 rounded-full">{s}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Apply Form / Owner Actions */}
            <div className="bg-white rounded-2xl border border-[#2F8F6B]/20 shadow-sm p-6">
              <h2 className="font-[Manrope] font-bold text-[#0F3D2E] text-xl mb-5">
                {isOwner ? "Manage Your Project" : "Apply to This Mission"}
              </h2>

              {isOwner ? (
                <div className="flex flex-col gap-3">
                  <Link
                    to={`/post-project?edit=${dbProject?.id}`}
                    className="flex-1 flex items-center justify-center gap-2 border-2 border-[#1a3a2a] text-[#1a3a2a] text-sm py-3 rounded-xl hover:bg-green-50 transition font-medium"
                  >
                    ✏️ Edit Project
                  </Link>
                  <button
                    onClick={() => {
                      setShowApplicants(!showApplicants);
                      if (!showApplicants && applicants.length === 0) {
                        fetchApplicants();
                      }
                    }}
                    className="flex-1 flex items-center justify-center gap-2 bg-[#1a3a2a] text-white text-sm py-3 rounded-xl hover:bg-green-900 transition font-medium"
                  >
                    👥 {showApplicants ? 'Hide Applicants' : 'View Applicants'}
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={deleting}
                    className="flex-1 flex items-center justify-center gap-2 border-2 border-red-500 text-red-600 text-sm py-3 rounded-xl hover:bg-red-50 transition font-medium disabled:opacity-50"
                  >
                    {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                    {deleting ? 'Deleting...' : 'Delete Project'}
                  </button>

                  {/* Applicants Section */}
                  {showApplicants && (
                    <div className="mt-4 border-t pt-4">
                      <h3 className="font-semibold text-[#0F3D2E] mb-3">Applicants ({applicants.length})</h3>
                      
                      {applicantsLoading ? (
                        <div className="flex items-center justify-center py-6">
                          <Loader2 className="w-5 h-5 animate-spin text-[#2F8F6B]" />
                          <span className="ml-2 text-gray-500 text-sm">Loading applicants...</span>
                        </div>
                      ) : applicants.length === 0 ? (
                        <div className="text-center py-6 text-gray-500">
                          <Users className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                          <p className="text-sm">No applicants yet</p>
                        </div>
                      ) : (
                        <div className="space-y-3 max-h-80 overflow-y-auto">
                          {applicants.map((applicant) => (
                            <div key={applicant.id} className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 bg-[#2F8F6B] rounded-full flex items-center justify-center text-white font-semibold">
                                    {applicant.responder_profile?.name?.charAt(0) || '?'}
                                  </div>
                                  <div>
                                    <p className="font-medium text-[#0F3D2E]">{applicant.responder_profile?.name || 'Unknown'}</p>
                                    <p className="text-xs text-gray-500 capitalize">{applicant.role} · {applicant.responder_profile?.location || 'No location'}</p>
                                  </div>
                                </div>
                                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                                  applicant.status === 'accepted' ? 'bg-green-100 text-green-700' :
                                  applicant.status === 'declined' ? 'bg-red-100 text-red-700' :
                                  'bg-amber-100 text-amber-700'
                                }`}>
                                  {applicant.status}
                                </span>
                              </div>
                              
                              {applicant.message && (
                                <p className="text-sm text-gray-600 mt-2 bg-white rounded-lg p-2 border border-gray-100">
                                  "{applicant.message}"
                                </p>
                              )}

                              {/* Skills match */}
                              {applicant.responder_profile?.skills && applicant.responder_profile.skills.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-2">
                                  {applicant.responder_profile.skills.slice(0, 4).map(skill => (
                                    <span key={skill} className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">
                                      {skill}
                                    </span>
                                  ))}
                                  {applicant.responder_profile.skills.length > 4 && (
                                    <span className="text-xs text-gray-400">+{applicant.responder_profile.skills.length - 4} more</span>
                                  )}
                                </div>
                              )}

                              {/* Actions for pending applicants */}
                              {applicant.status === 'pending' && (
                                <div className="flex gap-2 mt-3">
                                  <button
                                    onClick={() => handleApplicantAction(applicant.id, 'accepted')}
                                    className="flex-1 bg-green-600 text-white text-xs py-2 rounded-lg hover:bg-green-700 transition font-medium"
                                  >
                                    ✓ Accept
                                  </button>
                                  <button
                                    onClick={() => handleApplicantAction(applicant.id, 'declined')}
                                    className="flex-1 bg-gray-200 text-gray-700 text-xs py-2 rounded-lg hover:bg-gray-300 transition font-medium"
                                  >
                                    ✗ Decline
                                  </button>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : myApplicationStatus ? (
                <div className="text-center py-8">
                  <div
                    className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
                      myApplicationStatus === "accepted"
                        ? "bg-green-50"
                        : myApplicationStatus === "pending"
                        ? "bg-amber-50"
                        : "bg-red-50"
                    }`}
                  >
                    {myApplicationStatus === "accepted" ? (
                      <CheckCircle className="w-8 h-8 text-green-700" />
                    ) : myApplicationStatus === "pending" ? (
                      <AlertTriangle className="w-8 h-8 text-amber-700" />
                    ) : (
                      <AlertTriangle className="w-8 h-8 text-red-700" />
                    )}
                  </div>

                  <h3 className="font-[Manrope] font-bold text-[#0F3D2E] text-xl mb-2">
                    {myApplicationStatus === "accepted"
                      ? "Application Accepted"
                      : myApplicationStatus === "pending"
                      ? "Application Pending"
                      : "Application Declined"}
                  </h3>

                  <p className="text-gray-500 text-sm mb-6">
                    {myApplicationStatus === "accepted"
                      ? "You're connected to this mission. Keep an eye on updates from the organization."
                      : myApplicationStatus === "pending"
                      ? `${mission.org} will review your application and get back to you within 3 business days.`
                      : "This application was declined. You may try again later if the organization re-opens review."}
                  </p>

                  <Link
                    to="/progress"
                    className="text-sm font-semibold text-[#2F8F6B] hover:text-[#0F3D2E] flex items-center justify-center gap-1"
                  >
                    View in My Progress <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
              ) : submitted ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-[#E6F4EE] rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="w-8 h-8 text-[#2F8F6B]" />
                  </div>
                  <h3 className="font-[Manrope] font-bold text-[#0F3D2E] text-xl mb-2">Application Submitted!</h3>
                  <p className="text-gray-500 text-sm mb-6">
                    {mission.org} will review your application and get back to you within 3 business days.
                  </p>
                  <Link to="/progress" className="text-sm font-semibold text-[#2F8F6B] hover:text-[#0F3D2E] flex items-center justify-center gap-1">
                    View in My Progress <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
              ) : (
                <form onSubmit={handleApply} className="space-y-4">
                  {/* Role selector */}
                  <div>
                    <label className="text-sm font-semibold text-[#0F3D2E] block mb-2">
                      I'm applying as a:
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      {(["volunteer", "professional"] as const).map((role) => (
                        <button
                          key={role}
                          type="button"
                          onClick={() => setActiveRole(role)}
                          className={`p-3 rounded-xl border-2 text-sm font-medium capitalize transition-colors ${
                            activeRole === role
                              ? "border-[#2F8F6B] bg-[#E6F4EE] text-[#0F3D2E]"
                              : "border-gray-200 text-gray-600 hover:border-[#2F8F6B]/50"
                          }`}
                        >
                          {role}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Motivation */}
                  <div>
                    <label className="text-sm font-semibold text-[#0F3D2E] block mb-1.5">
                      Why do you want to join this mission?
                      <span className="text-gray-400 font-normal ml-1">(max 100 words)</span>
                    </label>
                    <textarea
                      rows={4}
                      value={motivation}
                      onChange={(e) => setMotivation(e.target.value)}
                      placeholder="Describe your motivation, relevant experience, and what you hope to contribute..."
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2F8F6B]/30 focus:border-[#2F8F6B] resize-none"
                    />
                    <p className="text-xs text-gray-400 mt-1 text-right">
                      {motivation.trim().split(/\s+/).filter(Boolean).length}/100 words
                    </p>
                  </div>

                  {/* Availability */}
                  <div>
                    <label className="text-sm font-semibold text-[#0F3D2E] block mb-1.5">
                      Availability confirmation
                    </label>
                    <select
                      value={availability}
                      onChange={(e) => setAvailability(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2F8F6B]/30 bg-white"
                    >
                      <option value="">Select your availability...</option>
                      <option>Weekends only</option>
                      <option>Full-time for the project duration</option>
                      <option>Project-based (flexible hours)</option>
                      <option>Emergency / Urgent only</option>
                    </select>
                  </div>

                  {/* Error message */}
                  {applyError && (
                    <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl p-3">
                      {applyError}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={applying || !!myApplicationStatus}
                    className="w-full bg-[#0F3D2E] text-white py-3.5 rounded-xl font-semibold hover:bg-[#2F8F6B] transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {applying ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        Apply to Project
                        <ChevronRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-5">
            {/* Points & Impact */}
            <div className="bg-[#0F3D2E] rounded-2xl p-5 text-white">
              <div className="flex items-center gap-2 mb-4">
                <Award className="w-5 h-5 text-[#6DD4A8]" />
                <span className="font-semibold">Mission Rewards</span>
              </div>
              <div className="text-center py-3">
                <div className="text-4xl font-[Manrope] font-bold text-[#6DD4A8]">+{mission.points}</div>
                <div className="text-[#A8D5BF] text-sm mt-1">Impact Points</div>
              </div>
              <div className="space-y-2 mt-4">
                {["SkillSeed Certificate", "Community Badge", "Profile Showcase"].map(r => (
                  <div key={r} className="flex items-center gap-2 text-sm text-[#A8D5BF]">
                    <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                    {r}
                  </div>
                ))}
              </div>
            </div>

            {/* Quick actions */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <div className="space-y-2">
                <button
                  onClick={handleSave}
                  className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium border transition-colors ${
                    saved ? "bg-[#E6F4EE] border-[#2F8F6B]/30 text-[#0F3D2E]" : "border-gray-200 text-gray-600 hover:border-[#2F8F6B]/50"
                  }`}
                >
                  <Bookmark className={`w-4 h-4 ${saved ? "fill-[#2F8F6B] text-[#2F8F6B]" : ""}`} />
                  {saved ? "Saved!" : "Save Mission"}
                </button>
                <button 
                  onClick={handleShare}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium border border-gray-200 text-gray-600 hover:border-[#2F8F6B]/50 transition-colors"
                >
                  <Share2 className="w-4 h-4" />
                  Share Mission
                </button>
              </div>
            </div>

            {/* Skills required */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h3 className="font-[Manrope] font-bold text-[#0F3D2E] mb-3">Skills for this Mission</h3>
              <div className="flex flex-wrap gap-2">
                {mission.skills.map((skill: string) => (
                  <span key={skill} className="text-xs bg-[#E6F4EE] text-[#0F3D2E] px-3 py-1.5 rounded-full font-medium">
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            {/* Related missions */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h3 className="font-[Manrope] font-bold text-[#0F3D2E] mb-3">Related Missions</h3>

              {relatedLoading ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="w-5 h-5 animate-spin text-[#2F8F6B]" />
                </div>
              ) : relatedProjects.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-3">No related missions found.</p>
              ) : (
                <div className="space-y-3">
                  {relatedProjects.map((m) => (
                    <Link
                      key={m.id}
                      to={`/missions/${m.id}`}
                      className="flex items-center gap-3 group"
                    >
                      <div className="w-12 h-12 rounded-lg bg-[#E6F4EE] flex items-center justify-center flex-shrink-0">
                        <Leaf className="w-5 h-5 text-[#2F8F6B]" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-[#0F3D2E] group-hover:text-[#2F8F6B] truncate transition-colors">
                          {m.title}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          {m.focus_area?.[0] && (
                            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                              {m.focus_area[0]}
                            </span>
                          )}
                          <span className="text-xs text-gray-400 flex items-center gap-1">
                            <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                            +{m.points}
                          </span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
