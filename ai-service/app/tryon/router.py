import logging

from fastapi import APIRouter, HTTPException

from app.tryon.schemas import TryOnRequest, TryOnResponse
from app.tryon.service import (
    TryOnServiceError,
    TryOnTimeoutError,
    run_virtual_tryon,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/tryon", tags=["tryon"])


@router.post("/generate", response_model=TryOnResponse)
async def generate_try_on(payload: TryOnRequest) -> TryOnResponse:
    logger.info("POST /tryon/generate received")

    try:
        result = await run_virtual_tryon(
            payload.person_image_url,
            garment_image_url=payload.garment_image_url,
            garment_region=payload.garment_region,
            garments=[
                {
                    "garment_image_url": layer.garment_image_url,
                    "garment_region": layer.garment_region,
                }
                for layer in (payload.garments or [])
            ] or None,
        )
        return TryOnResponse(
            result_image_url=result["result_image_url"],
            try_on_mode=result.get("try_on_mode"),
            garments_applied=result.get("garments_applied"),
        )
    except TryOnTimeoutError as exc:
        raise HTTPException(status_code=504, detail=str(exc)) from exc
    except TryOnServiceError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc
    except Exception as exc:
        logger.exception("Unhandled try-on error: %s", exc)
        raise HTTPException(status_code=500, detail="Virtual try-on failed") from exc
