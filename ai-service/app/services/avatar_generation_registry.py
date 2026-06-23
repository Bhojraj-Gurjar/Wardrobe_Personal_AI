"""Strategy registry for avatar generation pipelines."""

from __future__ import annotations

from collections.abc import Callable
from typing import Any

from app.constants.avatar_types import (
    AvatarRenderMode,
    LEGACY_PROCEDURAL_AVATAR_TYPES,
    normalize_avatar_type,
)
from app.services.basic_avatar_service import generate_basic_avatar
from app.services.digital_avatar_service import generate_digital_avatar
from app.services.digital_twin_3d_service import generate_digital_twin_3d
from app.services.premium_avatar_service import generate_premium_avatar

Generator = Callable[..., dict[str, Any]]


def _wrap_canonical_type(canonical_type: str, generator: Generator) -> Generator:
    def _run(**kwargs: Any) -> dict[str, Any]:
        result = generator(**kwargs)
        result["avatarType"] = canonical_type
        metadata = result.get("metadata") or {}
        metadata["avatarType"] = canonical_type
        result["metadata"] = metadata
        return result

    return _run


AVATAR_GENERATORS: dict[str, Generator] = {
    AvatarRenderMode.BASIC_2D.value: _wrap_canonical_type(
        AvatarRenderMode.BASIC_2D.value,
        generate_basic_avatar,
    ),
    AvatarRenderMode.PREMIUM_PHOTOREALISTIC.value: _wrap_canonical_type(
        AvatarRenderMode.PREMIUM_PHOTOREALISTIC.value,
        generate_premium_avatar,
    ),
    AvatarRenderMode.DIGITAL_TWIN_3D.value: generate_digital_twin_3d,
}


def resolve_avatar_generator(avatar_type: str | None) -> tuple[str, Generator]:
    canonical = normalize_avatar_type(avatar_type)

    if canonical in AVATAR_GENERATORS:
        return canonical, AVATAR_GENERATORS[canonical]

    procedural = str(avatar_type or "").strip().upper()
    if procedural in LEGACY_PROCEDURAL_AVATAR_TYPES:

        def _procedural(**kwargs: Any) -> dict[str, Any]:
            return generate_digital_avatar(avatar_type=procedural, **kwargs)

        return procedural, _procedural

    raise ValueError(f"unsupported_avatar_type:{canonical}")
