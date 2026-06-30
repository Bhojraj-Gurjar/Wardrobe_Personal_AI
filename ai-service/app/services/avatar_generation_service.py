"""Unified avatar generation orchestration for FastAPI."""

from __future__ import annotations

import logging
from typing import Any

from app.constants.avatar_types import AvatarRenderMode, normalize_avatar_type
from app.services.avatar_generation_registry import resolve_avatar_generator

logger = logging.getLogger(__name__)


def _as_dict(value: Any) -> dict[str, Any]:
    if value is None:
        return {}
    if hasattr(value, "model_dump"):
        return value.model_dump(by_alias=True, exclude_none=True)
    if isinstance(value, dict):
        return value
    return {}


def _first_value(*values: Any) -> Any:
    for value in values:
        if value not in (None, ""):
            return value
    return None


def merge_generation_traits(
    *,
    face_analysis: dict | None,
    body_analysis: dict | None,
    skin_tone: str | None,
    hair_analysis: dict | None,
    beard_analysis: dict | None,
    profile: dict | None,
) -> tuple[dict[str, Any], dict[str, Any], dict[str, Any]]:
    face_data = _as_dict(face_analysis)
    body_data = _as_dict(body_analysis)
    hair_data = _as_dict(hair_analysis)
    if not hair_data:
        hair_data = {
            "hairLength": _first_value(face_data.get("hairLength"), face_data.get("hair_length")),
            "hairColor": _first_value(face_data.get("hairColor"), face_data.get("hair_color")),
            "hairStyle": _first_value(face_data.get("hairStyle"), face_data.get("hair_style")),
        }

    beard_data = _as_dict(beard_analysis)
    if not beard_data:
        beard_data = {
            "beardType": _first_value(face_data.get("beardType"), face_data.get("beard_type")),
        }
    user_profile = _as_dict(profile)

    resolved_skin_tone = _first_value(
        skin_tone,
        face_data.get("skinTone"),
        face_data.get("skin_tone"),
        user_profile.get("skinTone"),
        user_profile.get("skin_tone"),
    )

    face_traits = {
        **face_data,
        "face_shape": _first_value(face_data.get("face_shape"), face_data.get("faceShape")),
        "faceShape": _first_value(face_data.get("faceShape"), face_data.get("face_shape")),
        "skin_tone": resolved_skin_tone,
        "skinTone": resolved_skin_tone,
        "hair_length": _first_value(hair_data.get("hair_length"), hair_data.get("hairLength")),
        "hairLength": _first_value(hair_data.get("hairLength"), hair_data.get("hair_length")),
        "hair_color": _first_value(hair_data.get("hair_color"), hair_data.get("hairColor")),
        "hairColor": _first_value(hair_data.get("hairColor"), hair_data.get("hair_color")),
        "hair_style": _first_value(hair_data.get("hair_style"), hair_data.get("hairStyle")),
        "hairStyle": _first_value(hair_data.get("hairStyle"), hair_data.get("hair_style")),
        "beard_type": _first_value(beard_data.get("beard_type"), beard_data.get("beardType")),
        "beardType": _first_value(beard_data.get("beardType"), beard_data.get("beard_type")),
    }

    if resolved_skin_tone and not user_profile.get("skin_tone"):
        user_profile["skin_tone"] = resolved_skin_tone
        user_profile["skinTone"] = resolved_skin_tone

    return face_traits, body_data, user_profile


def _score_present(value: Any) -> float:
    return 1.0 if value not in (None, "") else 0.0


def compute_generation_confidence(
    *,
    avatar_type: str,
    face_traits: dict[str, Any],
    body_traits: dict[str, Any],
    skin_tone: str | None,
    hair_analysis: dict[str, Any],
    beard_analysis: dict[str, Any],
) -> float:
    face_score = _score_present(
        face_traits.get("face_shape") or face_traits.get("faceShape"),
    )
    skin_score = _score_present(
        skin_tone
        or face_traits.get("skin_tone")
        or face_traits.get("skinTone"),
    )
    hair_score = max(
        _score_present(hair_analysis.get("hair_color") or hair_analysis.get("hairColor")),
        _score_present(hair_analysis.get("hair_style") or hair_analysis.get("hairStyle")),
        _score_present(hair_analysis.get("hair_length") or hair_analysis.get("hairLength")),
    )
    beard_score = _score_present(
        beard_analysis.get("beard_type")
        if beard_analysis.get("beard_type") is not None
        else beard_analysis.get("beardType"),
    )
    body_score = max(
        _score_present(body_traits.get("body_type") or body_traits.get("bodyType")),
        _score_present(body_traits.get("body_shape") or body_traits.get("bodyShape")),
        _score_present(body_traits.get("measurements")),
    )

    if avatar_type in (
        AvatarRenderMode.PREMIUM_PHOTOREALISTIC.value,
        AvatarRenderMode.DIGITAL_TWIN_3D.value,
        "PREMIUM",
    ):
        weights = {
            "face": 0.2,
            "skin": 0.2,
            "hair": 0.2,
            "beard": 0.15,
            "body": 0.25,
        }
        confidence = (
            face_score * weights["face"]
            + skin_score * weights["skin"]
            + hair_score * weights["hair"]
            + beard_score * weights["beard"]
            + body_score * weights["body"]
        )
    else:
        confidence = (
            face_score + skin_score + hair_score + beard_score + body_score
        ) / 5.0

    return round(min(max(confidence, 0.0), 1.0), 4)


def generate_avatar(
    *,
    avatar_type: str,
    face_analysis: dict | None,
    body_analysis: dict | None,
    skin_tone: str | None,
    hair_analysis: dict | None,
    beard_analysis: dict | None,
    profile: dict | None,
) -> dict[str, Any]:
    normalized_type = normalize_avatar_type(avatar_type)
    face_traits, body_traits, user_profile = merge_generation_traits(
        face_analysis=face_analysis,
        body_analysis=body_analysis,
        skin_tone=skin_tone,
        hair_analysis=hair_analysis,
        beard_analysis=beard_analysis,
        profile=profile,
    )

    confidence = compute_generation_confidence(
        avatar_type=normalized_type,
        face_traits=face_traits,
        body_traits=body_traits,
        skin_tone=skin_tone,
        hair_analysis=_as_dict(hair_analysis),
        beard_analysis=_as_dict(beard_analysis),
    )

    canonical_type, generator = resolve_avatar_generator(avatar_type)
    result = generator(
        face_traits=face_traits,
        body_traits=body_traits,
        profile=user_profile,
    )

    metadata = result.get("metadata") or {}
    metadata["confidence"] = confidence
    metadata["renderMode"] = canonical_type

    logger.info(
        "Avatar generated type=%s confidence=%.4f",
        result.get("avatarType") or canonical_type,
        confidence,
    )

    return {
        "avatarType": result.get("avatarType") or canonical_type,
        "avatarImageUrl": result.get("avatarImage"),
        "confidence": confidence,
        "metadata": metadata,
    }
