# ── Stage 1: compile & install Python dependencies ───────────────────────────
FROM python:3.11-slim AS builder

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    cmake \
    libopenblas-dev \
    liblapack-dev \
    && rm -rf /var/lib/apt/lists/*

ENV CMAKE_BUILD_PARALLEL_LEVEL=1
ENV MAX_JOBS=1
ENV PIP_NO_CACHE_DIR=1
ENV PIP_DISABLE_PIP_VERSION_CHECK=1
ENV PIP_DEFAULT_TIMEOUT=120

# Install PyTorch CPU wheel first (large, isolated layer).
RUN pip install --no-cache-dir torch --index-url https://download.pytorch.org/whl/cpu

COPY requirements-docker-core.txt requirements-docker-ml.txt ./

# Split installs to lower peak RAM during Docker builds on Windows.
RUN pip install --no-cache-dir -r requirements-docker-core.txt
RUN pip install --no-cache-dir -r requirements-docker-ml.txt

# Shrink site-packages before exporting the layer (avoids Docker Desktop EOF on unpack).
RUN find /usr/local/lib/python3.11/site-packages -type d \( \
      -name '__pycache__' -o -name 'tests' -o -name 'test' -o \
      -name 'examples' -o -name 'docs' -o -name 'include' \
    \) -prune -exec rm -rf {} + 2>/dev/null || true \
  && find /usr/local/lib/python3.11/site-packages -name '*.pyc' -delete 2>/dev/null || true \
  && rm -rf /usr/local/lib/python3.11/site-packages/tensorboard* 2>/dev/null || true \
  && rm -rf /root/.cache /tmp/*

# ── Stage 2: lean runtime (no compilers) ─────────────────────────────────────
FROM python:3.11-slim AS runner

WORKDIR /app

ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1
ENV PIP_NO_CACHE_DIR=1
ENV HOME=/app
ENV INSIGHTFACE_HOME=/app/models/insightface
ENV HF_HOME=/app/models/huggingface
ENV TRANSFORMERS_CACHE=/app/models/huggingface
ENV XDG_CACHE_HOME=/app/models/cache

RUN apt-get update && apt-get install -y --no-install-recommends \
    libgl1 \
    libglib2.0-0 \
    libgomp1 \
    ca-certificates \
    gosu \
    && rm -rf /var/lib/apt/lists/*

COPY --from=builder /usr/local/lib/python3.11/site-packages /usr/local/lib/python3.11/site-packages
COPY --from=builder /usr/local/bin /usr/local/bin

RUN mkdir -p models/insightface models/huggingface models/cache uploads app/generated/tryon \
    && python -c "import urllib.request; urllib.request.urlretrieve('https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task', 'models/face_landmarker.task')" \
    && python -c "import urllib.request; urllib.request.urlretrieve('https://storage.googleapis.com/mediapipe-models/image_segmenter/hair_segmenter/float32/latest/hair_segmenter.tflite', 'models/hair_segmenter.tflite')"

COPY app ./app
COPY fashion_dna.py color_affinity.py fashion_personality.py ./
COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh

RUN sed -i 's/\r$//' /usr/local/bin/docker-entrypoint.sh \
  && chmod +x /usr/local/bin/docker-entrypoint.sh \
  && groupadd --system --gid 1001 aiservice \
  && useradd --system --uid 1001 --gid aiservice --home-dir /app aiservice \
  && chown -R aiservice:aiservice /app

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=10s --start-period=180s --retries=5 \
  CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/health')"

ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000} --workers 1 --no-access-log"]
