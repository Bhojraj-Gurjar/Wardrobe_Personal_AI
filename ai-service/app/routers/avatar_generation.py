import logging
import traceback

from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse

from app.schemas.avatar_generation import AvatarGenerateRequest, AvatarGenerateResponse
from app.services.avatar_generation_service import generate_avatar

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/avatar", tags=["avatar"])


@router.post("/generate")
async def generate_avatar_route(payload: AvatarGenerateRequest):
    logger.info("POST /avatar/generate received type=%s", payload.avatar_type)

    try:
        result = generate_avatar(
            avatar_type=payload.avatar_type,
            face_analysis=payload.face_analysis,
            body_analysis=payload.body_analysis,
            skin_tone=payload.skin_tone,
            hair_analysis=payload.hair_analysis,
            beard_analysis=payload.beard_analysis,
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
        if str(exc).startswith("unsupported_avatar_type:"):
            raise HTTPException(status_code=400, detail="Unsupported avatar type.") from exc
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except NotImplementedError as exc:
        raise HTTPException(status_code=501, detail=str(exc)) from exc
    except Exception as exc:
        logger.error("Avatar generation failed: %s\n%s", exc, traceback.format_exc())
        raise HTTPException(status_code=503, detail="AI service unavailable.") from exc
