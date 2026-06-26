import logging
import traceback

from fastapi import APIRouter, File, Form, HTTPException, UploadFile
from fastapi.responses import JSONResponse

from app.schemas.body_analysis import BodyAnalysisResult, FitProfileRequest
from app.services.body_analysis_service import BodyValidationError, analyze_body_traits
from app.services.fit_recommendations import generate_fit_profile
from app.utils.image import decode_image_bytes
from app.utils.video import VideoValidationError

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/body-analysis", tags=["body-analysis"])


def _validation_http_error(exc: BodyValidationError) -> HTTPException:
    message = str(exc)
    code = getattr(exc, "code", "")

    if code == "missing_height":
        return HTTPException(
            status_code=400,
            detail="Height in centimeters is required to calibrate body measurements.",
        )
    if code == "no_pose":
        return HTTPException(status_code=400, detail="No full body pose detected.")
    if code == "missing_image":
        return HTTPException(status_code=400, detail="Missing image upload.")
    if code == "missing_media":
        return HTTPException(status_code=400, detail="Provide an image and/or walkaround video.")
    if code in {"invalid_video", "empty_video", "video_too_large", "no_video_frames"}:
        return HTTPException(status_code=400, detail=message)

    return HTTPException(status_code=400, detail=message)


async def _read_upload(upload: UploadFile | None) -> tuple[bytes | None, str | None]:
    if upload is None:
        return None, None

    content = await upload.read()
    if not content:
        return None, None

    return content, upload.content_type


@router.post("/analyze")
async def analyze_body_traits_route(
    image: UploadFile | None = File(None, description="Optional full-body photo"),
    video: UploadFile | None = File(None, description="Optional 360 walkaround video"),
    height: float | None = Form(None, description="Known height in cm for scaling"),
):
    logger.info("POST /body-analysis/analyze received")

    try:
        image_bytes, _ = await _read_upload(image)
        video_bytes, video_mime = await _read_upload(video)

        if not image_bytes and not video_bytes:
            raise HTTPException(
                status_code=400,
                detail="Provide an image and/or a 360 walkaround video.",
            )

        pil_image = decode_image_bytes(image_bytes) if image_bytes else None
        height_cm = height if height and height > 0 else None

        traits = analyze_body_traits(
            pil_image,
            video_bytes=video_bytes,
            video_mime_type=video_mime,
            height_cm=height_cm,
        )
        response = BodyAnalysisResult.model_validate(traits)
        return JSONResponse(content=response.model_dump_public())

    except BodyValidationError as exc:
        raise _validation_http_error(exc) from exc
    except VideoValidationError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except HTTPException:
        raise
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:
        logger.error("Body trait analysis failed: %s\n%s", exc, traceback.format_exc())
        raise HTTPException(status_code=503, detail="AI service unavailable.") from exc


@router.post("/fit-profile")
async def generate_fit_profile_route(payload: FitProfileRequest):
    fit_profile = generate_fit_profile(
        payload.body_type,
        payload.body_shape,
        body_type_code=payload.body_type_code,
        body_shape_code=payload.body_shape_code,
        measurements=payload.measurements,
        body_type_ratios=payload.body_type_ratios,
        body_shape_ratios=payload.body_shape_ratios,
        width_measurements=payload.width_measurements_cm,
    )

    if not fit_profile:
        raise HTTPException(
            status_code=400,
            detail="Unable to generate fit profile. Provide a valid body type and body shape.",
        )

    return JSONResponse(content={"fitProfile": fit_profile})
