"""Production face-trait engine using DeepFace, MediaPipe, and OpenCV."""

from __future__ import annotations

import logging
import os
import threading
from typing import Any

import numpy as np
from PIL import Image

from app.services.beard_analyzer import analyze_beard
from app.services.face_shape_analyzer import analyze_face_shape
from app.services.hair_analyzer import analyze_hair
from app.services.skin_tone_analyzer import analyze_skin_tone
from app.services.face_trait_models import (
    get_face_landmarker_model,
    get_hair_segmenter_model,
)
from app.services.face_validation import FaceValidationError
from app.utils.image import image_to_numpy

os.environ.setdefault("TF_USE_LEGACY_KERAS", "1")
os.environ.setdefault("TF_CPP_MIN_LOG_LEVEL", "3")

logger = logging.getLogger(__name__)

FACE_SHAPES = ("Oval", "Round", "Square", "Diamond", "Heart")
SKIN_TONES = ("Fair", "Light", "Medium", "Wheatish", "Deep")
HAIR_LENGTHS = ("Bald", "Short", "Medium", "Long")
HAIR_COLORS = ("Black", "Brown", "Blonde", "Grey", "Red")
HAIR_STYLES = (
    "Side Part",
    "Curly",
    "Straight",
    "Buzz Cut",
    "Wavy",
    "Undercut",
    "Crew Cut",
)
BEARD_TYPES = ("Clean Shave", "Light Beard", "Full Beard")

_ENGINE_LOCK = threading.Lock()
_ENGINE: "FaceTraitEngine | None" = None


class FaceTraitEngine:
    def __init__(self) -> None:
        import cv2
        import mediapipe as mp
        from deepface import DeepFace
        from mediapipe.tasks import python
        from mediapipe.tasks.python import vision

        self._cv2 = cv2
        self._mp = mp
        self._deepface = DeepFace

        landmarker_path = str(get_face_landmarker_model())
        hair_model_path = str(get_hair_segmenter_model())

        landmarker_options = vision.FaceLandmarkerOptions(
            base_options=python.BaseOptions(model_asset_path=landmarker_path),
            running_mode=vision.RunningMode.IMAGE,
            num_faces=1,
            output_face_blendshapes=False,
            output_facial_transformation_matrixes=False,
        )
        hair_options = vision.ImageSegmenterOptions(
            base_options=python.BaseOptions(model_asset_path=hair_model_path),
            running_mode=vision.RunningMode.IMAGE,
            output_category_mask=True,
            output_confidence_masks=False,
        )

        self._landmarker = vision.FaceLandmarker.create_from_options(landmarker_options)
        self._hair_segmenter = vision.ImageSegmenter.create_from_options(hair_options)
        logger.info("FaceTraitEngine initialized (DeepFace + MediaPipe + OpenCV)")

    def close(self) -> None:
        self._landmarker.close()
        self._hair_segmenter.close()

    def _extract_single_face(self, rgb: np.ndarray) -> np.ndarray:
        cv2 = self._cv2
        bgr = cv2.cvtColor(rgb, cv2.COLOR_RGB2BGR)
        faces = self._deepface.extract_faces(
            img_path=bgr,
            detector_backend="retinaface",
            enforce_detection=True,
            align=True,
        )

        if not faces:
            raise FaceValidationError("No face detected.", "no_face")
        if len(faces) > 1:
            raise FaceValidationError("Multiple faces detected.", "multiple_faces")

        face = faces[0]
        face_rgb = np.clip(face["face"] * 255.0, 0, 255).astype(np.uint8)

        if face_rgb.shape[2] == 3:
            face_rgb = cv2.cvtColor(face_rgb, cv2.COLOR_BGR2RGB)

        return face_rgb

    def _detect_landmarks(self, rgb: np.ndarray) -> list[Any]:
        mp_image = self._mp.Image(
            image_format=self._mp.ImageFormat.SRGB,
            data=np.ascontiguousarray(rgb),
        )
        result = self._landmarker.detect(mp_image)

        if not result.face_landmarks:
            raise FaceValidationError(
                "Unable to extract facial landmarks.",
                "landmarks_missing",
            )

        return result.face_landmarks[0]

    def _segment_hair(self, rgb: np.ndarray) -> np.ndarray:
        mp_image = self._mp.Image(
            image_format=self._mp.ImageFormat.SRGB,
            data=np.ascontiguousarray(rgb),
        )
        result = self._hair_segmenter.segment(mp_image)

        if result.category_mask is None:
            return np.zeros(rgb.shape[:2], dtype=bool)

        mask = result.category_mask.numpy_view().squeeze()
        return mask == 1

    def analyze(self, image: Image.Image) -> dict[str, str]:
        rgb = image_to_numpy(image)
        face_rgb = self._extract_single_face(rgb)
        height, width = face_rgb.shape[:2]

        landmarks = self._detect_landmarks(face_rgb)
        hair_mask = self._segment_hair(face_rgb)
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
            "hair=%s/%s/%s (%.1f%%/%.1f%%/%.1f%%) beard=%s (%.1f%%)",
            result["faceShape"],
            result["faceShapeConfidence"],
            result["skinTone"],
            result["skinToneConfidence"],
            result["hairLength"],
            result["hairColor"],
            result["hairStyle"],
            result["hairLengthConfidence"],
            result["hairColorConfidence"],
            result["hairStyleConfidence"],
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


def analyze_face_traits(image: Image.Image) -> dict[str, str]:
    """Analyze a frontal face image and return canonical trait labels."""
    return get_face_trait_engine().analyze(image)
