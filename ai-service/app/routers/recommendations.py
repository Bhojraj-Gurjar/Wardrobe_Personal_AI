from fastapi import APIRouter, HTTPException

from app.schemas.recommendations import RecommendationRequest, RecommendationResponse
from app.services.cache_service import CacheService
from app.services.recommendation_service import RecommendationService

router = APIRouter(prefix="/recommendations", tags=["recommendations"])
service = RecommendationService()
cache_service = CacheService()


@router.post("/generate", response_model=RecommendationResponse)
def generate_recommendations(payload: RecommendationRequest) -> RecommendationResponse:
    cache_key = {"user_id": payload.user_id, "profile": payload.profile}
    cached = cache_service.get_json("recommendations", cache_key)
    if cached:
        return RecommendationResponse(**cached)

    try:
        result = service.generate(payload.profile)
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    response = RecommendationResponse(**result)
    cache_service.set_json("recommendations", cache_key, response.model_dump())
    return response
