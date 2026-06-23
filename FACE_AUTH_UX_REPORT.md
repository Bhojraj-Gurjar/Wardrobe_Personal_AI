# Face Authentication UX Improvement Report

## Summary

Face login and registration flows were simplified to: **Capture → Loading → Automatic redirect**. Liveness checks (blink, head movement, smile, real person) still run in the background. Errors show as toast messages only.

**Backend APIs unchanged.**

---

## New Flows

### Face Login (`/face/login`)

1. User clicks **Start Face Scan**
2. Camera opens
3. Liveness runs silently (blink → head → smile → real person)
4. Overlay shows **"Verifying your identity..."**
5. On success → immediate redirect to `/dashboard`
6. On error → toast message, user can tap **Start Face Scan** to retry

**Removed:** Liveness checklist, success screen, continue button

### Face Registration (`/face/register`)

1. User reads brief instructions → clicks **Start Camera**
2. Camera opens, verification starts automatically
3. Overlay shows **"Verifying your identity..."**
4. On success → immediate redirect to `/onboarding/profile`
5. On error → toast + return to instructions

**Removed:** Liveness result page, processing step, success step, continue button

---

## Files Changed

| File | Change |
|------|--------|
| `frontend/src/features/face/components/face-login-view.js` | Streamlined flow, auto-verify, overlay, toasts, direct redirect |
| `frontend/src/features/face/components/face-registration-stepper.js` | Instructions → capture → auto-verify → redirect |
| `frontend/src/features/face/components/face-verifying-overlay.js` | **New** — loading overlay component |
| `frontend/src/features/face/components/face-verification-camera.js` | Silent liveness + overlay (logout verify) |
| `frontend/src/features/face/hooks/use-liveness-checks.js` | Silent mode, all 4 checks, failure codes |
| `frontend/src/features/face/hooks/use-face-toast.js` | **New** — toast hook for errors |
| `frontend/src/features/face/hooks/index.js` | Export `useFaceToast` |
| `frontend/src/features/face/constants/face-steps.js` | 4 liveness checks, failure messages, simplified steps |
| `frontend/src/features/face/utils/face-liveness-client.js` | Head motion + face presence helpers |
| `frontend/src/features/face/components/face-register-instructions.js` | Updated copy |
| `frontend/src/features/face/components/index.js` | Export `FaceVerifyingOverlay` |

---

## Error Toasts

| Condition | Message |
|-----------|---------|
| No face | No face detected. |
| Blink failed | Please blink once. |
| Smile failed | Please smile. |
| Head / real person failed | Face verification failed. |
| Duplicate face | This face is already associated with another account. |
| API errors | Mapped via `face-errors.js` |

---

## Liveness (silent, unchanged API)

Client still sends `neutralFrame`, `blinkFrame`, `smileFrame` to backend. All four checks run client-side before API call:

1. Eye blink
2. Head movement
3. Smile
4. Real person validation
