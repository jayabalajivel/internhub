import {
  matchAndRankJobs,
  extractJobSkills,
  normalizeSkill,
  getSkillRegex,
  type CandidateProfileData,
  type LiveJob,
} from "../jobServices.ts"

let passedCount = 0
let failedCount = 0

function assert(condition: boolean, testName: string, detail: string = "") {
  if (condition) {
    console.log(`  [PASS] ${testName}`)
    passedCount++
  } else {
    console.error(`  [FAIL] ${testName} ${detail ? `-> ${detail}` : ""}`)
    failedCount++
  }
}

function createDummyJob(
  id: string,
  title: string,
  description: string,
  location: string = "Remote",
): LiveJob {
  return {
    id,
    _id: id,
    title,
    company: "Test Corp",
    location,
    stipend: "$30/hr",
    applyLink: "https://example.com/apply",
    description,
    companyWebsite: "testcorp.com",
    domainEmail: "careers@testcorp.com",
    source: "Test Source",
    verified: true,
    trustScore: 90,
    trustIndicators: {
      domainVerified: true,
      hasOfficialWebsite: true,
      descriptionQuality: "High",
      isSuspicious: false,
      warningReasons: [],
    },
  }
}

console.log("\n=======================================================")
console.log("INTERNHUB RECOMMENDATION & SCORING REGRESSION TEST SUITE")
console.log("=======================================================\n")

// -----------------------------------------------------------------------------
// Test Suite 1: Skill Normalization & Alias Handling
// -----------------------------------------------------------------------------
console.log("Suite 1: Skill Normalization & Canonical Aliases")
{
  assert(normalizeSkill("js") === "JavaScript", "Normalizes 'js' to 'JavaScript'")
  assert(normalizeSkill("javascript") === "JavaScript", "Normalizes 'javascript' to 'JavaScript'")
  assert(normalizeSkill("ts") === "TypeScript", "Normalizes 'ts' to 'TypeScript'")
  assert(normalizeSkill("reactjs") === "React", "Normalizes 'reactjs' to 'React'")
  assert(normalizeSkill("react.js") === "React", "Normalizes 'react.js' to 'React'")
  assert(normalizeSkill("py") === "Python", "Normalizes 'py' to 'Python'")
  assert(normalizeSkill("golang") === "Go", "Normalizes 'golang' to 'Go'")
  assert(normalizeSkill("k8s") === "Kubernetes", "Normalizes 'k8s' to 'Kubernetes'")
  assert(normalizeSkill("postgres") === "PostgreSQL", "Normalizes 'postgres' to 'PostgreSQL'")
  assert(normalizeSkill("c++") === "C++", "Normalizes 'c++' to 'C++'")
  assert(normalizeSkill("c#") === "C#", "Normalizes 'c#' to 'C#'")
  assert(normalizeSkill("c") === "C", "Normalizes 'c' to 'C'")
}

// -----------------------------------------------------------------------------
// Test Suite 2: Java vs JavaScript Strict Separation
// -----------------------------------------------------------------------------
console.log("\nSuite 2: Strict Java vs JavaScript Separation")
{
  const javaProfile: CandidateProfileData = {
    extracted_skills: ["Java", "Spring Boot", "MySQL"],
    primary_role: "Java Developer",
  }

  const jsJob = createDummyJob(
    "j_js",
    "Frontend React Engineer",
    "Requirements: JavaScript, React, HTML, CSS. Must know JavaScript well.",
  )

  const ranked = matchAndRankJobs(javaProfile, [jsJob])
  assert(
    !ranked[0].matchedSkills.includes("Java"),
    "Java candidate matching JavaScript job: 'Java' must NOT be matched",
    `Matched: ${ranked[0].matchedSkills.join(", ")}`,
  )
  assert(
    ranked[0].matchPercentage < 40,
    `Java profile matching pure JS job must be Low relevance (< 40%), got ${ranked[0].matchPercentage}%`,
  )

  const jsProfile: CandidateProfileData = {
    extracted_skills: ["JavaScript", "React"],
    primary_role: "Frontend Developer",
  }

  const javaJob = createDummyJob(
    "j_java",
    "Java Backend Intern",
    "Requirements: Core Java, Spring Boot, MySQL. Enterprise backend architecture.",
  )

  const ranked2 = matchAndRankJobs(jsProfile, [javaJob])
  assert(
    !ranked2[0].matchedSkills.includes("JavaScript"),
    "JavaScript candidate matching Java job: 'JavaScript' must NOT be matched",
  )
  assert(
    ranked2[0].matchPercentage < 40,
    `JavaScript profile matching pure Java job must be Low relevance (< 40%), got ${ranked2[0].matchPercentage}%`,
  )
}

// -----------------------------------------------------------------------------
// Test Suite 3: Symbol Skills (C++, C#, C) and Short Tokens (Go, R, AI)
// -----------------------------------------------------------------------------
console.log("\nSuite 3: Symbol Skills (C++, C#, C) and Short Tokens (Go, R, AI)")
{
  const cppJob = createDummyJob("j_cpp", "C++ Systems Engineer", "Requires C++ and Linux kernel knowledge.")
  const csharpJob = createDummyJob("j_cs", ".NET Developer", "Looking for C# and ASP.NET experience.")
  const genericJob = createDummyJob("j_gen", "Ongoing Category Negotiator", "We have good algorithms and ongoing categories.")

  const cppProfile: CandidateProfileData = {
    extracted_skills: ["C++", "Linux"],
    primary_role: "Systems Engineer",
  }

  const rankedCpp = matchAndRankJobs(cppProfile, [cppJob])
  assert(
    rankedCpp[0].matchedSkills.includes("C++"),
    "C++ skill correctly extracted and matched from job description",
  )

  const goProfile: CandidateProfileData = {
    extracted_skills: ["Go"],
    primary_role: "Backend Engineer",
  }

  const rankedGeneric = matchAndRankJobs(goProfile, [genericJob])
  assert(
    !rankedGeneric[0].matchedSkills.includes("Go"),
    "Short skill 'Go' does NOT match 'good', 'ongoing', 'category', or 'algorithm'",
    `Matched: ${rankedGeneric[0].matchedSkills.join(", ")}`,
  )
}

// -----------------------------------------------------------------------------
// Test Suite 4: Empty Profile / Missing Skills Handling
// -----------------------------------------------------------------------------
console.log("\nSuite 4: Empty Profile & Missing Skills Guardrails")
{
  const emptyProfile: CandidateProfileData = {
    extracted_skills: [],
    primary_role: "",
  }

  const techJob = createDummyJob("j1", "Software Engineer Intern", "Must know React, Python, Docker.")
  const ranked = matchAndRankJobs(emptyProfile, [techJob])

  assert(
    ranked[0].matchPercentage === 0,
    `Empty candidate profile must score strictly 0%, got ${ranked[0].matchPercentage}%`,
  )
  assert(
    ranked[0].relevanceCategory === "Low",
    `Empty candidate profile must be categorized as 'Low', got ${ranked[0].relevanceCategory}`,
  )
}

// -----------------------------------------------------------------------------
// Test Suite 5: Completely Unrelated Jobs
// -----------------------------------------------------------------------------
console.log("\nSuite 5: Completely Unrelated Opportunities")
{
  const mlProfile: CandidateProfileData = {
    extracted_skills: ["Python", "PyTorch", "Machine Learning", "Pandas"],
    primary_role: "Machine Learning Engineer",
  }

  const nursingJob = createDummyJob("j_nurse", "Dental Hygienist Assistant", "Patient care, dental equipment sterilization.")
  const graphicJob = createDummyJob("j_art", "Graphic Designer", "Photoshop, Illustrator, banner design.")

  const ranked = matchAndRankJobs(mlProfile, [nursingJob, graphicJob])
  assert(
    ranked[0].matchPercentage === 0,
    `ML Engineer matching Dental job must receive 0%, got ${ranked[0].matchPercentage}%`,
  )
  assert(
    ranked[1].matchPercentage === 0,
    `ML Engineer matching Graphic Designer job must receive 0%, got ${ranked[1].matchPercentage}%`,
  )
  assert(
    ranked[0].relevanceCategory === "Low",
    "Unrelated jobs must have 'Low' category",
  )
}

// -----------------------------------------------------------------------------
// Test Suite 6: Strongly Matching vs Partially Matching Profiles
// -----------------------------------------------------------------------------
console.log("\nSuite 6: Strongly Matching vs Partially Matching Profiles")
{
  const frontendProfile: CandidateProfileData = {
    extracted_skills: ["React", "TypeScript", "HTML", "CSS", "Next.js", "Tailwind CSS"],
    project_skills: ["React", "TypeScript"],
    primary_role: "Frontend Developer",
  }

  const perfectJob = createDummyJob(
    "j_strong",
    "Frontend Developer Intern",
    "Requirements: React, TypeScript, HTML, CSS. Preferred: Next.js.",
  )

  const partialJob = createDummyJob(
    "j_partial",
    "Frontend Developer Intern",
    "Requirements: Angular, Vue, CSS, Jest, GraphQL. Preferred: TypeScript.",
  )

  const ranked = matchAndRankJobs(frontendProfile, [partialJob, perfectJob])

  assert(
    ranked[0].id === "j_strong",
    "Strongly matching job is ranked first ahead of partial match",
  )
  assert(
    ranked[0].matchPercentage >= 75,
    `Strong match score should be high (>= 75%), got ${ranked[0].matchPercentage}%`,
  )
  assert(
    ranked[0].relevanceCategory === "High",
    "Strong match relevanceCategory is 'High'",
  )
  assert(
    ranked[1].matchPercentage < ranked[0].matchPercentage,
    `Partial match score (${ranked[1].matchPercentage}%) is strictly lower than strong match (${ranked[0].matchPercentage}%)`,
  )
  assert(
    ranked[0].matchedSkills.length >= 4,
    `Matched skills accurately captured (${ranked[0].matchedSkills.join(", ")})`,
  )
}

// -----------------------------------------------------------------------------
// Test Suite 7: Duplicate Skills & Inflation Protection
// -----------------------------------------------------------------------------
console.log("\nSuite 7: Duplicate Skills Deduplication")
{
  const duplicateProfile: CandidateProfileData = {
    extracted_skills: ["React", "react", "ReactJS", "react.js", "JS", "JavaScript", "TypeScript"],
    primary_role: "Frontend Developer",
  }

  const cleanProfile: CandidateProfileData = {
    extracted_skills: ["React", "JavaScript", "TypeScript"],
    primary_role: "Frontend Developer",
  }

  const job = createDummyJob("j1", "Frontend Engineer", "Requirements: React, TypeScript, JavaScript.")

  const rankedDup = matchAndRankJobs(duplicateProfile, [job])
  const rankedClean = matchAndRankJobs(cleanProfile, [job])

  assert(
    rankedDup[0].matchPercentage === rankedClean[0].matchPercentage,
    `Duplicate skills do not inflate score: Dup (${rankedDup[0].matchPercentage}%) === Clean (${rankedClean[0].matchPercentage}%)`,
  )
  assert(
    rankedDup[0].matchedSkills.length === 3,
    `Matched skills are properly deduplicated to 3 canonical skills (got ${rankedDup[0].matchedSkills.length})`,
  )
}

// -----------------------------------------------------------------------------
// Test Suite 8: Missing or Malformed Job Descriptions
// -----------------------------------------------------------------------------
console.log("\nSuite 8: Missing or Malformed Job Descriptions")
{
  const candidate: CandidateProfileData = {
    extracted_skills: ["Python", "SQL"],
    primary_role: "Python Developer",
  }

  const emptyDescJob = createDummyJob("j_empty", "Python Developer Intern", "")
  const ranked = matchAndRankJobs(candidate, [emptyDescJob])

  assert(
    !isNaN(ranked[0].matchPercentage),
    "Match score is not NaN when job description is empty",
  )
  assert(
    ranked[0].matchPercentage >= 0 && ranked[0].matchPercentage <= 100,
    "Score remains valid and bounded in [0, 100]",
  )
  assert(
    ranked[0].matchedSkills.includes("Python"),
    "Python extracted from title when description is missing",
  )
}

// -----------------------------------------------------------------------------
// Test Suite 9: Required vs Preferred Skills Weighting
// -----------------------------------------------------------------------------
console.log("\nSuite 9: Required vs Preferred Skills Weighting")
{
  const candidateWithReq: CandidateProfileData = {
    extracted_skills: ["React", "TypeScript"],
    primary_role: "Frontend Developer",
  }

  const candidateWithPref: CandidateProfileData = {
    extracted_skills: ["Docker", "AWS"],
    primary_role: "Frontend Developer",
  }

  const job = createDummyJob(
    "j_skills",
    "Web Developer Intern",
    "Requirements: React, TypeScript. Nice to have / Preferred: Docker, AWS.",
  )

  const rankedReq = matchAndRankJobs(candidateWithReq, [job])
  const rankedPref = matchAndRankJobs(candidateWithPref, [job])

  assert(
    rankedReq[0].matchPercentage > rankedPref[0].matchPercentage,
    `Required skill match (${rankedReq[0].matchPercentage}%) scores higher than preferred match (${rankedPref[0].matchPercentage}%)`,
  )
}

// -----------------------------------------------------------------------------
// Test Suite 10: Multi-Job Ranking Order & Ranking Metrics (NDCG@K, Precision@K)
// -----------------------------------------------------------------------------
console.log("\nSuite 10: Multi-Job Ranking Order & NDCG Evaluation")
{
  const candidate: CandidateProfileData = {
    extracted_skills: ["Python", "Django", "PostgreSQL", "Docker", "Git"],
    project_skills: ["Python", "Django"],
    primary_role: "Python Developer",
  }

  const highRelevanceJob = createDummyJob(
    "high",
    "Python Django Developer Intern",
    "Requirements: Python, Django, PostgreSQL. Bonus: Docker, Git.",
  )

  const moderateJob = createDummyJob(
    "mod",
    "Backend Developer",
    "Requirements: Node.js, Express.js, PostgreSQL. Useful: Python.",
  )

  const lowJob = createDummyJob(
    "low",
    "Angular Frontend Intern",
    "Requirements: Angular, TypeScript, RxJS, Sass.",
  )

  const ranked = matchAndRankJobs(candidate, [lowJob, highRelevanceJob, moderateJob])

  assert(ranked[0].id === "high", "High relevance job ranks at position 1")
  assert(ranked[1].id === "mod", "Moderate relevance job ranks at position 2")
  assert(ranked[2].id === "low", "Low relevance job ranks at position 3")

  // Strict monotonic descending order
  assert(
    ranked[0].matchPercentage >= ranked[1].matchPercentage &&
      ranked[1].matchPercentage >= ranked[2].matchPercentage,
    `Strict descending score order verified (${ranked[0].matchPercentage}% >= ${ranked[1].matchPercentage}% >= ${ranked[2].matchPercentage}%)`,
  )

  // Information Retrieval Evaluation Metric Calculation
  // Ground truth relevance: high=3, mod=1, low=0
  const idealOrder = [3, 1, 0]
  const actualOrder = ranked.map((j) => (j.id === "high" ? 3 : j.id === "mod" ? 1 : 0))

  const dcg = actualOrder[0] + actualOrder[1] / Math.log2(3) + actualOrder[2] / Math.log2(4)
  const idcg = idealOrder[0] + idealOrder[1] / Math.log2(3) + idealOrder[2] / Math.log2(4)
  const ndcg = dcg / idcg

  assert(ndcg === 1.0, `NDCG@3 is 1.0 (Optimal Ranking Achieved: ${ndcg})`)
}

// -----------------------------------------------------------------------------
// Summary
// -----------------------------------------------------------------------------
console.log("\n=======================================================")
console.log(`TOTAL TESTS: ${passedCount + failedCount} | PASSED: ${passedCount} | FAILED: ${failedCount}`)
console.log("=======================================================\n")

if (failedCount > 0) {
  process.exit(1)
} else {
  process.exit(0)
}
