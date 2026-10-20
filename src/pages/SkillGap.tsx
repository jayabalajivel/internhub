import { useState, useEffect } from "react"
import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  ResponsiveContainer,
} from "recharts"
import {
  CheckIcon,
  XIcon,
  ZapIcon,
  BriefcaseIcon,
} from "../components/Icons"
import { api } from "../api"
import { normalizeSkill } from "../jobServices"

interface Props {
  onNavigate: (p: string) => void
}

const roleRequirements: Record<string, string[]> = {
  "React Developer": [
    "React",
    "JavaScript",
    "HTML",
    "CSS",
    "Redux",
    "Next.js",
    "TypeScript",
    "Tailwind CSS",
    "Git",
    "Jest",
  ],
  "Frontend Developer": [
    "HTML",
    "CSS",
    "JavaScript",
    "React",
    "TypeScript",
    "Git",
    "Tailwind CSS",
    "Next.js",
    "Redux",
    "Responsive Design",
  ],
  "Backend Developer": [
    "Node.js",
    "Express.js",
    "Python",
    "Java",
    "SQL",
    "REST API",
    "PostgreSQL",
    "MongoDB",
    "Docker",
    "Redis",
  ],
  "Full Stack Developer": [
    "React",
    "Node.js",
    "Express.js",
    "JavaScript",
    "HTML",
    "CSS",
    "SQL",
    "MongoDB",
    "Git",
    "TypeScript",
  ],
  "Machine Learning Engineer": [
    "Python",
    "Machine Learning",
    "Scikit-learn",
    "TensorFlow",
    "PyTorch",
    "SQL",
    "Pandas",
    "NumPy",
    "Deep Learning",
    "NLP",
  ],
  "Data Scientist": [
    "Python",
    "SQL",
    "Pandas",
    "NumPy",
    "Scikit-learn",
    "Machine Learning",
    "Deep Learning",
    "Statistics",
    "Matplotlib",
  ],
  "AI / Generative AI Engineer": [
    "Python",
    "Generative AI",
    "LLM",
    "RAG",
    "LangChain",
    "PyTorch",
    "NLP",
    "Deep Learning",
  ],
  "Cybersecurity Analyst": [
    "Networking",
    "Linux",
    "Wireshark",
    "SIEM",
    "Penetration Testing",
    "Ethical Hacking",
    "Cryptography",
    "Information Security",
  ],
  "DevOps Engineer": [
    "Docker",
    "Kubernetes",
    "CI/CD",
    "Jenkins",
    "Git",
    "Linux",
    "AWS",
    "Terraform",
    "Nginx",
  ],
  "Cloud Engineer": [
    "AWS",
    "Azure",
    "GCP",
    "Docker",
    "Kubernetes",
    "Linux",
    "Terraform",
    "CI/CD",
  ],
  "Java Developer": [
    "Java",
    "Spring Boot",
    "SQL",
    "MySQL",
    "REST API",
    "PostgreSQL",
    "Docker",
    "JUnit",
    "Git",
  ],
  "Python Developer": [
    "Python",
    "Django",
    "Flask",
    "FastAPI",
    "SQL",
    "REST API",
    "PostgreSQL",
    "Docker",
    "Git",
  ],
  "Mobile App Developer": [
    "React Native",
    "Flutter",
    "JavaScript",
    "TypeScript",
    "Git",
    "Android",
    "iOS",
  ],
  "QA / Automation Test Engineer": [
    "Selenium",
    "Playwright",
    "Cypress",
    "PyTest",
    "JUnit",
    "API Testing",
    "Postman",
    "Git",
  ],
  "Software Engineer": [
    "Python",
    "Java",
    "C++",
    "SQL",
    "Git",
    "Linux",
    "Docker",
    "REST API",
  ],
}

export default function SkillGap({ onNavigate }: Props) {
  const [selectedRole, setSelectedRole] = useState("Frontend Developer")
  const [availableRoles, setAvailableRoles] = useState<string[]>(
    Object.keys(roleRequirements),
  )
  const [userSkills, setUserSkills] = useState<string[]>([])
  const [candidateProfile, setCandidateProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const cachedStr = localStorage.getItem("internhub_candidate_profile")
        if (cachedStr) {
          const parsed = JSON.parse(cachedStr)
          setCandidateProfile(parsed)
          if (parsed.extracted_skills && parsed.extracted_skills.length > 0) {
            setUserSkills(parsed.extracted_skills)
          }
          if (parsed.primary_role) {
            setSelectedRole(parsed.primary_role)
          }
          if (parsed.predicted_roles && parsed.predicted_roles.length > 0) {
            const predNames = parsed.predicted_roles.map((r: any) => r.role)
            const combined = Array.from(
              new Set([...predNames, ...Object.keys(roleRequirements)]),
            )
            setAvailableRoles(combined)
          }
        } else {
          const profileData = await api.getProfile()
          setUserSkills(
            profileData.profile?.skills || [],
          )
        }
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    fetchProfile()
  }, [])

  const rawRequired =
    roleRequirements[selectedRole] ||
    (candidateProfile?.skill_gaps?.role === selectedRole
      ? [
          ...candidateProfile.skill_gaps.already_have,
          ...candidateProfile.skill_gaps.need_to_learn,
        ]
      : [
          "HTML",
          "CSS",
          "JavaScript",
          "React",
          "Node.js",
          "SQL",
          "Git",
          "TypeScript",
        ])

  // Canonical normalization ensures aliases match correctly
  const normalizedUserSkills = Array.from(
    new Set(userSkills.map(normalizeSkill).filter(Boolean)),
  )
  const required = Array.from(
    new Set(rawRequired.map(normalizeSkill).filter(Boolean)),
  )

  const present = required.filter((s) => normalizedUserSkills.includes(s))
  const missing = required.filter((s) => !normalizedUserSkills.includes(s))
  const matchPercentage =
    required.length > 0
      ? Math.round((present.length / required.length) * 100)
      : 0

  const radarData = [
    {
      skill: "Frontend",
      you: userSkills.some((s) =>
        ["react", "html", "css", "javascript"].includes(s.toLowerCase()),
      )
        ? 85
        : 25,
      required: 90,
    },
    {
      skill: "Backend",
      you: userSkills.some((s) =>
        ["node.js", "express", "python", "java", "spring boot"].includes(
          s.toLowerCase(),
        ),
      )
        ? 80
        : 30,
      required: 85,
    },
    {
      skill: "Database",
      you: userSkills.some((s) =>
        ["sql", "mongodb", "redis", "postgresql", "mysql"].includes(
          s.toLowerCase(),
        ),
      )
        ? 75
        : 25,
      required: 80,
    },
    {
      skill: "DevOps & Git",
      you: userSkills.some((s) =>
        ["docker", "aws", "git", "linux", "ci/cd"].includes(s.toLowerCase()),
      )
        ? 70
        : 20,
      required: 75,
    },
    {
      skill: "AI / Data",
      you: userSkills.some((s) =>
        [
          "pandas",
          "numpy",
          "scikit-learn",
          "machine learning",
          "pytorch",
        ].includes(s.toLowerCase()),
      )
        ? 85
        : 20,
      required: 80,
    },
  ]

  // Dynamic roadmap steps from candidate profile or missing skills
  const roadmapSteps =
    candidateProfile?.learning_roadmap ||
    missing.map((s, idx) => ({
      stage: idx + 1,
      title: `Stage ${idx + 1}: Master ${s}`,
      skill_target: s,
      description: `Target skill: ${s}. Recommended for full qualification in ${selectedRole}.`,
    }))

  const strokeColor = matchPercentage >= 70 ? "#10b981" : matchPercentage >= 50 ? "#f59e0b" : "#ef4444"

  return (
    <div className="p-8 max-w-6xl mx-auto w-full font-sans">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 mb-2">
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-blue-500">Skill Gap</span> & Learning Roadmap
        </h1>
        <p className="text-slate-500 text-sm">
          Compare your extracted candidate skills against role requirements to generate an actionable learning roadmap.
        </p>
      </div>

      {/* Role selector */}
      <div className="flex gap-2 mb-8 flex-wrap">
        {availableRoles.slice(0, 7).map((r) => (
          <button
            key={r}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all border ${
              selectedRole === r 
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm' 
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:text-slate-900'
            }`}
            onClick={() => setSelectedRole(r)}
          >
            {r}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-10 h-10 border-4 border-slate-200 border-t-indigo-600 rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Hero match card */}
          <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm flex flex-col md:flex-row items-center gap-8 md:gap-12">
            <div className="flex items-center gap-6">
              <div className="relative w-24 h-24">
                <svg width={96} height={96} className="-rotate-90">
                  <circle cx={48} cy={48} r={40} fill="none" stroke="#e2e8f0" strokeWidth={10} />
                  <circle
                    cx={48}
                    cy={48}
                    r={40}
                    fill="none"
                    stroke={strokeColor}
                    strokeWidth={10}
                    strokeLinecap="round"
                    strokeDasharray={251.2}
                    strokeDashoffset={251.2 - (matchPercentage / 100) * 251.2}
                    className="transition-all duration-1000 ease-out"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-bold leading-none" style={{ color: strokeColor }}>
                    {matchPercentage}%
                  </span>
                  <span className="text-[9px] font-bold text-slate-400 mt-0.5">MATCH</span>
                </div>
              </div>
              
              <div>
                <div className="text-[11px] font-bold text-slate-400 tracking-wider mb-1 uppercase">Target Role Qualification</div>
                <div className="text-2xl font-bold text-slate-900 mb-1">{selectedRole}</div>
                <div className="text-sm font-medium text-slate-500">
                  {present.length} of {required.length} required competencies verified.
                </div>
              </div>
            </div>
            
            <div className="flex-1 hidden md:block"></div>
            
            <div className="flex items-center gap-8 md:border-l md:border-slate-200 md:pl-8 self-stretch">
              <div className="text-center">
                <div className="text-[11px] font-bold text-slate-400 uppercase mb-1">Verified Skills</div>
                <div className="text-3xl font-bold text-emerald-600">{present.length}</div>
              </div>
              <div className="text-center">
                <div className="text-[11px] font-bold text-slate-400 uppercase mb-1">Missing Gaps</div>
                <div className="text-3xl font-bold text-rose-600">{missing.length}</div>
              </div>
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Radar chart */}
            <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm flex flex-col">
              <h3 className="text-lg font-bold text-slate-900 mb-6">Domain Skill Density</h3>
              <div className="flex-1 min-h-[260px] flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="#e2e8f0" />
                    <PolarAngleAxis dataKey="skill" tick={{ fontSize: 11, fill: "#64748B", fontWeight: 600 }} />
                    <Radar name="Candidate" dataKey="you" stroke="#10b981" fill="#10b981" fillOpacity={0.2} strokeWidth={2} />
                    <Radar name="Role Required" dataKey="required" stroke="#4f46e5" fill="#4f46e5" fillOpacity={0.1} strokeWidth={2} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
              <div className="flex justify-center gap-6 mt-4 text-xs font-bold text-slate-500 uppercase tracking-wide">
                 <div className="flex items-center gap-2"><span className="w-3 h-3 rounded bg-emerald-500"></span> Candidate</div>
                 <div className="flex items-center gap-2"><span className="w-3 h-3 rounded bg-indigo-500 opacity-60"></span> Required</div>
              </div>
            </div>

            {/* Present vs Missing skills */}
            <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm flex flex-col gap-6">
              <div>
                <h4 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <span className="text-emerald-500">●</span> ALREADY HAVE ({present.length})
                </h4>
                <div className="flex flex-wrap gap-2">
                  {present.length > 0 ? (
                    present.map((s) => (
                      <span key={s} className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5">
                        <CheckIcon size={12} /> {s}
                      </span>
                    ))
                  ) : (
                    <span className="text-sm text-slate-500 font-medium">No matching skills found. Upload a resume to extract candidate profile.</span>
                  )}
                </div>
              </div>

              <div className="border-t border-slate-100 pt-6">
                <h4 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <span className="text-rose-500">●</span> NEED TO LEARN ({missing.length})
                </h4>
                <div className="flex flex-wrap gap-2">
                  {missing.length > 0 ? (
                    missing.map((s) => (
                      <span key={s} className="bg-rose-50 text-rose-700 border border-rose-200 px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5">
                        <XIcon size={12} /> {s}
                      </span>
                    ))
                  ) : (
                    <span className="text-sm text-emerald-600 font-bold">Fully qualified! You possess all required skills for this role.</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Dynamic Learning Roadmap */}
          <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm">
            <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
              <ZapIcon size={20} className="text-indigo-600" />
              Dynamic Learning Roadmap
            </h3>

            <div className="space-y-4">
              {roadmapSteps.map((step: any, idx: number) => (
                <div key={idx} className="bg-slate-50 border border-slate-200 rounded-2xl p-5 flex gap-5 items-start">
                  <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 font-bold text-lg flex items-center justify-center shrink-0">
                    {step.stage || idx + 1}
                  </div>
                  <div>
                    <div className="text-base font-bold text-slate-900 mb-1">{step.title}</div>
                    <div className="text-sm text-slate-600 leading-relaxed">{step.description}</div>
                  </div>
                </div>
              ))}
              
              {roadmapSteps.length === 0 && (
                <div className="py-8 text-center text-sm font-medium text-slate-500 border-2 border-dashed border-slate-200 rounded-2xl">
                   No roadmap needed. You are fully qualified.
                </div>
              )}
            </div>

            <div className="mt-8">
              <button
                onClick={() => onNavigate("internships")}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-semibold shadow-sm transition-colors flex items-center gap-2"
              >
                <BriefcaseIcon size={18} />
                Browse Matched Job Opportunities
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
