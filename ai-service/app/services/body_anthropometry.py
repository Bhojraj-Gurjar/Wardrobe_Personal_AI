"""Anthropometric helpers: width-to-circumference conversion, validation, and radar scoring."""

from __future__ import annotations

from typing import Any

import numpy as np

# Frontal width → estimated circumference (ellipse depth model, adult averages).
WIDTH_TO_CIRCUMFERENCE = {
    "chest": 2.55,
    "waist": 2.35,
    "hip": 2.45,
}

# Population reference ratios (measurement cm / height cm) for radar percentile scoring.
REFERENCE_RATIOS: dict[str, dict[str, float]] = {
    "shoulderWidth": {"mean": 0.258, "std": 0.022},
    "chest": {"mean": 0.565, "std": 0.038},
    "waist": {"mean": 0.475, "std": 0.045},
    "hip": {"mean": 0.535, "std": 0.040},
    "armLength": {"mean": 0.368, "std": 0.022},
    "legLength": {"mean": 0.465, "std": 0.028},
}

# Realistic bounds as fraction of height (circumference fields).
CIRCUMFERENCE_HEIGHT_BOUNDS = {
    "chest": (0.48, 0.66),
    "waist": (0.38, 0.58),
    "hip": (0.46, 0.64),
}

LINEAR_HEIGHT_BOUNDS = {
    "shoulderWidth": (0.20, 0.34),
    "armLength": (0.30, 0.44),
    "legLength": (0.38, 0.54),
}


def width_to_circumference(width_cm: float, region: str) -> float:
    multiplier = WIDTH_TO_CIRCUMFERENCE.get(region, 2.4)
    return round(width_cm * multiplier, 1)


def clamp_to_height_bounds(value: float, height_cm: float, field: str) -> float:
    if height_cm <= 0:
        return round(value, 1)

    if field in CIRCUMFERENCE_HEIGHT_BOUNDS:
        low, high = CIRCUMFERENCE_HEIGHT_BOUNDS[field]
    elif field in LINEAR_HEIGHT_BOUNDS:
        low, high = LINEAR_HEIGHT_BOUNDS[field]
    else:
        return round(value, 1)

    min_value = height_cm * low
    max_value = height_cm * high
    return round(float(np.clip(value, min_value, max_value)), 1)


def ratio_to_percentile_score(ratio: float, field: str) -> int | None:
    reference = REFERENCE_RATIOS.get(field)
    if not reference or ratio <= 0:
        return None

    z = (ratio - reference["mean"]) / max(reference["std"], 1e-6)
    # Normal CDF approximation (Abramowitz & Stegun)
    cdf = 0.5 * (1.0 + float(np.tanh(z * 0.7978845608)))
    percentile = int(round(cdf * 100))
    return max(5, min(95, percentile))


def build_proportion_scores(
    measurements: dict[str, float],
    height_cm: float,
) -> dict[str, int]:
    if height_cm <= 0:
        return {}

    scores: dict[str, int] = {}
    for field, reference in REFERENCE_RATIOS.items():
        value = measurements.get(field)
        if value is None or value <= 0:
            continue

        ratio = value / height_cm
        score = ratio_to_percentile_score(ratio, field)
        if score is not None:
            scores[field] = score

    return scores


def validate_measurements(measurements: dict[str, float], height_cm: float) -> dict[str, Any]:
    """Return validation flags when measurements look uncalibrated or unrealistic."""
    issues: list[str] = []

    chest = measurements.get("chest")
    waist = measurements.get("waist")
    hip = measurements.get("hip")

    if height_cm and chest and chest < height_cm * 0.35:
        issues.append("chest_too_small")
    if height_cm and waist and waist < height_cm * 0.30:
        issues.append("waist_too_small")
    if height_cm and hip and hip < height_cm * 0.35:
        issues.append("hip_too_small")

    if chest and waist and chest < waist:
        issues.append("chest_narrower_than_waist")

    return {
        "isValid": len(issues) == 0,
        "issues": issues,
    }
