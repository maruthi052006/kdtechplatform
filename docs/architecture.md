# System Architecture Document
## KDTechX Learning & Assessment Portal
**Version:** 1.0.0-PROD-RC  
**Author:** Principal Software Architect & Staff Engineering Team  
**Status:** Approved for Implementation (Phase 0 Discovery)  

---

## 1. Executive Architecture Summary

The **KDTechX Learning & Assessment Portal** is an enterprise-grade Software-as-a-Service (SaaS) training and assessment platform designed for technical institutes, engineering bootcamps, and enterprise learning cohorts. The platform unifies curriculum tracking, weekly scheduled assessments, deterministic server-authoritative scoring, and cohort analytics.

### Core Architectural Axiom: Single Source of Truth
Client applications (React Single Page Applications on desktop, laptop, tablet, and mobile browsers) are **untrusted presentation tiers**. The authoritative single source of truth for all persistent state, quiz configurations, question bank items, attempt snapshots, remaining time, answer evaluation, and scoring is the **PostgreSQL database managed by Django REST Framework**.

```
                ┌─────────────────────────────────────────────────────────┐
                │                     CLIENT TIER                         │
                │        React 19 + TypeScript + Vite + Tailwind          │
                │   (Laptop / Desktop / iPhone / Android / Tablet)        │
                └──────────────────────────┬──────────────────────────────┘
                                           │
                                     HTTPS │ JWT Auth
                                           ▼
                ┌─────────────────────────────────────────────────────────┐
                │                    EDGE & CDN TIER                      │
                │                   Vercel Edge Network                   │
                │         SPA Rewrites, SSL Termination, Asset CDN        │
                └──────────────────────────┬──────────────────────────────┘
                                           │
                                     REST API │ JSON
                                           ▼
                ┌─────────────────────────────────────────────────────────┐
                │                   APPLICATION TIER                      │
                │              Render Web Service (Gunicorn)              │
                │          Django 5.x + Django REST Framework             │
                │     SimpleJWT, CORS Middleware, WhiteNoise, DRF-Spec    │
                └──────────────────────────┬──────────────────────────────┘
                                           │
                                 TCP/SSL   │ Connection Pool
                                           ▼
                ┌─────────────────────────────────────────────────────────┐
                │                      DATA TIER                          │
                │               Render Managed PostgreSQL                 │
                │       ACID Transactions, Strict Constraints, Indexes    │
                └─────────────────────────────────────────────────────────┘
```

---

## 2. Cross-Device Data Synchronization Model

A critical failure mode of frontend-only or mock-based applications is state fragmentation across devices. In the KDTechX platform, cross-device data synchronization is guaranteed by strict server authority.

### Scenario A: Cohort Management Synchronization
1. **Admin Laptop**: Trainer creates a new student (`KDX26010`) in "Python Full Stack 2026" via the Admin Portal.
2. **REST API**: Client sends `POST /api/students/` with an Authorization header (`Bearer <JWT>`).
3. **Django Backend**: Validates permissions, creates `User` (hashed password) and `StudentProfile`, and commits within an atomic database transaction.
4. **PostgreSQL**: Records are persisted in `accounts_user` and `students_studentprofile`.
5. **Admin Mobile**: Trainer opens the portal on an iPhone or Android tablet. A query to `GET /api/students/?batch=batch_pfs_2026` immediately returns the freshly registered student directly from PostgreSQL.

### Scenario B: Concurrent Quiz Attempt Lifecycle
1. **Student Mobile Phone**: Learner taps "Start Assessment" for Week 4 Quiz.
2. **Server Snapshot Generation**: `POST /api/quizzes/{id}/start/` generates a persisted `QuizAttempt` row with:
   - Server-assigned start timestamp (`started_at`).
   - Server-calculated immutable deadline (`deadline = started_at + duration`).
   - Randomized or snapshot question order stored in `AttemptQuestion` relational records.
   - Stripped question choices (without answer keys).
3. **Student Desktop / Refresh**: If the student accidentally refreshes or switches to their laptop, `GET /api/quizzes/{id}/active-attempt/` returns the exact same snapshot and remaining duration calculated from `deadline - CURRENT_TIMESTAMP`.
4. **Answer Submission**: Student submits answers via `POST /api/quizzes/{id}/submit/`.
5. **Backend Evaluation**: Django validates that `CURRENT_TIMESTAMP <= deadline + grace_period`, compares against stored answer keys in PostgreSQL, calculates score, correct/wrong tallies, and updates `QuizAttempt` to `COMPLETED`.
6. **Admin Laptop Real-time View**: When the trainer refreshes the Cohort Results Dashboard, `GET /api/results/` immediately shows the finalized grade.

---

## 3. Tier-by-Tier Technical Specifications

### 3.1 Frontend Tier
- **Framework**: React 19 with TypeScript
- **Bundler & Tooling**: Vite 6+
- **Styling**: Tailwind CSS v4, custom CSS custom properties, and scoped utility layers
- **State Management**: Context API for session/theme/toasts + Axios HTTP Client with JWT interceptors
- **Animation**: Framer Motion 12+ for accessible, GPU-accelerated micro-interactions
- **Data Visualization**: Recharts 3+ for responsive analytical dashboards
- **Spreadsheet Parsing**: SheetJS (`xlsx`) for client preview and template generation
- **Icons**: Lucide React

### 3.2 Backend Tier
- **Language & Runtime**: Python 3.14+
- **Framework**: Django 5.x & Django REST Framework (DRF)
- **Authentication**: `django-rest-framework-simplejwt` with asymmetric/symmetric token verification
- **CORS Handling**: `django-cors-headers` with environment-restricted origins
- **API Documentation**: `drf-spectacular` (OpenAPI 3.0 schema generation + Swagger UI)
- **Spreadsheet Processing**: `openpyxl` for secure server-side Excel validation and ingestion
- **Static Assets**: WhiteNoise for Gunicorn-served administrative assets

### 3.3 Database Tier
- **Engine**: PostgreSQL 16+
- **ORM**: Django ORM with explicit database constraints, foreign keys, compound indexes, and `select_related`/`prefetch_related` optimizations.
- **Transactions**: `django.db.transaction.atomic` on all multi-row write operations (e.g. bulk question import, quiz snapshot creation, attempt submission).

---

## 4. Architectural Non-Negotiables

1. **Answer Key Secrecy**: The field `correct_answer` MUST NEVER appear in any serializer or API response served to students prior to official quiz submission and graded result release.
2. **Timer Authority**: The client countdown timer is purely a visual affordance. Attempt validity is determined by PostgreSQL timestamps: `timezone.now() <= attempt.deadline + GRACE_PERIOD`.
3. **Role-Based Access Control (RBAC)**: All administrative endpoints are guarded by `IsAuthenticated` and `IsAdminRole`. Students accessing administrative routes receive `403 Forbidden`.
4. **No Untrusted Frontend Scoring**: Quizzes are scored exclusively inside the Django backend using server-side transactions.
5. **Idempotent Submission**: Duplicate submissions on the same `QuizAttempt` will return the already computed result without mutating score records.
