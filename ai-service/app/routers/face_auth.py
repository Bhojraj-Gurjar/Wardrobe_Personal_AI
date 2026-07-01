import logging
import traceback

from fastapi import APIRouter, File, Form, HTTPException, UploadFile

from app.config import get_settings
from app.services.face_auth_service import face_auth_service
from app.services.face_validation import FaceValidationError
from app.utils.image import decode_image_bytes

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/face", tags=["face-auth"])


def _map_validation_error(exc: FaceValidationError) -> HTTPException:
    code = getattr(exc, "code", "validation_failed")
    message = str(exc)

    if code in {"no_face"}:
        return HTTPException(status_code=400, detail="No face detected.")
    if code in {"multiple_faces"}:
        return HTTPException(status_code=400, detail="Multiple faces detected.")
    if code in {"duplicate_face"}:
        return HTTPException(
            status_code=409,
            detail="This face already belongs to another account.",
        )
    if code in {"not_recognized"}:
        return HTTPException(status_code=401, detail="Face not recognized.")
    if code in {"not_registered"}:
        return HTTPException(status_code=401, detail="Face not registered.")
    if code in {"low_quality", "too_dark", "too_bright", "blur"}:
        return HTTPException(status_code=400, detail="Image quality is too low.")
    if code in {"liveness_failed"}:
        return HTTPException(
            status_code=400,
            detail=message or "We couldn't verify your face clearly. Please try again.",
        )
    if code in {"spoof"}:
        return HTTPException(
            status_code=400,
            detail=message or "Live face not detected. Please complete the verification.",
        )
    if code in {"face_too_small"}:
        return HTTPException(status_code=400, detail="Move closer to the camera.")
    if code in {"face_too_large"}:
        return HTTPException(status_code=400, detail="Move back from the camera.")
    if code in {"face_off_center"}:
        return HTTPException(status_code=400, detail="Center your face in the frame.")

    return HTTPException(status_code=400, detail=message)


async def _read_image(image: UploadFile) -> object:
    if image is None or not hasattr(image, "read"):
        raise HTTPException(status_code=400, detail="Missing image upload.")
    data = await image.read()
    if not data:
        raise HTTPException(status_code=400, detail="Invalid image.")
    return decode_image_bytes(data)


async def _read_images(
    primary: UploadFile | None,
    extra_frames: list[UploadFile] | None,
) -> tuple[object | None, list[object]]:
    frames: list[object] = []

    if primary is not None:
        frames.append(await _read_image(primary))

    if extra_frames:
        for frame in extra_frames:
            if frame is None:
                continue
            frames.append(await _read_image(frame))

    primary_image = frames[0] if frames else None
    return primary_image, frames


@router.post("/register")
async def register_face(
    user_id: str = Form(...),
    image: UploadFile = File(...),
    challenge_type: str | None = Form(default=None),
    liveness_frames: list[UploadFile] | None = File(default=None),
) -> dict:
    logger.info(
        "POST /face/register | user_id=%s | challenge=%s | frames=%s",
        user_id,
        challenge_type,
        len(liveness_frames or []) + 1,
    )
    try:
        primary_image, frames = await _read_images(image, liveness_frames)
        if not frames:
            raise HTTPException(status_code=400, detail="Missing image upload.")
        return face_auth_service.register(
            user_id,
            primary_image or frames[0],
            challenge_type=challenge_type,
            images=frames,
        )
    except FaceValidationError as exc:
        raise _map_validation_error(exc) from exc
    except HTTPException:
        raise
    except Exception as exc:
        logger.error("Face register failed: %s\n%s", exc, traceback.format_exc())
        raise HTTPException(status_code=503, detail="AI service unavailable.") from exc


@router.post("/login")
async def login_face(
    image: UploadFile = File(...),
    challenge_type: str | None = Form(default=None),
    liveness_frames: list[UploadFile] | None = File(default=None),
) -> dict:
    logger.info(
        "POST /face/login | challenge=%s | frames=%s",
        challenge_type,
        len(liveness_frames or []) + 1,
    )
    try:
        primary_image, frames = await _read_images(image, liveness_frames)
        if not frames:
            raise HTTPException(status_code=400, detail="Missing image upload.")
        match = face_auth_service.login(
            primary_image or frames[0],
            challenge_type=challenge_type,
            images=frames,
        )
        return {
            "user_id": match.user_id,
            "similarity_score": round(match.score, 4),
            "verified": True,
        }
    except FaceValidationError as exc:
        raise _map_validation_error(exc) from exc
    except HTTPException:
        raise
    except Exception as exc:
        logger.error("Face login failed: %s\n%s", exc, traceback.format_exc())
        raise HTTPException(status_code=503, detail="AI service unavailable.") from exc


@router.post("/verify")
async def verify_face(
    user_id: str = Form(...),
    image: UploadFile = File(...),
) -> dict:
    logger.info("POST /face/verify | user_id=%s", user_id)
    try:
        pil_image = await _read_image(image)
        return face_auth_service.verify(user_id, pil_image)
    except FaceValidationError as exc:
        raise _map_validation_error(exc) from exc
    except HTTPException:
        raise
    except Exception as exc:
        logger.error("Face verify failed: %s\n%s", exc, traceback.format_exc())
        raise HTTPException(status_code=503, detail="AI service unavailable.") from exc


@router.post("/logout")
async def logout_face(
    user_id: str = Form(...),
    image: UploadFile = File(...),
) -> dict:
    logger.info("POST /face/logout | user_id=%s", user_id)
    try:
        pil_image = await _read_image(image)
        return face_auth_service.logout_verify(user_id, pil_image)
    except FaceValidationError as exc:
        raise _map_validation_error(exc) from exc
    except HTTPException:
        raise
    except Exception as exc:
        logger.error("Face logout verify failed: %s\n%s", exc, traceback.format_exc())
        raise HTTPException(status_code=503, detail="AI service unavailable.") from exc
