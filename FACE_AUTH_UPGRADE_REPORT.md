# Face Authentication Upgrade Report

## Summary

The face authentication module was upgraded from a permissive prototype to a production-style biometric flow. OpenCV pixel fallback and client-side motion heuristics were removed. Server-side validation, liveness checks, duplicate face prevention, and stricter similarity thresholds are now enforced across registration, login, and logout verification.

---

## 1. Files Changed

### AI Service (FastAPI)
| File | Change |
|------|--------|
| `ai-service/app/services/face_validation.py` | **New** — strict face detection, quality, pose, anti-spoof checks |
| `ai-service/app/services/face_liveness.py` | **New** — server-side blink/smile validation via landmarks |
| `ai-service/app/services/face_service.py` | Rewritten — removed OpenCV fallback; tiered match scoring |
| `ai-service/app/routers/face.py` | Added `POST /face/liveness`; strict validation on embed/verify |
| `ai-service/app/schemas/face.py` | Added liveness response + verify status field |
| `ai-service/app/config.py` | Threshold defaults updated to 0.85 / 0.70 |
| `ai-service/.env.example` | Updated threshold env vars |

### Backend (NestJS)
| File | Change |
|------|--------|
| `backend/prisma/schema.prisma` | Added `liveness_score`, `blink_detected`, `smile_detected` |
| `backend/src/config/configuration.js` | Added `similarityUncertain` (0.70), threshold 0.85 |
| `backend/src/modules/face/services/face.service.js` | Duplicate face check, liveness required, embedding bypass removed |
| `backend/src/modules/face/repositories/face.repository.js` | Persist liveness metadata; search with configurable limit |
| `backend/src/modules/face/controllers/face.controller.js` | Multi-file upload (frontFace + liveness frames) |
| `backend/src/modules/face/utils/face-upload.util.js` | `FileFieldsInterceptor` fields for liveness frames |
| `backend/src/modules/ai/services/ai.service.js` | `checkLiveness()`, human-readable 400 errors |
| `backend/.env.example` | Updated threshold env vars |

### Frontend (Next.js)
| File | Change |
|------|--------|
| `frontend/src/features/face/utils/face-liveness-client.js` | **New** — eye/mouth region analysis for blink/smile |
| `frontend/src/features/face/hooks/use-liveness-checks.js` | Real blink + smile flow; captures 3 proof frames |
| `frontend/src/features/face/services/faceService.js` | Sends `neutralFrame`, `blinkFrame`, `smileFrame` |
| `frontend/src/features/face/hooks/use-face-register.js` | Accepts `{ image, livenessFrames }` |
| `frontend/src/features/face/hooks/use-face-login.js` | Accepts `{ image, livenessFrames }` |
| `frontend/src/features/face/components/face-registration-stepper.js` | Liveness step before registration |
| `frontend/src/features/face/components/face-register-liveness-step.js` | **New** — registration liveness UI |
| `frontend/src/features/face/components/face-login-view.js` | Liveness-first login flow |
| `frontend/src/features/face/components/face-verification-camera.js` | Liveness-first verify flow |
| `frontend/src/features/face/components/face-logout-modal.js` | No logout without face verification |
| `frontend/src/features/face/components/liveness-status-card.js` | Active prompt display |
| `frontend/src/features/face/constants/face-steps.js` | Blink + smile checks only |
| `frontend/src/features/face/utils/face-errors.js` | Human-readable error mapping |

---

## 2. New Validations

### Image / Face Quality (server — `face_validation.py`)
- **No face** → reject
- **Multiple faces** → reject
- **Blurry image** (Laplacian variance < 80) → "Image quality is too low."
- **Too dark / overexposed** → reject
- **Face too small / too large** in frame → reject
- **Side face** (landmark asymmetry) → reject
- **Missing landmarks** (eyes, nose, mouth) → reject
- **Anti-spoof texture check** (low face-region variance) → reject photos/screens

### Liveness (client + server)
- Client prompts: blink once → smile naturally
- Captures: `neutralFrame`, `blinkFrame`, `smileFrame`
- Server validates EAR drop (blink) and mouth width ratio (smile) using `face_recognition` landmarks

### Uniqueness (registration)
- Before upsert: search top 10 Qdrant matches
- If another account scores **≥ 0.85** → "This face is already associated with another account."

### Removed permissive paths
- OpenCV Haar 16×8 pixel fallback
- Legacy `dto.embedding` bypass on backend
- Motion-only liveness heuristics
- Logout without camera verification

---

## 3. Similarity Threshold

| Score | Result |
|-------|--------|
| **≥ 0.85** | Success (login / verify / unique-face boundary) |
| **0.70 – 0.84** | Uncertain → rejected |
| **< 0.70** | Rejected |

Environment variables:
```
FACE_SIMILARITY_THRESHOLD=0.85
FACE_SIMILARITY_UNCERTAIN=0.70
```

Embeddings are generated exclusively via `face_recognition` (128-dim dlib encodings), stored in Qdrant `users_face_vectors`.

---

## 4. Liveness Implementation

```
User camera
  → Client detects blink (eye band brightness drop)
  → Client detects smile (mouth/cheek intensity delta)
  → Captures neutral / blink / smile JPEG frames
  → NestJS POST /face/register|login|verify
      → FastAPI POST /face/liveness (landmark EAR + smile ratio)
      → FastAPI POST /face/embed (validated embedding)
  → Qdrant search / upsert
  → Prisma face_registrations (liveness_score, blink_detected, smile_detected)
```

---

## 5. Duplicate Face Prevention

On **registration**:
1. Generate validated embedding from final `frontFace` image
2. `searchFaceVector(embedding, limit=10)` in Qdrant
3. For each match where `user_id ≠ registering user` and `score ≥ 0.85`:
   - Return HTTP 409: "This face is already associated with another account."
4. Only then upsert vector + DB record

One person = one account enforced at enrollment time.

---

## Error Messages (user-facing)

| Condition | Message |
|-----------|---------|
| No face | No face detected. |
| Multiple faces | Multiple faces detected. |
| Blink failed | Please blink once. |
| Smile failed | Please smile. |
| Duplicate | This face is already associated with another account. |
| Low quality | Image quality is too low. |
| Match failed | Face verification failed. |
| Service down | Face service unavailable. Please try again later. |

"AI service request failed" is no longer shown to users.

---

## Architecture (unchanged)

```
Next.js → NestJS → FastAPI → Qdrant
                  ↓
              PostgreSQL (face_registrations metadata)
```

---

## Testing Checklist

- [ ] Register: blink + smile → success; metadata in DB
- [ ] Register same face on second account → rejected
- [ ] Register with object/wall photo → rejected server-side
- [ ] Login: blink + smile → dashboard
- [ ] Login wrong person → "Face verification failed."
- [ ] Logout: requires face verify; camera denied → cannot logout without verify
