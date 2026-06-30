"""Map InsightFace bbox + 5-point keypoints to analyzer landmark slots."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any

import numpy as np


@dataclass(frozen=True)
class NormPoint:
    x: float
    y: float


def _semantic_pixel_points(
    bbox: tuple[float, float, float, float],
    kps: np.ndarray,
) -> dict[int, tuple[float, float]]:
    x1, y1, x2, y2 = bbox
    left_eye, right_eye, nose, mouth_left, mouth_right = kps
    eye_mid = (left_eye + right_eye) / 2.0
    mouth_mid = (mouth_left + mouth_right) / 2.0
    face_height = max(float(y2 - y1), 1.0)
    face_width = max(float(x2 - x1), 1.0)

    chin = mouth_mid + (mouth_mid - eye_mid) * 0.9
    forehead = eye_mid - np.array([0.0, face_height * 0.36], dtype=np.float64)
    lower_lip = mouth_mid + (mouth_mid - eye_mid) * 0.18

    left_jaw = np.array([x1 + face_width * 0.10, float(chin[1]) - face_height * 0.04])
    right_jaw = np.array([x2 - face_width * 0.10, float(chin[1]) - face_height * 0.04])
    left_cheek = left_eye + (mouth_left - left_eye) * 0.62
    right_cheek = right_eye + (mouth_right - right_eye) * 0.62
    left_temple = np.array([x1 + face_width * 0.14, float(eye_mid[1]) - face_height * 0.10])
    right_temple = np.array([x2 - face_width * 0.14, float(eye_mid[1]) - face_height * 0.10])
    left_forehead = np.array([float(left_eye[0]), float(forehead[1])])
    right_forehead = np.array([float(right_eye[0]), float(forehead[1])])
    left_cheek_alt = left_cheek * 0.75 + left_eye * 0.25
    right_cheek_alt = right_cheek * 0.75 + right_eye * 0.25

    return {
        10: (float(forehead[0]), float(forehead[1])),
        17: (float(lower_lip[0]), float(lower_lip[1])),
        21: (float(left_forehead[0]), float(left_forehead[1])),
        50: (float(left_cheek[0]), float(left_cheek[1])),
        127: (float(left_temple[0]), float(left_temple[1])),
        152: (float(chin[0]), float(chin[1])),
        172: (float(left_jaw[0]), float(left_jaw[1])),
        205: (float(left_cheek_alt[0]), float(left_cheek_alt[1])),
        234: (float(left_cheek[0]), float(left_cheek[1])),
        251: (float(right_forehead[0]), float(right_forehead[1])),
        280: (float(right_cheek[0]), float(right_cheek[1])),
        356: (float(right_temple[0]), float(right_temple[1])),
        397: (float(right_jaw[0]), float(right_jaw[1])),
        425: (float(right_cheek_alt[0]), float(right_cheek_alt[1])),
        454: (float(right_cheek[0]), float(right_cheek[1])),
    }


def build_analyzer_landmarks(
    bbox: tuple[float, float, float, float],
    kps: np.ndarray,
    width: int,
    height: int,
) -> list[Any]:
    """Return a 478-slot landmark list compatible with trait analyzers."""
    default = NormPoint(0.5, 0.5)
    slots: list[Any] = [default] * 478

    for index, (pixel_x, pixel_y) in _semantic_pixel_points(bbox, kps).items():
        slots[index] = NormPoint(
            x=float(np.clip(pixel_x / max(width, 1), 0.0, 1.0)),
            y=float(np.clip(pixel_y / max(height, 1), 0.0, 1.0)),
        )

    return slots


def crop_face_region(
    rgb: np.ndarray,
    bbox: tuple[float, float, float, float],
    margin_ratio: float = 0.28,
) -> tuple[np.ndarray, tuple[float, float, float, float], tuple[int, int]]:
    """Crop face with margin; return crop, shifted bbox, and crop offset."""
    height, width = rgb.shape[:2]
    x1, y1, x2, y2 = bbox
    box_w = x2 - x1
    box_h = y2 - y1
    margin_x = box_w * margin_ratio
    margin_y = box_h * margin_ratio

    crop_x1 = max(0, int(x1 - margin_x))
    crop_y1 = max(0, int(y1 - margin_y))
    crop_x2 = min(width, int(x2 + margin_x))
    crop_y2 = min(height, int(y2 + margin_y))

    crop = rgb[crop_y1:crop_y2, crop_x1:crop_x2]
    shifted_bbox = (
        float(x1 - crop_x1),
        float(y1 - crop_y1),
        float(x2 - crop_x1),
        float(y2 - crop_y1),
    )
    return crop, shifted_bbox, (crop_x1, crop_y1)
