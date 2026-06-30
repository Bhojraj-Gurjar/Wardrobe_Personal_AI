"""MediaPipe hair-segmentation based hair trait analysis."""

from __future__ import annotations

from dataclasses import asdict, dataclass
from typing import Any

import cv2
import numpy as np

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

LM_FOREHEAD = 10
LM_CHIN = 152
LM_LEFT_TEMPLE = 127
LM_RIGHT_TEMPLE = 356

_LENGTH_CENTERS = {
    "Bald": 0.04,
    "Short": 0.14,
    "Medium": 0.32,
    "Long": 0.58,
}

_COLOR_CENTERS_LAB = {
    "Black": (28.0, 128.0, 128.0),
    "Brown": (52.0, 138.0, 132.0),
    "Blonde": (72.0, 132.0, 145.0),
    "Grey": (82.0, 128.0, 128.0),
    "Red": (48.0, 155.0, 138.0),
}

# length_ratio, texture_coherence, edge_density, side_asymmetry, top_side_ratio, uniformity
_STYLE_PROTOTYPES: dict[str, tuple[float, float, float, float, float, float]] = {
    "Buzz Cut": (0.10, 0.88, 12.0, 0.08, 1.05, 0.82),
    "Crew Cut": (0.16, 0.82, 16.0, 0.10, 1.12, 0.74),
    "Straight": (0.34, 0.86, 18.0, 0.12, 1.08, 0.58),
    "Wavy": (0.36, 0.58, 28.0, 0.14, 1.10, 0.48),
    "Curly": (0.38, 0.32, 42.0, 0.16, 1.06, 0.40),
    "Side Part": (0.38, 0.62, 22.0, 0.34, 1.18, 0.52),
    "Undercut": (0.30, 0.70, 20.0, 0.12, 1.85, 0.55),
}

_STYLE_WEIGHTS = {
    "length_ratio": 1.10,
    "texture_coherence": 1.00,
    "edge_density": 0.85,
    "side_asymmetry": 1.15,
    "top_side_ratio": 1.25,
    "uniformity": 0.90,
}


@dataclass(frozen=True)
class HairMetrics:
    hair_pixel_count: int
    length_ratio: float
    coverage_ratio: float
    texture_coherence: float
    edge_density: float
    side_asymmetry: float
    top_density: float
    side_density: float
    top_side_ratio: float
    vertical_uniformity: float

    def to_dict(self) -> dict[str, float | int]:
        return asdict(self)


@dataclass(frozen=True)
class HairAnalysisResult:
    hair_length: str
    hair_length_confidence: float
    hair_color: str
    hair_color_confidence: float
    hair_style: str
    hair_style_confidence: float
    metrics: HairMetrics
    length_scores: dict[str, float]
    color_scores: dict[str, float]
    style_scores: dict[str, float]

    def to_public_dict(self) -> dict[str, Any]:
        return {
            "hairLength": self.hair_length,
            "hairLengthConfidence": round(self.hair_length_confidence, 2),
            "hairColor": self.hair_color,
            "hairColorConfidence": round(self.hair_color_confidence, 2),
            "hairStyle": self.hair_style,
            "hairStyleConfidence": round(self.hair_style_confidence, 2),
            "hairMetrics": self.metrics.to_dict(),
            "hairLengthScores": {
                key: round(value, 4) for key, value in self.length_scores.items()
            },
            "hairColorScores": {
                key: round(value, 4) for key, value in self.color_scores.items()
            },
            "hairStyleScores": {
                key: round(value, 4) for key, value in self.style_scores.items()
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


def _euclidean(
    point_a: tuple[float, float],
    point_b: tuple[float, float],
) -> float:
    return float(np.hypot(point_a[0] - point_b[0], point_a[1] - point_b[1]))


def _confidence_from_scores(scores: dict[str, float], label: str, center_fit: float) -> float:
    ranked = sorted(scores.items(), key=lambda item: item[1], reverse=True)
    best_score = ranked[0][1]
    second_score = ranked[1][1] if len(ranked) > 1 else 0.0
    separation = max(best_score - second_score, 0.0)
    confidence = 100.0 * (0.40 * center_fit + 0.35 * best_score + 0.25 * separation)
    return float(np.clip(confidence, 0.0, 100.0))


def _extract_hair_metrics(
    rgb: np.ndarray,
    hair_mask: np.ndarray,
    landmarks: list[Any],
    width: int,
    height: int,
) -> HairMetrics:
    hair_pixels = int(np.sum(hair_mask))
    forehead_x, forehead_y = _landmark_xy(landmarks, LM_FOREHEAD, width, height)
    chin_x, chin_y = _landmark_xy(landmarks, LM_CHIN, width, height)
    left_temple = _landmark_xy(landmarks, LM_LEFT_TEMPLE, width, height)
    right_temple = _landmark_xy(landmarks, LM_RIGHT_TEMPLE, width, height)

    face_height = max(_euclidean((forehead_x, forehead_y), (chin_x, chin_y)), 1.0)
    face_width = max(_euclidean(left_temple, right_temple), 1.0)
    face_area = max(face_height * face_width, 1.0)

    hair_coords = np.column_stack(np.where(hair_mask))
    if hair_coords.size == 0:
        return HairMetrics(
            hair_pixel_count=0,
            length_ratio=0.0,
            coverage_ratio=0.0,
            texture_coherence=0.0,
            edge_density=0.0,
            side_asymmetry=0.0,
            top_density=0.0,
            side_density=0.0,
            top_side_ratio=0.0,
            vertical_uniformity=0.0,
        )

    top_extent = max(0.0, forehead_y - float(np.min(hair_coords[:, 0])))
    length_ratio = top_extent / face_height
    coverage_ratio = hair_pixels / face_area

    center_x = int(width / 2)
    forehead_row = max(0, min(height - 1, int(forehead_y)))
    crown_mask = hair_mask[:forehead_row, :]
    top_density = float(np.mean(crown_mask)) if crown_mask.size else 0.0

    side_band_top = max(0, int(forehead_y * 0.55))
    side_band_bottom = forehead_row
    left_side = hair_mask[side_band_top:side_band_bottom, :center_x]
    right_side = hair_mask[side_band_top:side_band_bottom, center_x:]
    left_mass = float(np.mean(left_side)) if left_side.size else 0.0
    right_mass = float(np.mean(right_side)) if right_side.size else 0.0
    side_density = (left_mass + right_mass) / 2.0
    total_side = max(left_mass + right_mass, 1e-6)
    side_asymmetry = abs(left_mass - right_mass) / total_side
    top_side_ratio = top_density / max(side_density, 1e-6)

    gray = cv2.cvtColor(rgb, cv2.COLOR_RGB2GRAY)
    masked = cv2.bitwise_and(gray, gray, mask=hair_mask.astype(np.uint8))
    coords = cv2.findNonZero(masked)

    texture_coherence = 0.0
    edge_density = 0.0
    vertical_uniformity = 0.0

    if coords is not None:
        x, y, w, h = cv2.boundingRect(coords)
        roi = masked[y : y + h, x : x + w]
        if roi.size >= 64:
            gx = cv2.Sobel(roi, cv2.CV_64F, 1, 0, ksize=3)
            gy = cv2.Sobel(roi, cv2.CV_64F, 0, 1, ksize=3)
            magnitude = np.sqrt(gx * gx + gy * gy)
            angle = np.arctan2(gy, gx)
            valid = magnitude > np.percentile(magnitude, 70)
            if np.any(valid):
                angles = angle[valid]
                texture_coherence = float(np.abs(np.mean(np.exp(1j * angles))))
                edge_density = float(np.mean(magnitude[valid]))

        row_density = []
        for row_index in range(hair_mask.shape[0]):
            row = hair_mask[row_index]
            if np.any(row):
                row_density.append(float(np.mean(row)))
        if len(row_density) >= 3:
            vertical_uniformity = float(1.0 - min(np.std(row_density), 1.0))

    return HairMetrics(
        hair_pixel_count=hair_pixels,
        length_ratio=round(length_ratio, 4),
        coverage_ratio=round(coverage_ratio, 4),
        texture_coherence=round(texture_coherence, 4),
        edge_density=round(edge_density, 4),
        side_asymmetry=round(side_asymmetry, 4),
        top_density=round(top_density, 4),
        side_density=round(side_density, 4),
        top_side_ratio=round(top_side_ratio, 4),
        vertical_uniformity=round(vertical_uniformity, 4),
    )


def _classify_hair_length(metrics: HairMetrics) -> tuple[str, float, dict[str, float]]:
    ratio = metrics.length_ratio
    coverage = metrics.coverage_ratio
    pixels = metrics.hair_pixel_count

    if pixels < 80 or coverage < 0.02 or ratio < 0.06:
        label = "Bald"
    elif ratio < 0.18:
        label = "Short"
    elif ratio < 0.40:
        label = "Medium"
    else:
        label = "Long"

    distances = {
        length: abs(ratio - center) / max(center, 0.05) for length, center in _LENGTH_CENTERS.items()
    }
    fit_scores = {key: 1.0 / (1.0 + value) for key, value in distances.items()}
    total = sum(fit_scores.values()) or 1.0
    scores = {key: value / total for key, value in fit_scores.items()}

    center = _LENGTH_CENTERS[label]
    center_fit = max(1.0 - abs(ratio - center) / max(center, 0.05), 0.0)
    confidence = _confidence_from_scores(scores, label, center_fit)
    return label, confidence, scores


def _classify_hair_color(hair_pixels: np.ndarray) -> tuple[str, float, dict[str, float]]:
    if hair_pixels.size < 30:
        default_scores = {color: 1.0 if color == "Brown" else 0.0 for color in HAIR_COLORS}
        return "Brown", 20.0, default_scores

    pixels = hair_pixels.reshape(-1, 3).astype(np.uint8)
    if pixels.shape[0] > 5000:
        step = max(pixels.shape[0] // 5000, 1)
        sample = pixels[::step]
    else:
        sample = pixels

    sample_lab = cv2.cvtColor(sample.reshape(-1, 1, 3), cv2.COLOR_RGB2LAB).reshape(-1, 3).astype(np.float32)

    criteria = (cv2.TERM_CRITERIA_EPS + cv2.TERM_CRITERIA_MAX_ITER, 20, 1.0)
    _, labels, centers = cv2.kmeans(
        sample_lab,
        3,
        None,
        criteria,
        5,
        cv2.KMEANS_PP_CENTERS,
    )

    dominant = centers[int(np.bincount(labels.flatten()).argmax())]
    cluster_ratio = float(np.max(np.bincount(labels.flatten())) / labels.size)

    distances = {}
    for color, center in _COLOR_CENTERS_LAB.items():
        delta = dominant - np.array(center, dtype=np.float32)
        distances[color] = float(np.linalg.norm(delta / np.array([40.0, 20.0, 20.0])))

    fit_scores = {color: 1.0 / (1.0 + distance) for color, distance in distances.items()}
    total = sum(fit_scores.values()) or 1.0
    scores = {color: value / total for color, value in fit_scores.items()}
    label = max(scores, key=scores.get)

    center_fit = max(1.0 - distances[label] / 2.5, 0.0)
    confidence = _confidence_from_scores(scores, label, center_fit * cluster_ratio)
    return label, confidence, scores


def _style_distance(metrics: HairMetrics, prototype: tuple[float, float, float, float, float, float]) -> float:
    observed = (
        metrics.length_ratio,
        metrics.texture_coherence,
        metrics.edge_density,
        metrics.side_asymmetry,
        metrics.top_side_ratio,
        metrics.vertical_uniformity,
    )
    labels = (
        "length_ratio",
        "texture_coherence",
        "edge_density",
        "side_asymmetry",
        "top_side_ratio",
        "uniformity",
    )

    total = 0.0
    for label, actual, target in zip(labels, observed, prototype, strict=True):
        weight = _STYLE_WEIGHTS[label]
        denominator = max(abs(target), 0.1)
        total += weight * ((actual - target) / denominator) ** 2
    return total


def _classify_hair_style(metrics: HairMetrics) -> tuple[str, float, dict[str, float]]:
    if metrics.hair_pixel_count < 80:
        scores = {style: 1.0 if style == "Buzz Cut" else 0.0 for style in HAIR_STYLES}
        return "Buzz Cut", 25.0, scores

    distances = {
        style: _style_distance(metrics, prototype)
        for style, prototype in _STYLE_PROTOTYPES.items()
    }
    fit_scores = {style: 1.0 / (1.0 + distance) for style, distance in distances.items()}
    total = sum(fit_scores.values()) or 1.0
    scores = {style: value / total for style, value in fit_scores.items()}
    label = max(scores, key=scores.get)

    best_distance = distances[label]
    center_fit = 1.0 / (1.0 + best_distance)
    confidence = _confidence_from_scores(scores, label, center_fit)
    return label, confidence, scores


def analyze_hair(
    rgb: np.ndarray,
    hair_mask: np.ndarray,
    landmarks: list[Any],
    width: int,
    height: int,
) -> HairAnalysisResult:
    metrics = _extract_hair_metrics(rgb, hair_mask, landmarks, width, height)
    hair_pixels = rgb[hair_mask]

    hair_length, length_confidence, length_scores = _classify_hair_length(metrics)
    hair_color, color_confidence, color_scores = _classify_hair_color(hair_pixels)
    hair_style, style_confidence, style_scores = _classify_hair_style(metrics)

    return HairAnalysisResult(
        hair_length=hair_length,
        hair_length_confidence=length_confidence,
        hair_color=hair_color,
        hair_color_confidence=color_confidence,
        hair_style=hair_style,
        hair_style_confidence=style_confidence,
        metrics=metrics,
        length_scores=length_scores,
        color_scores=color_scores,
        style_scores=style_scores,
    )
