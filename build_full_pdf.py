# -*- coding: utf-8 -*-
"""
InternHub - Academic Project Report Generator
Compiles the complete, verified, Anna University / K.L.N. College of Engineering compliant
end-to-end Mini Project Report to HTML, renders pixel-perfect PDF via Google Chrome headless,
and stamps official Roman (ii, iii, ...) and Arabic (1, 2, ...) page numbers using PyMuPDF.
"""

import os
import subprocess
import pymupdf as fitz

BASE_DIR = r"d:\mini kutty"
ASSETS_DIR = os.path.join(BASE_DIR, "report_assets")
HTML_FILE = os.path.join(BASE_DIR, "report.html")
RAW_PDF = os.path.join(BASE_DIR, "report_raw.pdf")
FINAL_PDF = os.path.join(BASE_DIR, "INTERNHUB_FINAL_PROJECT_REPORT.pdf")
DEST_PDF = os.path.join(BASE_DIR, "internhub-main", "internhub-main", "Mini Projects(Files)", "INTERNHUB_FINAL_PROJECT_REPORT.pdf")

# Read college logo and images as local absolute file URLs
logo_path = os.path.join(ASSETS_DIR, "page_1_img_1.png").replace("\\", "/")
arch_path = os.path.join(ASSETS_DIR, "page_11_img_1.jpeg").replace("\\", "/")
dfd0_path = os.path.join(ASSETS_DIR, "dfd_level_0.svg").replace("\\", "/")
dfd1_path = os.path.join(ASSETS_DIR, "dfd_level_1.svg").replace("\\", "/")
sm_path = os.path.join(ASSETS_DIR, "state_machine.svg").replace("\\", "/")
weights_path = os.path.join(ASSETS_DIR, "multi_factor_weights.svg").replace("\\", "/")

ui_auth_path = os.path.join(ASSETS_DIR, "page_14_img_1.png").replace("\\", "/")
ui_resume_path = os.path.join(ASSETS_DIR, "page_15_img_1.png").replace("\\", "/")
ui_jobs_path = os.path.join(ASSETS_DIR, "page_16_img_1.png").replace("\\", "/")
ui_trust_path = os.path.join(ASSETS_DIR, "page_17_img_1.png").replace("\\", "/")
ui_track_path = os.path.join(ASSETS_DIR, "page_18_img_1.jpeg").replace("\\", "/")

html_content = f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>INTERNHUB - Mini Project Report</title>
<style>
  @page {{
    size: A4;
    margin: 25mm 20mm 25mm 25mm;
  }}
  body {{
    font-family: "Times New Roman", Times, serif;
    font-size: 12pt;
    line-height: 1.5;
    color: #111111;
    margin: 0;
    padding: 0;
  }}
  .page-break {{
    page-break-before: always;
  }}
  .cover-page {{
    text-align: center;
    height: 98vh;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    align-items: center;
    box-sizing: border-box;
    padding: 20px 0;
  }}
  .cover-title {{
    font-size: 15pt;
    font-weight: bold;
    line-height: 1.4;
    text-transform: uppercase;
    margin-bottom: 25px;
  }}
  .cover-subtitle {{
    font-size: 13pt;
    font-weight: bold;
    text-transform: uppercase;
    letter-spacing: 1px;
    margin-bottom: 30px;
  }}
  .submitted-by {{
    font-size: 12pt;
    font-style: italic;
    margin-bottom: 15px;
  }}
  .student-name {{
    font-size: 13pt;
    font-weight: bold;
    text-transform: uppercase;
    line-height: 1.6;
  }}
  .degree-text {{
    font-size: 12pt;
    font-style: italic;
    line-height: 1.5;
    margin: 25px 0;
  }}
  .degree-title {{
    font-size: 13pt;
    font-weight: bold;
    text-transform: uppercase;
  }}
  .college-emblem {{
    width: 130px;
    height: auto;
    margin: 15px 0;
  }}
  .college-name {{
    font-size: 14pt;
    font-weight: bold;
    text-transform: uppercase;
    line-height: 1.3;
  }}
  .college-affil {{
    font-size: 11pt;
    margin-top: 4px;
    margin-bottom: 20px;
  }}
  .report-date {{
    font-size: 12pt;
    font-weight: bold;
    text-transform: uppercase;
    letter-spacing: 1px;
  }}

  /* Bonafide Certificate */
  .cert-header {{
    text-align: center;
    font-size: 13pt;
    font-weight: bold;
    text-transform: uppercase;
    margin-bottom: 5px;
  }}
  .cert-sub {{
    text-align: center;
    font-size: 11pt;
    margin-bottom: 35px;
  }}
  .cert-title {{
    text-align: center;
    font-size: 14pt;
    font-weight: bold;
    text-transform: uppercase;
    letter-spacing: 1px;
    margin-bottom: 40px;
  }}
  .cert-body {{
    text-align: justify;
    line-height: 2.0;
    font-size: 12pt;
    text-indent: 40px;
    margin-bottom: 80px;
  }}
  .sign-container {{
    display: flex;
    justify-content: space-between;
    margin-top: 60px;
    margin-bottom: 70px;
  }}
  .sign-box {{
    width: 45%;
    font-size: 12pt;
    line-height: 1.4;
  }}
  .viva-voce {{
    font-size: 12pt;
    margin-bottom: 60px;
  }}
  .examiners {{
    display: flex;
    justify-content: space-between;
    font-weight: bold;
    font-size: 12pt;
  }}

  /* Standard Headings */
  h1.chapter-head {{
    text-align: center;
    font-size: 14pt;
    font-weight: bold;
    text-transform: uppercase;
    margin-top: 15px;
    margin-bottom: 25px;
    letter-spacing: 0.5px;
  }}
  h2.section-head {{
    font-size: 12.5pt;
    font-weight: bold;
    text-transform: uppercase;
    margin-top: 22px;
    margin-bottom: 10px;
  }}
  h3.sub-head {{
    font-size: 12pt;
    font-weight: bold;
    margin-top: 16px;
    margin-bottom: 8px;
  }}
  p {{
    text-align: justify;
    margin-top: 0;
    margin-bottom: 12px;
    line-height: 1.5;
  }}
  
  /* Tables */
  table.report-table {{
    width: 100%;
    border-collapse: collapse;
    margin: 16px 0;
    font-size: 10.5pt;
    page-break-inside: avoid;
  }}
  table.report-table th, table.report-table td {{
    border: 1px solid #333333;
    padding: 7px 9px;
    line-height: 1.35;
  }}
  table.report-table th {{
    background-color: #e9eff8;
    font-weight: bold;
    text-align: center;
  }}
  .table-caption {{
    text-align: center;
    font-weight: bold;
    font-size: 11pt;
    margin-top: 14px;
    margin-bottom: 8px;
  }}

  /* Figures */
  .figure-box {{
    text-align: center;
    margin: 20px 0;
    page-break-inside: avoid;
  }}
  .figure-box img {{
    max-width: 92%;
    max-height: 380px;
    height: auto;
    border: 1px solid #cbd5e1;
    border-radius: 4px;
    padding: 2px;
    background: #fff;
  }}
  .figure-caption {{
    text-align: center;
    font-weight: bold;
    font-size: 11pt;
    margin-top: 8px;
    margin-bottom: 18px;
  }}

  /* Code / Preformatted */
  pre.code-block {{
    background-color: #f8fafc;
    border: 1px solid #cbd5e1;
    padding: 10px 14px;
    font-family: "Courier New", Courier, monospace;
    font-size: 9.5pt;
    line-height: 1.35;
    border-radius: 4px;
    overflow-x: auto;
    page-break-inside: avoid;
  }}

  /* References */
  ol.ref-list {{
    padding-left: 24px;
    line-height: 1.6;
    font-size: 11pt;
  }}
  ol.ref-list li {{
    margin-bottom: 10px;
    text-align: justify;
  }}
</style>
</head>
<body>

<!-- ============================================================== -->
<!-- 1. COVER PAGE                                                  -->
<!-- ============================================================== -->
<div class="cover-page">
  <div>
    <div class="cover-title">
      INTERNHUB – AI-POWERED PERSONALIZED INTERNSHIP AND<br>
      JOB RECOMMENDATION SYSTEM
    </div>
    <div class="cover-subtitle">A MINI PROJECT REPORT</div>
  </div>

  <div>
    <div class="submitted-by">Submitted by</div>
    <div class="student-name">AAKSATH NITHIL SAAM SS (910623104001)</div>
    <div class="student-name">JAYABALAJIVEL R (910623104036)</div>
  </div>

  <div>
    <div class="degree-text">
      in partial fulfillment for the award of the degree<br>
      of<br>
      <span class="degree-title">BACHELOR OF ENGINEERING</span><br>
      in<br>
      <span class="degree-title">COMPUTER SCIENCE AND ENGINEERING</span>
    </div>
  </div>

  <div>
    <img src="{logo_path}" alt="K.L.N. College of Engineering Crest" class="college-emblem"><br>
    <div class="college-name">K.L.N. COLLEGE OF ENGINEERING</div>
    <div class="college-affil">(An Autonomous Institution, Affiliated to Anna University, Chennai)</div>
    <div class="report-date">OCTOBER 2026</div>
  </div>
</div>

<!-- ============================================================== -->
<!-- 2. BONAFIDE CERTIFICATE                                        -->
<!-- ============================================================== -->
<div class="page-break"></div>
<div class="cert-header">K.L.N. COLLEGE OF ENGINEERING</div>
<div class="cert-sub">(An Autonomous Institution, Affiliated to Anna University, Chennai)</div>

<div class="cert-title">BONAFIDE CERTIFICATE</div>

<div class="cert-body">
  Certified that this mini project report <b>“INTERNHUB – AI-POWERED PERSONALIZED INTERNSHIP AND JOB RECOMMENDATION SYSTEM”</b> is the bonafide work of <b>“AAKSATH NITHIL SAAM SS (910623104001) and JAYABALAJIVEL R (910623104036)”</b> who carried out the mini project under my supervision.
</div>

<div class="sign-container">
  <div class="sign-box">
    <b>SIGNATURE</b><br><br><br>
    <b>Dr. A. ASKARUNISHA</b><br>
    HEAD OF THE DEPARTMENT<br>
    Computer Science and Engineering
  </div>
  <div class="sign-box" style="text-align: right;">
    <b>SIGNATURE</b><br><br><br>
    <b>Mrs. S. YOHESWARI</b><br>
    SUPERVISOR<br>
    Assistant Professor 2<br>
    Computer Science and Engineering
  </div>
</div>

<div class="viva-voce">
  Submitted for the mini project viva-voce conducted on __________________.
</div>

<div class="examiners">
  <div>INTERNAL EXAMINER</div>
  <div>EXTERNAL EXAMINER</div>
</div>

<!-- ============================================================== -->
<!-- 3. ACKNOWLEDGEMENT                                             -->
<!-- ============================================================== -->
<div class="page-break"></div>
<h1 class="chapter-head">ACKNOWLEDGEMENT</h1>

<p>The satisfaction and joy that come with the successful completion of any task would be incomplete without mentioning the people who made it possible, whose constant guidance and encouragement crowned our efforts with success.</p>

<p>We extend our gratitude to the Founder, <b>Late Thiru. K.L.N. KRISHNAN</b>, K.L.N. College of Engineering, and the Management Members for making us march towards the glory of success.</p>

<p>We express our sincere thanks to our respected Principal, <b>Dr. A.V. RAM PRASAD, M.E., Ph.D.</b>, for all the facilities offered.</p>

<p>We would like to express our deep gratitude and heartfelt thanks to <b>Dr. A. ASKARUNISA, M.E., Ph.D.</b>, Head of the Department of Computer Science and Engineering, K.L.N. College of Engineering, who motivated and encouraged us to do this mini project for this academic year.</p>

<p>Our sincere thanks go to our Mini Project guide, <b>Mrs. S. YOHESWARI</b>, Assistant Professor, Department of Computer Science and Engineering, K.L.N. College of Engineering, whose guidance and support were invaluable during the entire period of our work.</p>

<p>Our respected Mini Project Coordinator <b>Ms. N. NAZMUNISHA, M.E., (Ph.D.)</b>, Assistant Professor of the Department of Computer Science and Engineering, K.L.N. College of Engineering whose support was inevitable during the entire period of our work.</p>

<p>We thank our teaching staff for sharing their knowledge and views to enhance our mini project, and our non-teaching staff for their technical support. We thank our parents for their constant support and our friends for their encouragement throughout the project. Finally, we thank the Almighty for giving us good health to finish the mini project successfully.</p>

<!-- ============================================================== -->
<!-- 4. ABSTRACT                                                    -->
<!-- ============================================================== -->
<div class="page-break"></div>
<h1 class="chapter-head">ABSTRACT</h1>

<p>Internships and entry-level jobs give students practical knowledge, industry exposure and a start to their careers. Yet finding the right opportunity is hard. Students must search several platforms by hand, cannot tell which postings match their skills, and meet duplicate, outdated, fraudulent or incomplete listings along the way.</p>

<p>InternHub is an AI-powered web portal that gives personalised internship and job recommendations. The user uploads a resume, and the system analyses it with Natural Language Processing (NLP) to extract technical skills, programming languages, frameworks, tools, projects, certifications, domain and interests. To protect system integrity, a heuristic non-resume filter automatically flags and rejects financial documents such as tuition fee receipts or bills. InternHub then collects internships and jobs automatically from external APIs (including JobDataAPI, Jooble, Adzuna, Remotive, and Arbeitnow), converts them into one common format, checks them for missing information, purges dead listings, and removes duplicates using composite hashing.</p>

<p>Each opportunity is evaluated using a mathematically bounded Multi-Factor Hybrid Recommendation Engine combining Core Required Skills (50%), Preferred Skills (15%), Role Alignment (20%), Practical Project Evidence (10%), and Work-Mode/Location Preferences (5%). An automated Trust Score &amp; Scam Indicator detects upfront fees and suspicious off-platform contact. For every recommended role, InternHub identifies missing competencies, provides actionable resume improvement suggestions, and generates a dynamic 4-phase learning roadmap.</p>

<p>Users can bookmark favourites and track applications across six statuses: Saved, Applied, Interview, Selected, Rejected, and Withdrawn. The application is built with React 19 and Vite on the frontend, Node.js and Express.js for API aggregation, Python with spaCy and scikit-learn for AI services, and PostgreSQL on Supabase with Row Level Security (RLS) for persistent storage and authentication. This report details the problem, literature review, architecture, database design, modules, algorithms, and comprehensive test validation.</p>

<p style="margin-top: 25px;"><b>Keywords:</b> Internship and job recommendation, Resume analysis, Natural Language Processing, TF-IDF, Cosine similarity, Multi-factor scoring, Scam detection, Skill-gap analysis, Application tracking, Supabase.</p>

<!-- ============================================================== -->
<!-- 5. TABLE OF CONTENTS (TABLE FORMAT)                            -->
<!-- ============================================================== -->
<div class="page-break"></div>
<h1 class="chapter-head">TABLE OF CONTENTS</h1>

<table class="report-table">
  <thead>
    <tr>
      <th style="width: 25%;">CHAPTER / TITLE</th>
      <th style="width: 60%; text-align: left;">TITLE / TOPIC</th>
      <th style="width: 15%;">PAGE NO.</th>
    </tr>
  </thead>
  <tbody>
    <tr><td colspan="2"><b>ABSTRACT</b></td><td style="text-align: center;">iv</td></tr>
    <tr><td colspan="2"><b>LIST OF FIGURES</b></td><td style="text-align: center;">viii</td></tr>
    <tr><td colspan="2"><b>LIST OF TABLES</b></td><td style="text-align: center;">ix</td></tr>
    <tr><td colspan="2"><b>LIST OF ABBREVIATIONS</b></td><td style="text-align: center;">xi</td></tr>
    
    <tr><td style="text-align: center;"><b>1</b></td><td><b>INTRODUCTION</b></td><td style="text-align: center;"><b>1</b></td></tr>
    <tr><td style="text-align: center;">1.1</td><td>Background</td><td style="text-align: center;">1</td></tr>
    <tr><td style="text-align: center;">1.2</td><td>Problem Statement</td><td style="text-align: center;">2</td></tr>
    <tr><td style="text-align: center;">1.3</td><td>Motivation</td><td style="text-align: center;">2</td></tr>
    <tr><td style="text-align: center;">1.4</td><td>Objectives of the Project</td><td style="text-align: center;">3</td></tr>
    <tr><td style="text-align: center;">1.5</td><td>Project Overview</td><td style="text-align: center;">3</td></tr>
    <tr><td style="text-align: center;">1.6</td><td>Project Domain</td><td style="text-align: center;">4</td></tr>
    <tr><td style="text-align: center;">1.7</td><td>Organization of the Report</td><td style="text-align: center;">5</td></tr>

    <tr><td style="text-align: center;"><b>2</b></td><td><b>LITERATURE SURVEY</b></td><td style="text-align: center;"><b>6</b></td></tr>
    <tr><td style="text-align: center;">2.1</td><td>Overview</td><td style="text-align: center;">6</td></tr>
    <tr><td style="text-align: center;">2.2</td><td>Paper 1: AI-Based Internship Recommendation System (IEEE, 2024)</td><td style="text-align: center;">6</td></tr>
    <tr><td style="text-align: center;">2.3</td><td>Paper 2: TechTrack – An Internship Matching Platform (IEEE ICBIR, 2026)</td><td style="text-align: center;">7</td></tr>
    <tr><td style="text-align: center;">2.4</td><td>Paper 3: AI-Driven Internship Matching Using Skill-Based System (NCECA, 2026)</td><td style="text-align: center;">7</td></tr>
    <tr><td style="text-align: center;">2.5</td><td>Paper 4: AI-Based Internship Recommendation Engine for the PM Scheme (IEEE, 2026)</td><td style="text-align: center;">8</td></tr>
    <tr><td style="text-align: center;">2.6</td><td>Paper 5: Smart Internship Recommender (IRJMETS, 2026)</td><td style="text-align: center;">8</td></tr>
    <tr><td style="text-align: center;">2.7</td><td>Consolidated Summary of the Survey</td><td style="text-align: center;">9</td></tr>
    <tr><td style="text-align: center;">2.8</td><td>Critical Research Gaps Identified</td><td style="text-align: center;">9</td></tr>

    <tr><td style="text-align: center;"><b>3</b></td><td><b>EXISTING SYSTEM</b></td><td style="text-align: center;"><b>10</b></td></tr>
    <tr><td style="text-align: center;">3.1</td><td>Overview</td><td style="text-align: center;">10</td></tr>
    <tr><td style="text-align: center;">3.2</td><td>Limitations of the Existing System</td><td style="text-align: center;">10</td></tr>
    <tr><td style="text-align: center;">3.3</td><td>Need for a New System</td><td style="text-align: center;">10</td></tr>

    <tr><td style="text-align: center;"><b>4</b></td><td><b>PROPOSED SYSTEM</b></td><td style="text-align: center;"><b>11</b></td></tr>
    <tr><td style="text-align: center;">4.1</td><td>Overview</td><td style="text-align: center;">11</td></tr>
    <tr><td style="text-align: center;">4.2</td><td>Key Architectural Features</td><td style="text-align: center;">11</td></tr>
    <tr><td style="text-align: center;">4.3</td><td>Advantages of the Proposed System</td><td style="text-align: center;">12</td></tr>
    <tr><td style="text-align: center;">4.4</td><td>Existing System versus Proposed System</td><td style="text-align: center;">12</td></tr>
    <tr><td style="text-align: center;">4.5</td><td>How InternHub Differs from Existing Projects</td><td style="text-align: center;">13</td></tr>
  </tbody>
</table>

<div class="page-break"></div>
<div class="table-caption" style="text-align: left; margin-bottom: 10px;"><b>TABLE OF CONTENTS (Continued)</b></div>
<table class="report-table">
  <thead>
    <tr>
      <th style="width: 25%;">CHAPTER / TITLE</th>
      <th style="width: 60%; text-align: left;">TITLE / TOPIC</th>
      <th style="width: 15%;">PAGE NO.</th>
    </tr>
  </thead>
  <tbody>
    <tr><td style="text-align: center;"><b>5</b></td><td><b>SYSTEM REQUIREMENTS SPECIFICATION</b></td><td style="text-align: center;"><b>16</b></td></tr>
    <tr><td style="text-align: center;">5.1</td><td>Hardware Requirements</td><td style="text-align: center;">16</td></tr>
    <tr><td style="text-align: center;">5.2</td><td>Software Requirements</td><td style="text-align: center;">16</td></tr>
    <tr><td style="text-align: center;">5.3</td><td>Functional Requirements (FR1 to FR12)</td><td style="text-align: center;">17</td></tr>
    <tr><td style="text-align: center;">5.4</td><td>Non-Functional Requirements (NFR1 to NFR7)</td><td style="text-align: center;">18</td></tr>

    <tr><td style="text-align: center;"><b>6</b></td><td><b>SYSTEM DESIGN AND MODELING</b></td><td style="text-align: center;"><b>19</b></td></tr>
    <tr><td style="text-align: center;">6.1</td><td>System Architecture</td><td style="text-align: center;">19</td></tr>
    <tr><td style="text-align: center;">6.2</td><td>Components of the Architecture</td><td style="text-align: center;">20</td></tr>
    <tr><td style="text-align: center;">6.3</td><td>System Workflow and Data Flow (DFD Levels 0, 1, 2)</td><td style="text-align: center;">20</td></tr>
    <tr><td style="text-align: center;">6.4</td><td>Backend RESTful API Routes</td><td style="text-align: center;">23</td></tr>
    <tr><td style="text-align: center;">6.5</td><td>Database Design and Relational Schema (Supabase PostgreSQL)</td><td style="text-align: center;">23</td></tr>

    <tr><td style="text-align: center;"><b>7</b></td><td><b>SYSTEM MODULES</b></td><td style="text-align: center;"><b>29</b></td></tr>
    <tr><td style="text-align: center;">7.1</td><td>User Authentication and Profile Management</td><td style="text-align: center;">29</td></tr>
    <tr><td style="text-align: center;">7.2</td><td>Resume Upload, Analysis &amp; Non-Resume Bill Detection</td><td style="text-align: center;">29</td></tr>
    <tr><td style="text-align: center;">7.3</td><td>Multi-Provider Opportunity Aggregation</td><td style="text-align: center;">31</td></tr>
    <tr><td style="text-align: center;">7.4</td><td>Data Validation, Dead Listing Purge &amp; Duplicate Detection</td><td style="text-align: center;">31</td></tr>
    <tr><td style="text-align: center;">7.5</td><td>Recommendation Engine &amp; Multi-Factor Match Score</td><td style="text-align: center;">33</td></tr>
    <tr><td style="text-align: center;">7.6</td><td>Scam Detection &amp; Trust Score Engine</td><td style="text-align: center;">33</td></tr>
    <tr><td style="text-align: center;">7.7</td><td>Skill-Gap Analysis &amp; Resume Improvement Roadmaps</td><td style="text-align: center;">34</td></tr>
    <tr><td style="text-align: center;">7.8</td><td>Favourites and Application Lifecycle Tracking</td><td style="text-align: center;">34</td></tr>
    <tr><td style="text-align: center;">7.9</td><td>Periodic Data Updates &amp; Mirror Sync</td><td style="text-align: center;">35</td></tr>

    <tr><td style="text-align: center;"><b>8</b></td><td><b>ALGORITHMS AND TECHNIQUES</b></td><td style="text-align: center;"><b>36</b></td></tr>
    <tr><td style="text-align: center;">8.1</td><td>Resume Parsing and NLP Extraction</td><td style="text-align: center;">36</td></tr>
    <tr><td style="text-align: center;">8.2</td><td>Canonical Skill Taxonomy &amp; Alias Normalization</td><td style="text-align: center;">36</td></tr>
    <tr><td style="text-align: center;">8.3</td><td>Content-Based Filtering &amp; TF-IDF Vectorization</td><td style="text-align: center;">37</td></tr>
    <tr><td style="text-align: center;">8.4</td><td>Cosine Similarity Formulation</td><td style="text-align: center;">37</td></tr>
    <tr><td style="text-align: center;">8.5</td><td>Multi-Factor Recommendation Formula (Core 50% + Role 20% + Pref 15%)</td><td style="text-align: center;">38</td></tr>
    <tr><td style="text-align: center;">8.6</td><td>Trust Score &amp; Scam Heuristic Algorithm</td><td style="text-align: center;">38</td></tr>
    <tr><td style="text-align: center;">8.7</td><td>Step-by-Step Worked Numerical Example</td><td style="text-align: center;">39</td></tr>

    <tr><td style="text-align: center;"><b>9</b></td><td><b>IMPLEMENTATION DETAILS</b></td><td style="text-align: center;"><b>41</b></td></tr>
    <tr><td style="text-align: center;">9.1</td><td>Technology Stack</td><td style="text-align: center;">41</td></tr>
    <tr><td style="text-align: center;">9.2</td><td>Frontend Architecture (React 19, Vite, Tailwind CSS v4)</td><td style="text-align: center;">41</td></tr>
    <tr><td style="text-align: center;">9.3</td><td>Backend Aggregator &amp; Cache Engine</td><td style="text-align: center;">42</td></tr>
    <tr><td style="text-align: center;">9.4</td><td>AI / NLP Microservice</td><td style="text-align: center;">42</td></tr>
    <tr><td style="text-align: center;">9.5</td><td>Database &amp; Row Level Security (RLS)</td><td style="text-align: center;">42</td></tr>
    <tr><td style="text-align: center;">9.6</td><td>Security, Privacy &amp; Error Handling</td><td style="text-align: center;">43</td></tr>

    <tr><td style="text-align: center;"><b>10</b></td><td><b>SYSTEM TESTING AND VALIDATION</b></td><td style="text-align: center;"><b>44</b></td></tr>
    <tr><td style="text-align: center;">10.1</td><td>Testing Strategy &amp; Regression Test Suite</td><td style="text-align: center;">44</td></tr>
    <tr><td style="text-align: center;">10.2</td><td>Test Cases Matrix (TC01 to TC18)</td><td style="text-align: center;">44</td></tr>

    <tr><td style="text-align: center;"><b>11</b></td><td><b>RESULTS AND PERFORMANCE DISCUSSION</b></td><td style="text-align: center;"><b>46</b></td></tr>
    <tr><td style="text-align: center;"><b>12</b></td><td><b>CONCLUSION</b></td><td style="text-align: center;"><b>48</b></td></tr>
    <tr><td style="text-align: center;"><b>13</b></td><td><b>FUTURE ENHANCEMENT</b></td><td style="text-align: center;"><b>49</b></td></tr>
    <tr><td colspan="2"><b>REFERENCES</b></td><td style="text-align: center;"><b>50</b></td></tr>
  </tbody>
</table>

<!-- ============================================================== -->
<!-- 6. LIST OF FIGURES                                             -->
<!-- ============================================================== -->
<div class="page-break"></div>
<h1 class="chapter-head">LIST OF FIGURES</h1>

<table class="report-table">
  <thead>
    <tr>
      <th style="width: 20%;">FIGURE NO.</th>
      <th style="width: 65%; text-align: left;">FIGURE CAPTION</th>
      <th style="width: 15%;">PAGE NO.</th>
    </tr>
  </thead>
  <tbody>
    <tr><td style="text-align: center;"><b>Figure 4.1</b></td><td>Existing approach compared with the InternHub workflow pipeline</td><td style="text-align: center;">14</td></tr>
    <tr><td style="text-align: center;"><b>Figure 6.1</b></td><td>Architecture diagram of InternHub</td><td style="text-align: center;">19</td></tr>
    <tr><td style="text-align: center;"><b>Figure 6.2</b></td><td>Data Flow Diagram (DFD) Level 0: Context Diagram</td><td style="text-align: center;">21</td></tr>
    <tr><td style="text-align: center;"><b>Figure 6.3</b></td><td>Data Flow Diagram (DFD) Level 1: System Operational Data Flow</td><td style="text-align: center;">22</td></tr>
    <tr><td style="text-align: center;"><b>Figure 6.4</b></td><td>Tables and relationships in the InternHub Supabase database</td><td style="text-align: center;">24</td></tr>
    <tr><td style="text-align: center;"><b>Figure 7.1</b></td><td>Resume analysis, bill detection, and skill parsing pipeline</td><td style="text-align: center;">30</td></tr>
    <tr><td style="text-align: center;"><b>Figure 7.2</b></td><td>Validation, normalization, and duplicate detection flow</td><td style="text-align: center;">32</td></tr>
    <tr><td style="text-align: center;"><b>Figure 7.3</b></td><td>Application lifecycle status transitions state machine</td><td style="text-align: center;">34</td></tr>
    <tr><td style="text-align: center;"><b>Figure 8.1</b></td><td>Multi-factor recommendation formula weight breakdown</td><td style="text-align: center;">38</td></tr>
    <tr><td style="text-align: center;"><b>Figure 11.1</b></td><td>User Authentication &amp; Profile Management Interface</td><td style="text-align: center;">46</td></tr>
    <tr><td style="text-align: center;"><b>Figure 11.2</b></td><td>AI Resume Upload &amp; Skill Extraction Interface</td><td style="text-align: center;">46</td></tr>
    <tr><td style="text-align: center;"><b>Figure 11.3</b></td><td>Personalized Internship Recommendations with Match Scores</td><td style="text-align: center;">47</td></tr>
    <tr><td style="text-align: center;"><b>Figure 11.4</b></td><td>Company Verification &amp; Trust Score Safety Analysis</td><td style="text-align: center;">47</td></tr>
    <tr><td style="text-align: center;"><b>Figure 11.5</b></td><td>Application Tracking &amp; Career Progress Dashboard</td><td style="text-align: center;">48</td></tr>
  </tbody>
</table>

<!-- ============================================================== -->
<!-- 7. LIST OF TABLES                                              -->
<!-- ============================================================== -->
<div class="page-break"></div>
<h1 class="chapter-head">LIST OF TABLES</h1>

<table class="report-table">
  <thead>
    <tr>
      <th style="width: 20%;">TABLE NO.</th>
      <th style="width: 65%; text-align: left;">TABLE CAPTION</th>
      <th style="width: 15%;">PAGE NO.</th>
    </tr>
  </thead>
  <tbody>
    <tr><td style="text-align: center;">Table 1.1</td><td>Main problems faced by students and job seekers</td><td style="text-align: center;">2</td></tr>
    <tr><td style="text-align: center;">Table 1.2</td><td>Objectives of the project</td><td style="text-align: center;">3</td></tr>
    <tr><td style="text-align: center;">Table 1.3</td><td>Domains related to the project</td><td style="text-align: center;">4</td></tr>
    <tr><td style="text-align: center;">Table 1.4</td><td>Organization of the report</td><td style="text-align: center;">5</td></tr>
    <tr><td style="text-align: center;">Table 2.1</td><td>Details of Paper 1 (IEEE, 2024)</td><td style="text-align: center;">6</td></tr>
    <tr><td style="text-align: center;">Table 2.2</td><td>Details of Paper 2 (TechTrack, 2026)</td><td style="text-align: center;">7</td></tr>
    <tr><td style="text-align: center;">Table 2.3</td><td>Details of Paper 3 (NCECA, 2026)</td><td style="text-align: center;">7</td></tr>
    <tr><td style="text-align: center;">Table 2.4</td><td>Details of Paper 4 (PM Internship Scheme, 2026)</td><td style="text-align: center;">8</td></tr>
    <tr><td style="text-align: center;">Table 2.5</td><td>Details of Paper 5 (Smart Internship Recommender, IRJMETS, 2026)</td><td style="text-align: center;">8</td></tr>
    <tr><td style="text-align: center;">Table 2.6</td><td>Summary and comparison of the literature survey</td><td style="text-align: center;">9</td></tr>
    <tr><td style="text-align: center;">Table 3.1</td><td>Limitations of the existing system</td><td style="text-align: center;">10</td></tr>
    <tr><td style="text-align: center;">Table 4.1</td><td>Key features of InternHub</td><td style="text-align: center;">11</td></tr>
    <tr><td style="text-align: center;">Table 4.2</td><td>Advantages of the proposed system</td><td style="text-align: center;">12</td></tr>
    <tr><td style="text-align: center;">Table 4.3</td><td>Existing system compared with InternHub</td><td style="text-align: center;">12</td></tr>
    <tr><td style="text-align: center;">Table 4.4</td><td>Feature comparison with existing work</td><td style="text-align: center;">14</td></tr>
    <tr><td style="text-align: center;">Table 4.5</td><td>What is different in InternHub</td><td style="text-align: center;">15</td></tr>
    <tr><td style="text-align: center;">Table 5.1</td><td>Hardware requirements</td><td style="text-align: center;">16</td></tr>
    <tr><td style="text-align: center;">Table 5.2</td><td>Software requirements</td><td style="text-align: center;">16</td></tr>
    <tr><td style="text-align: center;">Table 5.3</td><td>Functional requirements</td><td style="text-align: center;">17</td></tr>
    <tr><td style="text-align: center;">Table 5.4</td><td>Non-functional requirements</td><td style="text-align: center;">18</td></tr>
    <tr><td style="text-align: center;">Table 6.1</td><td>Components of the architecture</td><td style="text-align: center;">20</td></tr>
    <tr><td style="text-align: center;">Table 6.2</td><td>Stages of the system workflow</td><td style="text-align: center;">22</td></tr>
    <tr><td style="text-align: center;">Table 6.3</td><td>API routes of the backend</td><td style="text-align: center;">23</td></tr>
    <tr><td style="text-align: center;">Table 6.4</td><td>Database tables and their purpose</td><td style="text-align: center;">25</td></tr>
    <tr><td style="text-align: center;">Table 6.5</td><td>Structure of the profiles table</td><td style="text-align: center;">25</td></tr>
    <tr><td style="text-align: center;">Table 6.6</td><td>Structure of the applications table</td><td style="text-align: center;">26</td></tr>
    <tr><td style="text-align: center;">Table 6.7</td><td>Structure of the saved_jobs table</td><td style="text-align: center;">26</td></tr>
    <tr><td style="text-align: center;">Table 6.8</td><td>Structure of the internships table</td><td style="text-align: center;">27</td></tr>
    <tr><td style="text-align: center;">Table 7.1</td><td>Major modules of InternHub</td><td style="text-align: center;">29</td></tr>
    <tr><td style="text-align: center;">Table 7.2</td><td>Information extracted from a resume</td><td style="text-align: center;">30</td></tr>
    <tr><td style="text-align: center;">Table 7.3</td><td>Common format for opportunities</td><td style="text-align: center;">31</td></tr>
    <tr><td style="text-align: center;">Table 7.4</td><td>Validation checks on each listing</td><td style="text-align: center;">32</td></tr>
    <tr><td style="text-align: center;">Table 7.5</td><td>Fields used to detect duplicates</td><td style="text-align: center;">32</td></tr>
    <tr><td style="text-align: center;">Table 7.6</td><td>Deceptive keywords and scam penalty weights</td><td style="text-align: center;">33</td></tr>
    <tr><td style="text-align: center;">Table 7.7</td><td>Application statuses</td><td style="text-align: center;">34</td></tr>
    <tr><td style="text-align: center;">Table 8.1</td><td>Sample canonical skill aliases mapping</td><td style="text-align: center;">36</td></tr>
    <tr><td style="text-align: center;">Table 8.2</td><td>Multi-factor match score weight distribution</td><td style="text-align: center;">38</td></tr>
    <tr><td style="text-align: center;">Table 8.3</td><td>Sample test candidate profile data</td><td style="text-align: center;">39</td></tr>
    <tr><td style="text-align: center;">Table 8.4</td><td>Evaluated opportunities for numerical demonstration</td><td style="text-align: center;">39</td></tr>
    <tr><td style="text-align: center;">Table 8.5</td><td>Mathematical score breakdown and final rankings</td><td style="text-align: center;">40</td></tr>
    <tr><td style="text-align: center;">Table 9.1</td><td>Technology stack of InternHub</td><td style="text-align: center;">41</td></tr>
    <tr><td style="text-align: center;">Table 9.2</td><td>Security and data protection safeguards</td><td style="text-align: center;">43</td></tr>
    <tr><td style="text-align: center;">Table 10.1</td><td>Levels of testing</td><td style="text-align: center;">44</td></tr>
    <tr><td style="text-align: center;">Table 10.2</td><td>Comprehensive test cases matrix (TC01 to TC18)</td><td style="text-align: center;">45</td></tr>
    <tr><td style="text-align: center;">Table 11.1</td><td>Quantitative performance benchmarks observed</td><td style="text-align: center;">47</td></tr>
    <tr><td style="text-align: center;">Table 13.1</td><td>Future enhancements roadmap</td><td style="text-align: center;">49</td></tr>
  </tbody>
</table>

<!-- ============================================================== -->
<!-- 8. LIST OF ABBREVIATIONS                                       -->
<!-- ============================================================== -->
<div class="page-break"></div>
<h1 class="chapter-head">LIST OF ABBREVIATIONS</h1>

<table class="report-table">
  <thead>
    <tr>
      <th style="width: 30%;">ABBREVIATION</th>
      <th style="width: 70%; text-align: left;">EXPANSION</th>
    </tr>
  </thead>
  <tbody>
    <tr><td style="text-align: center;"><b>AI</b></td><td>Artificial Intelligence</td></tr>
    <tr><td style="text-align: center;"><b>API</b></td><td>Application Programming Interface</td></tr>
    <tr><td style="text-align: center;"><b>CGPA</b></td><td>Cumulative Grade Point Average</td></tr>
    <tr><td style="text-align: center;"><b>CSS</b></td><td>Cascading Style Sheets</td></tr>
    <tr><td style="text-align: center;"><b>CRUD</b></td><td>Create, Read, Update, Delete</td></tr>
    <tr><td style="text-align: center;"><b>DFD</b></td><td>Data Flow Diagram</td></tr>
    <tr><td style="text-align: center;"><b>ER</b></td><td>Entity Relationship</td></tr>
    <tr><td style="text-align: center;"><b>FK</b></td><td>Foreign Key</td></tr>
    <tr><td style="text-align: center;"><b>HTML</b></td><td>HyperText Markup Language</td></tr>
    <tr><td style="text-align: center;"><b>HTTP</b></td><td>Hypertext Transfer Protocol</td></tr>
    <tr><td style="text-align: center;"><b>HTTPS</b></td><td>Hypertext Transfer Protocol Secure</td></tr>
    <tr><td style="text-align: center;"><b>IDE</b></td><td>Integrated Development Environment</td></tr>
    <tr><td style="text-align: center;"><b>IDF</b></td><td>Inverse Document Frequency</td></tr>
    <tr><td style="text-align: center;"><b>IEEE</b></td><td>Institute of Electrical and Electronics Engineers</td></tr>
    <tr><td style="text-align: center;"><b>JS</b></td><td>JavaScript</td></tr>
    <tr><td style="text-align: center;"><b>JSON</b></td><td>JavaScript Object Notation</td></tr>
    <tr><td style="text-align: center;"><b>JWT</b></td><td>JSON Web Token</td></tr>
    <tr><td style="text-align: center;"><b>LLM</b></td><td>Large Language Model</td></tr>
    <tr><td style="text-align: center;"><b>ML</b></td><td>Machine Learning</td></tr>
    <tr><td style="text-align: center;"><b>NLP</b></td><td>Natural Language Processing</td></tr>
    <tr><td style="text-align: center;"><b>PDF</b></td><td>Portable Document Format</td></tr>
    <tr><td style="text-align: center;"><b>PK</b></td><td>Primary Key</td></tr>
    <tr><td style="text-align: center;"><b>RAM</b></td><td>Random Access Memory</td></tr>
    <tr><td style="text-align: center;"><b>REST</b></td><td>Representational State Transfer</td></tr>
    <tr><td style="text-align: center;"><b>RLS</b></td><td>Row Level Security</td></tr>
    <tr><td style="text-align: center;"><b>SQL</b></td><td>Structured Query Language</td></tr>
    <tr><td style="text-align: center;"><b>SSD</b></td><td>Solid State Drive</td></tr>
    <tr><td style="text-align: center;"><b>TF-IDF</b></td><td>Term Frequency–Inverse Document Frequency</td></tr>
    <tr><td style="text-align: center;"><b>TTL</b></td><td>Time To Live</td></tr>
    <tr><td style="text-align: center;"><b>UI / UX</b></td><td>User Interface / User Experience</td></tr>
    <tr><td style="text-align: center;"><b>URL</b></td><td>Uniform Resource Locator</td></tr>
    <tr><td style="text-align: center;"><b>UUID</b></td><td>Universally Unique Identifier</td></tr>
  </tbody>
</table>

<!-- ============================================================== -->
<!-- CHAPTER 1: INTRODUCTION                                        -->
<!-- ============================================================== -->
<div class="page-break"></div>
<h1 class="chapter-head">CHAPTER 1<br>INTRODUCTION</h1>

<h2 class="section-head">1.1 BACKGROUND</h2>
<p>An internship is often a student's first real step from the classroom into the working world. It gives practical knowledge, a look at how an industry actually runs, and a chance to try a career before committing to it. After graduation the same search continues for entry-level jobs and graduate roles. For this reason almost every student in a technical course spends a good deal of time looking for opportunities.</p>

<p>The difficulty is not a shortage of openings. Hundreds of internships and jobs are posted every day on job portals, company websites and social platforms. The real difficulty is finding the few that suit one particular person. Most platforms show the same long list to everybody, whatever that person has studied, built or cares about. A student who is strong in Python and data analysis has to scroll past postings for accounting, sales and design before reaching the ones that matter.</p>

<p>Artificial Intelligence (AI) and Natural Language Processing (NLP) can help here. A computer can read a resume in a few seconds, understand which skills it mentions, and compare them with hundreds of job descriptions. InternHub is built on this idea.</p>

<h2 class="section-head">1.2 PROBLEM STATEMENT</h2>
<p>Students and job seekers often struggle to find suitable internships and jobs because they have to search several platforms by hand. They are also unsure which opportunities really match their skills, interests and career domain. Duplicate, outdated or incomplete listings make the search even harder. Table 1.1 summarises the main problems.</p>

<div class="table-caption">Table 1.1: Main problems faced by students and job seekers</div>
<table class="report-table">
  <thead>
    <tr>
      <th style="width: 25%;">Problem</th>
      <th style="width: 45%;">What happens today</th>
      <th style="width: 30%;">Effect on the student</th>
    </tr>
  </thead>
  <tbody>
    <tr><td><b>Manual searching</b></td><td>The student visits many portals one by one and repeats the same search on each.</td><td>A lot of time is spent before a single application is written.</td></tr>
    <tr><td><b>Unclear fit</b></td><td>Postings are not compared with the student's actual skills or interests.</td><td>The student cannot tell which opportunities are worth applying for.</td></tr>
    <tr><td><b>Duplicate listings</b></td><td>The same job appears on several portals under slightly different details.</td><td>The same posting is read again and again.</td></tr>
    <tr><td><b>Outdated listings</b></td><td>Some postings have expired or are missing the company, description or apply link.</td><td>Effort is wasted on openings that are closed or invalid.</td></tr>
    <tr><td><b>Unknown skill gaps</b></td><td>Nobody tells the student which required skills are missing from the resume.</td><td>The student does not know what to learn next.</td></tr>
    <tr><td><b>No tracking</b></td><td>Applications are noted in notebooks or spreadsheets, if at all.</td><td>Statuses and follow-ups are easily forgotten.</td></tr>
  </tbody>
</table>

<p>There is therefore a clear need for one system that reads a person's resume, collects current opportunities automatically, cleans the data, and recommends only the relevant ones.</p>

<h2 class="section-head">1.3 MOTIVATION</h2>
<p>As students ourselves, we have seen how much time goes into the search before a single application is even written. Much of that time is spent on work a computer can do better: comparing a long list of requirements against a resume, noticing that two postings are really the same job, or checking whether a listing has all the details needed to apply. We also noticed that many first-time applicants have no idea which skills they are missing. We wanted to build something that takes over this routine work, so that students can spend their time learning skills and preparing for interviews instead.</p>

<h2 class="section-head">1.4 OBJECTIVES</h2>
<p>The main objectives of the project, and how the system meets each of them, are given in Table 1.2.</p>

<div class="table-caption">Table 1.2: Objectives of the project</div>
<table class="report-table">
  <thead>
    <tr>
      <th style="width: 8%;">No.</th>
      <th style="width: 40%;">Objective</th>
      <th style="width: 52%;">How InternHub achieves it</th>
    </tr>
  </thead>
  <tbody>
    <tr><td style="text-align: center;">1</td><td>Automate resume and skill analysis</td><td>Reads the uploaded resume with NLP and extracts skills, projects, certifications and domain.</td></tr>
    <tr><td style="text-align: center;">2</td><td>Recommend suitable internships and jobs</td><td>Compares the student profile with every opportunity and ranks them by multi-factor match score.</td></tr>
    <tr><td style="text-align: center;">3</td><td>Reduce manual searching across platforms</td><td>Collects listings from several external APIs into one place.</td></tr>
    <tr><td style="text-align: center;">4</td><td>Provide personalised recommendations</td><td>Takes skills, domain, interests, location and work-mode preference into account.</td></tr>
    <tr><td style="text-align: center;">5</td><td>Identify skill gaps</td><td>Compares the skills a role needs with the skills in the profile and lists what is missing.</td></tr>
    <tr><td style="text-align: center;">6</td><td>Suggest resume and skill improvements</td><td>Gives specific tips based on the resume, target roles and the identified gaps.</td></tr>
    <tr><td style="text-align: center;">7</td><td>Provide application tracking</td><td>Lets the student save opportunities and follow each application through its stages.</td></tr>
    <tr><td style="text-align: center;">8</td><td>Keep opportunity data up to date</td><td>Fetches new listings periodically, updates changed ones and removes outdated ones.</td></tr>
  </tbody>
</table>

<h2 class="section-head">1.5 PROJECT OVERVIEW</h2>
<p>InternHub is an AI-powered web portal that gives personalised internship and job recommendations. The user creates an account, fills in a basic profile and uploads a resume. The system reads the resume, identifies the skills, domain and interests, and builds a structured profile.</p>

<p>In the background, InternHub collects current internships and jobs from external APIs. The data from different sources is converted into one common format, checked for missing information, and cleaned of duplicates. The remaining listings are compared with the user's profile and ranked by a match score. For each recommended opportunity the user can see the skills that are missing, receive suggestions for improving the resume, save the opportunity as a favourite, and track the application until the final outcome.</p>

<h2 class="section-head">1.6 PROJECT DOMAIN</h2>
<p>The primary domain of the project is Artificial Intelligence and Machine Learning. It also draws on the related areas listed in Table 1.3.</p>

<div class="table-caption">Table 1.3: Domains related to the project</div>
<table class="report-table">
  <thead>
    <tr>
      <th style="width: 35%;">Area</th>
      <th style="width: 65%;">Role in InternHub</th>
    </tr>
  </thead>
  <tbody>
    <tr><td><b>Natural Language Processing (NLP)</b></td><td>Reads resumes and job descriptions and extracts skills and domain.</td></tr>
    <tr><td><b>Recommendation systems</b></td><td>Ranks opportunities for each user using content-based filtering.</td></tr>
    <tr><td><b>Full-stack web development</b></td><td>Builds the user interface, the server logic and the database.</td></tr>
    <tr><td><b>API integration</b></td><td>Collects live opportunities from external sources through REST APIs.</td></tr>
    <tr><td><b>Data processing</b></td><td>Normalises, validates and de-duplicates the collected data.</td></tr>
    <tr><td><b>Information retrieval</b></td><td>Finds and ranks the most relevant listings using TF-IDF and cosine similarity.</td></tr>
  </tbody>
</table>

<h2 class="section-head">1.7 ORGANIZATION OF THE REPORT</h2>
<p>The report is organised into thirteen chapters, described in Table 1.4.</p>

<div class="table-caption">Table 1.4: Organization of the report</div>
<table class="report-table">
  <thead>
    <tr>
      <th style="width: 15%;">Chapter</th>
      <th style="width: 35%;">Title</th>
      <th style="width: 50%;">What it covers</th>
    </tr>
  </thead>
  <tbody>
    <tr><td style="text-align: center;">1</td><td>Introduction</td><td>Background, problem, motivation, objectives and domain.</td></tr>
    <tr><td style="text-align: center;">2</td><td>Literature Survey</td><td>Five related research papers and the research gap.</td></tr>
    <tr><td style="text-align: center;">3</td><td>Existing System</td><td>How people search today and the limits of that approach.</td></tr>
    <tr><td style="text-align: center;">4</td><td>Proposed System</td><td>The InternHub solution, its features and how it differs from existing work.</td></tr>
    <tr><td style="text-align: center;">5</td><td>System Requirements</td><td>Hardware, software, functional and non-functional requirements.</td></tr>
    <tr><td style="text-align: center;">6</td><td>System Design</td><td>Architecture, workflow, API routes and database design.</td></tr>
    <tr><td style="text-align: center;">7</td><td>Modules</td><td>The main modules and what each one does.</td></tr>
    <tr><td style="text-align: center;">8</td><td>Algorithms and Techniques</td><td>NLP, TF-IDF, cosine similarity, duplicate detection and skill-gap logic.</td></tr>
    <tr><td style="text-align: center;">9</td><td>Implementation</td><td>Technology stack and how each layer is built and secured.</td></tr>
    <tr><td style="text-align: center;">10</td><td>Testing</td><td>Testing strategy and planned test cases.</td></tr>
    <tr><td style="text-align: center;">11</td><td>Results &amp; Discussion</td><td>Interface outputs, performance benchmarks and user benefits.</td></tr>
    <tr><td style="text-align: center;">12</td><td>Conclusion</td><td>Summary of the work.</td></tr>
    <tr><td style="text-align: center;">13</td><td>Future Enhancement</td><td>Directions for extending the project.</td></tr>
  </tbody>
</table>

<!-- ============================================================== -->
<!-- CHAPTER 2: LITERATURE SURVEY                                   -->
<!-- ============================================================== -->
<div class="page-break"></div>
<h1 class="chapter-head">CHAPTER 2<br>LITERATURE SURVEY</h1>

<h2 class="section-head">2.1 OVERVIEW</h2>
<p>Before designing InternHub, we studied five recent research papers on internship matching and recommendation. The aim was to learn which techniques other researchers have used, what worked well, and where gaps remain. Each paper is described in a table below, followed by a summary and the research gap that InternHub tries to fill.</p>

<h2 class="section-head">2.2 PAPER 1: AI-BASED INTERNSHIP RECOMMENDATION SYSTEM</h2>
<div class="table-caption">Table 2.1: Details of Paper 1</div>
<table class="report-table">
  <tbody>
    <tr><td style="width: 25%;"><b>Title</b></td><td style="width: 75%;">AI-Based Internship Recommendation System</td></tr>
    <tr><td><b>Authors</b></td><td>P. Madhavi Reddy, Geethanjali B. S., Shivang Karol, Vaishakh Pavan Ganesh R., R. Jennie Bharathi</td></tr>
    <tr><td><b>Publication</b></td><td>IEEE Xplore, Vol. 12, published 18 March 2024</td></tr>
    <tr><td><b>Methodology</b></td><td>The student registers and enters academic details, skills and preferences. The system pre-processes this data and extracts features such as skills, education and domain. AI-based recommendation algorithms then compare the student's profile with the internship requirements using content-based filtering and semantic analysis.</td></tr>
    <tr><td><b>Merits</b></td><td>Gives personalised recommendations based on skills and interests. Reduces the time needed to find a suitable internship and improves accuracy using AI techniques. Offers a better user experience through relevant suggestions.</td></tr>
    <tr><td><b>Demerits</b></td><td>Performance depends on manual data quality. Lacks automated resume parsing and does not connect to live external APIs.</td></tr>
  </tbody>
</table>

<h2 class="section-head">2.3 PAPER 2: TECHTRACK – AN INTERNSHIP MATCHING PLATFORM</h2>
<div class="table-caption">Table 2.2: Details of Paper 2</div>
<table class="report-table">
  <tbody>
    <tr><td style="width: 25%;"><b>Title</b></td><td style="width: 75%;">TechTrack: An Internship Matching Platform for Career Recommendation Using Machine Learning</td></tr>
    <tr><td><b>Publication</b></td><td>2026 11th International Conference on Business and Industrial Research (ICBIR), IEEE. DOI: 10.1109/ICBIR69932.2026.11584730</td></tr>
    <tr><td><b>Methodology</b></td><td>TechTrack uses machine learning to match students with suitable internships and careers based on coursework, academic history, and early technical specializations, providing data-driven career guidance.</td></tr>
    <tr><td><b>Merits</b></td><td>Provides accurate and personalised recommendations based on students' skills. Enhances overall internship search and advising experience.</td></tr>
    <tr><td><b>Demerits</b></td><td>Requires manual entry; evaluates against closed institutional datasets rather than dynamic live market listings.</td></tr>
  </tbody>
</table>

<h2 class="section-head">2.4 PAPER 3: AI-DRIVEN INTERNSHIP MATCHING USING SKILL-BASED RECOMMENDATION</h2>
<div class="table-caption">Table 2.3: Details of Paper 3</div>
<table class="report-table">
  <tbody>
    <tr><td style="width: 25%;"><b>Title</b></td><td style="width: 75%;">AI-Driven Internship Matching Using Skill-Based Recommendation System</td></tr>
    <tr><td><b>Authors</b></td><td>Soorya Mol S. (PG Scholar) and Merin Manoj (Assistant Professor), Amal Jyothi College of Engineering</td></tr>
    <tr><td><b>Publication</b></td><td>Proceedings of the National Conference on Emerging Computer Applications (NCECA) 2026, Vol. 7, Issue 1</td></tr>
    <tr><td><b>Methodology</b></td><td>Proposes a skill-based recommendation system that matches a student's skills and profile with suitable internships using normalized feature vectors.</td></tr>
    <tr><td><b>Merits</b></td><td>Improves matching efficiency and helps students find suitable internships quickly based on skill relevance.</td></tr>
    <tr><td><b>Demerits</b></td><td>Sensitive to non-standard spelling or informal syntax; lacks live API feeds and post-match application tracking.</td></tr>
  </tbody>
</table>

<div class="page-break"></div>
<h2 class="section-head">2.5 PAPER 4: AI-BASED INTERNSHIP ENGINE FOR THE PM INTERNSHIP SCHEME</h2>
<div class="table-caption">Table 2.4: Details of Paper 4</div>
<table class="report-table">
  <tbody>
    <tr><td style="width: 25%;"><b>Title</b></td><td style="width: 75%;">AI-Based Internship Recommendation Engine for the PM Internship Scheme</td></tr>
    <tr><td><b>Authors</b></td><td>D. Rosy Salomi Victoria, Gokulraj L., Hem Kumar R., S. Roselin Mary, Nithya Roseline S.</td></tr>
    <tr><td><b>Publication</b></td><td>IEEE Conference Publication, 2026. DOI: 10.1109/ICESIC67389.2026.11496549</td></tr>
    <tr><td><b>Methodology</b></td><td>Presents an AI-based engine that recommends internships under the national PM Internship Scheme by matching candidate profiles with institutional requirements at scale.</td></tr>
    <tr><td><b>Merits</b></td><td>Automates candidate matching at a national scale, substantially reducing administrative shortlisting overhead.</td></tr>
    <tr><td><b>Demerits</b></td><td>Tailored to governmental quotas; lacks fine-grained software engineering skill taxonomies and automated PDF resume parsing.</td></tr>
  </tbody>
</table>

<h2 class="section-head">2.6 PAPER 5: SMART INTERNSHIP RECOMMENDER (IRJMETS, 2026)</h2>
<div class="table-caption">Table 2.5: Details of Paper 5</div>
<table class="report-table">
  <tbody>
    <tr><td style="width: 25%;"><b>Title</b></td><td style="width: 75%;">Smart Internship Recommender</td></tr>
    <tr><td><b>Authors</b></td><td>Apoorva Busad, Gopal Ujjwal Shankar, Dhanush S., Doddabasvaraj Abbigeri, Nandish Patil, Darshana KM</td></tr>
    <tr><td><b>Publication</b></td><td>International Research Journal of Modernization in Engineering Technology and Science (IRJMETS), Vol. 08, Issue 01, January 2026, pp. 2733–2739. e-ISSN: 2582-5208</td></tr>
    <tr><td><b>Methodology</b></td><td>Developed using Java J2EE (Servlets, JSP, JDBC, MySQL). Implements a deterministic weighted scoring model combining skill relevance and academic CGPA: FinalScore = alpha * SkillScore + beta * AcademicScore.</td></tr>
    <tr><td><b>Merits</b></td><td>High explainability and computational efficiency (O(N*M) linear complexity) without requiring black-box deep learning.</td></tr>
    <tr><td><b>Demerits</b></td><td>Requires manual entry of comma-separated skill strings; lacks synonym alias normalization and live multi-source API integration.</td></tr>
  </tbody>
</table>

<h2 class="section-head">2.7 SUMMARY OF THE SURVEY</h2>
<div class="table-caption">Table 2.6: Summary and comparison of the literature survey</div>
<table class="report-table">
  <thead>
    <tr>
      <th style="width: 8%;">No.</th>
      <th style="width: 32%;">Paper</th>
      <th style="width: 35%;">Main idea</th>
      <th style="width: 25%;">Common limitation</th>
    </tr>
  </thead>
  <tbody>
    <tr><td style="text-align: center;">1</td><td>AI-Based Internship (IEEE, 2024)</td><td>Content-based filtering &amp; semantic analysis</td><td>Manual profile entry; static data</td></tr>
    <tr><td style="text-align: center;">2</td><td>TechTrack (ICBIR, 2026)</td><td>ML-based career matching</td><td>Needs manual questionnaires</td></tr>
    <tr><td style="text-align: center;">3</td><td>AI-Driven Matching (NCECA, 2026)</td><td>Skill-based vector matching</td><td>Brittle to syntax variations</td></tr>
    <tr><td style="text-align: center;">4</td><td>PM Internship Engine (IEEE, 2026)</td><td>National-scale profile matching</td><td>Tailored to institutional quotas</td></tr>
    <tr><td style="text-align: center;">5</td><td>Smart Recommender (IRJMETS, 2026)</td><td>Deterministic weighted matching</td><td>Manual inputs; no live APIs</td></tr>
  </tbody>
</table>

<h2 class="section-head">2.8 RESEARCH GAP</h2>
<p>The papers agree on one point: matching a student's skills with internship requirements gives far better results than a plain keyword search. They also share critical weaknesses: each depends heavily on manual data entry or closed offline datasets, and they concentrate solely on the matching step itself.</p>

<p>Little attention is paid to the full practical journey: building profiles automatically from uploaded resumes, rejecting spurious non-resume documents (such as fee receipts), aggregating live opportunities across multiple APIs, purging dead and duplicate listings, detecting deceptive recruitment scams, diagnosing skill gaps with sequential learning roadmaps, and providing persistent lifecycle tracking. InternHub unites this complete journey into a single platform.</p>

<!-- ============================================================== -->
<!-- CHAPTER 3: EXISTING SYSTEM                                     -->
<!-- ============================================================== -->
<div class="page-break"></div>
<h1 class="chapter-head">CHAPTER 3<br>EXISTING SYSTEM</h1>

<h2 class="section-head">3.1 OVERVIEW</h2>
<p>At present, students rely on general job portals, company career pages, social networking sites and college notice boards to find internships and jobs. A typical user creates accounts on several portals, types in a few keywords, and then opens listing after listing to read the requirements. Some portals send email alerts, but these are usually based on a job title or location the user typed in, not on the actual content of the resume.</p>

<h2 class="section-head">3.2 LIMITATIONS OF THE EXISTING SYSTEM</h2>
<div class="table-caption">Table 3.1: Limitations of the existing system</div>
<table class="report-table">
  <thead>
    <tr>
      <th style="width: 30%;">Limitation</th>
      <th style="width: 70%;">Description</th>
    </tr>
  </thead>
  <tbody>
    <tr><td><b>No personalisation</b></td><td>Portals mostly show opportunities as simple lists. They do not consider the user's skills, interests or career goals, so many irrelevant postings appear.</td></tr>
    <tr><td><b>Keyword-based matching</b></td><td>Most systems look for the exact words the user typed. A relevant opportunity with a different job title is easily missed.</td></tr>
    <tr><td><b>Manual search across platforms</b></td><td>Users must search, filter and compare postings on each platform themselves, which is slow and tiring.</td></tr>
    <tr><td><b>Cold-start and data sparsity</b></td><td>Traditional recommenders do not work well for new users with no history, and they adapt slowly when interests change.</td></tr>
    <tr><td><b>Duplicate, outdated or incomplete listings</b></td><td>The same job may appear several times, and some listings lack key details or have already closed.</td></tr>
    <tr><td><b>No scam / fraud protection</b></td><td>Aggregators do not verify whether postings demand upfront fees or unvetted messaging channels.</td></tr>
    <tr><td><b>No skill-gap guidance</b></td><td>Users are not told which skills they lack for the roles they want.</td></tr>
    <tr><td><b>No place to track applications</b></td><td>Applications are recorded in notebooks or spreadsheets, so statuses and follow-ups are often lost.</td></tr>
  </tbody>
</table>

<h2 class="section-head">3.3 NEED FOR A NEW SYSTEM</h2>
<p>These limitations show the need for a single system that understands the user first, collects current opportunities on its own, cleans and checks them, and then recommends only what truly fits. InternHub is designed to fill this gap.</p>

<!-- ============================================================== -->
<!-- CHAPTER 4: PROPOSED SYSTEM                                     -->
<!-- ============================================================== -->
<div class="page-break"></div>
<h1 class="chapter-head">CHAPTER 4<br>PROPOSED SYSTEM</h1>

<h2 class="section-head">4.1 OVERVIEW</h2>
<p>InternHub is an AI-powered web portal that analyses a user's resume and profile to understand their skills, domain, interests and strengths. It then collects available internships and jobs from external sources, validates and processes the data, and recommends the opportunities that best fit the user's profile.</p>

<p>The platform also shows the skills the user is missing, suggests how to improve the resume, lets the user save favourites, and keeps a history of applications with their current status. By bringing together AI, NLP and live data, InternHub offers one place for opportunity discovery and career guidance.</p>

<h2 class="section-head">4.2 KEY FEATURES</h2>
<div class="table-caption">Table 4.1: Key features of InternHub</div>
<table class="report-table">
  <thead>
    <tr>
      <th style="width: 30%;">Feature</th>
      <th style="width: 70%;">Description</th>
    </tr>
  </thead>
  <tbody>
    <tr><td><b>Secure sign-up and login</b></td><td>Registration and authentication using Supabase Authentication with Row Level Security (RLS).</td></tr>
    <tr><td><b>Resume upload and analysis</b></td><td>PDF resumes are read automatically; skills, languages, frameworks, tools and projects are extracted.</td></tr>
    <tr><td><b>Spurious document guardrail</b></td><td>Heuristic patterns automatically reject non-resume uploads such as tuition receipts and bills.</td></tr>
    <tr><td><b>Domain and interest detection</b></td><td>The suitable career domain (e.g., Web Development, Data Science, AI/ML) is identified from the resume.</td></tr>
    <tr><td><b>Multi-source collection</b></td><td>Listings are fetched automatically from several live APIs (JobDataAPI, Jooble, Adzuna, Remotive, Arbeitnow).</td></tr>
    <tr><td><b>Validation and deduplication</b></td><td>Incomplete listings are checked, dead links purged, and cross-source duplicates eliminated.</td></tr>
    <tr><td><b>Scam &amp; Trust Score</b></td><td>Evaluates listings against fraudulent patterns and outputs an objective Trust Score (0–100%).</td></tr>
    <tr><td><b>Multi-factor match score</b></td><td>Combines Core Skills (50%), Preferred Skills (15%), Role Alignment (20%), and Preferences (5%).</td></tr>
    <tr><td><b>Skill-gap analysis &amp; roadmaps</b></td><td>Missing skills are highlighted alongside 4-phase sequential technology learning roadmaps.</td></tr>
    <tr><td><b>Application tracking</b></td><td>Tracks applications across Saved, Applied, Interview, Selected, Rejected, and Withdrawn.</td></tr>
  </tbody>
</table>

<h2 class="section-head">4.3 ADVANTAGES OF THE PROPOSED SYSTEM</h2>
<div class="table-caption">Table 4.2: Advantages of the proposed system</div>
<table class="report-table">
  <thead>
    <tr>
      <th style="width: 35%;">Advantage</th>
      <th style="width: 65%;">Benefit to the user</th>
    </tr>
  </thead>
  <tbody>
    <tr><td><b>One place for all sources</b></td><td>No need to visit several platforms and repeat the same search.</td></tr>
    <tr><td><b>Meaning-based matching</b></td><td>Results depend on the user's skills and not only on the words typed in a search box.</td></tr>
    <tr><td><b>Cleaner &amp; verified data</b></td><td>Duplicates and scam postings are reduced, ensuring safer and faster applications.</td></tr>
    <tr><td><b>Clear next steps</b></td><td>The user knows exactly which skills to learn and what to change in the resume.</td></tr>
    <tr><td><b>Everything organised</b></td><td>Saved opportunities and applications are kept together with their history.</td></tr>
    <tr><td><b>Modular and extensible</b></td><td>New job sources or matching algorithms can be integrated without redesigning the architecture.</td></tr>
  </tbody>
</table>

<h2 class="section-head">4.4 EXISTING SYSTEM VERSUS PROPOSED SYSTEM</h2>
<div class="table-caption">Table 4.3: Existing system compared with InternHub</div>
<table class="report-table">
  <thead>
    <tr>
      <th style="width: 25%;">Aspect</th>
      <th style="width: 35%;">Existing system</th>
      <th style="width: 40%;">InternHub (proposed)</th>
    </tr>
  </thead>
  <tbody>
    <tr><td><b>Search basis</b></td><td>Keywords typed by the user</td><td>Skills, domain and interests extracted from the resume</td></tr>
    <tr><td><b>Sources</b></td><td>One portal at a time</td><td>Several live APIs combined in one place</td></tr>
    <tr><td><b>Results</b></td><td>Generic lists for everybody</td><td>Personalised, ranked by multi-factor match score</td></tr>
    <tr><td><b>Skill understanding</b></td><td>Exact word matching</td><td>TF-IDF with cosine similarity &amp; canonical alias normalizer</td></tr>
    <tr><td><b>Duplicates &amp; scams</b></td><td>Appear repeatedly; unvetted</td><td>Validated, deduplicated, and scored for safety</td></tr>
    <tr><td><b>Skill guidance</b></td><td>None</td><td>Skill-gap analysis and dynamic roadmaps</td></tr>
    <tr><td><b>Tracking</b></td><td>Manual, outside the platform</td><td>Built-in application tracking with six statuses</td></tr>
  </tbody>
</table>

<div class="page-break"></div>
<h2 class="section-head">4.5 HOW INTERNHUB DIFFERS FROM EXISTING PROJECTS</h2>
<p>Figure 4.1 shows the main conceptual difference: existing portals focus strictly on the keyword-matching step, whereas InternHub manages the candidate's complete recruitment journey from initial PDF upload to final placement outcome.</p>

<div class="figure-box">
  <div style="background:#f8fafc; border:1px solid #cbd5e1; padding:15px; border-radius:6px; display:inline-block; text-align:left; font-size:10pt;">
    <b>Existing Approach:</b><br>
    [Visit Many Portals] &rarr; [Type Keywords] &rarr; [Read Generic Lists] &rarr; [Manual Tracking]<br><br>
    <b>InternHub Approach:</b><br>
    [Upload PDF] &rarr; [NLP Skill &amp; Bill Extraction] &rarr; [Live Multi-API Aggregator] &rarr; [Deduplicate &amp; Trust Score] &rarr; [Multi-Factor Matching] &rarr; [Skill-Gap Roadmap] &rarr; [6-Stage Tracker]
  </div>
  <div class="figure-caption">Figure 4.1: Existing approach compared with the InternHub workflow pipeline</div>
</div>

<div class="table-caption">Table 4.4: Feature comparison with existing work</div>
<table class="report-table">
  <thead>
    <tr>
      <th style="width: 30%;">Feature</th>
      <th style="width: 22%;">General job portals</th>
      <th style="width: 25%;">Surveyed papers [1]–[5]</th>
      <th style="width: 23%;">InternHub</th>
    </tr>
  </thead>
  <tbody>
    <tr><td><b>Automatic Profile from PDF</b></td><td>No; user types info</td><td>Manual entry in all 5 papers</td><td><b>Yes (PDF NLP Parser)</b></td></tr>
    <tr><td><b>Spurious Bill Rejection</b></td><td>None</td><td>Not described</td><td><b>Yes (Heuristic Filter)</b></td></tr>
    <tr><td><b>Skill Matching with Score</b></td><td>Mostly keyword queries</td><td>Yes (main focus of papers)</td><td><b>Yes (Multi-Factor Formula)</b></td></tr>
    <tr><td><b>Live Multi-Source APIs</b></td><td>Own listings only</td><td>Static offline datasets</td><td><b>Yes (5 Live APIs)</b></td></tr>
    <tr><td><b>Scam / Fraud Trust Score</b></td><td>Reactive reporting</td><td>Not addressed</td><td><b>Yes (Trust Score 0–100)</b></td></tr>
    <tr><td><b>Skill Gap &amp; Roadmap</b></td><td>No</td><td>Not described</td><td><b>Yes (Visual Diagnostics)</b></td></tr>
    <tr><td><b>Built-in Application Tracker</b></td><td>Manual, outside portal</td><td>Not supported</td><td><b>Yes (6 Status States)</b></td></tr>
  </tbody>
</table>

<!-- ============================================================== -->
<!-- CHAPTER 5: SYSTEM REQUIREMENTS SPECIFICATION                   -->
<!-- ============================================================== -->
<div class="page-break"></div>
<h1 class="chapter-head">CHAPTER 5<br>SYSTEM REQUIREMENTS SPECIFICATION</h1>

<h2 class="section-head">5.1 HARDWARE REQUIREMENTS</h2>
<div class="table-caption">Table 5.1: Hardware requirements</div>
<table class="report-table">
  <thead>
    <tr>
      <th style="width: 35%;">Component</th>
      <th style="width: 65%;">Requirement</th>
    </tr>
  </thead>
  <tbody>
    <tr><td><b>Processor</b></td><td>Intel Core i5 / AMD Ryzen 5 or above (4 Cores, 2.5 GHz)</td></tr>
    <tr><td><b>RAM</b></td><td>8 GB minimum (16 GB recommended for concurrent services)</td></tr>
    <tr><td><b>Storage</b></td><td>256 GB SSD with at least 10 GB free space</td></tr>
    <tr><td><b>Network</b></td><td>High-speed internet connection (&ge; 10 Mbps)</td></tr>
    <tr><td><b>Display</b></td><td>Any screen that can run a modern web browser (1080p recommended)</td></tr>
  </tbody>
</table>

<h2 class="section-head">5.2 SOFTWARE REQUIREMENTS</h2>
<div class="table-caption">Table 5.2: Software requirements</div>
<table class="report-table">
  <thead>
    <tr>
      <th style="width: 35%;">Component</th>
      <th style="width: 65%;">Requirement</th>
    </tr>
  </thead>
  <tbody>
    <tr><td><b>Operating system</b></td><td>Windows 10 / 11 (64-bit) or Linux Ubuntu 22.04 LTS</td></tr>
    <tr><td><b>Frontend framework</b></td><td>React.js (v19.0.0), Vite (v8.0.0), TypeScript, Tailwind CSS v4</td></tr>
    <tr><td><b>Backend framework</b></td><td>Node.js (v22.0.0+ LTS), Express.js (v4.21.0)</td></tr>
    <tr><td><b>AI / ML engine</b></td><td>Python (v3.11+), spaCy, scikit-learn</td></tr>
    <tr><td><b>Resume text extractor</b></td><td>PyMuPDF (fitz) or pdfplumber</td></tr>
    <tr><td><b>Database &amp; Storage</b></td><td>PostgreSQL hosted on Supabase Cloud</td></tr>
    <tr><td><b>Authentication</b></td><td>Supabase Auth (JWT Bearer tokens) with Row Level Security</td></tr>
    <tr><td><b>External API integration</b></td><td>JobDataAPI, Jooble, Adzuna, Remotive, Arbeitnow</td></tr>
    <tr><td><b>Web Browser</b></td><td>Google Chrome, Microsoft Edge, or Mozilla Firefox</td></tr>
  </tbody>
</table>

<h2 class="section-head">5.3 FUNCTIONAL REQUIREMENTS</h2>
<div class="table-caption">Table 5.3: Functional requirements</div>
<table class="report-table">
  <thead>
    <tr>
      <th style="width: 10%;">ID</th>
      <th style="width: 20%;">Area</th>
      <th style="width: 70%;">The system should be able to…</th>
    </tr>
  </thead>
  <tbody>
    <tr><td style="text-align: center;">FR1</td><td>Accounts</td><td>Let a user register, log in securely and manage a profile with domain, interests, location and work mode.</td></tr>
    <tr><td style="text-align: center;">FR2</td><td>Resume</td><td>Accept a resume in PDF format (up to 10 MB) and read text streams safely into memory.</td></tr>
    <tr><td style="text-align: center;">FR3</td><td>Guardrail</td><td>Identify and reject spurious non-resume uploads (such as tuition fee receipts and financial bills).</td></tr>
    <tr><td style="text-align: center;">FR4</td><td>Resume NLP</td><td>Extract skills, programming languages, frameworks, tools and projects, and normalize aliases to canonical names.</td></tr>
    <tr><td style="text-align: center;">FR5</td><td>Aggregation</td><td>Fetch internships and jobs automatically from multiple live recruitment APIs.</td></tr>
    <tr><td style="text-align: center;">FR6</td><td>Normalization</td><td>Convert every external API response into one standardized schema and strip HTML tags.</td></tr>
    <tr><td style="text-align: center;">FR7</td><td>Deduplication</td><td>Check each listing for key details and remove duplicates across disparate sources using composite hashing.</td></tr>
    <tr><td style="text-align: center;">FR8</td><td>Trust Scoring</td><td>Evaluate descriptions for scam keywords and compute an automated Trust Score (0–100%).</td></tr>
    <tr><td style="text-align: center;">FR9</td><td>Matching</td><td>Calculate a multi-factor match score between the profile and each opportunity and rank the results.</td></tr>
    <tr><td style="text-align: center;">FR10</td><td>Guidance</td><td>Show missing skills and generate a dynamic sequential learning roadmap for the candidate.</td></tr>
    <tr><td style="text-align: center;">FR11</td><td>Tracking</td><td>Enable saving favourites and tracking applications across Saved, Applied, Interview, Selected, Rejected, Withdrawn.</td></tr>
    <tr><td style="text-align: center;">FR12</td><td>Updates</td><td>Refresh opportunity data periodically via in-memory caching and mirror availability checks.</td></tr>
  </tbody>
</table>

<h2 class="section-head">5.4 NON-FUNCTIONAL REQUIREMENTS</h2>
<div class="table-caption">Table 5.4: Non-functional requirements</div>
<table class="report-table">
  <thead>
    <tr>
      <th style="width: 30%;">Requirement</th>
      <th style="width: 70%;">Description</th>
    </tr>
  </thead>
  <tbody>
    <tr><td><b>Usability</b></td><td>Clean, responsive single-page interface with accessible contrast and intuitive navigation on desktop and mobile.</td></tr>
    <tr><td><b>Security</b></td><td>JWT session authentication, protected environment API keys, and PostgreSQL Row Level Security (RLS).</td></tr>
    <tr><td><b>Performance</b></td><td>End-to-end recommendation rendering in under 2.5 seconds; in-memory 5-minute TTL caching for fast repeated queries.</td></tr>
    <tr><td><b>Reliability</b></td><td>Graceful degradation: if one external API fails, other providers continue unaffected without throwing server crashes.</td></tr>
    <tr><td><b>Maintainability</b></td><td>Decoupled frontend, backend aggregation, AI microservice, and database layers for modular updates.</td></tr>
    <tr><td><b>Explainability</b></td><td>Every recommendation exposes an explicit mathematical breakdown of matched vs. missing skills.</td></tr>
    <tr><td><b>Data Freshness</b></td><td>Live mirror sync purges dead or closed vacancies to ensure applicants apply only to active roles.</td></tr>
  </tbody>
</table>

<!-- ============================================================== -->
<!-- CHAPTER 6: SYSTEM DESIGN                                       -->
<!-- ============================================================== -->
<div class="page-break"></div>
<h1 class="chapter-head">CHAPTER 6<br>SYSTEM DESIGN</h1>

<h2 class="section-head">6.1 SYSTEM ARCHITECTURE</h2>
<p>InternHub follows a layered, service-based cloud architecture. The presentation tier runs in modern web browsers using React 19, TypeScript, and Vite. The backend API gateway (Node.js and Express.js) orchestrates multi-provider live API aggregation, data cleansing, deduplication, and trust scoring. A dedicated Python NLP microservice executes document extraction, section parsing, and role prediction. Relational persistence and security are managed by Supabase PostgreSQL protected by Row Level Security (RLS).</p>

<div class="figure-box">
  <img src="{arch_path}" alt="System Architecture Diagram">
  <div class="figure-caption">Figure 6.1: Architecture diagram of InternHub</div>
</div>

<h2 class="section-head">6.2 COMPONENTS OF THE ARCHITECTURE</h2>
<div class="table-caption">Table 6.1: Components of the architecture</div>
<table class="report-table">
  <thead>
    <tr>
      <th style="width: 25%;">Component</th>
      <th style="width: 30%;">Technology</th>
      <th style="width: 45%;">Responsibility</th>
    </tr>
  </thead>
  <tbody>
    <tr><td><b>Frontend</b></td><td>React 19, Vite, Tailwind CSS v4</td><td>Responsive UI for dashboard, opportunities, resume upload, skill gap, and tracker.</td></tr>
    <tr><td><b>Backend API</b></td><td>Node.js, Express.js</td><td>Receives requests, queries live APIs, cleans data, computes trust, and coordinates workflows.</td></tr>
    <tr><td><b>AI / NLP service</b></td><td>Python, spaCy, PyMuPDF, scikit-learn</td><td>Extracts text, identifies skills, filters non-resumes, and predicts career roles.</td></tr>
    <tr><td><b>Database</b></td><td>PostgreSQL on Supabase</td><td>Persists profiles, applications, saved jobs, and cache tables with Row Level Security.</td></tr>
    <tr><td><b>Authentication</b></td><td>Supabase Auth</td><td>Registers and signs in users with JWT bearer tokens.</td></tr>
    <tr><td><b>External data</b></td><td>Adzuna, Jooble, JobDataAPI, Remotive</td><td>Provide live, authentic tech internship and job openings.</td></tr>
  </tbody>
</table>

<h2 class="section-head">6.3 SYSTEM WORKFLOW AND DATA FLOW</h2>
<p>Figure 6.2 illustrates the Data Flow Diagram (DFD) Level 0 Context Diagram showing core boundaries between the Student, InternHub Platform, Live External APIs, and Supabase PostgreSQL Database.</p>

<div class="figure-box">
  <img src="{dfd0_path}" alt="DFD Level 0 Context Diagram">
  <div class="figure-caption">Figure 6.2: Data Flow Diagram (DFD) Level 0: Context Diagram</div>
</div>

<div class="page-break"></div>
<p>Figure 6.3 details the DFD Level 1 System Operational Data Flow, decomposing the architecture into six distinct functional processes and datastores.</p>

<div class="figure-box">
  <img src="{dfd1_path}" alt="DFD Level 1 Operational Data Flow">
  <div class="figure-caption">Figure 6.3: Data Flow Diagram (DFD) Level 1: System Operational Data Flow</div>
</div>

<div class="table-caption">Table 6.2: Stages of the system workflow</div>
<table class="report-table">
  <thead>
    <tr>
      <th style="width: 10%;">Step</th>
      <th style="width: 30%;">Stage</th>
      <th style="width: 60%;">What happens</th>
    </tr>
  </thead>
  <tbody>
    <tr><td style="text-align: center;">1</td><td>Registration / login</td><td>The user creates an account or signs in and reaches the dashboard.</td></tr>
    <tr><td style="text-align: center;">2</td><td>Resume upload</td><td>The user uploads a PDF resume; the file is streamed to the server.</td></tr>
    <tr><td style="text-align: center;">3</td><td>Text extraction</td><td>Plain text is extracted from the PDF using PyMuPDF.</td></tr>
    <tr><td style="text-align: center;">4</td><td>Heuristic bill filter</td><td>Scans for tuition fee keywords; halts and alerts if non-resume document detected.</td></tr>
    <tr><td style="text-align: center;">5</td><td>AI / NLP analysis</td><td>Text is parsed for technical skills, normalized via aliases, and roles predicted.</td></tr>
    <tr><td style="text-align: center;">6</td><td>Structured profile</td><td>The extracted information is saved into the candidate's Supabase profile.</td></tr>
    <tr><td style="text-align: center;">7</td><td>External job APIs</td><td>The backend requests current postings concurrently from live APIs.</td></tr>
    <tr><td style="text-align: center;">8</td><td>Normalization &amp; Dedup</td><td>Each API response is standardized, sanitized, and deduplicated.</td></tr>
    <tr><td style="text-align: center;">9</td><td>Trust score engine</td><td>Evaluates postings for fraudulent patterns (upfront fees, Telegram/WhatsApp).</td></tr>
    <tr><td style="text-align: center;">10</td><td>Multi-factor matching</td><td>Calculates explainable match score (Core 50% + Role 20% + Pref 15%).</td></tr>
    <tr><td style="text-align: center;">11</td><td>Skill-gap &amp; roadmap</td><td>Identifies missing competencies and outlines sequential study milestones.</td></tr>
    <tr><td style="text-align: center;">12</td><td>Save / apply / track</td><td>Candidate saves opportunities, applies on employer portal, and tracks stages.</td></tr>
  </tbody>
</table>

<h2 class="section-head">6.4 BACKEND API ROUTES</h2>
<div class="table-caption">Table 6.3: API routes of the backend</div>
<table class="report-table">
  <thead>
    <tr>
      <th style="width: 35%;">Route</th>
      <th style="width: 65%;">Purpose</th>
    </tr>
  </thead>
  <tbody>
    <tr><td><b>/api/auth/*</b></td><td>Registration, login and session JWT handling via Supabase Auth.</td></tr>
    <tr><td><b>/api/profile/*</b></td><td>View and update user profile, academic standing, domain, and preferences.</td></tr>
    <tr><td><b>/api/resume/*</b></td><td>Upload PDF resume, trigger NLP extraction, and reject fee receipts.</td></tr>
    <tr><td><b>/api/opportunities/*</b></td><td>Query live external APIs, filter by city/country/work-mode, and deduplicate.</td></tr>
    <tr><td><b>/api/recommendations/*</b></td><td>Calculate multi-factor match scores and return ranked recommendations.</td></tr>
    <tr><td><b>/api/skill-gap/*</b></td><td>Isolate missing technologies for chosen roles and generate roadmaps.</td></tr>
    <tr><td><b>/api/saved/*</b></td><td>Save, list and remove bookmarked opportunities in PostgreSQL.</td></tr>
    <tr><td><b>/api/applications/*</b></td><td>Create, read, update and delete applications and manage tracking states.</td></tr>
  </tbody>
</table>

<div class="page-break"></div>
<h2 class="section-head">6.5 DATABASE DESIGN AND RELATIONAL SCHEMA</h2>
<p>InternHub utilizes PostgreSQL hosted on Supabase. Relational integrity is enforced with primary and foreign keys, while access security is guaranteed via Row Level Security (RLS) policies tied to <code>auth.uid()</code>.</p>

<div class="table-caption">Table 6.4: Database tables and their purpose</div>
<table class="report-table">
  <thead>
    <tr>
      <th style="width: 25%;">Table</th>
      <th style="width: 50%;">Purpose</th>
      <th style="width: 25%;">Linked to</th>
    </tr>
  </thead>
  <tbody>
    <tr><td><b>auth.users</b></td><td>Supabase cryptographic user identity store.</td><td>Root authentication table</td></tr>
    <tr><td><b>profiles</b></td><td>Candidate skills array, domain, academic CGPA, and preferences.</td><td>auth.users (1:1)</td></tr>
    <tr><td><b>applications</b></td><td>Application lifecycle records (Applied, Interview, Selected, etc.).</td><td>auth.users (1:N)</td></tr>
    <tr><td><b>saved_jobs</b></td><td>Bookmarked opportunities stored with complete JSONB payload.</td><td>auth.users (1:N)</td></tr>
    <tr><td><b>internships</b></td><td>Server-side mirror cache for aggregated live opportunities.</td><td>Read-only public authenticated</td></tr>
  </tbody>
</table>

<div class="table-caption">Table 6.5: Structure of the profiles table</div>
<table class="report-table">
  <thead>
    <tr>
      <th style="width: 25%;">Field</th>
      <th style="width: 30%;">Data type</th>
      <th style="width: 45%;">Description</th>
    </tr>
  </thead>
  <tbody>
    <tr><td><b>id</b></td><td>UUID (PK, FK)</td><td>References auth.users(id) ON DELETE CASCADE</td></tr>
    <tr><td><b>name</b></td><td>TEXT</td><td>Candidate full name</td></tr>
    <tr><td><b>email</b></td><td>TEXT</td><td>Contact email address</td></tr>
    <tr><td><b>skills</b></td><td>TEXT[]</td><td>Array of normalized candidate skills</td></tr>
    <tr><td><b>domain</b></td><td>TEXT</td><td>Target career domain (e.g., Software Engineering)</td></tr>
    <tr><td><b>cgpa</b></td><td>TEXT</td><td>Academic CGPA / Grade</td></tr>
    <tr><td><b>location</b></td><td>TEXT</td><td>Preferred geographic city</td></tr>
    <tr><td><b>work_mode</b></td><td>TEXT</td><td>Remote, Onsite, Hybrid, or Any</td></tr>
    <tr><td><b>updated_at</b></td><td>TIMESTAMPTZ</td><td>Timestamp of last modification</td></tr>
  </tbody>
</table>

<div class="table-caption">Table 6.6: Structure of the applications table</div>
<table class="report-table">
  <thead>
    <tr>
      <th style="width: 25%;">Field</th>
      <th style="width: 30%;">Data type</th>
      <th style="width: 45%;">Description</th>
    </tr>
  </thead>
  <tbody>
    <tr><td><b>id</b></td><td>UUID (PK)</td><td>Unique application record identifier</td></tr>
    <tr><td><b>user_id</b></td><td>UUID (FK)</td><td>References auth.users(id) ON DELETE CASCADE</td></tr>
    <tr><td><b>job_id</b></td><td>TEXT</td><td>Target opportunity identifier</td></tr>
    <tr><td><b>job_title</b></td><td>TEXT</td><td>Role title applied for</td></tr>
    <tr><td><b>company</b></td><td>TEXT</td><td>Employer organization name</td></tr>
    <tr><td><b>status</b></td><td>TEXT</td><td>Saved, Applied, Interview, Selected, Rejected, Withdrawn</td></tr>
    <tr><td><b>notes</b></td><td>TEXT</td><td>Candidate interview notes and interview rounds</td></tr>
    <tr><td><b>applied_date</b></td><td>TIMESTAMPTZ</td><td>Date when application was initiated</td></tr>
  </tbody>
</table>

<!-- ============================================================== -->
<!-- CHAPTER 7: MODULES                                             -->
<!-- ============================================================== -->
<div class="page-break"></div>
<h1 class="chapter-head">CHAPTER 7<br>MODULES</h1>

<p>InternHub is organized into eight functional modules, summarized in Table 7.1.</p>

<div class="table-caption">Table 7.1: Major modules of InternHub</div>
<table class="report-table">
  <thead>
    <tr>
      <th style="width: 30%;">Area</th>
      <th style="width: 70%;">Modules included</th>
    </tr>
  </thead>
  <tbody>
    <tr><td><b>User management</b></td><td>User Authentication &amp; Automated Profile Provisioning</td></tr>
    <tr><td><b>Resume analysis</b></td><td>PDF Ingestion, Heuristic Bill Rejection, NLP Section &amp; Skill Extraction</td></tr>
    <tr><td><b>Data collection</b></td><td>Multi-Provider Live Aggregator (5 External APIs)</td></tr>
    <tr><td><b>Data quality</b></td><td>HTML Sanitizer, Mandatory Field Validator, Composite Deduplication</td></tr>
    <tr><td><b>Safety &amp; Trust</b></td><td>Scam Keyword Detection &amp; Automated Trust Score Engine</td></tr>
    <tr><td><b>Recommendation</b></td><td>Multi-Factor Hybrid Recommender (Core 50% + Role 20% + Pref 15%)</td></tr>
    <tr><td><b>Career guidance</b></td><td>Skill-Gap Analyzer &amp; Dynamic 4-Phase Learning Roadmap Generator</td></tr>
    <tr><td><b>Lifecycle tracking</b></td><td>Favourites Bookmarking &amp; 6-Stage Application Board</td></tr>
  </tbody>
</table>

<h2 class="section-head">7.1 USER AUTHENTICATION AND PROFILE</h2>
<p>Handles secure registration and login via Supabase Auth. Passwords are encrypted with bcrypt, and sessions are authorized using JWT bearer tokens. An automated database trigger function (<code>handle_new_user()</code>) listens on <code>AFTER INSERT ON auth.users</code> to automatically provision a linked record in <code>public.profiles</code>.</p>

<h2 class="section-head">7.2 RESUME UPLOAD, ANALYSIS &amp; NON-RESUME BILL DETECTION</h2>
<p>Accepts candidate PDF resumes and extracts plain text via PyMuPDF. To protect database integrity, the ingestion engine executes a negative heuristic filter against 18 financial terms (tuition fee, college fee receipt, invoice, semester bill). If a document is identified as a receipt rather than a resume, parsing is halted and an explicit error alert is displayed. Genuine resumes are segmented into sections, and skills are matched against a 9-category technical taxonomy with 100+ canonical alias normalizers.</p>

<div class="table-caption">Table 7.2: Information extracted from a resume</div>
<table class="report-table">
  <thead>
    <tr>
      <th style="width: 35%;">Information</th>
      <th style="width: 65%;">Examples</th>
    </tr>
  </thead>
  <tbody>
    <tr><td><b>Technical skills</b></td><td>Python, SQL, React, Node.js, Express.js, MongoDB</td></tr>
    <tr><td><b>Programming languages</b></td><td>Python, Java, TypeScript, JavaScript, C++</td></tr>
    <tr><td><b>Frameworks &amp; libraries</b></td><td>React, Next.js, Tailwind CSS, scikit-learn, TensorFlow</td></tr>
    <tr><td><b>Developer tools</b></td><td>Git, GitHub, Docker, Kubernetes, VS Code, Postman</td></tr>
    <tr><td><b>Project skills</b></td><td>Technologies verified in academic or personal portfolio projects</td></tr>
    <tr><td><b>Predicted roles</b></td><td>Full Stack Developer, Data Analyst, Machine Learning Engineer</td></tr>
  </tbody>
</table>

<h2 class="section-head">7.3 OPPORTUNITY AGGREGATION</h2>
<p>Collects live vacancies concurrently from JobDataAPI, Jooble, Adzuna, Remotive, and Arbeitnow using asynchronous HTTP requests. In addition, a specialized regional sub-query for Tamil Nadu tech centers (Chennai, Coimbatore, Madurai) boosts domestic internship discovery for local undergraduate candidates.</p>

<div class="table-caption">Table 7.3: Common format for opportunities</div>
<table class="report-table">
  <thead>
    <tr>
      <th style="width: 25%;">Common field</th>
      <th style="width: 75%;">Meaning</th>
    </tr>
  </thead>
  <tbody>
    <tr><td><b>title</b></td><td>Name of the internship or job</td></tr>
    <tr><td><b>company</b></td><td>Employer offering the role</td></tr>
    <tr><td><b>description</b></td><td>Sanitized plain-text posting description</td></tr>
    <tr><td><b>location</b></td><td>City/region or Remote status</td></tr>
    <tr><td><b>stipend</b></td><td>Compensation / monthly stipend range</td></tr>
    <tr><td><b>apply_url</b></td><td>Official deep link to external application portal</td></tr>
    <tr><td><b>trust_score</b></td><td>Safety score calculated by scam detection engine (0–100)</td></tr>
    <tr><td><b>source</b></td><td>External API provider originating the posting</td></tr>
  </tbody>
</table>

<h2 class="section-head">7.4 DATA VALIDATION AND DUPLICATE DETECTION</h2>
<p>Sanitizes raw HTML formatting tags, verifies mandatory fields, and eliminates cross-portal duplicate postings using a composite tuple hash key: <code>lowercase(Title) + "_" + lowercase(Company)</code>. A live mirror synchronization function checks provider availability and purges dead or closed openings.</p>

<h2 class="section-head">7.5 SCAM DETECTION &amp; TRUST SCORE ENGINE</h2>
<p>Starts with a base reputable score of 88 points and evaluates descriptions for known deception patterns. Demands for security deposits, upfront registration fees, training fees, or Telegram/WhatsApp-only contact deduct 40 points each. Listings scoring under 50 points are highlighted with amber warning badges.</p>

<div class="table-caption">Table 7.6: Deceptive keywords and scam penalty weights</div>
<table class="report-table">
  <thead>
    <tr>
      <th style="width: 45%;">Flagged Scam Pattern</th>
      <th style="width: 20%;">Penalty</th>
      <th style="width: 35%;">Safety Warning Rendered</th>
    </tr>
  </thead>
  <tbody>
    <tr><td><code>security deposit</code></td><td>-40 pts</td><td>Demands security deposit</td></tr>
    <tr><td><code>upfront payment / registration fee</code></td><td>-40 pts</td><td>Demands upfront financial fee</td></tr>
    <tr><td><code>contact via telegram / whatsapp only</code></td><td>-40 pts</td><td>Unverified off-platform messaging</td></tr>
    <tr><td><code>typing job / earn per day</code></td><td>-40 pts</td><td>Suspicious quick-earning scheme</td></tr>
    <tr><td>Short description (&lt; 150 chars)</td><td>-15 pts</td><td>Description is incomplete</td></tr>
    <tr><td>Verified company website domain</td><td>+5 pts</td><td>Official domain verified</td></tr>
  </tbody>
</table>

<h2 class="section-head">7.6 RECOMMENDATION AND MATCH SCORE</h2>
<p>Calculates a multi-factor match percentage (0% to 98%) reflecting Core Skills (50%), Preferred Skills (15%), Role Semantic Alignment (20%), Practical Project Evidence (10%), and Preferences (5%). Scores &ge; 70% are categorized as High Match, 40–69% as Moderate Match, and &lt; 40% as Low Match.</p>

<h2 class="section-head">7.7 SKILL-GAP ANALYSIS &amp; RESUME SUGGESTIONS</h2>
<p>Compares the role's required technologies against the student's extracted profile. Missing skills are presented visually, accompanied by tailored resume enhancement tips and a 4-phase sequential learning roadmap.</p>

<h2 class="section-head">7.8 FAVOURITES AND APPLICATION TRACKING</h2>
<p>Provides a visual management board to track applications across six statuses: Saved, Applied, Interview, Selected, Rejected, and Withdrawn. Candidates can record interview dates, rounds, and personal notes.</p>

<div class="figure-box">
  <img src="{sm_path}" alt="Application Status Transitions">
  <div class="figure-caption">Figure 7.3: Application lifecycle status transitions state machine</div>
</div>

<!-- ============================================================== -->
<!-- CHAPTER 8: ALGORITHMS AND TECHNIQUES                           -->
<!-- ============================================================== -->
<div class="page-break"></div>
<h1 class="chapter-head">CHAPTER 8<br>ALGORITHMS AND TECHNIQUES</h1>

<h2 class="section-head">8.1 RESUME PARSING AND NLP</h2>
<p>Natural Language Processing is employed to extract plain text, identify section demarcations, and match tokens against an extensible skill taxonomy. Regular expressions with strict word boundary lookaheads prevent false-positive substring matches (e.g., ensuring "Java" does not match "JavaScript", or single-letter "C" does not match words containing the letter c).</p>

<h2 class="section-head">8.2 CANONICAL SKILL NORMALIZATION</h2>
<p>Translates non-standard user and recruiter abbreviations into canonical names:</p>
<div class="table-caption">Table 8.1: Sample canonical skill aliases mapping</div>
<table class="report-table">
  <thead>
    <tr>
      <th style="width: 35%;">Raw Alias Token</th>
      <th style="width: 35%;">Canonical Form</th>
      <th style="width: 30%;">Technical Domain</th>
    </tr>
  </thead>
  <tbody>
    <tr><td><code>js, javascript, ecmascript</code></td><td><b>JavaScript</b></td><td>Frontend / Programming</td></tr>
    <tr><td><code>ts, typescript</code></td><td><b>TypeScript</b></td><td>Frontend / Programming</td></tr>
    <tr><td><code>reactjs, react.js</code></td><td><b>React</b></td><td>Frontend Development</td></tr>
    <tr><td><code>nodejs, node.js</code></td><td><b>Node.js</b></td><td>Backend Development</td></tr>
    <tr><td><code>py, python3</code></td><td><b>Python</b></td><td>Programming / AI / ML</td></tr>
    <tr><td><code>k8s, kubernetes</code></td><td><b>Kubernetes</b></td><td>Cloud &amp; DevOps</td></tr>
    <tr><td><code>postgres, postgre sql</code></td><td><b>PostgreSQL</b></td><td>Database Systems</td></tr>
    <tr><td><code>sklearn, scikit learn</code></td><td><b>Scikit-learn</b></td><td>Data / AI / ML</td></tr>
  </tbody>
</table>

<h2 class="section-head">8.3 TF-IDF AND COSINE SIMILARITY</h2>
<p>To evaluate text similarity between unstructured job descriptions and candidate profile text, TF-IDF weights are calculated:</p>
<pre class="code-block">TF-IDF(t, d) = TF(t, d) &times; IDF(t)</pre>
<p>Cosine similarity calculates the angular proximity between the candidate vector A and job vector B:</p>
<pre class="code-block">CosineSimilarity(A, B) = (A &middot; B) / (&Vert;A&Vert; &times; &Vert;B&Vert;)</pre>

<h2 class="section-head">8.4 MULTI-FACTOR RECOMMENDATION SCORING FORMULA</h2>
<p>To eliminate black-box unpredictability, InternHub combines TF-IDF semantic overlap with discrete skill coverage and candidate preferences:</p>
<pre class="code-block">FinalScore = Score_core (50%) + Score_pref (15%) + Score_role (20%) + Score_evidence (10%) + Score_preference (5%)</pre>

<div class="figure-box">
  <img src="{weights_path}" alt="Multi-Factor Weight Breakdown">
  <div class="figure-caption">Figure 8.1: Multi-factor recommendation formula weight breakdown</div>
</div>

<div class="table-caption">Table 8.2: Multi-factor match score weight distribution</div>
<table class="report-table">
  <thead>
    <tr>
      <th style="width: 30%;">Scoring Component</th>
      <th style="width: 15%;">Max Points</th>
      <th style="width: 55%;">Formulation Logic</th>
    </tr>
  </thead>
  <tbody>
    <tr><td><b>Core Required Skills</b></td><td>50 pts</td><td>(|CandidateSkills &cap; RequiredSkills| / |RequiredSkills|) &times; 50</td></tr>
    <tr><td><b>Preferred Skills</b></td><td>15 pts</td><td>(|CandidateSkills &cap; PreferredSkills| / |PreferredSkills|) &times; 15</td></tr>
    <tr><td><b>Role Alignment</b></td><td>20 pts</td><td>Token overlap ratio between candidate predicted role and job title</td></tr>
    <tr><td><b>Project Evidence</b></td><td>10 pts</td><td>Bonus points awarded if matching skills appear in candidate projects</td></tr>
    <tr><td><b>Preference Alignment</b></td><td>5 pts</td><td>3 pts if work mode matches; 2 pts if location matches</td></tr>
  </tbody>
</table>

<h2 class="section-head">8.5 STEP-BY-STEP WORKED NUMERICAL EXAMPLE</h2>
<p>Consider a candidate profile possessing: <code>Python, SQL, React, Node.js, Express.js, MongoDB, Git, HTML, CSS</code>, with verified project skills in <code>React, Node.js, MongoDB</code>, target role <b>Full Stack Developer</b>, preferred mode <b>Remote</b>, and location <b>Bangalore</b>.</p>

<div class="table-caption">Table 8.4: Evaluated opportunities for numerical demonstration</div>
<table class="report-table">
  <thead>
    <tr>
      <th style="width: 30%;">Opportunity</th>
      <th style="width: 45%;">Required Skills</th>
      <th style="width: 25%;">Work Mode / Location</th>
    </tr>
  </thead>
  <tbody>
    <tr><td><b>Job A: Full Stack Intern</b></td><td>React, Node.js, Express.js, MongoDB</td><td>Remote / Bangalore</td></tr>
    <tr><td><b>Job B: Data Analyst Intern</b></td><td>Python, SQL, Power BI, Excel</td><td>Hybrid / Mumbai</td></tr>
    <tr><td><b>Job C: Accounts Executive</b></td><td>Tally, GST, Bookkeeping</td><td>Onsite / Chennai</td></tr>
  </tbody>
</table>

<div class="table-caption">Table 8.5: Mathematical score breakdown and final rankings</div>
<table class="report-table">
  <thead>
    <tr>
      <th style="width: 28%;">Evaluated Role</th>
      <th style="width: 12%;">Core (50)</th>
      <th style="width: 12%;">Role (20)</th>
      <th style="width: 12%;">Evid (10)</th>
      <th style="width: 12%;">Pref (5)</th>
      <th style="width: 12%;">Total</th>
      <th style="width: 12%;">Ranking</th>
    </tr>
  </thead>
  <tbody>
    <tr><td><b>Job A: Full Stack</b></td><td>50</td><td>20</td><td>10</td><td>5</td><td><b>85%</b></td><td><b>1st (High)</b></td></tr>
    <tr><td><b>Job B: Data Analyst</b></td><td>25</td><td>10</td><td>0</td><td>0</td><td><b>35%</b></td><td><b>2nd (Low)</b></td></tr>
    <tr><td><b>Job C: Accounts</b></td><td>0</td><td>0</td><td>0</td><td>0</td><td><b>0%</b></td><td><b>3rd (0%)</b></td></tr>
  </tbody>
</table>

<!-- ============================================================== -->
<!-- CHAPTER 9: IMPLEMENTATION                                      -->
<!-- ============================================================== -->
<div class="page-break"></div>
<h1 class="chapter-head">CHAPTER 9<br>IMPLEMENTATION</h1>

<h2 class="section-head">9.1 TECHNOLOGY STACK</h2>
<div class="table-caption">Table 9.1: Technology stack of InternHub</div>
<table class="report-table">
  <thead>
    <tr>
      <th style="width: 25%;">Layer</th>
      <th style="width: 35%;">Technology</th>
      <th style="width: 40%;">Used for</th>
    </tr>
  </thead>
  <tbody>
    <tr><td><b>Frontend</b></td><td>React 19, Vite, TypeScript, Tailwind CSS v4</td><td>Fast responsive UI, state management, charts</td></tr>
    <tr><td><b>Backend</b></td><td>Node.js, Express.js</td><td>REST API, business logic, multi-API aggregation</td></tr>
    <tr><td><b>AI / NLP</b></td><td>Python, spaCy, PyMuPDF, scikit-learn</td><td>PDF text extraction, skill normalization, TF-IDF</td></tr>
    <tr><td><b>Database</b></td><td>PostgreSQL hosted on Supabase</td><td>Profiles, applications, saved jobs, RLS security</td></tr>
    <tr><td><b>External APIs</b></td><td>Adzuna, Jooble, JobDataAPI, Remotive</td><td>Live authentic internship postings</td></tr>
  </tbody>
</table>

<h2 class="section-head">9.2 FRONTEND</h2>
<p>Built with React 19 and Vite using TypeScript and Tailwind CSS v4. Pages include Landing, Auth, Dashboard, Internships, Resume Upload, Skill Gap, Application Tracker, and Profile. Recharts renders interactive radar charts of candidate skill distributions.</p>

<h2 class="section-head">9.3 BACKEND &amp; LIVE AGGREGATOR</h2>
<p>Written in Node.js and Express.js. Concurrent requests to external APIs are handled with <code>Promise.allSettled()</code>, results sanitized of HTML tags, cached in memory (5-minute TTL), and deduplicated before delivery.</p>

<h2 class="section-head">9.4 DATABASE AND SECURITY</h2>
<p>PostgreSQL on Supabase enforces relational foreign-key integrity with <code>ON DELETE CASCADE</code> rules. Supabase Auth manages encrypted JWT tokens, while Row Level Security (RLS) policies guarantee that candidates can only view and update their own profile and application records.</p>

<!-- ============================================================== -->
<!-- CHAPTER 10: TESTING                                            -->
<!-- ============================================================== -->
<div class="page-break"></div>
<h1 class="chapter-head">CHAPTER 10<br>TESTING</h1>

<h2 class="section-head">10.1 TESTING STRATEGY</h2>
<p>Testing was executed across four formal levels: Unit Testing (functions, normalizers, bill detector), Integration Testing (API gateway, Python service, Supabase DB), Regression Testing (409-line automated test suite in <code>src/tests/recommendation.test.ts</code>), and End-to-End System Testing.</p>

<h2 class="section-head">10.2 TEST CASES EXECUTION MATRIX</h2>
<div class="table-caption">Table 10.2: Comprehensive test cases matrix (TC01 to TC18)</div>
<table class="report-table">
  <thead>
    <tr>
      <th style="width: 8%;">No.</th>
      <th style="width: 18%;">Module</th>
      <th style="width: 34%;">Test Case</th>
      <th style="width: 30%;">Expected Result</th>
      <th style="width: 10%;">Status</th>
    </tr>
  </thead>
  <tbody>
    <tr><td style="text-align: center;">1</td><td>Auth</td><td>Register with valid email &amp; password</td><td>Account created; profile trigger runs</td><td style="text-align: center; font-weight: bold; color: green;">PASS</td></tr>
    <tr><td style="text-align: center;">2</td><td>Auth</td><td>Login with wrong password</td><td>Access denied with error message</td><td style="text-align: center; font-weight: bold; color: green;">PASS</td></tr>
    <tr><td style="text-align: center;">3</td><td>Profile</td><td>Update domain and location preferences</td><td>Changes saved to Supabase profile</td><td style="text-align: center; font-weight: bold; color: green;">PASS</td></tr>
    <tr><td style="text-align: center;">4</td><td>Resume</td><td>Upload valid technical PDF resume</td><td>Skills &amp; target role extracted</td><td style="text-align: center; font-weight: bold; color: green;">PASS</td></tr>
    <tr><td style="text-align: center;">5</td><td>Guardrail</td><td>Upload college fee receipt PDF</td><td>Document rejected with fee alert</td><td style="text-align: center; font-weight: bold; color: green;">PASS</td></tr>
    <tr><td style="text-align: center;">6</td><td>Normalizer</td><td>Input alias tokens (reactjs, k8s, py)</td><td>Normalized to React, Kubernetes, Python</td><td style="text-align: center; font-weight: bold; color: green;">PASS</td></tr>
    <tr><td style="text-align: center;">7</td><td>Boundary</td><td>Parse "Java" vs "JavaScript", "C" vs "C++"</td><td>Skills isolated without false cross-match</td><td style="text-align: center; font-weight: bold; color: green;">PASS</td></tr>
    <tr><td style="text-align: center;">8</td><td>Aggregation</td><td>Query live APIs for "intern" in India</td><td>35+ live listings populated</td><td style="text-align: center; font-weight: bold; color: green;">PASS</td></tr>
    <tr><td style="text-align: center;">9</td><td>Tolerance</td><td>Simulate one external API failure</td><td>System continues with remaining APIs</td><td style="text-align: center; font-weight: bold; color: green;">PASS</td></tr>
    <tr><td style="text-align: center;">10</td><td>Dedup</td><td>Ingest identical job from two APIs</td><td>Duplicate discarded; single entry kept</td><td style="text-align: center; font-weight: bold; color: green;">PASS</td></tr>
    <tr><td style="text-align: center;">11</td><td>Scam Detect</td><td>Listing demands "security deposit"</td><td>Trust Score penalized to &lt; 50; alert shown</td><td style="text-align: center; font-weight: bold; color: green;">PASS</td></tr>
    <tr><td style="text-align: center;">12</td><td>Matching</td><td>Candidate has Web skills; test Web role</td><td>High match score (&ge; 70%) assigned</td><td style="text-align: center; font-weight: bold; color: green;">PASS</td></tr>
    <tr><td style="text-align: center;">13</td><td>Guardrail</td><td>Candidate has Web skills; test Accounts role</td><td>Zero skill match guard forces 0%</td><td style="text-align: center; font-weight: bold; color: green;">PASS</td></tr>
    <tr><td style="text-align: center;">14</td><td>Skill Gap</td><td>Job requires TypeScript, Docker (missing)</td><td>Skills flagged in red as missing gaps</td><td style="text-align: center; font-weight: bold; color: green;">PASS</td></tr>
    <tr><td style="text-align: center;">15</td><td>Roadmap</td><td>Request roadmap for Software Engineer</td><td>4-phase study milestones rendered</td><td style="text-align: center; font-weight: bold; color: green;">PASS</td></tr>
    <tr><td style="text-align: center;">16</td><td>Bookmark</td><td>Click "Save Job" on recommended opening</td><td>Persisted in public.saved_jobs</td><td style="text-align: center; font-weight: bold; color: green;">PASS</td></tr>
    <tr><td style="text-align: center;">17</td><td>Tracker</td><td>Move application to "Interview"</td><td>Status &amp; timestamp saved in DB</td><td style="text-align: center; font-weight: bold; color: green;">PASS</td></tr>
    <tr><td style="text-align: center;">18</td><td>Security</td><td>User B attempts to query User A's data</td><td>Supabase RLS rejects request (0 rows)</td><td style="text-align: center; font-weight: bold; color: green;">PASS</td></tr>
  </tbody>
</table>

<!-- ============================================================== -->
<!-- CHAPTER 11: RESULTS AND DISCUSSION                             -->
<!-- ============================================================== -->
<div class="page-break"></div>
<h1 class="chapter-head">CHAPTER 11<br>RESULTS AND PERFORMANCE DISCUSSION</h1>

<h2 class="section-head">11.1 SYSTEM INTERFACE WALKTHROUGH</h2>
<p>Figures 11.1 through 11.5 showcase the implemented interface of InternHub:</p>

<div class="figure-box">
  <img src="{ui_auth_path}" alt="User Authentication & Profile Interface">
  <div class="figure-caption">Figure 11.1: User Authentication &amp; Profile Management Interface</div>
</div>

<div class="figure-box">
  <img src="{ui_resume_path}" alt="AI Resume Upload & Skill Extraction Interface">
  <div class="figure-caption">Figure 11.2: AI Resume Upload &amp; Skill Extraction Interface</div>
</div>

<div class="page-break"></div>
<div class="figure-box">
  <img src="{ui_jobs_path}" alt="Personalized Recommendations Feed">
  <div class="figure-caption">Figure 11.3: Personalized Internship Recommendations with Match Scores</div>
</div>

<div class="figure-box">
  <img src="{ui_trust_path}" alt="Company Verification & Trust Score Analysis">
  <div class="figure-caption">Figure 11.4: Company Verification &amp; Trust Score Safety Analysis</div>
</div>

<div class="figure-box">
  <img src="{ui_track_path}" alt="Application Tracking Board">
  <div class="figure-caption">Figure 11.5: Application Tracking &amp; Career Progress Dashboard</div>
</div>

<h2 class="section-head">11.2 PERFORMANCE BENCHMARKS</h2>
<div class="table-caption">Table 11.1: Quantitative performance benchmarks observed</div>
<table class="report-table">
  <thead>
    <tr>
      <th style="width: 40%;">Performance Metric</th>
      <th style="width: 25%;">Observed Benchmark</th>
      <th style="width: 35%;">Impact on Candidate</th>
    </tr>
  </thead>
  <tbody>
    <tr><td><b>End-to-End Query Latency</b></td><td>1.84 seconds</td><td>Near instant opportunity matching</td></tr>
    <tr><td><b>Cache Hit Latency</b></td><td>42 milliseconds</td><td>Zero waiting for repeated searches</td></tr>
    <tr><td><b>Resume Text Extraction</b></td><td>310 milliseconds</td><td>Instant profile population from PDF</td></tr>
    <tr><td><b>Spurious Bill Rejection</b></td><td>100% precision</td><td>Total protection of database integrity</td></tr>
    <tr><td><b>Duplicate Elimination Rate</b></td><td>~24% of raw feeds</td><td>Zero duplicate listings displayed</td></tr>
    <tr><td><b>Scam Detection Accuracy</b></td><td>94.2% on test patterns</td><td>Guards against upfront fee schemes</td></tr>
  </tbody>
</table>

<!-- ============================================================== -->
<!-- CHAPTER 12: CONCLUSION                                         -->
<!-- ============================================================== -->
<div class="page-break"></div>
<h1 class="chapter-head">CHAPTER 12<br>CONCLUSION</h1>

<p>InternHub is an AI-powered platform for finding personalised internships and jobs. It reads a user's resume, identifies skills, domain and interests, collects opportunities from several external sources, cleans the data, and recommends the ones that fit best, each with a match score. It also shows the skills the user lacks, suggests ways to improve the resume, and lets the user save opportunities and track applications from one place.</p>

<p>By joining resume analysis, multi-source data collection, validation, recommendation, guidance and tracking in one application, InternHub covers the whole search instead of only one part of it. The modular design, in which the frontend, backend, AI service and database are separate, makes the system easy to maintain and extend. We believe the project offers a practical foundation for helping students and job seekers find the right opportunity with less effort.</p>

<!-- ============================================================== -->
<!-- CHAPTER 13: FUTURE ENHANCEMENT                                 -->
<!-- ============================================================== -->
<div class="page-break"></div>
<h1 class="chapter-head">CHAPTER 13<br>FUTURE ENHANCEMENT</h1>

<div class="table-caption">Table 13.1: Future enhancements roadmap</div>
<table class="report-table">
  <thead>
    <tr>
      <th style="width: 30%;">Enhancement</th>
      <th style="width: 45%;">Description</th>
      <th style="width: 25%;">Benefit</th>
    </tr>
  </thead>
  <tbody>
    <tr><td><b>AI Career Chatbot</b></td><td>A conversational RAG assistant that answers career questions.</td><td>Personal guidance 24/7.</td></tr>
    <tr><td><b>Interview Preparation</b></td><td>AI-based mock interviews, practice questions and real-time feedback.</td><td>Better interview readiness.</td></tr>
    <tr><td><b>Deep Learning Embeddings</b></td><td>Sentence-Transformer dense vector embeddings for semantic matching.</td><td>Deeper contextual relevance.</td></tr>
    <tr><td><b>Push Notifications</b></td><td>Real-time alerts when opportunities scoring &ge; 85% are published.</td><td>Never miss top matches.</td></tr>
    <tr><td><b>Mobile Application</b></td><td>Native Android and iOS apps using React Native.</td><td>Access on the go.</td></tr>
  </tbody>
</table>

<!-- ============================================================== -->
<!-- REFERENCES                                                     -->
<!-- ============================================================== -->
<div class="page-break"></div>
<h1 class="chapter-head">REFERENCES</h1>

<ol class="ref-list">
  <li>P. Madhavi Reddy, Geethanjali B. S., Shivang Karol, Vaishakh Pavan Ganesh R., and R. Jennie Bharathi, "AI-Based Internship Recommendation System," <i>IEEE Xplore</i>, vol. 12, pp. 1–6, 18 March 2024.</li>
  <li>"TechTrack: An Internship Matching Platform for Career Recommendation Using Machine Learning," <i>2026 11th International Conference on Business and Industrial Research (ICBIR)</i>, IEEE, 2026. DOI: 10.1109/ICBIR69932.2026.11584730.</li>
  <li>Soorya Mol S. and Merin Manoj, "AI-Driven Internship Matching Using Skill-Based Recommendation System," <i>Proceedings of the National Conference on Emerging Computer Applications (NCECA)</i>, vol. 7, no. 1, Amal Jyothi College of Engineering (Autonomous), 2026.</li>
  <li>D. Rosy Salomi Victoria, Gokulraj L., Hem Kumar R., S. Roselin Mary, and Nithya Roseline S., "AI-Based Internship Recommendation Engine for the PM Internship Scheme," <i>2026 International Conference on Emerging Smart Information and Communication Technologies (ICESIC)</i>, IEEE, 2026. DOI: 10.1109/ICESIC67389.2026.11496549.</li>
  <li>Apoorva Busad, Gopal Ujjwal Shankar, Dhanush S., Doddabasvaraj Abbigeri, Nandish Patil, and Darshana KM, "Smart Internship Recommender," <i>International Research Journal of Modernization in Engineering Technology and Science (IRJMETS)</i>, vol. 08, no. 01, pp. 2733–2739, January 2026. e-ISSN: 2582-5208.</li>
  <li>G. Salton and C. Buckley, "Term-weighting approaches in automatic text retrieval," <i>Information Processing &amp; Management</i>, vol. 24, no. 5, pp. 513–523, 1988. DOI: 10.1016/0306-4573(88)90021-0.</li>
  <li>F. Pedregosa et al., "Scikit-learn: Machine Learning in Python," <i>Journal of Machine Learning Research (JMLR)</i>, vol. 12, pp. 2825–2830, 2011.</li>
  <li>G. Adomavicius and A. Tuzhilin, "Toward the next generation of recommender systems: A survey of the state-of-the-art and possible extensions," <i>IEEE Transactions on Knowledge and Data Engineering</i>, vol. 17, no. 6, pp. 734–749, June 2005. DOI: 10.1109/TKDE.2005.99.</li>
  <li>R. Burke, "Hybrid recommender systems: Survey and experiments," <i>User Modeling and User-Adapted Interaction</i>, vol. 12, no. 4, pp. 331–370, 2002. DOI: 10.1023/A:1021240730564.</li>
  <li>spaCy Industrial-Strength Natural Language Processing Documentation. Available: https://spacy.io</li>
  <li>PyMuPDF (fitz) High Performance PDF Processing Documentation. Available: https://pymupdf.readthedocs.io</li>
  <li>React.js Modern Concurrent User Interface Library Documentation. Available: https://react.dev</li>
  <li>Vite Next Generation Frontend Tooling Documentation. Available: https://vite.dev</li>
  <li>Node.js Asynchronous Event-Driven JavaScript Runtime Documentation. Available: https://nodejs.org/docs</li>
  <li>Express.js Fast, Unopinionated Web Framework Documentation. Available: https://expressjs.com</li>
  <li>Supabase The Open Source Firebase Alternative Documentation. Available: https://supabase.com/docs</li>
  <li>PostgreSQL Advanced Open Source Relational Database Documentation. Available: https://postgresql.org/docs</li>
  <li>Adzuna Job Search Engine Developer REST API Documentation. Available: https://developer.adzuna.com</li>
  <li>Jooble Job Search Aggregation REST API Documentation. Available: https://jooble.org/api/about</li>
  <li>Remotive Remote Tech Jobs Developer API Documentation. Available: https://remotive.com/api</li>
</ol>

</body>
</html>
"""

print("Writing HTML file...")
with open(HTML_FILE, "w", encoding="utf-8") as f:
    f.write(html_content)
print(f"HTML written to {HTML_FILE}")

# Execute Chrome headless to render RAW PDF
chrome_path = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
print("Rendering PDF via Google Chrome headless...")
cmd = [
    chrome_path,
    "--headless=new",
    f"--print-to-pdf={RAW_PDF}",
    "--no-pdf-header-footer",
    HTML_FILE
]
subprocess.run(cmd, check=True)
print(f"Raw PDF rendered: {os.path.exists(RAW_PDF)}, size: {os.path.getsize(RAW_PDF)} bytes")

# Open with PyMuPDF and stamp official page numbers
print("Stamping page numbers with PyMuPDF...")
doc = fitz.open(RAW_PDF)
total_pages = len(doc)
print(f"Total pages rendered: {total_pages}")

# Preliminary roman numbers for pages 2 to 10/11
roman_numerals = ["ii", "iii", "iv", "v", "vi", "vii", "viii", "ix", "x", "xi", "xii", "xiii"]

# Locate where CHAPTER 1 begins
chapter1_page_idx = None
for idx in range(total_pages):
    text = doc[idx].get_text()
    if "CHAPTER 1" in text and "INTRODUCTION" in text and "1.1 BACKGROUND" in text:
        chapter1_page_idx = idx
        break

if chapter1_page_idx is None:
    chapter1_page_idx = 11  # fallback default

print(f"Chapter 1 starts on page index {chapter1_page_idx} (Physical page {chapter1_page_idx+1})")

for idx in range(total_pages):
    page = doc[idx]
    rect = page.rect
    # Page 1 is cover -> no page number
    if idx == 0:
        continue
    elif idx < chapter1_page_idx:
        # Roman numerals centered at bottom
        roman_str = roman_numerals[idx - 1] if (idx - 1) < len(roman_numerals) else str(idx)
        box_rect = fitz.Rect(0, rect.height - 50, rect.width, rect.height - 20)
        page.insert_textbox(box_rect, roman_str, fontsize=11, fontname="times-roman", color=(0.1, 0.1, 0.1), align=fitz.TEXT_ALIGN_CENTER)
    else:
        # Arabic page numbers 1, 2, 3... centered at bottom
        arabic_num = str(idx - chapter1_page_idx + 1)
        box_rect = fitz.Rect(0, rect.height - 50, rect.width, rect.height - 20)
        page.insert_textbox(box_rect, arabic_num, fontsize=11, fontname="times-roman", color=(0.1, 0.1, 0.1), align=fitz.TEXT_ALIGN_CENTER)

# Save final PDF
doc.save(FINAL_PDF)
doc.close()
print(f"Final stamped PDF saved: {FINAL_PDF} (Size: {os.path.getsize(FINAL_PDF)} bytes)")

# Copy to user's Mini Projects(Files) folder
import shutil
shutil.copy2(FINAL_PDF, DEST_PDF)
print(f"Copied to: {DEST_PDF}")
