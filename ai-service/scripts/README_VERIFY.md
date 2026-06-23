# InsightFace Verification Suite

Run after Docker infra + local services are up:

```powershell
# Terminal 1 — infra
npm run infra:up

# Terminal 2 — backend
cd backend && npm run start:dev

# Terminal 3 — AI service
cd ai-service && .\.venv\Scripts\python.exe -m uvicorn app.main:app --reload --port 8000

# Terminal 4 — frontend
cd frontend && npm run dev:3001

# Terminal 5 — verification
npm run verify:insightface
```

## What it checks

| Test | Description |
|------|-------------|
| TEST 1 | `GET /health` — status ok, model buffalo, engine ready |
| TEST 2 | Face registration via AI + backend |
| TEST 3 | Duplicate face blocked (409) |
| TEST 4 | Face login + JWT |
| TEST 5 | Wrong face denied (401) |
| TEST 6 | Verify correct face / reject wrong face |
| TEST 7 | Postgres `users` + `face_registrations` linkage |
| TEST 8 | Frontend pages load (`/face/register`, `/face/login`, `/dashboard`) |
| TEST 9 | Performance timings |

## Diagnostic log events

Search AI service logs for:

- `FACE_REGISTER_SUCCESS`
- `DUPLICATE_FACE_BLOCKED`
- `FACE_LOGIN_SUCCESS`
- `FACE_LOGIN_FAILED`
- `FACE_VERIFY_SUCCESS` / `FACE_VERIFY_FAILED`
- `FACE_LOGOUT_VERIFY_SUCCESS` / `FACE_LOGOUT_VERIFY_FAILED`
- `FACE_PERF`
- `INSIGHTFACE_MODEL_LOADED_ONCE`

## Diagnostics endpoint

`GET http://localhost:8000/diagnostics/face-engine`

Returns engine status, Qdrant vector count, and captured performance records.
