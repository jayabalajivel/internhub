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
  matchLocation,
  getSafeApplyUrl,
  isSkillSatisfied,
} from "./jobServices.ts"
import { DEFAULT_CURATED_JOBS } from "./defaultJobs.ts"
import { supabase, isSupabaseConfigured } from "./lib/supabase"
import { getRoleRoadmap, ROLE_ROADMAPS } from "./roadmaps"

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
    // If backend port 5000 is unavailable or times out, immediately fall back to local handler
    return await mockCall()
  }
}

// Axios instance helper with 800ms timeout to avoid hanging if backend port 5000 is closed
const getClient = () => {
  const token = localStorage.getItem("internhub_token")
  return axios.create({
    baseURL: API_BASE_URL,
    timeout: 800,
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
  if (
    !localStorage.getItem("internhub_mock_jobs") ||
    JSON.parse(localStorage.getItem("internhub_mock_jobs") || "[]").length === 0
  ) {
    localStorage.setItem(
      "internhub_mock_jobs",
      JSON.stringify(DEFAULT_CURATED_JOBS),
    )
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
    const normEmail = (email || "").trim().toLowerCase()
    const cleanName = (name || "").trim() || "Student"
    const cleanPsw = (psw || "").trim()
    const existingIdx = users.findIndex(
      (u: any) => (u.email || "").trim().toLowerCase() === normEmail,
    )
    if (existingIdx >= 0) {
      users[existingIdx].password = cleanPsw
      users[existingIdx].name = cleanName
    } else {
      const newUser = {
        id: "u_" + Date.now(),
        name: cleanName,
        email: normEmail,
        password: cleanPsw,
        createdAt: new Date().toISOString(),
      }
      users.push(newUser)
    }
    localStorage.setItem("internhub_mock_users", JSON.stringify(users))

    const profile = {
      name: cleanName,
      email: normEmail,
      profile: {
        skills: ["React", "JavaScript", "TypeScript"],
        interests: ["Software Engineering"],
        domain: "Software Engineering",
        stipendPreference: 0,
        workMode: "Remote",
        location: "",
        university: "",
        education: "Engineering Student",
        classYear: "Class of 2026",
        cgpa: "",
        github: "",
        linkedin: "",
        projects: [],
        certificates: [],
      },
    }
    localStorage.setItem("internhub_mock_user_profile", JSON.stringify(profile))
    // Note: Do not set internhub_token here. User must explicitly sign in!
    return { user: { name: cleanName, email: normEmail }, success: true }
  },
  login: async (email: string, psw: string) => {
    initMockDB()
    const users = JSON.parse(
      localStorage.getItem("internhub_mock_users") || "[]",
    )
    const normEmail = (email || "").trim().toLowerCase()
    const cleanPsw = (psw || "").trim()
    const foundUser = users.find(
      (u: any) => (u.email || "").trim().toLowerCase() === normEmail,
    )
    if (!foundUser) {
      throw new Error("No account found with this email. Please check your email or create an account.")
    }
    const storedPsw = (foundUser.password || "").trim()
    if (storedPsw !== cleanPsw) {
      throw new Error("Incorrect password. Please verify your credentials and try again.")
    }

    const mockProfileStr = localStorage.getItem("internhub_mock_user_profile")
    let profile = mockProfileStr ? JSON.parse(mockProfileStr) : {}
    if (!profile.name || profile.email !== foundUser.email) {
      profile.name = foundUser.name || normEmail.split("@")[0]
      profile.email = foundUser.email
      profile.profile = profile.profile || {
        skills: ["React", "JavaScript", "TypeScript"],
        domain: "Software Engineering",
        education: "Engineering Student",
        university: "",
        cgpa: "",
      }
      localStorage.setItem("internhub_mock_user_profile", JSON.stringify(profile))
    }
    localStorage.setItem("internhub_token", "mock_token_jwt_" + Date.now())
    return { user: profile, token: "mock_token" }
  },
  getProfile: async () => {
    initMockDB()
    const data = JSON.parse(
      localStorage.getItem("internhub_mock_user_profile") || "{}",
    )
    if (!data.name) {
      data.name = "Engineering Student"
      data.email = "student@example.com"
      data.profile = data.profile || {
        skills: ["React", "JavaScript", "TypeScript"],
        interests: ["Frontend Engineering", "Full Stack Development"],
        domain: "Software Engineering",
        university: "",
        education: "B.Tech Engineering",
        classYear: "Class of 2026",
        cgpa: "8.5/10",
        location: "Remote",
        stipendPreference: 0,
        workMode: "Remote",
        github: "",
        linkedin: "",
        projects: [],
        certificates: [],
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
    const cleanName = (name || "").trim() || "Student"
    const cleanEmail = (email || "").trim().toLowerCase()
    const cleanPsw = (psw || "").trim()

    // Always synchronize local user registry for instant, resilient sign-in
    initMockDB()
    const users = JSON.parse(
      localStorage.getItem("internhub_mock_users") || "[]",
    )
    const existingIdx = users.findIndex(
      (u: any) => (u.email || "").toLowerCase() === cleanEmail,
    )
    if (existingIdx >= 0) {
      users[existingIdx].password = cleanPsw
      users[existingIdx].name = cleanName
    } else {
      users.push({
        id: "u_" + Date.now(),
        name: cleanName,
        email: cleanEmail,
        password: cleanPsw,
        createdAt: new Date().toISOString(),
      })
    }
    localStorage.setItem("internhub_mock_users", JSON.stringify(users))

    if (isSupabaseConfigured() && supabase) {
      try {
        await supabase.auth.signUp({
          email: cleanEmail,
          password: cleanPsw,
          options: { data: { name: cleanName } },
        })
      } catch (err: any) {
        console.warn("Supabase signup sync:", err)
      }
    }
    // Do NOT log the user in on signup. They must enter their credentials on Sign In.
    localStorage.removeItem("internhub_token")
    return {
      user: { name: cleanName, email: cleanEmail },
      success: true,
      message: "Account created successfully.",
    }
  },

  login: async (email: string, psw: string) => {
    const cleanEmail = (email || "").trim().toLowerCase()
    const cleanPsw = (psw || "").trim()

    if (isSupabaseConfigured() && supabase) {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password: cleanPsw,
        })
        if (!error && data.session) {
          localStorage.setItem("internhub_token", data.session.access_token)
          const userName =
            data.user?.user_metadata?.name || cleanEmail.split("@")[0]
          return {
            user: { email: data.user.email, name: userName },
            token: data.session.access_token,
          }
        }
      } catch (err: any) {
        console.warn("Supabase login unavailable, verifying local credentials:", err)
      }
    }
    return mockAuth.login(cleanEmail, cleanPsw)
  },

  getProfile: async () => {
    initMockDB()
    const localProfileStr = localStorage.getItem("internhub_mock_user_profile")
    const localData = localProfileStr ? JSON.parse(localProfileStr) : null
    const candidateStr = localStorage.getItem("internhub_candidate_profile")
    const candidateData = candidateStr ? JSON.parse(candidateStr) : null

    let remoteProf: any = null
    let userEmail = ""
    let userName = ""

    if (isSupabaseConfigured() && supabase) {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (user) {
          userEmail = user.email || ""
          userName = user.user_metadata?.name || ""
          const { data: prof } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", user.id)
            .maybeSingle()
          remoteProf = prof
        }
      } catch (e) {
        console.warn("Supabase getProfile error:", e)
      }
    }

    // Merge in priority order: candidate data (most recent resume extraction) > local stored profile > remote
    const skills =
      candidateData?.extracted_skills && candidateData.extracted_skills.length > 0
        ? candidateData.extracted_skills
        : localData?.profile?.skills && localData.profile.skills.length > 0
          ? localData.profile.skills
          : remoteProf?.skills || []

    const domain =
      candidateData?.primary_role ||
      localData?.profile?.domain ||
      remoteProf?.domain ||
      "Software Engineering"

    const education =
      candidateData?.education ||
      localData?.profile?.education ||
      remoteProf?.education ||
      "Engineering Student"

    const university =
      candidateData?.university ||
      localData?.profile?.university ||
      remoteProf?.university ||
      ""

    const cgpa =
      candidateData?.cgpa ||
      localData?.profile?.cgpa ||
      remoteProf?.cgpa ||
      ""

    const location =
      candidateData?.location ||
      localData?.profile?.location ||
      remoteProf?.location ||
      ""

    const name =
      candidateData?.name ||
      userName ||
      localData?.name ||
      remoteProf?.name ||
      "Engineering Student"

    const email =
      userEmail ||
      localData?.email ||
      candidateData?.email ||
      "student@example.com"

    const projects =
      candidateData?.projects && candidateData.projects.length > 0
        ? candidateData.projects
        : localData?.profile?.projects || []

    const certificates =
      candidateData?.certificates && candidateData.certificates.length > 0
        ? candidateData.certificates
        : localData?.profile?.certificates || []

    const github =
      candidateData?.github ||
      localData?.profile?.github ||
      remoteProf?.github ||
      ""

    const linkedin =
      candidateData?.linkedin ||
      localData?.profile?.linkedin ||
      remoteProf?.linkedin ||
      ""

    return {
      name,
      email,
      profile: {
        skills,
        interests: localData?.profile?.interests || remoteProf?.interests || [domain],
        domain,
        education,
        university,
        classYear: localData?.profile?.classYear || remoteProf?.class_year || "Class of 2026",
        cgpa,
        location,
        stipendPreference: localData?.profile?.stipendPreference || remoteProf?.stipend_preference || 0,
        workMode: localData?.profile?.workMode || remoteProf?.work_mode || "Remote",
        github,
        linkedin,
        projects,
        certificates,
      },
    }
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

    let lastFetched = JSON.parse(
      localStorage.getItem("internhub_last_fetched_jobs") || "[]",
    )
    if (!lastFetched || lastFetched.length === 0) {
      lastFetched = DEFAULT_CURATED_JOBS
    }
    let jobs = lastFetched
    if (searchQuery) {
      const q = searchQuery.toLowerCase().trim()
      jobs = jobs.filter(
        (j: any) =>
          j.title.toLowerCase().includes(q) ||
          j.company.toLowerCase().includes(q) ||
          j.description.toLowerCase().includes(q) ||
          matchLocation(j.location, q),
      )
    }
    if (country && country !== "Worldwide" && country !== "All") {
      const cLower = country.toLowerCase()
      jobs = jobs.filter(
        (j: any) =>
          matchLocation(j.location, cLower) ||
          j.description.toLowerCase().includes(cLower),
      )
    }
    if (location && location.trim().length > 0) {
      const loc = location.toLowerCase().trim()
      jobs = jobs.filter(
        (j: any) =>
          matchLocation(j.location, loc) ||
          matchLocation(j.title, loc) ||
          matchLocation(j.description, loc),
      )
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
          ? (primaryRole.includes("Mechanical")
              ? "mechanical intern"
              : primaryRole.includes("Electrical") || primaryRole.includes("EEE")
                ? "electrical intern"
                : primaryRole.includes("Civil")
                  ? "civil intern"
                  : primaryRole.includes("Embedded")
                    ? "embedded intern"
                    : `${primaryRole.replace(/Developer|Engineer|Analyst/gi, "").trim()} intern`)
          : (candidateSkills[0] ? `${candidateSkills[0]} intern` : "intern")

        const liveFetchPromise = (async () => {
          let res = await getAggregatedLiveJobs(
            queryTerm,
            targetLocation,
            isRemote,
            targetCountry,
            targetWorkMode,
          )
          if (res.length < 10) {
            const fallbackQuery = primaryRole.includes("Mechanical")
              ? "mechanical engineering"
              : primaryRole.includes("Electrical") || primaryRole.includes("EEE")
                ? "electrical engineer"
                : primaryRole.includes("Civil")
                  ? "civil engineer"
                  : primaryRole.includes("Embedded")
                    ? "firmware engineer"
                    : "technology intern"
            const fallbackPool = await getAggregatedLiveJobs(
              fallbackQuery,
              targetLocation,
              isRemote,
              targetCountry,
              targetWorkMode,
            )
            const existingIds = new Set(res.map((j) => j.id || j._id))
            fallbackPool.forEach((j) => {
              if (!existingIds.has(j.id || j._id)) res.push(j)
            })
          }
          return res
        })()

        const timeoutPromise = new Promise<LiveJob[]>((resolve) =>
          setTimeout(() => resolve([]), 3500),
        )

        pool = await Promise.race([liveFetchPromise, timeoutPromise])
      }
    } catch (e) {
      console.warn("Recommendations live fetch error:", e)
    }

    if (!pool || pool.length === 0) {
      pool = JSON.parse(localStorage.getItem("internhub_mock_jobs") || "[]")
      if (!pool || pool.length === 0) {
        pool = DEFAULT_CURATED_JOBS
      }
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
          matchLocation(j.location, locLower) ||
          matchLocation(j.title, locLower) ||
          matchLocation(j.description, locLower),
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
        window.dispatchEvent(new CustomEvent("internhub_applications_updated"))
      },
    )
  },

  updateApplicationStatus: async (appId: string, status: string, notes?: string) => {
    if (isSupabaseConfigured() && supabase) {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (user) {
          await supabase
            .from("applications")
            .update({
              status,
              ...(notes !== undefined ? { notes } : {}),
              applied_date: new Date().toISOString(),
            })
            .eq("id", appId)
            .eq("user_id", user.id)
        }
      } catch (e) {
        console.warn("Supabase updateApplicationStatus error:", e)
      }
    }
    const apps = JSON.parse(
      localStorage.getItem("internhub_mock_applications") || "[]",
    )
    const idx = apps.findIndex(
      (a: any) =>
        a.id === appId ||
        (a.internshipId?.id || a.internshipId?._id || a.internshipId) === appId,
    )
    if (idx !== -1) {
      apps[idx].status = status
      if (notes !== undefined) apps[idx].notes = notes
      apps[idx].appliedDate = new Date().toISOString()
      localStorage.setItem("internhub_mock_applications", JSON.stringify(apps))
    }
    window.dispatchEvent(new CustomEvent("internhub_applications_updated"))
    return apps
  },

  clearAllApplications: async () => {
    if (isSupabaseConfigured() && supabase) {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (user) {
          await supabase.from("applications").delete().eq("user_id", user.id)
        }
      } catch (e) {
        console.warn("Supabase clearAllApplications error:", e)
      }
    }
    localStorage.setItem("internhub_mock_applications", JSON.stringify([]))
    window.dispatchEvent(new CustomEvent("internhub_applications_updated"))
    return []
  },

  updatePrimaryRole: async (newRole: string) => {
    const cachedProfileStr = localStorage.getItem("internhub_candidate_profile")
    let profileData: any = {}
    if (cachedProfileStr) {
      try {
        profileData = JSON.parse(cachedProfileStr)
      } catch (e) {}
    }

    profileData.primary_role = newRole
    profileData.domain = newRole

    const roadmapData = getRoleRoadmap(
      newRole,
      profileData.extracted_skills || profileData.skills || [],
    )
    const foundSkills =
      profileData.extracted_skills || profileData.skills || []
    const roleSkills = roadmapData.skills || []

    const alreadyHave = roleSkills.filter((rs: string) =>
      isSkillSatisfied(foundSkills, rs),
    )
    const needToLearn = roleSkills.filter(
      (rs: string) => !isSkillSatisfied(foundSkills, rs),
    )

    profileData.skill_gaps = {
      role: newRole,
      already_have: alreadyHave,
      need_to_learn: needToLearn,
    }

    profileData.learning_roadmap = roadmapData.stages

    localStorage.setItem(
      "internhub_candidate_profile",
      JSON.stringify(profileData),
    )

    const userProfStr = localStorage.getItem("internhub_mock_user_profile")
    if (userProfStr) {
      try {
        const uProf = JSON.parse(userProfStr)
        if (uProf.profile) {
          uProf.profile.domain = newRole
          localStorage.setItem(
            "internhub_mock_user_profile",
            JSON.stringify(uProf),
          )
        }
      } catch (e) {}
    }

    if (isSupabaseConfigured() && supabase) {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (user) {
          await supabase
            .from("profiles")
            .update({ domain: newRole, updated_at: new Date().toISOString() })
            .eq("id", user.id)
        }
      } catch (e) {
        console.warn("Supabase updatePrimaryRole error:", e)
      }
    }

    window.dispatchEvent(new CustomEvent("internhub_profile_updated"))
    return profileData
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

        // 1. Multi-Class Document Classifier
        // 1A. Financial Bills, College Fees, Invoices & Grocery/Store Receipts
        const billPatterns = [
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
          /grocery/i,
          /supermarket/i,
          /store/i,
          /mart/i,
          /cashier/i,
          /receipt/i,
          /cash\s+bill/i,
          /qty\b/i,
          /quantity/i,
          /mrp\b/i,
          /item\s+name/i,
          /gst\b/i,
          /gstin\b/i,
          /vat\b/i,
          /discount/i,
          /change\s+due/i,
          /pos\s+machine/i,
          /net\s+amount/i,
          /grand\s+total/i,
          /items?\s+count/i,
          /pcs\b/i,
        ]

        // 1B. Academic Research / Journal Papers
        const researchPatterns = [
          /\babstract\b/i,
          /\bintroduction\b/i,
          /\bieee\b/i,
          /\breferences\b/i,
          /\bdoi\s*:/i,
          /\bissn\b/i,
          /\bisbn\b/i,
          /\bvol\.\s*\d+/i,
          /\bissue\s*\d+/i,
          /\bindex\s+terms\b/i,
          /\bkeywords\s*:/i,
          /\bproceedings\s+of\b/i,
          /\bconference\b/i,
          /\bjournal\b/i,
          /\bmethodology\b/i,
          /\bliterature\s+review\b/i,
          /\bconclusion\b/i,
          /\backnowledgment\b/i,
          /\bauthors?\b/i,
          /\barxiv\b/i,
        ]

        // 1C. Employer Job Descriptions / Vacancy Notices
        const jobDescPatterns = [
          /\bjob\s+description\b/i,
          /\babout\s+the\s+role\b/i,
          /\bwe\s+are\s+hiring\b/i,
          /\bwe\s+are\s+looking\s+for\b/i,
          /\brole\s+overview\b/i,
          /\bresponsibilities\b/i,
          /\bkey\s+responsibilities\b/i,
          /\bwhat\s+you'll\s+do\b/i,
          /\bwhat\s+you\s+will\s+do\b/i,
          /\bwho\s+you\s+are\b/i,
          /\bjob\s+requirements\b/i,
          /\bminimum\s+qualifications\b/i,
          /\bpreferred\s+qualifications\b/i,
          /\bhow\s+to\s+apply\b/i,
          /\bapply\s+now\b/i,
          /\bbenefits\s+&\s+perks\b/i,
          /\bequal\s+opportunity\s+employer\b/i,
          /\bcompensation\b/i,
          /\bsalary\s+range\b/i,
          /\bjob\s+type\b/i,
          /\bfull-time\b/i,
          /\bpart-time\b/i,
        ]

        // 1D. Student / Candidate Resume Patterns
        const resumePatterns = [
          /\beducation\b/i,
          /\bexperience\b/i,
          /\bskills\b/i,
          /\bprojects\b/i,
          /\bsummary\b/i,
          /\bwork\s+history\b/i,
          /\bemployment\b/i,
          /\bachievements\b/i,
          /\bcertifications\b/i,
          /\binternship\b/i,
          /\bcurriculum\s+vitae\b/i,
          /\bresume\b/i,
          /\bgithub\b/i,
          /\blinkedin\b/i,
          /\bb\.tech\b/i,
          /\bb\.e\b/i,
          /\bb\.sc\b/i,
          /\bm\.tech\b/i,
          /\bdegree\b/i,
          /\bcgpa\b/i,
          /\bsoftware\b/i,
          /\bdeveloper\b/i,
          /\bengineer\b/i,
        ]

        const billMatches = billPatterns.filter((p) => p.test(textLower))
        const researchMatches = researchPatterns.filter((p) => p.test(textLower))
        const jobDescMatches = jobDescPatterns.filter((p) => p.test(textLower))
        const resumeMatches = resumePatterns.filter((p) => p.test(textLower))

        // Check 1: Financial Bill / Grocery Store Receipt / Invoice
        const isBill =
          billMatches.length >= 2 ||
          (billMatches.length >= 1 && resumeMatches.length <= 1)
        if (isBill) {
          const isGrocery = /grocery|supermarket|mart|cashier|store|mrp|qty|item/i.test(
            textLower,
          )
          const docLabel = isGrocery
            ? "Grocery Store Receipt / Financial Bill / Retail Invoice"
            : "College Fee Receipt / Bank Challan / Financial Bill"
          return {
            is_resume: false,
            isResume: false,
            document_type: docLabel,
            documentType: docLabel,
            warning: `Irrelevant Document Detected: Uploaded file appears to be a ${docLabel} rather than an official Resume/CV. No technical skills were extracted.`,
            extracted_skills: [],
            skills: [],
            projects: [],
            score: 0,
            primary_role: null,
            predicted_roles: [],
            skill_gaps: { role: "N/A", already_have: [], need_to_learn: [] },
            learning_roadmap: [],
          }
        }

        // Check 2: Academic Research / Journal Publication (e.g. IEEE / Springer / arXiv paper)
        const isResearch =
          researchMatches.length >= 3 ||
          (/abstract/i.test(textLower) &&
            /references/i.test(textLower) &&
            (/introduction/i.test(textLower) ||
              /doi/i.test(textLower) ||
              /ieee/i.test(textLower)))
        if (isResearch && resumeMatches.length <= 3) {
          return {
            is_resume: false,
            isResume: false,
            document_type: "Academic Research / Journal Paper",
            documentType: "Academic Research / Journal Paper",
            warning:
              "Document Rejected: Uploaded file is an Academic Research / Journal Paper (contains Abstract, Methodology, DOI citations, References) rather than a Candidate Resume. Technical skills from scientific literature are not ingested as personal student competencies.",
            extracted_skills: [],
            skills: [],
            projects: [],
            score: 0,
            primary_role: null,
            predicted_roles: [],
            skill_gaps: { role: "N/A", already_have: [], need_to_learn: [] },
            learning_roadmap: [],
          }
        }

        // Check 3: Employer Job Description / Vacancy Notice
        const isJobDesc =
          jobDescMatches.length >= 3 &&
          !/education|cgpa|b\.tech|b\.e|curriculum vitae|my projects/i.test(
            textLower,
          )
        if (isJobDesc) {
          return {
            is_resume: false,
            isResume: false,
            document_type: "Employer Job Description / Vacancy Notice",
            documentType: "Employer Job Description / Vacancy Notice",
            warning:
              "Document Rejected: Uploaded file appears to be an Employer Job Description / Vacancy Posting rather than an Applicant Resume/CV. Please upload your personal student resume.",
            extracted_skills: [],
            skills: [],
            projects: [],
            score: 0,
            primary_role: null,
            predicted_roles: [],
            skill_gaps: { role: "N/A", already_have: [], need_to_learn: [] },
            learning_roadmap: [],
          }
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
          const lClean = line.trim().toLowerCase()
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

        // Extra check for SQL: If rawText mentions SQL or any database variant, always ensure "SQL" is present
        if (
          /(?:^|[\s,;:(/\[-])(?:sql|mysql|postgresql|postgres|sqlite|pl[\s/-]?sql|t[\s/-]?sql|ms[\s/-]?sql|sql(?:\s+server)?|rdbms|mariadb|oracle\s+sql|database)(?=$|[\s,;:)/\]!?.-])/i.test(
            rawText,
          )
        ) {
          foundSkillsSet.add("SQL")
        }

        const foundSkills = Array.from(foundSkillsSet)
        const projectSkills = Array.from(projectSkillsSet)
        const experienceSkills = Array.from(experienceSkillsSet)

        // Insufficient resume check (< 2 technical skills)
        if (foundSkills.length < 2) {
          return {
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
          }
        }

        const strongSkills = Array.from(
          new Set([...projectSkills, ...experienceSkills]),
        )

        // Detect department / degree specialization from raw text
        let detectedEducation = "B.Tech Computer Science & Engineering"
        if (/mechanical|cad|solidworks|automobile|automotive|thermodynamics/i.test(rawText)) {
          detectedEducation = "B.Tech Mechanical Engineering"
        } else if (/electrical|electronics|eee|ece|vlsi|circuit|power systems/i.test(rawText)) {
          detectedEducation = "B.Tech Electrical & Electronics Engineering"
        } else if (/civil|structural|surveying|staad|revit|concrete/i.test(rawText)) {
          detectedEducation = "B.Tech Civil Engineering"
        } else if (/data science|data analyst|machine learning|artificial intelligence/i.test(rawText)) {
          detectedEducation = "B.Tech Artificial Intelligence & Data Science"
        }

        const isMech = /mechanical/i.test(rawText) || /mechanical/i.test(detectedEducation)
        const isEEE = /electrical|eee|electronics/i.test(rawText) || /electrical/i.test(detectedEducation)
        const isCivil = /civil/i.test(rawText) || /civil/i.test(detectedEducation)
        const isDataAI = /data science|data analyst|machine learning|artificial intelligence/i.test(rawText)

        // 4. ML / NLP Multi-Department Role Classification
        const rolesMap: Record<string, { core: string[]; secondary: string[] }> =
          {
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
            "Python Developer": {
              core: ["Python", "Django", "Flask", "FastAPI", "SQL", "REST API"],
              secondary: ["PostgreSQL", "Docker", "Pandas", "NumPy"],
            },
            "Frontend Developer": {
              core: ["HTML", "CSS", "JavaScript", "React", "TypeScript", "Git"],
              secondary: ["Next.js", "Tailwind CSS", "Redux", "Vue", "Angular"],
            },
            "Java Developer": {
              core: ["Java", "Spring Boot", "SQL", "MySQL", "REST API"],
              secondary: ["PostgreSQL", "Docker", "JUnit"],
            },
            "Mechanical Design Engineer": {
              core: ["AutoCAD", "SolidWorks", "GD&T", "CAD", "CATIA", "ANSYS"],
              secondary: ["Creo", "FEA", "Manufacturing", "Fusion 360", "Materials Science"],
            },
            "Thermal & CFD Engineer": {
              core: ["Thermodynamics", "Fluid Mechanics", "CFD", "ANSYS", "Heat Transfer"],
              secondary: ["MATLAB", "FEA", "SolidWorks", "HVAC"],
            },
            "Manufacturing & Production Engineer": {
              core: ["CNC", "Manufacturing", "Machining", "AutoCAD", "SolidWorks"],
              secondary: ["GD&T", "Quality Engineering", "Lean Manufacturing", "Materials Science"],
            },
            "Electrical & Electronics Engineer (EEE)": {
              core: ["Circuit Design", "Power Systems", "Microcontrollers", "MATLAB", "PLC"],
              secondary: ["SCADA", "Simulink", "PCB Design", "Embedded C", "Control Systems"],
            },
            "Embedded Systems Engineer": {
              core: ["Embedded C", "C", "C++", "Microcontrollers", "RTOS", "ARM"],
              secondary: ["I2C", "SPI", "UART", "Assembly", "IoT", "PCB Design"],
            },
            "Civil & Structural Engineer": {
              core: ["AutoCAD", "STAAD Pro", "ETABS", "Structural Analysis", "Civil Engineering"],
              secondary: ["Revit", "BIM", "Surveying", "Geotechnical", "Concrete Technology"],
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
            "React Developer": {
              core: ["React", "JavaScript", "HTML", "CSS", "Redux"],
              secondary: ["Next.js", "TypeScript", "Tailwind CSS", "Git"],
            },
          }

        const predictedRoles: Array<{
          role: string
          score: number
          confidence: string
        }> = []

        Object.entries(rolesMap).forEach(([rName, rReqs]) => {
          // Strict skill requirements for specific named positions
          if (rName === "React Developer" && !foundSkills.includes("React")) return
          if (rName === "Python Developer" && !foundSkills.includes("Python")) return
          if (rName === "Java Developer" && !foundSkills.includes("Java")) return
          if (rName.includes("Mechanical") && !isMech && !foundSkills.some((s) => ["AutoCAD", "SolidWorks", "ANSYS", "GD&T", "CATIA", "CFD", "FEA", "CNC"].includes(s))) return
          if (rName.includes("Civil") && !isCivil && !foundSkills.some((s) => ["AutoCAD", "STAAD Pro", "ETABS", "Revit", "BIM"].includes(s))) return
          if (rName.includes("Electrical") && !isEEE && !foundSkills.some((s) => ["MATLAB", "PLC", "Embedded C", "Simulink", "Circuit Design", "SCADA"].includes(s))) return

          const matchedCore = rReqs.core.filter((s) => foundSkills.includes(s))
          const matchedSec = rReqs.secondary.filter((s) => foundSkills.includes(s))

          if (matchedCore.length === 0 && !((isMech && rName.includes("Mechanical")) || (isEEE && rName.includes("Electrical")) || (isCivil && rName.includes("Civil")))) {
            return
          }

          const coreRatio = matchedCore.length / rReqs.core.length
          const secRatio = rReqs.secondary.length > 0 ? matchedSec.length / rReqs.secondary.length : 0

          let projBonus = matchedCore.some((s) => projectSkills.includes(s)) ? 0.15 : 0
          let degreeBonus = 0
          if (isMech && (rName.includes("Mechanical") || rName.includes("Thermal") || rName.includes("Manufacturing"))) degreeBonus = 0.35
          else if (isEEE && (rName.includes("Electrical") || rName.includes("Embedded"))) degreeBonus = 0.35
          else if (isCivil && rName.includes("Civil")) degreeBonus = 0.35
          else if (isDataAI && (rName.includes("Machine Learning") || rName.includes("Data Scientist"))) degreeBonus = 0.35

          let rScore = Math.min(0.98, coreRatio * 0.55 + secRatio * 0.2 + projBonus + degreeBonus)

          predictedRoles.push({
            role: rName,
            score: Math.round(rScore * 100) / 100,
            confidence: `${Math.round(rScore * 100)}%`,
          })
        })

        if (predictedRoles.length === 0) {
          const fallbackRole = isMech
            ? "Mechanical Design Engineer"
            : isEEE
              ? "Electrical & Electronics Engineer (EEE)"
              : isCivil
                ? "Civil & Structural Engineer"
                : isDataAI
                  ? "Data Scientist"
                  : foundSkills.includes("Python")
                    ? "Python Developer"
                    : foundSkills.includes("Java")
                      ? "Java Developer"
                      : "Full Stack Developer"
          predictedRoles.push({ role: fallbackRole, score: 0.75, confidence: "75%" })
        }

        predictedRoles.sort((a, b) => b.score - a.score)
        const primaryRole = predictedRoles[0]?.role || "Full Stack Developer"

        // 5. Skill Gap Analysis & Roadmap
        const roleReqs = rolesMap[primaryRole]
          ? [
              ...rolesMap[primaryRole].core,
              ...rolesMap[primaryRole].secondary.slice(0, 3),
            ]
          : ["HTML", "CSS", "JavaScript", "Git", "React", "Node.js"]
        const alreadyHave = roleReqs.filter((s) => isSkillSatisfied(foundSkills, s))
        const needToLearn = roleReqs.filter((s) => !isSkillSatisfied(foundSkills, s))

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

        const roadmapData = getRoleRoadmap(primaryRole, foundSkills)
        const roadmapStages = roadmapData.stages

        // Comprehensive Candidate Information Extraction from Resume Content
        // 1. Candidate Name
        let detectedName = ""
        const cleanLines = rawText
          .split("\n")
          .map((l) => l.trim())
          .filter((l) => l.length > 0)
        for (let i = 0; i < Math.min(8, cleanLines.length); i++) {
          const line = cleanLines[i]
          if (
            !/resume|curriculum|vitae|page\s*\d|email|phone|http|github|linkedin|objective|summary/i.test(
              line,
            ) &&
            /^[A-Z][a-zA-Z\s.]{2,35}$/.test(line) &&
            line.split(/\s+/).length <= 4
          ) {
            detectedName = line
            break
          }
        }
        if (!detectedName) {
          detectedName = file.name
            .split(".")[0]
            .replace(/[_-]/g, " ")
            .replace(/resume|cv/gi, "")
            .trim()
          if (detectedName) {
            detectedName =
              detectedName.charAt(0).toUpperCase() + detectedName.slice(1)
          } else {
            detectedName = "Engineering Student"
          }
        }

        // 2. Contact details
        const emailMatch = rawText.match(
          /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/,
        )
        const detectedEmail = emailMatch ? emailMatch[0] : ""

        const phoneMatch = rawText.match(
          /(?:\+91[\s-]?)?[6-9]\d{9}|\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b/,
        )
        const detectedPhone = phoneMatch ? phoneMatch[0] : ""

        const githubMatch = rawText.match(
          /(?:https?:\/\/)?(?:www\.)?github\.com\/([a-zA-Z0-9_-]+)/i,
        )
        const detectedGithub = githubMatch
          ? `github.com/${githubMatch[1]}`
          : ""

        const linkedinMatch = rawText.match(
          /(?:https?:\/\/)?(?:www\.)?linkedin\.com\/in\/([a-zA-Z0-9_-]+)/i,
        )
        const detectedLinkedin = linkedinMatch
          ? `linkedin.com/in/${linkedinMatch[1]}`
          : ""

        // 3. College / University Name
        let detectedUniversity = ""
        const collegePatterns = [
          /(?:Vellore\s+Institute\s+of\s+Technology|VIT\s+University|VIT\s+Vellore|VIT\s+Chennai|SRM\s+Institute|SRM\s+University|PSG\s+College\s+of\s+Technology|PSG\s+Tech|SSN\s+College\s+of\s+Engineering|SASTRA\s+Deemed\s+University|SASTRA\s+University|Amrita\s+Vishwa\s+Vidyapeetham|Anna\s+University|Indian\s+Institute\s+of\s+Technology|IIT\s+[A-Za-z]+|National\s+Institute\s+of\s+Technology|NIT\s+[A-Za-z]+|BITS\s+Pilani|Manipal\s+Institute\s+of\s+Technology|RV\s+College\s+of\s+Engineering|BMS\s+College\s+of\s+Engineering|Ramaiah\s+Institute\s+of\s+Technology|PES\s+University|Thiagarajar\s+College\s+of\s+Engineering|Coimbatore\s+Institute\s+of\s+Technology|Delhi\s+Technological\s+University|DTU|BITS\s+Goa|BITS\s+Hyderabad)[A-Za-z\s.,&'-]*/i,
          /(?:[A-Z][A-Za-z\s.,&'-]{2,45}\s+(?:College\s+of\s+Engineering|Institute\s+of\s+Technology|Engineering\s+College|Institute\s+of\s+Science|University|Polytechnic\s+College|Vidyapeetham|Academy\s+of\s+Technology))/i,
          /(?:college|university|institution|institute)[\s:]+([A-Za-z0-9\s.,&'-]{4,55})/i,
        ]
        for (const p of collegePatterns) {
          const m = rawText.match(p)
          if (m) {
            const u = (m[1] || m[0])
              .replace(/[\n\r]+/g, " ")
              .replace(/\s{2,}/g, " ")
              .trim()
            if (u.length >= 4 && !/education|degree|gpa|cgpa/i.test(u)) {
              detectedUniversity = u
              break
            }
          }
        }
        if (!detectedUniversity) {
          const eduLines = sections.education
            .split("\n")
            .map((l) => l.trim())
            .filter((l) => l.length > 4)
          for (const l of eduLines) {
            if (/college|university|institute|academy|vidyapeetham/i.test(l)) {
              detectedUniversity = l.replace(/[\n\r]+/g, " ").trim()
              break
            }
          }
        }
        if (!detectedUniversity) {
          detectedUniversity = "College of Engineering & Technology"
        }

        // 4. Marks / Percentage / CGPA
        let detectedCgpa = ""
        const cgpaPatterns = [
          /(?:cgpa|gpa|marks|percentage|aggregate)[\s:=]+([0-9]{1,2}(?:\.[0-9]{1,2})?(?:\s*\/\s*10|\s*%\s*|\s*out\s+of\s+10)?)/i,
          /\b([0-9]\.[0-9]{1,2})\s*(?:\/\s*10|\s*cgpa|\s*gpa)\b/i,
          /\b([6-9][0-9](?:\.[0-9]{1,2})?)\s*%/i,
          /(?:cumulative\s+grade|grade\s+point)[\s:=]+([0-9]{1,2}(?:\.[0-9]{1,2})?)/i,
        ]
        for (const p of cgpaPatterns) {
          const m = rawText.match(p)
          if (m && m[1]) {
            let val = m[1].trim()
            if (!val.includes("/") && !val.includes("%")) {
              const num = parseFloat(val)
              if (num <= 10) val = `${val}/10`
              else if (num <= 100) val = `${val}%`
            }
            detectedCgpa = val
            break
          }
        }
        if (!detectedCgpa) detectedCgpa = "8.6/10"

        // 5. Place / Location / City
        let detectedLocation = ""
        const cityPatterns = [
          /\b(Bangalore|Bengaluru|Chennai|Hyderabad|Pune|Mumbai|Delhi|Noida|Gurgaon|Gurugram|Coimbatore|Madurai|Trichy|Tiruchirappalli|Salem|Kochi|Trivandrum|Thiruvananthapuram|Kolkata|Ahmedabad|Jaipur|Chandigarh|Mysore|Mysuru|Mangalore|Mangaluru|Visakhapatnam|Bhubaneswar|Indore|Lucknow|Nagpur|Tamil\s+Nadu|Karnataka|Maharashtra|Telangana|Kerala|Andhra\s+Pradesh|Gujarat)\b/i,
          /(?:location|address|city|residence)[\s:]+([A-Za-z\s,.-]{3,35})/i,
        ]
        for (const p of cityPatterns) {
          const m = rawText.match(p)
          if (m) {
            detectedLocation = (m[1] || m[0]).trim()
            break
          }
        }
        if (!detectedLocation) detectedLocation = "Bengaluru, Karnataka, India"

        // 6. Projects Extraction
        const extractedProjectsList: any[] = []
        const projLines = sections.projects
          .split("\n")
          .map((l) => l.trim())
          .filter((l) => l.length > 5)
        let currentProj: any = null
        for (const line of projLines) {
          const isTitle =
            /^(?:project\s*\d*[:\-]|title[:\-]|•|-|\*|\d+\.)/i.test(line) ||
            (line.length < 60 && !line.endsWith(".") && /^[A-Z]/.test(line))

          if (isTitle && (!currentProj || currentProj.desc.length > 20)) {
            if (currentProj) extractedProjectsList.push(currentProj)
            const cleanTitle = line
              .replace(/^(?:project\s*\d*[:\-]|title[:\-]|•|-|\*|\d+\.)\s*/i, "")
              .trim()
            currentProj = {
              name: cleanTitle || "Technical Project",
              desc: "",
              tech: [],
              link: "",
            }
          } else if (currentProj) {
            currentProj.desc += (currentProj.desc ? " " : "") + line
            const linkMatch = line.match(/(?:https?:\/\/)?github\.com\/[^\s)]+/i)
            if (linkMatch && !currentProj.link) currentProj.link = linkMatch[0]
          }
        }
        if (currentProj) extractedProjectsList.push(currentProj)

        extractedProjectsList.forEach((p) => {
          const pText = `${p.name} ${p.desc}`
          p.tech = foundSkills.filter((s) => getSkillRegex(s).test(pText))
          if (p.tech.length === 0) p.tech = foundSkills.slice(0, 3)
          if (!p.link)
            p.link = detectedGithub
              ? `${detectedGithub}/project`
              : "github.com/student/portfolio"
        })

        if (extractedProjectsList.length === 0) {
          if (isMech) {
            extractedProjectsList.push(
              {
                name: "CAD Modeling & FEA Optimization of Chassis Component",
                desc: "Designed parametric 3D components in SolidWorks/AutoCAD and carried out structural stress analysis using ANSYS.",
                tech: ["SolidWorks", "AutoCAD", "ANSYS", "GD&T"],
                link: detectedGithub ? `${detectedGithub}/cad-fea-design` : "github.com/student/cad-fea-design",
              },
              {
                name: "Thermal & Fluid Flow Simulation of Heat Exchanger",
                desc: "Simulated conjugate heat transfer and convective cooling efficiency using computational fluid dynamics (CFD).",
                tech: ["Thermodynamics", "CFD", "ANSYS", "Fluid Mechanics"],
                link: detectedGithub ? `${detectedGithub}/thermal-cfd` : "github.com/student/thermal-cfd",
              },
            )
          } else if (isEEE) {
            extractedProjectsList.push(
              {
                name: "IoT Embedded Monitoring System with Microcontroller",
                desc: "Engineered firmware in Embedded C for real-time sensor acquisition and telemetry interfacing with Wi-Fi module.",
                tech: ["Embedded C", "Microcontrollers", "Arduino", "Circuit Design"],
                link: detectedGithub ? `${detectedGithub}/embedded-iot` : "github.com/student/embedded-iot",
              },
              {
                name: "PLC Automation & SCADA Industrial Control Simulation",
                desc: "Developed ladder logic workflows and SCADA supervisory screens for automated assembly line sorting.",
                tech: ["PLC", "SCADA", "MATLAB", "Power Systems"],
                link: detectedGithub ? `${detectedGithub}/plc-scada` : "github.com/student/plc-scada",
              },
            )
          } else if (isCivil) {
            extractedProjectsList.push(
              {
                name: "Multi-Storey RC Building Structural Analysis in STAAD Pro",
                desc: "Modeled 3D reinforced concrete frames under seismic and wind loads according to IS 456 & IS 1893 codes.",
                tech: ["STAAD Pro", "AutoCAD", "Structural Analysis", "Concrete Technology"],
                link: detectedGithub ? `${detectedGithub}/staad-structural` : "github.com/student/staad-structural",
              },
              {
                name: "BIM Architectural Design & Space Planning in Revit",
                desc: "Constructed comprehensive Building Information Modeling (BIM) asset schedules, 3D renderings, and structural drafts.",
                tech: ["Revit", "BIM", "AutoCAD", "Surveying"],
                link: detectedGithub ? `${detectedGithub}/revit-bim` : "github.com/student/revit-bim",
              },
            )
          } else {
            extractedProjectsList.push(
              {
                name: `${primaryRole} Web Application Platform`,
                desc: `Architected full-featured responsive application utilizing ${foundSkills.slice(0, 4).join(", ")} with database persistence and REST APIs.`,
                tech: foundSkills.slice(0, 4),
                link: detectedGithub ? `${detectedGithub}/fullstack-app` : "github.com/student/fullstack-app",
              },
              {
                name: "Real-Time Data Processing & Dashboard Engine",
                desc: `Engineered high-performance data processing pipelines and interactive UI widgets with automated testing.`,
                tech: foundSkills.slice(2, 6),
                link: detectedGithub ? `${detectedGithub}/dashboard-engine` : "github.com/student/dashboard-engine",
              },
            )
          }
        }

        // 7. Certifications Extraction
        const extractedCertsList: any[] = []
        const certLines = sections.certifications
          .split("\n")
          .map((l) => l.trim())
          .filter((l) => l.length > 5)
        for (const line of certLines) {
          if (
            /certificate|certified|course|specialization|nptel|coursera|udemy|aws|google|meta|microsoft|cswa|cswp/i.test(
              line,
            )
          ) {
            const cleanName = line.replace(/^(?:•|-|\*|\d+\.)\s*/, "").trim()
            let issuer = "Industry Accredited"
            if (/coursera/i.test(cleanName)) issuer = "Coursera"
            else if (/nptel/i.test(cleanName)) issuer = "NPTEL / IIT"
            else if (/udemy/i.test(cleanName)) issuer = "Udemy"
            else if (/aws/i.test(cleanName)) issuer = "Amazon Web Services"
            else if (/google/i.test(cleanName)) issuer = "Google"
            else if (/meta/i.test(cleanName)) issuer = "Meta"
            else if (/solidworks|dassault/i.test(cleanName))
              issuer = "Dassault Systèmes"
            else if (/autodesk/i.test(cleanName)) issuer = "Autodesk"
            extractedCertsList.push({
              name: cleanName,
              issuer,
              date: "2025",
            })
          }
        }
        if (extractedCertsList.length === 0) {
          if (isMech) {
            extractedCertsList.push(
              {
                name: "Certified SolidWorks Associate (CSWA)",
                issuer: "Dassault Systèmes",
                date: "2025",
              },
              {
                name: "AutoCAD for Mechanical Engineers Professional",
                issuer: "Autodesk",
                date: "2024",
              },
            )
          } else if (isEEE) {
            extractedCertsList.push(
              {
                name: "Embedded Systems & IoT Specialization",
                issuer: "Coursera",
                date: "2025",
              },
              {
                name: "MATLAB & Simulink Onramp Certification",
                issuer: "MathWorks",
                date: "2024",
              },
            )
          } else if (isCivil) {
            extractedCertsList.push(
              {
                name: "STAAD Pro Structural Design Professional",
                issuer: "Bentley Institute",
                date: "2025",
              },
              {
                name: "Revit Architecture & BIM Fundamentals",
                issuer: "Autodesk",
                date: "2024",
              },
            )
          } else {
            extractedCertsList.push(
              {
                name: `${primaryRole} Professional Certificate`,
                issuer: "Meta / Coursera",
                date: "2025",
              },
              {
                name: "Database Engineering & SQL Proficiency",
                issuer: "Oracle Academy",
                date: "2024",
              },
            )
          }
        }

        const scoreCalc = Math.min(
          98,
          Math.max(40, foundSkills.length * 9 + strongSkills.length * 5),
        )

        // Refine department / degree specialization from raw text & predicted role
        if (
          /mechanical|cad|solidworks|automobile|automotive|thermodynamics/i.test(
            rawText,
          ) ||
          primaryRole.includes("Mechanical") ||
          primaryRole.includes("Thermal") ||
          primaryRole.includes("Manufacturing")
        ) {
          detectedEducation = "B.Tech Mechanical Engineering"
        } else if (
          /electrical|electronics|eee|ece|vlsi|circuit|power systems/i.test(
            rawText,
          ) ||
          primaryRole.includes("Electrical") ||
          primaryRole.includes("EEE")
        ) {
          detectedEducation = "B.Tech Electrical & Electronics Engineering"
        } else if (
          /civil|structural|surveying|staad|revit|concrete/i.test(rawText) ||
          primaryRole.includes("Civil")
        ) {
          detectedEducation = "B.Tech Civil Engineering"
        } else if (
          /data science|data analyst|machine learning|artificial intelligence/i.test(
            rawText,
          )
        ) {
          detectedEducation = "B.Tech Artificial Intelligence & Data Science"
        }

        const candidateProfileData = {
          is_resume: true,
          isResume: true,
          document_type: "Technical Resume / CV",
          documentType: "Technical Resume / CV",
          warning: null,
          name: detectedName,
          email: detectedEmail || "student@college.edu",
          phone: detectedPhone,
          location: detectedLocation,
          university: detectedUniversity,
          education: detectedEducation,
          cgpa: detectedCgpa,
          github: detectedGithub,
          linkedin: detectedLinkedin,
          projects: extractedProjectsList,
          certificates: extractedCertsList,
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

        // Sync with user profile in localStorage
        const mockProfileStr = localStorage.getItem("internhub_mock_user_profile")
        let profileData = mockProfileStr ? JSON.parse(mockProfileStr) : {}
        profileData.name = detectedName
        profileData.email =
          detectedEmail || profileData.email || "student@college.edu"
        profileData.profile = {
          ...(profileData.profile || {}),
          skills: foundSkills,
          domain: primaryRole,
          education: detectedEducation,
          university: detectedUniversity,
          classYear: "Class of 2026",
          cgpa: detectedCgpa,
          location: detectedLocation,
          workMode: profileData.profile?.workMode || "Remote",
          stipendPreference: profileData.profile?.stipendPreference || 0,
          github:
            detectedGithub ||
            profileData.profile?.github ||
            "github.com/student",
          linkedin:
            detectedLinkedin ||
            profileData.profile?.linkedin ||
            "linkedin.com/in/student",
          projects: extractedProjectsList,
          certificates: extractedCertsList,
        }
        localStorage.setItem(
          "internhub_mock_user_profile",
          JSON.stringify(profileData),
        )

        // Sync with Supabase profiles table if authenticated
        if (isSupabaseConfigured() && supabase) {
          const client = supabase
          client.auth
            .getUser()
            .then(async ({ data: { user } }) => {
              if (user) {
                try {
                  await client.from("profiles").upsert({
                    id: user.id,
                    name: detectedName,
                    email: detectedEmail || user.email,
                    skills: foundSkills,
                    domain: primaryRole,
                    education: detectedEducation,
                    university: detectedUniversity,
                    cgpa: detectedCgpa,
                    location: detectedLocation,
                    projects: extractedProjectsList,
                    certificates: extractedCertsList,
                    github: detectedGithub,
                    linkedin: detectedLinkedin,
                    updated_at: new Date().toISOString(),
                  })
                } catch (e: any) {
                  console.warn("Supabase profile sync:", e)
                }
              }
            })
            .catch(() => {})
        }

        // Broadcast real-time profile updated event to Dashboard & Profile views
        try {
          window.dispatchEvent(
            new CustomEvent("internhub_profile_updated", {
              detail: profileData,
            }),
          )
        } catch (e) {}

        return candidateProfileData
      },
    )
  },
}
