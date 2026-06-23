# Face Registration Diagnostic Report

**Error shown:** `AI service request failed`  
**Generated:** 2026-06-20

---

## Executive Summary

Face registration fails at **`NestJS → FastAPI`** (layer 3 of 4). Qdrant is healthy. The live FastAPI process on port **8000** was started **before** `python-multipart` was installed and **before** the latest error-handling code — it returns HTTP **500** with plain text `Internal Server Error` on multipart uploads, which NestJS surfaced as the generic message.

---

## End-to-End Flow (Inspected)

```
1. Frontend (localhost:3001)
   captureFrame() → compressed JPEG File
   FormData field: frontFace
   POST /api/v1/face/register
        ↓ ✓ (request reaches NestJS)

2. NestJS (localhost:3000)
   Multer receives file → FaceService.register()
   AiService.embedFaceFile() → POST http://localhost:8000/face/embed (multipart)
        ↓ ✗ FAILS HERE

3. FastAPI (localhost:8000)  ← STALE PROCESS
   POST /face/embed (multipart)
   Returns: HTTP 500 "Internal Server Error" (no JSON body)
        ↓ (never reached)

4. Qdrant (localhost:6333)
   upsert users_face_vectors
        ↓ (never reached)
```

---

## Diagnostic Results

| Layer | Status | Details |
|-------|--------|---------|
| ✓ **Frontend** | OK | Port 3001 open. Sends FormData `frontFace`. Logs: `[FaceUpload] register \| url=... \| payload=N bytes` |
| ✓ **NestJS** | OK | Port 3000 open. `/api/v1/health` OK. New routes need restart for `/ai/health`, `/qdrant/health`, `/health/diagnostics` |
| ✗ **FastAPI (live :8000)** | **FAILING** | JSON embed: OK. **Multipart embed: HTTP 500** plain text. Stale process without `python-multipart` |
| ✓ **FastAPI (new code, TestClient)** | OK | Multipart embed: **200**, embedding 128-dim, full logging works |
| ✓ **Qdrant** | OK | Port 6333 open. Collection `users_face_vectors` exists |

### ✓ Collection Status

| Collection | Exists | Vector Size |
|------------|--------|-------------|
| `users_face_vectors` | Yes | 128 |
| `products` | Yes | 128 |
| `fashion_dna_vectors` | Yes | — |

Auto-create on NestJS startup: enabled in `QdrantService.onModuleInit()`.

### ✓ Environment Variables

| Variable | Value |
|----------|-------|
| `AI_SERVICE_URL` | `http://localhost:8000` |
| `QDRANT_URL` | `http://localhost:6333` |
| `QDRANT_FACE_COLLECTION` | `users_face_vectors` |
| `FACE_VECTOR_SIZE` | `128` |

### ✗ Exact Failing Layer

**`nestjs_to_fastapi`** — NestJS cannot get embedding from FastAPI multipart `/face/embed`

**Root cause:** Live uvicorn on :8000 is a stale process. Updated code + `python-multipart` work when tested locally (TestClient: 200 OK).

---

## Why "AI service request failed" Appeared

NestJS `AiService.mapResponseError()` received:
- HTTP status: **500**
- Body: plain text `Internal Server Error` (not JSON)
- No `detail` field → fell back to generic message

**Fixed:** NestJS now reads raw response text and returns:
> `Embedding generation failed: FastAPI internal error on /face/embed (HTTP 500). Restart AI service — ensure python-multipart is installed`

FastAPI now returns JSON `{ "detail": "..." }` for all errors (never plain text).

---

## Health Endpoints

| Endpoint | Service | Status |
|----------|---------|--------|
| `GET /api/v1/health` | NestJS | ✓ Live |
| `GET /api/v1/ai/health` | NestJS → FastAPI | Needs backend restart |
| `GET /api/v1/qdrant/health` | NestJS → Qdrant | Needs backend restart |
| `GET /api/v1/health/diagnostics` | Full pipeline | Needs backend restart |
| `GET /health` | FastAPI | ✓ Live (basic); enhanced after AI restart |
| `GET /qdrant/health` | FastAPI → Qdrant | After AI restart |

---

## Logging Added

### Frontend (`faceService.js`)
```
[FaceUpload] register | url=http://localhost:3000/api/v1/face/register | payload=45231 bytes | field=frontFace
```

### NestJS
- **FaceController:** file size on receive
- **FaceService:** Qdrant ready, embed call, upsert result
- **AiService:** `→ FastAPI POST /face/embed | url=... | payload=N bytes`
- **AiService:** `← FastAPI POST /face/embed | status=500 | body=...`

### FastAPI (`face.py`)
```
POST /face/embed received | content-type=multipart/form-data
Image payload read | bytes=42659
Image decoded | size=1024x575
Embedding generated | dimensions=128
```

---

## Specific Error Messages (No More Generic)

| Condition | Message |
|-----------|---------|
| FastAPI down | `FastAPI not running — connection refused at ...` |
| Missing multipart | `FastAPI missing python-multipart. Run: pip install python-multipart` |
| HTTP 500 (stale) | `Embedding generation failed: FastAPI internal error...` |
| Bad image | `Invalid image: ...` |
| Face not detected | `Face not detected: ...` |
| Qdrant down | `Qdrant is not running (connection refused)...` |
| Qdrant not configured | `Qdrant unavailable — QDRANT_URL is not configured` |
| Collection issue | Auto-created on startup; health reports status |

---

## Required Action: Restart Services

```powershell
# 1. Restart AI service (CRITICAL)
cd "c:\Users\hp\Desktop\Wardrobe AI\ai-service"
# Stop existing process on port 8000 first (Ctrl+C in its terminal)
.\.venv\Scripts\uvicorn.exe app.main:app --host 0.0.0.0 --port 8000 --log-level info

# 2. Restart backend (for new health routes + logging)
cd "c:\Users\hp\Desktop\Wardrobe AI\backend"
npm run build
npm start
```

## Verify After Restart

```powershell
curl http://localhost:8000/health
curl http://localhost:3000/api/v1/health/diagnostics
curl http://localhost:3000/api/v1/ai/health
curl http://localhost:3000/api/v1/qdrant/health
```

Then retry: http://localhost:3001/face/register

---

## Files Modified

| File | Change |
|------|--------|
| `backend/src/modules/ai/services/ai.service.js` | Raw body parsing, detailed logs, specific errors |
| `backend/src/modules/face/services/face.service.js` | Pipeline logging |
| `backend/src/modules/face/controllers/face.controller.js` | Request received logging |
| `backend/src/app.service.js` | Enhanced diagnostics |
| `frontend/src/features/face/services/faceService.js` | `[FaceUpload]` console logs |
| `ai-service/app/routers/face.py` | Step logging, JSON errors, multipart check |
| `ai-service/app/main.py` | Global JSON exception handler, logging config |
