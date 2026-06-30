"""Photorealistic premium avatar generation from face and body analysis traits."""

from __future__ import annotations

import base64
import hashlib
import io
import json
import logging
from datetime import datetime, timezone
from typing import Any

import numpy as np
from PIL import Image, ImageDraw, ImageEnhance, ImageFilter

from app.services.avatar_trait_utils import (
    age_face_scale,
    gender_scale,
    hair_color,
    height_scale,
    lighten_color,
    pick,
    shade_color,
    shape_widths,
    skin_color,
)

logger = logging.getLogger(__name__)

AVATAR_TYPE = "PREMIUM"


def _studio_background(width: int, height: int) -> Image.Image:
    gradient = np.zeros((height, width, 3), dtype=np.uint8)
    top = np.array([32, 36, 48], dtype=np.float32)
    bottom = np.array([18, 20, 28], dtype=np.float32)

    for y in range(height):
        blend = y / max(height - 1, 1)
        gradient[y, :] = (top * (1 - blend) + bottom * blend).astype(np.uint8)

    return Image.fromarray(gradient, mode="RGB")


def _radial_light(
    draw: ImageDraw.ImageDraw,
    center: tuple[int, int],
    radius: int,
    color: tuple[int, int, int],
    alpha: int,
) -> None:
    draw.ellipse(
        [
            center[0] - radius,
            center[1] - radius,
            center[0] + radius,
            center[1] + radius,
        ],
        fill=color + (alpha,),
    )


def _draw_face(
    draw: ImageDraw.ImageDraw,
    *,
    center_x: int,
    head_y: int,
    head_radius: int,
    skin: tuple[int, int, int],
    face_traits: dict,
    scale: float,
) -> None:
    face_shape = pick(face_traits, "face_shape", "faceShape", default="oval")
    width_factor = 1.0
    height_factor = 1.0

    if face_shape in {"round", "oval"}:
        width_factor, height_factor = 1.0, 1.06
    elif face_shape in {"square", "rectangle"}:
        width_factor, height_factor = 1.05, 0.98
    elif face_shape in {"heart", "diamond"}:
        width_factor, height_factor = 0.96, 1.02

    rx = int(head_radius * width_factor)
    ry = int(head_radius * height_factor)

    shadow = shade_color(skin, 0.78)
    highlight = lighten_color(skin, 0.18)

    _radial_light(
        draw,
        (center_x + int(8 * scale), head_y + int(6 * scale)),
        int(head_radius * 1.1),
        shadow,
        70,
    )

    draw.ellipse(
        [center_x - rx, head_y - ry, center_x + rx, head_y + ry],
        fill=skin + (255,),
    )

    _radial_light(
        draw,
        (center_x - int(18 * scale), head_y - int(10 * scale)),
        int(head_radius * 0.45),
        highlight,
        55,
    )
    _radial_light(
        draw,
        (center_x + int(20 * scale), head_y + int(8 * scale)),
        int(head_radius * 0.35),
        highlight,
        40,
    )

    eye_y = head_y - int(6 * scale)
    eye_offset = int(22 * scale)
    eye_w = int(14 * scale)
    eye_h = int(9 * scale)

    for side in (-1, 1):
        ex = center_x + side * eye_offset
        draw.ellipse(
            [ex - eye_w, eye_y - eye_h, ex + eye_w, eye_y + eye_h],
            fill=(245, 245, 248, 255),
        )
        draw.ellipse(
            [ex - int(eye_w * 0.55), eye_y - int(eye_h * 0.55), ex + int(eye_w * 0.55), eye_y + int(eye_h * 0.55)],
            fill=(58, 42, 32, 255),
        )
        draw.ellipse(
            [ex - int(eye_w * 0.25), eye_y - int(eye_h * 0.35), ex + int(eye_w * 0.1), eye_y + int(eye_h * 0.1)],
            fill=(12, 12, 16, 255),
        )
        draw.ellipse(
            [ex - int(eye_w * 0.15), eye_y - int(eye_h * 0.45), ex - int(eye_w * 0.02), eye_y - int(eye_h * 0.2)],
            fill=(255, 255, 255, 180),
        )

    brow_y = eye_y - int(16 * scale)
    brow_color = shade_color(skin, 0.55)
    for side in (-1, 1):
        bx = center_x + side * eye_offset
        draw.arc(
            [bx - int(18 * scale), brow_y - int(6 * scale), bx + int(18 * scale), brow_y + int(10 * scale)],
            start=190 if side < 0 else 350,
            end=350 if side < 0 else 190,
            fill=brow_color + (255,),
            width=max(2, int(3 * scale)),
        )

    nose_shadow = shade_color(skin, 0.82)
    draw.polygon(
        [
            (center_x, head_y + int(4 * scale)),
            (center_x - int(8 * scale), head_y + int(28 * scale)),
            (center_x + int(8 * scale), head_y + int(28 * scale)),
        ],
        fill=nose_shadow + (120,),
    )

    lip_color = shade_color(skin, 0.72)
    lip_y = head_y + int(36 * scale)
    draw.ellipse(
        [center_x - int(20 * scale), lip_y - int(6 * scale), center_x + int(20 * scale), lip_y + int(10 * scale)],
        fill=lip_color + (220,),
    )
    draw.line(
        [center_x - int(18 * scale), lip_y, center_x + int(18 * scale), lip_y],
        fill=shade_color(lip_color, 0.85) + (255,),
        width=max(1, int(2 * scale)),
    )


def _draw_premium_hair(
    image: Image.Image,
    *,
    center_x: int,
    head_y: int,
    head_radius: int,
    hair_rgb: tuple[int, int, int],
    face_traits: dict,
    scale: float,
) -> None:
    hair_layer = Image.new("RGBA", image.size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(hair_layer)

    hair_length = pick(face_traits, "hair_length", "hairLength", default="medium")
    hair_style = pick(face_traits, "hair_style", "hairStyle", default="straight")

    if hair_length in {"bald", "shaved", "none"}:
        return

    highlight = lighten_color(hair_rgb, 0.22)
    shadow = shade_color(hair_rgb, 0.72)
    top = head_y - head_radius - int(14 * scale)

    if hair_style in {"curly", "wavy"}:
        for i, offset in enumerate(range(-int(28 * scale), int(30 * scale), int(14 * scale))):
            tone = highlight if i % 2 == 0 else hair_rgb
            draw.ellipse(
                [
                    center_x - head_radius - int(10 * scale) + offset,
                    top + int(i * 3 * scale),
                    center_x + head_radius + int(10 * scale) + offset,
                    head_y + int(head_radius * 0.35),
                ],
                fill=tone + (255,),
            )
    else:
        draw.ellipse(
            [
                center_x - head_radius - int(12 * scale),
                top,
                center_x + head_radius + int(12 * scale),
                head_y + int(head_radius * 0.3),
            ],
            fill=hair_rgb + (255,),
        )
        draw.arc(
            [
                center_x - head_radius - int(8 * scale),
                top + int(4 * scale),
                center_x + head_radius + int(8 * scale),
                head_y + int(head_radius * 0.2),
            ],
            start=200,
            end=340,
            fill=highlight + (180,),
            width=max(2, int(4 * scale)),
        )

    if hair_length in {"long", "very_long"}:
        for side in (-1, 1):
            draw.rounded_rectangle(
                [
                    center_x + side * int(head_radius * 0.75),
                    head_y - int(head_radius * 0.15),
                    center_x + side * int(head_radius * 1.05),
                    head_y + int(head_radius * 1.75),
                ],
                radius=12,
                fill=shadow + (255,),
            )

    image.alpha_composite(hair_layer)


def _draw_beard(
    draw: ImageDraw.ImageDraw,
    *,
    center_x: int,
    head_y: int,
    head_radius: int,
    skin: tuple[int, int, int],
    hair_rgb: tuple[int, int, int],
    face_traits: dict,
    scale: float,
) -> None:
    beard_type = pick(face_traits, "beard_type", "beardType", default="none")

    if beard_type in {"none", "clean_shaven", "clean", "shaved"}:
        return

    beard_color = shade_color(hair_rgb, 0.88)
    jaw_y = head_y + int(head_radius * 0.55)

    if beard_type in {"stubble", "light_stubble"}:
        for i in range(80):
            x = center_x + int((i % 10 - 5) * 5 * scale)
            y = jaw_y + int((i // 10) * 4 * scale)
            draw.ellipse([x, y, x + 2, y + 2], fill=beard_color + (90,))
        return

    if beard_type in {"goatee", "van_dyke"}:
        draw.ellipse(
            [center_x - int(18 * scale), jaw_y, center_x + int(18 * scale), jaw_y + int(42 * scale)],
            fill=beard_color + (230,),
        )
        return

    # full, medium, heavy, etc.
    draw.ellipse(
        [
            center_x - int(head_radius * 0.85),
            jaw_y - int(8 * scale),
            center_x + int(head_radius * 0.85),
            jaw_y + int(head_radius * 0.75),
        ],
        fill=beard_color + (235,),
    )
    draw.ellipse(
        [
            center_x - int(head_radius * 0.55),
            jaw_y + int(8 * scale),
            center_x + int(head_radius * 0.55),
            jaw_y + int(head_radius * 0.95),
        ],
        fill=shade_color(beard_color, 0.9) + (220,),
    )


def _render_premium_avatar(
    face_traits: dict,
    body_traits: dict,
    profile: dict,
) -> Image.Image:
    width, height = 640, 960
    image = _studio_background(width, height).convert("RGBA")
    draw = ImageDraw.Draw(image)

    center_x = width // 2
    scale = height_scale(body_traits, profile) * age_face_scale(profile)
    shoulder_w, waist_w, hip_w = shape_widths(body_traits, profile)
    unit = 2.45 * scale

    shoulder_px = shoulder_w * unit
    waist_px = waist_w * unit
    hip_px = hip_w * unit

    skin = skin_color(face_traits, profile)
    hair_rgb = hair_color(face_traits)

    head_radius = int(52 * scale)
    head_y = int(148 * scale)

    _draw_premium_hair(
        image,
        center_x=center_x,
        head_y=head_y,
        head_radius=head_radius,
        hair_rgb=hair_rgb,
        face_traits=face_traits,
        scale=scale,
    )

    draw = ImageDraw.Draw(image)
    _draw_face(
        draw,
        center_x=center_x,
        head_y=head_y,
        head_radius=head_radius,
        skin=skin,
        face_traits=face_traits,
        scale=scale,
    )
    _draw_beard(
        draw,
        center_x=center_x,
        head_y=head_y,
        head_radius=head_radius,
        skin=skin,
        hair_rgb=hair_rgb,
        face_traits=face_traits,
        scale=scale,
    )

    neck_top = head_y + head_radius - int(8 * scale)
    neck_bottom = neck_top + int(30 * scale)
    draw.rounded_rectangle(
        [center_x - int(16 * scale), neck_top, center_x + int(16 * scale), neck_bottom],
        radius=8,
        fill=skin + (255,),
    )

    torso_top = neck_bottom
    torso_mid = torso_top + int(130 * scale)
    torso_bottom = torso_top + int(230 * scale)

    outfit_top = (42, 52, 72)
    outfit_bottom = (28, 34, 48)

    torso_polygon = [
        (center_x - shoulder_px / 2, torso_top),
        (center_x + shoulder_px / 2, torso_top),
        (center_x + waist_px / 2, torso_mid),
        (center_x + hip_px / 2, torso_bottom),
        (center_x - hip_px / 2, torso_bottom),
        (center_x - waist_px / 2, torso_mid),
    ]
    draw.polygon(torso_polygon, fill=outfit_top + (255,))

    leg_top = torso_bottom
    leg_bottom = int(height - 90 * scale)
    leg_width = int(hip_px * 0.22)
    gap = int(18 * scale)

    draw.rounded_rectangle(
        [center_x - gap - leg_width, leg_top, center_x - gap, leg_bottom],
        radius=18,
        fill=outfit_bottom + (255,),
    )
    draw.rounded_rectangle(
        [center_x + gap, leg_top, center_x + gap + leg_width, leg_bottom],
        radius=18,
        fill=outfit_bottom + (255,),
    )

    arm_length = int(96 * scale)
    arm_width = int(17 * scale)
    for side in (-1, 1):
        draw.rounded_rectangle(
            [
                center_x + side * shoulder_px / 2 - (arm_width if side > 0 else 0),
                torso_top + int(14 * scale),
                center_x + side * (shoulder_px / 2 + arm_width),
                torso_top + arm_length,
            ],
            radius=12,
            fill=skin + (255,),
        )

    vignette = Image.new("RGBA", image.size, (0, 0, 0, 0))
    vignette_draw = ImageDraw.Draw(vignette)
    vignette_draw.ellipse(
        [center_x - 220, 40, center_x + 220, height - 40],
        fill=(0, 0, 0, 35),
    )
    image = Image.alpha_composite(image, vignette)

    rgb = image.convert("RGB")
    rgb = ImageEnhance.Contrast(rgb).enhance(1.08)
    rgb = ImageEnhance.Sharpness(rgb).enhance(1.15)
    rgb = rgb.filter(ImageFilter.GaussianBlur(radius=0.4))
    return rgb


def _trait_fingerprint(
    face_traits: dict,
    body_traits: dict,
    profile: dict,
) -> str:
    payload = {
        "face": {
            "faceShape": face_traits.get("face_shape") or face_traits.get("faceShape"),
            "skinTone": face_traits.get("skin_tone") or face_traits.get("skinTone"),
            "hairLength": face_traits.get("hair_length") or face_traits.get("hairLength"),
            "hairColor": face_traits.get("hair_color") or face_traits.get("hairColor"),
            "hairStyle": face_traits.get("hair_style") or face_traits.get("hairStyle"),
            "beardType": face_traits.get("beard_type") or face_traits.get("beardType"),
        },
        "body": {
            "bodyType": body_traits.get("body_type") or body_traits.get("bodyType"),
            "bodyShape": body_traits.get("body_shape") or body_traits.get("bodyShape"),
        },
        "profile": {
            "gender": profile.get("gender"),
            "age": profile.get("age"),
        },
    }
    digest = hashlib.sha256(
        json.dumps(payload, sort_keys=True, default=str).encode("utf-8"),
    ).hexdigest()
    return digest[:16]


def _build_metadata(
    face_traits: dict,
    body_traits: dict,
    profile: dict,
) -> dict[str, Any]:
    skin_tone = (
        face_traits.get("skin_tone")
        or face_traits.get("skinTone")
        or profile.get("skin_tone")
        or profile.get("skinTone")
    )

    hair_analysis = {
        "hairLength": face_traits.get("hair_length") or face_traits.get("hairLength"),
        "hairColor": face_traits.get("hair_color") or face_traits.get("hairColor"),
        "hairStyle": face_traits.get("hair_style") or face_traits.get("hairStyle"),
    }

    beard_analysis = {
        "beardType": face_traits.get("beard_type") or face_traits.get("beardType"),
    }

    face_analysis = {
        "faceShape": face_traits.get("face_shape") or face_traits.get("faceShape"),
        "skinTone": skin_tone,
    }

    body_analysis = {
        "bodyType": body_traits.get("body_type") or body_traits.get("bodyType"),
        "bodyShape": body_traits.get("body_shape") or body_traits.get("bodyShape"),
        "measurements": body_traits.get("measurements"),
        "bodyShapeWidths": body_traits.get("bodyShapeWidths") or body_traits.get("body_shape_widths"),
    }

    return {
        "avatarType": AVATAR_TYPE,
        "skinTone": skin_tone,
        "faceAnalysis": face_analysis,
        "bodyAnalysis": body_analysis,
        "hairAnalysis": hair_analysis,
        "beardAnalysis": beard_analysis,
        "traitFingerprint": _trait_fingerprint(face_traits, body_traits, profile),
        "renderer": "premium_photorealistic_v1",
        "quality": "photorealistic",
        "generatedAt": datetime.now(timezone.utc).isoformat(),
    }


def generate_premium_avatar(
    *,
    face_traits: dict | None,
    body_traits: dict | None,
    profile: dict | None,
) -> dict[str, Any]:
    face = face_traits or {}
    body = body_traits or {}
    user_profile = profile or {}

    skin_tone = (
        face.get("skin_tone")
        or face.get("skinTone")
        or user_profile.get("skin_tone")
        or user_profile.get("skinTone")
    )
    has_face = bool(face.get("face_shape") or face.get("faceShape"))
    has_body = bool(
        body.get("body_type")
        or body.get("bodyType")
        or body.get("body_shape")
        or body.get("bodyShape")
        or body.get("measurements")
    )
    has_hair = bool(
        face.get("hair_color")
        or face.get("hairColor")
        or face.get("hair_style")
        or face.get("hairStyle")
        or face.get("hair_length")
        or face.get("hairLength")
    )
    has_beard = (
        face.get("beard_type") is not None
        or face.get("beardType") is not None
    )

    if not (has_face and has_body and skin_tone and has_hair and has_beard):
        raise ValueError("insufficient_premium_traits")

    image = _render_premium_avatar(face, body, user_profile)
    buffer = io.BytesIO()
    image.save(buffer, format="PNG", optimize=True)
    encoded = base64.b64encode(buffer.getvalue()).decode("ascii")
    metadata = _build_metadata(face, body, user_profile)

    logger.info(
        "Premium avatar rendered face=%s body=%s skin=%s",
        metadata["faceAnalysis"].get("faceShape"),
        metadata["bodyAnalysis"].get("bodyType"),
        metadata.get("skinTone"),
    )

    return {
        "avatarType": AVATAR_TYPE,
        "avatarImage": f"data:image/png;base64,{encoded}",
        "metadata": metadata,
    }
