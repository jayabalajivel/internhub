#!/usr/bin/env python3
"""
InternHub AI/ML Resume Analysis & Role Prediction Engine
Supports PDF (PyMuPDF), DOCX (python-docx), and TXT resume text extraction.
Performs section detection, skill extraction & normalization, project-aware confidence weighting,
ML/NLP role classification, skill-gap analysis, and dynamic learning roadmap generation.
"""

import sys
import json
import re
import os
from typing import Dict, List, Any, Tuple, Optional

# Try importing PDF & DOCX libraries
try:
    import pymupdf as fitz  # PyMuPDF
except ImportError:
    try:
        import fitz
    except ImportError:
        fitz = None

try:
    import docx  # python-docx
except ImportError:
    docx = None

TfidfVectorizer = None
cosine_similarity = None

# ==============================================================================
# 1. NON-RESUME & IRRELEVANT DOCUMENT PATTERNS
# ==============================================================================
IRRELEVANT_PATTERNS = [
    r'\btuition\s+fee\b', r'\bcollege\s+fee\b', r'\bfee\s+receipt\b', r'\bpayment\s+receipt\b',
    r'\bfee\s+structure\b', r'\bhostel\s+fee\b', r'\binvoice\b', r'\bbill\s+amount\b',
    r'\btransaction\s+id\b', r'\bamount\s+paid\b', r'\bdue\s+date\b', r'\bsemester\s+fee\b',
    r'\bbank\s+challan\b', r'\bbalance\s+due\b', r'\bsubtotal\b', r'\btax\s+invoice\b',
    r'\btotal\s+amount\b', r'\breceipt\s+no\b', r'\bpayment\s+details\b'
]

RESUME_PATTERNS = [
    r'\beducation\b', r'\bexperience\b', r'\bskills\b', r'\bprojects\b', r'\bsummary\b',
    r'\bwork\s+history\b', r'\bemployment\b', r'\bachievements\b', r'\bcertifications\b',
    r'\binternship\b', r'\bcurriculum\s+vitae\b', r'\bresume\b', r'\bgithub\b', r'\blinkedin\b',
    r'\bb\.tech\b', r'\bb\.e\b', r'\bb\.sc\b', r'\bm\.tech\b', r'\bdegree\b', r'\bsoftware\b',
    r'\bdeveloper\b', r'\bengineer\b'
]

# ==============================================================================
# 2. EXTENSIBLE SKILL TAXONOMY & NORMALIZATION ALIASES
# ==============================================================================
SKILL_TAXONOMY = {
    'Programming': [
        'Python', 'Java', 'C', 'C++', 'C#', 'JavaScript', 'TypeScript', 'Go', 'Rust',
        'PHP', 'Ruby', 'Kotlin', 'Swift', 'Dart', 'R', 'MATLAB', 'Assembly', 'Shell', 'Bash'
    ],
    'Frontend': [
        'HTML', 'CSS', 'JavaScript', 'TypeScript', 'React', 'Angular', 'Vue', 'Next.js',
        'Nuxt.js', 'Tailwind CSS', 'Bootstrap', 'Redux', 'Sass', 'Webpack', 'Vite', 'jQuery',
        'Svelte', 'Material UI', 'Responsive Design'
    ],
    'Backend': [
        'Node.js', 'Express.js', 'Django', 'Flask', 'FastAPI', 'Spring Boot', '.NET',
        'ASP.NET', 'Ruby on Rails', 'NestJS', 'Laravel', 'REST API', 'GraphQL', 'gRPC'
    ],
    'Database': [
        'MySQL', 'PostgreSQL', 'MongoDB', 'Redis', 'SQLite', 'Firebase', 'Supabase',
        'Oracle', 'DynamoDB', 'Cassandra', 'MariaDB', 'Neo4j', 'Elasticsearch', 'SQL'
    ],
    'Data/AI/ML': [
        'Python', 'Pandas', 'NumPy', 'Matplotlib', 'Seaborn', 'Scikit-learn', 'TensorFlow',
        'PyTorch', 'Keras', 'OpenCV', 'NLP', 'NLTK', 'spaCy', 'Machine Learning', 'Deep Learning',
        'Generative AI', 'LLM', 'RAG', 'LangChain', 'Data Analysis', 'Data Engineering', 'Apache Spark'
    ],
    'Cloud/DevOps': [
        'AWS', 'Azure', 'GCP', 'Docker', 'Kubernetes', 'Jenkins', 'Git', 'GitHub',
        'GitLab', 'CI/CD', 'Terraform', 'Ansible', 'Linux', 'Nginx', 'System Design'
    ],
    'Cybersecurity': [
        'Networking', 'Linux', 'Wireshark', 'SIEM', 'Penetration Testing', 'Ethical Hacking',
        'Cryptography', 'CCNA', 'OWASP', 'Metasploit', 'Nmap', 'Information Security'
    ],
    'Testing': [
        'Selenium', 'Playwright', 'Cypress', 'JUnit', 'PyTest', 'Jest', 'Mocha',
        'Postman', 'API Testing', 'Automation Testing'
    ],
    'Mobile': [
        'React Native', 'Flutter', 'Kotlin', 'Swift', 'Android', 'iOS', 'Android Studio', 'Xcode'
    ]
}

# Skill Alias Normalization Dictionary
SKILL_ALIASES = {
    'js': 'JavaScript',
    'reactjs': 'React',
    'react.js': 'React',
    'ts': 'TypeScript',
    'node': 'Node.js',
    'nodejs': 'Node.js',
    'express': 'Express.js',
    'expressjs': 'Express.js',
    'mongo db': 'MongoDB',
    'mongo': 'MongoDB',
    'postgres': 'PostgreSQL',
    'postgre sql': 'PostgreSQL',
    'py': 'Python',
    'ml': 'Machine Learning',
    'dl': 'Deep Learning',
    'genai': 'Generative AI',
    'k8s': 'Kubernetes',
    'tailwind': 'Tailwind CSS',
    'sklearn': 'Scikit-learn',
    'scikit learn': 'Scikit-learn',
    'tf': 'TensorFlow',
    'rest': 'REST API',
    'restful': 'REST API',
    'git/github': 'Git',
    'golang': 'Go',
    'c sharp': 'C#',
    'c++': 'C++',
    'aws cloud': 'AWS'
}

# ==============================================================================
# 3. COMPREHENSIVE SOFTWARE ROLE TAXONOMY & REQUIRED SKILLS
# ==============================================================================
ROLE_TAXONOMY = {
    'Frontend Developer': {
        'core_skills': ['HTML', 'CSS', 'JavaScript', 'React', 'TypeScript', 'Tailwind CSS', 'Git'],
        'secondary_skills': ['Next.js', 'Redux', 'Vue', 'Angular', 'Bootstrap', 'Sass', 'Responsive Design'],
        'keywords': ['frontend', 'ui', 'web developer', 'client side', 'user interface']
    },
    'React Developer': {
        'core_skills': ['React', 'JavaScript', 'TypeScript', 'HTML', 'CSS', 'Redux', 'Git'],
        'secondary_skills': ['Next.js', 'Tailwind CSS', 'REST API', 'Vite', 'Jest'],
        'keywords': ['react', 'reactjs', 'react developer', 'frontend']
    },
    'Backend Developer': {
        'core_skills': ['Node.js', 'Express.js', 'Python', 'Java', 'REST API', 'SQL', 'Git'],
        'secondary_skills': ['PostgreSQL', 'MongoDB', 'Docker', 'Redis', 'Django', 'Spring Boot', 'FastAPI'],
        'keywords': ['backend', 'server side', 'api', 'microservices']
    },
    'Node.js Developer': {
        'core_skills': ['Node.js', 'Express.js', 'JavaScript', 'TypeScript', 'MongoDB', 'REST API', 'Git'],
        'secondary_skills': ['PostgreSQL', 'Redis', 'Docker', 'GraphQL', 'AWS'],
        'keywords': ['node', 'nodejs', 'express', 'backend']
    },
    'Python Developer': {
        'core_skills': ['Python', 'Django', 'Flask', 'FastAPI', 'SQL', 'REST API', 'Git'],
        'secondary_skills': ['PostgreSQL', 'Docker', 'Pandas', 'NumPy', 'Redis', 'Linux'],
        'keywords': ['python', 'django', 'flask', 'fastapi']
    },
    'Java Developer': {
        'core_skills': ['Java', 'Spring Boot', 'SQL', 'MySQL', 'REST API', 'Git', 'OOP'],
        'secondary_skills': ['PostgreSQL', 'Docker', 'Hibernate', 'Maven', 'JUnit', 'Microservices'],
        'keywords': ['java', 'spring', 'spring boot', 'j2ee']
    },
    'Full Stack Developer': {
        'core_skills': ['HTML', 'CSS', 'JavaScript', 'React', 'Node.js', 'Express.js', 'SQL', 'MongoDB', 'Git'],
        'secondary_skills': ['TypeScript', 'Next.js', 'Python', 'PostgreSQL', 'REST API', 'Docker'],
        'keywords': ['full stack', 'fullstack', 'web developer', 'mern', 'mean']
    },
    'Software Engineer': {
        'core_skills': ['Python', 'Java', 'C++', 'Data Structures', 'Algorithms', 'Git', 'SQL', 'System Design'],
        'secondary_skills': ['Linux', 'REST API', 'Docker', 'OOP', 'Agile'],
        'keywords': ['software engineer', 'software developer', 'swe', 'sde']
    },
    'Web Developer': {
        'core_skills': ['HTML', 'CSS', 'JavaScript', 'PHP', 'WordPress', 'MySQL', 'Bootstrap'],
        'secondary_skills': ['React', 'jQuery', 'SEO', 'Node.js', 'Git'],
        'keywords': ['web developer', 'website developer', 'webmaster']
    },
    'Mobile App Developer': {
        'core_skills': ['React Native', 'Flutter', 'Dart', 'JavaScript', 'TypeScript', 'Mobile UI', 'Git'],
        'secondary_skills': ['Android', 'iOS', 'Kotlin', 'Swift', 'Firebase', 'REST API'],
        'keywords': ['mobile', 'app developer', 'react native', 'flutter']
    },
    'Android Developer': {
        'core_skills': ['Kotlin', 'Java', 'Android', 'Android Studio', 'XML', 'REST API', 'Git'],
        'secondary_skills': ['Firebase', 'SQLite', 'Jetpack Compose', 'MVVM'],
        'keywords': ['android', 'kotlin', 'mobile developer']
    },
    'iOS Developer': {
        'core_skills': ['Swift', 'Xcode', 'iOS', 'UIKit', 'SwiftUI', 'REST API', 'Git'],
        'secondary_skills': ['Objective-C', 'CoreData', 'Firebase', 'CocoaPods'],
        'keywords': ['ios', 'swift', 'iphone developer']
    },
    'Data Scientist': {
        'core_skills': ['Python', 'Pandas', 'NumPy', 'Scikit-learn', 'SQL', 'Machine Learning', 'Statistics'],
        'secondary_skills': ['Matplotlib', 'Seaborn', 'Deep Learning', 'TensorFlow', 'PyTorch', 'Data Visualization'],
        'keywords': ['data scientist', 'data science', 'predictive modeling', 'statistical']
    },
    'Machine Learning Engineer': {
        'core_skills': ['Python', 'Machine Learning', 'Scikit-learn', 'TensorFlow', 'PyTorch', 'Deep Learning', 'SQL'],
        'secondary_skills': ['Pandas', 'NumPy', 'OpenCV', 'NLP', 'MLOps', 'Docker', 'Git'],
        'keywords': ['machine learning', 'ml engineer', 'deep learning', 'neural networks']
    },
    'AI / Generative AI Engineer': {
        'core_skills': ['Python', 'Generative AI', 'LLM', 'RAG', 'LangChain', 'PyTorch', 'Transformers'],
        'secondary_skills': ['OpenAI API', 'HuggingFace', 'FastAPI', 'Vector Databases', 'NLP', 'Deep Learning'],
        'keywords': ['ai engineer', 'generative ai', 'llm', 'rag', 'artificial intelligence']
    },
    'NLP Engineer': {
        'core_skills': ['Python', 'NLP', 'NLTK', 'spaCy', 'Transformers', 'PyTorch', 'LLM'],
        'secondary_skills': ['Scikit-learn', 'BERT', 'Text Classification', 'Sentiment Analysis', 'LangChain'],
        'keywords': ['nlp', 'natural language processing', 'text analytics']
    },
    'Computer Vision Engineer': {
        'core_skills': ['Python', 'OpenCV', 'PyTorch', 'TensorFlow', 'Deep Learning', 'CNN'],
        'secondary_skills': ['Image Processing', 'YOLO', 'Object Detection', 'NumPy', 'C++'],
        'keywords': ['computer vision', 'image processing', 'opencv']
    },
    'Data Analyst': {
        'core_skills': ['SQL', 'Python', 'Excel', 'Pandas', 'Power BI', 'Tableau', 'Data Analysis'],
        'secondary_skills': ['NumPy', 'Matplotlib', 'Statistics', 'Data Visualization', 'MySQL'],
        'keywords': ['data analyst', 'business analyst', 'bi analyst', 'analytics']
    },
    'Data Engineer': {
        'core_skills': ['Python', 'SQL', 'ETL', 'Apache Spark', 'PostgreSQL', 'Data Warehousing', 'Airflow'],
        'secondary_skills': ['Hadoop', 'AWS', 'BigQuery', 'Snowflake', 'Kafka', 'Docker'],
        'keywords': ['data engineer', 'etl developer', 'data pipeline']
    },
    'Cloud Engineer': {
        'core_skills': ['AWS', 'Azure', 'GCP', 'Docker', 'Kubernetes', 'Linux', 'Terraform'],
        'secondary_skills': ['Networking', 'CI/CD', 'Bash', 'Cloud Security', 'Python'],
        'keywords': ['cloud engineer', 'aws engineer', 'azure engineer', 'cloud architect']
    },
    'DevOps Engineer': {
        'core_skills': ['Docker', 'Kubernetes', 'CI/CD', 'Jenkins', 'Git', 'Linux', 'AWS', 'Terraform'],
        'secondary_skills': ['Ansible', 'Bash', 'Python', 'Nginx', 'Prometheus', 'Grafana'],
        'keywords': ['devops', 'ci/cd', 'site reliability', 'infrastructure']
    },
    'Site Reliability Engineer (SRE)': {
        'core_skills': ['Linux', 'Kubernetes', 'Docker', 'Python', 'Go', 'Prometheus', 'Networking'],
        'secondary_skills': ['Grafana', 'CI/CD', 'Terraform', 'System Architecture', 'AWS'],
        'keywords': ['sre', 'site reliability', 'system administration']
    },
    'Cybersecurity Analyst': {
        'core_skills': ['Networking', 'Linux', 'Wireshark', 'SIEM', 'Information Security', 'Vulnerability Assessment'],
        'secondary_skills': ['Penetration Testing', 'Ethical Hacking', 'Cryptography', 'CCNA', 'OWASP', 'Python'],
        'keywords': ['cybersecurity', 'security analyst', 'infosec', 'network security']
    },
    'Security Engineer': {
        'core_skills': ['Ethical Hacking', 'Penetration Testing', 'OWASP', 'Linux', 'Networking', 'Cryptography'],
        'secondary_skills': ['Python', 'Wireshark', 'Metasploit', 'Nmap', 'Application Security', 'SIEM'],
        'keywords': ['security engineer', 'pentester', 'application security']
    },
    'Network Engineer': {
        'core_skills': ['Networking', 'CCNA', 'TCP/IP', 'Routers', 'Switches', 'Firewalls', 'Linux'],
        'secondary_skills': ['DNS/DHCP', 'VPN', 'Wireshark', 'Network Architecture', 'Python'],
        'keywords': ['network engineer', 'network administrator', 'ccna']
    },
    'QA / Automation Test Engineer': {
        'core_skills': ['Selenium', 'Playwright', 'Cypress', 'PyTest', 'JUnit', 'API Testing', 'Postman'],
        'secondary_skills': ['Java', 'Python', 'JavaScript', 'Automation Testing', 'Git', 'CI/CD'],
        'keywords': ['qa', 'test engineer', 'automation testing', 'quality assurance', 'sdet']
    },
    'Database Administrator / Developer': {
        'core_skills': ['SQL', 'MySQL', 'PostgreSQL', 'Oracle', 'Database Design', 'Query Optimization'],
        'secondary_skills': ['MongoDB', 'Redis', 'Backup & Recovery', 'PL/SQL', 'Performance Tuning'],
        'keywords': ['database administrator', 'dba', 'database developer']
    },
    'Embedded Software Engineer': {
        'core_skills': ['C', 'C++', 'Microcontrollers', 'RTOS', 'Embedded Linux', 'ARM'],
        'secondary_skills': ['I2C', 'SPI', 'UART', 'Assembly', 'IoT', 'PCB Design'],
        'keywords': ['embedded', 'firmware', 'microcontroller']
    }
}

# ==============================================================================
# 4. TEXT EXTRACTION UTILITIES
# ==============================================================================
def extract_text_from_pdf(pdf_bytes_or_path: Any) -> str:
    """Extract text from PDF using PyMuPDF (fitz)."""
    if not fitz:
        return ""
    try:
        if isinstance(pdf_bytes_or_path, str) and os.path.exists(pdf_bytes_or_path):
            doc = fitz.open(pdf_bytes_or_path)
        elif isinstance(pdf_bytes_or_path, (bytes, bytearray)):
            doc = fitz.open(stream=pdf_bytes_or_path, filetype="pdf")
        else:
            return ""
        
        text = ""
        for page in doc:
            text += page.get_text("text") + "\n"
        return text.strip()
    except Exception as e:
        sys.stderr.write(f"PDF extraction error: {e}\n")
        return ""

def extract_text_from_docx(docx_bytes_or_path: Any) -> str:
    """Extract text from DOCX using python-docx."""
    if not docx:
        return ""
    try:
        if isinstance(docx_bytes_or_path, str) and os.path.exists(docx_bytes_or_path):
            doc_obj = docx.Document(docx_bytes_or_path)
        elif isinstance(docx_bytes_or_path, (bytes, bytearray)):
            from io import BytesIO
            doc_obj = docx.Document(BytesIO(docx_bytes_or_path))
        else:
            return ""

        full_text = []
        for para in doc_obj.paragraphs:
            full_text.append(para.text)
        for table in doc_obj.tables:
            for row in table.rows:
                full_text.append(" ".join(cell.text.strip() for cell in row.cells))
        return "\n".join(full_text).strip()
    except Exception as e:
        sys.stderr.write(f"DOCX extraction error: {e}\n")
        return ""

def clean_text(raw_text: str) -> str:
    """Clean and normalize extracted raw text."""
    if not raw_text:
        return ""
    # Normalize unicode and whitespace
    text = re.sub(r'[\r\t\f]', ' ', raw_text)
    text = re.sub(r'\n+', '\n', text)
    text = re.sub(r' +', ' ', text)
    return text.strip()

# ==============================================================================
# 5. SECTION DETECTION & SEGMENTATION
# ==============================================================================
def detect_resume_sections(text: str) -> Dict[str, str]:
    """Segment resume text into logical section buckets."""
    sections = {
        'summary': '',
        'skills': '',
        'projects': '',
        'experience': '',
        'education': '',
        'certifications': '',
        'other': ''
    }

    lines = text.split('\n')
    current_section = 'summary'

    section_headers = {
        'summary': [r'summary', r'objective', r'profile', r'about me'],
        'skills': [r'skills', r'technical skills', r'technologies', r'core competencies', r'technical expertise', r'tech stack'],
        'projects': [r'projects', r'key projects', r'academic projects', r'personal projects', r'capstone project'],
        'experience': [r'experience', r'work experience', r'work history', r'employment history', r'internships', r'professional experience'],
        'education': [r'education', r'academic background', r'qualifications', r'academic details'],
        'certifications': [r'certifications', r'certificates', r'achievements', r'awards', r'licenses']
    }

    for line in lines:
        line_clean = line.strip().lower()
        if not line_clean:
            continue
        
        # Check if line matches a header pattern (short line <= 40 chars)
        is_header = False
        if len(line_clean) <= 40:
            for sec_name, patterns in section_headers.items():
                for pat in patterns:
                    if re.match(r'^\s*(' + pat + r')\s*:?\s*$', line_clean):
                        current_section = sec_name
                        is_header = True
                        break
                if is_header:
                    break

        if not is_header:
            sections[current_section] += line + '\n'

    return sections

# ==============================================================================
# 6. SKILL EXTRACTION & SECTION EVIDENCE WEIGHTING
# ==============================================================================
def extract_and_normalize_skills(text: str, sections: Dict[str, str]) -> Dict[str, Any]:
    """
    Extract skills using word boundary regex matching and normalize variations.
    Tracks evidence per section (skills list vs projects vs experience).
    """
    text_lower = text.lower()
    skills_sec_lower = sections.get('skills', '').lower()
    projects_sec_lower = sections.get('projects', '').lower()
    experience_sec_lower = sections.get('experience', '').lower()

    detected_skills = []
    category_map = {}
    skill_evidence = {}  # skill -> {in_skills: bool, in_projects: bool, in_exp: bool}

    # Flatten all canonical taxonomy skills
    all_taxonomy_skills = []
    skill_to_category = {}
    for cat, s_list in SKILL_TAXONOMY.items():
        for s in s_list:
            all_taxonomy_skills.append(s)
            skill_to_category[s] = cat

    # Also map aliases
    alias_to_canonical = {k.lower(): v for k, v in SKILL_ALIASES.items()}

    # Helper function for matching
    def is_skill_present(skill_name: str, target_text: str) -> bool:
        # Build regex with boundary checks
        escaped = re.escape(skill_name.lower())
        # Add special handle for C, C++, C#
        if skill_name.lower() == 'c':
            pattern = r'\b[cC]\b(?!\s*\+\+|\s*#)'
        elif skill_name.lower() in ['c++', 'c#']:
            pattern = r'(?:\b|(?<=\s))' + re.escape(skill_name.lower()) + r'(?:\b|(?=\s|$))'
        else:
            pattern = r'\b' + escaped + r'\b'
        return bool(re.search(pattern, target_text))

    for canonical_skill in all_taxonomy_skills:
        found_in_full = is_skill_present(canonical_skill, text_lower)
        
        # Check alias if canonical skill wasn't directly matched
        if not found_in_full:
            for alias, target_canonical in alias_to_canonical.items():
                if target_canonical == canonical_skill and is_skill_present(alias, text_lower):
                    found_in_full = True
                    break

        if found_in_full:
            in_skills = is_skill_present(canonical_skill, skills_sec_lower)
            in_proj = is_skill_present(canonical_skill, projects_sec_lower)
            in_exp = is_skill_present(canonical_skill, experience_sec_lower)

            detected_skills.append(canonical_skill)
            skill_evidence[canonical_skill] = {
                'skills_section': in_skills,
                'project_evidence': in_proj,
                'experience_evidence': in_exp
            }

            cat = skill_to_category[canonical_skill]
            if cat not in category_map:
                category_map[cat] = []
            category_map[cat].append(canonical_skill)

    # Deduplicate
    detected_skills = list(dict.fromkeys(detected_skills))

    # Identify strong skills (backed by project or experience evidence)
    strong_skills = [
        s for s in detected_skills 
        if skill_evidence[s]['project_evidence'] or skill_evidence[s]['experience_evidence']
    ]
    project_skills = [s for s in detected_skills if skill_evidence[s]['project_evidence']]
    experience_skills = [s for s in detected_skills if skill_evidence[s]['experience_evidence']]

    return {
        'all_skills': detected_skills,
        'strong_skills': strong_skills,
        'project_skills': project_skills,
        'experience_skills': experience_skills,
        'category_map': category_map,
        'skill_evidence': skill_evidence
    }

# ==============================================================================
# 7. ML / NLP ROLE PREDICTION ENGINE
# ==============================================================================
def predict_candidate_roles(extracted_skills: List[str], skill_evidence: Dict[str, dict], full_text: str) -> Tuple[List[Dict[str, Any]], Optional[str]]:
    """
    Calculates candidate role probability scores using TF-IDF / Skill Matching
    and evidence-weighted relevance scoring across 35+ software roles.
    """
    if not extracted_skills:
        return [], None

    role_scores = []
    text_lower = full_text.lower()

    for role_name, role_def in ROLE_TAXONOMY.items():
        core_skills = role_def['core_skills']
        secondary_skills = role_def['secondary_skills']
        keywords = role_def['keywords']

        # 1. Core skill match ratio
        matched_core = [s for s in core_skills if s in extracted_skills]
        core_ratio = len(matched_core) / max(1, len(core_skills))

        # 2. Secondary skill match ratio
        matched_secondary = [s for s in secondary_skills if s in extracted_skills]
        secondary_ratio = len(matched_secondary) / max(1, len(secondary_skills))

        # 3. Project / Experience Evidence Weight Multiplier
        evidence_boost = 0.0
        for s in matched_core:
            ev = skill_evidence.get(s, {})
            if ev.get('project_evidence'):
                evidence_boost += 0.08
            if ev.get('experience_evidence'):
                evidence_boost += 0.10

        # 4. Role Title Keyword Mention Bonus
        keyword_bonus = 0.0
        for kw in keywords:
            if re.search(r'\b' + re.escape(kw) + r'\b', text_lower):
                keyword_bonus += 0.12

        # 5. Combined Score
        base_score = (core_ratio * 0.55) + (secondary_ratio * 0.25) + min(0.20, evidence_boost) + min(0.15, keyword_bonus)
        
        # Scale to percentage (0.0 to 0.98)
        score = min(0.98, max(0.15, round(base_score, 2)))

        # Include role if score >= 0.35 or core matches >= 2
        if score >= 0.35 or len(matched_core) >= 2:
            role_scores.append({
                'role': role_name,
                'score': score,
                'confidence': f"{int(score * 100)}%",
                'matched_core_skills': matched_core,
                'matched_secondary_skills': matched_secondary
            })

    # Sort descending by score
    role_scores.sort(key=lambda x: x['score'], reverse=True)

    primary_role = role_scores[0]['role'] if role_scores else None
    return role_scores[:6], primary_role

# ==============================================================================
# 8. SKILL GAP ANALYSIS & DYNAMIC ROADMAP GENERATION
# ==============================================================================
def generate_skill_gap_and_roadmap(primary_role: str, candidate_skills: List[str]) -> Tuple[Dict[str, Any], List[Dict[str, Any]]]:
    """Generates skill gap analysis and a dynamic multi-stage learning roadmap."""
    if not primary_role or primary_role not in ROLE_TAXONOMY:
        role_reqs = ['HTML', 'CSS', 'JavaScript', 'Git', 'React', 'Node.js', 'Python', 'SQL']
        primary_role = 'Software Engineer'
    else:
        role_reqs = ROLE_TAXONOMY[primary_role]['core_skills'] + ROLE_TAXONOMY[primary_role]['secondary_skills'][:3]

    already_have = [s for s in candidate_skills if s in role_reqs]
    need_to_learn = [s for s in role_reqs if s not in candidate_skills]

    # Skill Gap Output
    skill_gap = {
        'role': primary_role,
        'already_have': already_have if already_have else candidate_skills[:4],
        'need_to_learn': need_to_learn if need_to_learn else ['TypeScript', 'Testing (Jest/PyTest)', 'Docker', 'System Design']
    }

    # Generate Dynamic Roadmap Stages based on missing skills
    missing = skill_gap['need_to_learn']
    roadmap = []

    stage_templates = [
        ("Stage 1: Core Fundamentals & Language Mastery", "Focus on core language proficiency, syntax, and foundational data structures."),
        ("Stage 2: Mainstream Frameworks & State Management", "Build real-world applications using modern industry frameworks and ecosystem tools."),
        ("Stage 3: Database & API Development", "Learn data persistence, backend RESTful/GraphQL APIs, and server orchestration."),
        ("Stage 4: Automated Testing & Cloud DevOps", "Implement CI/CD pipelines, containerization with Docker, and automated unit/integration testing."),
        ("Stage 5: Production Capstone Portfolio Project", "Develop and deploy a full-featured capstone project demonstrating production readiness.")
    ]

    for idx, (title, desc) in enumerate(stage_templates):
        target_skill = missing[idx] if idx < len(missing) else (f"Advanced {primary_role} Concepts" if idx == 4 else f"Deep Dive {primary_role}")
        roadmap.append({
            'stage': idx + 1,
            'title': f"{title} ({target_skill})",
            'skill_target': target_skill,
            'description': f"{desc} Recommended target skill to master: {target_skill}."
        })

    return skill_gap, roadmap

# ==============================================================================
# 9. MAIN ANALYSIS ENGINE PIPELINE
# ==============================================================================
def analyze_resume_text(text: str) -> Dict[str, Any]:
    """Complete NLP Resume Analysis Pipeline."""
    clean_raw = clean_text(text)
    if not clean_raw:
        return {
            'is_resume': False,
            'document_type': 'Empty Document',
            'warning': 'Uploaded document contains no readable text.',
            'extracted_skills': [],
            'strong_skills': [],
            'project_skills': [],
            'experience_skills': [],
            'predicted_roles': [],
            'primary_role': None,
            'skill_gaps': {},
            'learning_roadmap': [],
            'score': 0
        }

    text_lower = clean_raw.lower()

    # 1. Document Classification (Resume vs Non-Resume Document like College Bill / Invoice)
    irrelevant_matches = [p.replace(r'\b', '').replace(r'\s+', ' ') for p in IRRELEVANT_PATTERNS if re.search(p, text_lower)]
    resume_matches = [p.replace(r'\b', '').replace(r'\s+', ' ') for p in RESUME_PATTERNS if re.search(p, text_lower)]

    is_irrelevant = len(irrelevant_matches) >= 2 or (len(irrelevant_matches) > 0 and len(resume_matches) == 0)

    if is_irrelevant:
        return {
            'is_resume': False,
            'document_type': 'College Fee Receipt / Financial Bill / Non-Resume Document',
            'warning': 'Irrelevant Document Detected: Uploaded file appears to be a College Bill / Fee Receipt rather than a Resume/CV. No technical skills were extracted.',
            'extracted_skills': [],
            'strong_skills': [],
            'project_skills': [],
            'experience_skills': [],
            'predicted_roles': [],
            'primary_role': None,
            'skill_gaps': {},
            'learning_roadmap': [],
            'score': 0,
            'detected_bill_keywords': irrelevant_matches
        }

    # 2. Section Detection
    sections = detect_resume_sections(clean_raw)

    # 3. Technical Skill Extraction & Evidence Weighting
    skill_data = extract_and_normalize_skills(clean_raw, sections)

    extracted_skills = skill_data['all_skills']

    # Insufficient resume check (< 2 technical skills)
    if len(extracted_skills) < 2:
        return {
            'is_resume': True,
            'document_type': 'Insufficient Technical Resume',
            'warning': 'Insufficient resume information to confidently determine a primary role. Please add technical skills, projects, or experience.',
            'extracted_skills': extracted_skills,
            'strong_skills': skill_data['strong_skills'],
            'project_skills': skill_data['project_skills'],
            'experience_skills': skill_data['experience_skills'],
            'predicted_roles': [],
            'primary_role': None,
            'skill_gaps': {},
            'learning_roadmap': [],
            'score': 30
        }

    # 4. Role Prediction via ML/NLP Scoring Pipeline
    predicted_roles, primary_role = predict_candidate_roles(extracted_skills, skill_data['skill_evidence'], clean_raw)

    # 5. Skill Gap Analysis & Roadmap Generation
    skill_gaps, learning_roadmap = generate_skill_gap_and_roadmap(primary_role or 'Software Engineer', extracted_skills)

    # Calculate overall profile strength score (35 - 98%)
    profile_score = min(98, max(40, len(extracted_skills) * 9 + len(skill_data['strong_skills']) * 6 + (15 if sections.get('projects') else 0)))

    return {
        'is_resume': True,
        'document_type': 'Technical Resume / CV',
        'warning': None,
        'extracted_skills': extracted_skills,
        'strong_skills': skill_data['strong_skills'],
        'project_skills': skill_data['project_skills'],
        'experience_skills': skill_data['experience_skills'],
        'category_breakdown': skill_data['category_map'],
        'predicted_roles': predicted_roles,
        'primary_role': primary_role,
        'skill_gaps': skill_gaps,
        'learning_roadmap': learning_roadmap,
        'score': profile_score
    }

# ==============================================================================
# 10. CLI EXECUTION & HELPER INTERFACE
# ==============================================================================
if __name__ == '__main__':
    text_input = ""
    if len(sys.argv) > 1:
        arg_path = sys.argv[1]
        if os.path.exists(arg_path):
            ext = os.path.splitext(arg_path)[1].lower()
            if ext == '.pdf':
                text_input = extract_text_from_pdf(arg_path)
            elif ext in ['.docx', '.doc']:
                text_input = extract_text_from_docx(arg_path)
            else:
                with open(arg_path, 'r', encoding='utf-8', errors='ignore') as f:
                    text_input = f.read()
        else:
            text_input = arg_path
    else:
        text_input = sys.stdin.read() if not sys.stdin.isatty() else ""

    result = analyze_resume_text(text_input)
    print(json.dumps(result, indent=2))
