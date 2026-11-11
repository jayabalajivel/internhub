import { useState, useEffect } from "react"
import {
  ClockIcon,
  MapPinIcon,
  PlusIcon,
  XIcon,
  RefreshIcon,
  BriefcaseIcon,
  CheckIcon,
} from "../components/Icons"
import { api } from "../api"

type Column = "applied" | "interview" | "offer" | "rejected"

interface Props {
  onNavigate?: (p: string) => void
}

const columns: {
  id: Column
  label: string
  colorClass: string
  bgClass: string
  borderClass: string
  badgeBg: string
  emoji: string
}[] = [
  {
    id: "applied",
    label: "Applied",
    colorClass: "text-blue-600",
    bgClass: "bg-blue-50/70",
    borderClass: "border-blue-200",
    badgeBg: "bg-blue-100 text-blue-700",
    emoji: "📤",
  },
  {
    id: "interview",
    label: "Interviewing",
    colorClass: "text-indigo-600",
    bgClass: "bg-indigo-50/70",
    borderClass: "border-indigo-200",
    badgeBg: "bg-indigo-100 text-indigo-700",
    emoji: "🎯",
  },
  {
    id: "offer",
    label: "Offered",
    colorClass: "text-emerald-600",
    bgClass: "bg-emerald-50/70",
    borderClass: "border-emerald-200",
    badgeBg: "bg-emerald-100 text-emerald-700",
    emoji: "🎉",
  },
  {
    id: "rejected",
    label: "Rejected",
    colorClass: "text-rose-600",
    bgClass: "bg-rose-50/70",
    borderClass: "border-rose-200",
    badgeBg: "bg-rose-100 text-rose-700",
    emoji: "✗",
  },
]

export default function ApplicationTracker({ onNavigate }: Props) {
  const [apps, setApps] = useState<Record<Column, any[]>>({
    applied: [],
    interview: [],
    offer: [],
    rejected: [],
  })
  const [dragging, setDragging] = useState<{ app: any; from: Column } | null>(null)
  const [dragOver, setDragOver] = useState<Column | null>(null)
  const [loading, setLoading] = useState(true)

  // Track New Application Modal
  const [showAddModal, setShowAddModal] = useState(false)
  const [entryMode, setEntryMode] = useState<"custom" | "select">("custom")
  const [customCompany, setCustomCompany] = useState("")
  const [customTitle, setCustomTitle] = useState("")
  const [customLocation, setCustomLocation] = useState("Remote")
  const [jobs, setJobs] = useState<any[]>([])
  const [selectedJobId, setSelectedJobId] = useState("")
  const [appNotes, setAppNotes] = useState("")
  const [appStatus, setAppStatus] = useState<Column>("applied")

  // Fetch applications from server / local storage
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
            : status.includes("interview")
              ? "interview"
              : status.includes("offer")
                ? "offer"
                : status === "rejected"
                  ? "rejected"
                  : "applied"
        grouped[colId].push(app)
      })

      setApps(grouped)

      // Preload available jobs
      const allJobs = await api.getInternships()
      setJobs(allJobs)
      if (allJobs.length > 0 && !selectedJobId) {
        setSelectedJobId(allJobs[0].id || allJobs[0]._id)
      }
    } catch (e) {
      console.error("Error fetching applications:", e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchApps()
    const handleUpdate = () => fetchApps()
    window.addEventListener("internhub_applications_updated", handleUpdate)
    return () => {
      window.removeEventListener("internhub_applications_updated", handleUpdate)
    }
  }, [])

  // Quick Status Change via Dropdown / Button
  const handleStatusChange = async (app: any, newCol: Column) => {
    const targetStatus =
      newCol === "applied"
        ? "Applied"
        : newCol === "interview"
          ? "Interviewing"
          : newCol === "offer"
            ? "Offered"
            : "Rejected"

    try {
      await (api as any).updateApplicationStatus(app.id, targetStatus)
      fetchApps()
    } catch (e) {
      console.error("Failed to update status:", e)
    }
  }

  // Delete Application Card
  const handleDelete = async (appId: string) => {
    try {
      await api.deleteApplication(appId)
      fetchApps()
    } catch (e) {
      console.error("Failed to delete application:", e)
    }
  }

  // Reset / Clear Board
  const handleClearBoard = async () => {
    if (window.confirm("Are you sure you want to clear all applications and start with a fresh board?")) {
      try {
        await (api as any).clearAllApplications()
        fetchApps()
      } catch (e) {
        console.error("Failed to clear board:", e)
      }
    }
  }

  // Drag and Drop
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

    // Optimistic UI update
    setApps((prev) => {
      const fromList = prev[dragging.from].filter((a) => a.id !== app.id)
      const updatedApp = { ...app, status: targetStatus }
      const toList = [...prev[col], updatedApp]
      return { ...prev, [dragging.from]: fromList, [col]: toList }
    })

    try {
      await (api as any).updateApplicationStatus(app.id, targetStatus)
    } catch (e) {
      console.error("Failed to sync drop", e)
      fetchApps()
    }

    setDragging(null)
    setDragOver(null)
  }

  // Handle Add Application Form Submission
  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const targetStatus =
      appStatus === "applied"
        ? "Applied"
        : appStatus === "interview"
          ? "Interviewing"
          : appStatus === "offer"
            ? "Offered"
            : "Rejected"

    try {
      if (entryMode === "custom") {
        if (!customCompany.trim() || !customTitle.trim()) {
          alert("Please enter company and job title")
          return
        }
        const customJobObj = {
          id: "custom_" + Date.now(),
          title: customTitle.trim(),
          company: customCompany.trim(),
          location: customLocation.trim() || "Remote",
        }
        await api.createOrUpdateApplication(
          customJobObj.id,
          targetStatus,
          appNotes,
          customJobObj.title,
          customJobObj.company,
          customJobObj
        )
      } else {
        if (!selectedJobId) return
        const selJob = jobs.find((j) => (j.id || j._id) === selectedJobId)
        await api.createOrUpdateApplication(
          selectedJobId,
          targetStatus,
          appNotes,
          selJob?.title,
          selJob?.company,
          selJob
        )
      }

      setShowAddModal(false)
      setCustomCompany("")
      setCustomTitle("")
      setAppNotes("")
      fetchApps()
    } catch (err) {
      console.error("Error creating application:", err)
    }
  }

  const total = Object.values(apps).flat().length

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1440px] mx-auto w-full font-sans transition-all">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-blue-500">
                Application
              </span>{" "}
              Tracker
            </h1>
            <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> Live Sync
            </span>
          </div>
          <p className="text-slate-500 text-sm">
            {total} applications tracked in real-time · Drag & drop cards or use quick status selectors to manage your hiring pipeline.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {total > 0 && (
            <button
              onClick={handleClearBoard}
              className="bg-white border border-slate-200 hover:border-rose-300 hover:bg-rose-50 text-slate-600 hover:text-rose-600 text-xs font-semibold py-2 px-3.5 rounded-xl transition-all shadow-sm"
              title="Clear all application cards to start fresh"
            >
              Reset Board
            </button>
          )}

          <button
            onClick={fetchApps}
            className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold py-2 px-3 rounded-xl transition-all shadow-sm flex items-center gap-1.5"
            title="Refresh application data"
          >
            <RefreshIcon size={14} /> Refresh
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-xl transition-all shadow-sm flex items-center gap-2 text-xs"
          >
            <PlusIcon size={16} /> Track New Application
          </button>
        </div>
      </div>

      {/* Manual Track Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 max-w-lg w-full shadow-2xl animate-in fade-in duration-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-slate-900">Track New Application</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <XIcon size={18} />
              </button>
            </div>
            <p className="text-xs text-slate-500 mb-5">
              Add any live job or custom company to your application Kanban pipeline.
            </p>

            {/* Mode Toggle */}
            <div className="flex gap-2 p-1 bg-slate-100 rounded-xl mb-5">
              <button
                type="button"
                onClick={() => setEntryMode("custom")}
                className={`flex-1 text-xs font-bold py-1.5 rounded-lg transition-all ${
                  entryMode === "custom"
                    ? "bg-white text-indigo-600 shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                ✏️ Custom Entry
              </button>
              <button
                type="button"
                onClick={() => setEntryMode("select")}
                className={`flex-1 text-xs font-bold py-1.5 rounded-lg transition-all ${
                  entryMode === "select"
                    ? "bg-white text-indigo-600 shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                🔍 Choose from Live Jobs
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-4">
              {entryMode === "custom" ? (
                <>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">
                      Company Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Google, Tata Motors, L&T, Razorpay"
                      value={customCompany}
                      onChange={(e) => setCustomCompany(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">
                      Job / Internship Role *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Full Stack Developer, Mechanical Design Intern"
                      value={customTitle}
                      onChange={(e) => setCustomTitle(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">
                      Location / Mode
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Remote, Bangalore, Chennai, Hybrid"
                      value={customLocation}
                      onChange={(e) => setCustomLocation(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    />
                  </div>
                </>
              ) : (
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">
                    Select Live Aggregated Job
                  </label>
                  <select
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 cursor-pointer"
                    value={selectedJobId}
                    onChange={(e) => setSelectedJobId(e.target.value)}
                  >
                    {jobs.map((j) => (
                      <option key={j.id || j._id} value={j.id || j._id}>
                        {j.company} - {j.title} ({j.location || "Remote"})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">
                  Initial Stage
                </label>
                <select
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 cursor-pointer"
                  value={appStatus}
                  onChange={(e) => setAppStatus(e.target.value as Column)}
                >
                  {columns.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.emoji} {c.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">
                  Notes / Interview Date
                </label>
                <textarea
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 resize-none min-h-[70px] placeholder:text-slate-400"
                  placeholder="e.g. Applied via official portal, technical round on Friday..."
                  value={appNotes}
                  onChange={(e) => setAppNotes(e.target.value)}
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-xl text-xs font-bold shadow-sm transition-colors"
                >
                  Save Application
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Real-Time Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {columns.map(({ id, label, bgClass, colorClass, borderClass, emoji }) => (
          <div
            key={id}
            className={`bg-white border border-slate-200 rounded-2xl p-4 flex items-center gap-4 shadow-sm`}
          >
            <div
              className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl ${bgClass} ${colorClass} border ${borderClass} shrink-0`}
            >
              {emoji}
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-900 leading-none mb-1">
                {apps[id]?.length || 0}
              </div>
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
      ) : total === 0 ? (
        <div className="bg-white border-2 border-dashed border-slate-200 rounded-3xl p-12 text-center max-w-xl mx-auto my-8">
          <div className="w-16 h-16 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center mx-auto mb-4 text-2xl">
            📋
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-2">No Applications Tracked Yet</h3>
          <p className="text-xs text-slate-500 mb-6 max-w-md mx-auto">
            Your board is fresh and ready. Track your first internship application manually or browse live opportunities.
          </p>
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-sm transition-all flex items-center gap-1.5"
            >
              <PlusIcon size={14} /> Track New Application
            </button>
            {onNavigate && (
              <button
                onClick={() => onNavigate("internships")}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold px-4 py-2.5 rounded-xl transition-all flex items-center gap-1.5"
              >
                <BriefcaseIcon size={14} /> Browse Live Jobs
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="flex flex-col lg:flex-row gap-5 overflow-x-auto pb-6 items-start min-h-[60vh]">
          {columns.map(({ id, label, bgClass, colorClass, borderClass, badgeBg, emoji }) => {
            const list = apps[id] || []
            const isOver = dragOver === id

            return (
              <div
                key={id}
                className={`flex-1 min-w-[300px] rounded-3xl p-4 transition-all duration-200 ${
                  isOver
                    ? `${bgClass} border-2 ${borderClass} shadow-md`
                    : "bg-slate-50/70 border border-slate-200/80"
                }`}
                onDragOver={(e) => handleDragOver(e, id)}
                onDragLeave={() => setDragOver(null)}
                onDrop={() => handleDrop(id)}
              >
                {/* Column Header */}
                <div className="flex justify-between items-center mb-4 px-1">
                  <div className="flex items-center gap-2">
                    <span className="text-base">{emoji}</span>
                    <span className="text-sm font-bold text-slate-800">{label}</span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${badgeBg}`}
                    >
                      {list.length}
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      setAppStatus(id)
                      setShowAddModal(true)
                    }}
                    className="text-slate-400 hover:text-indigo-600 p-1 rounded-lg hover:bg-white transition-colors"
                    title={`Add new ${label} application`}
                  >
                    <PlusIcon size={14} />
                  </button>
                </div>

                {/* Cards List */}
                <div className="space-y-3">
                  {list.map((app) => {
                    const job =
                      (typeof app.internshipId === "object" ? app.internshipId : null) ||
                      app.jobData ||
                      {}
                    const companyName = job.company || app.company || "Company"
                    const jobTitle = job.title || app.jobTitle || "Internship Role"
                    const logoChar = companyName ? companyName[0].toUpperCase() : "J"
                    const isDragging = dragging?.app.id === app.id

                    return (
                      <div
                        key={app.id}
                        draggable
                        onDragStart={() => handleDragStart(app, id)}
                        onDragEnd={() => {
                          setDragging(null)
                          setDragOver(null)
                        }}
                        className={`bg-white border border-slate-200 rounded-2xl p-4 cursor-grab hover:border-indigo-300 hover:shadow-md transition-all select-none relative group ${
                          isDragging ? "opacity-40 scale-95" : ""
                        }`}
                      >
                        {/* Card Header: Logo, Company & Delete */}
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <div className="flex items-center gap-2.5 truncate">
                            <div
                              className={`w-7 h-7 rounded-lg flex shrink-0 items-center justify-center text-xs font-bold ${badgeBg}`}
                            >
                              {logoChar}
                            </div>
                            <span className="text-xs font-bold text-slate-900 truncate">
                              {companyName}
                            </span>
                          </div>

                          {/* Delete Button */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDelete(app.id)
                            }}
                            className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-rose-600 p-1 rounded-lg hover:bg-rose-50 transition-all shrink-0"
                            title="Remove application"
                          >
                            <XIcon size={13} />
                          </button>
                        </div>

                        {/* Job Title */}
                        <div className="text-xs font-bold text-slate-800 mb-2 leading-snug line-clamp-2">
                          {jobTitle}
                        </div>

                        {/* Location & Date */}
                        <div className="flex items-center justify-between text-[11px] text-slate-400 mb-3">
                          <span className="flex items-center gap-1 truncate">
                            <MapPinIcon size={11} /> {job.location || "Remote"}
                          </span>
                          {app.appliedDate && (
                            <span className="flex items-center gap-1 shrink-0 text-[10px]">
                              <ClockIcon size={10} />{" "}
                              {new Date(app.appliedDate).toLocaleDateString([], {
                                month: "short",
                                day: "numeric",
                              })}
                            </span>
                          )}
                        </div>

                        {/* Notes */}
                        {app.notes && (
                          <div className="mb-3 p-2 rounded-xl text-[11px] font-medium bg-slate-50 text-slate-600 border border-slate-100 line-clamp-2">
                            💬 {app.notes}
                          </div>
                        )}

                        {/* Quick Move Status Selector */}
                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-1 text-[11px]">
                          <span className="text-slate-400 font-medium text-[10px]">Move to:</span>
                          <div className="flex gap-1">
                            {columns
                              .filter((c) => c.id !== id)
                              .map((c) => (
                                <button
                                  key={c.id}
                                  onClick={() => handleStatusChange(app, c.id)}
                                  className="text-[10px] font-semibold bg-slate-50 hover:bg-indigo-50 hover:text-indigo-700 text-slate-600 border border-slate-200 hover:border-indigo-200 px-1.5 py-0.5 rounded-md transition-all"
                                  title={`Move to ${c.label}`}
                                >
                                  {c.emoji} {c.label.slice(0, 3)}
                                </button>
                              ))}
                          </div>
                        </div>
                      </div>
                    )
                  })}

                  {list.length === 0 && (
                    <div className="py-8 text-center border border-dashed border-slate-200 rounded-2xl bg-white/40">
                      <span className="text-[11px] font-medium text-slate-400">
                        Drop {label} cards here
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
