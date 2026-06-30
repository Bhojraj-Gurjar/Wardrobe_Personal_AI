# Wardrobe AI — Python FastAPI AI Service

Isolated AI microservice for Wardrobe AI. NestJS remains the main API gateway.

## Architecture

```
Frontend (Next.js) → NestJS (port 3000) → AI Service (port 8000) → Redis + Qdrant
```

## Requirements

- Python 3.11+
- Redis (cache)
- Qdrant (vector storage)

## Setup

```bash
cd ai-service
python -m venv .venv
.venv\Scripts\activate   # Windows
pip install -r requirements.txt
copy .env.example .env
python main.py
```

Service runs at **http://localhost:8000**

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Health check |
| POST | `/face/embed` | Generate face embedding from image |
| POST | `/face/verify` | Verify face against stored embedding |
| POST | `/fashion-dna/analyze` | Fashion DNA vector from profile |
| POST | `/recommendations/generate` | Recommendation categories + vector |
| POST | `/products/embed` | Product text embedding |

## NestJS Integration

Set in `backend/.env`:

```
AI_SERVICE_URL=http://localhost:8000
FACE_VECTOR_SIZE=128
```

NestJS `AiService` proxies inference requests. Face auth sends `{ image }` from the frontend.

## Notes

- `face-recognition` requires dlib; OpenCV fallback is used if no face is detected.
- `sentence-transformers` downloads `all-MiniLM-L6-v2` on first request.
- Existing users with 512-dim face vectors must re-register after switching to 128-dim AI embeddings.
