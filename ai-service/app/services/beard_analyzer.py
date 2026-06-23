"""Lower-face beard analysis with shadow rejection."""

from __future__ import annotations

from dataclasses import asdict, dataclass
from typing import Any

import cv2
import numpy as np

BEARD_TYPES = ("Clean Shave", "Light Beard", "Full Beard")

LM_LOWER_LIP = 17
LM_CHIN = 152
LM_LEFT_JAW = 172
LM_RIGHT_JAW = 397
LM_LEFT_CHEEK = 50
LM_RIGHT_CHEEK = 280

_DENSITY_CENTERS = {
    "Clean Shave": 0.02,
    "Light Beard": 0.12,
    "Full Beard": 0.38,
}


@dataclass(frozen=True)
class BeardMetrics:
    lower_face_area: int
    raw_hair_mask_density: float
    corrected_beard_density: float
    texture_density: float
    shadow_exclusion_ratio: float
    cheek_reference_l: float
    mean_chin_l: float

    def to_dict(self) -> dict[str, float | int]:
        return asdict(self)


@dataclass(frozen=True)
class BeardAnalysisResult:
    beard_type: str
    confidence: float
    metrics: BeardMetrics
    beard_scores: dict[str, float]

    def to_public_dict(self) -> dict[str, Any]:
        return {
            "beardType": self.beard_type,
            "beardTypeConfidence": round(self.confidence, 2),
            "beardMetrics": self.metrics.to_dict(),
            "beardTypeScores": {
                key: round(value, 4) for key, value in self.beard_scores.items()
            },
        }


def _landmark_xy(
    landmarks: list[Any],
    index: int,
    width: int,
    height: int,
) -> tuple[float, float]:
    point = landmarks[index]
    return point.x * width, point.y * height


def _cheek_reference_l(rgb: np.ndarray, landmarks: list[Any], width: int, height: int) -> float:
    patch = max(int(min(width, height) * 0.04), 5)
    samples = []

    for index in (LM_LEFT_CHEEK, LM_RIGHT_CHEEK):
        center_x, center_y = _landmark_xy(landmarks, index, width, height)
        x0 = max(0, int(center_x) - patch)
        x1 = min(width, int(center_x) + patch)
        y0 = max(0, int(center_y) - patch)
        y1 = min(height, int(center_y) + patch)
        region = rgb[y0:y1, x0:x1]
        if region.size:
            samples.append(region.reshape(-1, 3))

    if not samples:
        return 128.0

    pixels = np.concatenate(samples, axis=0).astype(np.uint8)
    lab = cv2.cvtColor(pixels.reshape(-1, 1, 3), cv2.COLOR_RGB2LAB).reshape(-1, 3)
    return float(np.median(lab[:, 0]))


def _extract_lower_face_roi(
    landmarks: list[Any],
    width: int,
    height: int,
) -> tuple[int, int, int, int]:
    lower_lip = _landmark_xy(landmarks, LM_LOWER_LIP, width, height)
    chin = _landmark_xy(landmarks, LM_CHIN, width, height)
    left_jaw = _landmark_xy(landmarks, LM_LEFT_JAW, width, height)
    right_jaw = _landmark_xy(landmarks, LM_RIGHT_JAW, width, height)

    y0 = int(max(lower_lip[1], min(lower_lip[1], chin[1] - 2)))
    y1 = min(height, int(chin[1] + (chin[1] - lower_lip[1]) * 1.2))
    x0 = int(min(left_jaw[0], right_jaw[0]))
    x1 = int(max(left_jaw[0], right_jaw[0]))

    roi_width = max(x1 - x0, 1)
    roi_height = max(y1 - y0, 1)
    inset_x = max(int(roi_width * 0.10), 1)
    inset_y = max(int(roi_height * 0.08), 1)

    return (
        max(0, x0 + inset_x),
        min(width, x1 - inset_x),
        max(0, y0 + inset_y),
        min(height, y1),
    )


def _local_texture(gray_roi: np.ndarray) -> np.ndarray:
    if gray_roi.size == 0:
        return np.zeros((0, 0), dtype=np.float32)

    gray = gray_roi.astype(np.float32)
    kernel_size = 5
    mean = cv2.blur(gray, (kernel_size, kernel_size))
    sq_mean = cv2.blur(gray * gray, (kernel_size, kernel_size))
    variance = np.maximum(sq_mean - mean * mean, 0.0)
    return np.sqrt(variance)


def _shadow_mask(
    chin_lab_l: np.ndarray,
    cheek_reference_l: float,
    texture_map: np.ndarray,
    hair_mask_roi: np.ndarray,
) -> np.ndarray:
    if chin_lab_l.size == 0:
        return np.zeros_like(chin_lab_l, dtype=bool)

    darkness = cheek_reference_l - chin_lab_l
    texture_threshold = max(float(np.percentile(texture_map, 55)), 4.0) if texture_map.size else 4.0

    shadow = (
        (darkness > 22.0)
        & (texture_map < texture_threshold)
        & (~hair_mask_roi)
    )
    return shadow


def _beard_candidate_mask(
    hair_mask_roi: np.ndarray,
    texture_map: np.ndarray,
    shadow_mask: np.ndarray,
) -> np.ndarray:
    if hair_mask_roi.size == 0:
        return hair_mask_roi

    texture_threshold = max(float(np.percentile(texture_map, 45)), 3.5) if texture_map.size else 3.5
    return hair_mask_roi & (texture_map >= texture_threshold) & (~shadow_mask)


def _confidence_from_scores(scores: dict[str, float], label: str, center_fit: float) -> float:
    ranked = sorted(scores.items(), key=lambda item: item[1], reverse=True)
    best_score = ranked[0][1]
    second_score = ranked[1][1] if len(ranked) > 1 else 0.0
    separation = max(best_score - second_score, 0.0)
    confidence = 100.0 * (0.45 * center_fit + 0.35 * best_score + 0.20 * separation)
    return float(np.clip(confidence, 0.0, 100.0))


def _classify_beard_density(corrected_density: float) -> tuple[str, float, dict[str, float]]:
    if corrected_density < 0.06:
        label = "Clean Shave"
    elif corrected_density < 0.22:
        label = "Light Beard"
    else:
        label = "Full Beard"

    distances = {
        beard_type: abs(corrected_density - center) / max(center, 0.04)
        for beard_type, center in _DENSITY_CENTERS.items()
    }
    fit_scores = {key: 1.0 / (1.0 + value) for key, value in distances.items()}
    total = sum(fit_scores.values()) or 1.0
    scores = {key: value / total for key, value in fit_scores.items()}

    center = _DENSITY_CENTERS[label]
    center_fit = max(1.0 - abs(corrected_density - center) / max(center, 0.04), 0.0)
    confidence = _confidence_from_scores(scores, label, center_fit)
    return label, confidence, scores


def analyze_beard(
    rgb: np.ndarray,
    hair_mask: np.ndarray,
    landmarks: list[Any],
    width: int,
    height: int,
) -> BeardAnalysisResult:
    x0, x1, y0, y1 = _extract_lower_face_roi(landmarks, width, height)

    if x1 <= x0 or y1 <= y0:
        metrics = BeardMetrics(
            lower_face_area=0,
            raw_hair_mask_density=0.0,
            corrected_beard_density=0.0,
            texture_density=0.0,
            shadow_exclusion_ratio=0.0,
            cheek_reference_l=0.0,
            mean_chin_l=0.0,
        )
        scores = {beard_type: 1.0 if beard_type == "Clean Shave" else 0.0 for beard_type in BEARD_TYPES}
        return BeardAnalysisResult(
            beard_type="Clean Shave",
            confidence=85.0,
            metrics=metrics,
            beard_scores=scores,
        )

    chin_rgb = rgb[y0:y1, x0:x1]
    chin_hair_mask = hair_mask[y0:y1, x0:x1]
    chin_gray = cv2.cvtColor(chin_rgb, cv2.COLOR_RGB2GRAY)
    chin_lab = cv2.cvtColor(chin_rgb, cv2.COLOR_RGB2LAB)[:, :, 0].astype(np.float32)

    cheek_reference_l = _cheek_reference_l(rgb, landmarks, width, height)
    texture_map = _local_texture(chin_gray)
    shadow_mask = _shadow_mask(chin_lab, cheek_reference_l, texture_map, chin_hair_mask)
    beard_mask = _beard_candidate_mask(chin_hair_mask, texture_map, shadow_mask)

    lower_face_area = int(chin_rgb.shape[0] * chin_rgb.shape[1])
    valid_pixels = max(lower_face_area - int(np.sum(shadow_mask)), 1)

    raw_hair_mask_density = float(np.mean(chin_hair_mask)) if lower_face_area else 0.0
    corrected_beard_density = float(np.sum(beard_mask) / valid_pixels)
    texture_density = float(np.mean(texture_map[beard_mask])) if np.any(beard_mask) else 0.0
    shadow_exclusion_ratio = float(np.sum(shadow_mask) / max(lower_face_area, 1))
    mean_chin_l = float(np.mean(chin_lab)) if chin_lab.size else 0.0

    beard_type, confidence, scores = _classify_beard_density(corrected_beard_density)

    # Penalize confidence when shadow correction removed a large portion of raw mask
    if raw_hair_mask_density > 0.12 and corrected_beard_density < 0.05:
        confidence = min(confidence, 35.0)

    metrics = BeardMetrics(
        lower_face_area=lower_face_area,
        raw_hair_mask_density=round(raw_hair_mask_density, 4),
        corrected_beard_density=round(corrected_beard_density, 4),
        texture_density=round(texture_density, 4),
        shadow_exclusion_ratio=round(shadow_exclusion_ratio, 4),
        cheek_reference_l=round(cheek_reference_l, 3),
        mean_chin_l=round(mean_chin_l, 3),
    )

    return BeardAnalysisResult(
        beard_type=beard_type,
        confidence=confidence,
        metrics=metrics,
        beard_scores=scores,
    )
