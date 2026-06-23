# Wardrobe AI — AI Layer Implementation Report

**Date:** June 2026  
**Architecture:** Next.js → NestJS → Python FastAPI → Redis + Qdrant + PostgreSQL

---

## 1. Created Files

### `ai-service/` (new Python microservice)

```
ai-service/
├── main.py
├── requirements.txt
├── Dockerfile
├── README.md
├── .env.example
└── app/
    ├── config.py
    ├── main.py
    ├── routers/
    │   ├── face.py
    │   ├── fashion_dna.py
    │   ├── recommendations.py
    │   ├── products.py
    │   └── health.py
    ├── services/
    │   ├── face_service.py
    │   ├── embedding_service.py
    │   ├── fashion_dna_service.py
    │   ├── recommendation_service.py
    │   ├── product_service.py
    │   ├── cache_service.py
    │   └── qdrant_service.py
    ├── schemas/
    │   ├── face.py
    │   ├── fashion_dna.py
    │   ├── recommendations.py
    │   └── products.py
    ├── models/__init__.py
    └── utils/
        ├── image.py
        └── vectors.py
```

### NestJS integration (new)

| File | Purpose |
|------|---------|
| `backend/src/modules/ai/ai.module.js` | Global AI module |
| `backend/src/modules/ai/services/ai.service.js` | HTTP client to FastAPI |

### Modified (integration only)

| File | Change |
|------|--------|
| `backend/src/app.module.js` | Import `AiModule` |
| `backend/src/config/configuration.js` | `aiService.url`, face dim 128 |
| `backend/src/config/env.validation.js` | `AI_SERVICE_URL` |
| `backend/src/modules/face/services/face.service.js` | Image → AI embed, AI verify |
| `backend/src/modules/face/dto/face-embedding.dto.js` | Accept `image` or `embedding` |
| `backend/src/modules/face/repositories/face.repository.js` | `getFaceVector()` |
| `backend/src/database/qdrant.service.js` | `getVector()` |
| `backend/src/modules/recommendations/services/recommendations.service.js` | AI vectors |
| `backend/src/modules/fashion-dna/services/fashion-dna.service.js` | AI analyze |
| `backend/src/modules/products/services/product.service.js` | AI product embed |
| `frontend/src/features/face/services/faceService.js` | Send `{ image }` |
| `frontend/src/features/face/hooks/*` | Image-based mutations |
| `frontend/src/features/face/components/*` | Remove client embeddings |
| `docker-compose.yml` | `ai-service` container |

---

## 2. Installed Packages

### Python (`ai-service/requirements.txt`)

| Package | Purpose |
|---------|---------|
| `fastapi` | API framework |
| `uvicorn` | ASGI server |
| `pydantic` / `pydantic-settings` | Request/response schemas |
| `numpy` | Vector math |
| `pillow` | Image decoding |
| `opencv-python-headless` | Face detection fallback |
| `face-recognition` | Real 128-dim face embeddings |
| `sentence-transformers` | Text embeddings (DNA, products, recs) |
| `qdrant-client` | Vector persistence |
| `redis` | Inference cache |
| `python-dotenv` | Environment config |
| `httpx` | HTTP utilities |

### NestJS

No new npm packages — uses native `fetch` in `AiService`.

---

## 3. New Endpoints (FastAPI — port 8000)

| Method | Path | Input | Output |
|--------|------|-------|--------|
| `GET` | `/health` | — | `{ status, service }` |
| `POST` | `/face/embed` | `{ image }` | `{ embedding, dimensions, source }` |
| `POST` | `/face/verify` | `{ image, stored_embedding }` | `{ match_score, verified, threshold }` |
| `POST` | `/fashion-dna/analyze` | `{ profile, preferences, body_type, user_id? }` | `{ vector, dimensions, summary }` |
| `POST` | `/recommendations/generate` | `{ profile, user_id? }` | `{ vector, recommended_categories, dimensions }` |
| `POST` | `/products/embed` | `{ product, product_id? }` | `{ vector, dimensions, text }` |

**NestJS public API unchanged** — existing `/api/v1/face/*`, `/fashion-dna/*`, `/recommendations`, `/products` routes preserved.

---

## 4. NestJS Integration Changes

### `AiService` (global)

- Reads `AI_SERVICE_URL` (default `http://localhost:8000`)
- Methods: `embedFace`, `verifyFace`, `analyzeFashionDna`, `generateRecommendations`, `embedProduct`
- Graceful fallback when AI service unavailable

### Face auth flow

```
Frontend captures image (base64)
    → POST /api/v1/face/register|login|verify { image }
    → NestJS FaceService.resolveEmbedding()
    → POST AI /face/embed (register/login)
    → POST AI /face/verify (logout verification)
    → Qdrant search/store (unchanged persistence layer)
```

### Recommendations / Fashion DNA / Products

- **Recommendations:** AI vector used for Qdrant search when available; heuristic fallback on error
- **Fashion DNA:** AI analyze called after generate (async, stores vector in Qdrant)
- **Products:** AI embed called after product create (async, indexes in Qdrant)

### Environment

```env
AI_SERVICE_URL=http://localhost:8000
FACE_VECTOR_SIZE=128
FACE_SIMILARITY_THRESHOLD=0.65
```

---

## 5. Remaining AI Work

| Item | Priority | Notes |
|------|----------|-------|
| Install & run AI service locally | **Required** | `pip install -r requirements.txt` in `ai-service/` |
| Re-register face for existing users | **High** | Vector size changed 512 → 128 |
| Production dlib/face-recognition build | Medium | Docker image includes build deps |
| GPU acceleration for sentence-transformers | Low | CPU works for dev |
| Dedicated Python FastAPI repo CI | Low | Add pytest + health checks |
| Migrate all product catalog to Qdrant | Medium | Only new products auto-indexed |
| Real-time recommendation re-ranking | Low | Currently vector search only |
| OpenAI provider removal/consolidation | Low | Superseded by sentence-transformers |
| Auth token deduplication (FaceService/AuthService) | Medium | Pre-existing tech debt |
| Liveness detection in Python | Medium | Still client-side heuristic |

---

## Start Commands

```powershell
# Infrastructure
docker compose up -d postgres redis qdrant

# AI Service
cd ai-service
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
python main.py

# Backend (with AI_SERVICE_URL in .env)
cd backend
npm run build
npm start

# Frontend
cd frontend
npm run dev:3001
```

---

*NestJS remains the source of truth for auth, business logic, and API contracts. Python FastAPI handles all ML inference.*
