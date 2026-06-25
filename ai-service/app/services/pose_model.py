"""Download and cache MoveNet ONNX pose model."""

from __future__ import annotations

import logging
from pathlib import Path
from urllib.request import urlretrieve

logger = logging.getLogger(__name__)

MODEL_DIR = Path(__file__).resolve().parents[2] / "models"

MOVENET_LIGHTNING_URL = (
    "https://huggingface.co/Xenova/movenet-singlepose-lightning/"
    "resolve/main/onnx/model.onnx"
)


def get_movenet_model() -> Path:
    MODEL_DIR.mkdir(parents=True, exist_ok=True)
    target = MODEL_DIR / "movenet_singlepose_lightning.onnx"

    if target.exists() and target.stat().st_size > 0:
        return target

    logger.info("Downloading MoveNet pose model")
    temp_path = target.with_suffix(target.suffix + ".download")
    urlretrieve(MOVENET_LIGHTNING_URL, temp_path)
    temp_path.replace(target)
    logger.info("MoveNet pose model ready: %s", target)
    return target
