"""Read-only diagnostics for InsightFace verification suites."""

from __future__ import annotations

from fastapi import APIRouter

from app.config import get_settings
from app.services.embedding_service import get_embedding_engine_status
from app.services.face_diagnostics import face_diagnostics, resolve_buffalo_model_label
from app.services.face_engine import get_face_engine_status
from app.services.qdrant_service import QdrantStore

router = APIRouter(prefix="/diagnostics", tags=["diagnostics"])
qdrant_store = QdrantStore()


@router.get("/face-engine")
def face_engine_diagnostics() -> dict:
    settings = get_settings()
    engine = get_face_engine_status()
    embedding = get_embedding_engine_status()
    collection = settings.qdrant_face_collection
    vector_count = qdrant_store.count_points(collection) if qdrant_store.enabled else 0

    return {
        "status": "ok" if engine.ready else "degraded",
        "model": resolve_buffalo_model_label(engine.model_name),
        "insightface_model": engine.model_name,
        "embedding_dim": engine.embedding_dim,
        "provider": engine.provider,
        "engine_ready": engine.ready,
        "onnx_ready": embedding.ready,
        "engine_error": engine.error,
        "qdrant_collection": collection,
        "qdrant_vector_count": vector_count,
        "performance": face_diagnostics.summary(),
    }
