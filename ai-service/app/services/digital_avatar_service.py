"""Procedural digital avatar rendering from face and body analysis traits."""

from __future__ import annotations

import base64
import io
import logging
from typing import Any

from PIL import Image, ImageDraw

logger = logging.getLogger(__name__)

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
}

OUTFIT_BY_TYPE = {
    "BASIC": ((71, 85, 105), (55, 65, 81)),
    "STYLIZED": ((124, 58, 237), (76, 29, 149)),
    "FASHION": ((30, 41, 59), (15, 23, 42)),
    "FITTING": ((59, 130, 246), (37, 99, 235)),
}


def _normalize(value: Any, default: str = "") -> str:
    return str(value or default).strip().lower().replace(" ", "_")


def _skin_color(face_traits: dict, profile: dict) -> tuple[int, int, int]:
    tone = _normalize(
        face_traits.get("skin_tone")
        or face_traits.get("skinTone")
        or profile.get("skin_tone")
        or profile.get("skinTone"),
        "medium",
    )
    return SKIN_TONE_COLORS.get(tone, SKIN_TONE_COLORS["medium"])


def _hair_color(face_traits: dict) -> tuple[int, int, int]:
    color = _normalize(face_traits.get("hair_color") or face_traits.get("hairColor"), "brown")
    return HAIR_COLORS.get(color, HAIR_COLORS["brown"])


def _shape_widths(body_traits: dict) -> tuple[float, float, float]:
    widths = body_traits.get("bodyShapeWidths") or body_traits.get("body_shape_widths") or {}
    shoulder = float(widths.get("shoulder") or body_traits.get("shoulder_width") or 42)
    waist = float(widths.get("waist") or body_traits.get("waist") or 34)
    hip = float(widths.get("hip") or body_traits.get("hip") or 40)

    shape = _normalize(body_traits.get("body_shape") or body_traits.get("bodyShape"))

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


def _height_scale(body_traits: dict, profile: dict) -> float:
    height = (
        body_traits.get("height")
        or profile.get("height")
        or 170
    )
    try:
        height_value = float(height)
    except (TypeError, ValueError):
        height_value = 170.0

    return max(0.85, min(1.15, height_value / 170.0))


def _render_avatar(
    face_traits: dict,
    body_traits: dict,
    profile: dict,
    avatar_type: str,
) -> Image.Image:
    width, height = 480, 720
    image = Image.new("RGBA", (width, height), (11, 12, 20, 255))
    draw = ImageDraw.Draw(image)

    center_x = width // 2
    scale = _height_scale(body_traits, profile)
    shoulder_w, waist_w, hip_w = _shape_widths(body_traits)
    unit = 2.6 * scale

    shoulder_px = shoulder_w * unit
    waist_px = waist_w * unit
    hip_px = hip_w * unit

    skin = _skin_color(face_traits, profile)
    hair = _hair_color(face_traits)
    top_color, bottom_color = OUTFIT_BY_TYPE.get(
        avatar_type.upper(),
        OUTFIT_BY_TYPE["STYLIZED"],
    )

    head_radius = int(42 * scale)
    head_y = int(110 * scale)
    draw.ellipse(
        [
            center_x - head_radius,
            head_y - head_radius,
            center_x + head_radius,
            head_y + head_radius,
        ],
        fill=skin + (255,),
    )

    hair_top = head_y - head_radius - int(8 * scale)
    draw.ellipse(
        [
            center_x - head_radius - 4,
            hair_top,
            center_x + head_radius + 4,
            head_y + int(head_radius * 0.35),
        ],
        fill=hair + (255,),
    )

    neck_top = head_y + head_radius - 6
    neck_bottom = neck_top + int(24 * scale)
    draw.rectangle(
        [center_x - int(14 * scale), neck_top, center_x + int(14 * scale), neck_bottom],
        fill=skin + (255,),
    )

    torso_top = neck_bottom
    torso_mid = torso_top + int(120 * scale)
    torso_bottom = torso_top + int(210 * scale)

    torso_polygon = [
        (center_x - shoulder_px / 2, torso_top),
        (center_x + shoulder_px / 2, torso_top),
        (center_x + waist_px / 2, torso_mid),
        (center_x + hip_px / 2, torso_bottom),
        (center_x - hip_px / 2, torso_bottom),
        (center_x - waist_px / 2, torso_mid),
    ]
    draw.polygon(torso_polygon, fill=top_color + (255,))

    leg_top = torso_bottom
    leg_bottom = int(height - 70 * scale)
    leg_width = int(hip_px * 0.22)
    gap = int(18 * scale)

    draw.rounded_rectangle(
        [center_x - gap - leg_width, leg_top, center_x - gap, leg_bottom],
        radius=16,
        fill=bottom_color + (255,),
    )
    draw.rounded_rectangle(
        [center_x + gap, leg_top, center_x + gap + leg_width, leg_bottom],
        radius=16,
        fill=bottom_color + (255,),
    )

    arm_length = int(88 * scale)
    arm_width = int(16 * scale)
    draw.rounded_rectangle(
        [
            center_x - shoulder_px / 2 - arm_width,
            torso_top + int(12 * scale),
            center_x - shoulder_px / 2,
            torso_top + arm_length,
        ],
        radius=10,
        fill=skin + (255,),
    )
    draw.rounded_rectangle(
        [
            center_x + shoulder_px / 2,
            torso_top + int(12 * scale),
            center_x + shoulder_px / 2 + arm_width,
            torso_top + arm_length,
        ],
        radius=10,
        fill=skin + (255,),
    )

    glow = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    glow_draw = ImageDraw.Draw(glow)
    glow_draw.ellipse(
        [center_x - 120, height - 180, center_x + 120, height - 20],
        fill=(139, 92, 246, 55),
    )
    image = Image.alpha_composite(image, glow)

    return image.convert("RGB")


def generate_digital_avatar(
    *,
    avatar_type: str,
    face_traits: dict | None,
    body_traits: dict | None,
    profile: dict | None,
) -> dict[str, Any]:
    face = face_traits or {}
    body = body_traits or {}
    user_profile = profile or {}

    if not face and not body and not user_profile:
        raise ValueError("insufficient_traits")

    image = _render_avatar(face, body, user_profile, avatar_type)
    buffer = io.BytesIO()
    image.save(buffer, format="PNG")
    encoded = base64.b64encode(buffer.getvalue()).decode("ascii")

    metadata = {
        "bodyType": body.get("body_type") or body.get("bodyType"),
        "bodyShape": body.get("body_shape") or body.get("bodyShape"),
        "faceShape": face.get("face_shape") or face.get("faceShape"),
        "skinTone": face.get("skin_tone") or face.get("skinTone") or user_profile.get("skin_tone"),
        "gender": user_profile.get("gender"),
        "renderer": "procedural_trait_avatar_v1",
    }

    logger.info(
        "Digital avatar rendered type=%s body=%s shape=%s",
        avatar_type,
        metadata.get("bodyType"),
        metadata.get("bodyShape"),
    )

    return {
        "avatarType": avatar_type.upper(),
        "avatarImage": f"data:image/png;base64,{encoded}",
        "metadata": metadata,
    }
