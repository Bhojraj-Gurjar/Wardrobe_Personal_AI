from fastapi import APIRouter

from app.config import get_settings
from app.services.face_engine import get_face_engine_status
from app.services.face_diagnostics import resolve_buffalo_model_label
from app.services.qdrant_service import QdrantStore

router = APIRouter(tags=["health"])
qdrant_store = QdrantStore()


def _qdrant_health() -> dict:
    settings = get_settings()
    config = {
        "url": settings.qdrant_url,
        "face_collection": settings.qdrant_face_collection,
        "product_collection": settings.qdrant_product_collection,
    }

    if not settings.qdrant_url:
        return {
            "status": "error",
            "configured": False,
            "message": "QDRANT_URL is not configured",
            **config,
        }

    try:
        client = qdrant_store._get_client()
        if not client:
            return {
                "status": "error",
                "configured": False,
                "message": "Qdrant client could not be created",
                **config,
            }

        collections = client.get_collections().collections
        names = [item.name for item in collections]
        face_name = settings.qdrant_face_collection

        if face_name not in names:
            qdrant_store.ensure_collection(face_name, settings.face_vector_size)
            names = [
                item.name for item in client.get_collections().collections
            ]

        return {
            "status": "ok",
            "configured": True,
            "reachable": True,
            "collections": names,
            "face_collection": {
                "name": face_name,
                "exists": face_name in names,
                "vector_size": settings.face_vector_size,
            },
            **config,
        }
    except Exception as exc:
        message = str(exc)
        if "Connection refused" in message or "10061" in message:
            message = (
                "Qdrant is not running (connection refused). "
                "Start: docker compose up -d qdrant"
            )

        return {
            "status": "error",
            "configured": True,
            "reachable": False,
            "message": message,
            **config,
        }


@router.get("/health")
def health() -> dict:
    qdrant = _qdrant_health()
    settings = get_settings()
    face_engine = get_face_engine_status()

    overall_ok = qdrant.get("status") == "ok" and face_engine.ready

    return {
        "status": "ok" if overall_ok else "degraded",
        "model": resolve_buffalo_model_label(face_engine.model_name),
        "faceEngine": face_engine.ready,
        "service": "Wardrobe AI AI Service",
        "face_engine": {
            "ready": face_engine.ready,
            "engine": "insightface",
            "model": face_engine.model_name,
            "embedding_dim": face_engine.embedding_dim,
            "provider": face_engine.provider,
            "opencv": face_engine.opencv_loaded,
            "numpy": face_engine.numpy_loaded,
            "pillow": face_engine.pillow_loaded,
            "error": face_engine.error,
        },
        "dependencies": {
            "qdrant": qdrant,
            "multipart": _multipart_status(),
        },
        "environment": {
            "QDRANT_URL": settings.qdrant_url,
            "QDRANT_FACE_COLLECTION": settings.qdrant_face_collection,
            "FACE_VECTOR_SIZE": settings.face_vector_size,
        },
    }


@router.get("/qdrant/health")
def qdrant_health() -> dict:
    return _qdrant_health()


def _multipart_status() -> dict:
    try:
        import multipart  # noqa: F401 — python-multipart

        return {"status": "ok", "package": "python-multipart", "installed": True}
    except ImportError:
        return {
            "status": "error",
            "package": "python-multipart",
            "installed": False,
            "message": "Required for face image uploads. Run: pip install python-multipart",
        }
