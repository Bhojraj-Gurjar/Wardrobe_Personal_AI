"""OpenCV cheek-region skin tone analysis with lighting normalization."""

from __future__ import annotations

from dataclasses import asdict, dataclass
from typing import Any

import cv2
import numpy as np

SKIN_TONES = ("Fair", "Light", "Medium", "Wheatish", "Deep")

# MediaPipe cheek sampling landmarks (478-point topology)
LM_LEFT_CHEEK = 50
LM_RIGHT_CHEEK = 280
LM_LEFT_CHEEK_ALT = 205
LM_RIGHT_CHEEK_ALT = 425

# ITA category centers (Individual Typology Angle, degrees)
_ITA_CENTERS: dict[str, float] = {
    "Fair": 62.0,
    "Light": 48.0,
    "Medium": 34.5,
    "Wheatish": 19.0,
    "Deep": -8.0,
}

# Inclusive lower ITA bounds for hard classification
_ITA_BOUNDS: list[tuple[str, float]] = [
    ("Fair", 55.0),
    ("Light", 41.0),
    ("Medium", 28.0),
    ("Wheatish", 10.0),
    ("Deep", float("-inf")),
]

_CATEGORY_SPANS: dict[str, tuple[float, float]] = {
    "Fair": (55.0, 90.0),
    "Light": (41.0, 55.0),
    "Medium": (28.0, 41.0),
    "Wheatish": (10.0, 28.0),
    "Deep": (-30.0, 10.0),
}


@dataclass(frozen=True)
class SkinToneMetrics:
    ita_angle: float
    lab_l: float
    lab_a: float
    lab_b: float
    left_cheek_ita: float
    right_cheek_ita: float
    cheek_symmetry_delta: float
    sample_pixel_count: int

    def to_dict(self) -> dict[str, float | int]:
        return asdict(self)


@dataclass(frozen=True)
class SkinToneResult:
    skin_tone: str
    confidence: float
    metrics: SkinToneMetrics
    tone_scores: dict[str, float]

    def to_public_dict(self) -> dict[str, Any]:
        return {
            "skinTone": self.skin_tone,
            "skinToneConfidence": round(self.confidence, 2),
            "skinToneMetrics": self.metrics.to_dict(),
            "skinToneScores": {
                tone: round(score, 4) for tone, score in self.tone_scores.items()
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


def normalize_brightness(rgb: np.ndarray) -> np.ndarray:
    """Reduce global lighting bias using gray-world white balance."""
    image = rgb.astype(np.float32)
    channel_means = image.reshape(-1, 3).mean(axis=0)
    gray_target = float(channel_means.mean())

    if gray_target <= 0.0:
        return rgb

    scale = gray_target / np.maximum(channel_means, 1.0)
    balanced = image * scale
    balanced = np.clip(balanced, 0.0, 255.0).astype(np.uint8)

    lab = cv2.cvtColor(balanced, cv2.COLOR_RGB2LAB)
    l_channel, a_channel, b_channel = cv2.split(lab)

    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
    l_normalized = clahe.apply(l_channel)

    merged = cv2.merge((l_normalized, a_channel, b_channel))
    return cv2.cvtColor(merged, cv2.COLOR_LAB2RGB)


def _extract_cheek_patch(
    rgb: np.ndarray,
    center_x: float,
    center_y: float,
    patch_radius: int,
) -> np.ndarray:
    height, width = rgb.shape[:2]
    x0 = max(0, int(center_x) - patch_radius)
    x1 = min(width, int(center_x) + patch_radius)
    y0 = max(0, int(center_y) - patch_radius)
    y1 = min(height, int(center_y) + patch_radius)

    if x1 <= x0 or y1 <= y0:
        return np.empty((0, 3), dtype=np.uint8)

    return rgb[y0:y1, x0:x1].reshape(-1, 3)


def _filter_skin_pixels(pixels: np.ndarray) -> np.ndarray:
    if pixels.size == 0:
        return pixels

    lab = cv2.cvtColor(pixels.reshape(-1, 1, 3), cv2.COLOR_RGB2LAB).reshape(-1, 3)
    lightness = lab[:, 0]

    low = np.percentile(lightness, 15)
    high = np.percentile(lightness, 85)
    mask = (lightness >= low) & (lightness <= high)

    filtered = pixels[mask]
    return filtered if filtered.size else pixels


def _lab_median(pixels: np.ndarray) -> tuple[float, float, float]:
    if pixels.size == 0:
        return 50.0, 0.0, 0.0

    lab = cv2.cvtColor(pixels.reshape(-1, 1, 3), cv2.COLOR_RGB2LAB).reshape(-1, 3)
    l_value = float(np.median(lab[:, 0]) * 100.0 / 255.0)
    a_value = float(np.median(lab[:, 1]) - 128.0)
    b_value = float(np.median(lab[:, 2]) - 128.0)
    return l_value, a_value, b_value


def _ita_from_lab(l_value: float, b_value: float) -> float:
    return float(np.degrees(np.arctan2(l_value - 50.0, b_value)))


def _classify_ita(ita: float) -> str:
    for tone, lower_bound in _ITA_BOUNDS:
        if ita > lower_bound:
            return tone
    return "Deep"


def _tone_distance(ita: float, tone: str) -> float:
    center = _ITA_CENTERS[tone]
    spread = 12.0 if tone in {"Medium", "Wheatish"} else 10.0
    return abs(ita - center) / spread


def _confidence_from_ita(
    ita: float,
    tone: str,
    symmetry_delta: float,
    sample_pixel_count: int,
    tone_scores: dict[str, float],
) -> float:
    ranked = sorted(tone_scores.items(), key=lambda item: item[1], reverse=True)
    best_score = ranked[0][1]
    second_score = ranked[1][1] if len(ranked) > 1 else 0.0

    low, high = _CATEGORY_SPANS[tone]
    center = (low + high) / 2.0
    half_span = max((high - low) / 2.0, 1.0)
    center_fit = max(1.0 - abs(ita - center) / half_span, 0.0)
    separation = max(best_score - second_score, 0.0)
    symmetry_fit = max(1.0 - symmetry_delta / 12.0, 0.0)
    sample_fit = min(sample_pixel_count / 400.0, 1.0)

    confidence = 100.0 * (
        0.45 * center_fit
        + 0.30 * best_score
        + 0.15 * separation
        + 0.10 * symmetry_fit * sample_fit
    )
    return float(np.clip(confidence, 0.0, 100.0))


def extract_cheek_samples(
    rgb: np.ndarray,
    landmarks: list[Any],
    width: int,
    height: int,
) -> np.ndarray:
    patch_radius = max(int(min(width, height) * 0.045), 6)
    cheek_centers = (
        _landmark_xy(landmarks, LM_LEFT_CHEEK, width, height),
        _landmark_xy(landmarks, LM_RIGHT_CHEEK, width, height),
        _landmark_xy(landmarks, LM_LEFT_CHEEK_ALT, width, height),
        _landmark_xy(landmarks, LM_RIGHT_CHEEK_ALT, width, height),
    )

    patches = []
    for center_x, center_y in cheek_centers:
        patch = _extract_cheek_patch(rgb, center_x, center_y, patch_radius)
        if patch.size:
            patches.append(_filter_skin_pixels(patch))

    if not patches:
        return np.empty((0, 3), dtype=np.uint8)

    return np.concatenate(patches, axis=0)


def analyze_skin_tone(
    rgb: np.ndarray,
    landmarks: list[Any],
    width: int,
    height: int,
) -> SkinToneResult:
    normalized = normalize_brightness(rgb)

    left_patch = _filter_skin_pixels(
        _extract_cheek_patch(
            normalized,
            *_landmark_xy(landmarks, LM_LEFT_CHEEK, width, height),
            max(int(min(width, height) * 0.045), 6),
        )
    )
    right_patch = _filter_skin_pixels(
        _extract_cheek_patch(
            normalized,
            *_landmark_xy(landmarks, LM_RIGHT_CHEEK, width, height),
            max(int(min(width, height) * 0.045), 6),
        )
    )
    combined = extract_cheek_samples(normalized, landmarks, width, height)

    if combined.size == 0:
        combined = normalized.reshape(-1, 3)[:: max(normalized.shape[0] // 200, 1)]

    lab_l, lab_a, lab_b = _lab_median(combined)
    ita_angle = _ita_from_lab(lab_l, lab_b)

    left_l, _, left_b = _lab_median(left_patch)
    right_l, _, right_b = _lab_median(right_patch)
    left_ita = _ita_from_lab(left_l, left_b) if left_patch.size else ita_angle
    right_ita = _ita_from_lab(right_l, right_b) if right_patch.size else ita_angle
    symmetry_delta = abs(left_ita - right_ita)

    skin_tone = _classify_ita(ita_angle)
    distances = {tone: _tone_distance(ita_angle, tone) for tone in SKIN_TONES}
    fit_scores = {tone: 1.0 / (1.0 + distance) for tone, distance in distances.items()}
    score_total = sum(fit_scores.values()) or 1.0
    tone_scores = {tone: score / score_total for tone, score in fit_scores.items()}

    confidence = _confidence_from_ita(
        ita_angle,
        skin_tone,
        symmetry_delta,
        int(combined.shape[0]),
        tone_scores,
    )

    metrics = SkinToneMetrics(
        ita_angle=round(ita_angle, 3),
        lab_l=round(lab_l, 3),
        lab_a=round(lab_a, 3),
        lab_b=round(lab_b, 3),
        left_cheek_ita=round(left_ita, 3),
        right_cheek_ita=round(right_ita, 3),
        cheek_symmetry_delta=round(symmetry_delta, 3),
        sample_pixel_count=int(combined.shape[0]),
    )

    return SkinToneResult(
        skin_tone=skin_tone,
        confidence=confidence,
        metrics=metrics,
        tone_scores=tone_scores,
    )
