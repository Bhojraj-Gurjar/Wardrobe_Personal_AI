from fastapi import APIRouter, HTTPException

from app.schemas.fashion_dna import FashionDnaAnalyzeRequest, FashionDnaAnalyzeResponse
from app.services.cache_service import CacheService
from app.services.fashion_dna_service import FashionDnaService

router = APIRouter(prefix="/fashion-dna", tags=["fashion-dna"])
service = FashionDnaService()
cache_service = CacheService()


@router.post("/analyze", response_model=FashionDnaAnalyzeResponse)
def analyze_fashion_dna(payload: FashionDnaAnalyzeRequest) -> FashionDnaAnalyzeResponse:
    history_payload = (
        payload.history.model_dump()
        if hasattr(payload.history, "model_dump")
        else (payload.history or {})
    )
    cache_key = {
        "user_id": payload.user_id,
        "face_traits": payload.face_traits,
        "body_traits": payload.body_traits,
        "preferences": payload.preferences,
        "history": history_payload,
    }
    cached = cache_service.get_json("fashion-dna", cache_key)
    if cached:
        return FashionDnaAnalyzeResponse(**cached)

    try:
        result = service.analyze(
            face_traits=payload.face_traits,
            body_traits=payload.body_traits,
            preferences=payload.preferences,
            history=history_payload,
            user_id=payload.user_id,
        )
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    response = FashionDnaAnalyzeResponse(**result)
    cache_service.set_json("fashion-dna", cache_key, response.model_dump())
    return response
