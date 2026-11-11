import { useState, useEffect } from "react"
import Landing from "./pages/Landing"
import Auth from "./pages/Auth"
import Dashboard from "./pages/Dashboard"
import ResumeUpload from "./pages/ResumeUpload"
import SkillGap from "./pages/SkillGap"
import Internships from "./pages/Internships"
import ApplicationTracker from "./pages/ApplicationTracker"
import Profile from "./pages/Profile"
import Notifications from "./pages/Notifications"
import Saved from "./pages/Saved"
import Sidebar from "./components/Sidebar"
import { supabase, isSupabaseConfigured } from "./lib/supabase"

type Page = "landing" | "auth" | "dashboard" | "internships" | "resume" | "skills" | "tracker" | "saved" | "notifications" | "profile" | "settings"

const APP_PAGES: Page[] = [
  "dashboard",
  "internships",
  "resume",
  "skills",
  "tracker",
  "saved",
  "notifications",
  "profile",
  "settings",
]

const getInitialPage = (): Page => {
  const params = new URLSearchParams(window.location.search)
  const qPage = params.get("page")
  if (qPage && APP_PAGES.includes(qPage as Page)) {
    return qPage as Page
  }
  if (qPage === "landing" || window.location.hash === "#landing") {
    return "landing"
  }
  if (qPage === "dashboard") {
    return "dashboard"
  }
  // Check if returning from Supabase OAuth redirect callback
  if (
    typeof window !== "undefined" &&
    (window.location.hash.includes("access_token") ||
      window.location.search.includes("code="))
  ) {
    return "dashboard"
  }
  // Default to login / auth page directly
  return "auth"
}

export default function App() {
  const [page, setPage] = useState<Page>(getInitialPage)

  useEffect(() => {
    if (isSupabaseConfigured() && supabase) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session) {
          localStorage.setItem("internhub_token", session.access_token)
          if (window.location.hash || window.location.search.includes("code=")) {
            window.history.replaceState({}, document.title, window.location.pathname)
            setPage("dashboard")
          }
        }
      })

      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((event, session) => {
        if (session && (event === "SIGNED_IN" || event === "TOKEN_REFRESHED")) {
          localStorage.setItem("internhub_token", session.access_token)
          const userMeta = session.user?.user_metadata || {}
          const userEmail = session.user?.email || ""
          const userName =
            userMeta.full_name ||
            userMeta.name ||
            userEmail.split("@")[0] ||
            "Student"

          const mockProfileStr = localStorage.getItem(
            "internhub_mock_user_profile",
          )
          let prof = mockProfileStr ? JSON.parse(mockProfileStr) : {}
          prof.name = userName
          prof.email = userEmail
          prof.profile = prof.profile || {
            skills: ["React", "JavaScript", "TypeScript"],
            domain: "Software Engineering",
            university: "Engineering College",
          }
          localStorage.setItem(
            "internhub_mock_user_profile",
            JSON.stringify(prof),
          )

          setPage("dashboard")
        } else if (event === "SIGNED_OUT") {
          localStorage.removeItem("internhub_token")
          setPage("auth")
        }
      })

      return () => subscription.unsubscribe()
    }
  }, [])

  const navigate = (p: string) => setPage(p as Page)

  const isApp = APP_PAGES.includes(page)

  if (!isApp) {
    if (page === "landing") return <Landing onNavigate={navigate} />
    if (page === "auth") return <Auth onNavigate={navigate} />
    return <Landing onNavigate={navigate} />
  }

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans">
      <Sidebar page={page} onNavigate={navigate} />
      <main className="flex-1 min-w-0 overflow-y-auto overflow-x-hidden">
        {page === "dashboard" && <Dashboard onNavigate={navigate} />}
        {page === "internships" && <Internships onNavigate={navigate} />}
        {page === "resume" && <ResumeUpload onNavigate={navigate} />}
        {page === "skills" && <SkillGap onNavigate={navigate} />}
        {(page === "tracker" || (page as string) === "applications") && <ApplicationTracker onNavigate={navigate} />}
        {page === "saved" && <Saved onNavigate={navigate} />}
        {page === "notifications" && <Notifications onNavigate={navigate} />}
        {page === "profile" && <Profile />}
        {page === "settings" && <SettingsPage onNavigate={navigate} />}
      </main>
    </div>
  )
}

import { api } from "./api"

function SettingsPage({ onNavigate }: { onNavigate: (p: string) => void }) {
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [editingKey, setEditingKey] = useState<string | null>(null)
  const [tempValue, setTempValue] = useState("")

  // Settings states that are toggles
  const [notifications, setNotifications] = useState({
    matches: true,
    score: true,
    deadlines: true,
    report: false,
  })
  const [sharing, setSharing] = useState(false)

  const loadSettings = async () => {
    try {
      setLoading(true)
      const data = await api.getProfile()
      setProfile(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadSettings()
  }, [])

  const handleStartEdit = (key: string, currentValue: string) => {
    setEditingKey(key)
    setTempValue(currentValue)
  }

  const handleCancelEdit = () => {
    setEditingKey(null)
    setTempValue("")
  }

  const handleSaveField = async (key: string) => {
    if (!profile) return
    try {
      let updatedProfile = { ...profile }
      if (key === "name" || key === "email") {
        updatedProfile[key] = tempValue
        await api.updateProfile({
          ...profile.profile,
        })
        if (
          !localStorage.getItem("internhub_use_live_api") ||
          localStorage.getItem("internhub_use_live_api") === "false"
        ) {
          const currentMock = JSON.parse(
            localStorage.getItem("internhub_mock_user_profile") || "{}",
          )
          currentMock[key] = tempValue
          localStorage.setItem(
            "internhub_mock_user_profile",
            JSON.stringify(currentMock),
          )
        }
      } else {
        const profileFields = {
          ...profile.profile,
          [key]:
            key === "stipendPreference"
              ? Number(tempValue.replace(/\D/g, "")) || 0
              : tempValue,
        }
        await api.updateProfile(profileFields)
      }
      setEditingKey(null)
      loadSettings()
    } catch (err) {
      console.error("Failed to save setting field:", err)
    }
  }

  if (loading || !profile) {
    return (
      <div className="flex items-center justify-center h-[80vh]">
        <span className="w-9 h-9 border-4 border-slate-200 border-t-indigo-600 rounded-full animate-spin" />
      </div>
    )
  }

  const sections = [
    {
      section: "Account",
      items: [
        {
          label: "Email Address",
          value: profile.email || "Click to set email",
          key: "email",
          editable: true,
        },
        {
          label: "Full Name",
          value: profile.name || "Click to set name",
          key: "name",
          editable: true,
        },
        {
          label: "University",
          value: profile.profile?.university || "Click to set university",
          key: "university",
          editable: true,
        },
        {
          label: "Year of Study",
          value: profile.profile?.classYear || "Click to set class year",
          key: "classYear",
          editable: true,
        },
      ],
    },
    {
      section: "AI Preferences",
      items: [
        {
          label: "Career Domain Focus",
          value: profile.profile?.domain || "Click to set domain focus",
          key: "domain",
          editable: true,
        },
        {
          label: "Preferred Work Mode",
          value: profile.profile?.workMode || "Remote",
          key: "workMode",
          editable: true,
        },
        {
          label: "Minimum Stipend",
          value: profile.profile?.stipendPreference
            ? `₹${profile.profile.stipendPreference.toLocaleString()}/mo`
            : "No stipend preference set",
          key: "stipendPreference",
          editable: true,
        },
      ],
    },
    {
      section: "Notifications",
      items: [
        {
          label: "New AI Matches",
          value: notifications.matches ? "Enabled" : "Disabled",
          toggle: true,
          onToggle: () =>
            setNotifications({
              ...notifications,
              matches: !notifications.matches,
            }),
        },
        {
          label: "Resume Score Updates",
          value: notifications.score ? "Enabled" : "Disabled",
          toggle: true,
          onToggle: () =>
            setNotifications({ ...notifications, score: !notifications.score }),
        },
        {
          label: "Application Deadlines",
          value: notifications.deadlines ? "Enabled" : "Disabled",
          toggle: true,
          onToggle: () =>
            setNotifications({
              ...notifications,
              deadlines: !notifications.deadlines,
            }),
        },
        {
          label: "Weekly Career Report",
          value: notifications.report ? "Enabled" : "Disabled",
          toggle: true,
          onToggle: () =>
            setNotifications({
              ...notifications,
              report: !notifications.report,
            }),
        },
      ],
    },
    {
      section: "Privacy",
      items: [
        {
          label: "Profile Visibility",
          value: profile.profile?.visibility || "Public",
          key: "visibility",
          editable: true,
        },
        {
          label: "Resume Sharing",
          value: sharing ? "Enabled" : "Disabled",
          toggle: true,
          onToggle: () => setSharing(!sharing),
        },
      ],
    },
  ]

  return (
    <div className="p-8 max-w-4xl mx-auto w-full font-sans">
      <div className="mb-10">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 mb-2">
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-emerald-500">Settings</span>
        </h1>
        <p className="text-sm font-medium text-slate-500">
          Manage your account preferences
        </p>
      </div>

      <div className="space-y-6">
        {sections.map(({ section, items }) => (
          <div
            key={section}
            className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm"
          >
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                {section}
              </h3>
            </div>
            <div className="divide-y divide-slate-100">
              {items.map(
                ({ label, value, editable, toggle, key, onToggle }: any) => (
                  <div
                    key={label}
                    className="px-6 py-5 flex items-center justify-between gap-6"
                  >
                    <div className="flex-1">
                      <div className="text-sm font-bold text-slate-900 mb-1">
                        {label}
                      </div>
                      {editingKey === key ? (
                        <div className="flex items-center gap-2 max-w-sm mt-3">
                          <input
                            value={tempValue}
                            onChange={(e) => setTempValue(e.target.value)}
                            className="flex-1 bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                            autoFocus
                          />
                          <button
                            onClick={() => handleSaveField(key)}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-sm transition-colors"
                          >
                            Save
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 px-4 py-2 rounded-xl text-xs font-bold shadow-sm transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        !toggle && (
                          <div className="text-sm font-medium text-slate-500">
                            {value}
                          </div>
                        )
                      )}
                    </div>
                    {toggle ? (
                      <button
                        onClick={onToggle}
                        className={`w-11 h-6 rounded-full relative transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
                          value === "Enabled" ? "bg-indigo-500" : "bg-slate-200"
                        }`}
                      >
                        <span
                          className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform shadow-sm ${
                            value === "Enabled" ? "translate-x-5" : "translate-x-0"
                          }`}
                        />
                      </button>
                    ) : (
                      editable &&
                      editingKey !== key && (
                        <button
                          onClick={() => handleStartEdit(key, value)}
                          className="text-sm font-bold text-slate-400 hover:text-indigo-600 px-4 py-2 rounded-xl hover:bg-indigo-50 transition-colors"
                        >
                          Edit
                        </button>
                      )
                    )}
                  </div>
                ),
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 pt-6 border-t border-slate-200">
        <button
          onClick={() => onNavigate("landing")}
          className="bg-rose-50 text-rose-600 hover:bg-rose-100 hover:text-rose-700 px-6 py-3 rounded-xl text-sm font-bold transition-colors"
        >
          Delete Account
        </button>
      </div>
    </div>
  )
}
