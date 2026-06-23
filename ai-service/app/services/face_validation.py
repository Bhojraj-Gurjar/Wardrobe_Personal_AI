"""Face validation — single face required via InsightFace detection."""

from __future__ import annotations

import logging
from dataclasses import dataclass

import numpy as np

from app.services.embedding_service import extract_single_face_embedding
from app.services.liveness_service import liveness_service

logger = logging.getLogger(__name__)


from app.services.face_errors import FaceValidationError


@dataclass
class FaceAnalysisResult:
    face_location: tuple[int, int, int, int]
    landmarks: dict
    quality_score: float
    face_count: int


def _bbox_to_location(bbox: tuple[float, float, float, float]) -> tuple[int, int, int, int]:
    x1, y1, x2, y2 = bbox
    top = int(y1)
    right = int(x2)
    bottom = int(y2)
    left = int(x1)
    return top, right, bottom, left


def analyze_face(rgb: np.ndarray) -> FaceAnalysisResult:
    _, detection = extract_single_face_embedding(rgb)
    quality = liveness_service.validate_frame(rgb, detection)

    logger.info("Face validation passed | face_count=1 | model=insightface")
    return FaceAnalysisResult(
        face_location=_bbox_to_location(detection.bbox),
        landmarks={},
        quality_score=quality,
        face_count=1,
    )


def embed_from_validated_face(rgb: np.ndarray) -> tuple[list[float], FaceAnalysisResult]:
    embedding, detection = extract_single_face_embedding(rgb)
    quality = liveness_service.validate_frame(rgb, detection)
    analysis = FaceAnalysisResult(
        face_location=_bbox_to_location(detection.bbox),
        landmarks={},
        quality_score=quality,
        face_count=1,
    )
    logger.info("STEP 6 embedding generated | dimensions=%s", len(embedding))
    return embedding, analysis
