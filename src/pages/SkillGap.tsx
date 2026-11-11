import { useState, useEffect, useMemo } from "react"
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
  SparklesIcon,
} from "../components/Icons"
import { api } from "../api"
import { normalizeSkill, isSkillSatisfied } from "../jobServices"
import {
  DEPARTMENTS,
  ROLE_ROADMAPS,
  getRoleRoadmap,
  type RoleRoadmapData,
} from "../roadmaps"

interface Props {
  onNavigate: (p: string) => void
}

export default function SkillGap({ onNavigate }: Props) {
  const [selectedDept, setSelectedDept] = useState<string>("all")
  const [selectedRole, setSelectedRole] = useState<string>("Full Stack Developer")
  const [userSkills, setUserSkills] = useState<string[]>([])
  const [candidateProfile, setCandidateProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [completedStages, setCompletedStages] = useState<Record<string, number[]>>({})

  // Load candidate profile from localStorage or API
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
            // Set primary role if available in taxonomy
            const matchedKey = Object.keys(ROLE_ROADMAPS).find(
              (k) => k.toLowerCase() === parsed.primary_role.toLowerCase()
            )
            if (matchedKey) {
              setSelectedRole(matchedKey)
              const deptCode = ROLE_ROADMAPS[matchedKey].departmentCode
              setSelectedDept(deptCode)
            }
          }
        } else {
          const profileData = await api.getProfile()
          if (profileData.profile?.skills) {
            setUserSkills(profileData.profile.skills)
          }
        }
      } catch (e) {
        console.error("Error loading candidate profile:", e)
      } finally {
        setLoading(false)
      }
    }
    fetchProfile()
  }, [])

  // Filter available roles by department
  const filteredRoles = useMemo(() => {
    const allRoles = Object.values(ROLE_ROADMAPS)
    if (selectedDept === "all") return allRoles
    return allRoles.filter((r) => r.departmentCode === selectedDept)
  }, [selectedDept])

  // Get active role roadmap data (instant memoized calculation)
  const currentRoadmap: RoleRoadmapData = useMemo(() => {
    return getRoleRoadmap(selectedRole, userSkills)
  }, [selectedRole, userSkills])

  // Normalization & matching logic
  const normalizedUserSkills = useMemo(() => {
    return Array.from(new Set(userSkills.map(normalizeSkill).filter(Boolean)))
  }, [userSkills])

  const requiredSkills = useMemo(() => {
    return Array.from(new Set(currentRoadmap.skills.map(normalizeSkill).filter(Boolean)))
  }, [currentRoadmap])

  const present = useMemo(() => {
    return requiredSkills.filter((s) =>
      isSkillSatisfied(normalizedUserSkills, s)
    )
  }, [requiredSkills, normalizedUserSkills])

  const missing = useMemo(() => {
    return requiredSkills.filter(
      (s) => !present.includes(s)
    )
  }, [requiredSkills, present])

  const matchPercentage = useMemo(() => {
    if (requiredSkills.length === 0) return 0
    return Math.round((present.length / requiredSkills.length) * 100)
  }, [requiredSkills, present])

  // Domain-adaptive Radar Chart Data
  const radarData = useMemo(() => {
    if (!currentRoadmap.radarDomains || currentRoadmap.radarDomains.length === 0) {
      return [
        { skill: "Core Skills", you: matchPercentage, required: 90 },
        { skill: "Tools", you: 60, required: 85 },
        { skill: "Practical", you: 50, required: 80 },
        { skill: "Quality", you: 45, required: 75 },
        { skill: "Capstone", you: 40, required: 80 },
      ]
    }

    return currentRoadmap.radarDomains.map((domain) => {
      const domainSkillsNormalized = domain.skills.map(normalizeSkill)
      const userMatches = domainSkillsNormalized.filter((ds) =>
        isSkillSatisfied(normalizedUserSkills, ds)
      )
      const ratio =
        domainSkillsNormalized.length > 0
          ? userMatches.length / domainSkillsNormalized.length
          : 0

      // Base score 25, scaling up to 95 with verified candidate skills
      const youScore = Math.min(95, Math.max(25, Math.round(ratio * 70 + 25)))
      return {
        skill: domain.name,
        you: youScore,
        required: 85,
      }
    })
  }, [currentRoadmap, normalizedUserSkills, matchPercentage])

  // Toggle stage completion
  const toggleStage = (stageNum: number) => {
    setCompletedStages((prev) => {
      const roleStages = prev[selectedRole] || []
      const exists = roleStages.includes(stageNum)
      const updated = exists
        ? roleStages.filter((s) => s !== stageNum)
        : [...roleStages, stageNum]
      return { ...prev, [selectedRole]: updated }
    })
  }

  const roleCompletedStages = completedStages[selectedRole] || []
  const progressPercent = Math.round(
    (roleCompletedStages.length / (currentRoadmap.stages.length || 1)) * 100
  )

  const strokeColor =
    matchPercentage >= 70 ? "#10b981" : matchPercentage >= 40 ? "#f59e0b" : "#ef4444"

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto w-full font-sans transition-all">
      {/* HEADER */}
      <div className="mb-8">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-2">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-blue-500">
                Multi-Department
              </span>{" "}
              Learning Roadmap & Skill Gap
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              Select any engineering or technical role to inspect required competencies, benchmark your skills, and follow a structured 5-stage roadmap.
            </p>
          </div>
          <button
            onClick={() => onNavigate("resume")}
            className="bg-indigo-50 border border-indigo-200 text-indigo-700 hover:bg-indigo-100 text-xs font-bold px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 shadow-sm"
          >
            <SparklesIcon size={14} /> Update Resume Profile
          </button>
        </div>
      </div>

      {/* DEPARTMENT SELECTOR TABS */}
      <div className="mb-6">
        <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
          1. Filter by Academic Department:
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
          {DEPARTMENTS.map((dept) => (
            <button
              key={dept.id}
              onClick={() => {
                setSelectedDept(dept.id)
                // If current role is not in selected department, auto-select first role of this department
                if (dept.id !== "all") {
                  const firstInDept = Object.values(ROLE_ROADMAPS).find(
                    (r) => r.departmentCode === dept.id
                  )
                  if (firstInDept) setSelectedRole(firstInDept.role)
                }
              }}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border flex items-center gap-1.5 ${
                selectedDept === dept.id
                  ? "bg-indigo-600 text-white border-indigo-600 shadow-sm shadow-indigo-100"
                  : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <span>{dept.icon}</span>
              <span>{dept.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ROLE SELECTOR (DROPDOWN & QUICK PILLS) */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 mb-8 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
            2. Choose Target Career Role:
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-slate-500">Quick Dropdown:</span>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="bg-slate-50 border border-slate-300 text-slate-800 text-xs font-bold rounded-xl px-3 py-1.5 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            >
              {Object.values(ROLE_ROADMAPS).map((r) => (
                <option key={r.role} value={r.role}>
                  {r.role} ({r.department})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Quick Role Badges */}
        <div className="flex flex-wrap gap-2">
          {filteredRoles.map((r) => (
            <button
              key={r.role}
              onClick={() => setSelectedRole(r.role)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
                selectedRole === r.role
                  ? "bg-slate-900 text-white border-slate-900 shadow-sm"
                  : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200"
              }`}
            >
              {r.role}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-10 h-10 border-4 border-slate-200 border-t-indigo-600 rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="space-y-8">
          {/* HERO SUMMARY CARD */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 shadow-sm flex flex-col md:flex-row items-center gap-8 justify-between">
            <div className="flex items-center gap-6">
              {/* Radial Progress Circle */}
              <div className="relative w-24 h-24 shrink-0">
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
                    className="transition-all duration-700 ease-out"
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
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-md border border-indigo-100">
                    {currentRoadmap.department}
                  </span>
                  {candidateProfile?.primary_role === currentRoadmap.role ? (
                    <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md flex items-center gap-1">
                      ✓ Active Primary Role
                    </span>
                  ) : (
                    <button
                      onClick={async () => {
                        try {
                          await (api as any).updatePrimaryRole(currentRoadmap.role)
                          setCandidateProfile((prev: any) => ({
                            ...prev,
                            primary_role: currentRoadmap.role,
                            domain: currentRoadmap.role,
                          }))
                        } catch (e) {
                          console.error(e)
                        }
                      }}
                      className="text-[10px] font-bold bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-600 px-2.5 py-0.5 rounded-md border border-slate-200 transition-all cursor-pointer"
                    >
                      ⭐ Set as My Primary Role
                    </button>
                  )}
                </div>
                <div className="text-2xl font-bold text-slate-900 mb-1">{currentRoadmap.role}</div>
                <div className="text-xs font-medium text-slate-500 max-w-xl">
                  {currentRoadmap.description}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-6 md:border-l md:border-slate-200 md:pl-8 self-stretch justify-around md:justify-end">
              <div className="text-center">
                <div className="text-[10px] font-bold text-slate-400 uppercase mb-0.5">Verified Skills</div>
                <div className="text-2xl font-bold text-emerald-600">{present.length}</div>
                <div className="text-[10px] text-slate-400">Acquired</div>
              </div>
              <div className="text-center">
                <div className="text-[10px] font-bold text-slate-400 uppercase mb-0.5">Missing Gaps</div>
                <div className="text-2xl font-bold text-rose-600">{missing.length}</div>
                <div className="text-[10px] text-slate-400">To Master</div>
              </div>
              <div className="text-center">
                <div className="text-[10px] font-bold text-slate-400 uppercase mb-0.5">Roadmap Progress</div>
                <div className="text-2xl font-bold text-indigo-600">
                  {roleCompletedStages.length}/{currentRoadmap.stages.length}
                </div>
                <div className="text-[10px] text-slate-400">Stages Done</div>
              </div>
            </div>
          </div>

          {/* GRID ROW 1: DOMAIN DENSITY RADAR & SKILL GAP BREAKDOWN */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Domain-Adaptive Radar Chart */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 shadow-sm flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-bold text-slate-900">
                  Domain Competency Density: {currentRoadmap.role}
                </h3>
                <span className="text-[11px] font-semibold text-slate-400 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-100">
                  5 Key Competency Axes
                </span>
              </div>
              <div className="flex-1 min-h-[250px] flex items-center justify-center">
                <ResponsiveContainer width="100%" height={250}>
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="#e2e8f0" />
                    <PolarAngleAxis
                      dataKey="skill"
                      tick={{ fontSize: 10, fill: "#64748B", fontWeight: 600 }}
                    />
                    <Radar
                      name="Your Profile"
                      dataKey="you"
                      stroke="#10b981"
                      fill="#10b981"
                      fillOpacity={0.25}
                      strokeWidth={2}
                    />
                    <Radar
                      name="Industry Benchmark"
                      dataKey="required"
                      stroke="#6366f1"
                      fill="#6366f1"
                      fillOpacity={0.08}
                      strokeWidth={1.5}
                      strokeDasharray="4 4"
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
              <div className="flex justify-center gap-6 mt-4 text-xs font-bold text-slate-500 uppercase tracking-wide">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-emerald-500"></span> Candidate Profile
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-indigo-500 opacity-60"></span> Industry Benchmark
                </div>
              </div>
            </div>

            {/* Already Have vs Need to Learn */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 shadow-sm flex flex-col justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center justify-between">
                  <span>Skill Gap Inventory</span>
                  <span className="text-xs font-medium text-slate-400">
                    {present.length} of {requiredSkills.length} competencies fulfilled
                  </span>
                </h3>

                {/* Already Have */}
                <div className="mb-6">
                  <div className="text-xs font-bold text-emerald-600 mb-2.5 flex items-center gap-1.5 uppercase tracking-wide">
                    <CheckIcon size={14} /> ALREADY ACQUIRED ({present.length})
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {present.length > 0 ? (
                      present.map((s) => (
                        <span
                          key={s}
                          className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1"
                        >
                          ✓ {s}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-slate-400 italic">
                        No matching skills found in candidate profile. Upload a resume to compare.
                      </span>
                    )}
                  </div>
                </div>

                {/* Need to Learn */}
                <div className="border-t border-slate-100 pt-5">
                  <div className="text-xs font-bold text-rose-600 mb-2.5 flex items-center gap-1.5 uppercase tracking-wide">
                    <XIcon size={14} /> NEED TO LEARN / SKILL GAPS ({missing.length})
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {missing.length > 0 ? (
                      missing.map((s) => (
                        <span
                          key={s}
                          className="bg-rose-50 text-rose-700 border border-rose-200 px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1"
                        >
                          + {s}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-emerald-600 font-bold bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200 flex items-center gap-1.5">
                        🎉 Fully Qualified! You possess all core competencies for {currentRoadmap.role}.
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 text-[11px] text-slate-400 flex items-center justify-between">
                <span>Tip: Follow the tailored 5-stage roadmap below to bridge these gaps.</span>
                <span className="font-semibold text-indigo-600">5 Structured Stages</span>
              </div>
            </div>
          </div>

          {/* DYNAMIC 5-STAGE LEARNING ROADMAP */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <ZapIcon size={20} className="text-amber-500" />
                  <h3 className="text-xl font-bold text-slate-900">
                    5-Stage Learning Roadmap: {currentRoadmap.role}
                  </h3>
                </div>
                <p className="text-xs text-slate-500">
                  Step-by-step curriculum with practical projects, industry tools, and recommended learning resources.
                </p>
              </div>

              {/* Progress bar */}
              <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 px-4 py-2 rounded-2xl shrink-0">
                <div className="text-xs font-bold text-slate-700">
                  Progress: {progressPercent}%
                </div>
                <div className="w-24 h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                    style={{ width: `${progressPercent}%` }}
                  ></div>
                </div>
              </div>
            </div>

            {/* Stages Stack */}
            <div className="space-y-4">
              {currentRoadmap.stages.map((stage) => {
                const isCompleted = roleCompletedStages.includes(stage.stage)
                return (
                  <div
                    key={stage.stage}
                    className={`border rounded-2xl p-5 transition-all ${
                      isCompleted
                        ? "bg-emerald-50/40 border-emerald-200 shadow-sm"
                        : "bg-slate-50/60 border-slate-200 hover:border-indigo-200 hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                      {/* Left: Stage Number & Main Details */}
                      <div className="flex items-start gap-4 flex-1">
                        <button
                          onClick={() => toggleStage(stage.stage)}
                          title={isCompleted ? "Mark Incomplete" : "Mark Stage Completed"}
                          className={`w-9 h-9 rounded-xl font-bold text-sm flex items-center justify-center shrink-0 transition-all border ${
                            isCompleted
                              ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                              : "bg-white text-indigo-700 border-indigo-200 hover:bg-indigo-50"
                          }`}
                        >
                          {isCompleted ? "✓" : stage.stage}
                        </button>

                        <div className="flex-1">
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            <span className="text-base font-bold text-slate-900">
                              {stage.title}
                            </span>
                            <span className="text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100 px-2 py-0.5 rounded-md">
                              {stage.duration}
                            </span>
                            {isCompleted && (
                              <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md">
                                Completed
                              </span>
                            )}
                          </div>

                          <p className="text-xs text-slate-600 leading-relaxed mb-3">
                            {stage.description}
                          </p>

                          {/* Focus Skills */}
                          <div className="flex flex-wrap items-center gap-1.5 mb-3">
                            <span className="text-[11px] font-bold text-slate-400 mr-1">Skills:</span>
                            {stage.skills.map((s) => (
                              <span
                                key={s}
                                className="bg-white border border-slate-200 text-slate-700 text-[11px] font-semibold px-2 py-0.5 rounded-md"
                              >
                                {s}
                              </span>
                            ))}
                          </div>

                          {/* Practical Project Milestone */}
                          <div className="bg-white border border-slate-200 rounded-xl p-3 mb-2 flex items-start gap-2">
                            <span className="text-amber-500 text-xs mt-0.5">🚀</span>
                            <div>
                              <div className="text-[11px] font-bold text-slate-900 uppercase tracking-wide">
                                Practical Hands-on Project Milestone:
                              </div>
                              <div className="text-xs font-semibold text-indigo-700">
                                {stage.project}
                              </div>
                            </div>
                          </div>

                          {/* Curated Resources */}
                          <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500 mt-2">
                            <span className="font-bold text-slate-400">Curated References:</span>
                            {stage.resources.map((res, i) => (
                              <span
                                key={i}
                                className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-[10px] font-medium"
                              >
                                📚 {res}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Right: Checkbox Action */}
                      <button
                        onClick={() => toggleStage(stage.stage)}
                        className={`text-xs font-bold px-3 py-1.5 rounded-xl border transition-all shrink-0 self-start md:self-center ${
                          isCompleted
                            ? "bg-white text-emerald-700 border-emerald-300 hover:bg-emerald-50"
                            : "bg-indigo-600 text-white border-indigo-600 hover:bg-indigo-700 shadow-sm"
                        }`}
                      >
                        {isCompleted ? "Mark Incomplete" : "Mark as Completed"}
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Bottom Actions */}
            <div className="mt-8 flex flex-wrap items-center justify-between gap-4 pt-6 border-t border-slate-100">
              <div className="text-xs font-medium text-slate-500">
                Ready to apply for jobs matching your current skills?
              </div>
              <button
                onClick={() => onNavigate("internships")}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl text-xs font-bold shadow-sm transition-all flex items-center gap-2"
              >
                <BriefcaseIcon size={16} /> Browse Live {currentRoadmap.role} Jobs
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
