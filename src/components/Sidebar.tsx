import { useState, useEffect } from "react"
import { api } from "../api"
import logo from "../assets/logo.png"
import {
  HomeIcon,
  BriefcaseIcon,
  FileTextIcon,
  KanbanIcon,
  BookmarkIcon,
  BellIcon,
  UserIcon,
  SettingsIcon,
  SparklesIcon,
  LogOutIcon,
  SearchIcon,
  ZapIcon,
} from "./Icons"

type Page = "dashboard" | "internships" | "resume" | "skills" | "tracker" | "saved" | "notifications" | "profile" | "settings" | "landing" | "auth"

interface SidebarProps {
  page: Page
  onNavigate: (p: Page) => void
  collapsed?: boolean
  mobileOpen?: boolean
  onCloseMobile?: () => void
}

const navItems = [
  { id: "dashboard", label: "Overview", Icon: HomeIcon },
  { id: "internships", label: "Find Jobs & Internships", Icon: BriefcaseIcon },
  { id: "resume", label: "Resume Builder", Icon: FileTextIcon },
  { id: "skills", label: "Skill Gap Analysis", Icon: ZapIcon },
  { id: "tracker", label: "Application Tracker", Icon: KanbanIcon },
  { id: "saved", label: "Saved Jobs", Icon: BookmarkIcon },
  { id: "notifications", label: "Alerts", Icon: BellIcon },
] as const

const bottomItems = [
  { id: "profile", label: "Profile", Icon: UserIcon },
  { id: "settings", label: "Settings", Icon: SettingsIcon },
] as const

export default function Sidebar({
  page,
  onNavigate,
  mobileOpen = false,
  onCloseMobile,
}: SidebarProps) {
  const [userName, setUserName] = useState("Candidate Profile")
  const [subText, setSubText] = useState("Student")

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const p = await api.getProfile()
        if (p.name) setUserName(p.name)
        if (p.profile?.domain || p.profile?.education) {
          setSubText(p.profile.domain || p.profile.education)
        }
      } catch (e) {}
    }
    loadProfile()
  }, [page])

  const initial = userName ? userName.charAt(0).toUpperCase() : "U"

  const renderNavLinks = (isMobile = false) => (
    <>
      {/* Global Search trigger */}
      <div className="px-5 mb-5">
        <button
          onClick={() => {
            onNavigate("internships")
            if (isMobile) onCloseMobile?.()
          }}
          className="w-full flex items-center gap-2.5 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-left transition-colors hover:bg-slate-100 hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 group cursor-pointer"
        >
          <SearchIcon
            size={16}
            className="text-slate-400 group-hover:text-indigo-600 transition-colors"
          />
          <span className="text-[13px] text-slate-500 font-medium">Search jobs...</span>
          <span className="ml-auto text-[10px] text-slate-400 bg-white border border-slate-200 px-1.5 py-0.5 rounded shadow-xs">
            ⌘K
          </span>
        </button>
      </div>

      <div className="px-5 text-xs font-bold text-slate-400 tracking-wider uppercase mb-2">
        Main Menu
      </div>

      {/* Primary Navigation */}
      <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
        {navItems.map(({ id, label, Icon }) => {
          const isActive = page === id
          return (
            <button
              key={id}
              onClick={() => {
                onNavigate(id as Page)
                if (isMobile) onCloseMobile?.()
              }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 cursor-pointer ${
                isActive
                  ? "bg-indigo-50 text-indigo-700 font-semibold shadow-xs"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-medium"
              }`}
            >
              <Icon
                size={18}
                className={isActive ? "text-indigo-600" : "text-slate-400"}
              />
              <span className="text-[14px]">{label}</span>
              {id === "notifications" && (
                <span className="ml-auto bg-rose-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-md leading-none shadow-sm shadow-rose-500/20">
                  5
                </span>
              )}
            </button>
          )
        })}
      </nav>

      {/* Bottom Navigation */}
      <div className="p-3 border-t border-slate-100 space-y-1">
        {bottomItems.map(({ id, label, Icon }) => {
          const isActive = page === id
          return (
            <button
              key={id}
              onClick={() => {
                onNavigate(id as Page)
                if (isMobile) onCloseMobile?.()
              }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 cursor-pointer ${
                isActive
                  ? "bg-slate-100 text-slate-900 font-semibold"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-medium"
              }`}
            >
              <Icon
                size={18}
                className={isActive ? "text-slate-700" : "text-slate-400"}
              />
              <span className="text-[14px]">{label}</span>
            </button>
          )
        })}
        <button
          onClick={() => {
            localStorage.removeItem("internhub_token")
            onNavigate("auth")
            if (isMobile) onCloseMobile?.()
          }}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-rose-600 hover:bg-rose-50 font-medium transition-colors cursor-pointer"
        >
          <LogOutIcon size={18} className="text-rose-500" />
          <span className="text-[14px]">Sign Out</span>
        </button>
      </div>

      {/* User Profile Mini */}
      <div className="p-4 border-t border-slate-200">
        <button
          onClick={() => {
            onNavigate("profile")
            if (isMobile) onCloseMobile?.()
          }}
          className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-slate-50 transition-colors text-left cursor-pointer"
        >
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-blue-500 flex items-center justify-center font-bold text-white shadow-inner shrink-0">
            {initial}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[14px] font-semibold text-slate-900 truncate">
              {userName}
            </div>
            <div className="text-[12px] text-slate-500 truncate">{subText}</div>
          </div>
        </button>
      </div>
    </>
  )

  return (
    <>
      {/* Desktop Sidebar (Pinned on screens >= 1024px) */}
      <aside className="hidden lg:flex w-64 min-w-[256px] h-screen sticky top-0 flex-col bg-white border-r border-slate-200 z-40 shrink-0">
        <div className="p-6 flex items-center gap-3">
          <img
            src={logo}
            alt="InternHub Logo"
            className="w-9 h-9 object-contain shrink-0"
          />
          <div>
            <div className="font-bold text-[17px] text-slate-900 tracking-tight leading-none mb-1">
              InternHub
            </div>
            <div className="text-[11px] text-slate-500 font-medium tracking-wide uppercase">
              Career Platform
            </div>
          </div>
        </div>
        {renderNavLinks(false)}
      </aside>

      {/* Mobile Drawer (Visible on phones & tablets when toggled) */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop blur */}
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
            onClick={onCloseMobile}
          />
          {/* Slide-in sidebar panel */}
          <aside className="fixed top-0 bottom-0 left-0 w-72 max-w-[85vw] bg-white shadow-2xl flex flex-col z-50 animate-in slide-in-from-left duration-250">
            <div className="p-5 flex items-center justify-between border-b border-slate-100">
              <div className="flex items-center gap-3">
                <img
                  src={logo}
                  alt="InternHub"
                  className="w-8 h-8 object-contain shrink-0"
                />
                <div>
                  <div className="font-bold text-[16px] text-slate-900 leading-none mb-1">
                    InternHub
                  </div>
                  <div className="text-[10px] text-slate-500 font-medium uppercase tracking-wide">
                    Career Platform
                  </div>
                </div>
              </div>
              <button
                onClick={onCloseMobile}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                aria-label="Close menu"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            {renderNavLinks(true)}
          </aside>
        </div>
      )}
    </>
  )
}
