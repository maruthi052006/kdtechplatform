# KDTechX Learning & Assessment Portal
> **Learn. Practice. Assess. Grow.**  
> *A premium animated React-based course, weekly MCQ & student assessment platform for technical cohorts and bootcamps.*

---

## 1. Project Overview

**KDTechX Learning & Assessment Portal** is a production-grade educational SaaS platform designed for technical trainers, engineering institutes, and corporate bootcamps. It bridges structured multi-week curriculums with rigorous weekly MCQ assessments, deterministic automatic evaluations, browser-level exam deterrents, and cohort analytics.

### Core Philosophy
- **Trainer-Controlled Cohorts**: Only administrators can create courses and student credentials. Students cannot self-enroll or browse unassigned courses.
- **Distraction-Free Exam Canvas**: Standalone assessment interface with timestamp-based countdowns, single-choice keyboard controls (1-4 / A-D), auto-saving answer state, and multi-tier browser security deterrents.
- **Client-Side Excel Ingestion**: SheetJS (`.xlsx`) parser that validates columns, questions, choices, and answer keys client-side with interactive error reporting.
- **Backend-Agnostic Service Layer**: Clean abstraction separating UI components from storage operations, enabling straightforward drop-in migration to Supabase, Firebase, or custom REST APIs without UI redesign.

---

## 2. Technology Stack

- **Frontend Framework**: React 19 + Vite
- **Styling & Design System**: Tailwind CSS v4 with custom design tokens, dark theme by default, light mode toggle, and glassmorphism utilities
- **Animation System**: Framer Motion (page transitions, spring modals, staggered card entrances, reduced-motion accessibility)
- **Routing & Guards**: React Router v7 (`AdminRoute`, `StudentRoute`, `RoleGuard`, public layouts)
- **Icons**: Lucide React
- **Spreadsheet Processing**: SheetJS (`xlsx`) for question uploads, sample template downloads, and results exports (Excel & CSV)
- **Analytics & Data Visualization**: Recharts (Weekly performance trend, topic competency profiles, submission pass ratios, score distribution histograms)
- **Confetti**: Canvas-Confetti (restrained celebration effects upon assessment completion)

---

## 3. Quick Start & Development

### Prerequisites
- Node.js (v18 or higher recommended)
- npm

### Installation
```bash
# Clone or navigate to the workspace
cd kdtechplatform

# Install dependencies
npm install

# Start local Vite development server
npm run dev
```

The application will be accessible at:  
👉 **`http://localhost:5173/`**

### Production Build
```bash
# Build production bundle with code minification
npm run build

# Preview production build locally
npm run preview
```

---

## 4. Demo Credentials & Test Accounts

The platform comes pre-seeded with realistic courses, batches, 50+ question bank items, and student profiles for immediate evaluation:

### Lead Trainer (Admin)
- **Portal URL**: `/admin/login`
- Access is restricted to authorized platform administrators. Configure private trainer credentials via system configuration.


### Student Accounts
- **Portal URL**: `/student/login`
- *Tip: Use the quick student test buttons on the login screen.*

| Student Name | Student ID | Username | Password | Cohort Batch | Assigned Courses |
|---|---|---|---|---|---|
| **Arun Kumar** | `KDX26001` | `arun` | `password123` | Python Full Stack 2026 | Python Full Stack, React JS |
| **Priya Sharma** | `KDX26002` | `priya` | `password123` | Python Full Stack 2026 | Python Full Stack, Data Science |
| **Vikram Aditya** | `KDX26003` | `vikram` | `password123` | AI & ML Masters 2026 | AI & ML, Data Science |
| **Ananya Deshmukh** | `KDX26004` | `ananya` | `password123` | Python Full Stack 2026 | Python Full Stack |
| **Rohan Mehra** | `KDX26005` | `rohan` | `password123` | Data Science Cohort 2026 | Data Science with Python |

---

## 5. Excel Question Upload Format

Admins can bulk-import technical questions using standard `.xlsx` spreadsheets via `/admin/questions/import`.

### Expected Column Headers
| Column Header | Requirement | Format / Valid Values | Description |
|---|---|---|---|
| `question` | **Required** | Text | The question prompt or code problem snippet |
| `optionA` | **Required** | Text | Choice text for option A |
| `optionB` | **Required** | Text | Choice text for option B |
| `optionC` | **Required** | Text | Choice text for option C |
| `optionD` | **Required** | Text | Choice text for option D |
| `answer` | **Required** | `A`, `B`, `C`, or `D` | Correct answer key |
| `topic` | Optional | Text (default: `General`) | Curriculum module / technical category |
| `difficulty` | Optional | `Easy`, `Medium`, or `Hard` | Difficulty tier (default: `Medium`) |
| `explanation` | Optional | Text | Rationale displayed to learners during review |

*Admins can download a pre-formatted template with valid sample questions directly from the import wizard.*

---

## 6. Architecture & Folder Structure

```
kdtechplatform/
├── public/                     # Static assets and favicon
├── src/
│   ├── assets/                 # Brand SVG icons and hero assets
│   ├── components/
│   │   └── ui/                 # Reusable design primitives
│   │       ├── Button.jsx      # Gradients, loading spinners, size variants
│   │       ├── Input.jsx       # Form inputs with icon and error labels
│   │       ├── Select.jsx      # Styled dropdown selector
│   │       ├── Card.jsx        # Glassmorphism panels with hover elevation
│   │       ├── Badge.jsx       # Status and color tokens
│   │       ├── Modal.jsx       # Accessible spring-animated dialogs
│   │       ├── StatCard.jsx    # Metric KPI cards with trends
│   │       ├── EmptyState.jsx  # Contextual empty state illustrations
│   │       └── SkeletonLoader.jsx
│   ├── context/
│   │   ├── AuthContext.jsx     # Active session, role checks, login/logout
│   │   ├── ThemeContext.jsx    # Dark/light mode persistence and root class
│   │   └── ToastContext.jsx    # Animated notification toasts
│   ├── data/
│   │   └── demoData.js         # Comprehensive factory seed fixtures
│   ├── layouts/
│   │   ├── PublicLayout.jsx    # Public navigation and footer
│   │   ├── AdminLayout.jsx     # Collapsible sidebar, breadcrumbs, drawer
│   │   └── StudentLayout.jsx   # Student header, badges, mobile menu
│   ├── pages/
│   │   ├── public/
│   │   │   └── LandingPage.jsx # Hero, capabilities, curriculum preview
│   │   ├── auth/
│   │   │   ├── AdminLogin.jsx
│   │   │   └── StudentLogin.jsx
│   │   ├── admin/
│   │   │   ├── AdminDashboard.jsx
│   │   │   ├── CourseManagement.jsx
│   │   │   ├── CourseCreate.jsx
│   │   │   ├── CourseCurriculum.jsx
│   │   │   ├── CourseStudents.jsx
│   │   │   ├── StudentManagement.jsx
│   │   │   ├── StudentCreate.jsx
│   │   │   ├── BatchManagement.jsx
│   │   │   ├── QuestionBank.jsx
│   │   │   ├── QuestionImport.jsx
│   │   │   ├── QuizManagement.jsx
│   │   │   ├── QuizCreate.jsx
│   │   │   ├── QuizDetail.jsx
│   │   │   ├── ResultsOverview.jsx
│   │   │   ├── AnalyticsPage.jsx
│   │   │   ├── AnnouncementsPage.jsx
│   │   │   └── AdminSettings.jsx
│   │   └── student/
│   │       ├── StudentDashboard.jsx
│   │       ├── StudentCourses.jsx
│   │       ├── StudentCourseView.jsx
│   │       ├── StudentQuiz.jsx       # Distraction-free exam engine
│   │       ├── StudentResult.jsx     # Scorecard & answer review
│   │       ├── StudentHistory.jsx    # Attempt archive
│   │       ├── StudentProgress.jsx   # Milestone velocity & charts
│   │       └── StudentProfile.jsx
│   ├── routes/
│   │   ├── AppRoutes.jsx       # Top-level router definition
│   │   └── Guards.jsx          # AdminRoute & StudentRoute protection
│   ├── services/
│   │   ├── storageService.js   # Storage abstraction & cache layer
│   │   ├── authService.js
│   │   ├── courseService.js
│   │   ├── studentService.js
│   │   ├── batchService.js
│   │   ├── questionService.js
│   │   ├── quizService.js
│   │   ├── resultService.js
│   │   ├── announcementService.js
│   │   └── settingsService.js
│   ├── utils/
│   │   ├── excelParser.js      # SheetJS question ingestion & validator
│   │   └── exportHelper.js     # SheetJS Excel/CSV scorecard exports
│   ├── index.css               # Tailwind v4 configuration & tokens
│   └── main.jsx
├── vercel.json                 # Single-page application rewrites
└── package.json
```

---

## 7. Assessment Security Reality

In accordance with frontend engineering best practices, client-side mechanisms are classified as **Assessment Security Deterrents** rather than tamper-proof guarantees:

- **Text Selection & Clipboard Lock**: Scoped `user-select: none;` and event interception prevent standard copy, cut, and paste shortcuts (`Ctrl+C`, `Ctrl+V`, etc.).
- **Context Menu Suppression**: Scoped `contextmenu` listener blocks default right-click inspection within the quiz canvas.
- **Page Visibility & Tab Tracking**: The HTML5 `document.visibilitychange` API records window switches and presents warning dialogs if the student navigates away.
- **Concurrent Tab Prevention**: A lightweight `BroadcastChannel` checks for simultaneous active exam tabs.
- **Timestamp Delta Validation**: Timers calculate `targetEndTime - Date.now()`, preventing interval freezing or browser sleep tampering.

---

## 8. Deployment (Vercel Ready)

The repository includes a root `vercel.json` configured for Single-Page Application (SPA) routing:

```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

To deploy to Vercel:
1. Push this repository to GitHub or GitLab.
2. Import the project into the [Vercel Dashboard](https://vercel.com).
3. Framework Preset: **Vite**.
4. Build Command: `npm run build`.
5. Output Directory: `dist`.
6. Click **Deploy**.

---

## 9. Future Backend Migration Blueprint

The platform's domain services communicate exclusively through the storage abstraction layer:

```text
UI Component ──> Domain Service (e.g. quizService) ──> Storage Adapter
```

To migrate to **Supabase** or **PostgreSQL / REST**:
1. Replace `storageService.js` with an API driver using `@supabase/supabase-js` or `fetch`/`axios`.
2. Map the domain services (`studentService`, `courseService`, `quizService`, etc.) to Supabase tables.
3. The UI components require **zero alterations**, preserving all layouts, validations, animations, and flows intact.

---

## 10. License & Attribution
**KDTechX Learning & Assessment Portal** © 2026. All rights reserved. Designed for technical engineering cohorts.
