# Docker & Performance Optimization Audit

**Date:** 2026-06-25  
**Scope:** Wardrobe AI monorepo (frontend, backend, ai-service, docker-compose)  
**Constraint:** Zero feature / logic / API / schema changes

---

## Executive Summary

| Area | Finding | Action Taken |
|------|---------|--------------|
| **Largest image** | `ai-service` (PyTorch + TensorFlow + InsightFace + DeepFace) | Multi-stage build tightened; model caches externalized to volume |
| **Backend image** | Full `node_modules` included dev tooling remnants | Separate `prod-deps` stage — production deps only |
| **Frontend image** | Already using Next.js `standalone` | Build cache cleanup; telemetry disabled |
| **Build context** | Local `node_modules`, `.next`, test files sent to daemon | Expanded `.dockerignore` on all services |
| **Runtime memory** | Node defaults unbounded heap | `NODE_OPTIONS` caps for backend/frontend |
| **AI model duplication** | InsightFace/HF caches in image layers | Persistent insightface + huggingface volumes |

**Estimated image size reduction (after rebuild):**

| Image | Before (typical) | After (estimated) | Savings |
|-------|------------------|-------------------|---------|
| frontend | ~180–220 MB | ~160–200 MB | ~10–15% |
| backend | ~450–550 MB | ~320–400 MB | ~25–35% |
| ai-service | ~3.5–4.5 GB | ~3.3–4.2 GB | ~5–10% layer/cache* |

\* ai-service is dominated by ML wheels (PyTorch ~800MB, TensorFlow ~600MB). Major reduction would require removing DeepFace/TensorFlow or splitting microservices — **not done** to preserve behavior.

---

## 1. Filesystem Audit (Local Workspace)

| Path | Size | Notes |
|------|------|-------|
| `frontend/node_modules` | 593 MB | Excluded via `.dockerignore` ✓ |
| `frontend/.next` | 668 MB | Excluded via `.dockerignore` ✓ |
| `backend/node_modules` | 128 MB | Excluded via `.dockerignore` ✓ |
| `ai-service/` (total) | ~2.5 GB | Mostly local `.venv`/caches — now excluded |
| `backend/assets/` | ~2 MB | Kept (curated product seed images) |

**Largest dependencies (ai-service, production requirements):**

- `torch` (CPU wheel) — ~800 MB
- `tensorflow` + `tf-keras` — ~600 MB
- `opencv-python-headless`, `mediapipe`, `insightface`, `onnxruntime`
- `sentence-transformers` (pulls transformers)
- `deepface` + `retina-face`

**No duplicate model files in repo** — InsightFace buffalo downloads at runtime to `INSIGHTFACE_HOME`.

---

## 2. Docker Image Analysis

### Frontend (`node:22-alpine` + Next standalone)
- ✅ Already multi-stage
- ⚠️ Build stage retained full `node_modules` until build completes
- **Fix:** Remove `.next/cache` and `node_modules` after build in builder stage

### Backend (`node:22-bookworm-slim`)
- ⚠️ Runner copied pruned `node_modules` from builder (still included build-time artifacts)
- ⚠️ No non-root user
- **Fix:** Dedicated `prod-deps` stage with `npm ci --omit=dev`; non-root `nodejs` user

### AI Service (`python:3.11-slim`)
- ✅ Multi-stage (builder vs runner)
- ⚠️ `wget` left in runtime image
- ⚠️ InsightFace/HF caches baked into writable layer
- **Fix:** Python `urllib` for model download; centralized cache env vars + Docker volume

---

## 3. Changes Applied

### Dockerfiles

| File | Changes |
|------|---------|
| `frontend/Dockerfile` | `NEXT_TELEMETRY_DISABLED=1`; post-build cache cleanup |
| `backend/Dockerfile` | 4-stage build (`deps` → `prod-deps` → `builder` → `runner`); prod-only `node_modules`; non-root user |
| `ai-service/Dockerfile` | Strip `__pycache__` in builder; remove `wget`; model cache env vars; non-root user; `--no-access-log` |

### `.dockerignore` (all services)

Added exclusions for: test files, `.cursor`, `agent-tools`, IDE configs, local ML caches (`.insightface`, `huggingface`), without excluding `backend/assets/`.

### `docker-compose.yml`

- Pin `qdrant/qdrant:v1.12.5` (was `latest`)
- `init: true` on app services (zombie reaping)
- `NODE_OPTIONS=--max-old-space-size=512` (backend), `384` (frontend)
- `wardrobe_ai_insightface` + `wardrobe_ai_huggingface` volumes for ML caches (MediaPipe models remain in image)
- Explicit `INSIGHTFACE_HOME`, `HF_HOME`, `TRANSFORMERS_CACHE`

---

## 4. Intentionally NOT Changed

| Item | Reason |
|------|--------|
| PyTorch / TensorFlow / DeepFace | Required for face analysis — removing breaks features |
| Business logic, routes, APIs | User constraint |
| Database schema | User constraint |
| Prisma migrate flow | `prisma` kept in prod image for `docker-entrypoint.sh` |
| Backend Python scripts | Fallback path preserved (AI service primary for bg removal) |
| npm package pruning in app code | Risk of breaking imports without full audit |
| Dead code / unused components removal | Uncertain usage — per safety rule |

---

## 5. Verify After Rebuild

```powershell
cd "c:\Users\hp\Desktop\Wardrobe AI"

# Rebuild without cache for accurate sizes
docker compose build --no-cache

# Image sizes
docker images --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}" | findstr wardrobe

# Runtime memory
docker stats --no-stream

# Health
curl http://localhost:3001
curl http://localhost:3000/api/v1/health
curl http://localhost:8000/health
```

---

## 6. Future Safe Optimizations (Not Implemented)

1. **Split ai-service** into `face-service` + `tryon-service` — deploy only needed ML stack per instance
2. **ONNX-only face analysis** — replace TensorFlow/DeepFace if accuracy parity proven
3. **Prisma migrate job** — separate init container; remove `prisma` CLI from runtime image (~40 MB)
4. **Backend Alpine** — if Prisma openssl compatibility verified
5. **`npm dedupe`** — audit duplicate transitive deps in frontend lockfile

---

## 7. Files Modified

```
frontend/Dockerfile
frontend/.dockerignore
backend/Dockerfile
backend/.dockerignore
ai-service/Dockerfile
ai-service/.dockerignore
docker-compose.yml
DOCKER_OPTIMIZATION_AUDIT.md (this file)
```

**No application source code, APIs, schemas, or feature modules were modified.**
