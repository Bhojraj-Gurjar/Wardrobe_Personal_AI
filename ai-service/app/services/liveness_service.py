"""Passive liveness and quality checks for single-frame face auth."""

from __future__ import annotations

import logging

import cv2
import numpy as np

from app.config import get_settings
from app.services.embedding_service import FaceDetection
from app.services.face_errors import FaceValidationError

logger = logging.getLogger(__name__)


class LivenessService:
    """Quality gates reused by registration, login, and verify flows."""

    def __init__(self) -> None:
        self._settings = get_settings()

    def validate_frame(self, rgb: np.ndarray, detection: FaceDetection | None = None) -> float:
        if rgb is None or rgb.size == 0:
            raise FaceValidationError("Invalid image.", "invalid_image")

        gray = cv2.cvtColor(rgb, cv2.COLOR_RGB2GRAY)
        blur_score = float(cv2.Laplacian(gray, cv2.CV_64F).var())

        if blur_score < self._settings.face_min_blur_variance:
            raise FaceValidationError("Image quality is too low.", "blur")

        mean_luma = float(np.mean(gray))
        if mean_luma < self._settings.face_min_brightness:
            raise FaceValidationError("Image quality is too low.", "too_dark")
        if mean_luma > self._settings.face_max_brightness:
            raise FaceValidationError("Image quality is too low.", "too_bright")

        if detection is not None:
            if detection.detection_score < self._settings.face_min_detection_score:
                raise FaceValidationError("Image quality is too low.", "low_quality")
            self._validate_landmarks(detection)

        quality = min(1.0, blur_score / max(self._settings.face_min_blur_variance, 1.0))
        logger.info(
            "Liveness quality passed | blur=%.2f | luma=%.2f | quality=%.2f",
            blur_score,
            mean_luma,
            quality,
        )
        return quality

    def _validate_landmarks(self, detection: FaceDetection) -> None:
        landmarks = detection.landmarks
        if landmarks is None or landmarks.size == 0:
            return

        # InsightFace 106-point landmarks support passive pose / expression checks.
        # Single-image auth cannot prove blink sequence; we only reject extreme poses.
        xs = landmarks[:, 0]
        ys = landmarks[:, 1]
        width = max(float(xs.max() - xs.min()), 1.0)
        height = max(float(ys.max() - ys.min()), 1.0)
        aspect = width / height

        if aspect < 0.55 or aspect > 1.8:
            raise FaceValidationError("Face verification failed.", "spoof")

    def validate_blink_sequence(self, ear_values: list[float]) -> bool:
        """Optional helper for future multi-frame blink liveness."""
        if len(ear_values) < 3:
            return False
        closed = any(value < self._settings.face_blink_ear_threshold for value in ear_values)
        reopened = ear_values[-1] > self._settings.face_blink_ear_threshold
        return closed and reopened

    def validate_head_movement(self, yaw_values: list[float]) -> bool:
        """Optional helper for future multi-frame head-turn liveness."""
        if len(yaw_values) < 2:
            return False
        delta = max(yaw_values) - min(yaw_values)
        return delta >= self._settings.face_head_movement_min_delta

    def validate_smile(self, smile_score: float) -> bool:
        """Optional helper for smile-based liveness prompts."""
        return smile_score >= self._settings.face_smile_score_threshold


liveness_service = LivenessService()
