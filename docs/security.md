# Application Security Architecture & Assessment Deterrents
## KDTechX Learning & Assessment Portal
**Version:** 1.0.0-PROD-RC  
**Status:** Approved for Implementation (Phase 0 Discovery)  

---

## 1. Threat Modeling & Security Principles

Enterprise assessment platforms face distinct security challenges ranging from credential theft to automated scraping of question banks and client-side score manipulation. KDTechX enforces five core security principles:

1. **Zero Client Trust**: All client inputs are considered untrusted. Evaluation, timer validation, and attempt creation occur strictly on the backend.
2. **Confidentiality of Assessment Keys**: Correct answer keys never leave PostgreSQL during an ongoing assessment.
3. **Defense-in-Depth Assessment Deterrents**: Multi-layer browser deterrents discourage casual cheating and record unauthorized actions without compromising assistive accessibility technologies.
4. **Least Privilege Role-Based Access Control (RBAC)**: APIs strictly isolate administrative privileges from student privileges at the DRF permission class layer.
5. **Deterministic Auditability**: Every sensitive administrative mutation and assessment violation is persisted in immutable audit logs.

---

## 2. Authentication & Authorization Architecture

### 2.1 Password Hashing & Secret Protection
- **Algorithm**: Django `PBKDF2PasswordHasher` with SHA-256 (600,000 iterations default) or Argon2.
- Plaintext passwords (e.g. initial `password123`) are hashed immediately upon user creation via `set_password()`.
- Secret tokens (`SECRET_KEY`, `JWT_SIGNING_KEY`, `DATABASE_URL`) are injected exclusively via environment variables and never checked into source control.

### 2.2 JWT Token Lifecycle
```
Client                      Django REST API (SimpleJWT)
  │                                     │
  ├────── POST /api/auth/login/ ───────>│ Validates credentials & status
  │<───── { access, refresh } ──────────┤ Generates 15-min Access + 7-day Refresh
  │                                     │
  ├─ GET /api/courses/ [Bearer Access] ─>│ Validates JWT signature & claims
  │<───── [ { courseData } ] ───────────┤
  │                                     │
  │ (Access Token Expires)              │
  ├────── POST /api/auth/refresh/ ─────>│ Validates refresh token & blacklists
  │<───── { access: new_token } ────────┤ Returns renewed 15-min Access
```

### 2.3 Role-Based Access Control (RBAC) Matrix
| Endpoint / Resource | Admin / Trainer | Enrolled Student | Unenrolled Student | Anonymous |
|---|---|---|---|---|
| `POST /api/students/` | **ALLOW** | `403 Forbidden` | `403 Forbidden` | `401 Unauthorized` |
| `POST /api/courses/` | **ALLOW** | `403 Forbidden` | `403 Forbidden` | `401 Unauthorized` |
| `GET /api/courses/` | **All Courses** | **Enrolled Only**| **Empty List** | `401 Unauthorized` |
| `POST /api/questions/import/`| **ALLOW** | `403 Forbidden` | `403 Forbidden` | `401 Unauthorized` |
| `GET /api/questions/` (Keys)| **Full Keys** | `403 Forbidden` | `403 Forbidden` | `401 Unauthorized` |
| `POST /api/quizzes/{id}/start/`| `400 / Preview`| **ALLOW** | `403 Forbidden` | `401 Unauthorized` |
| `POST /api/quizzes/{id}/submit/`| `400` | **ALLOW** | `403 Forbidden` | `401 Unauthorized` |
| `GET /api/results/{id}/` | **All Results** | **Own Result Only**| `403 Forbidden` | `401 Unauthorized` |

---

## 3. Assessment Integrity: Server-Authoritative Architecture

### 3.1 Separate Question Serializers
To guarantee that answer keys are not leaked in network payloads, DRF uses two separate serializer hierarchies:

```python
# QuestionAdminSerializer (Served only to authenticated Trainers)
class QuestionAdminSerializer(serializers.ModelSerializer):
    class Meta:
        model = Question
        fields = [
            'id', 'course', 'topic', 'question_text',
            'option_a', 'option_b', 'option_c', 'option_d',
            'correct_answer', 'explanation', 'difficulty', 'marks'
        ]

# QuestionStudentExamSerializer (Served strictly to Candidates during Exam)
class QuestionStudentExamSerializer(serializers.ModelSerializer):
    class Meta:
        model = Question
        fields = [
            'id', 'question_text',
            'option_a', 'option_b', 'option_c', 'option_d', 'marks'
            # STRICTLY OMIT: correct_answer, explanation
        ]
```

### 3.2 Server-Authoritative Timer & Deadline Validation
1. When a student starts an exam at $T_0$, the backend computes:
   $$\text{deadline} = T_0 + (\text{duration\_minutes} \times 60) + \text{grace\_period}$$
2. The student's device is given $\text{deadline}$. The frontend timer is an informational visual countdown.
3. When the student submits answers at $T_{sub}$, the server executes:
   ```python
   if timezone.now() > attempt.deadline_at + timedelta(seconds=15): # 15-second network latency buffer
       attempt.status = 'TIMED_OUT'
       # Evaluate only answers saved prior to cutoff
   ```

### 3.3 Server-Side Evaluation Engine
Scoring is calculated atomically inside `submit_quiz_attempt(attempt, submitted_answers)`:
- Correct selection: $+\text{marks}$
- Incorrect selection: $-\text{negative\_marks}$ (if `negative_marking=True`)
- Unanswered: $0$
$$\text{Total Score} = \max\left(0, \sum \text{marks}_{\text{earned}} - \sum \text{penalty}_{\text{wrong}}\right)$$
$$\text{Percentage} = \frac{\text{Total Score}}{\text{Quiz Total Marks}} \times 100$$
$$\text{is\_passed} = \text{Percentage} \ge \text{pass\_percentage}$$

---

## 4. Client-Side Assessment Security Deterrents

*Engineering Classification: Browser-level deterrents raise the barrier to unauthorized assistance. They are accompanied by server-side anomaly logging.*

| Deterrent Mechanism | Implementation Detail | Candidate Experience |
|---|---|---|
| **Text Selection Prevention** | Scoped CSS `user-select: none;` on question containers | Candidate cannot highlight text to copy |
| **Clipboard Suppression** | Interception of `copy`, `cut`, `paste` events | Prevents `Ctrl+C` / `Ctrl+V` shortcuts |
| **Context Menu Lock** | Scoped `onContextMenu={(e) => e.preventDefault()}` | Blocks right-click "Search with Google" / Inspect |
| **Fullscreen Mode** | HTML5 Fullscreen API request upon exam entry | Prompts candidate to stay in immersive viewport |
| **Tab Switch / Blur Tracking**| `document.addEventListener('visibilitychange')` | Dispatches warning dialog; increments `tab_violations` |
| **Concurrent Tab Detection** | HTML5 `BroadcastChannel('kdtechx_exam_channel')` | Blocks opening quiz in a second browser tab |
| **Violation Persistence** | Transmitted to `POST /api/quizzes/{id}/security-event/` | Logged to database for trainer audit review |
