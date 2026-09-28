# Production Deployment Architecture: Vercel, Render & Docker
## KDTechX Learning & Assessment Portal
**Version:** 1.0.0-PROD-RC  
**Status:** Approved for Implementation (Phase 0 Discovery)  

---

## 1. Production Topology Overview

```
                                  [ INTERNET CLIENTS ]
                           (Laptops, Desktops, iOS, Android)
                                           │
                                           │ HTTPS (Port 443)
                                           ▼
                 ┌──────────────────────────────────────────────────┐
                 │                 VERCEL EDGE CDN                  │
                 │              Frontend Static Hosting             │
                 │   - Vite SPA Build (`dist/`)                     │
                 │   - Edge Cache & SSL Termination                 │
                 │   - SPA Rewrites (`vercel.json`)                 │
                 └─────────────────────────┬────────────────────────┘
                                           │
                                           │ HTTPS REST API
                                           │ CORS: https://kdtechx.vercel.app
                                           ▼
                 ┌──────────────────────────────────────────────────┐
                 │                RENDER WEB SERVICE                │
                 │           Dockerized Gunicorn WSGI Tier          │
                 │   - Python 3.14 + Django 5.x + DRF               │
                 │   - WhiteNoise for Admin Static Assets           │
                 │   - Health Check: `/api/health/`                 │
                 │   - Auto-Migration on Deploy                     │
                 └─────────────────────────┬────────────────────────┘
                                           │
                                           │ Encrypted TCP / SSL
                                           │ `DATABASE_URL`
                                           ▼
                 ┌──────────────────────────────────────────────────┐
                 │                RENDER POSTGRESQL                 │
                 │             Managed Database Cluster             │
                 │   - PostgreSQL 16+ Engine                        │
                 │   - Automated Snapshots & Backups                │
                 │   - Connection Pool Max Age: 600s                │
                 └──────────────────────────────────────────────────┘
```

---

## 2. Render Web Service & Docker Configuration

### 2.1 Backend `Dockerfile`
```dockerfile
# Multi-stage production build
FROM python:3.14-slim AS runner

WORKDIR /app

# Prevent Python from writing .pyc files and enable unbuffered output
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PORT=8000

# Install system dependencies for PostgreSQL client and Pillow
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    libpq-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install Python requirements
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend codebase
COPY . .

# Collect static files for WhiteNoise
RUN python manage.py collectstatic --noinput

EXPOSE 8000

# Start Gunicorn binding to Render dynamic PORT
CMD ["sh", "-c", "python manage.py migrate --noinput && gunicorn config.wsgi:application --bind 0.0.0.0:${PORT:-8000} --workers 3 --threads 2 --timeout 60"]
```

### 2.2 Infrastructure-as-Code: `render.yaml`
```yaml
services:
  - type: web
    name: kdtechx-backend-api
    runtime: docker
    dockerfilePath: backend/Dockerfile
    dockerContext: backend
    plan: standard
    region: oregon
    healthCheckPath: /api/health/
    envVars:
      - key: DJANGO_SETTINGS_MODULE
        value: config.settings.production
      - key: DEBUG
        value: "False"
      - key: SECRET_KEY
        generateValue: true
      - key: DATABASE_URL
        fromDatabase:
          name: kdtechx-postgres
          property: connectionString
      - key: ALLOWED_HOSTS
        value: ".onrender.com,localhost,127.0.0.1"
      - key: CORS_ALLOWED_ORIGINS
        value: "https://kdtechx.vercel.app,http://localhost:5173"
      - key: CSRF_TRUSTED_ORIGINS
        value: "https://kdtechx-backend-api.onrender.com,https://kdtechx.vercel.app"

databases:
  - name: kdtechx-postgres
    plan: standard
    region: oregon
    postgresMajorVersion: "16"
```

---

## 3. Vercel Frontend Configuration

### 3.1 Project Settings & SPA Routing (`frontend/vercel.json`)
* **Framework Preset:** Vite
* **Root Directory:** `frontend`
* **Build Command:** `npm run build`
* **Output Directory:** `dist`

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "cleanUrls": true,
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "X-Frame-Options", "value": "DENY" },
        { "key": "X-XSS-Protection", "value": "1; mode=block" }
      ]
    }
  ]
}
```

### 3.2 Frontend Environment Variables
| Variable | Value (Development) | Value (Production) | Description |
|---|---|---|---|
| `VITE_API_BASE_URL` | `http://127.0.0.1:8000/api` | `https://kdtechx-backend-api.onrender.com/api` | Base URL for REST API calls |

---

## 4. Local Development Docker Compose (`docker-compose.yml`)

For developers desiring an identical local PostgreSQL 16 environment:
```yaml
version: '3.8'

services:
  db:
    image: postgres:16-alpine
    container_name: kdtechx_local_db
    restart: always
    environment:
      POSTGRES_DB: kdtechx_db
      POSTGRES_USER: kdtechx_user
      POSTGRES_PASSWORD: kdtechx_secure_pass_2026
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```
*Note: For local systems without Docker installed, the development settings automatically fall back to SQLite with zero code changes.*
