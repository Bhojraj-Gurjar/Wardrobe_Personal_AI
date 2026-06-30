"""Basic 2D avatar generation from profile, face, and body traits."""

from __future__ import annotations

import base64
import io
import logging
from datetime import datetime, timezone
from typing import Any

from PIL import Image, ImageDraw

logger = logging.getLogger(__name__)

AVATAR_TYPE = "BASIC"

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


def _normalize(value: Any, default: str = "") -> str:
    return str(value or default).strip().lower().replace(" ", "_").replace("-", "_")


def _pick(dictionary: dict, *keys: str, default: str = "") -> str:
    for key in keys:
        value = dictionary.get(key)
        if value not in (None, ""):
            return _normalize(value, default)
    return default


def _skin_color(face_traits: dict, profile: dict) -> tuple[int, int, int]:
    tone = _pick(
        {**profile, **face_traits},
        "skin_tone",
        "skinTone",
        default="medium",
    )
    return SKIN_TONE_COLORS.get(tone, SKIN_TONE_COLORS["medium"])


def _hair_color(face_traits: dict) -> tuple[int, int, int]:
    color = _pick(face_traits, "hair_color", "hairColor", default="brown")
    return HAIR_COLORS.get(color, HAIR_COLORS["brown"])


def _gender_scale(profile: dict) -> float:
    gender = _pick(profile, "gender", default="")
    return GENDER_SHOULDER_SCALE.get(gender, 1.0)


def _age_face_scale(profile: dict) -> float:
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


def _body_type_scale(body_traits: dict, profile: dict) -> tuple[float, float]:
    body_type = _pick(
        {**profile, **body_traits},
        "body_type",
        "bodyType",
        default="average",
    )
    return BODY_TYPE_SCALE.get(body_type, BODY_TYPE_SCALE["average"])


def _shape_widths(body_traits: dict, profile: dict) -> tuple[float, float, float]:
    widths = body_traits.get("bodyShapeWidths") or body_traits.get("body_shape_widths") or {}
    shoulder = float(widths.get("shoulder") or body_traits.get("shoulder_width") or 42)
    waist = float(widths.get("waist") or body_traits.get("waist") or 34)
    hip = float(widths.get("hip") or body_traits.get("hip") or 40)

    shoulder_scale, waist_hip_scale = _body_type_scale(body_traits, profile)
    shoulder *= shoulder_scale * _gender_scale(profile)
    waist *= waist_hip_scale
    hip *= waist_hip_scale

    shape = _pick(body_traits, "body_shape", "bodyShape")
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
    height = body_traits.get("height") or profile.get("height") or 170
    try:
        height_value = float(height)
    except (TypeError, ValueError):
        height_value = 170.0
    return max(0.85, min(1.15, height_value / 170.0))


def _face_shape_radius(face_traits: dict, base_radius: int) -> tuple[int, int]:
    shape = _pick(face_traits, "face_shape", "faceShape")
    if shape in {"round", "oval"}:
        return base_radius, int(base_radius * 1.05)
    if shape in {"square", "rectangle"}:
        return int(base_radius * 1.05), int(base_radius * 0.98)
    if shape in {"heart", "diamond"}:
        return int(base_radius * 0.96), int(base_radius * 1.02)
    return base_radius, base_radius


def _draw_hair(
    draw: ImageDraw.ImageDraw,
    *,
    center_x: int,
    head_y: int,
    head_radius: int,
    hair_color: tuple[int, int, int],
    face_traits: dict,
    scale: float,
) -> None:
    hair_length = _pick(face_traits, "hair_length", "hairLength", default="medium")
    hair_style = _pick(face_traits, "hair_style", "hairStyle", default="straight")

    if hair_length in {"bald", "shaved", "none"}:
        return

    hair_rgb = hair_color + (255,)
    top = head_y - head_radius - int(10 * scale)
    side_extension = int(12 * scale)

    if hair_style in {"curly", "wavy"}:
        for offset in (-int(18 * scale), 0, int(18 * scale)):
            draw.ellipse(
                [
                    center_x - head_radius - side_extension + offset,
                    top,
                    center_x + head_radius + side_extension + offset,
                    head_y + int(head_radius * 0.4),
                ],
                fill=hair_rgb,
            )
    else:
        draw.ellipse(
            [
                center_x - head_radius - side_extension,
                top,
                center_x + head_radius + side_extension,
                head_y + int(head_radius * 0.35),
            ],
            fill=hair_rgb,
        )

    if hair_length in {"long", "very_long"}:
        draw.rounded_rectangle(
            [
                center_x - head_radius - int(6 * scale),
                head_y - int(head_radius * 0.2),
                center_x - head_radius + int(10 * scale),
                head_y + int(head_radius * 1.6),
            ],
            radius=8,
            fill=hair_rgb,
        )
        draw.rounded_rectangle(
            [
                center_x + head_radius - int(10 * scale),
                head_y - int(head_radius * 0.2),
                center_x + head_radius + int(6 * scale),
                head_y + int(head_radius * 1.6),
            ],
            radius=8,
            fill=hair_rgb,
        )


def _render_basic_avatar(
    face_traits: dict,
    body_traits: dict,
    profile: dict,
) -> Image.Image:
    width, height = 480, 720
    image = Image.new("RGBA", (width, height), (248, 250, 252, 255))
    draw = ImageDraw.Draw(image)

    center_x = width // 2
    scale = _height_scale(body_traits, profile) * _age_face_scale(profile)
    shoulder_w, waist_w, hip_w = _shape_widths(body_traits, profile)
    unit = 2.5 * scale

    shoulder_px = shoulder_w * unit
    waist_px = waist_w * unit
    hip_px = hip_w * unit

    skin = _skin_color(face_traits, profile)
    hair = _hair_color(face_traits)
    top_color = (71, 85, 105)
    bottom_color = (55, 65, 81)

    head_radius = int(40 * scale)
    head_radius_x, head_radius_y = _face_shape_radius(face_traits, head_radius)
    head_y = int(118 * scale)

    _draw_hair(
        draw,
        center_x=center_x,
        head_y=head_y,
        head_radius=head_radius,
        hair_color=hair,
        face_traits=face_traits,
        scale=scale,
    )

    draw.ellipse(
        [
            center_x - head_radius_x,
            head_y - head_radius_y,
            center_x + head_radius_x,
            head_y + head_radius_y,
        ],
        fill=skin + (255,),
    )

    neck_top = head_y + head_radius_y - 6
    neck_bottom = neck_top + int(22 * scale)
    draw.rectangle(
        [center_x - int(13 * scale), neck_top, center_x + int(13 * scale), neck_bottom],
        fill=skin + (255,),
    )

    torso_top = neck_bottom
    torso_mid = torso_top + int(115 * scale)
    torso_bottom = torso_top + int(205 * scale)

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
    leg_bottom = int(height - 80 * scale)
    leg_width = int(hip_px * 0.21)
    gap = int(16 * scale)

    draw.rounded_rectangle(
        [center_x - gap - leg_width, leg_top, center_x - gap, leg_bottom],
        radius=14,
        fill=bottom_color + (255,),
    )
    draw.rounded_rectangle(
        [center_x + gap, leg_top, center_x + gap + leg_width, leg_bottom],
        radius=14,
        fill=bottom_color + (255,),
    )

    arm_length = int(84 * scale)
    arm_width = int(15 * scale)
    draw.rounded_rectangle(
        [
            center_x - shoulder_px / 2 - arm_width,
            torso_top + int(10 * scale),
            center_x - shoulder_px / 2,
            torso_top + arm_length,
        ],
        radius=10,
        fill=skin + (255,),
    )
    draw.rounded_rectangle(
        [
            center_x + shoulder_px / 2,
            torso_top + int(10 * scale),
            center_x + shoulder_px / 2 + arm_width,
            torso_top + arm_length,
        ],
        radius=10,
        fill=skin + (255,),
    )

    return image.convert("RGB")


def _build_metadata(
    face_traits: dict,
    body_traits: dict,
    profile: dict,
) -> dict[str, Any]:
    hair_analysis = {
        "hairLength": face_traits.get("hair_length") or face_traits.get("hairLength"),
        "hairColor": face_traits.get("hair_color") or face_traits.get("hairColor"),
        "hairStyle": face_traits.get("hair_style") or face_traits.get("hairStyle"),
        "beardType": face_traits.get("beard_type") or face_traits.get("beardType"),
    }

    face_analysis = {
        "faceShape": face_traits.get("face_shape") or face_traits.get("faceShape"),
        "skinTone": (
            face_traits.get("skin_tone")
            or face_traits.get("skinTone")
            or profile.get("skin_tone")
            or profile.get("skinTone")
        ),
    }

    return {
        "avatarType": AVATAR_TYPE,
        "gender": profile.get("gender"),
        "age": profile.get("age"),
        "bodyType": body_traits.get("body_type") or body_traits.get("bodyType") or profile.get("body_type"),
        "bodyShape": body_traits.get("body_shape") or body_traits.get("bodyShape"),
        "faceAnalysis": face_analysis,
        "hairAnalysis": hair_analysis,
        "skinTone": face_analysis["skinTone"],
        "renderer": "basic_avatar_v1",
        "generatedAt": datetime.now(timezone.utc).isoformat(),
    }


def generate_basic_avatar(
    *,
    face_traits: dict | None,
    body_traits: dict | None,
    profile: dict | None,
) -> dict[str, Any]:
    face = face_traits or {}
    body = body_traits or {}
    user_profile = profile or {}

    if not face and not body and not user_profile:
        raise ValueError("insufficient_traits")

    image = _render_basic_avatar(face, body, user_profile)
    buffer = io.BytesIO()
    image.save(buffer, format="PNG")
    encoded = base64.b64encode(buffer.getvalue()).decode("ascii")
    metadata = _build_metadata(face, body, user_profile)

    logger.info(
        "Basic avatar rendered gender=%s age=%s bodyType=%s",
        metadata.get("gender"),
        metadata.get("age"),
        metadata.get("bodyType"),
    )

    return {
        "avatarType": AVATAR_TYPE,
        "avatarImage": f"data:image/png;base64,{encoded}",
        "metadata": metadata,
    }
