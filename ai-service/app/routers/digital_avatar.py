import logging
import traceback

from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse

from app.schemas.avatar_generation import AvatarGenerateResponse
from app.schemas.digital_avatar import DigitalAvatarGenerateRequest
from app.services.avatar_generation_service import generate_avatar

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/digital-avatar", tags=["digital-avatar"])


@router.post("/generate")
async def generate_digital_avatar_route(payload: DigitalAvatarGenerateRequest):
    """Backward-compatible alias for POST /avatar/generate."""
    logger.info("POST /digital-avatar/generate received type=%s", payload.avatar_type)

    try:
        result = generate_avatar(
            avatar_type=payload.avatar_type,
            face_analysis=payload.face_traits,
            body_analysis=payload.body_traits,
            skin_tone=None,
            hair_analysis=payload.face_traits,
            beard_analysis=payload.face_traits,
            profile=payload.profile,
        )
        response = AvatarGenerateResponse.model_validate(result)
        return JSONResponse(content=response.model_dump_public())
    except ValueError as exc:
        if str(exc) == "insufficient_traits":
            raise HTTPException(
                status_code=400,
                detail="Insufficient profile data. Complete face and/or body analysis first.",
            ) from exc
        if str(exc) == "insufficient_premium_traits":
            raise HTTPException(
                status_code=400,
                detail=(
                    "Premium avatar requires face analysis, body analysis, skin tone, "
                    "hair analysis, and beard analysis."
                ),
            ) from exc
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:
        logger.error("Digital avatar generation failed: %s\n%s", exc, traceback.format_exc())
        raise HTTPException(status_code=503, detail="AI service unavailable.") from exc
