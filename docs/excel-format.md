# KDTechX Excel & CSV Question Ingestion Format Specification

## 1. Overview
The KDTechX Assessment Engine supports bulk question importing via `.xlsx` and `.csv` files.
Imported questions are parsed, verified through strict schema validation (both client-side and server-authoritative backend validation), and committed atomically to PostgreSQL within a database transaction.

---

## 2. Spreadsheet Column Specification

| Column Header | Required | Type | Allowed Values / Format | Description |
|:---|:---:|:---:|:---|:---|
| `id` | No | String/Integer | Unique code or empty | Optional external ID tracking |
| `question` | **Yes** | Text | 5 - 2000 chars | The full stem/text of the MCQ problem |
| `optionA` | **Yes** | Text | Non-empty text | Choice content for Option A |
| `optionB` | **Yes** | Text | Non-empty text | Choice content for Option B |
| `optionC` | **Yes** | Text | Non-empty text | Choice content for Option C |
| `optionD` | **Yes** | Text | Non-empty text | Choice content for Option D |
| `answer` | **Yes** | Character | `A`, `B`, `C`, `D` | The correct option key (case-insensitive) |
| `topic` | No | Text | e.g. "Data Structures", "Loops" | Curricular topic tag (defaults to "General") |
| `difficulty` | No | Enum | `easy`, `medium`, `hard` | Bloom's taxonomy difficulty level (default: `medium`) |
| `explanation` | No | Text | Optional rationale text | Provided to candidates on the post-exam scorecard review |
| `marks` | No | Decimal | Numeric > 0 (e.g. `1.0`, `2.0`, `10.0`) | Weight of question in assessment (default: `1.00`) |

---

## 3. Sample Spreadsheet Row Example

```csv
id,question,optionA,optionB,optionC,optionD,answer,topic,difficulty,explanation,marks
1,"What is the output of print(type([])) in Python?","<class 'tuple'>","<class 'list'>","<class 'dict'>","<class 'set'>",B,"Python Basics",easy,"[] denotes an empty list literal in Python.",1.0
2,"Which data structure provides O(1) average-time dictionary key lookups?","Array","Linked List","Hash Table","Binary Search Tree",C,"Algorithms",medium,"Hash tables use hash functions to index memory directly.",2.0
```

---

## 4. Multi-Stage Validation Workflow

```
[ Upload .xlsx / .csv ]
          │
          ▼
[ Client SheetJS In-Memory Parser ]
          │
          ├─► Validates non-empty question & options A-D
          ├─► Normalizes Answer keys to uppercase (A, B, C, D)
          ├─► Verifies difficulty in ['easy', 'medium', 'hard']
          ├─► Renders preview grid with Pass/Fail row indicators
          │
          ▼
[ POST /api/questions/import-excel/ ]
          │
          ├─► Django REST Framework Schema Validation
          ├─► Database Transaction (transaction.atomic)
          ├─► Duplication and SQL injection prevention
          │
          ▼
[ Authoritative PostgreSQL Ingestion Complete ]
```

---

## 5. Error Handling & Edge Cases
1. **Missing Options**: Rows with missing option text (e.g. option C left empty) are rejected with row-specific errors.
2. **Invalid Answer Key**: Values such as `E`, `True`, `optionB` are flagged; only `A`, `B`, `C`, or `D` are permitted.
3. **Empty Rows**: Trailing blank rows from spreadsheet editors are automatically stripped.
4. **Encoding**: UTF-8 and special technical characters (e.g. `<`, `>`, `&`, quotes) are fully supported without HTML corruption.
