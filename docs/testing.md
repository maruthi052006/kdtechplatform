# Enterprise Testing Strategy & Zero-Defect Release Gate
## KDTechX Learning & Assessment Portal
**Version:** 1.0.0-PROD-RC  
**Status:** Approved for Implementation (Phase 0 Discovery)  

---

## 1. Zero-Known-Critical-Defect Release Quality Gate

In accordance with Section 6 of the Master Directive, KDTechX enforces a rigorous release gate. The product will not be signed off as production-ready until every gate passes with verifiable evidence:

```
[ Gate 01: Architecture Validated ]
         ↓
[ Gate 02: Backend Foundation Validated (DRF, PostgreSQL, Health Endpoint) ]
         ↓
[ Gate 03: Database Relational Model & Migrations Validated ]
         ↓
[ Gate 04: Authentication & RBAC Guarding Validated ]
         ↓
[ Gate 05: Admin Management Modules Validated (Courses, Students, Batches) ]
         ↓
[ Gate 06: Student Experience & Enrolled Courses Validated ]
         ↓
[ Gate 07: Question Bank & Excel Ingestion Validated ]
         ↓
[ Gate 08: Server-Authoritative Quiz Engine & Snapshot Validated ]
         ↓
[ Gate 09: Mathematical Scoring & Negative Marking Validated ]
         ↓
[ Gate 10: Security Model & Browser Deterrents Validated ]
         ↓
[ Gate 11: Cross-Device Data Synchronization Validated ]
         ↓
[ Gate 12: Responsive Viewport QA (375px to 1920px) Validated ]
         ↓
[ Gate 13: Accessibility (WCAG AA & Reduced Motion) Validated ]
         ↓
[ Gate 14: Clean Console & Zero Unhandled Promises Validated ]
         ↓
[ Gate 15: Production Bundle & Deployment Config Validated ]
         ↓
[ Gate 16: End-to-End Smoke Test Validated ]
```

---

## 2. Backend Automated Test Suite Plan (`backend/tests/`)

Backend unit and integration tests run via Django's test runner: `python manage.py test`.

### 2.1 Test Module Hierarchy
- `tests/test_auth.py`:
  - Admin login with valid credentials -> returns access + refresh + role=ADMIN.
  - Student login with valid username/student_id -> returns access + refresh + role=STUDENT.
  - Invalid password -> `401 Unauthorized` with descriptive JSON error.
  - Expired / malformed token -> `401 Unauthorized`.
  - Token refresh -> issues valid new access token.
- `tests/test_permissions.py`:
  - Student attempt to create a course -> `403 Forbidden`.
  - Student attempt to query raw question bank with answers -> `403 Forbidden`.
  - Student accessing another student's quiz attempt -> `403 Forbidden`.
- `tests/test_curriculum.py`:
  - Course creation, week creation, topic creation with unique constraints.
  - Student course enrollment uniqueness (`unique_together(student, course)`).
- `tests/test_excel_ingestion.py`:
  - Upload valid `.xlsx` -> 100% valid parsed records.
  - Upload file missing required column (`optionC`) -> rejected with explicit row/column error.
  - Upload file with invalid answer key (`E`) -> rejected with explicit validation report.
  - Malformed/corrupted file upload -> safe error handling without 500 crash.
- `tests/test_quiz_evaluation.py`:
  - Perfect submission: 10/10 correct -> 100% score, `is_passed=True`.
  - All wrong with negative marking (0.25 penalty): 0 correct, 4 wrong -> score = 0 (bounded at 0, no negative total).
  - Mixed submission: 8 correct (8 marks), 2 wrong (-0.50 marks) -> final score 7.50 / 10 (75%).
  - Pass threshold check: 59% on 60% threshold -> `is_passed=False`.
- `tests/test_server_authority.py`:
  - Quiz start creates persistent `AttemptQuestion` snapshot.
  - Client cannot mutate question order after start.
  - Submission after `deadline + grace_period` -> rejected as `TIMED_OUT`.
  - Duplicate submission -> returns existing grade idempotently.

---

## 3. Frontend Static Verification & Quality Checks

```bash
# 1. Type Integrity Check
npm run type-check # tsc --noEmit

# 2. Linter & Code Style
npm run lint

# 3. Production Bundle Build
npm run build
```

The build is considered failed if:
- Any TypeScript type errors exist.
- Any unresolved module imports or unhandled warnings exist.
- The bundle includes hardcoded secrets or broken asset references.

---

## 4. Antigravity Subagent Automated Browser QA Matrix

During Gate verification, the integrated Browser Subagent will inspect the live application:

| View / Workflow | Screen Dimensions | Verification Criteria |
|---|---|---|
| **Marketing Landing** | 1440x900 & 375x812 | Hero visual impact, feature cards, navigation links |
| **Admin Login** | 1440x900 | Credentials submission, redirect to `/admin/dashboard` |
| **Admin Management** | 1440x900 | Create batch, register student, create course |
| **Excel Ingestion** | 1440x900 | File upload modal, validation report table, commit action |
| **Quiz Creation** | 1440x900 | Builder steps, anti-cheat toggle, publish modal |
| **Student Login** | 390x844 (Mobile) | Student authentication, redirect to `/student/dashboard` |
| **Enrolled Courses** | 390x844 (Mobile) | Card layout, curriculum tree, weekly quiz trigger |
| **Exam Engine** | 1440x900 & 375x812 | Fullscreen modal, timer countdown, option radio selection |
| **Exam Deterrents** | 1440x900 | Selection lock, right-click suppression, tab switch notice |
| **Submission & Score**| 1440x900 & 375x812 | Animated score counter, pass/fail badge, answer review |
| **Cohort Results** | 1440x900 | Scorecard grid, Excel export, analytics charts |
| **Console QA** | All views | Zero uncaught exceptions, zero 404 assets, zero CORS errors |
