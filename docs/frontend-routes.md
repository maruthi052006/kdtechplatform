# Frontend Route Map & Component Architecture
## KDTechX Learning & Assessment Portal
**Version:** 1.0.0-PROD-RC  
**Router:** React Router v7  
**Status:** Approved for Implementation (Phase 0 Discovery)  

---

## 1. Application Layout Architecture

The user interface is organized into three distinct layout hierarchies:

```
                                 ┌───────────────────────────┐
                                 │      App.tsx (Root)       │
                                 │ Context Providers:        │
                                 │ - AuthContext             │
                                 │ - ThemeContext            │
                                 │ - ToastContext            │
                                 └─────────────┬─────────────┘
                                               │
             ┌─────────────────────────────────┼─────────────────────────────────┐
             │                                 │                                 │
             ▼                                 ▼                                 ▼
┌─────────────────────────┐       ┌─────────────────────────┐       ┌─────────────────────────┐
│      PublicLayout       │       │       AdminLayout       │       │      StudentLayout      │
│ - Public Header / Brand │       │ - Collapsible Sidebar   │       │ - Student Nav Header    │
│ - Content Container     │       │ - Top Navigation Bar    │       │ - Enrolled Badges       │
│ - Public Footer         │       │ - Breadcrumb Trail      │       │ - Bottom Mobile Bar     │
│ - Dark/Light Toggle     │       │ - Notifications / Toasts│       │ - Notification Drawer   │
└─────────────────────────┘       └─────────────────────────┘       └─────────────────────────┘
```

*Note on Exam Engine*: The route `/student/quiz/:quizId` is rendered outside standard layouts in an isolated, distraction-free fullscreen viewport without headers or sidebars.

---

## 2. Route Map & Route Guarding

| Path | Layout | Route Guard | Purpose / View |
|---|---|---|---|
| `/` | `PublicLayout` | Public | Marketing landing page, capabilities, curriculum highlight |
| `/admin/login` | `PublicLayout` | Public / Guest | Dedicated Admin/Trainer authentication portal |
| `/student/login` | `PublicLayout` | Public / Guest | Dedicated Student authentication portal |
| **Admin Portal** | | `AdminRoute` | Requires `role === 'ADMIN'` |
| `/admin/dashboard` | `AdminLayout` | `AdminRoute` | Executive metrics, cohort stats, active assessments |
| `/admin/courses` | `AdminLayout` | `AdminRoute` | Course catalog, status filter, creation CTA |
| `/admin/courses/create` | `AdminLayout` | `AdminRoute` | Multi-step course creation wizard |
| `/admin/courses/:courseId/curriculum` | `AdminLayout` | `AdminRoute` | Week-by-week curriculum and topic organizer |
| `/admin/courses/:courseId/students` | `AdminLayout` | `AdminRoute` | Direct course enrollment roster manager |
| `/admin/students` | `AdminLayout` | `AdminRoute` | Comprehensive student registry, batch filtering |
| `/admin/students/create` | `AdminLayout` | `AdminRoute` | New student registration and credential generator |
| `/admin/batches` | `AdminLayout` | `AdminRoute` | Training cohort/batch lifecycle manager |
| `/admin/questions` | `AdminLayout` | `AdminRoute` | Centralized question bank with search & filtering |
| `/admin/questions/import` | `AdminLayout` | `AdminRoute` | Excel/CSV ingestion wizard with pre-validation |
| `/admin/quizzes` | `AdminLayout` | `AdminRoute` | Assessment schedule, status flags, publish actions |
| `/admin/quizzes/create` | `AdminLayout` | `AdminRoute` | 6-step quiz builder wizard with anti-cheat controls |
| `/admin/quizzes/:quizId` | `AdminLayout` | `AdminRoute` | Assessment configuration inspector & submissions |
| `/admin/results` | `AdminLayout` | `AdminRoute` | Global student scorecards and Excel/CSV export |
| `/admin/analytics` | `AdminLayout` | `AdminRoute` | Cohort performance, difficulty discrimination charts |
| `/admin/announcements` | `AdminLayout` | `AdminRoute` | Cohort-wide and course-scoped noticeboard publisher |
| `/admin/settings` | `AdminLayout` | `AdminRoute` | Platform preferences, security policies, token config |
| **Student Portal** | | `StudentRoute` | Requires `role === 'STUDENT'` |
| `/student/dashboard` | `StudentLayout` | `StudentRoute` | Active assessments, enrolled courses, progress |
| `/student/courses` | `StudentLayout` | `StudentRoute` | Enrolled technical curriculum catalog |
| `/student/courses/:courseId` | `StudentLayout` | `StudentRoute` | Course curriculum viewer, weekly modules & quizzes |
| `/student/quiz/:quizId` | *Standalone* | `StudentRoute` | Distraction-free exam canvas with deterrents |
| `/student/result/:resultId` | `StudentLayout` | `StudentRoute` | Exam scorecard, detailed rationale & analytics |
| `/student/history` | `StudentLayout` | `StudentRoute` | Chronological assessment attempt archive |
| `/student/progress` | `StudentLayout` | `StudentRoute` | Competency velocity radar and completion meters |
| `/student/profile` | `StudentLayout` | `StudentRoute` | Student profile credentials and batch information |

---

## 3. Component Hierarchy & Atomic Design

```
src/components/
├── ui/                     # Design Primitives
│   ├── Button.tsx          # Size, variant, loading spinner, icons
│   ├── Input.tsx           # Controlled input with error message & icons
│   ├── Select.tsx          # Accessible custom dropdown
│   ├── Card.tsx            # Elevated glass surface with subtle borders
│   ├── Badge.tsx           # Status chips (e.g. Published, Passed, Medium)
│   ├── Modal.tsx           # Framer-motion accessible focus-trapped dialog
│   ├── StatCard.tsx        # KPI metrics with delta percentage badges
│   ├── SkeletonLoader.tsx  # Shimmer loading placeholders
│   └── EmptyState.tsx      # Contextual actionable empty illustrations
├── common/                 # Shared Composite Elements
│   ├── PageHeader.tsx      # Title, description, action buttons
│   ├── ConfirmDialog.tsx   # Danger/critical action confirmation modal
│   ├── Breadcrumb.tsx      # Hierarchical navigation breadcrumb
│   └── SearchBar.tsx       # Debounced filter search input
├── forms/                  # Form Compounds
│   ├── FormField.tsx       # Label, input, help text, error feedback
│   └── MultiSelect.tsx     # Filter selector for courses/batches
├── tables/                 # Data Grid Compounds
│   ├── DataTable.tsx       # Responsive table with desktop-grid & mobile-cards
│   └── Pagination.tsx      # Server-driven page navigation
├── charts/                 # Visual Analytics
│   ├── WeeklyTrendChart.tsx
│   ├── TopicRadarChart.tsx
│   └── PassRateBarChart.tsx
└── quiz/                   # Exam Engine Canvas Compounds
    ├── ExamTimer.tsx       # Visual countdown derived from target deadline
    ├── QuestionNavigator.tsx # Palette grid of answered/unanswered questions
    ├── AntiCopyDeterrent.tsx # Scoped event locks and security listeners
    └── ViolationWarning.tsx # Tab switch warning dialog
```
