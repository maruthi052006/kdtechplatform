# KDTechX Learning & Assessment Portal
> **Learn. Practice. Assess. Grow.**  
> *Enterprise-Grade Full-Stack Learning Management & Assessment Platform with PostgreSQL as Single Authoritative Source of Truth.*

---

## 1. Executive Summary & Architecture

**KDTechX Learning & Assessment Portal** is an enterprise-quality SaaS platform designed for technical institutes, engineering trainers, and corporate bootcamps. It bridges multi-week curriculums with rigorous weekly MCQ assessments, server-authoritative scoring, cross-device data synchronization, and cohort analytics.

### Authoritative Production Architecture
```
┌──────────────────────────────────────┐
│           KDTechX React SPA          │
│       Vite + Tailwind + Motion       │
└──────────────────┬───────────────────┘
                   │ HTTPS (CORS)
                   ▼
┌──────────────────────────────────────┐
│          Django REST Backend         │
│     Gunicorn + DRF + SimpleJWT       │
└──────────────────┬───────────────────┘
                   │
                   ▼
┌──────────────────────────────────────┐
│        PostgreSQL Single Source      │
│      Foreign Keys, Constraints       │
└──────────────────────────────────────┘
```

- **PostgreSQL Single Source of Truth**: The server controls quiz availability, deadlines, snapshot generation, answer evaluation, and scoring. Refreshing the browser or logging in on another device maintains identical synced state.
- **Answer Key Privacy**: Questions delivered to student exam sessions NEVER include `correct_answer` or `explanation` payloads prior to submission.
- **Cross-Device Sync**: Automatic data synchronization across Desktop, Laptop, Tablet, and Mobile viewports.
- **Zero-Known-Critical-Defect Gate**: Automated test suite (9/9 passed), 0 frontend compilation errors, 0 static analysis errors.

---

## 2. Technology Stack

### Frontend
- **Framework**: React 19 + TypeScript / JSX + Vite
- **Styling**: Tailwind CSS v4 with unified design system tokens
- **Animations**: Framer Motion (page transitions, spring modals, reduced-motion accessibility)
- **Data Visualization**: Recharts (cohort performance trends, competency profiles, score histograms)
- **Spreadsheet Processing**: SheetJS (`xlsx`) for bulk question ingestion & scorecard exports
- **HTTP Client**: Axios with automated JWT token rotation interceptors

### Backend
- **Framework**: Python 3.12 + Django 5.x + Django REST Framework
- **Authentication**: SimpleJWT (15-min access token + 7-day refresh token rotation)
- **Database**: PostgreSQL (production) / SQLite (zero-config local fallback)
- **API Documentation**: OpenAPI 3.0 via `drf-spectacular` (`/api/schema/swagger-ui/`)
- **Security**: PBKDF2 password hashing, CORS whitelist, WhiteNoise, SecurityEvent deterrent auditing

---

## 3. Directory Layout

```
kdtechplatform/
├── backend/
│   ├── apps/
│   │   ├── accounts/       # Custom User model (Admin & Student roles)
│   │   ├── students/       # StudentProfile & student IDs
│   │   ├── batches/        # Cohort batch management
│   │   ├── courses/        # Course catalog & student enrollments
│   │   ├── curriculum/     # Multi-week course syllabus & topics
│   │   ├── questions/      # Question bank & bulk Excel ingestion
│   │   ├── quizzes/        # Weekly assessments & scheduling
│   │   ├── attempts/       # Server snapshotting, timers & scoring
│   │   ├── results/        # Historical scorecards & review items
│   │   ├── analytics/      # Aggregated performance analytics
│   │   ├── announcements/  # Platform notifications
│   │   └── audit/          # Security event auditing (anti-cheat logs)
│   ├── config/             # Django settings (base, dev, prod) & URLs
│   ├── manage.py
│   ├── Dockerfile
│   ├── render.yaml
│   └── requirements.txt
├── docs/                   # Architectural & operational specs
│   ├── architecture.md
│   ├── database.md
│   ├── api.md
│   ├── security.md
│   ├── testing.md
│   ├── deployment.md
│   ├── excel-format.md
│   └── troubleshooting.md
├── src/                    # React frontend application
│   ├── components/         # Design system UI library
│   ├── context/            # AuthContext, ToastContext
│   ├── pages/              # Admin & Student portal views
│   ├── services/           # API clients & sync services
│   └── index.css           # Tailwind design tokens
├── docker-compose.yml       # Full-stack container orchestration
├── verification_report.md  # Final Release Gate 1-16 Sign-off
└── vercel.json             # Vercel SPA routing configuration
```

---

## 4. Quick Start & Local Execution

### Option A: Direct Local Execution

#### 1. Backend Setup
```bash
cd backend
python -m venv venv
venv\Scripts\activate       # On Linux/macOS: source venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py seed_demo  # Seeds admin, students, courses & questions
python manage.py runserver 127.0.0.1:8000
```
Backend API & Swagger UI will be running at `http://127.0.0.1:8000/api/schema/swagger-ui/`.

#### 2. Frontend Setup
```bash
# In the project root:
npm install
npm run dev -- --port 5173
```
Frontend will be running at `http://127.0.0.1:5173/`.

---

### Option B: Docker Compose (PostgreSQL + Django + React)
```bash
docker-compose up --build
```
This launches:
- `db`: PostgreSQL 16 on port 5432
- `backend`: Gunicorn / Django on port 8000
- `frontend`: Vite on port 5173

---

## 5. Pre-Seeded Demo Credentials

The platform is pre-loaded with realistic technical courses, questions, and students:

| Portal | Role | Username | Password | Access |
|---|---|---|---|---|
| `/admin/login` | Lead Trainer / Admin | `admin` | `admin123` | Full administrative control |
| `/admin/login` | Platform Administrator | `maruthi25` | `maruthis@2529` | Full administrative control |
| `/student/login` | Student | `arun` | `password123` | Assigned to Python Full Stack & React JS |
| `/student/login` | Student | `priya` | `password123` | Assigned to Python Full Stack & Data Science |
| `/student/login` | Student | `vikram` | `password123` | Assigned to AI & ML Masters |
| `/student/login` | Student | `ananya` | `password123` | Assigned to Python Full Stack |
| `/student/login` | Student | `rohan` | `password123` | Assigned to Data Science with Python |

---

## 6. Testing & Quality Assurance

### Run Django Test Suite
```bash
cd backend
python manage.py test tests
```
Validates:
- Health check endpoints
- Admin & student authentication
- Student question key privacy protection
- Complete server-authoritative quiz lifecycle, progressive answer saving, anti-cheat event logging, and mathematical evaluation with negative marking.

### Run Frontend Static Analysis & Production Build
```bash
npm run build   # Production bundle verification
npx oxlint      # Static analysis check
```

---

## 7. Cloud Deployment Guide

### Deploying Backend to Render
1. Connect your repository to [Render](https://render.com).
2. Create a **PostgreSQL Database** instance.
3. Create a **Web Service** using `backend/Dockerfile` or `backend/render.yaml`.
4. Set Environment Variables:
   - `DJANGO_SETTINGS_MODULE=config.settings.production`
   - `SECRET_KEY=<generate_strong_secret>`
   - `DATABASE_URL=<render_internal_postgres_url>`
   - `ALLOWED_HOSTS=<your_render_service>.onrender.com`
   - `CORS_ALLOWED_ORIGINS=https://<your_vercel_app>.vercel.app`
5. Start command: `gunicorn config.wsgi:application --bind 0.0.0.0:$PORT`

### Deploying Frontend to Vercel
1. Import repository into [Vercel](https://vercel.com).
2. Framework Preset: **Vite**.
3. Set Environment Variable:
   - `VITE_API_BASE_URL=https://<your_render_service>.onrender.com/api`
4. The included `vercel.json` handles Single-Page Application (SPA) routing seamlessly.

---

## 8. Verification & Sign-off

Detailed verification logs, test evidence, and gate sign-offs are documented in [verification_report.md](file:///c:/Users/vasan/Desktop/kdtechplatform/verification_report.md).

**KDTechX Learning & Assessment Portal** © 2026. All rights reserved.
