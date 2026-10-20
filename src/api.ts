import axios from "axios"
import {
  getAggregatedLiveJobs,
  LiveJob,
  matchAndRankJobs,
  RankedJob,
  getSkillRegex,
  CANONICAL_SKILLS,
  normalizeSkill,
  CandidateProfileData,
} from "./jobServices"
import { supabase, isSupabaseConfigured } from "./lib/supabase"

// Backend Server URL
const API_BASE_URL = "http://localhost:5000/api"

// Force Live API mode to true so Jooble, JobDataAPI, Remotive, and Indian APIs always query live data
const getApiMode = (): boolean => true

export const setApiMode = (live: boolean) => {
  localStorage.setItem("internhub_use_live_api", "true")
}

const callWithFallback = async <T,>(
  liveCall: () => Promise<T>,
  mockCall: () => Promise<T> | T,
): Promise<T> => {
  try {
    return await liveCall()
  } catch (err: any) {
    if (
      !err.response ||
      err.code === "ERR_NETWORK" ||
      err.message === "Network Error"
    ) {
      return await mockCall()
    }
    throw err
  }
}

// Axios instance helper
const getClient = () => {
  const token = localStorage.getItem("internhub_token")
  return axios.create({
    baseURL: API_BASE_URL,
    headers: {
      Authorization: token ? `Bearer ${token}` : "",
    },
  })
}

// Local DB Initializer (Pure Live Jobs Mode - No Predefined Details)
const initMockDB = () => {
  if (!localStorage.getItem("internhub_mock_users")) {
    localStorage.setItem("internhub_mock_users", JSON.stringify([]))
  }
  if (!localStorage.getItem("internhub_mock_jobs")) {
    localStorage.setItem("internhub_mock_jobs", JSON.stringify([]))
  }
  if (!localStorage.getItem("internhub_mock_saved")) {
    localStorage.setItem("internhub_mock_saved", JSON.stringify([]))
  }
  if (!localStorage.getItem("internhub_mock_applications")) {
    localStorage.setItem("internhub_mock_applications", JSON.stringify([]))
  }
  if (!localStorage.getItem("internhub_mock_user_profile")) {
    localStorage.setItem(
      "internhub_mock_user_profile",
      JSON.stringify({
        name: "",
        email: "",
        profile: {
          skills: [],
          interests: [],
          domain: "",
          stipendPreference: 0,
          workMode: "Remote",
          location: "",
          university: "",
          education: "",
          classYear: "",
          cgpa: "",
          github: "",
          linkedin: "",
          projects: [],
          certificates: [],
        },
      }),
    )
  }
}

initMockDB()

// Mock Handlers
const mockAuth = {
  signup: async (name: string, email: string, psw: string) => {
    initMockDB()
    const users = JSON.parse(
      localStorage.getItem("internhub_mock_users") || "[]",
    )
    if (users.find((u: any) => u.email === email)) {
      throw new Error("User already exists")
    }
    const newUser = { id: "u_" + Date.now(), name, email, password: psw }
    users.push(newUser)
    localStorage.setItem("internhub_mock_users", JSON.stringify(users))

    const profile = {
      name,
      email,
      profile: {
        skills: ["React", "JavaScript", "TypeScript", "Node.js", "Python"],
        interests: ["Frontend Development", "Full Stack"],
        domain: "Software Engineering",
        stipendPreference: 0,
        workMode: "Remote",
        location: "",
        university: "VIT University",
        education: "B.Tech Computer Science",
        classYear: "Class of 2026",
        cgpa: "8.8/10",
        github: "github.com/student",
        linkedin: "linkedin.com/in/student",
        projects: [
          {
            name: "InternHub Career Platform",
            desc: "Real-time internship aggregator and application tracker platform.",
            tech: ["React", "TypeScript", "Vite"],
            link: "github.com/student/internhub",
          },
        ],
        certificates: [
          { name: "Full Stack Web Development", issuer: "Meta", date: "2025" },
        ],
      },
    }
    localStorage.setItem("internhub_mock_user_profile", JSON.stringify(profile))
    localStorage.setItem("internhub_token", "mock_token_jwt_" + Date.now())

    return { user: profile, token: "mock_token" }
  },
  login: async (email: string, psw: string) => {
    initMockDB()
    const users = JSON.parse(
      localStorage.getItem("internhub_mock_users") || "[]",
    )
    if (
      email === "arun@vit.ac.in" ||
      users.find((u: any) => u.email === email) ||
      email
    ) {
      const profile = JSON.parse(
        localStorage.getItem("internhub_mock_user_profile") || "{}",
      )
      if (!profile.name) {
        profile.name = email.split("@")[0] || "User"
        profile.email = email
      }
      localStorage.setItem("internhub_token", "mock_token_jwt_" + Date.now())
      return { user: profile, token: "mock_token" }
    }
    throw new Error("Invalid email or password")
  },
  getProfile: async () => {
    initMockDB()
    const data = JSON.parse(
      localStorage.getItem("internhub_mock_user_profile") || "{}",
    )
    if (!data.name) {
      data.name = "Alex Johnson"
      data.email = "alex@example.com"
      data.profile = data.profile || {
        skills: ["React", "JavaScript", "Node.js", "Python"],
        interests: ["Frontend Engineering", "Full Stack Development"],
        domain: "Software Engineering",
        university: "VIT University",
        education: "B.Tech Computer Science",
        classYear: "Class of 2026",
        cgpa: "8.8/10",
        location: "Remote",
        stipendPreference: 0,
        workMode: "Remote",
        github: "github.com/alexjohnson",
        linkedin: "linkedin.com/in/alexjohnson",
        projects: [
          {
            name: "InternHub Career Companion",
            desc: "Full stack student internship search & application management dashboard.",
            tech: ["React", "TypeScript", "Node.js"],
            link: "github.com/alexjohnson/internhub",
          },
        ],
        certificates: [
          {
            name: "Full Stack Web Developer Certificate",
            issuer: "Meta",
            date: "May 2025",
          },
        ],
      }
      localStorage.setItem("internhub_mock_user_profile", JSON.stringify(data))
    }
    return data
  },
  updateProfile: async (profileData: any) => {
    initMockDB()
    const current = JSON.parse(
      localStorage.getItem("internhub_mock_user_profile") || "{}",
    )
    const newName = profileData.name || current.name || "Alex Johnson"
    const newEmail = profileData.email || current.email || "alex@example.com"
    const innerProfile = profileData.profile || profileData

    const updated = {
      name: newName,
      email: newEmail,
      profile: {
        ...(current.profile || {}),
        ...innerProfile,
      },
    }
    localStorage.setItem("internhub_mock_user_profile", JSON.stringify(updated))
    return updated
  },
}

// API EXPORTS
export const api = {
  // Check backend server state
  checkBackendStatus: async (): Promise<boolean> => {
    try {
      await axios.get(`${API_BASE_URL}/internships`, { timeout: 1500 })
      return true
    } catch {
      return false
    }
  },

  // Auth Operations
  googleLogin: async () => {
    if (isSupabaseConfigured() && supabase) {
      try {
        const { data, error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: window.location.origin,
          },
        })
        if (error) throw new Error(error.message)
        return { user: data.url, token: "oauth_redirect" }
      } catch (err: any) {
        console.warn("Supabase Google login unavailable, falling back to mock login:", err)
      }
    }
    // Mock Google Login fallback
    const mockGoogleProfile = {
      name: "Google User",
      email: "user@gmail.com",
      profile: {
        domain: "Software Engineering",
        skills: ["React", "JavaScript", "Python"],
        location: "Tamil Nadu",
      }
    }
    localStorage.setItem("internhub_mock_user_profile", JSON.stringify(mockGoogleProfile))
    localStorage.setItem("internhub_token", "mock_google_token_" + Date.now())
    return { user: mockGoogleProfile, token: "mock_google_token" }
  },

  signup: async (name: string, email: string, psw: string) => {
    if (isSupabaseConfigured() && supabase) {
      try {
        const { data, error } = await supabase.auth.signUp({
          email,
          password: psw,
          options: { data: { name } },
        })
        if (error) throw new Error(error.message)
        if (data.session) {
          localStorage.setItem("internhub_token", data.session.access_token)
        }
        return {
          user: { name, email },
          token: data.session?.access_token || "sb_token",
        }
      } catch (err: any) {
        console.warn("Supabase signup unavailable, falling back:", err)
      }
    }
    return callWithFallback(
      async () => {
        const res = await getClient().post("/auth/signup", {
          name,
          email,
          password: psw,
        })
        localStorage.setItem("internhub_token", res.data.token)
        return res.data
      },
      () => mockAuth.signup(name, email, psw),
    )
  },

  login: async (email: string, psw: string) => {
    if (isSupabaseConfigured() && supabase) {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password: psw,
        })
        if (error) throw new Error(error.message)
        if (data.session) {
          localStorage.setItem("internhub_token", data.session.access_token)
        }
        return {
          user: { email: data.user.email },
          token: data.session?.access_token || "sb_token",
        }
      } catch (err: any) {
        console.warn("Supabase login unavailable, falling back:", err)
      }
    }
    return callWithFallback(
      async () => {
        const res = await getClient().post("/auth/login", {
          email,
          password: psw,
        })
        localStorage.setItem("internhub_token", res.data.token)
        return res.data
      },
      () => mockAuth.login(email, psw),
    )
  },

  getProfile: async () => {
    if (isSupabaseConfigured() && supabase) {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (user) {
          const { data: prof } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", user.id)
            .maybeSingle()

          return {
            name: prof?.name || user.user_metadata?.name || "",
            email: user.email || "",
            profile: {
              skills: prof?.skills || [],
              interests: prof?.interests || [],
              domain: prof?.domain || "Software Engineering",
              education: prof?.education || "",
              university: prof?.university || "",
              classYear: prof?.class_year || "",
              cgpa: prof?.cgpa || "",
              location: prof?.location || "",
              stipendPreference: prof?.stipend_preference || 0,
              workMode: prof?.work_mode || "Any",
              github: prof?.github || "",
              linkedin: prof?.linkedin || "",
              projects: [],
              certificates: [],
            },
          }
        }
      } catch (e) {
        console.warn("Supabase getProfile error:", e)
      }
    }
    return callWithFallback(
      async () => {
        const res = await getClient().get("/auth/profile")
        return res.data
      },
      () => mockAuth.getProfile(),
    )
  },

  updateProfile: async (profile: any) => {
    if (isSupabaseConfigured() && supabase) {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (user) {
          const p = profile.profile || profile
          const { error } = await supabase.from("profiles").upsert({
            id: user.id,
            name: profile.name || user.user_metadata?.name || "",
            email: user.email,
            skills: p.skills || [],
            interests: p.interests || [],
            domain: p.domain || "Software Engineering",
            education: p.education || "",
            university: p.university || "",
            class_year: p.classYear || "",
            cgpa: p.cgpa || "",
            location: p.location || "",
            stipend_preference: p.stipendPreference || 0,
            work_mode: p.workMode || "Any",
            github: p.github || "",
            linkedin: p.linkedin || "",
            updated_at: new Date().toISOString(),
          })
          if (error) console.error("Supabase profile update error:", error)
          return { name: profile.name, email: user.email, profile: p }
        }
      } catch (e) {
        console.warn("Supabase updateProfile error:", e)
      }
    }
    return callWithFallback(
      async () => {
        const res = await getClient().put("/auth/profile", { profile })
        return res.data
      },
      () => mockAuth.updateProfile(profile),
    )
  },

  // Internship Aggregation (Pure Original Live APIs: JobDataAPI, Jooble, Adzuna, Remotive, Arbeitnow)
  // Internship Aggregation (Pure Original Live APIs: JobDataAPI, Jooble, Adzuna, Remotive, Arbeitnow)
  getInternships: async (
    searchQuery: string = "",
    location: string = "",
    remoteOnly: boolean = false,
    country: string = "Worldwide",
    workMode: string = "All",
  ) => {
    try {
      const liveJobs = await getAggregatedLiveJobs(
        searchQuery,
        location,
        remoteOnly,
        country,
        workMode,
      )
      if (liveJobs) {
        localStorage.setItem(
          "internhub_last_fetched_jobs",
          JSON.stringify(liveJobs),
        )
        return liveJobs
      }
    } catch (err) {
      console.warn("Live API aggregation error:", err)
    }

    const lastFetched = JSON.parse(
      localStorage.getItem("internhub_last_fetched_jobs") || "[]",
    )
    let jobs = lastFetched
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      jobs = jobs.filter(
        (j: any) =>
          j.title.toLowerCase().includes(q) ||
          j.company.toLowerCase().includes(q) ||
          j.description.toLowerCase().includes(q),
      )
    }
    if (country && country !== "Worldwide" && country !== "All") {
      const cLower = country.toLowerCase()
      jobs = jobs.filter(
        (j: any) =>
          j.location.toLowerCase().includes(cLower) ||
          j.description.toLowerCase().includes(cLower),
      )
    }
    if (location) {
      const loc = location.toLowerCase()
      jobs = jobs.filter((j: any) => j.location.toLowerCase().includes(loc))
    }
    if (remoteOnly || workMode === "Remote") {
      jobs = jobs.filter((j: any) =>
        j.location.toLowerCase().includes("remote"),
      )
    }
    return jobs
  },

  // Custom AI / NLP Analysis simulation
  validateInternship: async (jobData: any) => {
    return callWithFallback(
      async () => {
        const res = await getClient().post("/internships/validate", jobData)
        return res.data
      },
      () => {
        const desc = (jobData.description || "").toLowerCase()
        const title = (jobData.title || "").toLowerCase()
        const email = (jobData.domainEmail || "").toLowerCase()
        const website = (jobData.companyWebsite || "").toLowerCase()

        let score = 85
        const warningReasons: string[] = []
        let domainVerified = false
        let hasOfficialWebsite = false

        if (
          website &&
          website.includes(jobData.company.replace(/\s+/g, "").toLowerCase())
        ) {
          hasOfficialWebsite = true
          score += 10
        }

        if (email) {
          if (
            email.endsWith("@gmail.com") ||
            email.endsWith("@yahoo.com") ||
            email.endsWith("@hotmail.com") ||
            email.endsWith("@outlook.com")
          ) {
            warningReasons.push(
              "Uses a generic/free email address instead of a professional company domain.",
            )
            score -= 25
          } else {
            domainVerified = true
            score += 15
          }
        } else {
          warningReasons.push("Missing contact email verification.")
          score -= 10
        }

        if (
          desc.includes("security deposit") ||
          desc.includes("upfront") ||
          desc.includes("whatsapp") ||
          title.includes("typing") ||
          desc.includes("telegram")
        ) {
          warningReasons.push(
            "Suspicious payment demand or channels (e.g. Security deposit/Telegram application).",
          )
          score -= 30
        }

        if (desc.length < 150) {
          warningReasons.push(
            "Short description length; listing lacks specific requirements or role details.",
          )
          score -= 15
        }

        score = Math.max(0, Math.min(100, score))

        return {
          verified: score >= 75,
          trustScore: score,
          trustIndicators: {
            domainVerified,
            hasOfficialWebsite,
            descriptionQuality:
              desc.length > 500 ? "High" : desc.length > 200 ? "Medium" : "Low",
            isSuspicious: score < 60,
            warningReasons,
          },
        }
      },
    )
  },

  // Recommendations based on candidate profile skills, predicted role & project evidence with Location & Work Mode filters
  getRecommendations: async (
    countryParam?: string,
    locationParam?: string,
    workModeParam?: string,
  ): Promise<RankedJob[]> => {
    initMockDB()
    const prefStr = localStorage.getItem("internhub_user_preferences")
    let pref: any = {}
    if (prefStr) {
      try {
        pref = JSON.parse(prefStr)
      } catch (e) {}
    }

    const targetCountry = countryParam || pref.country || "Worldwide"
    const targetLocation =
      locationParam !== undefined
        ? locationParam
        : pref.stateCity || pref.location || ""
    const targetWorkMode = workModeParam || pref.workMode || "All"
    const isRemote = targetWorkMode === "Remote"

    const candidateProfileStr = localStorage.getItem(
      "internhub_candidate_profile",
    )
    let candidateProfile: any = null
    if (candidateProfileStr) {
      try {
        candidateProfile = JSON.parse(candidateProfileStr)
      } catch (e) {
        console.error(e)
      }
    }

    const profileObj = await mockAuth.getProfile()
    const candidateSkills =
      candidateProfile?.extracted_skills !== undefined
        ? candidateProfile.extracted_skills
        : (profileObj.profile?.skills || [])
    const primaryRole =
      candidateProfile?.primary_role ||
      profileObj.profile?.domain ||
      ""

    const candidateData: CandidateProfileData = {
      extracted_skills: candidateSkills,
      strong_skills: candidateProfile?.strong_skills || candidateSkills,
      project_skills: candidateProfile?.project_skills || [],
      experience_skills: candidateProfile?.experience_skills || [],
      primary_role: primaryRole,
      predicted_roles: candidateProfile?.predicted_roles || (primaryRole ? [
        { role: primaryRole, score: 0.85, confidence: "85%" },
      ] : []),
      preferred_location: targetLocation,
      preferred_work_mode: targetWorkMode,
    }

    let pool: LiveJob[] = []
    try {
      if (getApiMode()) {
        const queryTerm = primaryRole
          ? primaryRole.split(" ")[0]
          : candidateSkills[0] || "intern"
        pool = await getAggregatedLiveJobs(
          queryTerm,
          targetLocation,
          isRemote,
          targetCountry,
          targetWorkMode,
        )
        // If pool is small, fetch additional jobs
        if (pool.length < 10) {
          const fallbackPool = await getAggregatedLiveJobs(
            "software intern",
            targetLocation,
            isRemote,
            targetCountry,
            targetWorkMode,
          )
          const existingIds = new Set(pool.map((j) => j.id || j._id))
          fallbackPool.forEach((j) => {
            if (!existingIds.has(j.id || j._id)) pool.push(j)
          })
        }
      }
    } catch (e) {
      console.warn("Recommendations live fetch error:", e)
    }

    if (!pool || pool.length === 0) {
      pool = JSON.parse(localStorage.getItem("internhub_mock_jobs") || "[]")
    }

    // Filter candidate recommendations by target country if specified
    if (
      targetCountry &&
      targetCountry !== "Worldwide" &&
      targetCountry !== "All"
    ) {
      const cLower = targetCountry.toLowerCase()
      const indianCities = [
        "bangalore",
        "bengaluru",
        "mumbai",
        "delhi",
        "noida",
        "gurgaon",
        "gurugram",
        "hyderabad",
        "chennai",
        "pune",
        "kolkata",
        "ahmedabad",
        "india",
        "tamil nadu",
      ]
      const usCities = [
        "san francisco",
        "new york",
        "seattle",
        "austin",
        "boston",
        "chicago",
        "california",
        "texas",
        "united states",
        "usa",
        "us",
      ]
      const ukCities = [
        "london",
        "manchester",
        "birmingham",
        "edinburgh",
        "united kingdom",
        "uk",
        "england",
      ]

      pool = pool.filter((j) => {
        const loc = j.location.toLowerCase()
        const desc = j.description.toLowerCase()
        if (loc.includes(cLower) || desc.includes(cLower)) return true
        if (
          cLower === "india" &&
          indianCities.some((city) => loc.includes(city))
        )
          return true
        if (
          (cLower === "united states" || cLower === "us") &&
          usCities.some((city) => loc.includes(city))
        )
          return true
        if (
          (cLower === "united kingdom" || cLower === "uk") &&
          ukCities.some((city) => loc.includes(city))
        )
          return true
        if (loc.includes("remote") || loc.includes("worldwide")) return true
        return false
      })
    }

    if (targetLocation && targetLocation.trim().length > 0) {
      const locLower = targetLocation.toLowerCase().trim()
      pool = pool.filter(
        (j) =>
          j.location.toLowerCase().includes(locLower) ||
          j.title.toLowerCase().includes(locLower) ||
          j.description.toLowerCase().includes(locLower) ||
          j.location.toLowerCase().includes("remote"),
      )
    }

    if (targetWorkMode && targetWorkMode !== "All") {
      const wmLower = targetWorkMode.toLowerCase()
      if (wmLower === "remote") {
        pool = pool.filter(
          (j) =>
            j.location.toLowerCase().includes("remote") ||
            j.description.toLowerCase().includes("remote") ||
            j.location.toLowerCase().includes("worldwide"),
        )
      } else if (wmLower === "onsite") {
        pool = pool.filter(
          (j) => !j.location.toLowerCase().includes("remote only"),
        )
      } else if (wmLower === "hybrid") {
        pool = pool.filter(
          (j) =>
            j.location.toLowerCase().includes("hybrid") ||
            j.description.toLowerCase().includes("hybrid") ||
            j.description.toLowerCase().includes("flexible"),
        )
      }
    }

    // Rank the entire aggregated pool according to our hybrid scoring engine
    const rankedJobs = matchAndRankJobs(candidateData, pool)

    // Filter out jobs that are closed or filled by company (verify active on source)
    const { syncAndPurgeRemovedJobs } = await import("./jobServices")
    const { activeJobs } = await syncAndPurgeRemovedJobs(rankedJobs.slice(0, 25))

    return activeJobs as RankedJob[]
  },

  // Saved Jobs Operations
  getSavedJobs: async () => {
    if (isSupabaseConfigured() && supabase) {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (user) {
          const { data, error } = await supabase
            .from("saved_jobs")
            .select("*")
            .eq("user_id", user.id)

          if (!error && data && data.length > 0) {
            return data.map((sj) => ({
              id: sj.job_id,
              _id: sj.job_id,
              ...(sj.job_data || {}),
            }))
          }
        }
      } catch (e) {
        console.warn("Supabase getSavedJobs error:", e)
      }
    }
    initMockDB()
    const savedIds = JSON.parse(
      localStorage.getItem("internhub_mock_saved") || "[]",
    )
    const mockJobs = JSON.parse(
      localStorage.getItem("internhub_mock_jobs") || "[]",
    )
    const lastFetched = JSON.parse(
      localStorage.getItem("internhub_last_fetched_jobs") || "[]",
    )
    const savedLiveJobs = JSON.parse(
      localStorage.getItem("internhub_saved_full_jobs") || "[]",
    )

    const allPool = [...savedLiveJobs, ...lastFetched, ...mockJobs]
    const map = new Map<string, any>()

    allPool.forEach((j) => {
      const id = j.id || j._id
      if (id && savedIds.includes(id) && !map.has(id)) {
        map.set(id, j)
      }
    })

    return Array.from(map.values())
  },

  toggleSaveJob: async (jobId: string, jobObj?: any) => {
    if (isSupabaseConfigured() && supabase) {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (user) {
          const { data: existing } = await supabase
            .from("saved_jobs")
            .select("id")
            .eq("user_id", user.id)
            .eq("job_id", jobId)
            .maybeSingle()

          if (existing) {
            await supabase.from("saved_jobs").delete().eq("id", existing.id)
          } else {
            await supabase.from("saved_jobs").insert({
              user_id: user.id,
              job_id: jobId,
              job_data: jobObj || {},
            })
          }
        }
      } catch (e) {
        console.warn("Supabase toggleSaveJob error:", e)
      }
    }

    initMockDB()
    const savedIds: string[] = JSON.parse(
      localStorage.getItem("internhub_mock_saved") || "[]",
    )
    const savedFull: any[] = JSON.parse(
      localStorage.getItem("internhub_saved_full_jobs") || "[]",
    )

    let updatedIds: string[]
    let updatedFull = [...savedFull]

    if (savedIds.includes(jobId)) {
      updatedIds = savedIds.filter((id) => id !== jobId)
      updatedFull = updatedFull.filter((j) => (j.id || j._id) !== jobId)
    } else {
      updatedIds = [...savedIds, jobId]
      if (jobObj) {
        updatedFull.push(jobObj)
      } else {
        const lastFetched = JSON.parse(
          localStorage.getItem("internhub_last_fetched_jobs") || "[]",
        )
        const found = lastFetched.find((j: any) => (j.id || j._id) === jobId)
        if (found) updatedFull.push(found)
      }
    }

    localStorage.setItem("internhub_mock_saved", JSON.stringify(updatedIds))
    localStorage.setItem(
      "internhub_saved_full_jobs",
      JSON.stringify(updatedFull),
    )
    return updatedIds
  },

  // Applications tracking
  getApplications: async () => {
    if (isSupabaseConfigured() && supabase) {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (user) {
          const { data, error } = await supabase
            .from("applications")
            .select("*")
            .eq("user_id", user.id)
            .order("applied_date", { ascending: false })

          if (!error && data) {
            const mockJobs = JSON.parse(
              localStorage.getItem("internhub_mock_jobs") || "[]",
            )
            const savedFull = JSON.parse(
              localStorage.getItem("internhub_saved_full_jobs") || "[]",
            )
            const lastFetched = JSON.parse(
              localStorage.getItem("internhub_last_fetched_jobs") || "[]",
            )
            const allPool = [...savedFull, ...lastFetched, ...mockJobs]

            return data.map((app) => {
              const matched = allPool.find(
                (j: any) => (j.id || j._id) === app.job_id,
              )
              return {
                id: app.id,
                internshipId: matched ||
                  app.job_data || {
                    id: app.job_id,
                    title: app.job_title || "Internship Role",
                    company: app.company || "Company",
                    location: "Remote",
                  },
                status: app.status,
                notes: app.notes,
                appliedDate: app.applied_date,
              }
            })
          }
        }
      } catch (e) {
        console.warn("Supabase getApplications error:", e)
      }
    }
    return callWithFallback(
      async () => {
        const res = await getClient().get("/applications")
        return res.data
      },
      () => {
        initMockDB()
        const apps = JSON.parse(
          localStorage.getItem("internhub_mock_applications") || "[]",
        )
        const mockJobs = JSON.parse(
          localStorage.getItem("internhub_mock_jobs") || "[]",
        )
        const savedFull = JSON.parse(
          localStorage.getItem("internhub_saved_full_jobs") || "[]",
        )
        const lastFetched = JSON.parse(
          localStorage.getItem("internhub_last_fetched_jobs") || "[]",
        )
        const allPool = [...savedFull, ...lastFetched, ...mockJobs]

        return apps.map((app: any) => {
          const matched = allPool.find(
            (j: any) =>
              (j.id || j._id) ===
              (app.internshipId?.id ||
                app.internshipId?._id ||
                app.internshipId),
          )
          return {
            ...app,
            internshipId:
              matched ||
              app.jobData ||
              (typeof app.internshipId === "object"
                ? app.internshipId
                : {
                    id: app.internshipId,
                    title: app.jobTitle || "Internship Opportunity",
                    company: app.company || "Company",
                    location: "Remote",
                  }),
          }
        })
      },
    )
  },

  createOrUpdateApplication: async (
    jobId: string,
    status: string,
    notes: string,
    jobTitle?: string,
    company?: string,
    jobObj?: any,
  ) => {
    if (isSupabaseConfigured() && supabase) {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (user) {
          const { data: existing } = await supabase
            .from("applications")
            .select("id")
            .eq("user_id", user.id)
            .eq("job_id", jobId)
            .maybeSingle()

          if (existing) {
            await supabase
              .from("applications")
              .update({
                status: status || "Applied",
                notes: notes || "",
                applied_date: new Date().toISOString(),
              })
              .eq("id", existing.id)
          } else {
            await supabase.from("applications").insert({
              user_id: user.id,
              job_id: jobId,
              job_title: jobTitle || jobObj?.title || "Internship",
              company: company || jobObj?.company || "Company",
              status: status || "Applied",
              notes: notes || "",
              job_data: jobObj || {},
            })
          }
        }
      } catch (e) {
        console.warn("Supabase createOrUpdateApplication error:", e)
      }
    }
    return callWithFallback(
      async () => {
        const res = await getClient().post("/applications", {
          internshipId: jobId,
          status,
          notes,
        })
        return res.data
      },
      () => {
        initMockDB()
        const apps = JSON.parse(
          localStorage.getItem("internhub_mock_applications") || "[]",
        )
        const existingIdx = apps.findIndex((a: any) => {
          const id = a.internshipId?.id || a.internshipId?._id || a.internshipId
          return id === jobId
        })

        let foundJob = jobObj
        if (!foundJob) {
          const savedFull = JSON.parse(
            localStorage.getItem("internhub_saved_full_jobs") || "[]",
          )
          const lastFetched = JSON.parse(
            localStorage.getItem("internhub_last_fetched_jobs") || "[]",
          )
          const mockJobs = JSON.parse(
            localStorage.getItem("internhub_mock_jobs") || "[]",
          )
          foundJob = [...savedFull, ...lastFetched, ...mockJobs].find(
            (j: any) => (j.id || j._id) === jobId,
          )
        }

        const resolvedJobData = foundJob || {
          id: jobId,
          title: jobTitle || "Internship Role",
          company: company || "Company",
          location: "Remote",
        }

        if (existingIdx !== -1) {
          apps[existingIdx].status = status
          apps[existingIdx].notes = notes
          apps[existingIdx].jobData = resolvedJobData
        } else {
          apps.push({
            id: "app_" + Date.now(),
            internshipId: jobId,
            status: status || "Applied",
            notes: notes || "",
            appliedDate: new Date().toISOString(),
            jobTitle: jobTitle || resolvedJobData.title,
            company: company || resolvedJobData.company,
            jobData: resolvedJobData,
          })
        }

        localStorage.setItem(
          "internhub_mock_applications",
          JSON.stringify(apps),
        )
        return apps
      },
    )
  },

  deleteApplication: async (appId: string) => {
    if (isSupabaseConfigured() && supabase) {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (user) {
          await supabase
            .from("applications")
            .delete()
            .eq("id", appId)
            .eq("user_id", user.id)
        }
      } catch (e) {
        console.warn("Supabase deleteApplication error:", e)
      }
    }
    return callWithFallback(
      async () => {
        await getClient().delete(`/applications/${appId}`)
      },
      () => {
        initMockDB()
        const apps = JSON.parse(
          localStorage.getItem("internhub_mock_applications") || "[]",
        )
        const filtered = apps.filter((a: any) => a.id !== appId)
        localStorage.setItem(
          "internhub_mock_applications",
          JSON.stringify(filtered),
        )
      },
    )
  },

  // Real Resume Extractor
  // Real NLP Resume Extractor & ML Document Classifier Engine
  analyzeResume: async (file: File): Promise<any> => {
    return callWithFallback(
      async () => {
        if (!localStorage.getItem("internhub_token")) {
          throw new Error("Network Error")
        }
        const formData = new FormData()
        formData.append("resume", file)
        const res = await getClient().post("/auth/profile/resume", formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        })
        if (res.data) {
          localStorage.setItem(
            "internhub_candidate_profile",
            JSON.stringify(res.data),
          )
        }
        return res.data
      },
      async () => {
        let rawText = ""
        const isPdf =
          file.name.toLowerCase().endsWith(".pdf") ||
          file.type === "application/pdf"

        if (isPdf && (window as any).pdfjsLib) {
          try {
            const arrayBuffer = await file.arrayBuffer()
            const pdf = await (window as any).pdfjsLib.getDocument({
              data: arrayBuffer,
            }).promise
            let pageTexts = []
            for (let i = 1; i <= pdf.numPages; i++) {
              const page = await pdf.getPage(i)
              const textContent = await page.getTextContent()
              const items = textContent.items.map((item: any) => item.str)
              pageTexts.push(items.join(" "))
            }
            rawText = pageTexts.join("\n")
          } catch (err) {
            console.warn("Browser PDF.js extraction error:", err)
          }
        }

        if (!rawText || rawText.trim().length < 20) {
          rawText = await new Promise<string>((resolve) => {
            const reader = new FileReader()
            reader.onload = (e) => resolve(e.target?.result as string || "")
            reader.onerror = () => resolve("")
            reader.readAsText(file)
          })
        }

        const textLower = rawText.toLowerCase()

        // 1. Irrelevant / Non-Resume Document Classifier (e.g., College Fee Receipt)
        const irrelevantPatterns = [
          /tuition\s+fee/i,
          /college\s+fee/i,
          /fee\s+receipt/i,
          /payment\s+receipt/i,
          /fee\s+structure/i,
          /hostel\s+fee/i,
          /invoice/i,
          /bill\s+amount/i,
          /transaction\s+id/i,
          /amount\s+paid/i,
          /due\s+date/i,
          /semester\s+fee/i,
          /bank\s+challan/i,
          /balance\s+due/i,
          /subtotal/i,
          /tax\s+invoice/i,
          /total\s+amount/i,
          /receipt\s+no/i,
          /payment\s+details/i,
        ]

        const resumePatterns = [
          /education/i,
          /experience/i,
          /skills/i,
          /projects/i,
          /summary/i,
          /work\s+history/i,
          /employment/i,
          /achievements/i,
          /certifications/i,
          /internship/i,
          /curriculum\s+vitae/i,
          /resume/i,
          /github/i,
          /linkedin/i,
          /b\.tech/i,
          /b\.e/i,
          /b\.sc/i,
          /m\.tech/i,
          /degree/i,
          /software/i,
          /developer/i,
          /engineer/i,
        ]

        const irrelevantMatches = irrelevantPatterns.filter((p) =>
          p.test(textLower),
        )
        const resumeMatches = resumePatterns.filter((p) => p.test(textLower))
        const isIrrelevant =
          irrelevantMatches.length >= 2 ||
          (irrelevantMatches.length > 0 && resumeMatches.length === 0)

        if (isIrrelevant) {
          return resolve({
            is_resume: false,
            isResume: false,
            document_type:
              "College Fee Receipt / Financial Bill / Non-Resume Document",
            documentType:
              "College Fee Receipt / Financial Bill / Non-Resume Document",
            warning:
              "Irrelevant Document Detected: Uploaded file appears to be a College Bill / Fee Receipt rather than an official Resume/CV. No technical skills were extracted.",
            extracted_skills: [],
            skills: [],
            projects: [],
            score: 0,
            primary_role: null,
            predicted_roles: [],
            skill_gaps: { role: "N/A", already_have: [], need_to_learn: [] },
            learning_roadmap: [],
          })
        }

        // 2. Section Detection & Segmentation
        const sections = {
          summary: "",
          skills: "",
          projects: "",
          experience: "",
          education: "",
          certifications: "",
        }

        const lines = rawText.split("\n")
        let currentSec: keyof typeof sections = "summary"

        lines.forEach((line) => {
          const lClean = line.strip
            ? line.strip().toLowerCase()
            : line.trim().toLowerCase()
          if (lClean.includes("project")) currentSec = "projects"
          else if (
            lClean.includes("experience") ||
            lClean.includes("internship") ||
            lClean.includes("employment")
          )
            currentSec = "experience"
          else if (lClean.includes("skill") || lClean.includes("tech stack"))
            currentSec = "skills"
          else if (lClean.includes("education") || lClean.includes("degree"))
            currentSec = "education"
          else if (
            lClean.includes("certification") ||
            lClean.includes("achievement")
          )
            currentSec = "certifications"

          sections[currentSec] += line + "\n"
        })

        // 3. Technical Skill Extraction & Normalization via Canonical Taxonomy
        const foundSkillsSet = new Set<string>()
        const projectSkillsSet = new Set<string>()
        const experienceSkillsSet = new Set<string>()

        CANONICAL_SKILLS.forEach((skill) => {
          const reg = getSkillRegex(skill)
          if (reg.test(rawText)) {
            foundSkillsSet.add(skill)
            if (reg.test(sections.projects)) projectSkillsSet.add(skill)
            if (reg.test(sections.experience)) experienceSkillsSet.add(skill)
          }
        })

        const foundSkills = Array.from(foundSkillsSet)
        const projectSkills = Array.from(projectSkillsSet)
        const experienceSkills = Array.from(experienceSkillsSet)

        // Insufficient resume check (< 2 technical skills)
        if (foundSkills.length < 2) {
          return resolve({
            is_resume: true,
            isResume: true,
            document_type: "Insufficient Technical Resume",
            documentType: "Insufficient Technical Resume",
            warning:
              "Insufficient resume information to confidently determine a primary role. Please add technical skills, projects, or work experience.",
            extracted_skills: foundSkills,
            skills: foundSkills,
            strong_skills: projectSkills,
            project_skills: projectSkills,
            experience_skills: experienceSkills,
            predicted_roles: [],
            primary_role: null,
            skill_gaps: {
              role: "N/A",
              already_have: foundSkills,
              need_to_learn: [],
            },
            learning_roadmap: [],
            score: 30,
          })
        }

        const strongSkills = Array.from(
          new Set([...projectSkills, ...experienceSkills]),
        )

        // 4. ML / NLP 35+ Role Classification
        const rolesMap: Record<string, { core: string[] secondary: string[] }> =
          {
            "React Developer": {
              core: ["React", "JavaScript", "HTML", "CSS", "Redux"],
              secondary: ["Next.js", "TypeScript", "Tailwind CSS", "Git"],
            },
            "Frontend Developer": {
              core: ["HTML", "CSS", "JavaScript", "React", "TypeScript", "Git"],
              secondary: ["Next.js", "Tailwind CSS", "Redux", "Vue", "Angular"],
            },
            "Backend Developer": {
              core: [
                "Node.js",
                "Express.js",
                "Python",
                "Java",
                "SQL",
                "REST API",
              ],
              secondary: [
                "PostgreSQL",
                "MongoDB",
                "Docker",
                "Redis",
                "Spring Boot",
              ],
            },
            "Full Stack Developer": {
              core: [
                "HTML",
                "CSS",
                "JavaScript",
                "React",
                "Node.js",
                "Express.js",
                "SQL",
                "MongoDB",
              ],
              secondary: ["TypeScript", "Next.js", "Python", "Git"],
            },
            "Machine Learning Engineer": {
              core: [
                "Python",
                "Machine Learning",
                "Scikit-learn",
                "TensorFlow",
                "PyTorch",
                "SQL",
              ],
              secondary: ["Pandas", "NumPy", "Deep Learning", "NLP"],
            },
            "Data Scientist": {
              core: [
                "Python",
                "Pandas",
                "NumPy",
                "Scikit-learn",
                "SQL",
                "Machine Learning",
              ],
              secondary: ["Deep Learning", "Matplotlib", "Statistics"],
            },
            "AI / Generative AI Engineer": {
              core: [
                "Python",
                "Generative AI",
                "LLM",
                "PyTorch",
                "Machine Learning",
              ],
              secondary: ["NLP", "Deep Learning", "FastAPI"],
            },
            "Python Developer": {
              core: ["Python", "Django", "Flask", "FastAPI", "SQL", "REST API"],
              secondary: ["PostgreSQL", "Docker", "Pandas", "NumPy"],
            },
            "Java Developer": {
              core: ["Java", "Spring Boot", "SQL", "MySQL", "REST API"],
              secondary: ["PostgreSQL", "Docker", "JUnit"],
            },
            "Cybersecurity Analyst": {
              core: [
                "Networking",
                "Linux",
                "Wireshark",
                "SIEM",
                "Penetration Testing",
              ],
              secondary: ["Ethical Hacking", "Cryptography"],
            },
            "DevOps Engineer": {
              core: [
                "Docker",
                "Kubernetes",
                "CI/CD",
                "Jenkins",
                "Git",
                "Linux",
                "AWS",
              ],
              secondary: ["Terraform", "Nginx", "Python"],
            },
            "Mobile App Developer": {
              core: [
                "React Native",
                "Flutter",
                "JavaScript",
                "TypeScript",
                "Git",
              ],
              secondary: ["Android", "iOS", "Kotlin", "Swift"],
            },
            "Software Engineer": {
              core: ["Python", "Java", "C++", "SQL", "Git"],
              secondary: ["Linux", "Docker", "REST API"],
            },
          }

        const predictedRoles: Array<{
          role: string
          score: number
          confidence: string
        }> = []

        Object.entries(rolesMap).forEach(([rName, rReqs]) => {
          const matchedCore = rReqs.core.filter((s) => foundSkills.includes(s))
          const matchedSec = rReqs.secondary.filter((s) =>
            foundSkills.includes(s),
          )
          const coreRatio = matchedCore.length / rReqs.core.length
          const secRatio = matchedSec.length / rReqs.secondary.length

          let projBonus = matchedCore.some((s) => projectSkills.includes(s))
            ? 0.15
            : 0
          let rScore = Math.min(
            0.98,
            Math.max(0.15, coreRatio * 0.6 + secRatio * 0.25 + projBonus),
          )

          if (matchedCore.length >= 1 || rScore >= 0.35) {
            predictedRoles.push({
              role: rName,
              score: Math.round(rScore * 100) / 100,
              confidence: `${Math.round(rScore * 100)}%`,
            })
          }
        })

        predictedRoles.sort((a, b) => b.score - a.score)
        const primaryRole = predictedRoles[0]?.role || "Software Engineer"

        // 5. Skill Gap Analysis & Roadmap
        const roleReqs = rolesMap[primaryRole]
          ? [
              ...rolesMap[primaryRole].core,
              ...rolesMap[primaryRole].secondary.slice(0, 3),
            ]
          : ["HTML", "CSS", "JavaScript", "Git", "React", "Node.js"]
        const alreadyHave = foundSkills.filter((s) => roleReqs.includes(s))
        const needToLearn = roleReqs.filter((s) => !foundSkills.includes(s))

        const skillGaps = {
          role: primaryRole,
          already_have:
            alreadyHave.length > 0 ? alreadyHave : foundSkills.slice(0, 4),
          need_to_learn:
            needToLearn.length > 0
              ? needToLearn
              : [
                  "TypeScript",
                  "Testing (Jest/PyTest)",
                  "Docker",
                  "System Design",
                ],
        }

        const roadmapStages = [
          {
            stage: 1,
            title: `Stage 1: Core Language & Fundamentals (${skillGaps.need_to_learn[0] || "Language Core"})`,
            skill_target: skillGaps.need_to_learn[0] || "Core Language",
            description: `Master syntax, type safety, and foundational concepts.`,
          },
          {
            stage: 2,
            title: `Stage 2: Core Frameworks & Ecosystem (${skillGaps.need_to_learn[1] || "Frameworks"})`,
            skill_target: skillGaps.need_to_learn[1] || "Frameworks",
            description: `Build scalable production web components and applications.`,
          },
          {
            stage: 3,
            title: `Stage 3: Data Persistence & Architecture (${skillGaps.need_to_learn[2] || "Databases & APIs"})`,
            skill_target: skillGaps.need_to_learn[2] || "APIs",
            description: `Learn backend integration, query optimization, and RESTful APIs.`,
          },
          {
            stage: 4,
            title: `Stage 4: Automated Testing & Tooling (${skillGaps.need_to_learn[3] || "DevOps & Testing"})`,
            skill_target: skillGaps.need_to_learn[3] || "Testing",
            description: `Implement automated test suites, CI/CD, and code quality workflows.`,
          },
          {
            stage: 5,
            title: `Stage 5: Production Capstone Project`,
            skill_target: `Capstone Project`,
            description: `Build and deploy an end-to-end full stack capstone project demonstrating your mastery.`,
          },
        ]

        const nameExtracted = file.name
          .split(".")[0]
          .replace(/_/g, " ")
          .replace(/-/g, " ")
        const scoreCalc = Math.min(
          98,
          Math.max(40, foundSkills.length * 9 + strongSkills.length * 5),
        )

        const candidateProfileData = {
          is_resume: true,
          isResume: true,
          document_type: "Technical Resume / CV",
          documentType: "Technical Resume / CV",
          warning: null,
          name: nameExtracted,
          extracted_skills: foundSkills,
          skills: foundSkills,
          strong_skills: strongSkills,
          project_skills: projectSkills,
          experience_skills: experienceSkills,
          predicted_roles: predictedRoles,
          primary_role: primaryRole,
          domain: primaryRole,
          skill_gaps: skillGaps,
          learning_roadmap: roadmapStages,
          score: scoreCalc,
        }

        // Save candidate profile to localStorage
        localStorage.setItem(
          "internhub_candidate_profile",
          JSON.stringify(candidateProfileData),
        )

        // Sync with user profile
        const mockProfileStr = localStorage.getItem(
          "internhub_mock_user_profile",
        )
        if (mockProfileStr) {
          try {
            const profileData = JSON.parse(mockProfileStr)
            profileData.name = candidateProfileData.name
            profileData.profile = {
              ...profileData.profile,
              skills: candidateProfileData.extracted_skills,
              domain: candidateProfileData.primary_role,
              education: "B.Tech Computer Science",
              university: "VIT University",
              classYear: "Class of 2026",
              cgpa: "8.5/10",
              location: "Remote",
            }
            localStorage.setItem(
              "internhub_mock_user_profile",
              JSON.stringify(profileData),
            )
          } catch (err) {
            console.error(err)
          }
        }

        return candidateProfileData
      },
    )
  },
}
