# ── Stage 1: compile & install Python dependencies ───────────────────────────
FROM python:3.11-slim AS builder

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    cmake \
    libopenblas-dev \
    liblapack-dev \
    && rm -rf /var/lib/apt/lists/*

ENV CMAKE_BUILD_PARALLEL_LEVEL=2
ENV PIP_NO_CACHE_DIR=1
ENV PIP_DISABLE_PIP_VERSION_CHECK=1

RUN pip install --no-cache-dir torch --index-url https://download.pytorch.org/whl/cpu

COPY requirements-docker.txt requirements.txt
RUN pip install --no-cache-dir -r requirements.txt \
  && find /usr/local/lib/python3.11/site-packages -type d -name __pycache__ -exec rm -rf {} + 2>/dev/null || true \
  && find /usr/local/lib/python3.11/site-packages -type f -name '*.pyc' -delete 2>/dev/null || true

# ── Stage 2: lean runtime (no compilers) ─────────────────────────────────────
FROM python:3.11-slim AS runner

WORKDIR /app

ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1
ENV PIP_NO_CACHE_DIR=1
ENV INSIGHTFACE_HOME=/app/models/insightface
ENV HF_HOME=/app/models/huggingface
ENV TRANSFORMERS_CACHE=/app/models/huggingface
ENV XDG_CACHE_HOME=/app/models/cache

RUN apt-get update && apt-get install -y --no-install-recommends \
    libgl1 \
    libglib2.0-0 \
    libgomp1 \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

COPY --from=builder /usr/local/lib/python3.11/site-packages /usr/local/lib/python3.11/site-packages
COPY --from=builder /usr/local/bin /usr/local/bin

RUN mkdir -p models/insightface models/huggingface models/cache uploads \
    && python -c "import urllib.request; urllib.request.urlretrieve('https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task', 'models/face_landmarker.task')" \
    && python -c "import urllib.request; urllib.request.urlretrieve('https://storage.googleapis.com/mediapipe-models/image_segmenter/hair_segmenter/float32/latest/hair_segmenter.tflite', 'models/hair_segmenter.tflite')"

COPY app ./app
COPY fashion_dna.py color_affinity.py fashion_personality.py ./

RUN groupadd --system --gid 1001 aiservice \
  && useradd --system --uid 1001 --gid aiservice aiservice \
  && chown -R aiservice:aiservice /app

USER aiservice

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=10s --start-period=180s --retries=5 \
  CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/health')"

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "1", "--no-access-log"]
