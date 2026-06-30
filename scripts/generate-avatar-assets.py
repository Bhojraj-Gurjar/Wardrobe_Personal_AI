#!/usr/bin/env python3
"""Generate transparent PNG avatar base silhouettes and clothing overlay placeholders."""

from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1] / "frontend" / "public" / "avatar"
SIZE = (280, 520)

OVERLAY_CATEGORIES = {
    "tshirts": "draw_tshirt",
    "shirts": "draw_shirt",
    "jackets": "draw_jacket",
    "pants": "draw_pants",
    "shoes": "draw_shoes",
}


def save_transparent_png(path: Path, draw_fn) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    image = Image.new("RGBA", SIZE, (0, 0, 0, 0))
    draw = ImageDraw.Draw(image)
    draw_fn(draw, SIZE[0], SIZE[1])
    image.save(path, "PNG")


def draw_dashed_polygon(draw, points, outline, width=2, dash=6, gap=4):
    for index in range(len(points)):
        start = points[index]
        end = points[(index + 1) % len(points)]
        length = ((end[0] - start[0]) ** 2 + (end[1] - start[1]) ** 2) ** 0.5
        if length == 0:
            continue
        steps = max(1, int(length / (dash + gap)))
        for step in range(steps):
            t0 = step / steps
            t1 = min(1.0, (step + dash / (dash + gap)) / steps)
            x0 = start[0] + (end[0] - start[0]) * t0
            y0 = start[1] + (end[1] - start[1]) * t0
            x1 = start[0] + (end[0] - start[0]) * t1
            y1 = start[1] + (end[1] - start[1]) * t1
            draw.line((x0, y0, x1, y1), fill=outline, width=width)


def draw_base_silhouette(draw, width, height, scale_x=1.0, scale_y=1.0):
    cx = width // 2
    head_y = int(height * 0.14)
    head_rx = int(42 * scale_x)
    head_ry = int(50 * scale_y)
    draw.ellipse(
        (cx - head_rx, head_y - head_ry, cx + head_rx, head_y + head_ry),
        fill=(210, 175, 145, 235),
    )
    torso_top = head_y + head_ry + 8
    torso_bottom = int(height * 0.58)
    shoulder = int(58 * scale_x)
    draw.polygon(
        [
            (cx - shoulder, torso_top),
            (cx + shoulder, torso_top),
            (cx + int(48 * scale_x), torso_bottom),
            (cx - int(48 * scale_x), torso_bottom),
        ],
        fill=(55, 65, 81, 230),
    )
    leg_top = torso_bottom
    leg_bottom = int(height * 0.92)
    leg_w = int(34 * scale_x)
    draw.rectangle((cx - leg_w - 8, leg_top, cx - 8, leg_bottom), fill=(30, 58, 95, 230))
    draw.rectangle((cx + 8, leg_top, cx + leg_w + 8, leg_bottom), fill=(30, 58, 95, 230))
    foot_y = leg_bottom
    draw.ellipse((cx - leg_w - 14, foot_y - 8, cx - 2, foot_y + 18), fill=(245, 246, 248, 235))
    draw.ellipse((cx + 2, foot_y - 8, cx + leg_w + 14, foot_y + 18), fill=(245, 246, 248, 235))


def draw_tshirt(draw, width, height):
    cx = width // 2
    top = int(height * 0.24)
    bottom = int(height * 0.46)
    points = [
        (cx - 70, top + 18),
        (cx - 34, top),
        (cx + 34, top),
        (cx + 70, top + 18),
        (cx + 54, bottom),
        (cx - 54, bottom),
    ]
    draw.polygon(points, fill=(139, 92, 246, 210))
    draw_dashed_polygon(draw, points, outline=(196, 181, 253, 230))


def draw_shirt(draw, width, height):
    cx = width // 2
    top = int(height * 0.24)
    bottom = int(height * 0.48)
    points = [
        (cx - 72, top + 20),
        (cx - 30, top),
        (cx + 30, top),
        (cx + 72, top + 20),
        (cx + 56, bottom),
        (cx - 56, bottom),
    ]
    draw.polygon(points, fill=(219, 234, 254, 215))
    draw_dashed_polygon(draw, points, outline=(147, 197, 253, 230))
    for x in range(cx - 8, cx + 9, 4):
        draw.line((x, top + 8, x, bottom - 8), fill=(191, 219, 254, 220), width=2)


def draw_jacket(draw, width, height):
    cx = width // 2
    top = int(height * 0.22)
    bottom = int(height * 0.52)
    points = [
        (cx - 78, top + 24),
        (cx - 36, top),
        (cx + 36, top),
        (cx + 78, top + 24),
        (cx + 62, bottom),
        (cx - 62, bottom),
    ]
    draw.polygon(points, fill=(31, 41, 55, 220))
    draw_dashed_polygon(draw, points, outline=(156, 163, 175, 230))
    draw.line((cx, top + 6, cx, bottom - 6), fill=(75, 85, 99, 230), width=3)


def draw_pants(draw, width, height):
    cx = width // 2
    top = int(height * 0.46)
    bottom = int(height * 0.9)
    points = [
        (cx - 50, top),
        (cx + 50, top),
        (cx + 38, bottom),
        (cx + 8, bottom),
        (cx, top + 70),
        (cx - 8, bottom),
        (cx - 38, bottom),
    ]
    draw.polygon(points, fill=(30, 58, 95, 220))
    draw_dashed_polygon(draw, points, outline=(59, 130, 246, 220))


def draw_shoes(draw, width, height):
    cx = width // 2
    y = int(height * 0.88)
    for offset in (-56, 56):
        box = (cx + offset - 56, y, cx + offset + 56, y + 28)
        draw.ellipse(box, fill=(249, 250, 251, 230), outline=(209, 213, 219, 230), width=2)


def write_overlay_placeholders() -> None:
    drawers = {
        "tshirts": draw_tshirt,
        "shirts": draw_shirt,
        "jackets": draw_jacket,
        "pants": draw_pants,
        "shoes": draw_shoes,
    }

    for folder, drawer in drawers.items():
        target_dir = ROOT / folder
        placeholder_png = target_dir / "placeholder.png"
        default_png = target_dir / "default.png"
        save_transparent_png(placeholder_png, drawer)
        save_transparent_png(default_png, drawer)


def main() -> None:
    bases = {
        "slim": (0.88, 1.02),
        "athletic": (1.0, 1.0),
        "average": (0.96, 1.0),
        "muscular": (1.12, 1.02),
        "plus-size": (1.18, 1.04),
    }

    for name, scales in bases.items():
        sx, sy = scales
        save_transparent_png(
            ROOT / "base" / f"{name}.png",
            lambda draw, w, h, sx=sx, sy=sy: draw_base_silhouette(draw, w, h, sx, sy),
        )

    write_overlay_placeholders()
    print(f"Avatar assets written under {ROOT}")


if __name__ == "__main__":
    main()
