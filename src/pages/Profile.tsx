import { useState, useEffect } from "react"
import {
  CheckIcon,
  SparklesIcon,
  FileTextIcon,
  AwardIcon,
  GithubIcon,
  LinkedinIcon,
  MailIcon,
  MapPinIcon,
  BookOpenIcon,
  TrashIcon,
  PlusIcon,
} from "../components/Icons"
import { api } from "../api"

// Simple edit icon inline
const EditIcon2 = ({ size = 16, ...props }: any) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.75}
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
)

export default function Profile() {
  const [loading, setLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [activeTab, setActiveTab] =
    useState<"overview" | "skills" | "projects" | "certificates">("overview")

  // Profile data states
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [skills, setSkills] = useState<string[]>([])
  const [interests, setInterests] = useState<string[]>([])
  const [domain, setDomain] = useState("")
  const [stipendPreference, setStipendPreference] = useState(0)
  const [workMode, setWorkMode] = useState("Remote")
  const [location, setLocation] = useState("")
  const [university, setUniversity] = useState("")
  const [education, setEducation] = useState("")
  const [classYear, setClassYear] = useState("")
  const [cgpa, setCgpa] = useState("")
  const [github, setGithub] = useState("")
  const [linkedin, setLinkedin] = useState("")
  const [projects, setProjects] = useState<any[]>([])
  const [certificates, setCertificates] = useState<any[]>([])

  // State for adding new items
  const [newSkill, setNewSkill] = useState("")
  const [newInterest, setNewInterest] = useState("")
  const [projectForm, setProjectForm] = useState({
    name: "",
    tech: "",
    desc: "",
    link: "",
  })
  const [certForm, setCertForm] = useState({ name: "", issuer: "", date: "" })

  const fetchProfile = async () => {
    try {
      setLoading(true)
      const data = await api.getProfile()
      setName(data.name || "")
      setEmail(data.email || "")

      const p = data.profile || {}
      setSkills(p.skills || [])
      setInterests(p.interests || [])
      setDomain(p.domain || "Software Engineering")
      setStipendPreference(p.stipendPreference || 0)
      setWorkMode(p.workMode || "Remote")
      setLocation(p.location || "")
      setUniversity(p.university || "")
      setEducation(p.education || "")
      setClassYear(p.classYear || "")
      setCgpa(p.cgpa || "")
      setGithub(p.github || "")
      setLinkedin(p.linkedin || "")
      setProjects(p.projects || [])
      setCertificates(p.certificates || [])
    } catch (err) {
      console.error("Failed to load profile data:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProfile()
    const handleUpdate = () => fetchProfile()
    window.addEventListener("internhub_profile_updated", handleUpdate)
    return () => window.removeEventListener("internhub_profile_updated", handleUpdate)
  }, [])

  const saveAllData = async (overrides?: any) => {
    try {
      const payload = {
        name: overrides?.name !== undefined ? overrides.name : name,
        email: overrides?.email !== undefined ? overrides.email : email,
        profile: {
          skills: overrides?.skills || skills,
          interests: overrides?.interests || interests,
          domain: overrides?.domain || domain,
          stipendPreference:
            overrides?.stipendPreference !== undefined
              ? overrides.stipendPreference
              : stipendPreference,
          workMode: overrides?.workMode || workMode,
          location:
            overrides?.location !== undefined ? overrides.location : location,
          university:
            overrides?.university !== undefined
              ? overrides.university
              : university,
          education:
            overrides?.education !== undefined
              ? overrides.education
              : education,
          classYear:
            overrides?.classYear !== undefined
              ? overrides.classYear
              : classYear,
          cgpa: overrides?.cgpa !== undefined ? overrides.cgpa : cgpa,
          github: overrides?.github !== undefined ? overrides.github : github,
          linkedin:
            overrides?.linkedin !== undefined ? overrides.linkedin : linkedin,
          projects: overrides?.projects || projects,
          certificates: overrides?.certificates || certificates,
        },
      }
      await api.updateProfile(payload)
    } catch (err) {
      console.error("Failed to update profile:", err)
    }
  }

  const handleSaveProfile = async () => {
    await saveAllData()
    setIsEditing(false)
    fetchProfile()
  }

  // Helper handlers for lists with auto-persistence
  const addSkill = () => {
    if (newSkill.trim() && !skills.includes(newSkill.trim())) {
      const next = [...skills, newSkill.trim()]
      setSkills(next)
      setNewSkill("")
      saveAllData({ skills: next })
    }
  }
  const removeSkill = (sk: string) => {
    const next = skills.filter((s) => s !== sk)
    setSkills(next)
    saveAllData({ skills: next })
  }

  const addInterest = () => {
    if (newInterest.trim() && !interests.includes(newInterest.trim())) {
      const next = [...interests, newInterest.trim()]
      setInterests(next)
      setNewInterest("")
      saveAllData({ interests: next })
    }
  }
  const removeInterest = (item: string) => {
    const next = interests.filter((i) => i !== item)
    setInterests(next)
    saveAllData({ interests: next })
  }

  const addProject = () => {
    if (projectForm.name.trim() && projectForm.desc.trim()) {
      const parsedTech = projectForm.tech
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean)
      const next = [
        ...projects,
        {
          name: projectForm.name.trim(),
          tech: parsedTech,
          desc: projectForm.desc.trim(),
          link: projectForm.link.trim(),
        },
      ]
      setProjects(next)
      setProjectForm({ name: "", tech: "", desc: "", link: "" })
      saveAllData({ projects: next })
    }
  }
  const removeProject = (idx: number) => {
    const next = projects.filter((_, i) => i !== idx)
    setProjects(next)
    saveAllData({ projects: next })
  }

  const addCertificate = () => {
    if (certForm.name.trim() && certForm.issuer.trim()) {
      const colors = ["bg-orange-500", "bg-blue-500", "bg-sky-500", "bg-teal-500", "bg-purple-500"]
      const randomColor = colors[Math.floor(Math.random() * colors.length)]
      const next = [
        ...certificates,
        {
          name: certForm.name.trim(),
          issuer: certForm.issuer.trim(),
          date: certForm.date.trim() || "2026",
          colorClass: randomColor,
        },
      ]
      setCertificates(next)
      setCertForm({ name: "", issuer: "", date: "" })
      saveAllData({ certificates: next })
    }
  }
  const removeCertificate = (idx: number) => {
    const next = certificates.filter((_, i) => i !== idx)
    setCertificates(next)
    saveAllData({ certificates: next })
  }

  // Calculate Profile completion status dynamically
  const completionItems = [
    { label: "Profile Name Set", done: !!name },
    { label: "GitHub Link Added", done: !!github },
    { label: "University Configured", done: !!university },
    { label: "Degree Filled", done: !!education },
    { label: "Skills Registered", done: skills.length > 0 },
    { label: "Projects Highlighted", done: projects.length > 0 },
    { label: "Certificates Displayed", done: certificates.length > 0 },
    { label: "Domain Preference Picked", done: !!domain },
  ]
  const completion = Math.round(
    (completionItems.filter((i) => i.done).length / completionItems.length) *
      100,
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[80vh]">
        <span className="w-9 h-9 border-4 border-slate-200 border-t-indigo-600 rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto w-full font-sans">
      {/* Profile hero */}
      <div className="bg-white border border-slate-200 rounded-3xl p-8 mb-6 relative overflow-hidden shadow-sm">
        <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-br from-indigo-50 to-emerald-50" />

        {isEditing ? (
          // Editing Hero Mode
          <div className="relative mt-12">
            <h2 className="text-xl font-bold text-slate-900 mb-6">
              Edit Core Profile Details
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
              <div>
                <label className="text-xs font-bold text-slate-500 block mb-1.5 uppercase tracking-wide">
                  FULL NAME
                </label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Alex Morgan"
                  className="w-full bg-white border border-slate-200 px-4 py-2.5 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all shadow-sm"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 block mb-1.5 uppercase tracking-wide">
                  DEGREE & DEPARTMENT
                </label>
                <input
                  value={education}
                  onChange={(e) => setEducation(e.target.value)}
                  placeholder="e.g. B.Tech Computer Science"
                  className="w-full bg-white border border-slate-200 px-4 py-2.5 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all shadow-sm"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 block mb-1.5 uppercase tracking-wide">
                  UNIVERSITY / COLLEGE
                </label>
                <input
                  value={university}
                  onChange={(e) => setUniversity(e.target.value)}
                  placeholder="e.g. Institute of Technology"
                  className="w-full bg-white border border-slate-200 px-4 py-2.5 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all shadow-sm"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 block mb-1.5 uppercase tracking-wide">
                  GRADUATION CLASS YEAR
                </label>
                <input
                  value={classYear}
                  onChange={(e) => setClassYear(e.target.value)}
                  placeholder="e.g. Class of 2026"
                  className="w-full bg-white border border-slate-200 px-4 py-2.5 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all shadow-sm"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 block mb-1.5 uppercase tracking-wide">
                  CGPA / SCORE
                </label>
                <input
                  value={cgpa}
                  onChange={(e) => setCgpa(e.target.value)}
                  placeholder="e.g. 8.7/10"
                  className="w-full bg-white border border-slate-200 px-4 py-2.5 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all shadow-sm"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 block mb-1.5 uppercase tracking-wide">
                  LOCATION
                </label>
                <input
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Bengaluru, Karnataka"
                  className="w-full bg-white border border-slate-200 px-4 py-2.5 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all shadow-sm"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 block mb-1.5 uppercase tracking-wide">
                  GITHUB LINK
                </label>
                <input
                  value={github}
                  onChange={(e) => setGithub(e.target.value)}
                  placeholder="e.g. github.com/username"
                  className="w-full bg-white border border-slate-200 px-4 py-2.5 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all shadow-sm"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 block mb-1.5 uppercase tracking-wide">
                  LINKEDIN LINK
                </label>
                <input
                  value={linkedin}
                  onChange={(e) => setLinkedin(e.target.value)}
                  placeholder="e.g. linkedin.com/in/username"
                  className="w-full bg-white border border-slate-200 px-4 py-2.5 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all shadow-sm"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-4">
              <button
                onClick={() => setIsEditing(false)}
                className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-5 py-2.5 rounded-xl text-sm font-semibold shadow-sm transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveProfile}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold shadow-sm transition-colors"
              >
                Save Changes
              </button>
            </div>
          </div>
        ) : (
          // View Hero Mode
          <>
            <div className="relative flex items-end gap-6 mb-8 mt-12">
              <div className="w-24 h-24 rounded-2xl bg-indigo-600 flex items-center justify-center text-4xl font-bold text-white border-4 border-white shadow-sm shrink-0">
                {name ? name.charAt(0).toUpperCase() : "U"}
              </div>
              <div className="pb-1 flex-1">
                <h1 className="text-2xl font-bold tracking-tight text-slate-900 mb-1">
                  {name || "Registered Candidate"}
                </h1>
                <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-slate-500">
                  {education || university ? (
                    <span className="font-medium">
                      {education} {university && `· ${university}`}
                    </span>
                  ) : (
                    <span className="italic">
                      Please complete your profile or upload a resume
                    </span>
                  )}
                  {location && (
                    <span className="flex items-center gap-1.5 font-medium">
                      <MapPinIcon size={14} /> {location}
                    </span>
                  )}
                  {classYear && <span className="font-medium">{classYear}</span>}
                </div>
              </div>
              <button
                onClick={() => setIsEditing(true)}
                className="bg-white border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50 text-slate-600 hover:text-indigo-700 px-4 py-2 rounded-xl text-sm font-semibold shadow-sm transition-colors flex items-center gap-2 self-center shrink-0"
              >
                <EditIcon2 size={16} /> Edit Profile
              </button>
            </div>

            {/* Links + completion */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div className="flex flex-wrap gap-3">
                {[
                  {
                    icon: GithubIcon,
                    label: github || "Add Github link",
                    value: github,
                    colorClass: "text-slate-700",
                    hoverClass: "hover:border-slate-400 hover:text-slate-900"
                  },
                  {
                    icon: LinkedinIcon,
                    label: linkedin || "Add Linkedin link",
                    value: linkedin,
                    colorClass: "text-blue-600",
                    hoverClass: "hover:border-blue-400 hover:text-blue-700"
                  },
                  {
                    icon: MailIcon,
                    label: email || "Add email contact",
                    value: email,
                    colorClass: "text-emerald-600",
                    hoverClass: "hover:border-emerald-400 hover:text-emerald-700"
                  },
                ].map(({ icon: Icon, label, value, colorClass, hoverClass }) => (
                  <div
                    key={label}
                    className={`flex items-center gap-2 px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold cursor-pointer transition-colors shadow-sm ${hoverClass} ${value ? 'text-slate-800' : 'text-slate-400'}`}
                    onClick={() => {
                      if (!value) setIsEditing(true)
                    }}
                  >
                    <Icon size={14} className={colorClass} />
                    {label}
                  </div>
                ))}
              </div>

              {/* Completion */}
              <div className="flex items-center gap-3 shrink-0">
                <div className="text-sm font-semibold text-slate-500">
                  Profile {completion}% complete
                </div>
                <div className="w-32 h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                  <div
                    className="h-full bg-gradient-to-r from-indigo-500 to-emerald-400 rounded-full transition-all duration-1000 ease-out"
                    style={{ width: `${completion}%` }}
                  />
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {/* Tabs */}
          <div className="flex gap-2 bg-slate-100 p-1.5 rounded-2xl border border-slate-200 overflow-x-auto hide-scrollbar">
            {(["overview", "skills", "projects", "certificates"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setActiveTab(t)}
                className={`flex-1 min-w-[100px] px-4 py-2.5 rounded-xl text-sm font-semibold capitalize transition-colors ${
                  activeTab === t
                    ? "bg-white text-indigo-600 shadow-sm"
                    : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          {activeTab === "overview" && (
            <div className="flex flex-col gap-6">
              {/* Education */}
              <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
                <h3 className="text-base font-bold text-slate-900 mb-5 flex items-center gap-2">
                  <BookOpenIcon size={18} className="text-indigo-600" />
                  Education
                </h3>
                {university ? (
                  <div className="flex gap-4 items-start">
                    <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center shrink-0 text-lg font-bold text-indigo-600">
                      {university.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="text-[15px] font-bold text-slate-900 mb-0.5">
                        {education || "B.Tech / Undergraduate"}
                      </div>
                      <div className="text-sm font-medium text-slate-600 mb-1">
                        {university}
                      </div>
                      <div className="text-xs font-medium text-slate-400">
                        {classYear || "Class of 2026"} {cgpa && `· CGPA: ${cgpa}`}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-sm font-medium text-slate-500 italic text-center py-4">
                    No education details added. Click "Edit Profile" to set yours.
                  </div>
                )}
              </div>

              {/* Career interests */}
              <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
                <h3 className="text-base font-bold text-slate-900 mb-5 flex items-center gap-2">
                  <SparklesIcon size={18} className="text-emerald-500" />
                  Career Interests
                </h3>
                <div className="flex flex-wrap gap-2.5 mb-5">
                  {interests.map((i) => (
                    <span
                      key={i}
                      className="px-3 py-1.5 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-xl text-xs font-bold flex items-center gap-1.5 group"
                    >
                      {i}
                      <TrashIcon
                        size={12}
                        className="text-indigo-300 group-hover:text-rose-500 cursor-pointer transition-colors"
                        onClick={() => removeInterest(i)}
                      />
                    </span>
                  ))}
                  {interests.length === 0 && (
                    <div className="text-sm font-medium text-slate-500 italic w-full">
                      No career interests added yet.
                    </div>
                  )}
                </div>
                <div className="flex gap-3">
                  <input
                    value={newInterest}
                    onChange={(e) => setNewInterest(e.target.value)}
                    placeholder="e.g. Frontend Engineering"
                    className="flex-1 bg-slate-50 border border-slate-200 px-4 py-2 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                  />
                  <button
                    onClick={addInterest}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-sm font-semibold shadow-sm transition-colors flex items-center gap-1.5 shrink-0"
                  >
                    <PlusIcon size={14} /> Add
                  </button>
                </div>
              </div>

              {/* Preferred roles */}
              <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
                <h3 className="text-base font-bold text-slate-900 mb-5">
                  Preferred Roles & Locations
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <div className="text-xs font-bold text-slate-400 mb-3 uppercase tracking-wider">
                      Roles
                    </div>
                    <div className="space-y-2">
                      <div className="text-sm text-slate-600">
                        Domain Focus: <strong className="text-slate-900">{domain || "Not Selected"}</strong>
                      </div>
                      <div className="text-sm text-slate-600">
                        Stipend Minimum:{" "}
                        <strong className="text-slate-900">
                          {stipendPreference > 0
                            ? `₹${stipendPreference.toLocaleString()}/mo`
                            : "No preference"}
                        </strong>
                      </div>
                    </div>
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-400 mb-3 uppercase tracking-wider">
                      Locations & Mode
                    </div>
                    <div className="space-y-2">
                      <div className="text-sm text-slate-600">
                        Work Mode: <strong className="text-slate-900">{workMode}</strong>
                      </div>
                      {location && (
                        <div className="text-sm text-slate-600">
                          Local Location: <strong className="text-slate-900">{location}</strong>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "skills" && (
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
              <h3 className="text-base font-bold text-slate-900 mb-5">
                Technical Skills
              </h3>
              <div className="flex flex-wrap gap-2.5 mb-6">
                {skills.map((name) => (
                  <span
                    key={name}
                    className="px-3 py-1.5 bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold flex items-center gap-1.5 group hover:border-slate-300 transition-colors"
                  >
                    {name}
                    <TrashIcon
                      size={12}
                      className="text-slate-300 group-hover:text-rose-500 cursor-pointer transition-colors"
                      onClick={() => removeSkill(name)}
                    />
                  </span>
                ))}
                {skills.length === 0 && (
                  <div className="text-sm font-medium text-slate-500 italic w-full py-2">
                    No technical skills added yet. Upload a resume to automatically extract skills or type to add below.
                  </div>
                )}
              </div>
              <div className="flex gap-3">
                <input
                  value={newSkill}
                  onChange={(e) => setNewSkill(e.target.value)}
                  placeholder="e.g. React, Docker, Python"
                  className="flex-1 bg-slate-50 border border-slate-200 px-4 py-2 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                />
                <button
                  onClick={addSkill}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-sm font-semibold shadow-sm transition-colors flex items-center gap-1.5 shrink-0"
                >
                  <PlusIcon size={14} /> Add Skill
                </button>
              </div>
            </div>
          )}

          {activeTab === "projects" && (
            <div className="flex flex-col gap-6">
              {projects.map((proj, idx) => (
                <div key={idx} className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm relative group">
                  <button
                    onClick={() => removeProject(idx)}
                    className="absolute top-6 right-6 text-slate-300 hover:text-rose-500 transition-colors"
                  >
                    <TrashIcon size={16} />
                  </button>
                  <div className="text-lg font-bold text-slate-900 mb-2 pr-8">
                    {proj.name}
                  </div>
                  <div className="text-sm font-medium text-slate-600 leading-relaxed mb-4">
                    {proj.desc}
                  </div>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {proj.tech?.map((t: string) => (
                      <span key={t} className="px-2.5 py-1 bg-slate-100 text-slate-600 border border-slate-200 rounded-lg text-xs font-semibold">
                        {t}
                      </span>
                    ))}
                  </div>
                  {proj.link && (
                    <div className="text-xs font-bold text-indigo-600 hover:text-indigo-700 truncate">
                      {proj.link} →
                    </div>
                  )}
                </div>
              ))}

              {projects.length === 0 && (
                <div className="bg-slate-50 border border-slate-200 rounded-3xl p-8 text-center text-slate-500 text-sm font-medium italic">
                  No projects highlighted. Use the form below to showcase your portfolio.
                </div>
              )}

              {/* Add Project Form */}
              <div className="bg-slate-50 border border-slate-200 rounded-3xl p-6 shadow-inner">
                <h4 className="text-sm font-bold text-slate-900 mb-4">
                  + Add Project
                </h4>
                <div className="space-y-3">
                  <input
                    value={projectForm.name}
                    onChange={(e) => setProjectForm({ ...projectForm, name: e.target.value })}
                    placeholder="Project Title"
                    className="w-full bg-white border border-slate-200 px-4 py-2.5 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all shadow-sm"
                  />
                  <input
                    value={projectForm.desc}
                    onChange={(e) => setProjectForm({ ...projectForm, desc: e.target.value })}
                    placeholder="Brief description of project capabilities"
                    className="w-full bg-white border border-slate-200 px-4 py-2.5 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all shadow-sm"
                  />
                  <input
                    value={projectForm.tech}
                    onChange={(e) => setProjectForm({ ...projectForm, tech: e.target.value })}
                    placeholder="Technologies used (comma-separated, e.g. React, Node, SQL)"
                    className="w-full bg-white border border-slate-200 px-4 py-2.5 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all shadow-sm"
                  />
                  <input
                    value={projectForm.link}
                    onChange={(e) => setProjectForm({ ...projectForm, link: e.target.value })}
                    placeholder="Project URL (e.g. github.com/username/project)"
                    className="w-full bg-white border border-slate-200 px-4 py-2.5 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all shadow-sm"
                  />
                  <button
                    onClick={addProject}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold shadow-sm transition-colors mt-2"
                  >
                    Save Project
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === "certificates" && (
            <div className="flex flex-col gap-6">
              {certificates.map((cert, idx) => (
                <div key={idx} className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex items-center gap-5 relative group">
                  <button
                    onClick={() => removeCertificate(idx)}
                    className="absolute top-6 right-6 text-slate-300 hover:text-rose-500 transition-colors"
                  >
                    <TrashIcon size={16} />
                  </button>
                  <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center shrink-0">
                    <AwardIcon size={24} className="text-indigo-600" />
                  </div>
                  <div className="flex-1 pr-10">
                    <div className="text-[15px] font-bold text-slate-900 mb-1">
                      {cert.name}
                    </div>
                    <div className="text-sm font-medium text-slate-500">
                      {cert.issuer} · Issued {cert.date}
                    </div>
                  </div>
                  <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-[11px] font-bold flex items-center gap-1 uppercase tracking-wide mr-6 hidden md:flex">
                    <CheckIcon size={12} /> Verified
                  </span>
                </div>
              ))}

              {certificates.length === 0 && (
                <div className="bg-slate-50 border border-slate-200 rounded-3xl p-8 text-center text-slate-500 text-sm font-medium italic">
                  No verified certificates listed. Add your achievements below.
                </div>
              )}

              {/* Add Certificate Form */}
              <div className="bg-slate-50 border border-slate-200 rounded-3xl p-6 shadow-inner">
                <h4 className="text-sm font-bold text-slate-900 mb-4">
                  + Add Certificate
                </h4>
                <div className="space-y-3">
                  <input
                    value={certForm.name}
                    onChange={(e) => setCertForm({ ...certForm, name: e.target.value })}
                    placeholder="Certificate Name (e.g. AWS Cloud Practitioner)"
                    className="w-full bg-white border border-slate-200 px-4 py-2.5 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all shadow-sm"
                  />
                  <input
                    value={certForm.issuer}
                    onChange={(e) => setCertForm({ ...certForm, issuer: e.target.value })}
                    placeholder="Issuing Organization (e.g. Amazon Web Services)"
                    className="w-full bg-white border border-slate-200 px-4 py-2.5 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all shadow-sm"
                  />
                  <input
                    value={certForm.date}
                    onChange={(e) => setCertForm({ ...certForm, date: e.target.value })}
                    placeholder="Date Earned (e.g. May 2026)"
                    className="w-full bg-white border border-slate-200 px-4 py-2.5 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all shadow-sm"
                  />
                  <button
                    onClick={addCertificate}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold shadow-sm transition-colors mt-2"
                  >
                    Save Certificate
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right sidebar */}
        <div className="flex flex-col gap-6">
          {/* AI Score */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
            <div className="text-xs font-bold text-slate-400 mb-5 uppercase tracking-wider">
              AI Career Scores
            </div>
            <div className="space-y-5">
              {[
                {
                  label: "Resume Strength",
                  val: skills.length > 0 ? 82 : 0,
                  colorClass: "bg-blue-500",
                  textColor: "text-blue-600",
                },
                {
                  label: "Skill Readiness",
                  val: skills.length > 0 ? Math.min(95, 40 + skills.length * 7) : 0,
                  colorClass: "bg-emerald-500",
                  textColor: "text-emerald-600",
                },
                {
                  label: "Profile Completeness",
                  val: completion,
                  colorClass: "bg-indigo-500",
                  textColor: "text-indigo-600",
                },
                {
                  label: "Job Readiness",
                  val: skills.length > 0 && projects.length > 0 ? 85 : 15,
                  colorClass: "bg-amber-500",
                  textColor: "text-amber-600",
                },
              ].map(({ label, val, colorClass, textColor }) => (
                <div key={label}>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-slate-600">
                      {label}
                    </span>
                    <span className={`text-sm font-bold ${textColor}`}>
                      {val}%
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${colorClass}`}
                      style={{ width: `${val}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Profile completeness */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
            <div className="text-xs font-bold text-slate-400 mb-5 uppercase tracking-wider">
              Complete Your Profile
            </div>
            <div className="space-y-3">
              {completionItems.map(({ label, done }) => (
                <div key={label} className="flex items-center gap-3">
                  <div className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 border transition-colors ${
                    done 
                      ? 'bg-emerald-50 border-emerald-200' 
                      : 'bg-slate-50 border-slate-200'
                  }`}>
                    {done && <CheckIcon size={12} className="text-emerald-500" />}
                  </div>
                  <span className={`text-sm font-medium ${
                    done ? 'text-slate-400 line-through' : 'text-slate-700'
                  }`}>
                    {label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
