"""Face-trait engine using InsightFace detection + OpenCV analyzers (no TensorFlow)."""

from __future__ import annotations

import logging
import threading
from typing import Any

import numpy as np
from PIL import Image

from app.services.beard_analyzer import analyze_beard
from app.services.embedding_service import extract_single_face_embedding
from app.services.face_shape_analyzer import analyze_face_shape
from app.services.face_validation import FaceValidationError
from app.services.hair_analyzer import analyze_hair
from app.services.insightface_landmark_adapter import (
    build_analyzer_landmarks,
    crop_face_region,
)
from app.services.opencv_hair_segmenter import segment_hair_opencv
from app.services.skin_tone_analyzer import analyze_skin_tone
from app.utils.image import image_to_numpy

logger = logging.getLogger(__name__)

_ENGINE_LOCK = threading.Lock()
_ENGINE: "FaceTraitEngine | None" = None


class FaceTraitEngine:
    def __init__(self) -> None:
        logger.info("FaceTraitEngine initialized (InsightFace + OpenCV)")

    def _resolve_face_inputs(
        self,
        rgb: np.ndarray,
    ) -> tuple[np.ndarray, list[Any], int, int, np.ndarray]:
        _, detection = extract_single_face_embedding(rgb)

        kps = detection.kps
        if kps is None or kps.shape != (5, 2):
            raise FaceValidationError(
                "Unable to extract facial landmarks.",
                "landmarks_missing",
            )

        face_rgb, shifted_bbox, offset = crop_face_region(rgb, detection.bbox)
        crop_h, crop_w = face_rgb.shape[:2]
        shifted_kps = kps - np.array([offset[0], offset[1]], dtype=np.float32)
        landmarks = build_analyzer_landmarks(shifted_bbox, shifted_kps, crop_w, crop_h)
        hair_mask = segment_hair_opencv(face_rgb, landmarks, crop_w, crop_h)
        return face_rgb, landmarks, crop_w, crop_h, hair_mask

    def analyze(self, image: Image.Image) -> dict[str, Any]:
        rgb = image_to_numpy(image)
        face_rgb, landmarks, width, height, hair_mask = self._resolve_face_inputs(rgb)

        shape_result = analyze_face_shape(landmarks, width, height)
        skin_result = analyze_skin_tone(face_rgb, landmarks, width, height)
        hair_result = analyze_hair(face_rgb, hair_mask, landmarks, width, height)
        beard_result = analyze_beard(face_rgb, hair_mask, landmarks, width, height)

        result = {
            "faceShape": shape_result.face_shape,
            "faceShapeConfidence": round(shape_result.confidence, 2),
            "faceShapeMetrics": shape_result.metrics.to_dict(),
            "skinTone": skin_result.skin_tone,
            "skinToneConfidence": round(skin_result.confidence, 2),
            "skinToneMetrics": skin_result.metrics.to_dict(),
            "hairLength": hair_result.hair_length,
            "hairLengthConfidence": round(hair_result.hair_length_confidence, 2),
            "hairColor": hair_result.hair_color,
            "hairColorConfidence": round(hair_result.hair_color_confidence, 2),
            "hairStyle": hair_result.hair_style,
            "hairStyleConfidence": round(hair_result.hair_style_confidence, 2),
            "hairMetrics": hair_result.metrics.to_dict(),
            "beardType": beard_result.beard_type,
            "beardTypeConfidence": round(beard_result.confidence, 2),
            "beardMetrics": beard_result.metrics.to_dict(),
        }

        logger.info(
            "Face trait analysis complete | shape=%s (%.1f%%) skin=%s (%.1f%%) "
            "hair=%s/%s/%s beard=%s (%.1f%%)",
            result["faceShape"],
            result["faceShapeConfidence"],
            result["skinTone"],
            result["skinToneConfidence"],
            result["hairLength"],
            result["hairColor"],
            result["hairStyle"],
            result["beardType"],
            result["beardTypeConfidence"],
        )
        return result


def get_face_trait_engine() -> FaceTraitEngine:
    global _ENGINE
    if _ENGINE is None:
        with _ENGINE_LOCK:
            if _ENGINE is None:
                _ENGINE = FaceTraitEngine()
    return _ENGINE


def analyze_face_traits(image: Image.Image) -> dict[str, Any]:
    """Analyze a frontal face image and return canonical trait labels."""
    return get_face_trait_engine().analyze(image)
