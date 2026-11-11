import { useState, useRef, useEffect } from "react"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts"
import {
  UploadIcon,
  SparklesIcon,
  ZapIcon,
  BrainIcon,
  CheckIcon,
  RefreshIcon,
  BriefcaseIcon,
  AlertIcon,
  HomeIcon,
} from "../components/Icons"
import { api } from "../api"
import { ROLE_ROADMAPS, getRoleRoadmap } from "../roadmaps"
import { isSkillSatisfied } from "../jobServices"

interface Props {
  onNavigate: (p: string) => void
}

type Stage = "upload" | "analyzing" | "result"

const analysisSteps = [
  "Parsing document structure...",
  "Running NLP document classification...",
  "Extracting & normalizing technical skills...",
  "Detecting project & experience evidence...",
  "Classifying software/IT candidate roles...",
  "Performing skill-gap analysis...",
  "Generating dynamic learning roadmap...",
  "Matching & ranking live API jobs...",
]

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-slate-900 border border-slate-700 rounded-xl p-3 shadow-xl">
      <div className="text-slate-400 text-xs font-semibold mb-1">{label}</div>
      <div className="text-white text-sm font-bold">{payload[0].value}%</div>
    </div>
  )
}

export default function ResumeUpload({ onNavigate }: Props) {
  const [stage, setStage] = useState<Stage>("upload")
  const [dragging, setDragging] = useState(false)
  const [fileName, setFileName] = useState("")
  const [progress, setProgress] = useState(0)
  const [currentStep, setCurrentStep] = useState(0)
  const [resultData, setResultData] = useState<any>(null)
  const [recommendedJobs, setRecommendedJobs] = useState<any[]>([])
  const [roadmapRole, setRoadmapRole] = useState<string>("")
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const cachedProfile = localStorage.getItem("internhub_candidate_profile")
    if (cachedProfile) {
      try {
        const parsed = JSON.parse(cachedProfile)
        if (parsed && parsed.is_resume !== false && parsed.extracted_skills && parsed.extracted_skills.length >= 2) {
          setResultData(parsed)
          if (parsed.primary_role) {
            setRoadmapRole(parsed.primary_role)
          }
        }
      } catch (e) {
        console.error(e)
      }
    }
  }, [])

  const startAnalysis = (file: File) => {
    setFileName(file.name)
    setStage("analyzing")
    setProgress(0)
    setCurrentStep(0)
    setResultData(null)
    setRecommendedJobs([])

    let apiCompleted = false
    let result: any = null
    let interval: any = null

    const finishImmediately = (finalResult: any) => {
      if (interval) clearInterval(interval)
      setProgress(100)
      setCurrentStep(analysisSteps.length - 1)
      setTimeout(() => {
        setResultData(finalResult)
        if (finalResult?.primary_role) {
          setRoadmapRole(finalResult.primary_role)
        }
        setStage("result")

        if (finalResult?.is_resume !== false && (finalResult?.extracted_skills?.length || 0) >= 2) {
          api
            .getRecommendations()
            .then((jobs) => setRecommendedJobs(jobs.slice(0, 4)))
            .catch((e) => console.error(e))
        } else {
          setRecommendedJobs([])
        }
      }, 180)
    }

    api
      .analyzeResume(file)
      .then((res) => {
        result = res
        apiCompleted = true
        finishImmediately(res)
      })
      .catch((err) => {
        console.error(err)
        apiCompleted = true
        finishImmediately(null)
      })

    let prog = 0
    let step = 0
    interval = setInterval(() => {
      if (apiCompleted) return
      prog += Math.random() * 18 + 12
      step = Math.min(
        Math.floor(prog / (100 / analysisSteps.length)),
        analysisSteps.length - 1,
      )
      setProgress(Math.min(prog, 94))
      setCurrentStep(step)
    }, 110)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) startAnalysis(file)
  }

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) startAnalysis(file)
  }

  const handleRoleChange = async (newRole: string) => {
    setRoadmapRole(newRole)
    if (resultData) {
      setResultData((prev: any) => ({
        ...prev,
        primary_role: newRole,
        domain: newRole,
      }))
    }
    try {
      await (api as any).updatePrimaryRole(newRole)
      api
        .getRecommendations()
        .then((jobs) => setRecommendedJobs(jobs.slice(0, 4)))
        .catch(() => {})
    } catch (e) {
      console.error("Failed to update primary role:", e)
    }
  }

  const activeRole =
    roadmapRole || resultData?.primary_role || "Full Stack Developer"
  const activeRoadmap = getRoleRoadmap(
    activeRole,
    resultData?.extracted_skills || [],
  )
  const activeRoleSkills = activeRoadmap.skills || []
  const foundSkillsList = resultData?.extracted_skills || []
  const activeAlreadyHave = activeRoleSkills.filter((rs: string) =>
    isSkillSatisfied(foundSkillsList, rs),
  )
  const activeNeedToLearn = activeRoleSkills.filter(
    (rs: string) => !isSkillSatisfied(foundSkillsList, rs),
  )
  const activeMatchPct =
    activeRoleSkills.length > 0
      ? Math.round(
          (activeAlreadyHave.length / activeRoleSkills.length) * 100,
        )
      : 0

  const skillScores = resultData?.extracted_skills
    ? resultData.extracted_skills.map((s: string) => {
      const isProject = (resultData.project_skills || []).some(
        (ps: string) => ps.toLowerCase() === s.toLowerCase(),
      )
      const isExp = (resultData.experience_skills || []).some(
        (es: string) => es.toLowerCase() === s.toLowerCase(),
      )
      const isStrong = (resultData.strong_skills || []).some(
        (ss: string) => ss.toLowerCase() === s.toLowerCase(),
      )

      let score = 70
      if (isProject && isExp) score = 95
      else if (isProject || isStrong) score = 88
      else if (isExp) score = 82

      return { skill: s, score }
    })
    : []

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto w-full font-sans">
      <div className="mb-10">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 mb-3">
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-blue-500">AI/ML Resume</span> Analysis & Recommendation System
        </h1>
        <p className="text-slate-500 text-sm max-w-3xl">
          Upload your CV to automatically extract technical skills, project evidence, predict multi-domain engineering roles (CS, IT, Mechanical, EEE, Civil), analyze skill gaps, and rank live job recommendations.
        </p>
      </div>

      {stage === "upload" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            {/* Upload Box */}
            <div
              onDragOver={(e) => {
                e.preventDefault()
                setDragging(true)
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileRef.current?.click()}
              className={`border-2 border-dashed rounded-3xl p-16 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${dragging
                  ? 'border-indigo-500 bg-indigo-50/50'
                  : 'border-slate-200 bg-white hover:border-indigo-300 hover:bg-slate-50'
                }`}
            >
              <input
                ref={fileRef}
                type="file"
                accept=".pdf,.docx,.doc,.txt"
                onChange={handleFile}
                className="hidden"
              />
              <div className="w-20 h-20 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center mb-6 shadow-sm">
                <UploadIcon size={32} className="text-indigo-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">
                {dragging ? "Drop your resume here!" : "Drop your Resume (PDF / DOCX / TXT) or click to browse"}
              </h3>
              <p className="text-sm text-slate-500 font-medium">
                Extracts skills, project evidence, engineering roles (CS, Mech, EEE, Civil), skill gaps & matching jobs.
              </p>
            </div>
          </div>

          {/* AI Extraction Features */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm h-fit">
            <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
              <BrainIcon size={20} className="text-indigo-600" /> NLP & ML Feature Targets
            </h3>
            <div className="space-y-5">
              {[
                { label: "Document Classification", desc: "Validates Resume/CV vs Irrelevant Files (Bills/Receipts)", color: "text-indigo-500", bg: "bg-indigo-50", border: "border-indigo-100" },
                { label: "Skill Normalization", desc: "Normalizes JS -> JavaScript, Mongo DB -> MongoDB, etc.", color: "text-emerald-500", bg: "bg-emerald-50", border: "border-emerald-100" },
                { label: "Project-Aware Weighting", desc: "Gives higher confidence to skills backed by project evidence", color: "text-purple-500", bg: "bg-purple-50", border: "border-purple-100" },
                { label: "Multi-Department Role Prediction", desc: "Predicts roles across CS/IT, Mechanical, EEE, Civil & Robotics", color: "text-amber-500", bg: "bg-amber-50", border: "border-amber-100" },
                { label: "Skill Gap & Learning Roadmap", desc: "Identifies missing skills & generates 5-stage roadmap", color: "text-blue-500", bg: "bg-blue-50", border: "border-blue-100" },
                { label: "Job Matching & Ranking", desc: "Compares candidate profile with live aggregated API jobs", color: "text-rose-500", bg: "bg-rose-50", border: "border-rose-100" },
              ].map(({ label, desc, color, bg, border }) => (
                <div key={label} className="flex gap-4">
                  <div className={`w-8 h-8 rounded-lg flex shrink-0 items-center justify-center ${bg} ${border} border`}>
                    <CheckIcon size={16} className={color} />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-slate-900 mb-0.5">{label}</div>
                    <div className="text-[11px] font-medium text-slate-500 leading-snug">{desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {stage === "analyzing" && (
        <div className="flex flex-col items-center justify-center py-32 text-center bg-white border border-slate-200 rounded-3xl shadow-sm">
          <div className="relative w-32 h-32 mb-10">
            <div className="absolute inset-0 rounded-full bg-[conic-gradient(from_0deg,#4f46e5,#10b981,#8b5cf6,#4f46e5)] animate-spin opacity-20 blur-xl"></div>
            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-indigo-600 animate-spin"></div>
            <div className="absolute inset-2 bg-white rounded-full flex items-center justify-center shadow-inner">
              <BrainIcon size={48} className="text-indigo-600 animate-pulse" />
            </div>
          </div>

          <h2 className="text-2xl font-bold text-slate-900 mb-2">Analyzing Candidate Resume...</h2>
          <p className="text-sm font-medium text-slate-500 mb-8">{fileName}</p>

          <div className="flex items-center gap-3 mb-8 bg-indigo-50 px-4 py-2 rounded-full border border-indigo-100">
            <div className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-ping"></div>
            <span className="text-sm font-bold text-indigo-700">{analysisSteps[currentStep]}</span>
          </div>

          <div className="w-full max-w-md bg-slate-100 rounded-full h-2 mb-2 overflow-hidden border border-slate-200">
            <div className="bg-indigo-600 h-full rounded-full transition-all duration-300 ease-out" style={{ width: `${progress}%` }}></div>
          </div>
          <div className="text-sm font-bold text-slate-500">{Math.round(progress)}%</div>
        </div>
      )}

      {stage === "result" && (
        <div className="space-y-6">
          {!resultData ? (
            <div className="bg-rose-50 border border-rose-200 rounded-3xl p-8 shadow-sm">
              <div className="flex items-start gap-4 mb-6">
                <div className="bg-white p-3 rounded-2xl shadow-sm border border-rose-100">
                  <AlertIcon size={32} className="text-rose-500" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-rose-700 mb-1">
                    Document Processing Error
                  </h3>
                  <p className="text-sm font-medium text-rose-600/80">
                    The uploaded file could not be parsed into readable text. Please ensure you are uploading a text-searchable PDF, DOCX, or TXT file.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setStage("upload")}
                className="bg-rose-600 hover:bg-rose-700 text-white px-6 py-3 rounded-xl font-semibold shadow-sm transition-colors text-sm"
              >
                Upload Again
              </button>
            </div>
          ) : resultData?.is_resume === false || resultData?.isResume === false ? (
            /* NON-RESUME / IRRELEVANT DOCUMENT ALERT */
            <div className="bg-rose-50/70 border border-rose-200 rounded-3xl p-8 shadow-sm">
              <div className="flex items-start gap-4 mb-6">
                <div className="bg-white p-3 rounded-2xl shadow-sm border border-rose-100">
                  <AlertIcon size={32} className="text-rose-500" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-rose-100 text-rose-700 px-2.5 py-0.5 rounded-full">
                      Guardrail Activated
                    </span>
                    <span className="text-xs font-semibold text-rose-500">
                      100% Precision Filter
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-1">
                    {resultData?.document_type || resultData?.documentType || "Irrelevant Document Detected"}
                  </h3>
                  <p className="text-sm font-medium text-slate-600 leading-relaxed">
                    {resultData?.warning || "The uploaded document does not match a candidate resume/CV structure."}
                  </p>
                </div>
              </div>

              <div className="bg-white border border-rose-100 rounded-2xl p-6 mb-6">
                <strong className="text-sm text-slate-900 mb-4 block flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                  NLP Document Classification & Integrity Audit:
                </strong>
                <ul className="space-y-3 text-sm text-slate-600">
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-400 mt-2 shrink-0"></span>
                    <span>
                      Detected Classification: <strong className="text-rose-700 ml-1">{resultData?.document_type || resultData?.documentType || "Non-Resume File"}</strong>
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400 mt-2 shrink-0"></span>
                    <span>
                      Profile Integrity: <strong className="text-slate-800 ml-1">0 technical skills accepted</strong> (Prevents corrupted data from polluting candidate recommendations).
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400 mt-2 shrink-0"></span>
                    <span>
                      Recommendation Pipeline: <strong className="text-slate-800 ml-1">Safely bypassed</strong> until a verified candidate resume/CV is provided.
                    </span>
                  </li>
                </ul>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={() => setStage("upload")}
                  className="bg-rose-600 hover:bg-rose-700 text-white px-6 py-3 rounded-xl font-semibold shadow-sm transition-colors text-sm flex items-center gap-2"
                >
                  <RefreshIcon size={16} /> Upload an Official Candidate Resume / CV
                </button>
              </div>
            </div>
          ) : resultData?.warning && resultData?.extracted_skills?.length < 2 ? (
            /* INSUFFICIENT RESUME WARNING */
            <div className="bg-amber-50 border border-amber-200 rounded-3xl p-8 shadow-sm">
              <div className="flex items-start gap-4 mb-6">
                <div className="bg-white p-3 rounded-2xl shadow-sm border border-amber-100">
                  <AlertIcon size={32} className="text-amber-500" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-amber-700 mb-1">Insufficient Resume Information</h3>
                  <p className="text-sm font-medium text-amber-600/80">{resultData?.warning}</p>
                </div>
              </div>

              <div className="bg-white border border-amber-100 rounded-2xl p-6 mb-6 text-sm">
                <strong className="text-slate-900 mr-2">Skills Detected So Far:</strong>
                <span className="text-slate-600">{resultData?.extracted_skills?.join(", ") || "None"}</span>
              </div>

              <button
                onClick={() => setStage("upload")}
                className="bg-amber-500 hover:bg-amber-600 text-white px-6 py-3 rounded-xl font-semibold shadow-sm transition-colors text-sm"
              >
                Upload a Complete Resume
              </button>
            </div>
          ) : (
            /* VALID TECHNICAL RESUME ANALYSIS RESULTS */
            <>
              {/* Top Profile Summary Header */}
              <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm flex flex-col md:flex-row items-center gap-8">
                <div className="flex items-center gap-6">
                  <div className="relative w-24 h-24">
                    <svg width={96} height={96} className="-rotate-90">
                      <circle cx={48} cy={48} r={40} fill="none" stroke="#e2e8f0" strokeWidth={10} />
                      <circle
                        cx={48}
                        cy={48}
                        r={40}
                        fill="none"
                        stroke="#4f46e5"
                        strokeWidth={10}
                        strokeLinecap="round"
                        strokeDasharray={251.2}
                        strokeDashoffset={251.2 - ((resultData?.score || 75) / 100) * 251.2}
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-2xl font-bold text-indigo-600 leading-none">{resultData?.score || 75}</span>
                      <span className="text-[9px] font-bold text-slate-400 mt-0.5">/100</span>
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                        Primary Target Role
                      </span>
                      <span className="text-[10px] font-bold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded border border-indigo-100">
                        {activeRole === (resultData?.primary_role || resultData?.domain) ? "AI Verified" : "User Selected"}
                      </span>
                    </div>
                    <div className="text-2xl font-bold text-slate-900 mb-2">
                      {activeRole}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-slate-500">Change Primary Role:</span>
                      <select
                        value={activeRole}
                        onChange={(e) => handleRoleChange(e.target.value)}
                        className="bg-slate-50 border border-slate-300 text-slate-800 text-xs font-bold rounded-xl px-2.5 py-1 focus:ring-2 focus:ring-indigo-500 cursor-pointer shadow-sm"
                      >
                        {Object.values(ROLE_ROADMAPS).map((r) => (
                          <option key={r.role} value={r.role}>
                            {r.role} ({r.department})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="flex-1 hidden md:block"></div>

                <div className="flex items-center gap-8 md:border-l md:border-slate-200 md:pl-8 self-stretch">
                  {[
                    { label: "Technical Skills", value: `${resultData?.extracted_skills?.length || 0} items`, color: "text-emerald-600" },
                    { label: "Project Evidence", value: `${resultData?.project_skills?.length || resultData?.strong_skills?.length || 0} skills`, color: "text-purple-600" },
                    { label: "Predicted Roles", value: `${resultData?.predicted_roles?.length || 1} roles`, color: "text-indigo-600" },
                  ].map(({ label, value, color }) => (
                    <div key={label} className="text-center">
                      <div className="text-[11px] font-bold text-slate-400 uppercase mb-1">{label}</div>
                      <div className={`text-xl font-bold ${color}`}>{value}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* GRID ROW 1: EXTRACTED SKILLS & PROJECT EVIDENCE VS PREDICTED ROLES */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Extracted Skills & Section Evidence */}
                <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm flex flex-col">
                  <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                    <SparklesIcon size={20} className="text-indigo-500" /> Extracted Skills & Evidence
                  </h3>

                  <div className="mb-8">
                    <div className="text-xs font-bold text-slate-400 uppercase mb-3 tracking-wide">
                      ALL EXTRACTED SKILLS ({resultData?.extracted_skills?.length})
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {resultData?.extracted_skills?.map((s: string) => {
                        const isProjectBacked = resultData?.project_skills?.includes(s) || resultData?.strong_skills?.includes(s)
                        return (
                          <span
                            key={s}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 border transition-colors ${isProjectBacked
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : 'bg-slate-50 text-slate-700 border-slate-200'
                              }`}
                          >
                            {s}
                            {isProjectBacked && (
                              <span className="text-[9px] bg-emerald-500 text-white px-1.5 py-0.5 rounded font-bold ml-1 uppercase">Evidence</span>
                            )}
                          </span>
                        )
                      })}
                    </div>
                  </div>

                  <div className="border-t border-slate-100 pt-6 mt-auto">
                    <div className="text-xs font-bold text-slate-400 uppercase mb-2 tracking-wide">PROJECT & EXPERIENCE EVIDENCE SUMMARY</div>
                    <p className="text-sm font-medium text-slate-600 leading-relaxed">
                      {resultData?.project_skills?.length > 0 ? (
                        <>
                          Strong confidence assigned to <strong className="text-slate-900">{resultData.project_skills.join(", ")}</strong> because they were explicitly detected in actual project descriptions.
                        </>
                      ) : (
                        "Skills listed were extracted from the candidate profile and technical skills section."
                      )}
                    </p>
                  </div>
                </div>

                {/* Predicted Software/IT Roles & Probability Scores */}
                <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm">
                  <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                    <BrainIcon size={20} className="text-indigo-500" /> ML/NLP Predicted Roles
                  </h3>

                  <div className="space-y-6">
                    {resultData?.predicted_roles?.length > 0 ? (
                      resultData.predicted_roles.map((r: any, idx: number) => (
                        <div key={r.role} className="flex items-center justify-between gap-4">
                          <div className="flex-1">
                            <div className={`text-sm font-bold mb-1 flex items-center gap-2 ${idx === 0 ? 'text-slate-900' : 'text-slate-600'}`}>
                              {r.role}
                              {idx === 0 && <span className="text-[10px] bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-md font-bold uppercase">Primary</span>}
                            </div>
                            {r.matched_core_skills && (
                              <div className="text-xs font-medium text-slate-400 line-clamp-1">
                                Core matches: {r.matched_core_skills.join(", ") || "Skill overlap"}
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-3 shrink-0">
                            <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                              <div
                                className={`h-full rounded-full ${idx === 0 ? 'bg-indigo-500' : 'bg-slate-400'}`}
                                style={{ width: `${r.confidence}%` }}
                              ></div>
                            </div>
                            <span className={`text-sm font-bold w-10 text-right ${idx === 0 ? 'text-indigo-600' : 'text-slate-600'}`}>
                              {r.confidence}%
                            </span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-sm font-medium text-slate-500">Role prediction calculation ready.</div>
                    )}
                  </div>
                </div>
              </div>

              {/* GRID ROW 2: SYNCHRONIZED SKILL GAP ANALYSIS & DYNAMIC ROADMAP */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Skill Gap Analysis Card */}
                <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between gap-3 mb-6">
                      <div>
                        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Target Role Skill Gap</div>
                        <h3 className="text-lg font-bold text-slate-900">{activeRole}</h3>
                      </div>
                      <span className={`px-2.5 py-1 rounded-xl text-xs font-bold ${
                        activeMatchPct >= 70 ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                        activeMatchPct >= 40 ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                        'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}>
                        {activeMatchPct}% Match
                      </span>
                    </div>

                    <div className="mb-6">
                      <div className="text-xs font-bold text-emerald-600 mb-3 flex items-center gap-1.5 uppercase tracking-wide">
                        <CheckIcon size={14} /> ALREADY HAVE ({activeAlreadyHave.length})
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {activeAlreadyHave.length > 0 ? (
                          activeAlreadyHave.map((s: string) => (
                            <span key={s} className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1">
                              ✓ {s}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-slate-400 italic">No matching skills acquired yet for this role.</span>
                        )}
                      </div>
                    </div>

                    <div className="border-t border-slate-100 pt-6">
                      <div className="text-xs font-bold text-rose-600 mb-3 flex items-center gap-1.5 uppercase tracking-wide">
                        ✕ NEED TO LEARN / GAPS ({activeNeedToLearn.length})
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {activeNeedToLearn.length > 0 ? (
                          activeNeedToLearn.map((s: string) => (
                            <span key={s} className="bg-rose-50 text-rose-700 border border-rose-200 px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1">
                              + {s}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-emerald-600 font-bold bg-emerald-50 px-2.5 py-1.5 rounded-lg border border-emerald-200">
                            🎉 Fully qualified for this role!
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                    <span>{activeAlreadyHave.length} of {activeRoleSkills.length} competencies acquired</span>
                    <button
                      onClick={() => handleRoleChange(activeRole)}
                      className="text-xs font-bold text-indigo-600 hover:text-indigo-700 hover:underline flex items-center gap-1"
                    >
                      Set as Primary Target Role
                    </button>
                  </div>
                </div>

                {/* Dynamic 5-Stage Learning Roadmap */}
                <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm flex flex-col justify-between">
                  <div>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                      <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                        <ZapIcon size={20} className="text-amber-500" />
                        <span>Roadmap: <span className="text-indigo-600">{activeRole}</span></span>
                      </h3>
                      <select
                        value={activeRole}
                        onChange={(e) => handleRoleChange(e.target.value)}
                        className="bg-slate-50 border border-slate-300 text-slate-800 text-xs font-bold rounded-xl px-2.5 py-1.5 focus:ring-2 focus:ring-indigo-500 focus:outline-none cursor-pointer"
                      >
                        {Object.values(ROLE_ROADMAPS).map((r) => (
                          <option key={r.role} value={r.role}>
                            {r.role} ({r.department})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Quick Role Badges */}
                    <div className="flex flex-wrap gap-1.5 mb-5">
                      {["Full Stack Developer", "Python Developer", "Mechanical Design Engineer", "Electrical & Electronics Engineer (EEE)", "Civil & Structural Engineer"].map((rName) => (
                        <button
                          key={rName}
                          onClick={() => handleRoleChange(rName)}
                          className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg border transition-all ${
                            activeRole === rName
                              ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                              : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                          }`}
                        >
                          {rName.replace(" Engineer", "").replace(" Developer", "")}
                        </button>
                      ))}
                    </div>

                    <div className="space-y-3 mb-6">
                      {activeRoadmap.stages.map((step) => (
                        <div key={step.stage} className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <div className="text-xs font-bold text-indigo-700">
                              Stage {step.stage}: {step.title}
                            </div>
                            <span className="text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100 px-2 py-0.5 rounded">
                              {step.duration}
                            </span>
                          </div>
                          <div className="text-xs font-medium text-slate-600 leading-relaxed mb-2">
                            {step.description}
                          </div>
                          <div className="text-[11px] font-semibold text-emerald-700 bg-white border border-emerald-100 p-2 rounded-lg flex items-center gap-1.5">
                            <span>🚀 Project:</span>
                            <span>{step.project}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={() => onNavigate("skillgap")}
                    className="w-full bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2 shadow-sm"
                  >
                    <span>Open Full Interactive Roadmap & Progress Tracker</span>
                    <span>→</span>
                  </button>
                </div>
              </div>

              {/* RECOMMENDED JOBS/INTERNSHIPS SECTION */}
              {recommendedJobs.length > 0 && (
                <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                    <div>
                      <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2 mb-1">
                        <BriefcaseIcon size={20} className="text-indigo-600" /> Ranked Job Recommendations
                      </h3>
                      <p className="text-sm font-medium text-slate-500">Live opportunities aggregated from JobData, Jooble & Remotive APIs.</p>
                    </div>
                    <button
                      className="text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 px-4 py-2 rounded-xl text-sm font-bold transition-colors"
                      onClick={() => onNavigate("internships")}
                    >
                      View All Recommendations →
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {recommendedJobs.map((job: any) => (
                      <div key={job.id || job._id} className="bg-slate-50 border border-slate-200 rounded-2xl p-5 hover:border-indigo-300 transition-colors">
                        <div className="flex justify-between items-start gap-4 mb-4">
                          <div>
                            <div className="text-base font-bold text-slate-900 leading-tight mb-1">{job.title}</div>
                            <div className="text-sm font-medium text-slate-500">{job.company} • {job.location}</div>
                          </div>
                          <div className={`px-3 py-1.5 rounded-xl border text-xs font-bold shrink-0 ${job.matchPercentage >= 70 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : job.matchPercentage >= 40 ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                            {job.matchPercentage}% Match
                          </div>
                        </div>

                        <div className="border-t border-slate-200 pt-3 flex items-start gap-2">
                          <span className="text-base mt-0.5">💡</span>
                          <span className="text-xs font-medium text-slate-600 leading-relaxed">
                            <strong className="text-slate-900">Why Recommended:</strong> {job.matchReason || "Matches candidate profile."}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-4 pt-4">
                <button
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl text-sm font-semibold shadow-sm transition-colors flex items-center gap-2"
                  onClick={() => onNavigate("dashboard")}
                >
                  <HomeIcon size={18} /> View on Overview
                </button>
                <button
                  className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-6 py-3 rounded-xl text-sm font-semibold shadow-sm transition-colors flex items-center gap-2"
                  onClick={() => onNavigate("internships")}
                >
                  <BriefcaseIcon size={18} /> Browse All Matched Internships
                </button>
                <button
                  className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-6 py-3 rounded-xl text-sm font-semibold shadow-sm transition-colors flex items-center gap-2"
                  onClick={() => onNavigate("skills")}
                >
                  <ZapIcon size={18} /> View Skill Gap & Roadmap
                </button>
                <button
                  className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-6 py-3 rounded-xl text-sm font-semibold shadow-sm transition-colors flex items-center gap-2"
                  onClick={() => setStage("upload")}
                >
                  <RefreshIcon size={18} /> Upload Another Resume
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
