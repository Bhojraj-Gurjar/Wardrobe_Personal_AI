import logging

from fastapi import APIRouter, HTTPException

from app.config import get_settings
from app.services.face_auth_service import face_auth_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/face/debug", tags=["face-debug"])


@router.delete("/reset")
async def reset_face_vectors() -> dict:
    settings = get_settings()

    if settings.environment.lower() not in {"development", "dev", "local"}:
        raise HTTPException(
            status_code=403,
            detail="Face debug reset is only available in development.",
        )

    logger.warning("DELETE /face/debug/reset — clearing all face vectors")
    return face_auth_service.reset_face_data()
