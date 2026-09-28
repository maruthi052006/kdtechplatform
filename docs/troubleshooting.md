# KDTechX Troubleshooting & Operational Runbook

## 1. Authentication & Token Issues

### Symptom: `401 Unauthorized` on API requests
- **Cause**: JWT access token expired (15-minute validity) or refresh token invalid.
- **Remedy**:
  - The frontend Axios interceptor (`src/services/api.js`) automatically intercepts 401s and attempts silent token rotation via `POST /api/auth/token/refresh/`.
  - If refresh token also expires (7 days), user session is cleared and redirected to `/login`.
  - Clear expired browser localStorage keys: `kdtechx_access_token` and `kdtechx_refresh_token`.

### Symptom: Student cannot start assessment (`403 Forbidden`)
- **Cause**:
  1. The student account is not enrolled in the course associated with the quiz.
  2. The quiz is in `draft` or `archived` status.
  3. The student has exceeded the `max_attempts` configured for the quiz.
- **Remedy**:
  - Trainer must verify course enrollment in `/admin/courses` -> Student Cohort.
  - Check quiz status in `/admin/quizzes` and ensure it is marked as `published`.

---

## 2. Cross-Device Synchronization

### Symptom: Changes made on laptop not showing on mobile device
- **Cause**: Browser cache or delayed sync polling.
- **Remedy**:
  - Trigger manual pull by navigating to any page or pulling down to refresh.
  - The client background sync engine (`src/services/syncService.js`) synchronizes with PostgreSQL upon each navigation event.
  - Confirm both devices are connected to the same backend instance via `VITE_API_BASE_URL`.

---

## 3. Assessment & Anti-Cheat Engine

### Symptom: Candidate received warning modal while taking quiz
- **Cause**: The browser detected a `visibilitychange` event (tab switch, window minimization, or application switcher shortcut).
- **Remedy**:
  - The system logs an immutable `SecurityEvent` to PostgreSQL (`apps.audit.models.SecurityEvent`).
  - If `auto_submit_on_violations` is enabled on the quiz and violations exceed `tab_warning_limit` (default: 3), the attempt is automatically finalized and scored.

### Symptom: Browser refreshed during exam
- **Cause**: Candidate accidentally hit F5 or closed the tab.
- **Remedy**:
  - When candidate returns to `/student/quiz/:id`, `POST /api/attempts/quiz/:id/start/` detects the active in-progress attempt.
  - The server returns the identical randomized question snapshot and recalculates `remaining_seconds = max(0, deadline_at - now)`.
  - Questions and options retain their exact locked display ordering.

---

## 4. Backend Deployment (Render / PostgreSQL)

### Symptom: `gunicorn: command not found` or worker boot error
- **Cause**: Missing virtualenv packages or improper WSGI entrypoint.
- **Remedy**: Ensure `requirements.txt` contains `gunicorn==21.2.0` and start command is:
  ```bash
  gunicorn config.wsgi:application --bind 0.0.0.0:$PORT --workers 4 --threads 2
  ```

### Symptom: Database connection timeout (`psycopg2.OperationalError`)
- **Cause**: Unreachable `DATABASE_URL` or SSL configuration mismatch.
- **Remedy**:
  - Verify `DATABASE_URL` format: `postgres://user:password@hostname:5432/dbname`.
  - Ensure SSL mode is enabled for managed PostgreSQL (`sslmode=require`).

---

## 5. Frontend Deployment (Vercel)

### Symptom: Direct URL navigation returns 404 (e.g. `/student/quizzes`)
- **Cause**: Missing Single Page Application (SPA) rewrite rule.
- **Remedy**:
  - Ensure `vercel.json` contains:
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
