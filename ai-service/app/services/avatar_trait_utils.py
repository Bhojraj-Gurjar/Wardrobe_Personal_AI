"""Shared trait parsing helpers for avatar generation services."""

from __future__ import annotations

from typing import Any

SKIN_TONE_COLORS = {
    "fair": (255, 224, 210),
    "light": (241, 194, 165),
    "medium": (198, 134, 88),
    "olive": (170, 128, 88),
    "tan": (150, 104, 72),
    "brown": (120, 78, 52),
    "dark": (88, 56, 38),
}

HAIR_COLORS = {
    "black": (24, 20, 18),
    "brown": (74, 48, 32),
    "blonde": (214, 178, 96),
    "red": (150, 58, 38),
    "gray": (140, 140, 148),
    "grey": (140, 140, 148),
    "auburn": (130, 52, 36),
}

BODY_TYPE_SCALE = {
    "ectomorph": (0.9, 1.04),
    "mesomorph": (1.05, 0.96),
    "endomorph": (1.0, 1.1),
    "slim": (0.92, 1.02),
    "athletic": (1.08, 0.94),
    "average": (1.0, 1.0),
    "curvy": (0.98, 1.08),
    "plus": (1.02, 1.12),
}

GENDER_SHOULDER_SCALE = {
    "male": 1.08,
    "m": 1.08,
    "female": 0.94,
    "f": 0.94,
    "non_binary": 1.0,
    "other": 1.0,
}


def normalize(value: Any, default: str = "") -> str:
    return str(value or default).strip().lower().replace(" ", "_").replace("-", "_")


def pick(dictionary: dict, *keys: str, default: str = "") -> str:
    for key in keys:
        value = dictionary.get(key)
        if value not in (None, ""):
            return normalize(value, default)
    return default


def skin_color(face_traits: dict, profile: dict) -> tuple[int, int, int]:
    tone = pick(
        {**profile, **face_traits},
        "skin_tone",
        "skinTone",
        default="medium",
    )
    return SKIN_TONE_COLORS.get(tone, SKIN_TONE_COLORS["medium"])


def hair_color(face_traits: dict) -> tuple[int, int, int]:
    color = pick(face_traits, "hair_color", "hairColor", default="brown")
    return HAIR_COLORS.get(color, HAIR_COLORS["brown"])


def gender_scale(profile: dict) -> float:
    gender = pick(profile, "gender", default="")
    return GENDER_SHOULDER_SCALE.get(gender, 1.0)


def age_face_scale(profile: dict) -> float:
    age = profile.get("age")
    try:
        age_value = int(age)
    except (TypeError, ValueError):
        return 1.0

    if age_value < 18:
        return 1.06
    if age_value < 30:
        return 1.02
    if age_value < 50:
        return 1.0
    return 0.96


def body_type_scale(body_traits: dict, profile: dict) -> tuple[float, float]:
    body_type = pick(
        {**profile, **body_traits},
        "body_type",
        "bodyType",
        default="average",
    )
    return BODY_TYPE_SCALE.get(body_type, BODY_TYPE_SCALE["average"])


def shape_widths(body_traits: dict, profile: dict) -> tuple[float, float, float]:
    widths = body_traits.get("bodyShapeWidths") or body_traits.get("body_shape_widths") or {}
    shoulder = float(widths.get("shoulder") or body_traits.get("shoulder_width") or 42)
    waist = float(widths.get("waist") or body_traits.get("waist") or 34)
    hip = float(widths.get("hip") or body_traits.get("hip") or 40)

    shoulder_scale, waist_hip_scale = body_type_scale(body_traits, profile)
    shoulder *= shoulder_scale * gender_scale(profile)
    waist *= waist_hip_scale
    hip *= waist_hip_scale

    shape = pick(body_traits, "body_shape", "bodyShape")
    if shape == "triangle":
        shoulder *= 0.92
        hip *= 1.08
    elif shape == "inverted_triangle":
        shoulder *= 1.1
        hip *= 0.92
    elif shape == "oval":
        waist *= 1.08
    elif shape == "trapezoid":
        shoulder *= 1.12
        waist *= 0.9

    return shoulder, waist, hip


def height_scale(body_traits: dict, profile: dict) -> float:
    height = body_traits.get("height") or profile.get("height") or 170
    try:
        height_value = float(height)
    except (TypeError, ValueError):
        height_value = 170.0
    return max(0.85, min(1.15, height_value / 170.0))


def shade_color(color: tuple[int, int, int], factor: float) -> tuple[int, int, int]:
    return tuple(max(0, min(255, int(channel * factor))) for channel in color)


def lighten_color(color: tuple[int, int, int], factor: float) -> tuple[int, int, int]:
    return tuple(
        max(0, min(255, int(channel + (255 - channel) * factor)))
        for channel in color
    )
