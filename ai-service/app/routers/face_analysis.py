import logging
import traceback

from fastapi import APIRouter, File, HTTPException, Request, UploadFile
from fastapi.responses import JSONResponse

from app.schemas.face_analysis import FaceTraitAnalysisResponse
from app.services.face_trait_service import analyze_face_traits
from app.services.face_validation import FaceValidationError
from app.utils.image import decode_image_bytes

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/face-analysis", tags=["face-analysis"])


def _validation_http_error(exc: FaceValidationError) -> HTTPException:
    message = str(exc)
    code = getattr(exc, "code", "")

    if code == "no_face":
        return HTTPException(status_code=400, detail="No face detected.")
    if code == "multiple_faces":
        return HTTPException(status_code=400, detail="Multiple faces detected.")

    return HTTPException(status_code=400, detail=message)


async def _read_image_bytes(
    request: Request,
    image: UploadFile | None = File(None),
) -> bytes:
    content_type = request.headers.get("content-type", "")

    if "multipart/form-data" in content_type:
        if image is None:
            form = await request.form()
            image = form.get("image") or form.get("frontFace")

        if image is None or not hasattr(image, "read"):
            raise HTTPException(status_code=400, detail="Missing image upload")

        return await image.read()

    body = await request.json()
    payload = body.get("image")

    if not payload:
        raise HTTPException(status_code=400, detail="Missing image payload")

    if isinstance(payload, str):
        return payload.encode()

    raise HTTPException(status_code=400, detail="Invalid image payload")


@router.post("/analyze")
async def analyze_face_traits_route(
    request: Request,
    image: UploadFile | None = File(None),
):
    logger.info("POST /face-analysis/analyze received")

    try:
        image_data = await _read_image_bytes(request, image)
        pil_image = decode_image_bytes(image_data)
        traits = analyze_face_traits(pil_image)
        response = FaceTraitAnalysisResponse.model_validate(traits)
        return JSONResponse(content=response.model_dump_public())

    except FaceValidationError as exc:
        raise _validation_http_error(exc) from exc
    except HTTPException:
        raise
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:
        logger.error("Face trait analysis failed: %s\n%s", exc, traceback.format_exc())
        raise HTTPException(status_code=503, detail="AI service unavailable.") from exc
