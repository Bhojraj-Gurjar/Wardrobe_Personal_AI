"""Body type classification from anthropometric ratios."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any

import numpy as np

BODY_TYPE_SLIM = "SLIM"
BODY_TYPE_ATHLETIC = "ATHLETIC"
BODY_TYPE_AVERAGE = "AVERAGE"
BODY_TYPE_MUSCULAR = "MUSCULAR"
BODY_TYPE_PLUS_SIZE = "PLUS_SIZE"

BODY_TYPE_LABELS = {
    BODY_TYPE_SLIM: "Slim",
    BODY_TYPE_ATHLETIC: "Athletic",
    BODY_TYPE_AVERAGE: "Average",
    BODY_TYPE_MUSCULAR: "Muscular",
    BODY_TYPE_PLUS_SIZE: "Plus Size",
}


@dataclass(frozen=True)
class BodyTypeProfile:
    shoulder_to_waist: float
    chest_ratio: float
    hip_ratio: float


# Reference ratio centroids derived from proportional landmark measurements.
BODY_TYPE_PROFILES: dict[str, BodyTypeProfile] = {
    BODY_TYPE_SLIM: BodyTypeProfile(shoulder_to_waist=1.38, chest_ratio=0.22, hip_ratio=0.20),
    BODY_TYPE_ATHLETIC: BodyTypeProfile(shoulder_to_waist=1.48, chest_ratio=0.25, hip_ratio=0.23),
    BODY_TYPE_AVERAGE: BodyTypeProfile(shoulder_to_waist=1.32, chest_ratio=0.26, hip_ratio=0.26),
    BODY_TYPE_MUSCULAR: BodyTypeProfile(shoulder_to_waist=1.52, chest_ratio=0.30, hip_ratio=0.24),
    BODY_TYPE_PLUS_SIZE: BodyTypeProfile(shoulder_to_waist=1.18, chest_ratio=0.33, hip_ratio=0.32),
}

RATIO_WEIGHTS = np.array([1.2, 1.0, 1.0], dtype=float)


def _compute_ratios(
    shoulder: float,
    waist: float,
    chest: float,
    hip: float,
    height: float,
) -> dict[str, float]:
    return {
        "shoulderToWaist": round(shoulder / waist, 4),
        "chest": round(chest / height, 4),
        "hip": round(hip / height, 4),
    }


def _ratio_vector(ratios: dict[str, float]) -> np.ndarray:
    return np.array(
        [ratios["shoulderToWaist"], ratios["chest"], ratios["hip"]],
        dtype=float,
    )


def _profile_vector(profile: BodyTypeProfile) -> np.ndarray:
    return np.array(
        [profile.shoulder_to_waist, profile.chest_ratio, profile.hip_ratio],
        dtype=float,
    )


def classify_body_type(
    shoulder: float | None,
    waist: float | None,
    chest: float | None,
    hip: float | None,
    height: float | None,
) -> dict[str, Any] | None:
    if not all(value and value > 0 for value in (shoulder, waist, chest, hip, height)):
        return None

    ratios = _compute_ratios(float(shoulder), float(waist), float(chest), float(hip), float(height))
    observed = _ratio_vector(ratios)

    distances: dict[str, float] = {}
    for label, profile in BODY_TYPE_PROFILES.items():
        centroid = _profile_vector(profile)
        delta = (observed - centroid) * RATIO_WEIGHTS
        distances[label] = float(np.linalg.norm(delta))

    scores = {
        label: float(np.exp(-distance))
        for label, distance in distances.items()
    }
    total_score = float(sum(scores.values()))
    if total_score <= 0:
        return None

    best_label = max(scores, key=scores.get)
    confidence = round((scores[best_label] / total_score) * 100, 1)

    ranked = sorted(
        (
            {
                "code": label,
                "label": BODY_TYPE_LABELS[label],
                "confidence": round((score / total_score) * 100, 1),
            }
            for label, score in scores.items()
        ),
        key=lambda item: item["confidence"],
        reverse=True,
    )

    return {
        "bodyType": BODY_TYPE_LABELS[best_label],
        "bodyTypeCode": best_label,
        "bodyTypeConfidence": confidence,
        "bodyTypeRatios": ratios,
        "bodyTypeScores": ranked,
    }


def aggregate_body_type(samples: list[dict[str, Any]]) -> dict[str, Any] | None:
    weighted_votes: dict[str, float] = {}
    ratio_accumulator = {
        "shoulderToWaist": [],
        "chest": [],
        "hip": [],
    }

    for sample in samples:
        classification = sample.get("_bodyTypeClassification")
        if not classification:
            continue

        code = classification.get("bodyTypeCode")
        confidence = float(classification.get("bodyTypeConfidence") or 0)
        frame_weight = float(sample.get("_frameConfidence") or confidence)

        if code:
            weighted_votes[code] = weighted_votes.get(code, 0.0) + frame_weight

        ratios = classification.get("bodyTypeRatios") or {}
        for key in ratio_accumulator:
            if ratios.get(key) is not None:
                ratio_accumulator[key].append(float(ratios[key]))

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

    return {
        "bodyType": BODY_TYPE_LABELS[best_code],
        "bodyTypeCode": best_code,
        "bodyTypeConfidence": confidence,
        "bodyTypeRatios": averaged_ratios,
    }
