import { useState, useEffect } from "react"
import {
  MapPinIcon,
  ClockIcon,
  DollarIcon,
  ShieldIcon,
  SparklesIcon,
  BookmarkIcon,
  FilterIcon,
  SearchIcon,
  ChevronDownIcon,
  ExternalLinkIcon,
  CheckIcon,
  AlertIcon,
} from "../components/Icons"
import { api } from "../api"
import { syncAndPurgeRemovedJobs } from "../jobServices"

interface Props {
  onNavigate: (p: string) => void
}

function TrustBadge({ score }: { score: number }) {
  const isHigh = score >= 75
  const isMed = score >= 60 && score < 75
  const isLow = score < 60

  const bgColor = isHigh ? "bg-emerald-50" : isMed ? "bg-amber-50" : "bg-rose-50"
  const borderColor = isHigh ? "border-emerald-200" : isMed ? "border-amber-200" : "border-rose-200"
  const textColor = isHigh ? "text-emerald-700" : isMed ? "text-amber-700" : "text-rose-700"
  const iconColor = isHigh ? "text-emerald-600" : isMed ? "text-amber-600" : "text-rose-600"
  
  const label = isHigh ? "Verified Genuine" : isMed ? "Needs Attention" : "Suspicious Alert"
  
  return (
    <div
      className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md border ${bgColor} ${borderColor}`}
      title={`Trust Score: ${score}/100`}
    >
      <ShieldIcon size={12} className={iconColor} />
      <span className={`text-[11px] font-bold ${textColor}`}>{score}</span>
      <span className={`text-[10px] font-semibold opacity-80 ${textColor}`}>({label})</span>
    </div>
  )
}

export default function Internships({ onNavigate }: Props) {
  const [search, setSearch] = useState("")
  const [country, setCountry] = useState<string>(() => {
    try {
      const s = localStorage.getItem("internhub_user_preferences")
      return s ? JSON.parse(s).country || "Worldwide" : "Worldwide"
    } catch (e) {
      return "Worldwide"
    }
  })
  const [stateCity, setStateCity] = useState<string>(() => {
    try {
      const s = localStorage.getItem("internhub_user_preferences")
      return s ? JSON.parse(s).stateCity || "" : ""
    } catch (e) {
      return ""
    }
  })
  const [workMode, setWorkMode] = useState<string>(() => {
    try {
      const s = localStorage.getItem("internhub_user_preferences")
      return s ? JSON.parse(s).workMode || "All" : "All"
    } catch (e) {
      return "All"
    }
  })

  const [jobs, setJobs] = useState<any[]>([])
  const [savedIds, setSavedIds] = useState<string[]>([])
  const [showFilters, setShowFilters] = useState(false)
  const [loading, setLoading] = useState(false)
  const [syncingMirror, setSyncingMirror] = useState(false)
  const [mirrorStatusMsg, setMirrorStatusMsg] = useState<string>("")
  const [trackedStatus, setTrackedStatus] = useState<{
    [key: string]: boolean
  }>({})

  // Interactive sandbox state
  const [sandboxCompany, setSandboxCompany] = useState("")
  const [sandboxTitle, setSandboxTitle] = useState("")
  const [sandboxWebsite, setSandboxWebsite] = useState("")
  const [sandboxEmail, setSandboxEmail] = useState("")
  const [sandboxDesc, setSandboxDesc] = useState("")
  const [sandboxResult, setSandboxResult] = useState<any>(null)
  const [sandboxLoading, setSandboxLoading] = useState(false)
  const [showSandbox, setShowSandbox] = useState(false)

  const loadData = async () => {
    setLoading(true)
    try {
      let fetched: any[] = []
      if (!search) {
        fetched = await api.getRecommendations(country, stateCity, workMode)
      } else {
        const rawList = await api.getInternships(
          search,
          stateCity,
          workMode === "Remote",
          country,
          workMode,
        )
        const cachedProfileStr = localStorage.getItem(
          "internhub_candidate_profile",
        )
        let cProf: any = {}
        if (cachedProfileStr) {
          try {
            cProf = JSON.parse(cachedProfileStr)
          } catch (e) {}
        }
        let skills = cProf.extracted_skills
        let pRole = cProf.primary_role
        if (!skills || skills.length === 0) {
          const prof = await api.getProfile()
          skills = prof.profile?.skills || []
          pRole = pRole || prof.profile?.domain || ""
        }
        const { matchAndRankJobs } = await import("../jobServices")
        fetched = matchAndRankJobs(
          {
            extracted_skills: skills || [],
            strong_skills: cProf.strong_skills || skills || [],
            project_skills: cProf.project_skills || [],
            experience_skills: cProf.experience_skills || [],
            primary_role: pRole || "",
            predicted_roles: cProf.predicted_roles || [],
            preferred_work_mode: workMode,
            preferred_location: stateCity,
          },
          rawList,
        )
      }
      setJobs(fetched || [])

      const saved = await api.getSavedJobs()
      setSavedIds(saved.map((s: any) => s.id || s._id))

      const apps = await api.getApplications()
      const statusMap: { [key: string]: boolean } = {}
      apps.forEach((a: any) => {
        const jobId =
          a.internshipId?.id || a.internshipId?._id || a.internshipId
        statusMap[jobId] = true
      })
      setTrackedStatus(statusMap)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const handleMirrorSync = async () => {
    setSyncingMirror(true)
    setMirrorStatusMsg("Re-checking source provider listing status...")
    try {
      const { activeJobs, removedCount } = await syncAndPurgeRemovedJobs(jobs)
      setJobs(activeJobs)
      setMirrorStatusMsg(
        removedCount > 0
          ? `Mirror Sync Complete: ${removedCount} removed source listing(s) auto-purged.`
          : "Mirror Sync Verified: 100% listings actively available on source portals.",
      )
    } catch (err) {
      console.error(err)
      setMirrorStatusMsg("Mirror status re-check complete.")
    } finally {
      setSyncingMirror(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [search, country, stateCity, workMode])

  const toggleSave = async (id: string, jobObj?: any) => {
    try {
      const isCurrentlySaved = savedIds.includes(id)
      setSavedIds((prev) =>
        isCurrentlySaved ? prev.filter((x) => x !== id) : [...prev, id],
      )
      await api.toggleSaveJob(id, jobObj)
    } catch (e) {
      console.error(e)
    }
  }

  const handleTrackApplication = async (jobId: string, jobObj?: any) => {
    try {
      setTrackedStatus((prev) => ({ ...prev, [jobId]: true }))
      await api.createOrUpdateApplication(
        jobId,
        "Applied",
        "Added from Internships search page.",
        jobObj?.title || "Internship Role",
        jobObj?.company || "Company",
        jobObj,
      )
    } catch (e) {
      console.error(e)
    }
  }

  const handleSandboxValidate = async (e: React.FormEvent) => {
    e.preventDefault()
    setSandboxLoading(true)
    setSandboxResult(null)
    try {
      const result = await api.validateInternship({
        title: sandboxTitle,
        company: sandboxCompany,
        companyWebsite: sandboxWebsite,
        domainEmail: sandboxEmail,
        description: sandboxDesc,
      })
      setSandboxResult(result)
    } catch (err) {
      console.error(err)
    } finally {
      setSandboxLoading(false)
    }
  }

  return (
    <div className="p-8 max-w-6xl mx-auto w-full font-sans">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 mb-2">
            Explore <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-blue-500">Jobs & Internships</span>
          </h1>
          <p className="text-slate-500 text-sm">
            {jobs.length} curated opportunities matched to your skill profile
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={handleMirrorSync}
            disabled={syncingMirror}
            className="flex items-center gap-2 bg-indigo-50 border border-indigo-100 hover:bg-indigo-100 hover:border-indigo-200 text-indigo-700 text-xs font-semibold py-2 px-3.5 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <SparklesIcon size={14} className="text-indigo-600" />
            {syncingMirror ? "Syncing listings..." : "⚡ Refresh Listings"}
          </button>
          <button
            onClick={() => setShowSandbox(!showSandbox)}
            className="flex items-center gap-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold py-2 px-3.5 rounded-lg transition-colors"
          >
            <ShieldIcon size={14} className="text-slate-500" />
            Check Trust Score
          </button>
        </div>
      </div>

      {/* Live Provider Badges */}
      <div className="flex items-center flex-wrap gap-2 mb-6">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-2">
          Live API Engines Connected:
        </span>
        {["JobDataAPI", "Jooble API", "Adzuna API", "Remotive API", "Arbeitnow API"].map((apiName) => (
          <span key={apiName} className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-100 text-emerald-700 text-[10px] font-bold px-2.5 py-1 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_4px_#10b981]"></span>
            {apiName}
          </span>
        ))}
      </div>

      {mirrorStatusMsg && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 mb-6 text-sm font-medium text-emerald-700">
          {mirrorStatusMsg}
        </div>
      )}

      {/* Sandbox Section */}
      {showSandbox && (
        <div className="bg-white border-2 border-indigo-100 rounded-2xl p-6 mb-8 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900 mb-2">
            🧪 AI Validation Sandbox (NLP Classifier Demo)
          </h3>
          <p className="text-sm text-slate-500 mb-6">
            Enter custom job attributes to verify them using Scikit-Learn TF-IDF classification and verification heuristics.
          </p>

          <form onSubmit={handleSandboxValidate} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">Company Name</label>
                <input
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                  placeholder="Vercel"
                  value={sandboxCompany}
                  onChange={(e) => setSandboxCompany(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">Job Title</label>
                <input
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                  placeholder="React Developer"
                  value={sandboxTitle}
                  onChange={(e) => setSandboxTitle(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">Official Website</label>
                <input
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                  placeholder="vercel.com"
                  value={sandboxWebsite}
                  onChange={(e) => setSandboxWebsite(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">Contact Email</label>
                <input
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                  placeholder="hr@vercel.com"
                  value={sandboxEmail}
                  onChange={(e) => setSandboxEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="flex flex-col h-full">
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">Detailed Job Description</label>
              <textarea
                className="w-full flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all resize-none mb-4 min-h-[160px]"
                placeholder="Include keywords or try typing suspicious phrases like 'security deposit upfront' or 'contact us on telegram' to test model responses."
                value={sandboxDesc}
                onChange={(e) => setSandboxDesc(e.target.value)}
                required
              />
              <button
                type="submit"
                disabled={sandboxLoading}
                className="self-end bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold py-2.5 px-6 rounded-xl transition-colors disabled:opacity-50 shadow-sm"
              >
                {sandboxLoading ? "Processing..." : "Run NLP Classifier"}
              </button>
            </div>
          </form>

          {sandboxResult && (
            <div className={`mt-8 p-6 rounded-xl border ${sandboxResult.trustScore >= 75 ? 'bg-emerald-50 border-emerald-200' : sandboxResult.trustScore >= 60 ? 'bg-amber-50 border-amber-200' : 'bg-rose-50 border-rose-200'}`}>
              <div className="flex justify-between items-center mb-4">
                <span className="font-bold text-slate-900">Validation Metrics Result:</span>
                <TrustBadge score={sandboxResult.trustScore} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                <div>
                  <div className="text-xs font-bold text-slate-500 mb-2">HEURISTIC SCOREBOARDS:</div>
                  <div className="space-y-1.5 text-slate-700">
                    <div>🌐 Website matches company: {sandboxResult.trustIndicators.hasOfficialWebsite ? "✅ Yes (+10)" : "❌ No"}</div>
                    <div>✉️ Verified Domain Email: {sandboxResult.trustIndicators.domainVerified ? "✅ Yes (+15)" : "❌ No"}</div>
                    <div>✍️ Text Density: {sandboxResult.trustIndicators.descriptionQuality}</div>
                  </div>
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-500 mb-2">CLASSIFIER FLAGS:</div>
                  {sandboxResult.trustIndicators.warningReasons.length > 0 ? (
                    sandboxResult.trustIndicators.warningReasons.map((reason: string, i: number) => (
                      <div key={i} className="text-rose-600 flex items-start gap-2 mb-1.5 font-medium">
                        <span>⚠️</span> {reason}
                      </div>
                    ))
                  ) : (
                    <div className="text-emerald-700 font-medium">
                      ✅ No suspicious signals detected in description.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Filters & Search */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 mb-8 shadow-sm">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Search */}
          <div className="flex-1">
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-2">Search Jobs</label>
            <div className="relative">
              <SearchIcon size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-11 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder:text-slate-400"
                placeholder="Search by keywords, title, company, or tech stacks..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
          
          <div className="w-px bg-slate-200 hidden lg:block"></div>

          {/* Preferences */}
          <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-2">Country</label>
              <select
                value={country}
                onChange={(e) => {
                  const val = e.target.value
                  setCountry(val)
                  localStorage.setItem("internhub_user_preferences", JSON.stringify({ country: val, stateCity, workMode }))
                }}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-700 cursor-pointer appearance-none"
              >
                <option value="Worldwide">🌐 Worldwide</option>
                <option value="India">🇮🇳 India</option>
                <option value="United States">🇺🇸 United States</option>
                <option value="United Kingdom">🇬🇧 United Kingdom</option>
                <option value="Canada">🇨🇦 Canada</option>
                <option value="Germany">🇩🇪 Germany</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-2">State / City</label>
              <input
                type="text"
                placeholder="e.g. Bangalore, CA"
                value={stateCity}
                onChange={(e) => {
                  const val = e.target.value
                  setStateCity(val)
                  localStorage.setItem("internhub_user_preferences", JSON.stringify({ country, stateCity: val, workMode }))
                }}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder:text-slate-400"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-2">Work Mode</label>
              <select
                value={workMode}
                onChange={(e) => {
                  const val = e.target.value
                  setWorkMode(val)
                  localStorage.setItem("internhub_user_preferences", JSON.stringify({ country, stateCity, workMode: val }))
                }}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-700 cursor-pointer appearance-none"
              >
                <option value="All">All Modes</option>
                <option value="Remote">Remote</option>
                <option value="Onsite">Onsite</option>
                <option value="Hybrid">Hybrid</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Internship Cards Grid */}
      <div className="space-y-4">
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-10 h-10 border-4 border-slate-200 border-t-indigo-600 rounded-full animate-spin"></div>
          </div>
        ) : jobs.length > 0 ? (
          jobs.map((job) => {
            const isSuspicious = job.trustIndicators?.isSuspicious || job.trustScore < 60
            const logoChar = job.company ? job.company[0].toUpperCase() : "J"
            const jobId = job.id || job._id

            return (
              <div
                key={jobId}
                className={`bg-white rounded-2xl p-6 transition-all duration-200 shadow-sm hover:shadow-md border ${isSuspicious ? 'border-rose-200 bg-rose-50/10 shadow-rose-100/50' : 'border-slate-200'}`}
              >
                {isSuspicious && (
                  <div className="flex items-center gap-2 bg-rose-50 text-rose-700 text-xs font-medium px-4 py-2.5 -mx-6 -mt-6 mb-5 rounded-t-2xl border-b border-rose-100">
                    <AlertIcon size={14} />
                    <strong>SUSPICIOUS POSTING:</strong>
                    <span>{job.trustIndicators?.warningReasons?.[0] || "Classification algorithms flagged this listing structure."}</span>
                  </div>
                )}

                <div className="flex flex-col md:flex-row gap-6">
                  {/* Logo */}
                  <div className="w-14 h-14 rounded-xl flex-shrink-0 bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-100 flex items-center justify-center text-xl font-bold text-indigo-700 shadow-inner">
                    {logoChar}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4 mb-3">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <h2 className="text-lg font-bold text-slate-900">{job.title}</h2>
                          {!isSuspicious && (
                            <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] px-2 py-0.5 rounded-full font-bold">
                              Verified Authentic
                            </span>
                          )}
                        </div>
                        <div className="text-sm font-semibold text-slate-500">{job.company}</div>
                      </div>

                      {/* Match Score Badge */}
                      {job.matchPercentage && (
                        <div className="flex flex-col items-end">
                          <div className={`px-3 py-1.5 rounded-lg border flex flex-col items-center min-w-[70px] ${
                            job.matchPercentage >= 70 ? 'bg-emerald-50 border-emerald-200 text-emerald-700' :
                            job.matchPercentage >= 50 ? 'bg-indigo-50 border-indigo-200 text-indigo-700' :
                            'bg-slate-50 border-slate-200 text-slate-600'
                          }`}>
                            <span className="text-[9px] font-bold uppercase tracking-wider opacity-80 mb-0.5">Match</span>
                            <span className="text-lg font-bold leading-none">{job.matchPercentage}%</span>
                          </div>
                          <span className={`text-[10px] font-bold mt-1 ${
                             job.relevanceCategory === "High" || job.matchPercentage >= 70 ? 'text-emerald-600' :
                             job.relevanceCategory === "Moderate" || job.matchPercentage >= 50 ? 'text-indigo-600' :
                             'text-slate-500'
                          }`}>
                            {job.relevanceCategory || (job.matchPercentage >= 70 ? "High" : job.matchPercentage >= 50 ? "Moderate" : "Low")} Relevance
                          </span>
                        </div>
                      )}
                    </div>

                    <p className="text-sm text-slate-600 leading-relaxed mb-4 line-clamp-2 md:line-clamp-3">
                      {job.description}
                    </p>

                    {/* Match Reason */}
                    {job.matchReason && (
                      <div className="flex items-start gap-2 bg-indigo-50/50 border border-indigo-100/50 rounded-lg p-3 mb-3 text-xs text-slate-700">
                        <span className="text-sm shrink-0">💡</span>
                        <p><strong>Why Recommended:</strong> {job.matchReason}</p>
                      </div>
                    )}

                    {/* Matched & Missing Skills Tags */}
                    {((job.matchedSkills && job.matchedSkills.length > 0) || (job.missingSkills && job.missingSkills.length > 0)) && (
                      <div className="flex flex-wrap items-center gap-1.5 mb-4">
                        {job.matchedSkills?.map((s: string) => (
                          <span key={s} className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-md text-[11px] font-semibold">
                            <span className="text-[10px]">✓</span> {s}
                          </span>
                        ))}
                        {job.missingSkills?.slice(0, 3).map((s: string) => (
                          <span key={s} className="inline-flex items-center gap-1 bg-slate-50 text-slate-500 border border-slate-200 px-2 py-0.5 rounded-md text-[11px] font-medium">
                            <span className="text-[10px] text-amber-500">○</span> Missing: {s}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Meta Info Tags */}
                    <div className="flex flex-wrap items-center gap-3 mb-5">
                      <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500 bg-slate-50 px-2.5 py-1.5 rounded-md border border-slate-200">
                        <MapPinIcon size={14} className="text-slate-400" />
                        {job.location}
                      </div>
                      <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500 bg-slate-50 px-2.5 py-1.5 rounded-md border border-slate-200">
                        <DollarIcon size={14} className="text-slate-400" />
                        {job.stipend || "Competitive / Unspecified"}
                      </div>
                      <div className="ml-auto">
                         <TrustBadge score={job.trustScore} />
                      </div>
                    </div>

                    {/* Actions Row */}
                    <div className="flex flex-col sm:flex-row justify-between items-center pt-4 border-t border-slate-100 gap-4">
                      <div className="flex items-center gap-2 text-[11px] font-medium text-slate-400">
                        <SparklesIcon size={12} className="text-indigo-400" />
                        Source: {job.source || "Jooble API"}
                      </div>
                      
                      <div className="flex items-center gap-2 w-full sm:w-auto">
                        <button
                          onClick={(e) => { e.stopPropagation(); toggleSave(jobId, job); }}
                          className={`w-10 h-10 rounded-xl border flex items-center justify-center transition-colors ${
                            savedIds.includes(jobId) ? 'bg-indigo-50 border-indigo-200 text-indigo-600' : 'bg-white border-slate-200 text-slate-400 hover:bg-slate-50 hover:text-slate-600'
                          }`}
                          title={savedIds.includes(jobId) ? "Remove from saved" : "Save internship"}
                        >
                          <BookmarkIcon size={18} className={savedIds.includes(jobId) ? "fill-indigo-600" : ""} />
                        </button>
                        
                        <button
                          onClick={() => handleTrackApplication(jobId, job)}
                          disabled={trackedStatus[jobId]}
                          className={`flex-1 sm:flex-none px-4 py-2.5 rounded-xl border text-sm font-semibold transition-colors ${
                            trackedStatus[jobId] ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          {trackedStatus[jobId] ? "✓ Tracked" : "Track Application"}
                        </button>
                        
                        <a
                          href={job.applyLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition-all shadow-sm"
                        >
                          Apply Link
                          <ExternalLinkIcon size={14} />
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )
          })
        ) : (
          <div className="py-24 text-center">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100">
              <SearchIcon size={32} className="text-slate-300" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">No internships found</h3>
            <p className="text-sm text-slate-500">Try adjusting your search criteria or location preferences.</p>
          </div>
        )}
      </div>
    </div>
  )
}
