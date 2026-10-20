import { useState, useEffect } from "react"
import {
  ClockIcon,
  MapPinIcon,
  PlusIcon,
} from "../components/Icons"
import { api } from "../api"

type Column = "applied" | "interview" | "offer" | "rejected"

const columns: { id: Column; label: string; colorClass: string; bgClass: string; borderClass: string; emoji: string }[] = [
  { id: "applied", label: "Applied", colorClass: "text-blue-600", bgClass: "bg-blue-50", borderClass: "border-blue-200", emoji: "📤" },
  { id: "interview", label: "Interview", colorClass: "text-indigo-600", bgClass: "bg-indigo-50", borderClass: "border-indigo-200", emoji: "🎯" },
  { id: "offer", label: "Offer", colorClass: "text-emerald-600", bgClass: "bg-emerald-50", borderClass: "border-emerald-200", emoji: "🎉" },
  { id: "rejected", label: "Rejected", colorClass: "text-rose-600", bgClass: "bg-rose-50", borderClass: "border-rose-200", emoji: "✗" },
]

export default function ApplicationTracker() {
  const [apps, setApps] = useState<Record<Column, any[]>>({
    applied: [],
    interview: [],
    offer: [],
    rejected: [],
  })
  const [dragging, setDragging] = useState<{ app: any; from: Column } | null>(null)
  const [dragOver, setDragOver] = useState<Column | null>(null)
  const [loading, setLoading] = useState(true)

  // Manual add form state
  const [showAddModal, setShowAddModal] = useState(false)
  const [jobs, setJobs] = useState<any[]>([])
  const [selectedJobId, setSelectedJobId] = useState("")
  const [appNotes, setAppNotes] = useState("")
  const [appStatus, setAppStatus] = useState<Column>("applied")

  const fetchApps = async () => {
    setLoading(true)
    try {
      const records = await api.getApplications()
      const grouped: Record<Column, any[]> = {
        applied: [],
        interview: [],
        offer: [],
        rejected: [],
      }

      records.forEach((app: any) => {
        const status = (app.status || "Applied").toLowerCase()
        const colId =
          status === "applied"
            ? "applied"
            : status === "interviewing"
              ? "interview"
              : status === "offered"
                ? "offer"
                : status === "rejected"
                  ? "rejected"
                  : "applied"
        grouped[colId].push(app)
      })

      setApps(grouped)

      const allJobs = await api.getInternships()
      setJobs(allJobs)
      if (allJobs.length > 0) setSelectedJobId(allJobs[0].id || allJobs[0]._id)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchApps()
  }, [])

  const handleDragStart = (app: any, from: Column) => setDragging({ app, from })

  const handleDragOver = (e: React.DragEvent, col: Column) => {
    e.preventDefault()
    setDragOver(col)
  }

  const handleDrop = async (col: Column) => {
    if (!dragging || dragging.from === col) {
      setDragOver(null)
      return
    }

    const { app } = dragging
    const targetStatus =
      col === "applied"
        ? "Applied"
        : col === "interview"
          ? "Interviewing"
          : col === "offer"
            ? "Offered"
            : "Rejected"

    const jobId = app.internshipId?.id || app.internshipId?._id || app.internshipId

    setApps((prev) => {
      const fromList = prev[dragging.from].filter((a) => a.id !== app.id)
      const updatedApp = { ...app, status: targetStatus }
      const toList = [...prev[col], updatedApp]
      return { ...prev, [dragging.from]: fromList, [col]: toList }
    })

    try {
      await api.createOrUpdateApplication(jobId, targetStatus, app.notes || "")
    } catch (e) {
      console.error("Failed to sync drop to server", e)
    }

    setDragging(null)
    setDragOver(null)
  }

  const handleAddApplicationSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedJobId) return
    const statusVal =
      appStatus === "applied"
        ? "Applied"
        : appStatus === "interview"
          ? "Interviewing"
          : appStatus === "offer"
            ? "Offered"
            : "Rejected"
    try {
      await api.createOrUpdateApplication(selectedJobId, statusVal, appNotes)
      setShowAddModal(false)
      setAppNotes("")
      fetchApps()
    } catch (err) {
      console.error(err)
    }
  }

  const total = Object.values(apps).flat().length

  return (
    <div className="p-8 max-w-[1400px] mx-auto w-full font-sans">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 mb-2">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-blue-500">Application</span> Tracker
          </h1>
          <p className="text-slate-500 text-sm">
            {total} applications tracked · Drag and drop cards to update status
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-xl transition-all shadow-sm flex items-center gap-2 text-sm"
        >
          <PlusIcon size={16} />
          Track New Application
        </button>
      </div>

      {/* Manual Track Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-slate-200 rounded-3xl p-8 max-w-lg w-full shadow-xl">
            <h3 className="text-2xl font-bold text-slate-900 mb-2">Track New Internship</h3>
            <p className="text-sm text-slate-500 mb-6">Select one of the aggregated roles to track.</p>

            <form onSubmit={handleAddApplicationSubmit} className="space-y-5">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-2">Select Internship</label>
                <select
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all cursor-pointer appearance-none"
                  value={selectedJobId}
                  onChange={(e) => setSelectedJobId(e.target.value)}
                >
                  {jobs.map((j) => (
                    <option key={j.id || j._id} value={j.id || j._id}>
                      {j.company} - {j.title} ({j.location})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-2">Application Stage</label>
                <select
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all cursor-pointer appearance-none"
                  value={appStatus}
                  onChange={(e) => setAppStatus(e.target.value as Column)}
                >
                  {columns.map((c) => (
                    <option key={c.id} value={c.id}>{c.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-2">Notes / Contact Details</label>
                <textarea
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all resize-none min-h-[100px] placeholder:text-slate-400"
                  placeholder="e.g. Interview scheduled for next Tuesday..."
                  value={appNotes}
                  onChange={(e) => setAppNotes(e.target.value)}
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold shadow-sm transition-colors"
                >
                  Track Application
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {columns.map(({ id, label, bgClass, colorClass, borderClass, emoji }) => (
          <div key={id} className={`bg-white border border-slate-200 rounded-2xl p-4 flex items-center gap-4 shadow-sm`}>
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl ${bgClass} ${colorClass} border ${borderClass}`}>
              {emoji}
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-900 leading-none mb-1">{apps[id]?.length || 0}</div>
              <div className="text-xs font-semibold text-slate-500">{label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Kanban Board */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-10 h-10 border-4 border-slate-200 border-t-indigo-600 rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="flex flex-col lg:flex-row gap-6 overflow-x-auto pb-4 items-start min-h-[60vh]">
          {columns.map(({ id, label, bgClass, colorClass, borderClass, emoji }) => {
            const list = apps[id] || []
            const isOver = dragOver === id
            
            return (
              <div
                key={id}
                className={`flex-1 min-w-[280px] rounded-2xl p-4 transition-all duration-200 ${isOver ? `${bgClass} border-2 ${borderClass}` : 'bg-slate-50/50 border border-slate-200'}`}
                onDragOver={(e) => handleDragOver(e, id)}
                onDragLeave={() => setDragOver(null)}
                onDrop={() => handleDrop(id)}
              >
                {/* Column Header */}
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{emoji}</span>
                    <span className="text-sm font-bold text-slate-800">{label}</span>
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${bgClass} ${colorClass} border ${borderClass}`}>
                      {list.length}
                    </span>
                  </div>
                </div>

                {/* Cards */}
                <div className="space-y-3">
                  {list.map((app) => {
                    const job = (typeof app.internshipId === "object" ? app.internshipId : null) || app.jobData || {}
                    const companyName = job.company || app.company || "Company"
                    const jobTitle = job.title || app.jobTitle || "Internship Role"
                    const logoChar = companyName ? companyName[0].toUpperCase() : "J"
                    const isDragging = dragging?.app.id === app.id

                    return (
                      <div
                        key={app.id}
                        draggable
                        onDragStart={() => handleDragStart(app, id)}
                        onDragEnd={() => { setDragging(null); setDragOver(null) }}
                        className={`bg-white border border-slate-200 rounded-xl p-4 cursor-grab hover:border-indigo-300 hover:shadow-md transition-all select-none ${isDragging ? 'opacity-50 scale-95' : ''}`}
                      >
                        <div className="flex items-center gap-3 mb-3">
                          <div className={`w-8 h-8 rounded-lg flex shrink-0 items-center justify-center text-xs font-bold ${bgClass} ${colorClass} border ${borderClass}`}>
                            {logoChar}
                          </div>
                          <div className="text-sm font-bold text-slate-900 truncate">
                            {companyName}
                          </div>
                        </div>
                        
                        <div className="text-sm font-medium text-slate-600 mb-3 leading-snug">
                          {jobTitle}
                        </div>
                        
                        <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-400 mb-1">
                          <MapPinIcon size={12} />
                          {job.location || "Remote"}
                        </div>
                        
                        {app.appliedDate && (
                          <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-400">
                            <ClockIcon size={12} />
                            Tracked {new Date(app.appliedDate).toLocaleDateString()}
                          </div>
                        )}
                        
                        {app.notes && (
                          <div className={`mt-3 p-2 rounded-lg text-xs font-medium ${bgClass} ${colorClass} border ${borderClass} line-clamp-2`}>
                            {app.notes}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
