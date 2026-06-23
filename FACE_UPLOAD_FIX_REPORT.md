# Face Upload Fix Report

## Summary

Fixed **"request entity too large"** errors during Face Registration, Face Login, and Face Logout by replacing oversized Base64 JSON payloads with compressed binary multipart uploads and raising server body/file limits across the stack.

---

## 1. Previous Upload Method

| Layer | Method | Details |
|-------|--------|---------|
| **Frontend** | Base64 data URL in JSON | `canvas.toDataURL('image/jpeg', 0.92)` at full camera resolution (~1280×720), sent as `{ "image": "data:image/jpeg;base64,..." }` |
| **API client** | `Content-Type: application/json` | Entire payload JSON-stringified (~33% larger than raw bytes) |
| **NestJS** | Default Express body limit | ~100kb default — rejected large Base64 payloads |
| **NestJS → AI** | JSON `{ image: base64 }` | Re-encoded binary as Base64 again |
| **FastAPI** | JSON body only | `FaceEmbedRequest.image: str` (Base64/data URL) |

**Typical payload size (before):** 500KB–2MB+ JSON per request → exceeded default NestJS limit.

---

## 2. New Upload Method

| Layer | Method | Details |
|-------|--------|---------|
| **Frontend** | Compressed JPEG `File` in `FormData` | Resize to **640px** max width, **JPEG quality 0.7**, field name `frontFace` |
| **API client** | Multipart (no manual Content-Type) | Browser sets `multipart/form-data` boundary automatically |
| **NestJS** | Multer `FileInterceptor('frontFace')` | In-memory storage, forwards raw buffer to AI service |
| **NestJS → AI** | Multipart `FormData` | Field `image` as binary blob; verify also sends `stored_embedding` as JSON form field |
| **FastAPI** | `UploadFile` + `File()` | Accepts multipart binary; legacy JSON Base64 still supported |

**Typical payload size (after):** ~20–80KB binary JPEG per request.

---

## 3. Updated Size Limits

| Service | Setting | Value |
|---------|---------|-------|
| **NestJS** | JSON body parser | `20mb` |
| **NestJS** | URL-encoded body parser | `20mb` |
| **NestJS** | Multer file limit (`frontFace`) | `10MB` |
| **FastAPI** | Max upload bytes (`decode_image_bytes`) | `10MB` |
| **Frontend** | Image compression | Max width **640px**, JPEG quality **0.7** |

---

## 4. Files Modified

### Frontend
| File | Change |
|------|--------|
| `frontend/src/features/face/utils/prepare-face-image.js` | **New** — resize + JPEG compress utilities |
| `frontend/src/features/face/hooks/use-camera.js` | `captureFrame()` returns compressed `File` blob |
| `frontend/src/features/face/services/faceService.js` | FormData upload with `frontFace` field |
| `frontend/src/services/api-client.js` | FormData support (skip JSON Content-Type) |
| `frontend/src/features/face/components/face-registration-stepper.js` | Async capture |
| `frontend/src/features/face/components/face-login-view.js` | Async capture |
| `frontend/src/features/face/components/face-verification-camera.js` | Async capture (Face Logout verify) |
| `frontend/src/features/face/components/camera-preview.js` | Preview Blob/File via object URL |
| `frontend/src/features/face/utils/face-errors.js` | User-friendly 413 message |

### Backend (NestJS)
| File | Change |
|------|--------|
| `backend/src/main.js` | `useBodyParser` limits → 20mb |
| `backend/src/modules/face/controllers/face.controller.js` | Multer interceptor + multipart/JSON dual support |
| `backend/src/modules/face/utils/face-upload.util.js` | **New** — DTO builder from file or JSON body |
| `backend/src/modules/face/services/face.service.js` | Handle `imageBuffer` from uploads |
| `backend/src/modules/ai/services/ai.service.js` | Multipart forwarding to FastAPI |

### AI Service (FastAPI)
| File | Change |
|------|--------|
| `ai-service/app/routers/face.py` | `UploadFile` / multipart + legacy JSON |
| `ai-service/app/utils/image.py` | `decode_image_bytes`, 10MB limit |
| `ai-service/app/services/face_service.py` | `embed_from_image`, `verify_from_image` |

---

## API Compatibility

Endpoints unchanged:
- `POST /api/v1/face/register`
- `POST /api/v1/face/login`
- `POST /api/v1/face/verify`

Legacy JSON `{ image }` and `{ embedding }` requests still work on the backend and AI service.

---

## Deployment Notes

Restart services after pulling these changes:

```powershell
# Backend
cd backend
npm run build
npm start

# AI service
cd ai-service
.\.venv\Scripts\uvicorn.exe app.main:app --host 0.0.0.0 --port 8000

# Frontend (hot reload in dev)
cd frontend
npm run dev:3001
```
