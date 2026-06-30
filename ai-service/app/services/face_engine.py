"""Face recognition engine bootstrap — InsightFace Buffalo."""

from __future__ import annotations

import logging
from dataclasses import dataclass

from app.services.embedding_service import (
    EmbeddingEngineStatus,
    get_embedding_engine_status,
    initialize_embedding_engine,
    is_embedding_engine_ready,
    require_embedding_engine,
)

logger = logging.getLogger(__name__)


@dataclass(frozen=True)
class FaceEngineStatus:
    ready: bool
    face_recognition_loaded: bool
    dlib_loaded: bool
    opencv_loaded: bool
    numpy_loaded: bool
    pillow_loaded: bool
    models_loaded: bool
    error: str | None = None
    dlib_version: str | None = None
    model_name: str | None = None
    embedding_dim: int = 0
    provider: str | None = None


def initialize_face_engine() -> FaceEngineStatus:
    embedding_status = initialize_embedding_engine()
    return _to_face_engine_status(embedding_status)


def get_face_engine_status() -> FaceEngineStatus:
    return _to_face_engine_status(get_embedding_engine_status())


def _to_face_engine_status(status: EmbeddingEngineStatus) -> FaceEngineStatus:
    pillow_loaded = True
    try:
        __import__("PIL")
    except Exception:  # noqa: BLE001
        pillow_loaded = False

    return FaceEngineStatus(
        ready=status.ready,
        face_recognition_loaded=status.ready,
        dlib_loaded=False,
        opencv_loaded=status.opencv_loaded,
        numpy_loaded=status.numpy_loaded,
        pillow_loaded=pillow_loaded,
        models_loaded=status.ready,
        error=status.error,
        dlib_version=None,
        model_name=status.model_name,
        embedding_dim=status.embedding_dim,
        provider=status.provider,
    )


def require_face_recognition():
    require_embedding_engine()
    return require_embedding_engine()


def is_face_engine_ready() -> bool:
    return is_embedding_engine_ready()
