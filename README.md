# InternHub – AI-Powered Personalized Internship & Career Recommendation Platform

[![React](https://img.shields.io/badge/React-19.0.0-blue.svg)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7.0-3178C6.svg)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-8.0.0-646CFF.svg)](https://vite.dev/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-v4.0.0-38B2AC.svg)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL%20RLS-3ECF8E.svg)](https://supabase.com/)
[![Python](https://img.shields.io/badge/Python-3.11-3776AB.svg)](https://python.org/)
[![Tests](https://img.shields.io/badge/Tests-39%2F39%20PASS%20(NDCG%403=1.0)-success.svg)](./src/tests/recommendation.test.ts)

> **InternHub** is a resume-driven career discovery platform that integrates automated resume parsing, non-resume document rejection, concurrent aggregation across 5 live job APIs, proactive recruitment scam screening, explainable multi-factor ranking, skill-gap roadmap generation, and end-to-end application tracking.

---

## 🌟 Key Features

1. **📄 Resume-First Ingestion & Non-Resume Bill Guardrail**
   - Automatically parses unstructured PDF resumes into canonical skills, project evidence, and target role classifications.
   - Built-in **19-pattern negative heuristic classifier** intercepts spurious uploads (such as college tuition fee receipts, semester bills, bank challans, and invoices) with **100% precision**, preventing corrupted data from entering the profile store.

2. **🌐 Multi-Provider Live Aggregation (5 APIs)**
   - Simultaneously queries five live recruitment APIs concurrently via `Promise.allSettled()`:
     - **JobDataAPI**
     - **Jooble REST API**
     - **Adzuna API**
     - **Remotive Open API**
     - **Arbeitnow Job Board API**
   - Features source-mirror synchronization to purge dead postings and uses MD5 tuple hashing (`MD5(lower(title) || lower(company))`) to eliminate cross-platform duplicates.

3. **🛡️ Proactive Scam Detection & Trust Score Engine**
   - Every opportunity starts at **88 points** and undergoes automated inspection:
     - Upfront payment / security deposit demands: **−40 pts**
     - Telegram / WhatsApp-only contact: **−40 pts**
     - Deceptive typing job / daily payout schemes: **−40 pts**
     - Unverified URL shorteners (`bit.ly`, `t.me`): **−25 pts**
     - Unusually brief descriptions ($< 150$ characters): **−20 pts**
     - Insecure protocol (`http://`): **−10 pts**
   - Scores are bounded in **$[15, 98]$**. Listings scoring below **65** receive an amber scam warning badge.

4. **🎯 Bounded Multi-Factor Explainable Recommendation Model**
   - Scores each opportunity using a transparent mathematical formulation:
     $$M_i = \min\left(98,\; 50\frac{|S \cap R_i|}{|R_i|} + 15\frac{|S \cap P_i|}{|P_i|} + r_i + e_i + \pi_i\right)$$
     - **Core Required Skills ($50\%$):** Overlap between candidate skills and required competencies.
     - **Role Alignment ($20\%$):** Word overlap between candidate target role and posting title (normalized by role token count).
     - **Preferred Skills ($15\%$):** Bonus for secondary qualifications.
     - **Project Evidence ($10\%$):** 4 points per verified skill evidenced in personal projects.
     - **Candidate Preferences ($5\%$):** 3 points for work mode match, 2 points for location match.
   - **Zero-Match Guardrail:** Candidates sharing 0 required skills strictly receive **0%** (or max 15% if only title text overlaps).
   - Retains TF-IDF Cosine Similarity as a lexical baseline.

5. **🗺️ Skill-Gap Analysis & Dynamic 4-Phase Roadmap**
   - Identifies missing skills via set difference: $G_i = R_i \setminus S$.
   - Aggregates top-ranked opportunities to generate a progressive 4-phase learning roadmap (*Foundations, Core Frameworks, Advanced Tools, Deployment*).

6. **📋 6-Stage Application Lifecycle Tracker**
   - Built-in Kanban tracker managing applications across:
     $$\text{Saved} \longrightarrow \text{Applied} \longrightarrow \text{Interview} \longrightarrow \begin{cases} \text{Selected} \\ \text{Rejected} \\ \text{Withdrawn} \end{cases}$$

7. **🔒 Enterprise Data Security & Row-Level Security (RLS)**
   - Database operations in Supabase PostgreSQL are enforced at the engine level with **Row-Level Security (RLS)** policies pinned to `auth.uid()`.
   - Passwords stored via cryptographic hashing; all traffic uses HTTPS with JWT bearer token authentication.

---

## 🏛️ System Architecture

```
+-----------------------------------------------------------------------------------+
|                            INTERNHUB SYSTEM ARCHITECTURE                          |
+-----------------------------------------------------------------------------------+
|  [Presentation Layer - Single Page Application]                                   |
|  React 19 | TypeScript | Vite | Tailwind CSS v4 | Recharts Radar & Bar Visuals    |
+-----------------------------------------+-----------------------------------------+
                                          | JSON over HTTPS (JWT Bearer Token)
                                          v
+-----------------------------------------------------------------------------------+
|  [Application API Gateway - Node.js & Express.js]                                 |
|  - Auth & Session Verification        - Multi-Provider Live Aggregator Engine     |
|  - Rate Limiting & Input Validation   - Tuple De-duplication & Mirror Cache Sync  |
|  - Heuristic Trust Score Calculator   - Multi-Factor Matching & Ranking Core      |
+-------------------+-------------------------------------+-------------------------+
                    |                                     |
       FastAPI REST | Internal Calls          PostgreSQL  | Row Level Security (RLS)
                    v                                     v
+---------------------------------------+  +----------------------------------------+
|  [AI / NLP Microservice - Python 3.11]|  |  [Database & Auth - Supabase / Postgres|
|  - PyMuPDF Plaintext Document Parsing |  |  - auth.users (Managed Identity)       |
|  - Non-Resume / Fee Bill Classifier   |  |  - profiles (Skills, CGPA, Domain)     |
|  - Canonical Skill Normalization      |  |  - applications (6-Stage Lifecycle)    |
|  - 35+ Software Role Inference Engine |  |  - saved_jobs (Opportunity Bookmarks)  |
|  - scikit-learn TF-IDF Vectorizer     |  |  - internships (5-Min Live Cache Mirror|
+---------------------------------------+  +----------------------------------------+
                                                          |
                                                          | Concurrency (Promise.allSettled)
                                                          v
+-----------------------------------------------------------------------------------+
|  [External Live Opportunity Providers]                                            |
|  JobDataAPI  |  Jooble API  |  Adzuna API  |  Remotive Open API  |  Arbeitnow API |
+-----------------------------------------------------------------------------------+
```

---

## 📁 Repository Structure

```
internhub/
├── docs/                                  # Academic Documentation & Reports
│   ├── INTERNHUB_FINAL_PROJECT_REPORT.pdf # 62-page Anna University / KLNCE Project Report
│   ├── FINAL_INTERNHUB_MINI_PROJECT_REPORT.md
│   ├── build_full_pdf.py                  # Headless Chrome + PyMuPDF report compiler
│   ├── report.html                        # Typeset academic report source
│   ├── report_assets/                     # High-res diagrams & college emblems
│   ├── Base Paper/                        # Literature survey IEEE base papers
│   └── PPT/                               # Viva-voce presentation slides
├── src/
│   ├── components/                        # UI Components & Icons
│   ├── pages/                             # Application Views
│   │   ├── Landing.tsx                    # Landing page
│   │   ├── Auth.tsx                       # Authentication & Registration
│   │   ├── Dashboard.tsx                  # Student career dashboard
│   │   ├── Internships.tsx                # Live listings & Trust Sandbox
│   │   ├── ResumeUpload.tsx               # Resume upload & Bill detection
│   │   ├── SkillGap.tsx                   # Radar gap analytics & Roadmap
│   │   ├── ApplicationTracker.tsx         # 6-state Kanban tracker
│   │   └── Profile.tsx                    # Student preferences & CGPA
│   ├── tests/
│   │   └── recommendation.test.ts         # Automated regression test suite (18 scenarios)
│   ├── api.ts                             # Backend API client & local mock layer
│   ├── jobServices.ts                     # Aggregator, Trust Score, and Match Engine
│   ├── resume_analyzer.py                 # Python NLP extraction microservice
│   └── supabase_schema.sql                # Supabase PostgreSQL schema with RLS
├── package.json                           # Dependencies & run scripts
├── tsconfig.json                          # TypeScript configuration
├── vite.config.ts                         # Vite configuration
└── README.md
```

---

## 🚀 Quick Start & Setup

### Prerequisites
- **Node.js** v18+ (v22 LTS recommended)
- **npm** or **pnpm**
- **Python** 3.11+ (for NLP microservice)

### Installation
```bash
# Clone the repository
git clone https://github.com/jayabalajivel/internhub.git
cd internhub

# Install dependencies
npm install
```

### Running Locally
```bash
# Start Vite development server
npm run dev
```
Open **`http://localhost:5173`** in your browser.

---

## 🧪 Automated Testing

InternHub includes an automated 18-scenario regression test suite that verifies skill normalization, Java vs. JavaScript strict isolation, symbol token matching (C++, C#, Go), empty-profile guardrails, and ranking monotonicity:

```bash
npm test
```

### Test Suite Execution Summary:
```
=======================================================
INTERNHUB RECOMMENDATION & SCORING REGRESSION TEST SUITE
=======================================================
Suite 1: Skill Normalization & Canonical Aliases       [PASS] (12/12)
Suite 2: Strict Java vs JavaScript Separation          [PASS] (4/4)
Suite 3: Symbol Skills (C++, C#, C) & Short Tokens     [PASS] (2/2)
Suite 4: Empty Profile & Missing Skills Guardrails     [PASS] (2/2)
Suite 5: Completely Unrelated Opportunities (0% Guard) [PASS] (3/3)
Suite 6: Strongly Matching vs Partially Matching       [PASS] (5/5)
Suite 7: Duplicate Skills Deduplication                [PASS] (2/2)
Suite 8: Missing or Malformed Job Descriptions         [PASS] (3/3)
Suite 9: Required vs Preferred Skills Weighting        [PASS] (1/1)
Suite 10: Multi-Job Ranking Order & NDCG Evaluation    [PASS] (5/5)
=======================================================
TOTAL TESTS: 39 | PASSED: 39 | FAILED: 0
NDCG@3 is 1.0 (Optimal Ranking Achieved)
=======================================================
```

---

## 👥 Authors & Academic Credits

- **Aaksath Nithil Saam S. S.** (Reg. No: `910623104001`) — Department of CSE, K.L.N. College of Engineering
- **Jayabalajivel R.** (Reg. No: `910623104036`) — Department of CSE, K.L.N. College of Engineering
- **Mrs. S. Yoheswari, M.E.** (Supervisor / Assistant Professor 2) — Department of CSE, K.L.N. College of Engineering
- **Dr. A. Askarunisha, M.E., Ph.D.** (Professor & Head of Department) — Department of CSE, K.L.N. College of Engineering

*(Affiliated to Anna University, Chennai, India · October 2026)*
