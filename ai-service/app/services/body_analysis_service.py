import logging
from typing import Any

from PIL import Image

from app.schemas.body_analysis import BodyAnalysisResult
from app.services.body_measurement import aggregate_measurements, measure_pose_frame
from app.services.fit_recommendations import generate_fit_profile

logger = logging.getLogger(__name__)


class BodyValidationError(ValueError):
    def __init__(self, message: str, code: str = "invalid_pose"):
        super().__init__(message)
        self.code = code


def analyze_body_traits(
    image: Image.Image | None = None,
    video_bytes: bytes | None = None,
    video_mime_type: str | None = None,
    height_cm: float | None = None,
) -> dict[str, Any]:
    if image is None and not video_bytes:
        raise BodyValidationError(
            "Provide an image and/or a 360 walkaround video.",
            code="missing_media",
        )

    samples: list[dict[str, Any]] = []
    frames_extracted = 0
    analysis_mode = "walkaround" if video_bytes else "single_photo"

    if image is not None:
        image_sample = measure_pose_frame(image, height_cm, source="image")
        if image_sample:
            samples.append(image_sample)

    if video_bytes:
        from app.utils.video import VideoValidationError, extract_walkaround_frames

        try:
            walkaround_frames = extract_walkaround_frames(video_bytes, video_mime_type)
        except VideoValidationError as exc:
            raise BodyValidationError(str(exc), code=exc.code) from exc

        frames_extracted = len(walkaround_frames)

        for walkaround_frame in walkaround_frames:
            frame_sample = measure_pose_frame(
                walkaround_frame.image,
                height_cm,
                source="video_frame",
                frame_index=walkaround_frame.frame_index,
                timestamp_ms=walkaround_frame.timestamp_ms,
                sample_ratio=walkaround_frame.sample_ratio,
            )
            if frame_sample:
                samples.append(frame_sample)

    if not samples:
        raise BodyValidationError(
            "No full body pose detected. Use a clear front-facing full-body photo or 360 walkaround video.",
            code="no_pose",
        )

    try:
        result = aggregate_measurements(
            samples,
            analysis_mode=analysis_mode,
            frames_extracted=frames_extracted or len(samples),
        )
    except ValueError as exc:
        if str(exc) == "no_pose":
            raise BodyValidationError(
                "No full body pose detected. Use a clear front-facing full-body photo or 360 walkaround video.",
                code="no_pose",
            ) from exc
        raise

    response = BodyAnalysisResult.model_validate(result)

    fit_profile = generate_fit_profile(
        response.body_type,
        response.body_shape,
        body_type_code=response.body_type_code,
        body_shape_code=response.body_shape_code,
    )
    payload = response.model_dump_public()
    payload["fitProfile"] = fit_profile

    logger.info(
        "Body analysis complete mode=%s shape=%s type=%s fit_sections=%s confidence=%s",
        response.analysis_mode,
        response.body_shape,
        response.body_type,
        len(fit_profile.get("sections", [])) if fit_profile else 0,
        response.overall_confidence,
    )

    return payload
