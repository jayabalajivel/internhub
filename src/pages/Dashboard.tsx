import { useState, useEffect } from "react"
import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  ResponsiveContainer,
} from "recharts"
import {
  SparklesIcon,
  BriefcaseIcon,
  FileTextIcon,
  ZapIcon,
  ArrowRightIcon,
  UploadIcon,
  MapPinIcon,
  AwardIcon,
  CheckIcon,
} from "../components/Icons"
import { api } from "../api"

interface Props {
  onNavigate: (p: string) => void
}

function CircleProgress({
  value,
  color,
  size = 80,
}: {
  value: number
  color: string
  size?: number
}) {
  const r = (size - 12) / 2
  const circ = 2 * Math.PI * r
  const offset = circ - (value / 100) * circ
  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="var(--surface3, #e2e8f0)"
        strokeWidth={6}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth={6}
        strokeLinecap="round"
        strokeDasharray={circ}
        strokeDashoffset={offset}
        className="transition-all duration-1000 ease-out"
      />
    </svg>
  )
}

export default function Dashboard({ onNavigate }: Props) {
  const [studentName, setStudentName] = useState("Student")
  const [skills, setSkills] = useState<string[]>([])
  const [candidateProfile, setCandidateProfile] = useState<any>(() => {
    try {
      const s = localStorage.getItem("internhub_candidate_profile")
      const parsed = s ? JSON.parse(s) : null
      return parsed && parsed.is_resume !== false ? parsed : null
    } catch {
      return null
    }
  })
  const [applications, setApplications] = useState<any[]>([])
  const [savedJobsCount, setSavedJobsCount] = useState(0)
  const [topMatches, setTopMatches] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const [statusCounts, setStatusCounts] = useState({
    applied: 0,
    interviewing: 0,
    offered: 0,
    rejected: 0,
  })

  useEffect(() => {
    const fetchData = async () => {
      try {
        const profileData = await api.getProfile()
        const candidateStr = localStorage.getItem("internhub_candidate_profile")
        let cand = candidateStr ? JSON.parse(candidateStr) : null
        if (cand && cand.is_resume === false) {
          cand = null
        }
        setCandidateProfile(cand)

        const detectedName =
          cand?.name && cand.name !== "Engineering Student"
            ? cand.name
            : profileData.name && profileData.name !== "Student"
              ? profileData.name
              : "Student"
        setStudentName(detectedName)

        const userSkills =
          cand?.extracted_skills && cand.extracted_skills.length > 0
            ? cand.extracted_skills
            : profileData.profile?.skills || []
        setSkills(userSkills)

        const apps = await api.getApplications()
        setApplications(apps || [])

        const counts = { applied: 0, interviewing: 0, offered: 0, rejected: 0 }
        ;(apps || []).forEach((a: any) => {
          const s = (a.status || "Applied").toLowerCase()
          if (s === "applied") counts.applied++
          else if (s === "interviewing" || s === "interview")
            counts.interviewing++
          else if (s === "offered" || s === "offer") counts.offered++
          else if (s === "rejected") counts.rejected++
          else counts.applied++
        })
        setStatusCounts(counts)

        const saved = await api.getSavedJobs()
        setSavedJobsCount((saved || []).length)

        // Show dashboard immediately without waiting for recommendation remote queries
        setLoading(false)

        // Fetch top recommendations asynchronously
        if (userSkills.length > 0) {
          try {
            const recommended = await api.getRecommendations()
            const top3 = (recommended || []).slice(0, 3)
            setTopMatches(top3)
            if (top3.length > 0) {
              const avgScore = Math.round(
                top3.reduce((sum, j) => sum + (j.matchPercentage || 0), 0) /
                  top3.length,
              )
              setAiMatchScore(avgScore)
            }
          } catch (recErr) {
            console.warn("Recommendations load error:", recErr)
          }
        } else {
          setTopMatches([])
          setAiMatchScore(0)
        }
      } catch (err) {
        console.error("Dashboard data load error:", err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
    const handleUpdate = () => fetchData()
    window.addEventListener("internhub_profile_updated", handleUpdate)
    window.addEventListener("internhub_applications_updated", handleUpdate)
    return () => {
      window.removeEventListener("internhub_profile_updated", handleUpdate)
      window.removeEventListener("internhub_applications_updated", handleUpdate)
    }
  }, [])

  const [aiMatchScore, setAiMatchScore] = useState(0)

  const radarData = skills.map((skill, idx) => ({
    skill,
    score: Math.min(100, 60 + idx * 5 + skills.length * 3),
  }))

  const metrics = [
    {
      label: "Saved Openings",
      value: savedJobsCount,
      unit: " jobs",
      color: "#4F46E5",
      bg: "bg-indigo-50 text-indigo-600",
      icon: FileTextIcon,
    },
    {
      label: "Active Applications",
      value: applications.length,
      unit: " tracks",
      color: "#0284C7",
      bg: "bg-sky-50 text-sky-600",
      icon: ZapIcon,
    },
    {
      label: "Avg AI Match Score",
      value: aiMatchScore,
      unit: "%",
      color: "#059669",
      bg: "bg-emerald-50 text-emerald-600",
      icon: SparklesIcon,
    },
  ]

  const recentActivity = [
    {
      text: `Profile synchronized: ${studentName}`,
      time: "Just now",
      color: "text-blue-600",
      bg: "bg-blue-50",
      icon: "✓",
    },
    {
      text:
        skills.length > 0
          ? `${skills.length} technical skills parsed`
          : "Waiting for CV/Resume registration",
      time: "1m ago",
      color: "text-emerald-600",
      bg: "bg-emerald-50",
      icon: "✦",
    },
    {
      text: `${applications.length} applications tracked`,
      time: "5m ago",
      color: "text-indigo-600",
      bg: "bg-indigo-50",
      icon: "↑",
    },
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[80vh]">
        <div className="w-10 h-10 border-4 border-slate-200 border-t-indigo-600 rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full font-sans">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 mb-1 flex items-center gap-2">
            Welcome back, <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-blue-500">{studentName}</span> 👋
          </h1>
          <p className="text-slate-500 text-sm">
            {skills.length > 0
              ? "Here's what's happening with your internship hunt today."
              : "Connect your student profile to filter and validate listings."}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-1.5 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wide">System Online</span>
          </div>
          <button
            onClick={() => onNavigate("internships")}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-xl transition-all shadow-sm hover:shadow-md flex items-center gap-2 text-sm"
          >
            <BriefcaseIcon size={16} />
            Explore Roles
          </button>
        </div>
      </div>

      {/* Real-Time Processed Resume Overview Banner */}
      {candidateProfile && (
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white border border-indigo-500/20 rounded-3xl p-6 lg:p-7 mb-8 shadow-sm relative overflow-hidden">
          <div className="absolute -top-12 -right-12 w-64 h-64 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="min-w-0 flex-1">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-bold uppercase tracking-wider mb-2.5">
                <CheckIcon size={12} className="text-emerald-400" />
                Verified Candidate Resume Profile
              </div>
              <h2 className="text-2xl font-bold tracking-tight text-white mb-2">
                {candidateProfile.name || studentName}
              </h2>
              <div className="flex flex-wrap items-center gap-2.5 text-xs text-slate-300 mb-4">
                <span className="font-semibold text-indigo-300 bg-indigo-950/80 border border-indigo-400/30 px-2.5 py-1 rounded-md">
                  🎯 {candidateProfile.primary_role || candidateProfile.domain || "Full Stack Developer"}
                </span>
                <span className="bg-slate-800/80 px-2.5 py-1 rounded-md">
                  🎓 {candidateProfile.education || "B.Tech Engineering"}
                </span>
                {candidateProfile.university && (
                  <span className="bg-slate-800/80 px-2.5 py-1 rounded-md">
                    🏛️ {candidateProfile.university}
                  </span>
                )}
                {candidateProfile.cgpa && (
                  <span className="text-amber-300 bg-slate-800/80 px-2.5 py-1 rounded-md font-semibold">
                    ⭐ CGPA: {candidateProfile.cgpa}
                  </span>
                )}
                {candidateProfile.location && (
                  <span className="bg-slate-800/80 px-2.5 py-1 rounded-md">
                    📍 {candidateProfile.location}
                  </span>
                )}
              </div>

              {/* Extracted Skills Badges */}
              {skills.length > 0 && (
                <div>
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    Extracted Technical Stack ({skills.length} skills):
                  </div>
                  <div className="flex flex-wrap gap-1.5 max-h-20 overflow-y-auto">
                    {skills.map((s) => (
                      <span
                        key={s}
                        className="bg-indigo-900/60 border border-indigo-400/20 text-indigo-200 text-[11px] font-semibold px-2 py-0.5 rounded-md"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row md:flex-col gap-2 shrink-0">
              <button
                onClick={() => onNavigate("skills")}
                className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold py-2.5 px-4 rounded-xl transition-all shadow-sm flex items-center justify-center gap-1.5 whitespace-nowrap"
              >
                <SparklesIcon size={14} />
                Skill Gap & Roadmap
              </button>
              <button
                onClick={() => onNavigate("resume")}
                className="bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-semibold py-2.5 px-4 rounded-xl transition-all flex items-center justify-center gap-1.5 whitespace-nowrap"
              >
                <UploadIcon size={14} />
                Update Resume
              </button>
            </div>
          </div>
        </div>
      )}

      {skills.length === 0 ? (
        /* Empty State Prompt */
        <div className="bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-100 rounded-3xl p-10 text-center mb-8 shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-white flex items-center justify-center mx-auto mb-5 shadow-sm border border-indigo-100">
            <UploadIcon size={28} className="text-indigo-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-3 tracking-tight">Upload Your Resume to Start</h2>
          <p className="text-slate-600 max-w-lg mx-auto mb-6 text-sm leading-relaxed">
            Our AI engine needs your resume to extract your technical stack, match you with genuine opportunities, and filter out spam listings automatically.
          </p>
          <button
            onClick={() => onNavigate("resume")}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-6 rounded-xl transition-all shadow-md flex items-center gap-2 mx-auto"
          >
            <SparklesIcon size={16} />
            Analyze & Sync Resume
          </button>
        </div>
      ) : (
        /* Metrics row */
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {metrics.map(({ label, value, unit, color, icon: Icon, bg }) => (
            <div key={label} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${bg}`}>
                  <Icon size={20} />
                </div>
                <div className="relative w-14 h-14">
                  <CircleProgress value={value} color={color} size={56} />
                  <div className="absolute inset-0 flex items-center justify-center text-xs font-bold" style={{ color }}>
                    {value}
                  </div>
                </div>
              </div>
              <div className="text-3xl font-bold text-slate-900 mb-1">
                {value}<span className="text-lg font-semibold text-slate-500 ml-1">{unit}</span>
              </div>
              <div className="text-sm font-medium text-slate-500">{label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Main grids */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        
        {/* Application Tracker (Spans 2 cols) */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Application Pipeline</h3>
              <p className="text-sm text-slate-500">Live tracking status across your active applications</p>
            </div>
            <button
              onClick={() => onNavigate("tracker")}
              className="text-indigo-600 bg-indigo-50 hover:bg-indigo-100 font-semibold py-1.5 px-3 rounded-lg text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              Application Tracker <ArrowRightIcon size={12} />
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {[
              {
                label: "Applied",
                val: statusCounts.applied,
                icon: "📤",
                bg: "bg-blue-50 border-blue-100",
                text: "text-blue-600",
              },
              {
                label: "Interviewing",
                val: statusCounts.interviewing,
                icon: "🎯",
                bg: "bg-indigo-50 border-indigo-100",
                text: "text-indigo-600",
              },
              {
                label: "Offered",
                val: statusCounts.offered,
                icon: "🎉",
                bg: "bg-emerald-50 border-emerald-100",
                text: "text-emerald-600",
              },
              {
                label: "Rejected",
                val: statusCounts.rejected,
                icon: "✗",
                bg: "bg-rose-50 border-rose-100",
                text: "text-rose-600",
              },
            ].map((stat, i) => (
              <div
                key={i}
                className={`${stat.bg} border rounded-xl p-4 flex flex-col justify-between`}
              >
                <div
                  className={`text-[10px] font-bold ${stat.text} uppercase tracking-wider mb-2 flex items-center gap-1.5`}
                >
                  <span>{stat.icon}</span> {stat.label}
                </div>
                <div className="text-3xl font-bold text-slate-800">{stat.val}</div>
              </div>
            ))}
          </div>

          {applications.length > 0 ? (
            <div>
              <div className="flex justify-between text-xs font-medium text-slate-500 mb-2">
                <span>Conversion Rate</span>
                <span className="text-slate-800 font-bold">{applications.length} Total Applications</span>
              </div>
              <div className="h-3 rounded-full bg-slate-100 overflow-hidden flex w-full">
                <div style={{ width: `${(statusCounts.applied / applications.length) * 100}%` }} className="bg-blue-500 transition-all"></div>
                <div style={{ width: `${(statusCounts.interviewing / applications.length) * 100}%` }} className="bg-indigo-500 transition-all"></div>
                <div style={{ width: `${(statusCounts.offered / applications.length) * 100}%` }} className="bg-emerald-500 transition-all"></div>
                <div style={{ width: `${(statusCounts.rejected / applications.length) * 100}%` }} className="bg-rose-500 transition-all"></div>
              </div>
            </div>
          ) : (
            <div className="py-6 text-center border-2 border-dashed border-slate-200 rounded-xl bg-slate-50">
              <span className="text-sm font-medium text-slate-500">No active applications tracked yet.</span>
            </div>
          )}
        </div>

        {/* Skills Radar (1 col) */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col">
          <div className="mb-2">
            <h3 className="text-lg font-bold text-slate-900">Skill Density Map</h3>
            <p className="text-sm text-slate-500">Strength vector analysis</p>
          </div>
          
          <div className="flex-1 flex flex-col items-center justify-center min-h-[220px]">
            {skills.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData} margin={{ top: 10, right: 10, bottom: 10, left: 10 }}>
                  <PolarGrid stroke="#e2e8f0" />
                  <PolarAngleAxis dataKey="skill" tick={{ fill: '#64748b', fontSize: 11, fontWeight: 600 }} />
                  <Radar name="Skills" dataKey="score" stroke="#4f46e5" fill="#4f46e5" fillOpacity={0.2} strokeWidth={2} />
                </RadarChart>
              </ResponsiveContainer>
            ) : (
              <span className="text-xs font-medium text-slate-400">Radar maps actual technical skills</span>
            )}
          </div>
          
          <div className="mt-auto flex justify-center pt-2">
            <button onClick={() => onNavigate("resume")} className="text-sm font-semibold text-indigo-600 hover:text-indigo-800 transition-colors flex items-center gap-1">
              Analyze Resume <ArrowRightIcon size={14} />
            </button>
          </div>
        </div>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recommended Jobs */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Recommended For You</h3>
              <p className="text-sm text-slate-500">AI-matched based on your verified skills</p>
            </div>
            <button onClick={() => onNavigate("internships")} className="text-sm font-semibold text-indigo-600 hover:text-indigo-800 transition-colors flex items-center gap-1">
              View All <ArrowRightIcon size={14} />
            </button>
          </div>

          <div className="space-y-3">
            {skills.length > 0 ? (
              topMatches.map((job) => (
                <div key={job.id || job._id} onClick={() => onNavigate("internships")} className="group flex items-center justify-between p-3.5 rounded-xl border border-slate-100 bg-white hover:border-indigo-200 hover:shadow-md transition-all cursor-pointer">
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center font-bold text-indigo-700">
                      {job.company ? job.company[0].toUpperCase() : "J"}
                    </div>
                    <div>
                      <div className="font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors">{job.company}</div>
                      <div className="text-xs text-slate-500">{job.title} • {job.location}</div>
                    </div>
                  </div>
                  <div className={`px-2.5 py-1 rounded-md text-xs font-bold ${job.matchPercentage >= 70 ? 'bg-emerald-100 text-emerald-700' : job.matchPercentage >= 40 ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-600'}`}>
                    {job.matchPercentage ?? 0}% Match
                  </div>
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-sm font-medium text-slate-500">
                Upload your resume to unlock AI recommendations.
              </div>
            )}
          </div>
        </div>

        {/* Activity Log */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <div className="mb-6">
            <h3 className="text-lg font-bold text-slate-900">System Activity Log</h3>
            <p className="text-sm text-slate-500">Platform audits & background syncs</p>
          </div>

          <div className="space-y-0 relative">
            <div className="absolute top-4 bottom-4 left-3.5 w-px bg-slate-200"></div>
            {recentActivity.map((log, i) => (
              <div key={i} className="flex gap-4 pb-6 relative z-10 last:pb-0">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold shadow-sm ${log.bg} ${log.color} ring-4 ring-white`}>
                  {log.icon}
                </div>
                <div className="pt-1">
                  <div className="text-sm font-medium text-slate-700 mb-0.5">{log.text}</div>
                  <div className="text-xs font-semibold text-slate-400">{log.time}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

    </div>
  )
}
