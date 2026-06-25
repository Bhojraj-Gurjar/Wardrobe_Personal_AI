#!/usr/bin/env python3
"""
Remove background from a body photo and save a transparent PNG.

Usage:
  python remove_background.py --input /path/to/body.jpg --output /path/to/user.png

Preserves body proportions, head, arms, and legs. Never modifies the source file.
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

import cv2
import numpy as np
from PIL import Image


def _mediapipe_segmentation(image_rgb: np.ndarray) -> np.ndarray | None:
    try:
        import mediapipe as mp
    except ImportError:
        return None

    with mp.solutions.selfie_segmentation.SelfieSegmentation(model_selection=1) as segmenter:
        results = segmenter.process(image_rgb)
        if results.segmentation_mask is None:
            return None
        mask = (results.segmentation_mask > 0.45).astype(np.uint8) * 255
        return mask


def _grabcut_fallback(image_bgr: np.ndarray) -> np.ndarray:
    height, width = image_bgr.shape[:2]
    mask = np.zeros((height, width), np.uint8)
    rect = (
        int(width * 0.12),
        int(height * 0.02),
        int(width * 0.76),
        int(height * 0.96),
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


def remove_background(input_path: Path, output_path: Path) -> Path:
    if not input_path.exists():
        raise FileNotFoundError(f"Input image not found: {input_path}")

    image_bgr = cv2.imread(str(input_path), cv2.IMREAD_COLOR)
    if image_bgr is None:
        raise ValueError(f"Could not decode image: {input_path}")

    image_rgb = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2RGB)
    mask = _mediapipe_segmentation(image_rgb)

    if mask is None:
        mask = _grabcut_fallback(image_bgr)

    mask = _refine_mask(mask)

    rgba = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2RGBA)
    rgba[:, :, 3] = mask

    output_path.parent.mkdir(parents=True, exist_ok=True)
    Image.fromarray(rgba).save(output_path, format="PNG", optimize=True)
    return output_path


def main() -> int:
    parser = argparse.ArgumentParser(description="Remove background from body photo")
    parser.add_argument("--input", required=True, help="Source JPG/PNG path")
    parser.add_argument("--output", required=True, help="Destination transparent PNG path")
    args = parser.parse_args()

    try:
        result = remove_background(Path(args.input), Path(args.output))
        print(str(result))
        return 0
    except Exception as exc:
        print(f"ERROR: {exc}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
