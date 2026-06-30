"""Body shape classification from shoulder, waist, and hip widths."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any

import numpy as np

BODY_SHAPE_RECTANGLE = "RECTANGLE"
BODY_SHAPE_TRIANGLE = "TRIANGLE"
BODY_SHAPE_INVERTED_TRIANGLE = "INVERTED_TRIANGLE"
BODY_SHAPE_OVAL = "OVAL"
BODY_SHAPE_TRAPEZOID = "TRAPEZOID"

BODY_SHAPE_LABELS = {
    BODY_SHAPE_RECTANGLE: "Rectangle",
    BODY_SHAPE_TRIANGLE: "Triangle",
    BODY_SHAPE_INVERTED_TRIANGLE: "Inverted Triangle",
    BODY_SHAPE_OVAL: "Oval",
    BODY_SHAPE_TRAPEZOID: "Trapezoid",
}


@dataclass(frozen=True)
class BodyShapeProfile:
    shoulder_to_waist: float
    waist_to_hip: float
    shoulder_to_hip: float


BODY_SHAPE_PROFILES: dict[str, BodyShapeProfile] = {
    BODY_SHAPE_RECTANGLE: BodyShapeProfile(
        shoulder_to_waist=1.02,
        waist_to_hip=1.02,
        shoulder_to_hip=1.00,
    ),
    BODY_SHAPE_TRIANGLE: BodyShapeProfile(
        shoulder_to_waist=1.08,
        waist_to_hip=0.90,
        shoulder_to_hip=0.86,
    ),
    BODY_SHAPE_INVERTED_TRIANGLE: BodyShapeProfile(
        shoulder_to_waist=1.16,
        waist_to_hip=1.04,
        shoulder_to_hip=1.14,
    ),
    BODY_SHAPE_OVAL: BodyShapeProfile(
        shoulder_to_waist=0.90,
        waist_to_hip=1.10,
        shoulder_to_hip=0.98,
    ),
    BODY_SHAPE_TRAPEZOID: BodyShapeProfile(
        shoulder_to_waist=1.22,
        waist_to_hip=0.88,
        shoulder_to_hip=1.10,
    ),
}

RATIO_WEIGHTS = np.array([1.0, 1.0, 1.1], dtype=float)


def _compute_shape_ratios(shoulder: float, waist: float, hip: float) -> dict[str, float]:
    return {
        "shoulderToWaist": round(shoulder / waist, 4),
        "waistToHip": round(waist / hip, 4),
        "shoulderToHip": round(shoulder / hip, 4),
    }


def _ratio_vector(ratios: dict[str, float]) -> np.ndarray:
    return np.array(
        [ratios["shoulderToWaist"], ratios["waistToHip"], ratios["shoulderToHip"]],
        dtype=float,
    )


def _profile_vector(profile: BodyShapeProfile) -> np.ndarray:
    return np.array(
        [profile.shoulder_to_waist, profile.waist_to_hip, profile.shoulder_to_hip],
        dtype=float,
    )


def classify_body_shape(
    shoulder: float | None,
    waist: float | None,
    hip: float | None,
) -> dict[str, Any] | None:
    if not all(value and value > 0 for value in (shoulder, waist, hip)):
        return None

    shoulder_value = float(shoulder)
    waist_value = float(waist)
    hip_value = float(hip)

    ratios = _compute_shape_ratios(shoulder_value, waist_value, hip_value)
    observed = _ratio_vector(ratios)

    distances: dict[str, float] = {}
    for label, profile in BODY_SHAPE_PROFILES.items():
        centroid = _profile_vector(profile)
        delta = (observed - centroid) * RATIO_WEIGHTS
        distances[label] = float(np.linalg.norm(delta))

    scores = {label: float(np.exp(-distance)) for label, distance in distances.items()}
    total_score = float(sum(scores.values()))
    if total_score <= 0:
        return None

    best_label = max(scores, key=scores.get)
    confidence = round((scores[best_label] / total_score) * 100, 1)

    ranked = sorted(
        (
            {
                "code": label,
                "label": BODY_SHAPE_LABELS[label],
                "confidence": round((score / total_score) * 100, 1),
            }
            for label, score in scores.items()
        ),
        key=lambda item: item["confidence"],
        reverse=True,
    )

    return {
        "bodyShape": BODY_SHAPE_LABELS[best_label],
        "bodyShapeCode": best_label,
        "bodyShapeConfidence": confidence,
        "bodyShapeRatios": ratios,
        "bodyShapeWidths": {
            "shoulder": round(shoulder_value, 1),
            "waist": round(waist_value, 1),
            "hip": round(hip_value, 1),
        },
        "bodyShapeScores": ranked,
    }


def aggregate_body_shape(samples: list[dict[str, Any]]) -> dict[str, Any] | None:
    weighted_votes: dict[str, float] = {}
    ratio_accumulator = {
        "shoulderToWaist": [],
        "waistToHip": [],
        "shoulderToHip": [],
    }
    width_accumulator = {
        "shoulder": [],
        "waist": [],
        "hip": [],
    }

    for sample in samples:
        classification = sample.get("_bodyShapeClassification")
        if not classification:
            continue

        code = classification.get("bodyShapeCode")
        confidence = float(classification.get("bodyShapeConfidence") or 0)
        frame_weight = float(sample.get("_frameConfidence") or confidence)

        if code:
            weighted_votes[code] = weighted_votes.get(code, 0.0) + frame_weight

        ratios = classification.get("bodyShapeRatios") or {}
        for key in ratio_accumulator:
            if ratios.get(key) is not None:
                ratio_accumulator[key].append(float(ratios[key]))

        widths = classification.get("bodyShapeWidths") or {}
        for key in width_accumulator:
            if widths.get(key) is not None:
                width_accumulator[key].append(float(widths[key]))

    if not weighted_votes:
        return None

    best_code = max(weighted_votes, key=weighted_votes.get)
    total_weight = float(sum(weighted_votes.values()))
    confidence = round((weighted_votes[best_code] / total_weight) * 100, 1)

    averaged_ratios = {
        key: round(float(np.mean(values)), 4)
        for key, values in ratio_accumulator.items()
        if values
    }
    averaged_widths = {
        key: round(float(np.mean(values)), 1)
        for key, values in width_accumulator.items()
        if values
    }

    return {
        "bodyShape": BODY_SHAPE_LABELS[best_code],
        "bodyShapeCode": best_code,
        "bodyShapeConfidence": confidence,
        "bodyShapeRatios": averaged_ratios,
        "bodyShapeWidths": averaged_widths,
    }
