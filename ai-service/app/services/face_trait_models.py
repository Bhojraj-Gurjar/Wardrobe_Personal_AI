"""Download and cache MediaPipe task models for face trait analysis."""

from __future__ import annotations

import logging
from pathlib import Path
from urllib.request import urlretrieve

logger = logging.getLogger(__name__)

MODEL_DIR = Path(__file__).resolve().parents[2] / "models"

FACE_LANDMARKER_URL = (
    "https://storage.googleapis.com/mediapipe-models/"
    "face_landmarker/face_landmarker/float16/1/face_landmarker.task"
)
HAIR_SEGMENTER_URL = (
    "https://storage.googleapis.com/mediapipe-models/"
    "image_segmenter/hair_segmenter/float32/latest/hair_segmenter.tflite"
)


def _ensure_model(url: str, filename: str) -> Path:
    MODEL_DIR.mkdir(parents=True, exist_ok=True)
    target = MODEL_DIR / filename

    if target.exists() and target.stat().st_size > 0:
        return target

    logger.info("Downloading MediaPipe model: %s", filename)
    temp_path = target.with_suffix(target.suffix + ".download")
    urlretrieve(url, temp_path)
    temp_path.replace(target)
    logger.info("MediaPipe model ready: %s", target)
    return target


def get_face_landmarker_model() -> Path:
    return _ensure_model(FACE_LANDMARKER_URL, "face_landmarker.task")


def get_hair_segmenter_model() -> Path:
    return _ensure_model(HAIR_SEGMENTER_URL, "hair_segmenter.tflite")
