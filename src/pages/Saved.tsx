import { useState, useEffect } from "react"
import {
  BookmarkIcon,
  MapPinIcon,
  DollarIcon,
  ExternalLinkIcon,
  SparklesIcon,
} from "../components/Icons"
import { api } from "../api"
import { syncAndPurgeRemovedJobs, getSafeApplyUrl } from "../jobServices"

interface Props {
  onNavigate: (p: string) => void
}

export default function Saved({ onNavigate }: Props) {
  const [jobs, setJobs] = useState<any[]>([])
  const [sort, setSort] = useState("match")
  const [loading, setLoading] = useState(true)
  const [syncMsg, setSyncMsg] = useState<string>("")

  const fetchSaved = async () => {
    setLoading(true)
    try {
      const saved = await api.getSavedJobs()

      // Mirror sync validation: Check if any saved listing was removed on source site
      if (saved && saved.length > 0) {
        const { activeJobs, removedCount } =
          await syncAndPurgeRemovedJobs(saved)
        setJobs(activeJobs)
        if (removedCount > 0) {
          setSyncMsg(
            `⚡ Mirror Removal Sync: ${removedCount} saved internship(s) were deleted on the original source portal and have been automatically purged.`,
          )
        }
      } else {
        setJobs([])
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSaved()
  }, [])

  const unsave = async (id: string) => {
    try {
      await api.toggleSaveJob(id)
      setJobs((prev) => prev.filter((j) => (j.id || j._id) !== id))
    } catch (e) {
      console.error(e)
    }
  }

  const sorted = [...jobs].sort((a, b) => {
    if (sort === "match")
      return (b.matchPercentage || 0) - (a.matchPercentage || 0)
    if (sort === "stipend")
      return (b.stipend || "").localeCompare(a.stipend || "")
    return (a.title || "").localeCompare(b.title || "")
  })

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto w-full font-sans">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 mb-2">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-blue-500">Saved</span> Internships
          </h1>
          <p className="text-slate-500 text-sm">
            {jobs.length} active live internships saved for later (Mirror Sync Verified)
          </p>
        </div>
        
        <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl p-1.5 shadow-sm">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wide px-2">Sort by:</span>
          {["match", "stipend", "name"].map((s) => (
            <button
              key={s}
              onClick={() => setSort(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${
                sort === s 
                  ? 'bg-indigo-600 text-white shadow-sm' 
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {syncMsg && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 text-sm font-medium px-4 py-3 rounded-xl mb-8 flex items-center gap-2">
           <span>⚡</span> {syncMsg}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-10 h-10 border-4 border-slate-200 border-t-indigo-600 rounded-full animate-spin"></div>
        </div>
      ) : jobs.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sorted.map((job) => {
            const jobId = job.id || job._id
            const logoChar = job.company ? job.company[0].toUpperCase() : "J"
            const matchVal = job.matchPercentage !== undefined ? job.matchPercentage : null

            return (
              <div
                key={jobId}
                className="bg-white border border-slate-200 rounded-2xl p-6 hover:shadow-md hover:border-indigo-200 transition-all flex flex-col h-full"
              >
                <div className="flex justify-between items-start mb-4 gap-4">
                  <div className="flex gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-100 flex shrink-0 items-center justify-center text-lg font-bold text-indigo-700 shadow-inner">
                      {logoChar}
                    </div>
                    <div>
                      <div className="text-base font-bold text-slate-900 mb-1 leading-tight line-clamp-2">
                        {job.role || job.title}
                      </div>
                      <div className="text-sm font-medium text-slate-500 line-clamp-1">
                        {job.company}
                      </div>
                    </div>
                  </div>
                  
                  {matchVal !== null && (
                    <div className={`flex flex-col items-center justify-center px-3 py-2 rounded-xl border shrink-0 ${matchVal >= 70 ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : matchVal >= 40 ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>
                      <span className="text-[9px] font-bold tracking-wider opacity-80 uppercase mb-0.5">Match</span>
                      <span className="text-sm font-bold leading-none">{matchVal}%</span>
                    </div>
                  )}
                </div>

                <div className="space-y-2 mb-6 flex-1">
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <MapPinIcon size={14} className="text-slate-400" />
                    <span className="truncate">{job.location}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <DollarIcon size={14} className="text-slate-400" />
                    <span className="truncate">{job.stipend || "Competitive / Unspecified"}</span>
                  </div>
                </div>

                <div className="flex justify-between items-center pt-4 border-t border-slate-100 mt-auto">
                  <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-400">
                    <SparklesIcon size={12} className="text-indigo-400" />
                    Source: {job.source || "Live API"}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => unsave(jobId)}
                      className="w-9 h-9 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 flex items-center justify-center transition-colors group"
                      title="Remove from saved"
                    >
                      <BookmarkIcon size={16} className="text-rose-500 fill-rose-500 group-hover:scale-110 transition-transform" />
                    </button>
                    <a
                      href={getSafeApplyUrl(job)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm"
                    >
                      Apply <ExternalLinkIcon size={14} />
                    </a>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
          <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center border border-slate-100 mb-6">
            <BookmarkIcon size={32} className="text-slate-300" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-2">
            No saved internships
          </h3>
          <p className="text-sm text-slate-500 mb-8 max-w-sm">
            Bookmark live internships while browsing to review and apply to them later.
          </p>
          <button
            onClick={() => onNavigate("internships")}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-semibold shadow-sm transition-colors"
          >
            Browse Live Internships
          </button>
        </div>
      )}
    </div>
  )
}
