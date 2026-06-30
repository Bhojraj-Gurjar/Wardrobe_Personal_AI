from pydantic import BaseModel, Field


class RecommendationRequest(BaseModel):
    profile: dict = Field(default_factory=dict)
    user_id: str | None = None


class RecommendationResponse(BaseModel):
    vector: list[float]
    recommended_categories: list[str]
    dimensions: int
