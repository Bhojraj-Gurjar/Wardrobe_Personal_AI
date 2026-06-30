"""MediaPipe landmark-based face shape classification."""

from __future__ import annotations

from dataclasses import asdict, dataclass
from typing import Any

import numpy as np

FACE_SHAPES = ("Oval", "Round", "Square", "Diamond", "Heart")

# MediaPipe Face Landmarker indices (478-point topology)
LM_FOREHEAD = 10
LM_CHIN = 152
LM_LEFT_JAW = 172
LM_RIGHT_JAW = 397
LM_LEFT_CHEEK = 234
LM_RIGHT_CHEEK = 454
LM_LEFT_FOREHEAD = 21
LM_RIGHT_FOREHEAD = 251
LM_LEFT_TEMPLE = 127
LM_RIGHT_TEMPLE = 356

# Prototype metric targets derived from facial anthropometry references.
# Each tuple: (length_to_jaw, forehead_to_jaw, cheek_to_jaw, chin_angle_deg)
_SHAPE_PROTOTYPES: dict[str, tuple[float, float, float, float]] = {
    "Oval": (1.45, 0.98, 1.02, 138.0),
    "Round": (1.08, 1.02, 1.00, 152.0),
    "Square": (1.18, 0.98, 1.04, 126.0),
    "Diamond": (1.38, 0.86, 1.14, 132.0),
    "Heart": (1.28, 1.18, 0.96, 118.0),
}

_METRIC_WEIGHTS = {
    "length_to_jaw": 1.35,
    "forehead_to_jaw": 1.20,
    "cheek_to_jaw": 1.10,
    "chin_angle_deg": 0.85,
}


@dataclass(frozen=True)
class FaceShapeMetrics:
    face_length: float
    forehead_width: float
    jaw_width: float
    cheekbone_width: float
    chin_angle_deg: float
    length_to_jaw_ratio: float
    forehead_to_jaw_ratio: float
    cheek_to_jaw_ratio: float

    def to_dict(self) -> dict[str, float]:
        return asdict(self)


@dataclass(frozen=True)
class FaceShapeResult:
    face_shape: str
    confidence: float
    metrics: FaceShapeMetrics
    shape_scores: dict[str, float]

    def to_public_dict(self) -> dict[str, Any]:
        return {
            "faceShape": self.face_shape,
            "faceShapeConfidence": round(self.confidence, 2),
            "faceShapeMetrics": self.metrics.to_dict(),
            "faceShapeScores": {
                shape: round(score, 4) for shape, score in self.shape_scores.items()
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


def _chin_angle_deg(
    left_jaw: tuple[float, float],
    chin: tuple[float, float],
    right_jaw: tuple[float, float],
) -> float:
    vector_left = np.array(left_jaw, dtype=np.float64) - np.array(chin, dtype=np.float64)
    vector_right = np.array(right_jaw, dtype=np.float64) - np.array(chin, dtype=np.float64)

    left_norm = float(np.linalg.norm(vector_left))
    right_norm = float(np.linalg.norm(vector_right))

    if left_norm <= 0.0 or right_norm <= 0.0:
        return 130.0

    cosine = float(np.dot(vector_left, vector_right) / (left_norm * right_norm))
    cosine = float(np.clip(cosine, -1.0, 1.0))
    return float(np.degrees(np.arccos(cosine)))


def extract_face_shape_metrics(
    landmarks: list[Any],
    width: int,
    height: int,
) -> FaceShapeMetrics:
    forehead = _landmark_xy(landmarks, LM_FOREHEAD, width, height)
    chin = _landmark_xy(landmarks, LM_CHIN, width, height)
    left_jaw = _landmark_xy(landmarks, LM_LEFT_JAW, width, height)
    right_jaw = _landmark_xy(landmarks, LM_RIGHT_JAW, width, height)
    left_cheek = _landmark_xy(landmarks, LM_LEFT_CHEEK, width, height)
    right_cheek = _landmark_xy(landmarks, LM_RIGHT_CHEEK, width, height)
    left_forehead = _landmark_xy(landmarks, LM_LEFT_FOREHEAD, width, height)
    right_forehead = _landmark_xy(landmarks, LM_RIGHT_FOREHEAD, width, height)
    left_temple = _landmark_xy(landmarks, LM_LEFT_TEMPLE, width, height)
    right_temple = _landmark_xy(landmarks, LM_RIGHT_TEMPLE, width, height)

    face_length = _euclidean(forehead, chin)
    jaw_width = _euclidean(left_jaw, right_jaw)
    cheekbone_width = _euclidean(left_cheek, right_cheek)
    forehead_width = max(
        _euclidean(left_forehead, right_forehead),
        _euclidean(left_temple, right_temple),
    )
    chin_angle_deg = _chin_angle_deg(left_jaw, chin, right_jaw)

    jaw_width = max(jaw_width, 1.0)
    cheekbone_width = max(cheekbone_width, 1.0)
    forehead_width = max(forehead_width, 1.0)
    face_length = max(face_length, 1.0)

    return FaceShapeMetrics(
        face_length=round(face_length, 3),
        forehead_width=round(forehead_width, 3),
        jaw_width=round(jaw_width, 3),
        cheekbone_width=round(cheekbone_width, 3),
        chin_angle_deg=round(chin_angle_deg, 3),
        length_to_jaw_ratio=round(face_length / jaw_width, 4),
        forehead_to_jaw_ratio=round(forehead_width / jaw_width, 4),
        cheek_to_jaw_ratio=round(cheekbone_width / jaw_width, 4),
    )


def _prototype_distance(metrics: FaceShapeMetrics, prototype: tuple[float, float, float, float]) -> float:
    observed = (
        metrics.length_to_jaw_ratio,
        metrics.forehead_to_jaw_ratio,
        metrics.cheek_to_jaw_ratio,
        metrics.chin_angle_deg,
    )
    labels = (
        "length_to_jaw",
        "forehead_to_jaw",
        "cheek_to_jaw",
        "chin_angle_deg",
    )

    total = 0.0
    for label, actual, target in zip(labels, observed, prototype, strict=True):
        weight = _METRIC_WEIGHTS[label]
        denominator = max(abs(target), 1.0)
        total += weight * ((actual - target) / denominator) ** 2

    return total


def _confidence_from_distances(distances: dict[str, float]) -> tuple[str, float, dict[str, float]]:
    ranked = sorted(distances.items(), key=lambda item: item[1])
    best_shape, best_distance = ranked[0]
    second_distance = ranked[1][1] if len(ranked) > 1 else best_distance + 1.0

    fit_scores = {
        shape: 1.0 / (1.0 + distance) for shape, distance in distances.items()
    }
    score_total = sum(fit_scores.values()) or 1.0
    normalized_scores = {
        shape: score / score_total for shape, score in fit_scores.items()
    }

    best_probability = normalized_scores[best_shape]
    second_probability = max(
        value for shape, value in normalized_scores.items() if shape != best_shape
    )

    separation = max(best_probability - second_probability, 0.0)
    distance_margin = max(second_distance - best_distance, 0.0)
    distance_factor = distance_margin / (distance_margin + 1.0)

    confidence = 100.0 * (0.55 * best_probability + 0.30 * separation + 0.15 * distance_factor)
    confidence = float(np.clip(confidence, 0.0, 100.0))

    return best_shape, confidence, fit_scores


def analyze_face_shape(
    landmarks: list[Any],
    width: int,
    height: int,
) -> FaceShapeResult:
    metrics = extract_face_shape_metrics(landmarks, width, height)

    distances = {
        shape: _prototype_distance(metrics, prototype)
        for shape, prototype in _SHAPE_PROTOTYPES.items()
    }
    face_shape, confidence, shape_scores = _confidence_from_distances(distances)

    return FaceShapeResult(
        face_shape=face_shape,
        confidence=confidence,
        metrics=metrics,
        shape_scores=shape_scores,
    )
