import { useState } from "react";
import { Link } from "react-router";
import {
  Search,
  ExternalLink,
  Bookmark,
  BookmarkCheck,
  Calendar,
  Globe,
  DollarSign,
  ChevronDown,
  ChevronRight,
  Star,
  Filter,
  Leaf,
  TrendingUp,
  Plus,
  Users,
} from "lucide-react";

const FEATURED_GRANTS = [
  {
    id: 1,
    funder: "UNDP",
    title: "Ecosystem Restoration & Biodiversity Grant",
    eligibility: "NGOs, Government bodies, Community groups with 3+ years track record",
    deadline: "Apr 30, 2026",
    amount: "Up to $50,000",
    type: "Grant",
    region: "Southeast Asia",
    focus: "Reforestation",
    featured: true,
    description: "Supports large-scale ecosystem restoration projects focusing on coastal, forest, and grassland habitats across Southeast Asia.",
  },
  {
    id: 2,
    funder: "USAID",
    title: "Disaster Resilience & Community Preparedness",
    eligibility: "Local NGOs and community organizations in disaster-prone regions",
    deadline: "May 15, 2026",
    amount: "$10,000–$75,000",
    type: "Grant",
    region: "Philippines",
    focus: "Disaster Response",
    featured: true,
    description: "Funds community-led initiatives that strengthen disaster preparedness and build local resilience capabilities.",
  },
  {
    id: 3,
    funder: "Forest Foundation Philippines",
    title: "Community Forest Stewardship Programme",
    eligibility: "Indigenous community groups, forest-adjacent communities",
    deadline: "Mar 31, 2026",
    amount: "₱200,000–₱500,000",
    type: "Grant",
    region: "Philippines",
    focus: "Reforestation",
    featured: true,
    description: "Supports indigenous and local community groups in sustainable forest management and conservation.",
    urgent: true,
  },
];

const ALL_GRANTS = [
  ...FEATURED_GRANTS,
  {
    id: 4,
    funder: "Asian Development Bank",
    title: "Urban Climate Resilience Fellowship",
    eligibility: "Young professionals under 35 with urban planning or environmental science background",
    deadline: "Jun 1, 2026",
    amount: "$5,000 + mentorship",
    type: "Fellowship",
    region: "Asia-Pacific",
    focus: "Urban",
    featured: false,
    description: "Fellowship for emerging leaders in urban climate resilience and sustainable city planning.",
  },
  {
    id: 5,
    funder: "GIZ Philippines",
    title: "Renewable Energy Access Fund",
    eligibility: "Social enterprises and NGOs working on energy access in off-grid communities",
    deadline: "Jul 20, 2026",
    amount: "€15,000–€40,000",
    type: "Grant",
    region: "Philippines",
    focus: "Clean Energy",
    featured: false,
    description: "Funds renewable energy projects that expand energy access to off-grid and underserved communities.",
  },
  {
    id: 6,
    funder: "Patagonia Environmental",
    title: "Marine Conservation Partnership",
    eligibility: "Community groups and NGOs working on marine ecosystem protection",
    deadline: "Aug 15, 2026",
    amount: "$8,000–$25,000",
    type: "Partnership",
    region: "Global",
    focus: "Marine",
    featured: false,
    description: "Partnership grants for grassroots marine conservation efforts, particularly coral reef and seagrass restoration.",
  },
  {
    id: 7,
    funder: "JICA",
    title: "Agricultural Innovation & Food Security Grant",
    eligibility: "Farmer cooperatives, agricultural NGOs, research institutions",
    deadline: "Sep 30, 2026",
    amount: "¥2,000,000",
    type: "Grant",
    region: "Philippines",
    focus: "Agriculture",
    featured: false,
    description: "Supports innovative agricultural projects that improve food security and climate-resilient farming practices.",
  },
  {
    id: 8,
    funder: "Skoll Foundation",
    title: "Social Enterprise Climate Impact Award",
    eligibility: "Social enterprises with proven climate impact model operating for 2+ years",
    deadline: "Oct 1, 2026",
    amount: "$100,000",
    type: "Fellowship",
    region: "Global",
    focus: "Education",
    featured: false,
    description: "Recognizes and funds social entrepreneurs tackling climate change with scalable, evidence-based solutions.",
  },
  {
    id: 9,
    funder: "GrowLocal PH",
    title: "Micro-Grant for Urban Garden Community Projects",
    eligibility: "Community groups, barangay associations, and urban farming cooperatives",
    deadline: "Apr 20, 2026",
    amount: "₱15,000–₱50,000",
    type: "Grant",
    region: "Philippines",
    focus: "Agriculture",
    featured: false,
    communityPosted: true,
    description: "Small grants to help community groups establish urban food gardens in shared spaces, schools, and public areas.",
  },
  {
    id: 10,
    funder: "ReCircle Community Fund",
    title: "Seed Funding for Zero-Waste Initiatives",
    eligibility: "Volunteer groups, social enterprises, and youth-led organisations working on waste reduction",
    deadline: "May 5, 2026",
    amount: "$2,000–$8,000",
    type: "In-kind Support",
    region: "Southeast Asia",
    focus: "Circular Economy",
    featured: false,
    communityPosted: true,
    description: "Supports zero-waste champions with seed funding, tools, and network access to launch community recycling and repair initiatives.",
  },
];

const RESOURCE_SECTIONS = [
  {
    title: "Grant Writing Resources",
    items: [
      "How to Write a Winning Climate Grant Proposal",
      "Logic Model Template for Environmental Projects",
      "M&E Framework for Climate Initiatives",
      "Sample Budget Template (UNDP/USAID format)",
    ],
  },
  {
    title: "Legal & Compliance",
    items: [
      "NGO Registration Guide (Philippines)",
      "Reporting Requirements for International Grants",
      "Financial Management for Grant Recipients",
    ],
  },
  {
    title: "Impact Measurement",
    items: [
      "Carbon Footprint Calculation Methodologies",
      "Community Impact Assessment Templates",
      "Biodiversity Monitoring Protocols",
    ],
  },
];

const TYPES = ["All", "Grant", "Fellowship", "In-kind Support", "Partnership"];
const FOCUS_FILTERS = ["All Focus Areas", "Reforestation", "Marine", "Urban", "Agriculture", "Clean Energy", "Disaster Response", "Education", "Circular Economy"];

export function Funding() {
  const [search, setSearch] = useState("");
  const [selectedType, setSelectedType] = useState("All");
  const [selectedFocus, setSelectedFocus] = useState("All Focus Areas");
  const [savedMap, setSavedMap] = useState<Record<number, boolean>>({});
  const [openSection, setOpenSection] = useState<string | null>(null);

  const filtered = ALL_GRANTS.filter(g => {
    const matchesType = selectedType === "All" || g.type === selectedType;
    const matchesFocus = selectedFocus === "All Focus Areas" || g.focus === selectedFocus;
    const matchesSearch = g.title.toLowerCase().includes(search.toLowerCase()) ||
      g.funder.toLowerCase().includes(search.toLowerCase());
    return matchesType && matchesFocus && matchesSearch;
  });

  const toggleSave = (id: number) =>
    setSavedMap(prev => ({ ...prev, [id]: !prev[id] }));

  return (
    <div className="min-h-screen" style={{ background: "#F9FAFB" }}>
      {/* ── Page Header ── */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full mb-3"
                style={{ background: "#E6F4EE", border: "1px solid #BBF7D0" }}>
                <DollarSign className="w-3.5 h-3.5" style={{ color: "#2F8F6B" }} />
                <span className="text-xs" style={{ color: "#0F3D2E", fontWeight: 600 }}>Updated weekly · {ALL_GRANTS.length} opportunities</span>
              </div>
              <h1 style={{ fontFamily: "'Manrope', sans-serif", fontWeight: 800, color: "#0F3D2E", fontSize: "clamp(1.5rem, 3vw, 2rem)" }}>
                Fund Your Climate Project
              </h1>
              <p className="mt-1" style={{ color: "#6B7280", maxWidth: "500px" }}>
                Discover grants, fellowships, and partnerships to power your environmental mission.
              </p>
            </div>
            {/* Post a Funding button */}
            <Link
              to="/post-funding"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl text-white text-sm shrink-0 transition-all"
              style={{
                background: "linear-gradient(135deg, #0F3D2E 0%, #2F8F6B 100%)",
                fontWeight: 700,
                boxShadow: "0 4px 14px rgba(47,143,107,0.35)",
              }}
              onMouseEnter={e => (e.currentTarget.style.boxShadow = "0 6px 20px rgba(47,143,107,0.45)")}
              onMouseLeave={e => (e.currentTarget.style.boxShadow = "0 4px 14px rgba(47,143,107,0.35)")}
            >
              <Plus className="w-4 h-4" />
              Post a Funding Opportunity
            </Link>
          </div>

          {/* Search bar */}
          <div className="flex items-center gap-3 mt-6 max-w-lg px-4 py-3 rounded-xl"
            style={{ background: "#F9FAFB", border: "1.5px solid #E5E7EB" }}>
            <Search className="w-4 h-4 shrink-0" style={{ color: "#9CA3AF" }} />
            <input type="text" placeholder="Search grants, funders, focus areas..." value={search}
              onChange={e => setSearch(e.target.value)}
              className="flex-1 bg-transparent outline-none text-sm" style={{ color: "#374151" }} />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-20">
        {/* Filter bar */}
        <div className="rounded-2xl p-4 mb-6 flex flex-wrap gap-3 items-center"
          style={{ background: "white", border: "1px solid #E5E7EB" }}>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4" style={{ color: "#9CA3AF" }} />
            <span className="text-xs" style={{ fontWeight: 600, color: "#374151" }}>Type:</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {TYPES.map(type => (
              <button key={type} onClick={() => setSelectedType(type)}
                className="px-3 py-1.5 rounded-full text-xs transition-all"
                style={{ background: selectedType === type ? "#0F3D2E" : "#F3F4F6", color: selectedType === type ? "white" : "#6B7280", fontWeight: selectedType === type ? 700 : 500 }}>
                {type}
              </button>
            ))}
          </div>
          <div className="h-4 w-px hidden sm:block" style={{ background: "#E5E7EB" }} />
          <div className="flex flex-wrap gap-2">
            {FOCUS_FILTERS.slice(0, 5).map(focus => (
              <button key={focus} onClick={() => setSelectedFocus(focus)}
                className="px-3 py-1.5 rounded-full text-xs transition-all"
                style={{ background: selectedFocus === focus ? "#2F8F6B" : "#F3F4F6", color: selectedFocus === focus ? "white" : "#6B7280", fontWeight: selectedFocus === focus ? 700 : 500 }}>
                {focus}
              </button>
            ))}
          </div>
        </div>

        {/* Featured grants */}
        {search === "" && selectedType === "All" && selectedFocus === "All Focus Areas" && (
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Star className="w-4 h-4" style={{ color: "#FBBF24", fill: "#FBBF24" }} />
              <h2 style={{ fontFamily: "'Manrope', sans-serif", fontWeight: 700, color: "#0F3D2E" }}>
                Featured Opportunities
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {FEATURED_GRANTS.map(grant => (
                <div
                  key={grant.id}
                  className="rounded-2xl p-5 transition-all duration-200 relative"
                  style={{
                    background: "white",
                    border: (grant as any).urgent ? "2px solid #EF4444" : "1px solid #E5E7EB",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                  }}
                  onMouseEnter={e => (e.currentTarget.style.boxShadow = "0 8px 25px rgba(15,61,46,0.1)")}
                  onMouseLeave={e => (e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.04)")}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex flex-wrap gap-1.5 mb-2">
                        <span
                          className="px-2 py-0.5 rounded-full text-xs"
                          style={{ background: "#FEF3C7", color: "#D97706", fontWeight: 700 }}
                        >
                          ⭐ Featured
                        </span>
                        {(grant as any).urgent && (
                          <span
                            className="px-2 py-0.5 rounded-full text-xs"
                            style={{ background: "#FEE2E2", color: "#DC2626", fontWeight: 700 }}
                          >
                            ⚠️ Closing Soon
                          </span>
                        )}
                        <span
                          className="px-2 py-0.5 rounded-full text-xs"
                          style={{ background: "#E6F4EE", color: "#2F8F6B", fontWeight: 700 }}
                        >
                          {grant.type}
                        </span>
                      </div>
                      <div className="text-xs" style={{ color: "#9CA3AF", fontWeight: 600 }}>{grant.funder}</div>
                    </div>
                    <button
                      onClick={() => toggleSave(grant.id)}
                      className="p-1.5 rounded-lg transition-colors"
                      style={{ background: savedMap[grant.id] ? "#E6F4EE" : "#F3F4F6" }}
                    >
                      {savedMap[grant.id]
                        ? <BookmarkCheck className="w-4 h-4" style={{ color: "#2F8F6B" }} />
                        : <Bookmark className="w-4 h-4" style={{ color: "#9CA3AF" }} />
                      }
                    </button>
                  </div>

                  <h3
                    className="mb-2"
                    style={{ fontFamily: "'Manrope', sans-serif", fontWeight: 700, color: "#0F3D2E", fontSize: "0.95rem", lineHeight: 1.4 }}
                  >
                    {grant.title}
                  </h3>
                  <p className="text-xs mb-4" style={{ color: "#6B7280", lineHeight: 1.6 }}>
                    {grant.description}
                  </p>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-start gap-2 text-xs">
                      <span style={{ color: "#9CA3AF", minWidth: "72px" }}>Eligibility:</span>
                      <span style={{ color: "#374151", lineHeight: 1.5 }}>{grant.eligibility}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <Calendar className="w-3 h-3 shrink-0" style={{ color: "#9CA3AF" }} />
                      <span style={{ color: "#374151" }}>Deadline: <strong>{grant.deadline}</strong></span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <DollarSign className="w-3 h-3 shrink-0" style={{ color: "#9CA3AF" }} />
                      <span style={{ color: "#0F3D2E", fontWeight: 700 }}>{grant.amount}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <Globe className="w-3 h-3 shrink-0" style={{ color: "#9CA3AF" }} />
                      <span style={{ color: "#374151" }}>{grant.region}</span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      className="flex-1 py-2 rounded-lg text-sm flex items-center justify-center gap-1.5 transition-all"
                      style={{
                        background: "linear-gradient(135deg, #0F3D2E, #2F8F6B)",
                        color: "white",
                        fontWeight: 700,
                      }}
                    >
                      View Details <ExternalLink className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => toggleSave(grant.id)}
                      className="px-3 py-2 rounded-lg text-sm transition-all"
                      style={{
                        background: savedMap[grant.id] ? "#E6F4EE" : "#F3F4F6",
                        color: savedMap[grant.id] ? "#2F8F6B" : "#374151",
                        fontWeight: 600,
                      }}
                    >
                      {savedMap[grant.id] ? "Saved ✓" : "Save"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* All Grants */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 style={{ fontFamily: "'Manrope', sans-serif", fontWeight: 700, color: "#0F3D2E" }}>
              {search || selectedType !== "All" || selectedFocus !== "All Focus Areas"
                ? `${filtered.length} results found`
                : "All Opportunities"}
            </h2>
            {/* Community posted indicator */}
            <div className="flex items-center gap-1.5 text-xs" style={{ color: "#9CA3AF" }}>
              <span className="w-2 h-2 rounded-full inline-block" style={{ background: "#0EA5E9" }} />
              Community-posted included
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="text-center py-16 rounded-2xl" style={{ background: "white", border: "1px solid #E5E7EB" }}>
              <TrendingUp className="w-12 h-12 mx-auto mb-3" style={{ color: "#D1D5DB" }} />
              <p style={{ color: "#9CA3AF" }}>No grants found. Try different filters.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map(grant => (
                <div
                  key={grant.id}
                  className="rounded-2xl p-5 flex flex-col sm:flex-row gap-4 transition-all"
                  style={{
                    background: "white",
                    border: (grant as any).communityPosted ? "1.5px solid #BAE6FD" : "1px solid #E5E7EB",
                  }}
                  onMouseEnter={e => (e.currentTarget.style.boxShadow = "0 4px 16px rgba(15,61,46,0.08)")}
                  onMouseLeave={e => (e.currentTarget.style.boxShadow = "none")}
                >
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <span className="text-xs" style={{ fontWeight: 700, color: "#9CA3AF" }}>{grant.funder}</span>
                      {(grant as any).communityPosted ? (
                        <span className="px-2 py-0.5 rounded-full text-xs flex items-center gap-1"
                          style={{ background: "#E0F2FE", color: "#0369A1", fontWeight: 700 }}>
                          <Users className="w-3 h-3" />Community
                        </span>
                      ) : null}
                      <span
                        className="px-2 py-0.5 rounded-full text-xs"
                        style={{ background: "#E6F4EE", color: "#2F8F6B", fontWeight: 700 }}
                      >
                        {grant.type}
                      </span>
                      <span
                        className="px-2 py-0.5 rounded-full text-xs"
                        style={{ background: "#F3F4F6", color: "#6B7280", fontWeight: 600 }}
                      >
                        {grant.focus}
                      </span>
                      {grant.featured && (
                        <span
                          className="px-2 py-0.5 rounded-full text-xs"
                          style={{ background: "#FEF3C7", color: "#D97706", fontWeight: 700 }}
                        >
                          ⭐ Featured
                        </span>
                      )}
                    </div>
                    <h3
                      className="mb-1"
                      style={{ fontFamily: "'Manrope', sans-serif", fontWeight: 700, color: "#0F3D2E", fontSize: "0.95rem" }}
                    >
                      {grant.title}
                    </h3>
                    <p className="text-xs mb-2" style={{ color: "#6B7280", lineHeight: 1.6 }}>
                      {grant.eligibility}
                    </p>
                    <div className="flex flex-wrap gap-4 text-xs" style={{ color: "#9CA3AF" }}>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" /> {grant.deadline}
                      </span>
                      <span className="flex items-center gap-1">
                        <DollarSign className="w-3 h-3" />
                        <span style={{ fontWeight: 700, color: "#0F3D2E" }}>{grant.amount}</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <Globe className="w-3 h-3" /> {grant.region}
                      </span>
                    </div>
                  </div>
                  <div className="flex sm:flex-col gap-2 sm:items-end justify-end">
                    <button
                      className="px-4 py-2 rounded-lg text-xs flex items-center gap-1.5 transition-all whitespace-nowrap"
                      style={{
                        background: "linear-gradient(135deg, #0F3D2E, #2F8F6B)",
                        color: "white",
                        fontWeight: 700,
                      }}
                    >
                      View Details <ExternalLink className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => toggleSave(grant.id)}
                      className="px-4 py-2 rounded-lg text-xs flex items-center gap-1.5 transition-all whitespace-nowrap"
                      style={{
                        background: savedMap[grant.id] ? "#E6F4EE" : "#F3F4F6",
                        color: savedMap[grant.id] ? "#2F8F6B" : "#374151",
                        fontWeight: 600,
                      }}
                    >
                      {savedMap[grant.id] ? <BookmarkCheck className="w-3 h-3" /> : <Bookmark className="w-3 h-3" />}
                      {savedMap[grant.id] ? "Saved" : "Save Grant"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Resource Library */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Leaf className="w-4 h-4" style={{ color: "#2F8F6B" }} />
            <h2 style={{ fontFamily: "'Manrope', sans-serif", fontWeight: 700, color: "#0F3D2E" }}>
              Resource Library
            </h2>
          </div>
          <div className="space-y-3">
            {RESOURCE_SECTIONS.map(section => (
              <div
                key={section.title}
                className="rounded-2xl overflow-hidden"
                style={{ background: "white", border: "1px solid #E5E7EB" }}
              >
                <button
                  onClick={() => setOpenSection(openSection === section.title ? null : section.title)}
                  className="w-full px-5 py-4 flex items-center justify-between text-left"
                >
                  <span style={{ fontFamily: "'Manrope', sans-serif", fontWeight: 700, color: "#0F3D2E", fontSize: "0.95rem" }}>
                    {section.title}
                  </span>
                  {openSection === section.title
                    ? <ChevronDown className="w-4 h-4" style={{ color: "#9CA3AF" }} />
                    : <ChevronRight className="w-4 h-4" style={{ color: "#9CA3AF" }} />
                  }
                </button>
                {openSection === section.title && (
                  <div className="px-5 pb-4 space-y-2" style={{ borderTop: "1px solid #E5E7EB" }}>
                    {section.items.map(item => (
                      <a
                        key={item}
                        href="#"
                        className="flex items-center gap-2 py-2.5 text-sm transition-colors"
                        style={{ color: "#374151" }}
                        onMouseEnter={e => (e.currentTarget.style.color = "#2F8F6B")}
                        onMouseLeave={e => (e.currentTarget.style.color = "#374151")}
                      >
                        <ExternalLink className="w-3.5 h-3.5 shrink-0" style={{ color: "#9CA3AF" }} />
                        {item}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}