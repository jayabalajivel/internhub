import { useState } from "react"
import {
  ShieldIcon,
  CheckIcon,
  EyeIcon,
  EyeOffIcon,
  BriefcaseIcon,
  LayersIcon,
  SparklesIcon,
} from "../components/Icons"
import { api } from "../api"
import logo from "../assets/logo.png"

interface AuthProps {
  onNavigate: (p: string) => void
}

export default function Auth({ onNavigate }: AuthProps) {
  const [mode, setMode] = useState<"login" | "signup">("login")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [name, setName] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState("")
  const [successMsg, setSuccessMsg] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg("")
    setSuccessMsg("")

    const cleanEmail = email.trim()

    if (mode === "signup") {
      const cleanName = name.trim()
      if (!cleanName || cleanName.length < 2) {
        setErrorMsg("Please enter your full name (minimum 2 characters).")
        return
      }
      if (!cleanEmail || !cleanEmail.includes("@")) {
        setErrorMsg("Please enter a valid email address.")
        return
      }
      if (!password || password.length < 6) {
        setErrorMsg("Password must be at least 6 characters long.")
        return
      }
      if (password !== confirmPassword) {
        setErrorMsg("Passwords do not match. Please verify both password fields.")
        return
      }

      setLoading(true)
      try {
        await api.signup(cleanName, cleanEmail, password)
        // Signup completed successfully: Prompt user to sign in
        setSuccessMsg(
          "Account created successfully! Please sign in with your email and password to access your dashboard.",
        )
        setMode("login")
        setPassword("")
        setConfirmPassword("")
      } catch (err: any) {
        setErrorMsg(
          err.response?.data?.error ||
            err.message ||
            "Unable to create account. Please try again.",
        )
      } finally {
        setLoading(false)
      }
    } else {
      // Login flow
      if (!cleanEmail || !cleanEmail.includes("@")) {
        setErrorMsg("Please enter your registered email address.")
        return
      }
      if (!password) {
        setErrorMsg("Please enter your password.")
        return
      }

      setLoading(true)
      try {
        await api.login(cleanEmail, password)
        onNavigate("dashboard")
      } catch (err: any) {
        setErrorMsg(
          err.response?.data?.error ||
            err.message ||
            "Invalid email or password. Please verify your credentials and try again.",
        )
      } finally {
        setLoading(false)
      }
    }
  }

  const handleGoogleLogin = async () => {
    try {
      setLoading(true)
      setErrorMsg("")
      await api.googleLogin()
      onNavigate("dashboard")
    } catch (e: any) {
      setErrorMsg(
        e.message || "Google authentication failed. Please try again or use email sign in.",
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-12 bg-slate-900 font-sans">
      {/* Left panel - Authentic Project Showcase */}
      <div className="hidden lg:flex lg:col-span-6 xl:col-span-7 flex-col justify-between p-12 lg:p-16 bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-white relative overflow-hidden border-r border-slate-800/80">
        {/* Decorative backdrop glow */}
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Top Header */}
        <div className="relative z-10">
          <div
            className="flex items-center gap-3 cursor-pointer group w-fit"
            onClick={() => onNavigate("landing")}
          >
            <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center p-2 backdrop-blur-sm group-hover:scale-105 transition-transform">
              <img
                src={logo}
                alt="InternHub"
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <span className="font-bold text-xl tracking-tight text-white group-hover:text-indigo-400 transition-colors">
                InternHub
              </span>
              <span className="block text-[11px] font-semibold text-indigo-400 uppercase tracking-widest">
                Career & Internship Intelligence
              </span>
            </div>
          </div>
        </div>

        {/* Middle Feature Highlights */}
        <div className="relative z-10 my-auto py-8 max-w-xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-400/20 text-indigo-300 text-xs font-semibold uppercase tracking-wider mb-6">
            <ShieldIcon size={14} className="text-indigo-400" />
            Verified Opportunities Only
          </div>

          <h1 className="text-3xl xl:text-4xl font-extrabold text-white tracking-tight leading-tight mb-4">
            Connecting Engineering Students with Safe, Scam-Free Internships
          </h1>
          <p className="text-slate-400 text-base leading-relaxed mb-8">
            A comprehensive career intelligence platform purpose-built for
            undergraduates across Computer Science, Mechanical, Electrical, Civil,
            and Data/AI domains.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/60 backdrop-blur-sm">
              <div className="w-8 h-8 rounded-lg bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center mb-3 text-indigo-400">
                <BriefcaseIcon size={18} />
              </div>
              <h3 className="font-bold text-sm text-slate-100 mb-1">
                Multi-Portal Live Aggregator
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Aggregates verified jobs in real time across JobDataAPI, Jooble,
                Adzuna, and Remotive with direct apply links.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/60 backdrop-blur-sm">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center mb-3 text-emerald-400">
                <ShieldIcon size={18} />
              </div>
              <h3 className="font-bold text-sm text-slate-100 mb-1">
                Scam Heuristic Trust Engine
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Automated Trust Score analyzes domain reputation, suspicious fees,
                and contact validity to protect students.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/60 backdrop-blur-sm">
              <div className="w-8 h-8 rounded-lg bg-cyan-500/20 border border-cyan-400/30 flex items-center justify-center mb-3 text-cyan-400">
                <LayersIcon size={18} />
              </div>
              <h3 className="font-bold text-sm text-slate-100 mb-1">
                5-Stage Domain Roadmaps
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Structured learning paths from fundamentals to deployment tailored
                for 15+ specialized engineering fields.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/60 backdrop-blur-sm">
              <div className="w-8 h-8 rounded-lg bg-purple-500/20 border border-purple-400/30 flex items-center justify-center mb-3 text-purple-400">
                <SparklesIcon size={18} />
              </div>
              <h3 className="font-bold text-sm text-slate-100 mb-1">
                Application Kanban Tracker
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Real-time tracking of student applications across Saved, Applied,
                Interviewing, and Offer stages.
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Platform Metrics */}
        <div className="relative z-10 pt-6 border-t border-slate-800/80 flex flex-wrap items-center justify-between text-xs text-slate-400 font-medium">
          <div className="flex items-center gap-6">
            <span>✓ 5+ Live Search Feeds</span>
            <span>✓ 15+ Engineering Roles</span>
            <span>✓ 100% Scam-Free Target</span>
          </div>
          <span>Engineering Undergraduates Platform</span>
        </div>
      </div>

      {/* Right panel - Professional Authentication */}
      <div className="lg:col-span-6 xl:col-span-5 flex flex-col justify-center items-center p-6 sm:p-10 md:p-14 bg-white relative">
        <div className="w-full max-w-[420px]">
          {/* Mobile Logo Header */}
          <div
            className="flex lg:hidden items-center gap-2.5 mb-8 cursor-pointer"
            onClick={() => onNavigate("landing")}
          >
            <img src={logo} alt="InternHub" className="w-8 h-8 object-contain" />
            <span className="font-bold text-lg tracking-tight text-slate-900">
              InternHub
            </span>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-xl mb-8">
            <button
              type="button"
              onClick={() => {
                setMode("login")
                setErrorMsg("")
                setSuccessMsg("")
              }}
              className={`py-2.5 text-sm font-semibold rounded-lg transition-all ${
                mode === "login"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setMode("signup")
                setErrorMsg("")
                setSuccessMsg("")
              }}
              className={`py-2.5 text-sm font-semibold rounded-lg transition-all ${
                mode === "signup"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              Create Account
            </button>
          </div>

          {/* Form Header */}
          <div className="mb-6">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight mb-2">
              {mode === "login" ? "Welcome back" : "Create your student account"}
            </h2>
            <p className="text-sm text-slate-500">
              {mode === "login"
                ? "Enter your credentials to access your saved internships and roadmap."
                : "Sign up to track applications, analyze resume skills, and explore roadmaps."}
            </p>
          </div>

          {/* Success Banner */}
          {successMsg && (
            <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-start gap-3">
              <span className="w-5 h-5 rounded-full bg-emerald-200 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                <CheckIcon size={14} className="text-emerald-700" />
              </span>
              <div>
                <p className="font-bold mb-0.5">Account Created</p>
                <p className="text-xs leading-relaxed text-emerald-700">
                  {successMsg}
                </p>
              </div>
            </div>
          )}

          {/* Error Banner */}
          {errorMsg && (
            <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-start gap-3">
              <span className="w-5 h-5 rounded-full bg-rose-200 text-rose-700 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                !
              </span>
              <div className="text-xs leading-relaxed text-rose-700 font-medium">
                {errorMsg}
              </div>
            </div>
          )}

          {/* Google OAuth Button */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full py-3 px-4 rounded-xl text-sm font-semibold border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition-all shadow-sm hover:shadow flex items-center justify-center gap-3 mb-6 disabled:opacity-50"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            Continue with Google
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3 mb-6">
            <div className="flex-1 h-px bg-slate-200" />
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              {mode === "login" ? "or sign in with email" : "or sign up with email"}
            </span>
            <div className="flex-1 h-px bg-slate-200" />
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "signup" && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Full Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Alex Morgan"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all placeholder:text-slate-400"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all placeholder:text-slate-400"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 pr-10 rounded-xl border border-slate-300 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all placeholder:text-slate-400"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? <EyeOffIcon size={16} /> : <EyeIcon size={16} />}
                </button>
              </div>
              {mode === "signup" && (
                <p className="text-[11px] text-slate-400 mt-1">
                  Must be at least 6 characters.
                </p>
              )}
            </div>

            {mode === "signup" && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Confirm Password
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 pr-10 rounded-xl border border-slate-300 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all placeholder:text-slate-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showConfirmPassword ? (
                      <EyeOffIcon size={16} />
                    ) : (
                      <EyeIcon size={16} />
                    )}
                  </button>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 px-4 rounded-xl text-sm font-bold bg-indigo-600 hover:bg-indigo-700 text-white transition-all shadow-sm hover:shadow-md flex items-center justify-center gap-2 disabled:bg-indigo-400 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : mode === "login" ? (
                "Sign In"
              ) : (
                "Create Account"
              )}
            </button>
          </form>

          {/* Footer Toggle Text */}
          <div className="mt-8 text-center text-xs text-slate-500">
            {mode === "login" ? (
              <p>
                Don't have an account yet?{" "}
                <button
                  type="button"
                  onClick={() => {
                    setMode("signup")
                    setErrorMsg("")
                    setSuccessMsg("")
                  }}
                  className="font-bold text-indigo-600 hover:text-indigo-700 transition-colors"
                >
                  Create one now
                </button>
              </p>
            ) : (
              <p>
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => {
                    setMode("login")
                    setErrorMsg("")
                    setSuccessMsg("")
                  }}
                  className="font-bold text-indigo-600 hover:text-indigo-700 transition-colors"
                >
                  Sign in
                </button>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
