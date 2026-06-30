from pydantic import BaseModel, Field


class ProductEmbedRequest(BaseModel):
    product: dict = Field(default_factory=dict)
    product_id: str | None = None


class ProductEmbedResponse(BaseModel):
    vector: list[float]
    dimensions: int
    text: str
