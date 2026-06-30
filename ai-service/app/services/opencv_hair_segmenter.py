"""OpenCV heuristic hair segmentation (no MediaPipe / TensorFlow)."""

from __future__ import annotations

from typing import Any

import cv2
import numpy as np

from app.services.hair_analyzer import LM_CHIN, LM_FOREHEAD, LM_LEFT_TEMPLE, LM_RIGHT_TEMPLE


def _landmark_xy(
    landmarks: list[Any],
    index: int,
    width: int,
    height: int,
) -> tuple[float, float]:
    point = landmarks[index]
    return point.x * width, point.y * height


def segment_hair_opencv(
    rgb: np.ndarray,
    landmarks: list[Any],
    width: int,
    height: int,
) -> np.ndarray:
    forehead_x, forehead_y = _landmark_xy(landmarks, LM_FOREHEAD, width, height)
    chin_x, chin_y = _landmark_xy(landmarks, LM_CHIN, width, height)
    left_temple = _landmark_xy(landmarks, LM_LEFT_TEMPLE, width, height)
    right_temple = _landmark_xy(landmarks, LM_RIGHT_TEMPLE, width, height)

    face_height = max(chin_y - forehead_y, 1.0)
    y_top = max(0, int(forehead_y - face_height * 1.05))
    y_bottom = min(height, int(forehead_y + face_height * 0.22))
    x_left = max(0, int(min(left_temple[0], forehead_x) - face_height * 0.35))
    x_right = min(width, int(max(right_temple[0], forehead_x) + face_height * 0.35))

    mask = np.zeros((height, width), dtype=bool)
    if y_bottom <= y_top or x_right <= x_left:
        return mask

    gray = cv2.cvtColor(rgb, cv2.COLOR_RGB2GRAY)
    lab = cv2.cvtColor(rgb, cv2.COLOR_RGB2LAB)[:, :, 0].astype(np.float32)

    cheek_patch = max(int(min(width, height) * 0.04), 5)
    cheek_samples = []
    for center_x, center_y in (
        (forehead_x - face_height * 0.18, forehead_y + face_height * 0.18),
        (forehead_x + face_height * 0.18, forehead_y + face_height * 0.18),
    ):
        x0 = max(0, int(center_x) - cheek_patch)
        x1 = min(width, int(center_x) + cheek_patch)
        y0 = max(0, int(center_y) - cheek_patch)
        y1 = min(height, int(center_y) + cheek_patch)
        region = lab[y0:y1, x0:x1]
        if region.size:
            cheek_samples.append(region.reshape(-1))

    if cheek_samples:
        skin_l = float(np.median(np.concatenate(cheek_samples)))
    else:
        skin_l = float(np.median(lab))

    roi_lab = lab[y_top:y_bottom, x_left:x_right]
    roi_gray = gray[y_top:y_bottom, x_left:x_right]
    variance = cv2.blur(
        roi_gray.astype(np.float32) ** 2,
        (5, 5),
    ) - cv2.blur(roi_gray.astype(np.float32), (5, 5)) ** 2
    texture = np.sqrt(np.maximum(variance, 0.0))

    darker = roi_lab < (skin_l - 10.0)
    textured = texture > max(float(np.percentile(texture, 55)), 6.0)
    hair_candidate = darker | (textured & (roi_gray < (skin_l - 6.0)))

    # Suppress skin-colored bright pixels in the lower ROI band.
    lower_band = int((y_bottom - y_top) * 0.55)
    if lower_band > 0:
        hair_candidate[lower_band:, :] &= roi_lab[lower_band:, :] < (skin_l - 4.0)

    mask[y_top:y_bottom, x_left:x_right] = hair_candidate
    kernel = np.ones((3, 3), np.uint8)
    cleaned = cv2.morphologyEx(
        mask.astype(np.uint8),
        cv2.MORPH_OPEN,
        kernel,
    )
    cleaned = cv2.morphologyEx(cleaned, cv2.MORPH_CLOSE, kernel)
    return cleaned.astype(bool)
