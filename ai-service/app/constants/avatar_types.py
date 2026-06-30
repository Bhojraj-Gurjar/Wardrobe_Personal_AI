"""Canonical avatar render modes and normalization helpers."""

from __future__ import annotations

from enum import Enum


class AvatarRenderMode(str, Enum):
    BASIC_2D = "BASIC_2D"
    PREMIUM_PHOTOREALISTIC = "PREMIUM_PHOTOREALISTIC"
    DIGITAL_TWIN_3D = "DIGITAL_TWIN_3D"


LEGACY_AVATAR_TYPE_ALIASES: dict[str, str] = {
    "BASIC": AvatarRenderMode.BASIC_2D.value,
    "PREMIUM": AvatarRenderMode.PREMIUM_PHOTOREALISTIC.value,
}

LEGACY_PROCEDURAL_AVATAR_TYPES = frozenset({"STYLIZED", "FASHION", "FITTING"})

AVATAR_RENDER_CAPABILITIES: dict[str, dict] = {
    AvatarRenderMode.BASIC_2D.value: {
        "dimension": "2d",
        "output_format": "png",
        "implemented": True,
        "generator_key": "basic_2d",
    },
    AvatarRenderMode.PREMIUM_PHOTOREALISTIC.value: {
        "dimension": "2d",
        "output_format": "png",
        "implemented": True,
        "generator_key": "premium_photorealistic",
    },
    AvatarRenderMode.DIGITAL_TWIN_3D.value: {
        "dimension": "3d",
        "output_format": "glb",
        "implemented": False,
        "generator_key": "digital_twin_3d",
    },
}


def normalize_avatar_type(value: str | None) -> str:
    normalized = str(value or AvatarRenderMode.BASIC_2D.value).strip().upper()
    return LEGACY_AVATAR_TYPE_ALIASES.get(normalized, normalized)


def get_avatar_capabilities(value: str | None) -> dict | None:
    canonical = normalize_avatar_type(value)
    return AVATAR_RENDER_CAPABILITIES.get(canonical)


def is_avatar_type_implemented(value: str | None) -> bool:
    capabilities = get_avatar_capabilities(value)
    if capabilities is not None:
        return bool(capabilities.get("implemented"))

    normalized = str(value or "").strip().upper()
    return normalized in LEGACY_PROCEDURAL_AVATAR_TYPES
