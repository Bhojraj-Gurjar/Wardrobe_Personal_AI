"""Full-body pose landmarks via MoveNet ONNX with heuristic fallback."""

from __future__ import annotations

import logging
import threading
from typing import Any

import cv2
import numpy as np

from app.services.heuristic_pose_provider import detect_pose_landmarks_heuristic
from app.services.pose_landmarks import LandmarkPoint, PoseIndex
from app.services.pose_model import get_movenet_model

logger = logging.getLogger(__name__)

_INPUT_SIZE = 192
_MIN_KEYPOINT_SCORE = 0.20

_SESSION_LOCK = threading.Lock()
_SESSION: Any = None
_SESSION_FAILED = False


def _get_session():
    global _SESSION, _SESSION_FAILED

    if _SESSION_FAILED:
        return None

    if _SESSION is None:
        with _SESSION_LOCK:
            if _SESSION is None and not _SESSION_FAILED:
                try:
                    import onnxruntime as ort

                    model_path = str(get_movenet_model())
                    _SESSION = ort.InferenceSession(
                        model_path,
                        providers=["CPUExecutionProvider"],
                    )
                    logger.info("MoveNet pose session loaded from %s", model_path)
                except Exception as error:  # noqa: BLE001
                    _SESSION_FAILED = True
                    logger.warning("MoveNet unavailable, using heuristic pose: %s", error)
                    return None
    return _SESSION


def _preprocess(rgb: np.ndarray) -> tuple[np.ndarray, float, float]:
    height, width = rgb.shape[:2]
    resized = cv2.resize(rgb, (_INPUT_SIZE, _INPUT_SIZE), interpolation=cv2.INTER_LINEAR)
    tensor = resized.astype(np.float32) / 255.0
    tensor = np.expand_dims(tensor, axis=0)
    scale_x = width / _INPUT_SIZE
    scale_y = height / _INPUT_SIZE
    return tensor, scale_x, scale_y


def _detect_with_movenet(rgb: np.ndarray) -> list[LandmarkPoint] | None:
    session = _get_session()
    if session is None:
        return None

    input_meta = session.get_inputs()[0]
    input_name = input_meta.name
    tensor, scale_x, scale_y = _preprocess(rgb)

    if "int" in input_meta.type:
        tensor = (tensor * 255.0).astype(np.int32)

    outputs = session.run(None, {input_name: tensor})
    keypoints = np.asarray(outputs[0]).reshape(-1, 3)

    if keypoints.shape[0] < 17:
        return None

    landmarks: list[LandmarkPoint] = []
    for index in range(17):
        y_norm, x_norm, score = keypoints[index]
        landmarks.append(
            LandmarkPoint(
                x=float(x_norm) * scale_x,
                y=float(y_norm) * scale_y,
                visibility=float(score),
            ),
        )

    core_indices = [
        PoseIndex.LEFT_SHOULDER,
        PoseIndex.RIGHT_SHOULDER,
        PoseIndex.LEFT_HIP,
        PoseIndex.RIGHT_HIP,
        PoseIndex.LEFT_ANKLE,
        PoseIndex.RIGHT_ANKLE,
    ]
    core_scores = [landmarks[index].visibility for index in core_indices]

    if float(np.mean(core_scores)) < _MIN_KEYPOINT_SCORE:
        return None

    return landmarks


def detect_pose_landmarks(rgb: np.ndarray) -> list[LandmarkPoint] | None:
    if rgb.ndim != 3 or rgb.shape[2] != 3:
        return None

    landmarks = _detect_with_movenet(rgb)
    if landmarks:
        return landmarks

    return detect_pose_landmarks_heuristic(rgb)


def landmark_at(
    landmarks: list[LandmarkPoint],
    index: int,
) -> LandmarkPoint:
    return landmarks[index]
