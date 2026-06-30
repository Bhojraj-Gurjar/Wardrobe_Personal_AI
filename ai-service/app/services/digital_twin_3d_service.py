"""3D Digital Twin generation — architecture stub (not implemented)."""

from __future__ import annotations

from typing import Any

AVATAR_TYPE = "DIGITAL_TWIN_3D"
NOT_IMPLEMENTED_MESSAGE = (
    "3D Digital Twin generation is not available yet. "
    "Pipeline reserved for future mesh export (GLB/USDZ)."
)


def generate_digital_twin_3d(
    *,
    face_traits: dict | None,
    body_traits: dict | None,
    profile: dict | None,
) -> dict[str, Any]:
    """
    Future implementation will:
    - build a rigged 3D mesh from face/body biometric traits
    - export GLB/USDZ assets for wardrobe fitting and AR try-on
    - return mesh URL + rig metadata instead of a 2D PNG
    """
    raise NotImplementedError(NOT_IMPLEMENTED_MESSAGE)
