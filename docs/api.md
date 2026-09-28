# REST API Contract & Endpoints Specification
## KDTechX Learning & Assessment Portal
**Version:** 1.0.0-PROD-RC  
**Base URL:** `/api`  
**Security:** Bearer JWT Token (`Authorization: Bearer <access_token>`)  
**Status:** Approved for Implementation (Phase 0 Discovery)  

---

## 1. Global Standard Response Format

All responses use standard HTTP status codes and uniform JSON payloads.

### Success Response Envelope
```json
{
  "success": true,
  "data": { ... },
  "message": "Operation completed successfully"
}
```

### Error Response Envelope
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_FAILED",
    "message": "One or more submitted fields are invalid.",
    "details": {
      "email": ["A student with this email address already exists."]
    }
  }
}
```

---

## 2. Health & System Diagnostic Endpoints

### `GET /api/health/`
Checks application runtime and PostgreSQL connectivity.
- **Access**: Public
- **Response**: `200 OK`
```json
{
  "status": "ok",
  "database": "connected",
  "version": "1.0.0",
  "timestamp": "2026-09-28T11:20:00Z"
}
```

---

## 3. Authentication & Session Endpoints (`/api/auth/`)

### `POST /api/auth/login/`
Authenticates Admin or Student and returns JWT key pair.
- **Request Body**:
```json
{
  "username": "arun",
  "password": "password123",
  "portal": "student" // or "admin"
}
```
- **Response**: `200 OK`
```json
{
  "access": "eyJhbGciOi...",
  "refresh": "eyJhbGciOi...",
  "user": {
    "id": "std_uuid_01",
    "role": "STUDENT",
    "name": "Arun Kumar",
    "username": "arun",
    "email": "arun.kumar@kdtechx.edu",
    "student_id": "KDX26001",
    "batch": { "id": "batch_uuid_01", "name": "Python Full Stack 2026" },
    "assigned_courses": ["py_fs_101", "react_js_201"]
  }
}
```

### `POST /api/auth/refresh/`
Refreshes access token using refresh token.
- **Request Body**: `{ "refresh": "eyJhbGciOi..." }`
- **Response**: `200 OK` `{ "access": "eyJhbGciOi..." }`

### `GET /api/auth/me/`
Returns current authenticated user context and profile.
- **Headers**: `Authorization: Bearer <token>`
- **Response**: `200 OK`

---

## 4. Student & Batch Management (`/api/students/`, `/api/batches/`)

### `GET /api/students/`
Lists students with pagination, search, and batch filtering.
- **Access**: Admin only
- **Query Params**: `?search=arun&batch=uuid&status=ACTIVE&page=1&page_size=20`
- **Response**: `200 OK` (Paginated student list with enrolled course counts and average scores)

### `POST /api/students/`
Registers a new student profile and system account.
- **Access**: Admin only
- **Request Body**:
```json
{
  "name": "Siddharth Rao",
  "student_id": "KDX26010",
  "username": "siddharth",
  "email": "siddharth.rao@kdtechx.edu",
  "password": "TempPassword123!",
  "batch_id": "batch_uuid_01",
  "course_ids": ["course_uuid_pyfs"],
  "status": "ACTIVE"
}
```
- **Response**: `201 Created`

### `GET /api/batches/`
Lists all cohort batches.
- **Access**: Authenticated

### `POST /api/batches/`
Creates a new cohort batch.
- **Access**: Admin only

---

## 5. Course & Curriculum Endpoints (`/api/courses/`, `/api/curriculum/`)

### `GET /api/courses/`
- **For Admin**: Returns all courses (including DRAFT, ARCHIVED).
- **For Student**: Returns strictly assigned/enrolled courses.

### `POST /api/courses/`
Creates course metadata.
- **Access**: Admin only

### `GET /api/courses/{id}/curriculum/`
Returns full structured curriculum tree: Weeks -> Topics -> Associated Quizzes.

### `POST /api/curriculum/weeks/` & `POST /api/curriculum/topics/`
Enables trainers to add, reorder, edit, and delete weeks and topic modules.

---

## 6. Question Bank & Excel Ingestion (`/api/questions/`)

### `GET /api/questions/`
- **Access**: Admin only
- **Query Params**: `?course_id=uuid&topic_id=uuid&difficulty=MEDIUM&search=decorator`
- **Security**: Contains `correct_answer`, `explanation`, and `marks`.

### `POST /api/questions/validate-excel/`
Validates uploaded spreadsheet before persistent database commit.
- **Access**: Admin only
- **Payload**: `multipart/form-data` with `.xlsx` or `.csv` file.
- **Response**: `200 OK` with summary:
```json
{
  "valid_rows_count": 25,
  "invalid_rows_count": 2,
  "errors": [
    { "row": 12, "column": "answer", "message": "Invalid answer key 'E'. Must be A, B, C, or D." }
  ],
  "preview": [ ...first 5 parsed rows... ]
}
```

### `POST /api/questions/commit-excel/`
Atomically persists validated questions to PostgreSQL.
- **Access**: Admin only
- **Payload**: Validated payload or staging token with `course_id`.

---

## 7. Server-Authoritative Quiz Engine (`/api/quizzes/`)

### `GET /api/quizzes/`
Lists quizzes.
- **Admin**: All statuses with detailed analytics.
- **Student**: Active/upcoming quizzes for enrolled courses only.

### `POST /api/quizzes/`
Quiz Builder endpoint to schedule, select questions, and configure anti-cheat deterrents.
- **Access**: Admin only

### `POST /api/quizzes/{id}/publish/`
Locks and transitions quiz status from `DRAFT` to `PUBLISHED`.
- **Access**: Admin only

### `POST /api/quizzes/{id}/start/`
Initiates a candidate quiz attempt or recovers an in-flight attempt.
- **Access**: Student only
- **Server Validations**:
  1. Student is actively enrolled in quiz course.
  2. Quiz status is `PUBLISHED`.
  3. `timezone.now()` is between `start_at` and `deadline`.
  4. Number of past attempts is less than `max_attempts`.
- **Response**: `200 OK`
```json
{
  "attempt_id": "attempt_uuid_99",
  "attempt_number": 1,
  "started_at": "2026-09-28T11:20:00Z",
  "deadline_at": "2026-09-28T11:50:00Z",
  "duration_seconds": 1800,
  "remaining_seconds": 1785,
  "security_settings": {
    "require_fullscreen": true,
    "tab_warning_limit": 3,
    "prevent_copy": true
  },
  "questions": [
    {
      "snapshot_id": "snap_uuid_01",
      "display_order": 1,
      "question_text": "What is the primary function of Python's @property decorator?",
      "option_a": "Marks a method as private",
      "option_b": "Defines getter and setter interface for class attributes",
      "option_c": "Enforces static type checking at runtime",
      "option_d": "Converts an instance method into a class method",
      "marks": 1.0
      // NOTE: correct_answer and explanation are STRICTLY OMITTED
    }
  ]
}
```

### `POST /api/quizzes/{id}/save-answer/`
Progressive auto-save endpoint to prevent data loss on network drops.
- **Request Body**:
```json
{
  "attempt_id": "attempt_uuid_99",
  "snapshot_id": "snap_uuid_01",
  "selected_option": "B"
}
```

### `POST /api/quizzes/{id}/security-event/`
Logs deterrent violations (tab switches, fullscreen exits).
- **Request Body**:
```json
{
  "attempt_id": "attempt_uuid_99",
  "event_type": "TAB_SWITCH",
  "details": { "duration_hidden_ms": 2400 }
}
```

### `POST /api/quizzes/{id}/submit/`
Finalizes attempt, runs deterministic server-side evaluation, and computes scores.
- **Request Body**:
```json
{
  "attempt_id": "attempt_uuid_99",
  "answers": [
    { "snapshot_id": "snap_uuid_01", "selected_option": "B" }
  ]
}
```
- **Response**: `200 OK`
```json
{
  "result_id": "attempt_uuid_99",
  "score": 84.0,
  "total_marks": 100.0,
  "percentage": 84.0,
  "is_passed": true,
  "correct_count": 21,
  "wrong_count": 4,
  "unanswered_count": 0,
  "time_taken_seconds": 1334,
  "submitted_at": "2026-09-28T11:42:14Z"
}
```

---

## 8. Results & Cohort Analytics (`/api/results/`, `/api/analytics/`)

### `GET /api/results/{id}/`
Returns detailed scorecard. If `show_answers` is enabled on the quiz, reveals itemized question breakdown with correct keys and explanations.

### `GET /api/analytics/admin/`
Returns cohort-wide KPI aggregations, weekly grade trajectories, question accuracy histograms, and pass/fail distributions.

### `GET /api/analytics/student/`
Returns student-specific learning progress, competency radar by topic, and milestone velocity.
