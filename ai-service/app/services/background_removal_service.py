from __future__ import annotations

import logging
from pathlib import Path

import cv2
import numpy as np
from PIL import Image

logger = logging.getLogger(__name__)


def _mediapipe_mask(image_rgb: np.ndarray) -> np.ndarray | None:
    try:
        import mediapipe as mp
    except ImportError:
        return None

    with mp.solutions.selfie_segmentation.SelfieSegmentation(model_selection=1) as segmenter:
        results = segmenter.process(image_rgb)
        if results.segmentation_mask is None:
            return None
        return (results.segmentation_mask > 0.45).astype(np.uint8) * 255


def _grabcut_mask(image_bgr: np.ndarray) -> np.ndarray:
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
    return cv2.GaussianBlur(refined, (5, 5), 0)


def remove_background_to_png(input_path: Path, output_path: Path) -> Path:
    if not input_path.exists():
        raise FileNotFoundError(f"Input image not found: {input_path}")

    image_bgr = cv2.imread(str(input_path), cv2.IMREAD_COLOR)
    if image_bgr is None:
        raise ValueError(f"Could not decode image: {input_path}")

    image_rgb = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2RGB)
    mask = _mediapipe_mask(image_rgb) or _grabcut_mask(image_bgr)
    mask = _refine_mask(mask)

    rgba = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2RGBA)
    rgba[:, :, 3] = mask

    output_path.parent.mkdir(parents=True, exist_ok=True)
    Image.fromarray(rgba).save(output_path, format="PNG", optimize=True)
    logger.info("Saved transparent PNG to %s", output_path)
    return output_path
