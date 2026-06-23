"""InsightFace Buffalo embedding engine — loaded once at startup."""

from __future__ import annotations

import logging
from dataclasses import dataclass

import cv2
import numpy as np

from app.config import get_settings
from app.services.face_errors import FaceValidationError

logger = logging.getLogger(__name__)

_face_analysis = None
_engine_error: str | None = None
_engine_ready = False
_model_name: str | None = None


@dataclass(frozen=True)
class FaceDetection:
    bbox: tuple[float, float, float, float]
    detection_score: float
    embedding: np.ndarray
    landmarks: np.ndarray | None = None


@dataclass(frozen=True)
class EmbeddingEngineStatus:
    ready: bool
    model_name: str | None
    embedding_dim: int
    provider: str
    opencv_loaded: bool
    numpy_loaded: bool
    error: str | None = None


def _resolve_providers() -> list[str]:
    try:
        import onnxruntime as ort

        available = set(ort.get_available_providers())
        if "CUDAExecutionProvider" in available:
            return ["CUDAExecutionProvider", "CPUExecutionProvider"]
    except Exception:  # noqa: BLE001
        pass
    return ["CPUExecutionProvider"]


def initialize_embedding_engine() -> EmbeddingEngineStatus:
    """Load InsightFace Buffalo model once."""
    global _face_analysis, _engine_error, _engine_ready, _model_name

    settings = get_settings()
    model_name = settings.insightface_model
    providers = _resolve_providers()

    try:
        import insightface
        from insightface.app import FaceAnalysis

        logger.info(
            "Loading InsightFace model=%s providers=%s",
            model_name,
            providers,
        )
        app = FaceAnalysis(name=model_name, providers=providers)
        app.prepare(ctx_id=-1, det_size=(640, 640))
        _face_analysis = app
        _model_name = model_name
        _engine_ready = True
        _engine_error = None
        logger.info(
            "INSIGHTFACE_MODEL_LOADED_ONCE | model=%s | providers=%s",
            model_name,
            providers,
        )
    except Exception as exc:  # noqa: BLE001
        _face_analysis = None
        _engine_ready = False
        _engine_error = str(exc)
        logger.error("InsightFace engine failed to load: %s", exc)

    return get_embedding_engine_status()


def get_embedding_engine_status() -> EmbeddingEngineStatus:
    settings = get_settings()
    numpy_loaded = True
    opencv_loaded = True

    try:
        __import__("numpy")
    except Exception:  # noqa: BLE001
        numpy_loaded = False

    try:
        __import__("cv2")
    except Exception:  # noqa: BLE001
        opencv_loaded = False

    return EmbeddingEngineStatus(
        ready=_engine_ready,
        model_name=_model_name,
        embedding_dim=settings.face_vector_size,
        provider=_resolve_providers()[0],
        opencv_loaded=opencv_loaded,
        numpy_loaded=numpy_loaded,
        error=_engine_error,
    )


def require_embedding_engine():
    if _face_analysis is None:
        status = get_embedding_engine_status()
        detail = status.error or "InsightFace model is not loaded"
        raise RuntimeError(f"Face embedding engine unavailable: {detail}")
    return _face_analysis


def is_embedding_engine_ready() -> bool:
    return get_embedding_engine_status().ready


def _rgb_to_bgr(rgb: np.ndarray) -> np.ndarray:
    if rgb.ndim != 3 or rgb.shape[2] != 3:
        raise FaceValidationError("Invalid image format.", "invalid_image")
    return cv2.cvtColor(rgb, cv2.COLOR_RGB2BGR)


def detect_faces(rgb: np.ndarray) -> list[FaceDetection]:
    engine = require_embedding_engine()
    bgr = _rgb_to_bgr(rgb)
    faces = engine.get(bgr) or []

    detections: list[FaceDetection] = []
    for face in faces:
        bbox = tuple(float(value) for value in face.bbox)
        embedding = np.asarray(face.normed_embedding, dtype=np.float32)
        landmarks = (
            np.asarray(face.landmark_2d_106, dtype=np.float32)
            if getattr(face, "landmark_2d_106", None) is not None
            else None
        )
        detections.append(
            FaceDetection(
                bbox=bbox,
                detection_score=float(getattr(face, "det_score", 0.0)),
                embedding=embedding,
                landmarks=landmarks,
            ),
        )

    return detections


def extract_single_face_embedding(rgb: np.ndarray) -> tuple[list[float], FaceDetection]:
    detections = detect_faces(rgb)
    face_count = len(detections)

    if face_count == 0:
        raise FaceValidationError("No face detected.", "no_face")
    if face_count > 1:
        raise FaceValidationError("Multiple faces detected.", "multiple_faces")

    detection = detections[0]
    if detection.detection_score < get_settings().face_min_detection_score:
        raise FaceValidationError("Image quality is too low.", "low_quality")

    embedding = detection.embedding.astype(np.float32)
    magnitude = float(np.linalg.norm(embedding))
    if magnitude == 0.0 or np.allclose(embedding, 0.0):
        raise FaceValidationError("Invalid embedding: zero vector.", "invalid_embedding")

    normalized = (embedding / magnitude).tolist()
    expected = get_settings().face_vector_size

    if len(normalized) != expected:
        raise FaceValidationError(
            f"Invalid embedding length: expected {expected}, got {len(normalized)}.",
            "invalid_embedding",
        )

    logger.info(
        "InsightFace embedding generated | dimensions=%s | det_score=%.4f",
        len(normalized),
        detection.detection_score,
    )
    return normalized, detection
