import logging
from pathlib import Path

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app.services.background_removal_service import remove_background_to_png

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/virtual-tryon", tags=["virtual-tryon"])

UPLOADS_ROOT = Path("uploads")


class RemoveBackgroundRequest(BaseModel):
    userId: str = Field(..., min_length=1)
    bodyImagePath: str = Field(..., min_length=1)
    outputPath: str = Field(..., min_length=1)


def _to_filesystem_path(storage_path: str) -> Path:
    normalized = storage_path.replace("\\", "/")
    if normalized.startswith("/uploads/"):
        normalized = normalized[len("/uploads/") :]
    return UPLOADS_ROOT / normalized


@router.post("/remove-background")
def remove_background_route(payload: RemoveBackgroundRequest):
    input_path = _to_filesystem_path(payload.bodyImagePath)
    output_path = _to_filesystem_path(payload.outputPath)

    if output_path.exists():
        return {
            "storagePath": payload.outputPath,
            "cached": True,
        }

    try:
        remove_background_to_png(input_path, output_path)
    except FileNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:
        logger.exception("Background removal failed for user %s", payload.userId)
        raise HTTPException(status_code=503, detail="Background removal failed.") from exc

    return {
        "storagePath": payload.outputPath,
        "cached": False,
    }
