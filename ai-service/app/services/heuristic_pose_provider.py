"""Heuristic full-body landmarks from person detection (no external model)."""

from __future__ import annotations

import cv2
import numpy as np

from app.services.pose_landmarks import LandmarkPoint, PoseIndex


def _landmark(x: float, y: float, visibility: float = 0.7) -> LandmarkPoint:
    return LandmarkPoint(x=float(x), y=float(y), visibility=float(visibility))


def _bbox_from_hog(rgb: np.ndarray) -> tuple[int, int, int, int] | None:
    gray = cv2.cvtColor(rgb, cv2.COLOR_RGB2GRAY)
    hog = cv2.HOGDescriptor()
    hog.setSVMDetector(cv2.HOGDescriptor_getDefaultPeopleDetector())
    boxes, weights = hog.detectMultiScale(
        gray,
        winStride=(8, 8),
        padding=(8, 8),
        scale=1.05,
    )

    if boxes is None or len(boxes) == 0:
        return None

    best_index = int(np.argmax(weights)) if len(weights) else 0
    x, y, w, h = boxes[best_index]
    return int(x), int(y), int(w), int(h)


def _fallback_bbox(width: int, height: int) -> tuple[int, int, int, int]:
    box_w = int(width * 0.42)
    box_h = int(height * 0.88)
    x = int((width - box_w) / 2)
    y = int(height * 0.06)
    return x, y, box_w, box_h


def detect_pose_landmarks_heuristic(rgb: np.ndarray) -> list[LandmarkPoint] | None:
    if rgb.ndim != 3 or rgb.shape[2] != 3:
        return None

    height, width = rgb.shape[:2]
    bbox = _bbox_from_hog(rgb) or _fallback_bbox(width, height)
    x, y, w, h = bbox

    if w <= 0 or h <= 0:
        return None

    cx = x + w / 2.0
    shoulder_y = y + h * 0.20
    hip_y = y + h * 0.52
    knee_y = y + h * 0.72
    ankle_y = y + h * 0.95
    elbow_y = y + h * 0.38
    wrist_y = y + h * 0.48
    shoulder_half = w * 0.22
    hip_half = w * 0.16

    landmarks: list[LandmarkPoint] = [_landmark(cx, y + h * 0.10) for _ in range(17)]
    landmarks[PoseIndex.NOSE] = _landmark(cx, y + h * 0.10, 0.75)
    landmarks[PoseIndex.LEFT_EYE] = _landmark(cx - w * 0.05, y + h * 0.08, 0.7)
    landmarks[PoseIndex.RIGHT_EYE] = _landmark(cx + w * 0.05, y + h * 0.08, 0.7)
    landmarks[PoseIndex.LEFT_SHOULDER] = _landmark(cx - shoulder_half, shoulder_y, 0.8)
    landmarks[PoseIndex.RIGHT_SHOULDER] = _landmark(cx + shoulder_half, shoulder_y, 0.8)
    landmarks[PoseIndex.LEFT_ELBOW] = _landmark(cx - shoulder_half * 1.05, elbow_y, 0.7)
    landmarks[PoseIndex.RIGHT_ELBOW] = _landmark(cx + shoulder_half * 1.05, elbow_y, 0.7)
    landmarks[PoseIndex.LEFT_WRIST] = _landmark(cx - shoulder_half * 0.95, wrist_y, 0.65)
    landmarks[PoseIndex.RIGHT_WRIST] = _landmark(cx + shoulder_half * 0.95, wrist_y, 0.65)
    landmarks[PoseIndex.LEFT_HIP] = _landmark(cx - hip_half, hip_y, 0.8)
    landmarks[PoseIndex.RIGHT_HIP] = _landmark(cx + hip_half, hip_y, 0.8)
    landmarks[PoseIndex.LEFT_KNEE] = _landmark(cx - hip_half * 0.85, knee_y, 0.75)
    landmarks[PoseIndex.RIGHT_KNEE] = _landmark(cx + hip_half * 0.85, knee_y, 0.75)
    landmarks[PoseIndex.LEFT_ANKLE] = _landmark(cx - hip_half * 0.75, ankle_y, 0.8)
    landmarks[PoseIndex.RIGHT_ANKLE] = _landmark(cx + hip_half * 0.75, ankle_y, 0.8)

    return landmarks
