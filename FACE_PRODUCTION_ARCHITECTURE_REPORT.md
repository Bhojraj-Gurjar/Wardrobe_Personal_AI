# Face Authentication Production Architecture Report

## Summary

Replaced browser-based fake face recognition with a **real FastAPI + Qdrant** pipeline. The frontend now only captures a JPEG and calls NestJS; all embedding, validation, and vector search happen server-side.

**Liveness (blink/smile/head movement) removed** — only single-face detection + similarity matching.

---

## Architecture

```
Frontend (camera → JPEG only)
    ↓
NestJS /api/v1/face/{register|login|verify}
    ↓
FastAPI /face/{register|login|verify|logout}
    ↓
face_recognition encoding + Qdrant vector search/upsert
```

---

## FastAPI Endpoints (NEW)

| Endpoint | Input | Action |
|----------|-------|--------|
| `POST /face/register` | `user_id`, `image` | 1 face check → embed → duplicate search → Qdrant upsert |
| `POST /face/login` | `image` | embed → Qdrant search → return `user_id` + score |
| `POST /face/verify` | `user_id`, `image` | embed → compare stored vector |
| `POST /face/logout` | `user_id`, `image` | same as verify |

Duplicate registration returns **409** `"Face already registered"`.

---

## Frontend (camera only)

**Does:**
1. Open camera
2. Capture one compressed JPEG
3. POST `frontFace` to NestJS
4. Show loading overlay
5. Redirect on success / toast on error
6. 30s timeout (never stuck loading)

**Removed:**
- `use-liveness-checks.js`
- `face-liveness-client.js`
- `embedding.js` (fake client vectors)
- Liveness frame uploads
- Browser blink/smile/head heuristics

---

## Files Changed

### AI Service
- `app/services/face_auth_service.py` — **New**
- `app/routers/face_auth.py` — **New**
- `app/services/qdrant_service.py` — search + get_vector
- `app/routers/face.py` — embed legacy only
- `app/main.py` — mount face_auth router

### Backend
- `modules/face/services/face.service.js` — FastAPI delegation
- `modules/ai/services/ai.service.js` — registerFace, loginFace, verifyFace
- `modules/face/controllers/face.controller.js` — single image upload
- `modules/face/utils/face-upload.util.js` — simplified

### Frontend
- `faceService.js`, `face-login-view.js`, `face-registration-stepper.js`
- `face-verification-camera.js`, hooks, `face-errors.js`

### Deleted
- `use-liveness-checks.js`, `face-liveness-client.js`, `embedding.js`

---

## Error Messages

| Case | Message |
|------|---------|
| No face | No face detected. |
| Multiple faces | Multiple faces detected. |
| Duplicate | Face already registered. |
| Login fail | Face not recognized. |
| Camera | Camera permission denied. |
| Service down | AI service unavailable. |
