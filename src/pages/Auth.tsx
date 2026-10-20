import { useState } from "react"
import { SparklesIcon, ShieldIcon, CheckIcon } from "../components/Icons"
import { api } from "../api"
import logo from "../assets/logo.png"

interface AuthProps {
  onNavigate: (p: string) => void
}

export default function Auth({ onNavigate }: AuthProps) {
  const [mode, setMode] = useState<"login" | "signup">("login")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [name, setName] = useState("")
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setErrorMsg("")
    try {
      if (mode === "signup") {
        await api.signup(name, email, password)
      } else {
        await api.login(email, password)
      }
      onNavigate("dashboard")
    } catch (err: any) {
      setErrorMsg(
        err.response?.data?.error ||
          err.message ||
          "Authentication failed. Please try again.",
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen grid grid-cols-1 md:grid-cols-2 bg-slate-50 font-sans">
      {/* Left panel */}
      <div className="hidden md:flex flex-col justify-center items-center p-12 bg-slate-100 border-r border-slate-200 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-indigo-100 via-slate-100 to-emerald-50 opacity-70"></div>
        <div className="relative max-w-md text-center z-10">
          <div className="w-16 h-16 rounded-2xl bg-indigo-600 flex items-center justify-center mx-auto mb-8 shadow-[0_8px_16px_rgba(79,70,229,0.25)] border-4 border-white">
            <ShieldIcon size={32} className="text-white" />
          </div>
          <h2 className="text-4xl font-bold tracking-tight text-slate-900 mb-4 leading-tight">
            Verified Jobs & Internships
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-emerald-500">Discovery</span>
          </h2>
          <p className="text-[15px] text-slate-500 leading-relaxed mb-10 font-medium">
            Join students from top universities securing safe, scam-free career
            opportunities validated via machine learning filters.
          </p>

          <div className="space-y-4">
            {[
              {
                text: "Smart aggregated listings (Jooble API)",
                color: "text-blue-600",
                bg: "bg-blue-50",
                border: "border-blue-200",
              },
              { 
                text: "Real-time mathematical Trust Score", 
                color: "text-emerald-600",
                bg: "bg-emerald-50",
                border: "border-emerald-200",
              },
              {
                text: "Suspicious email & domain filter flags",
                color: "text-indigo-600",
                bg: "bg-indigo-50",
                border: "border-indigo-200",
              },
              { 
                text: "Personalized semantic recommendations", 
                color: "text-amber-600",
                bg: "bg-amber-50",
                border: "border-amber-200",
              },
            ].map(({ text, color, bg, border }) => (
              <div key={text} className="flex items-center gap-3 text-left bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm hover:border-slate-300 transition-colors">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border ${bg} ${border}`}>
                  <CheckIcon size={14} className={color} />
                </div>
                <span className="text-sm text-slate-700 font-bold">
                  {text}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex flex-col justify-center items-center p-8 md:p-12 bg-white relative">
        {/* Mobile background effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 to-white opacity-50 md:hidden pointer-events-none"></div>
        
        <div className="w-full max-w-[400px] relative z-10">
          {/* Logo */}
          <div
            className="flex items-center gap-2.5 mb-12 cursor-pointer group"
            onClick={() => onNavigate("landing")}
          >
            <img src={logo} alt="InternHub" className="w-8 h-8 object-contain transition-transform group-hover:scale-105" />
            <span className="font-bold text-lg tracking-tight text-slate-900 group-hover:text-indigo-600 transition-colors">
              InternHub
            </span>
          </div>

          <div>
            {/* Mode toggle */}
            <div className="flex bg-slate-100 rounded-xl p-1 mb-10 shadow-inner">
              {(["login", "signup"] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => {
                    setMode(m)
                    setErrorMsg("")
                  }}
                  className={`flex-1 py-2.5 rounded-lg text-sm font-bold capitalize transition-all ${
                    mode === m 
                      ? "bg-white text-indigo-600 shadow-sm" 
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  {m === "login" ? "Sign In" : "Sign Up"}
                </button>
              ))}
            </div>

            <h1 className="text-3xl font-bold tracking-tight text-slate-900 mb-2">
              {mode === "login" ? "Welcome back" : "Create your account"}
            </h1>
            <p className="text-sm font-medium text-slate-500 mb-8">
              {mode === "login"
                ? "Sign in to access validated listings"
                : "Get access to curated and trust-scored roles"}
            </p>

            {errorMsg && (
              <div className="bg-rose-50 border border-rose-200 rounded-xl px-4 py-3 text-rose-600 text-sm font-semibold mb-6 flex items-start gap-3">
                 <div className="mt-0.5"><SparklesIcon size={16} /></div>
                 <div>{errorMsg}</div>
              </div>
            )}

            <button
              onClick={async () => {
                try {
                  setLoading(true)
                  await api.googleLogin()
                  onNavigate("dashboard")
                } catch(e: any) {
                  setErrorMsg(e.message || "Google auth failed")
                } finally {
                  setLoading(false)
                }
              }}
              disabled={loading}
              className="w-full py-3.5 mb-6 rounded-xl text-sm font-bold shadow-sm border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition-all flex items-center justify-center gap-3"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
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

            <div className="flex items-center gap-4 mb-6">
              <div className="flex-1 h-px bg-slate-200"></div>
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">or sign in with email</div>
              <div className="flex-1 h-px bg-slate-200"></div>
            </div>

            <form
              onSubmit={handleSubmit}
              className="flex flex-col gap-4"
            >
              {mode === "signup" && (
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wide">
                    Full Name
                  </label>
                  <input
                    type="text"
                    placeholder="Arun Kumar"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="w-full bg-white border border-slate-200 px-4 py-3 rounded-xl text-slate-900 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all placeholder:text-slate-400"
                  />
                </div>
              )}
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wide">
                  Email Address
                </label>
                <input
                  type="email"
                  placeholder="you@university.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full bg-white border border-slate-200 px-4 py-3 rounded-xl text-slate-900 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all placeholder:text-slate-400"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wide">
                  Password
                </label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full bg-white border border-slate-200 px-4 py-3 rounded-xl text-slate-900 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all placeholder:text-slate-400"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className={`w-full py-3.5 rounded-xl text-sm font-bold shadow-sm transition-all flex items-center justify-center gap-2 mt-2 ${
                  loading 
                    ? "bg-indigo-400 text-white cursor-not-allowed" 
                    : "bg-indigo-600 hover:bg-indigo-700 text-white hover:shadow-md"
                }`}
              >
                {loading ? (
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin block" />
                ) : mode === "login" ? (
                  "Sign In"
                ) : (
                  "Sign Up"
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
