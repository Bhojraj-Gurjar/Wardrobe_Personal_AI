import logging
import traceback

from fastapi import APIRouter, File, HTTPException, Request, UploadFile

from app.schemas.face import FaceEmbedRequest, FaceEmbedResponse
from app.services.face_service import FaceService
from app.services.face_validation import FaceValidationError
from app.utils.image import decode_image_bytes

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/face", tags=["face"])
face_service = FaceService()


def _validation_http_error(exc: FaceValidationError) -> HTTPException:
    message = str(exc)
    code = getattr(exc, "code", "")

    if code == "no_face":
        return HTTPException(status_code=400, detail="No face detected.")
    if code == "multiple_faces":
        return HTTPException(status_code=400, detail="Multiple faces detected.")

    return HTTPException(status_code=400, detail=message)


async def _read_embed_image(
    request: Request,
    image: UploadFile | None = File(None),
) -> bytes:
    content_type = request.headers.get("content-type", "")

    if "multipart/form-data" in content_type:
        if image is None:
            form = await request.form()
            image = form.get("image")

        if image is None or not hasattr(image, "read"):
            raise HTTPException(status_code=400, detail="Missing image upload")

        return await image.read()

    payload = FaceEmbedRequest(**await request.json())
    return payload.image.encode() if isinstance(payload.image, str) else payload.image


@router.post("/embed", response_model=FaceEmbedResponse)
async def embed_face(
    request: Request,
    image: UploadFile | None = File(None),
) -> FaceEmbedResponse:
    logger.info("POST /face/embed received")

    try:
        image_data = await _read_embed_image(request, image)

        if isinstance(image_data, bytes):
            pil_image = decode_image_bytes(image_data)
            embedding, quality_score = face_service.embed_from_image(pil_image)
        else:
            embedding, quality_score = face_service.embed(image_data)

        return FaceEmbedResponse(
            embedding=embedding,
            dimensions=len(embedding),
            source="insightface",
            quality_score=quality_score,
        )

    except FaceValidationError as exc:
        raise _validation_http_error(exc) from exc
    except HTTPException:
        raise
    except Exception as exc:
        logger.error("Embedding failed: %s\n%s", exc, traceback.format_exc())
        raise HTTPException(status_code=503, detail="AI service unavailable.") from exc
