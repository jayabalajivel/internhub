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
} from "../components/Icons"
import { api } from "../api"

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
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const cachedProfile = localStorage.getItem("internhub_candidate_profile")
    if (cachedProfile) {
      try {
        const parsed = JSON.parse(cachedProfile)
        if (parsed && parsed.extracted_skills) {
          setResultData(parsed)
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

    let apiCompleted = false
    let progressCompleted = false
    let result: any = null

    api
      .analyzeResume(file)
      .then((res) => {
        result = res
        apiCompleted = true
        checkAndComplete()
      })
      .catch((err) => {
        console.error(err)
        apiCompleted = true
        checkAndComplete()
      })

    let prog = 0
    let step = 0
    const interval = setInterval(() => {
      prog += Math.random() * 14 + 8
      step = Math.min(
        Math.floor(prog / (100 / analysisSteps.length)),
        analysisSteps.length - 1,
      )
      setProgress(Math.min(prog, 100))
      setCurrentStep(step)
      if (prog >= 100) {
        clearInterval(interval)
        progressCompleted = true
        checkAndComplete()
      }
    }, 140)

    function checkAndComplete() {
      if (apiCompleted && progressCompleted) {
        setResultData(result)
        setStage("result")

        api
          .getRecommendations()
          .then((jobs) => setRecommendedJobs(jobs.slice(0, 4)))
          .catch((e) => console.error(e))
      }
    }
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
    <div className="p-8 max-w-6xl mx-auto w-full font-sans">
      <div className="mb-10">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 mb-3">
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-blue-500">AI/ML Resume</span> Analysis & Recommendation System
        </h1>
        <p className="text-slate-500 text-sm max-w-3xl">
          Upload your CV to automatically extract technical skills, project evidence, predict software roles, analyze skill gaps, and rank live job recommendations.
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
              className={`border-2 border-dashed rounded-3xl p-16 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
                dragging 
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
                Extracts skills, project evidence, software roles, skill gaps & matching jobs.
              </p>
            </div>

            {/* Test Sample Profiles */}
            <div className="bg-emerald-50/50 border border-emerald-100 rounded-2xl p-6">
              <div className="text-sm font-bold text-emerald-700 mb-4 flex items-center gap-2">
                <SparklesIcon size={16} /> Test Profiles (Instant Multi-Role Analysis)
              </div>
              <div className="flex flex-wrap gap-3">
                <button
                  className="bg-white border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700 text-slate-700 text-xs font-semibold px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 shadow-sm"
                  onClick={() => startAnalysis(new File(["TECHNICAL SKILLS\nHTML, CSS, JavaScript, React, Tailwind CSS, Git\n\nPROJECTS\nDeveloped a responsive e-commerce application using React, JavaScript, HTML, CSS and Git."], "frontend_developer_resume.txt"))}
                >
                  🚀 Frontend (React/JS) Resume
                </button>
                <button
                  className="bg-white border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700 text-slate-700 text-xs font-semibold px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 shadow-sm"
                  onClick={() => startAnalysis(new File(["TECHNICAL SKILLS\nPython, Pandas, NumPy, Scikit-learn, SQL, Machine Learning\n\nPROJECTS\nBuilt customer churn prediction model using Python, Pandas, Scikit-learn and SQL."], "data_science_resume.txt"))}
                >
                  📊 Data Science / ML Resume
                </button>
                <button
                  className="bg-white border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700 text-slate-700 text-xs font-semibold px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 shadow-sm"
                  onClick={() => startAnalysis(new File(["TECHNICAL SKILLS\nJava, Spring Boot, MySQL, REST API, Git\n\nPROJECTS\nDesigned scalable microservices architecture using Java, Spring Boot, MySQL and REST API."], "backend_java_resume.txt"))}
                >
                  ☕ Java Backend Resume
                </button>
                <button
                  className="bg-white border border-rose-200 hover:bg-rose-50 text-rose-600 text-xs font-semibold px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 shadow-sm"
                  onClick={() => startAnalysis(new File(["Tuition Fee Receipt\nTransaction ID: TXN98765\nCollege Fee: $5,000\nTotal Amount Paid: $5,000\nSemester Fee Receipt"], "college_fee_receipt.txt"))}
                >
                  ⚠️ Non-Resume (College Bill)
                </button>
              </div>
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
                { label: "35+ Software Role Prediction", desc: "Predicts roles (Frontend, Backend, ML, DevOps, etc.)", color: "text-amber-500", bg: "bg-amber-50", border: "border-amber-100" },
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

      {stage === "result" && resultData && (
        <div className="space-y-6">
          {/* NON-RESUME / IRRELEVANT DOCUMENT ALERT */}
          {resultData?.is_resume === false || resultData?.isResume === false ? (
            <div className="bg-rose-50 border border-rose-200 rounded-3xl p-8 shadow-sm">
              <div className="flex items-start gap-4 mb-6">
                <div className="bg-white p-3 rounded-2xl shadow-sm border border-rose-100">
                   <AlertIcon size={32} className="text-rose-500" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-rose-700 mb-1">
                    Irrelevant Document Detected: {resultData?.document_type || resultData?.documentType || "College Bill / Receipt"}
                  </h3>
                  <p className="text-sm font-medium text-rose-600/80">
                    {resultData?.warning || "The uploaded file appears to be a College Bill / Fee Receipt rather than a Resume/CV."}
                  </p>
                </div>
              </div>
              
              <div className="bg-white border border-rose-100 rounded-2xl p-6 mb-6">
                <strong className="text-sm text-slate-900 mb-4 block">NLP Classification Audit Result:</strong>
                <ul className="space-y-3 text-sm text-slate-600">
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-400"></span>
                    Classification: <strong className="text-rose-600 ml-1">Non-Resume File (College Bill / Financial Document)</strong>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                    Technical Skill Extraction: <strong className="text-slate-800 ml-1">0 technical skills detected (No fake skills generated)</strong>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                    Role Prediction & Job Matching: <strong className="text-slate-800 ml-1">Disabled for non-resume documents</strong>
                  </li>
                </ul>
              </div>
              
              <button
                onClick={() => setStage("upload")}
                className="bg-rose-600 hover:bg-rose-700 text-white px-6 py-3 rounded-xl font-semibold shadow-sm transition-colors text-sm"
              >
                Upload an Official Resume / CV
              </button>
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
                    <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Primary Predicted Role</div>
                    <div className="text-2xl font-bold text-slate-900 mb-1">{resultData?.primary_role || resultData?.domain || "Software Engineer"}</div>
                    <div className="text-sm font-medium text-slate-500">Verified Technical Candidate Profile</div>
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
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 border transition-colors ${
                              isProjectBacked 
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

              {/* GRID ROW 2: SKILL GAP ANALYSIS & DYNAMIC ROADMAP */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Skill Gap Analysis */}
                <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm">
                  <h3 className="text-lg font-bold text-slate-900 mb-6">Skill Gap Analysis ({resultData?.primary_role})</h3>

                  <div className="mb-8">
                    <div className="text-xs font-bold text-emerald-600 mb-3 flex items-center gap-1.5 uppercase tracking-wide">
                      <CheckIcon size={14} /> ALREADY HAVE ({resultData?.skill_gaps?.already_have?.length || 0})
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {resultData?.skill_gaps?.already_have?.map((s: string) => (
                        <span key={s} className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1">
                          ✓ {s}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="border-t border-slate-100 pt-6">
                    <div className="text-xs font-bold text-rose-600 mb-3 flex items-center gap-1.5 uppercase tracking-wide">
                      ✕ NEED TO LEARN ({resultData?.skill_gaps?.need_to_learn?.length || 0})
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {resultData?.skill_gaps?.need_to_learn?.map((s: string) => (
                        <span key={s} className="bg-rose-50 text-rose-700 border border-rose-200 px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1">
                          + {s}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Dynamic 5-Stage Learning Roadmap */}
                <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm">
                  <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                    <ZapIcon size={20} className="text-amber-500" /> Personalized Roadmap
                  </h3>

                  <div className="space-y-3">
                    {resultData?.learning_roadmap?.map((step: any) => (
                      <div key={step.stage} className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
                        <div className="text-sm font-bold text-indigo-700 mb-1">Stage {step.stage}: {step.title}</div>
                        <div className="text-xs font-medium text-slate-600 leading-relaxed">{step.description}</div>
                      </div>
                    ))}
                  </div>
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
                  onClick={() => onNavigate("internships")}
                >
                  <BriefcaseIcon size={18} /> Browse All Matched Internships
                </button>
                <button
                  className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-6 py-3 rounded-xl text-sm font-semibold shadow-sm transition-colors flex items-center gap-2"
                  onClick={() => onNavigate("skillgap")}
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
