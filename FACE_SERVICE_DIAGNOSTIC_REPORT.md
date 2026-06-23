# Face Service Diagnostic Report

**Generated:** 2026-06-20  
**Issue:** Face Registration shows *"Face service is unavailable. Ensure Qdrant is running on the backend."*

---

## Root Cause

The error was **misleading**. Qdrant was running and healthy. The actual failure was in the **NestJS → FastAPI** step:

| Check | Result |
|-------|--------|
| Qdrant running | ✓ Port 6333 open, collections exist |
| FastAPI JSON `/face/embed` | ✓ Works |
| FastAPI multipart `/face/embed` | ✗ **500 Internal Server Error** |
| Missing dependency | ✗ **`python-multipart` not installed** |

After the FormData upload fix, NestJS sends face images as **multipart** to FastAPI. Without `python-multipart`, FastAPI cannot parse uploads → NestJS receives 503 → frontend showed a generic Qdrant message.

---

## Diagnostic Results

### ✓ FastAPI Status

| Item | Value |
|------|-------|
| URL | `http://localhost:8000` |
| Port open | ✓ Yes |
| `GET /health` | ✓ Responds (basic, pre-restart) |
| JSON embed | ✓ 200 OK |
| Multipart embed (before fix) | ✗ 500 |
| Multipart embed (after `pip install python-multipart`) | ✓ 200 OK (verified in test client) |
| **Live process on :8000** | ⚠ **Needs restart** to load `python-multipart` |

### ✓ Qdrant Status

| Item | Value |
|------|-------|
| URL | `http://localhost:6333` |
| Port open | ✓ Yes |
| `GET /healthz` | ✓ `healthz check passed` |
| Reachable from host | ✓ Yes |

### ✓ Collection Status

| Collection | Exists | Vector Size |
|------------|--------|-------------|
| `users_face_vectors` | ✓ Yes | 128 |
| `products` | ✓ Yes | 128 |
| `fashion_dna_vectors` | ✓ Yes | — |

Auto-create on startup is now enabled in `QdrantService.onModuleInit()`.

### ✓ Environment Variables

| Variable | Value (backend `.env`) |
|----------|------------------------|
| `AI_SERVICE_URL` | `http://localhost:8000` |
| `QDRANT_URL` | `http://localhost:6333` |
| `QDRANT_FACE_COLLECTION` | `users_face_vectors` |
| `FACE_VECTOR_SIZE` | `128` |
| `FACE_SIMILARITY_THRESHOLD` | `0.65` |

### ✗ Failed Connection Point

```
Frontend (FormData)
    → NestJS /api/v1/face/register  ✓
        → FastAPI /face/embed (multipart)  ✗ FAILED (python-multipart missing on running process)
            → Qdrant upsert  (never reached)
```

**Failed at:** `nestjs_to_fastapi` (multipart image upload)

---

## Face Registration Flow (Inspected)

1. **Frontend** — `captureFrame()` → compressed JPEG `File` → `FormData` field `frontFace`
2. **NestJS** — `FaceController` → Multer → `FaceService.resolveEmbedding()` → `AiService.embedFaceFile()`
3. **FastAPI** — `POST /face/embed` (multipart `image`) → face embedding vector
4. **NestJS** — `FaceRepository.upsertFaceVector()` → Qdrant `users_face_vectors`

---

## Fixes Applied

### 1. Dependency fix
- Added `python-multipart>=0.0.9` to `ai-service/requirements.txt`
- Installed in `.venv`

### 2. Health check endpoints

| Endpoint | Service | Description |
|----------|---------|-------------|
| `GET /api/v1/health` | NestJS | API health (existing) |
| `GET /api/v1/ai/health` | NestJS | FastAPI reachability + config |
| `GET /api/v1/qdrant/health` | NestJS | Qdrant reachability + collections |
| `GET /api/v1/health/diagnostics` | NestJS | Combined face pipeline diagnostics |
| `GET /health` | FastAPI | Service + Qdrant + multipart status |
| `GET /qdrant/health` | FastAPI | Qdrant-only health |

### 3. Error handling improvements
- **NestJS `AiService`** — specific messages for connection refused, timeout, missing multipart
- **NestJS `QdrantService`** — specific messages for Qdrant down / misconfigured
- **NestJS `FaceService`** — checks Qdrant health before register/login/verify
- **Frontend `face-errors.js`** — shows backend message for 503 (no UI layout changes)

### 4. Qdrant auto-bootstrap
- Creates `users_face_vectors` and `products` collections on backend startup if missing

---

## Required Restart

Restart both services to apply all fixes:

```powershell
# AI service (required for python-multipart)
cd "c:\Users\hp\Desktop\Wardrobe AI\ai-service"
.\.venv\Scripts\uvicorn.exe app.main:app --host 0.0.0.0 --port 8000

# Backend (required for new health routes + error messages)
cd "c:\Users\hp\Desktop\Wardrobe AI\backend"
npm run build
npm start
```

## Verify After Restart

```powershell
# Combined diagnostics
curl http://localhost:3000/api/v1/health/diagnostics

# Individual checks
curl http://localhost:3000/api/v1/ai/health
curl http://localhost:3000/api/v1/qdrant/health
curl http://localhost:8000/health
curl http://localhost:8000/qdrant/health
```

Then retry face registration at http://localhost:3001/face/register

---

## Files Modified

| File | Change |
|------|--------|
| `ai-service/requirements.txt` | Added `python-multipart` |
| `ai-service/app/routers/health.py` | Qdrant + multipart diagnostics |
| `backend/src/app.controller.js` | `/ai/health`, `/qdrant/health`, `/health/diagnostics` |
| `backend/src/app.service.js` | Diagnostic aggregation |
| `backend/src/modules/ai/services/ai.service.js` | Specific errors + `checkHealth()` |
| `backend/src/database/qdrant.service.js` | Bootstrap, `checkHealth()`, better errors |
| `backend/src/modules/face/services/face.service.js` | Pre-flight Qdrant check |
| `frontend/src/features/face/utils/face-errors.js` | Show actual backend 503 message |
