"""Lightweight liveness validation for multi-frame face auth (hold-still capture)."""

from __future__ import annotations

import logging
import math
from concurrent.futures import ThreadPoolExecutor
from dataclasses import dataclass

import cv2
import numpy as np

from app.config import get_settings
from app.services.embedding_service import FaceDetection, detect_faces_for_liveness
from app.services.face_errors import FaceValidationError
from app.services.liveness_service import liveness_service

logger = logging.getLogger(__name__)

SUPPORTED_CHALLENGES = frozenset(
    {
        "hold_still",
        # Legacy aliases — accepted for API compatibility, validated as hold_still.
        "blink_once",
        "blink_twice",
        "smile",
        "turn_left",
        "turn_right",
    },
)

# InsightFace 106-point landmark indices (buffalo_sc).
_LEFT_EYE = (35, 36, 37, 38, 39, 40, 41)
_RIGHT_EYE = (89, 90, 91, 92, 93, 94, 95)
_MOUTH_LEFT = 65
_MOUTH_RIGHT = 69
_NOSE_TIP = 52


@dataclass(frozen=True)
class FrameMetrics:
    ear: float
    yaw: float
    pitch: float
    smile_ratio: float
    mouth_open_ratio: float
    bbox_center: tuple[float, float]
    quality: float
    detection_score: float


@dataclass(frozen=True)
class LivenessResult:
    passed: bool
    liveness_score: float
    challenge_type: str
    frame_count: int
    valid_detections: tuple = ()


class LivenessChallengeService:
    def __init__(self) -> None:
        self._settings = get_settings()

    @staticmethod
    def normalize_challenge(challenge_type: str | None) -> str:
        normalized = str(challenge_type or "").strip().lower().replace("-", "_").replace(" ", "_")
        if normalized not in SUPPORTED_CHALLENGES:
            raise FaceValidationError(
                "Invalid or missing liveness challenge.",
                "liveness_failed",
            )
        if normalized != "hold_still":
            return "hold_still"
        return normalized

    def analyze_frames(
        self,
        rgb_frames: list[np.ndarray],
        *,
        challenge_type: str,
    ) -> LivenessResult:
        challenge = self.normalize_challenge(challenge_type)
        min_frames = self._settings.face_min_capture_frames
        max_frames = self._settings.face_max_capture_frames

        if len(rgb_frames) < min_frames:
            raise FaceValidationError(
                "Hold still for a second while we capture your face.",
                "liveness_failed",
            )
        if len(rgb_frames) > max_frames:
            rgb_frames = rgb_frames[:max_frames]

        metrics_list: list[FrameMetrics] = []
        detections: list[FaceDetection] = []
        rgb_used: list[np.ndarray] = []
        min_detection = self._resolve_hold_still_detection_threshold()

        frame_results = self._evaluate_frames(rgb_frames, min_detection)
        for result in frame_results:
            if result is None:
                continue
            metrics, detection, rgb = result
            metrics_list.append(metrics)
            detections.append(detection)
            rgb_used.append(rgb)

        if len(metrics_list) < min_frames:
            raise FaceValidationError(
                "We couldn't verify your face clearly. Please try again.",
                "liveness_failed",
            )

        self._validate_anti_spoof(rgb_used, detections, metrics_list)
        self._validate_hold_still(metrics_list)

        liveness_score = float(np.mean([metric.quality for metric in metrics_list]))
        logger.info(
            "Liveness hold-still passed | frames=%s | score=%.3f | avg_detection=%.3f",
            len(metrics_list),
            liveness_score,
            float(np.mean([metric.detection_score for metric in metrics_list])),
        )
        return LivenessResult(
            passed=True,
            liveness_score=liveness_score,
            challenge_type=challenge,
            frame_count=len(metrics_list),
            valid_detections=tuple(detections),
        )

    def _evaluate_frames(
        self,
        rgb_frames: list[np.ndarray],
        min_detection: float,
    ) -> list[tuple[FrameMetrics, FaceDetection, np.ndarray] | None]:
        if self._settings.face_liveness_parallel_frames and len(rgb_frames) > 1:
            max_workers = min(len(rgb_frames), 3)
            with ThreadPoolExecutor(max_workers=max_workers) as executor:
                return list(
                    executor.map(
                        lambda rgb: self._evaluate_single_frame(rgb, min_detection),
                        rgb_frames,
                    ),
                )

        return [self._evaluate_single_frame(rgb, min_detection) for rgb in rgb_frames]

    def _evaluate_single_frame(
        self,
        rgb: np.ndarray | None,
        min_detection: float,
    ) -> tuple[FrameMetrics, FaceDetection, np.ndarray] | None:
        if rgb is None or rgb.size == 0:
            return None

        frame_faces = detect_faces_for_liveness(rgb)
        if len(frame_faces) != 1:
            return None

        detection = frame_faces[0]
        if float(detection.detection_score) < min_detection:
            logger.info(
                "Skipping low-confidence liveness frame | score=%.3f | min=%.3f",
                float(detection.detection_score),
                min_detection,
            )
            return None

        try:
            quality = liveness_service.validate_frame(rgb, detection, relaxed=True)
            self._validate_face_geometry(rgb, detection)
        except FaceValidationError as exc:
            logger.info("Skipping liveness frame | code=%s", getattr(exc, "code", "validation_failed"))
            return None

        metrics = self._extract_metrics(detection, quality)
        return metrics, detection, rgb

    def _validate_face_geometry(self, rgb: np.ndarray, detection: FaceDetection) -> None:
        height, width = rgb.shape[:2]
        x1, y1, x2, y2 = detection.bbox
        face_width = max(float(x2 - x1), 1.0)
        face_height = max(float(y2 - y1), 1.0)
        frame_area = float(width * height)
        face_area = face_width * face_height
        area_ratio = face_area / max(frame_area, 1.0)

        if area_ratio < self._settings.face_min_area_ratio:
            raise FaceValidationError("Move closer to the camera.", "face_too_small")
        if area_ratio > self._settings.face_max_area_ratio:
            raise FaceValidationError("Move back from the camera.", "face_too_large")

        center_x = (x1 + x2) / 2.0
        center_y = (y1 + y2) / 2.0
        margin_x = width * self._settings.face_guide_margin_ratio
        margin_y = height * self._settings.face_guide_margin_ratio

        if (
            center_x < margin_x
            or center_x > width - margin_x
            or center_y < margin_y
            or center_y > height - margin_y
        ):
            raise FaceValidationError("Center your face in the frame.", "face_off_center")

        if self._settings.face_anti_spoof_enabled:
            aspect = face_width / max(face_height, 1.0)
            if aspect < 0.35 or aspect > 2.8:
                raise FaceValidationError("Live face required.", "spoof")

    @staticmethod
    def _eye_aspect_ratio(landmarks: np.ndarray, indices: tuple[int, ...]) -> float:
        points = landmarks[list(indices), :2]
        if points.shape[0] < 6:
            return 0.3

        vertical_a = float(np.linalg.norm(points[1] - points[5]))
        vertical_b = float(np.linalg.norm(points[2] - points[4]))
        horizontal = float(np.linalg.norm(points[0] - points[3]))
        if horizontal <= 0:
            return 0.3
        return (vertical_a + vertical_b) / (2.0 * horizontal)

    def _extract_metrics(self, detection: FaceDetection, quality: float) -> FrameMetrics:
        landmarks = detection.landmarks
        kps = detection.kps

        if landmarks is not None and landmarks.shape[0] >= 96:
            left_ear = self._eye_aspect_ratio(landmarks, _LEFT_EYE)
            right_ear = self._eye_aspect_ratio(landmarks, _RIGHT_EYE)
            ear = (left_ear + right_ear) / 2.0

            left_eye = landmarks[35:42, :2].mean(axis=0)
            right_eye = landmarks[89:96, :2].mean(axis=0)
            nose = landmarks[_NOSE_TIP, :2]
            mouth_left = landmarks[_MOUTH_LEFT, :2]
            mouth_right = landmarks[_MOUTH_RIGHT, :2]
        elif kps is not None and kps.shape[0] >= 5:
            left_eye = kps[0]
            right_eye = kps[1]
            nose = kps[2]
            mouth_left = kps[3]
            mouth_right = kps[4]
            inter_eye = float(np.linalg.norm(right_eye - left_eye))
            ear = 0.28 if inter_eye > 0 else 0.28
        else:
            raise FaceValidationError("Image quality is too low.", "low_quality")

        eye_center = (left_eye + right_eye) / 2.0
        inter_eye = float(np.linalg.norm(right_eye - left_eye))
        if inter_eye <= 0:
            inter_eye = 1.0

        yaw = float((np.linalg.norm(nose - right_eye) - np.linalg.norm(nose - left_eye)) / inter_eye)
        pitch = float((nose[1] - eye_center[1]) / inter_eye)
        mouth_width = float(np.linalg.norm(mouth_right - mouth_left))
        smile_ratio = mouth_width / inter_eye
        mouth_open_ratio = 0.0

        if landmarks is not None and landmarks.shape[0] >= 72:
            upper_lip = landmarks[62, :2]
            lower_lip = landmarks[66, :2]
            mouth_open_ratio = float(np.linalg.norm(lower_lip - upper_lip)) / inter_eye
        elif kps is not None and kps.shape[0] >= 5:
            mouth_center = (mouth_left + mouth_right) / 2.0
            mouth_open_ratio = float(np.linalg.norm(mouth_center - nose)) / inter_eye * 0.35

        x1, y1, x2, y2 = detection.bbox
        bbox_center = ((x1 + x2) / 2.0, (y1 + y2) / 2.0)

        return FrameMetrics(
            ear=ear,
            yaw=yaw,
            pitch=pitch,
            smile_ratio=smile_ratio,
            mouth_open_ratio=mouth_open_ratio,
            bbox_center=bbox_center,
            quality=quality,
            detection_score=detection.detection_score,
        )

    def _validate_anti_spoof(
        self,
        rgb_frames: list[np.ndarray],
        detections: list[FaceDetection],
        metrics_list: list[FrameMetrics],
    ) -> None:
        if not self._settings.face_anti_spoof_enabled:
            logger.info("Anti-spoof checks disabled for this environment")
            return

        settings = self._settings

        specular_ratios: list[float] = []
        for index, rgb in enumerate(rgb_frames):
            gray = cv2.cvtColor(rgb, cv2.COLOR_RGB2GRAY)
            region = liveness_service._crop_face_region(gray, detections[index].bbox)
            specular_ratios.append(float(np.mean(region > 235)))

        mean_specular = float(np.mean(specular_ratios)) if specular_ratios else 0.0

        logger.info("Anti-spoof metrics | specular=%.3f", mean_specular)

        if mean_specular > settings.face_anti_spoof_max_specular_ratio:
            raise FaceValidationError("Live face required.", "spoof")

        fft_scores: list[float] = []
        for rgb, detection in zip(rgb_frames, detections, strict=False):
            gray = cv2.cvtColor(rgb, cv2.COLOR_RGB2GRAY)
            region = liveness_service._crop_face_region(gray, detection.bbox)
            resized = cv2.resize(region, (128, 128), interpolation=cv2.INTER_AREA)
            spectrum = np.abs(np.fft.fftshift(np.fft.fft2(resized.astype(np.float32))))
            center = spectrum[48:80, 48:80].mean()
            outer = spectrum.mean()
            fft_scores.append(float(center / max(outer, 1e-6)))

        if fft_scores and float(np.mean(fft_scores)) > settings.face_anti_spoof_max_moire_ratio:
            raise FaceValidationError("Live face required.", "spoof")

    def _resolve_hold_still_detection_threshold(self) -> float:
        settings = self._settings
        return max(
            settings.face_liveness_min_detection_score,
            settings.face_min_embedding_confidence,
        )

    def _validate_hold_still(self, metrics_list: list[FrameMetrics]) -> None:
        settings = self._settings
        min_detection = self._resolve_hold_still_detection_threshold()
        min_ear = settings.face_blink_ear_threshold * 0.60
        required_passing = max(1, math.ceil(len(metrics_list) * 0.5))

        passing = 0
        for metric in metrics_list:
            if metric.detection_score >= min_detection and metric.ear >= min_ear:
                passing += 1

        if passing < required_passing:
            scores = [round(metric.detection_score, 3) for metric in metrics_list]
            ears = [round(metric.ear, 3) for metric in metrics_list]
            logger.warning(
                "Hold-still validation failed | passing=%s required=%s | detection=%s | ear=%s",
                passing,
                required_passing,
                scores,
                ears,
            )
            raise FaceValidationError(
                "We couldn't verify your face clearly. Please try again.",
                "liveness_failed",
            )


liveness_challenge_service = LivenessChallengeService()

