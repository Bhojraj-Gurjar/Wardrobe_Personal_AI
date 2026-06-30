#!/usr/bin/env python3
"""
Remove uniform studio background from flat-lay garment product shots.
Preserves the original file; writes a transparent PNG for CatVTON try-on.
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

import cv2
import numpy as np
from PIL import Image


def _sample_background_color(image_bgr: np.ndarray) -> np.ndarray:
    height, width = image_bgr.shape[:2]
    corners = [
        image_bgr[0:8, 0:8],
        image_bgr[0:8, width - 8 : width],
        image_bgr[height - 8 : height, 0:8],
        image_bgr[height - 8 : height, width - 8 : width],
    ]
    samples = np.concatenate([corner.reshape(-1, 3) for corner in corners], axis=0)
    return np.median(samples, axis=0)


def _color_distance_mask(image_bgr: np.ndarray, bg_color: np.ndarray, tolerance: float) -> np.ndarray:
    diff = np.linalg.norm(image_bgr.astype(np.float32) - bg_color.astype(np.float32), axis=2)
    return (diff > tolerance).astype(np.uint8) * 255


def _grabcut_mask(image_bgr: np.ndarray) -> np.ndarray:
    height, width = image_bgr.shape[:2]
    mask = np.zeros((height, width), np.uint8)
    rect = (
        int(width * 0.08),
        int(height * 0.04),
        int(width * 0.84),
        int(height * 0.92),
    )
    bgd_model = np.zeros((1, 65), np.float64)
    fgd_model = np.zeros((1, 65), np.float64)
    cv2.grabCut(image_bgr, mask, rect, bgd_model, fgd_model, 5, cv2.GC_INIT_WITH_RECT)
    return np.where((mask == 2) | (mask == 0), 0, 255).astype(np.uint8)


def _refine_mask(mask: np.ndarray) -> np.ndarray:
    kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5))
    refined = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, kernel, iterations=2)
    refined = cv2.morphologyEx(refined, cv2.MORPH_OPEN, kernel, iterations=1)
    refined = cv2.GaussianBlur(refined, (5, 5), 0)
    return refined


def remove_garment_background(input_path: Path, output_path: Path) -> Path:
    if not input_path.exists():
        raise FileNotFoundError(f"Input image not found: {input_path}")

    image_bgr = cv2.imread(str(input_path), cv2.IMREAD_COLOR)
    if image_bgr is None:
        raise ValueError(f"Could not decode image: {input_path}")

    bg_color = _sample_background_color(image_bgr)
    color_mask = _color_distance_mask(image_bgr, bg_color, tolerance=28.0)
    grabcut_mask = _grabcut_mask(image_bgr)
    combined = cv2.bitwise_and(color_mask, grabcut_mask)
    mask = _refine_mask(combined)

    rgba = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2RGBA)
    rgba[:, :, 3] = mask

    output_path.parent.mkdir(parents=True, exist_ok=True)
    Image.fromarray(rgba).save(output_path, format="PNG", optimize=True)
    return output_path


def main() -> int:
    parser = argparse.ArgumentParser(description="Remove background from flat-lay garment image")
    parser.add_argument("--input", required=True, help="Source product image path")
    parser.add_argument("--output", required=True, help="Destination transparent PNG path")
    args = parser.parse_args()

    try:
        result = remove_garment_background(Path(args.input), Path(args.output))
        print(str(result))
        return 0
    except Exception as exc:
        print(f"ERROR: {exc}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
