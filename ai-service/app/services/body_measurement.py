"""Body measurement extraction from one full-body image using MediaPipe Pose landmarks."""

import logging
from dataclasses import dataclass
from typing import Any

import mediapipe as mp
import numpy as np
from PIL import Image

from app.schemas.body_analysis import (
    BodyAnalysisResult,
    BodyMeasurements,
    MeasurementField,
)
from app.services.body_shape_classifier import aggregate_body_shape, classify_body_shape
from app.services.body_type_classifier import aggregate_body_type, classify_body_type

logger = logging.getLogger(__name__)

POSE = mp.solutions.pose.PoseLandmark
MIN_VISIBILITY = 0.35
CHEST_TORSO_RATIO = 0.25
WAIST_SCAN_START = 0.35
WAIST_SCAN_END = 0.75
WAIST_SCAN_STEPS = 41


@dataclass
class LandmarkPoint:
    x: float
    y: float
    visibility: float


def _point(landmarks, index: int, width: int, height: int) -> LandmarkPoint:
    landmark = landmarks[index]
    return LandmarkPoint(
        x=landmark.x * width,
        y=landmark.y * height,
        visibility=float(landmark.visibility),
    )


def _confidence(landmarks, indices: list[int]) -> float:
    values = [float(landmarks[index].visibility) for index in indices]
    if not values:
        return 0.0
    return round(float(np.mean(values)) * 100, 1)


def _segment_confidence(left: LandmarkPoint, right: LandmarkPoint) -> float:
    return round(float(np.mean([left.visibility, right.visibility])) * 100, 1)


def _path_confidence(points: list[LandmarkPoint]) -> float:
    if not points:
        return 0.0
    return round(float(np.mean([point.visibility for point in points])) * 100, 1)


def _euclidean(a: LandmarkPoint, b: LandmarkPoint) -> float:
    return float(np.hypot(a.x - b.x, a.y - b.y))


def _vertical_distance(top: LandmarkPoint, bottom: LandmarkPoint) -> float:
    return abs(bottom.y - top.y)


def _interpolated_torso_width(
    left_shoulder: LandmarkPoint,
    right_shoulder: LandmarkPoint,
    left_hip: LandmarkPoint,
    right_hip: LandmarkPoint,
    ratio: float,
) -> float:
    t = float(np.clip(ratio, 0.0, 1.0))
    left_x = left_shoulder.x + t * (left_hip.x - left_shoulder.x)
    right_x = right_shoulder.x + t * (right_hip.x - right_shoulder.x)
    return abs(right_x - left_x)


def _head_top(landmarks, width: int, height: int) -> LandmarkPoint:
    candidates = [
        _point(landmarks, POSE.NOSE, width, height),
        _point(landmarks, POSE.LEFT_EYE, width, height),
        _point(landmarks, POSE.RIGHT_EYE, width, height),
        _point(landmarks, POSE.LEFT_EAR, width, height),
        _point(landmarks, POSE.RIGHT_EAR, width, height),
    ]
    return min(candidates, key=lambda point: point.y)


def _ankle_midpoint(left_ankle: LandmarkPoint, right_ankle: LandmarkPoint) -> LandmarkPoint:
    return LandmarkPoint(
        x=(left_ankle.x + right_ankle.x) / 2.0,
        y=(left_ankle.y + right_ankle.y) / 2.0,
        visibility=float(np.mean([left_ankle.visibility, right_ankle.visibility])),
    )


def _scale_value(value: float, scale: float | None) -> float:
    if scale:
        return round(value * scale, 1)
    return round(value, 1)


def _normalize(value: float, body_height: float) -> float | None:
    if body_height <= 0:
        return None
    return round(value / body_height, 4)


def _build_measurement_field(
    value: float,
    body_height: float,
    confidence: float,
    scale: float | None,
) -> MeasurementField:
    scaled_value = _scale_value(value, scale)
    normalized_source = scaled_value if scale else value
    normalized_height = scaled_value if scale else body_height

    return MeasurementField(
        value=scaled_value,
        normalized=_normalize(normalized_source, normalized_height),
        confidence=confidence,
    )


def extract_body_measurements(
    pil_image: Image.Image,
    height_cm: float | None = None,
) -> dict[str, Any] | None:
    rgb = np.array(pil_image.convert("RGB"))
    image_height, image_width = rgb.shape[:2]

    if image_height < 120 or image_width < 120:
        return None

    with mp.solutions.pose.Pose(
        static_image_mode=True,
        model_complexity=2,
        enable_segmentation=False,
        min_detection_confidence=0.5,
    ) as pose:
        results = pose.process(rgb)

    if not results.pose_landmarks:
        return None

    landmarks = results.pose_landmarks.landmark

    left_shoulder = _point(landmarks, POSE.LEFT_SHOULDER, image_width, image_height)
    right_shoulder = _point(landmarks, POSE.RIGHT_SHOULDER, image_width, image_height)
    left_hip = _point(landmarks, POSE.LEFT_HIP, image_width, image_height)
    right_hip = _point(landmarks, POSE.RIGHT_HIP, image_width, image_height)
    left_elbow = _point(landmarks, POSE.LEFT_ELBOW, image_width, image_height)
    right_elbow = _point(landmarks, POSE.RIGHT_ELBOW, image_width, image_height)
    left_wrist = _point(landmarks, POSE.LEFT_WRIST, image_width, image_height)
    right_wrist = _point(landmarks, POSE.RIGHT_WRIST, image_width, image_height)
    left_knee = _point(landmarks, POSE.LEFT_KNEE, image_width, image_height)
    right_knee = _point(landmarks, POSE.RIGHT_KNEE, image_width, image_height)
    left_ankle = _point(landmarks, POSE.LEFT_ANKLE, image_width, image_height)
    right_ankle = _point(landmarks, POSE.RIGHT_ANKLE, image_width, image_height)
    head_top = _head_top(landmarks, image_width, image_height)
    ankle_mid = _ankle_midpoint(left_ankle, right_ankle)

    core_visibility = _confidence(
        landmarks,
        [
            POSE.LEFT_SHOULDER,
            POSE.RIGHT_SHOULDER,
            POSE.LEFT_HIP,
            POSE.RIGHT_HIP,
            POSE.LEFT_ANKLE,
            POSE.RIGHT_ANKLE,
        ],
    )

    if core_visibility < MIN_VISIBILITY * 100:
        return None

    body_height_px = _vertical_distance(head_top, ankle_mid)
    shoulder_width_px = _euclidean(left_shoulder, right_shoulder)
    chest_width_px = _interpolated_torso_width(
        left_shoulder,
        right_shoulder,
        left_hip,
        right_hip,
        CHEST_TORSO_RATIO,
    )

    waist_width_px = chest_width_px
    waist_confidence = _segment_confidence(left_shoulder, right_shoulder)
    scan_ratios = np.linspace(WAIST_SCAN_START, WAIST_SCAN_END, WAIST_SCAN_STEPS)

    for ratio in scan_ratios:
        width = _interpolated_torso_width(
            left_shoulder,
            right_shoulder,
            left_hip,
            right_hip,
            float(ratio),
        )
        if width < waist_width_px:
            waist_width_px = width
            waist_confidence = _segment_confidence(left_shoulder, right_shoulder)

    hip_width_px = _euclidean(left_hip, right_hip)

    left_arm_px = _euclidean(left_shoulder, left_elbow) + _euclidean(left_elbow, left_wrist)
    right_arm_px = _euclidean(right_shoulder, right_elbow) + _euclidean(right_elbow, right_wrist)
    arm_length_px = float(np.mean([left_arm_px, right_arm_px]))

    left_leg_px = _euclidean(left_hip, left_knee) + _euclidean(left_knee, left_ankle)
    right_leg_px = _euclidean(right_hip, right_knee) + _euclidean(right_knee, right_ankle)
    leg_length_px = float(np.mean([left_leg_px, right_leg_px]))

    if min(
        body_height_px,
        shoulder_width_px,
        chest_width_px,
        waist_width_px,
        hip_width_px,
        arm_length_px,
        leg_length_px,
    ) <= 0:
        return None

    scale = (height_cm / body_height_px) if height_cm and height_cm > 0 else None

    measurement_fields = {
        "height": _build_measurement_field(
            body_height_px,
            body_height_px,
            _path_confidence([head_top, left_ankle, right_ankle]),
            scale,
        ),
        "shoulderWidth": _build_measurement_field(
            shoulder_width_px,
            body_height_px,
            _segment_confidence(left_shoulder, right_shoulder),
            scale,
        ),
        "chest": _build_measurement_field(
            chest_width_px,
            body_height_px,
            _segment_confidence(left_shoulder, right_shoulder),
            scale,
        ),
        "waist": _build_measurement_field(
            waist_width_px,
            body_height_px,
            waist_confidence,
            scale,
        ),
        "hip": _build_measurement_field(
            hip_width_px,
            body_height_px,
            _segment_confidence(left_hip, right_hip),
            scale,
        ),
        "armLength": _build_measurement_field(
            arm_length_px,
            body_height_px,
            _path_confidence(
                [left_shoulder, left_elbow, left_wrist, right_shoulder, right_elbow, right_wrist]
            ),
            scale,
        ),
        "legLength": _build_measurement_field(
            leg_length_px,
            body_height_px,
            _path_confidence(
                [left_hip, left_knee, left_ankle, right_hip, right_knee, right_ankle]
            ),
            scale,
        ),
    }

    measurements = BodyMeasurements(
        height=measurement_fields["height"],
        shoulder_width=measurement_fields["shoulderWidth"],
        chest=measurement_fields["chest"],
        waist=measurement_fields["waist"],
        hip=measurement_fields["hip"],
        arm_length=measurement_fields["armLength"],
        leg_length=measurement_fields["legLength"],
    )

    shoulder_value = measurements.shoulder_width.value
    waist_value = measurements.waist.value
    hip_value = measurements.hip.value
    height_value = measurements.height.value
    chest_value = measurements.chest.value

    body_type_result = classify_body_type(
        shoulder_value,
        waist_value,
        chest_value,
        hip_value,
        height_value,
    )
    body_shape_result = classify_body_shape(
        shoulder_value,
        waist_value,
        hip_value,
    )

    response = BodyAnalysisResult(
        body_type=body_type_result.get("bodyType") if body_type_result else None,
        body_type_code=body_type_result.get("bodyTypeCode") if body_type_result else None,
        body_type_confidence=body_type_result.get("bodyTypeConfidence") if body_type_result else None,
        body_type_ratios=body_type_result.get("bodyTypeRatios") if body_type_result else None,
        body_shape=body_shape_result.get("bodyShape") if body_shape_result else None,
        body_shape_code=body_shape_result.get("bodyShapeCode") if body_shape_result else None,
        body_shape_confidence=body_shape_result.get("bodyShapeConfidence") if body_shape_result else None,
        body_shape_ratios=body_shape_result.get("bodyShapeRatios") if body_shape_result else None,
        body_shape_widths=body_shape_result.get("bodyShapeWidths") if body_shape_result else None,
        height=height_value,
        shoulder_width=shoulder_value,
        chest=chest_value,
        waist=waist_value,
        hip=hip_value,
        arm_length=measurements.arm_length.value,
        leg_length=measurements.leg_length.value,
        measurements=measurements,
    )

    logger.info(
        "Body measurements extracted height=%s shoulder=%s type=%s shape=%s shape_conf=%s",
        measurements.height.value,
        measurements.shoulder_width.value,
        body_type_result.get("bodyType") if body_type_result else None,
        body_shape_result.get("bodyShape") if body_shape_result else None,
        body_shape_result.get("bodyShapeConfidence") if body_shape_result else None,
    )

    payload = response.model_dump_public()
    payload["_bodyTypeClassification"] = body_type_result
    payload["_bodyShapeClassification"] = body_shape_result
    return payload


def measure_pose_frame(
    pil_image: Image.Image,
    height_cm: float | None = None,
    *,
    source: str = "image",
    frame_index: int | None = None,
    timestamp_ms: float | None = None,
    sample_ratio: float | None = None,
) -> dict[str, Any] | None:
    result = extract_body_measurements(pil_image, height_cm)
    if not result:
        return None

    measurements = result.get("measurements") or {}
    confidences = [
        float(field.get("confidence", 0))
        for field in measurements.values()
        if isinstance(field, dict) and field.get("confidence") is not None
    ]
    frame_confidence = float(np.mean(confidences)) if confidences else 0.0

    return {
        "bodyType": result.get("bodyType"),
        "bodyTypeCode": result.get("bodyTypeCode"),
        "bodyTypeConfidence": result.get("bodyTypeConfidence"),
        "bodyTypeRatios": result.get("bodyTypeRatios"),
        "bodyShape": result.get("bodyShape"),
        "bodyShapeCode": result.get("bodyShapeCode"),
        "bodyShapeConfidence": result.get("bodyShapeConfidence"),
        "bodyShapeRatios": result.get("bodyShapeRatios"),
        "bodyShapeWidths": result.get("bodyShapeWidths"),
        "height": result.get("height"),
        "shoulderWidth": result.get("shoulderWidth"),
        "chest": result.get("chest"),
        "waist": result.get("waist"),
        "hip": result.get("hip"),
        "armLength": result.get("armLength"),
        "legLength": result.get("legLength"),
        "measurements": measurements,
        "_visibility": frame_confidence / 100,
        "_frameConfidence": frame_confidence,
        "_source": source,
        "_frameIndex": frame_index,
        "_timestampMs": timestamp_ms,
        "_sampleRatio": sample_ratio,
        "_bodyTypeClassification": result.get("_bodyTypeClassification"),
        "_bodyShapeClassification": result.get("_bodyShapeClassification"),
    }


def _frame_confidence(sample: dict[str, Any]) -> float:
    return float(sample.get("_frameConfidence") or (sample.get("_visibility", 0) * 100))


def _weighted_average(pairs: list[tuple[float, float]]) -> float | None:
    if not pairs:
        return None

    values = np.array([value for value, _ in pairs], dtype=float)
    weights = np.array([weight for _, weight in pairs], dtype=float)

    if weights.sum() <= 0:
        return round(float(np.mean(values)), 1)

    return round(float(np.average(values, weights=weights)), 1)


def _aggregate_field(samples: list[dict[str, Any]], field: str) -> dict[str, float | int | None]:
    pairs: list[tuple[float, float]] = []
    normalized_pairs: list[tuple[float, float]] = []
    best_value = None
    best_confidence = -1.0
    best_frame_index = None

    for sample in samples:
        field_data = (sample.get("measurements") or {}).get(field)
        if not field_data:
            continue

        value = field_data.get("value")
        confidence = field_data.get("confidence")
        normalized = field_data.get("normalized")

        if value is not None and confidence is not None and confidence > 0:
            weight = float(confidence)
            pairs.append((float(value), weight))
            if float(confidence) > best_confidence:
                best_confidence = float(confidence)
                best_value = float(value)
                best_frame_index = sample.get("_frameIndex")

        if normalized is not None and confidence is not None and confidence > 0:
            normalized_pairs.append((float(normalized), float(confidence)))

    weighted_value = _weighted_average(pairs)
    weighted_normalized = _weighted_average(normalized_pairs)
    field_confidence = round(max((weight for _, weight in pairs), default=0.0), 1)

    return {
        "value": weighted_value if weighted_value is not None else best_value,
        "normalized": weighted_normalized,
        "confidence": field_confidence,
        "mostConfidentValue": round(best_value, 1) if best_value is not None else None,
        "mostConfidentFrame": best_frame_index,
    }


def aggregate_measurements(
    samples: list[dict[str, Any]],
    *,
    analysis_mode: str = "single_photo",
    frames_extracted: int | None = None,
) -> dict[str, Any]:
    if not samples:
        raise ValueError("no_pose")

    ranked = sorted(samples, key=_frame_confidence, reverse=True)
    min_confidence = 50.0 if analysis_mode == "walkaround" else 35.0
    qualified = [sample for sample in ranked if _frame_confidence(sample) >= min_confidence]
    selected = qualified[: max(3, min(len(qualified), 24))] if qualified else ranked[:1]

    numeric_keys = (
        "height",
        "shoulderWidth",
        "chest",
        "waist",
        "hip",
        "armLength",
        "legLength",
    )

    measurement_fields: dict[str, dict[str, float | int | None]] = {}
    aggregated: dict[str, Any] = {}

    for field in numeric_keys:
        field_result = _aggregate_field(selected, field)
        measurement_fields[field] = field_result
        aggregated[field] = field_result.get("value")

    body_type_result = aggregate_body_type(selected)
    body_shape_result = aggregate_body_shape(selected)

    if body_shape_result:
        aggregated["bodyShape"] = body_shape_result.get("bodyShape")
        aggregated["bodyShapeCode"] = body_shape_result.get("bodyShapeCode")
        aggregated["bodyShapeConfidence"] = body_shape_result.get("bodyShapeConfidence")
        aggregated["bodyShapeRatios"] = body_shape_result.get("bodyShapeRatios")
        aggregated["bodyShapeWidths"] = body_shape_result.get("bodyShapeWidths")
    else:
        shape_values = [sample.get("bodyShape") for sample in selected if sample.get("bodyShape")]
        aggregated["bodyShape"] = (
            max(set(shape_values), key=shape_values.count) if shape_values else None
        )
        aggregated["bodyShapeCode"] = None
        aggregated["bodyShapeConfidence"] = None
        aggregated["bodyShapeRatios"] = None
        aggregated["bodyShapeWidths"] = None

    if body_type_result:
        aggregated["bodyType"] = body_type_result.get("bodyType")
        aggregated["bodyTypeCode"] = body_type_result.get("bodyTypeCode")
        aggregated["bodyTypeConfidence"] = body_type_result.get("bodyTypeConfidence")
        aggregated["bodyTypeRatios"] = body_type_result.get("bodyTypeRatios")
    else:
        type_values = [sample.get("bodyType") for sample in selected if sample.get("bodyType")]
        aggregated["bodyType"] = (
            max(set(type_values), key=type_values.count) if type_values else None
        )
        aggregated["bodyTypeCode"] = None
        aggregated["bodyTypeConfidence"] = None
        aggregated["bodyTypeRatios"] = None
    aggregated["measurements"] = measurement_fields
    aggregated["analysisMode"] = analysis_mode
    aggregated["framesExtracted"] = frames_extracted or len(samples)
    aggregated["framesAnalyzed"] = len(samples)
    aggregated["framesUsed"] = len(selected)
    aggregated["overallConfidence"] = round(
        float(np.mean([_frame_confidence(sample) for sample in selected])),
        1,
    )

    return aggregated
