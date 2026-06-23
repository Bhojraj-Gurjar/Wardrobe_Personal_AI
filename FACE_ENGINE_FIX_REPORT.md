# Face Recognition Engine Fix Report

**Date:** 2026-06-20  
**Error investigated:** `Face recognition engine is not installed on the AI service.`

---

## Root Cause

| Check | Result |
|-------|--------|
| `face_recognition` package missing | **YES** — not installed in `.venv` |
| `dlib` missing | **YES** — pip tried to compile from source and failed (no Visual Studio C++) |
| Placeholder / mock logic | **NO** — real validation code in `face_validation.py`; fails when import fails |
| `FACE_ENGINE_AVAILABLE` hardcoded false | **NO** — no such flag; error raised in `_load_face_recognition()` on `ImportError` |

**Error source:** `ai-service/app/services/face_validation.py` → `_load_face_recognition()`  
Previously raised a generic message when `import face_recognition` failed.

**Why liveness passed but login failed:** Client-side blink/smile checks run in the browser. Embedding generation happens server-side in FastAPI — that step failed because `face_recognition` was never installed.

---

## Installed Packages

| Package | Version | Notes |
|---------|---------|-------|
| `dlib-bin` | 20.0.1 | Prebuilt Windows wheel (provides `import dlib`) |
| `face-recognition` | 1.3.0 | Installed with `--no-deps` to avoid rebuilding dlib |
| `face_recognition_models` | 0.3.0 | Required model files for encodings |
| `setuptools` | 75.8.2 | Required for `pkg_resources` (models package) |
| `numpy` | 2.4.6 | Already present |
| `pillow` | 12.2.0 | Already present |
| `opencv-python-headless` | 4.13.0.92 | Already present |

**Windows note:** Standard `pip install dlib` fails without Visual Studio C++ build tools. Use `dlib-bin` + `face_recognition --no-deps`. Script: `ai-service/scripts/install-face-windows.ps1`

---

## Startup Status

AI service logs on boot:

```
✓ face_recognition loaded
✓ dlib loaded (20.0.1)
✓ embedding engine ready
```

**GET http://localhost:8000/health**

```json
{
  "status": "ok",
  "faceEngine": true,
  "face_engine": {
    "ready": true,
    "face_recognition": true,
    "dlib": true,
    "dlib_version": "20.0.1",
    "opencv": true,
    "numpy": true,
    "pillow": true,
    "models": true,
    "error": null
  }
}
```

---

## Files Modified

| File | Change |
|------|--------|
| `ai-service/app/services/face_engine.py` | **New** — engine bootstrap, health status, startup logs |
| `ai-service/app/services/face_validation.py` | Uses `require_face_recognition()`; returns actual import error |
| `ai-service/app/main.py` | Startup hook calls `initialize_face_engine()` |
| `ai-service/app/routers/health.py` | Added `faceEngine: true/false` + detailed `face_engine` block |
| `ai-service/requirements.txt` | Added `dlib-bin`, `face-recognition-models`, `setuptools` pin |
| `ai-service/scripts/install-face-windows.ps1` | **New** — reproducible Windows install script |

---

## Real Face Embeddings Active?

**YES.**

- OpenCV pixel fallback was removed in the prior auth upgrade.
- Embeddings are generated via `face_recognition.face_encodings()` (128-dim dlib vectors).
- Validation pipeline: single face → quality checks → landmarks → embedding → Qdrant.

Import verification:

```
dlib loaded
face_recognition loaded
engine ready, faces: 0
```

---

## User-Facing Errors (improved)

Instead of a generic message, users now see the **actual cause**, e.g.:

- `Face recognition engine unavailable: face_recognition: No module named 'face_recognition'`
- `Face recognition engine unavailable: dlib: No module named 'dlib'`

When the engine is healthy, face login/register proceed with real biometric embeddings.

---

## Reinstall (if needed)

```powershell
cd ai-service
.\.venv\Scripts\pip.exe install dlib-bin "setuptools>=75.0.0,<82" face-recognition-models
.\.venv\Scripts\pip.exe install face_recognition --no-deps
.\.venv\Scripts\uvicorn.exe app.main:app --host 0.0.0.0 --port 8000
```

Or:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/install-face-windows.ps1
```
