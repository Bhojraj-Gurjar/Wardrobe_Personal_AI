---
title: Wardrobe AI Service
emoji: 👗
colorFrom: purple
colorTo: indigo
sdk: docker
app_port: 7860
pinned: false
license: mit
---

# Wardrobe AI — AI Service (FastAPI)

Face auth, fashion DNA, recommendations, and virtual try-on for [Wardrobe AI](https://github.com/Bhojraj-Gurjar/Wardrobe_Personal_AI).

```
Frontend (Render) → Backend (Render) → This Space → Qdrant Cloud + Upstash Redis
```

## Hugging Face Space setup (free)

### 1. Create the Space

1. Go to [huggingface.co/new-space](https://huggingface.co/new-space)
2. **Space name:** `wardrobe-ai-service` (or any name)
3. **SDK:** **Docker**
4. **Hardware:** **CPU basic** (free — 2 vCPU, 16 GB RAM)
5. **Visibility:** Public (required for free hardware)

### 2. Connect this repo (monorepo)

1. Space → **Settings** → **Repository**
2. **Connect repository:** `Bhojraj-Gurjar/Wardrobe_Personal_AI`
3. **Branch:** `feature/admin` (or your deploy branch)
4. **Root directory:** `ai-service` ← important
5. Save → Space rebuilds automatically

### 3. Add secrets (Space → Settings → Variables)

| Variable | Value |
|----------|--------|
| `QDRANT_URL` | Your Qdrant Cloud cluster URL |
| `QDRANT_API_KEY` | Your Qdrant API key |
| `REDIS_URL` | Upstash TLS URL (`rediss://...`) |
| `HF_TOKEN` | Your Hugging Face token (for virtual try-on) |
| `ENVIRONMENT` | `production` |
| `FACE_ANTI_SPOOF_ENABLED` | `false` |
| `TRYON_FALLBACK_ON_QUOTA_EXCEEDED` | `true` |

### 4. Connect backend on Render

When the Space is **Running**, copy its URL (e.g. `https://bhojraj-gurjar-wardrobe-ai-service.hf.space`).

On **Render backend** → **Environment**:

| Variable | Value |
|----------|--------|
| `AI_SERVICE_URL` | `https://YOUR-SPACE.hf.space` |
| `AI_SERVICE_PUBLIC_URL` | Your frontend URL |

Save → backend redeploys.

### 5. Test

```bash
curl https://YOUR-SPACE.hf.space/health
```

Expected: JSON with `"status": "ok"`.

Then try face registration on your deployed site.

---

## Local development

```bash
cd ai-service
python -m venv .venv
.venv\Scripts\activate   # Windows
pip install -r requirements.txt
copy .env.example .env
python main.py
```

Runs at **http://localhost:8000**

## API endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Health check |
| POST | `/face/register` | Register face + embedding |
| POST | `/face/login` | Face login |
| POST | `/face/embed` | Generate face embedding |
| POST | `/fashion-dna/analyze` | Fashion DNA vector |
| POST | `/tryon/generate` | Virtual try-on |

## Notes

- **First request after sleep** can take 1–2 minutes (Space waking + model load).
- **Redis** is optional for cache — app works without it but cache is disabled.
- **Try-on** requires `HF_TOKEN` with access to the CatVTON Space.
