from pydantic import BaseModel, Field


class ActivityVolume(BaseModel):
    orders: int = 0
    wishlist: int = 0
    product_views: int = 0
    searches: int = 0


class WishlistActivityItem(BaseModel):
    product_id: str
    brand_id: str | None = None
    category_id: str | None = None
    color: str | None = None
    price: float | None = None
    added_at: str | None = None


class OrderHistoryItem(BaseModel):
    id: str | None = None
    total_amount: float
    status: str | None = None
    created_at: str | None = None
    product_id: str | None = None
    brand_id: str | None = None
    color: str | None = None


class ProductViewItem(BaseModel):
    product_id: str
    brand_id: str | None = None
    category_id: str | None = None
    color: str | None = None
    price: float | None = None
    viewed_at: str | None = None


class SearchHistoryItem(BaseModel):
    query: str
    searched_at: str | None = None


class FashionDnaHistory(BaseModel):
    favorite_brands: dict[str, float] = Field(default_factory=dict)
    favorite_categories: dict[str, float] = Field(default_factory=dict)
    average_spending: float | None = None
    price_affinity: dict[str, float] = Field(default_factory=dict)
    search_terms: dict[str, float] = Field(default_factory=dict)
    activity_volume: ActivityVolume = Field(default_factory=ActivityVolume)
    wishlist: list[WishlistActivityItem | dict] = Field(default_factory=list)
    orders: list[OrderHistoryItem | dict] = Field(default_factory=list)
    product_views: list[ProductViewItem | dict] = Field(default_factory=list)
    searches: list[SearchHistoryItem | dict] = Field(default_factory=list)


class FashionDnaAnalyzeRequest(BaseModel):
    face_traits: dict = Field(default_factory=dict)
    body_traits: dict = Field(default_factory=dict)
    preferences: dict = Field(default_factory=dict)
    history: FashionDnaHistory | dict = Field(default_factory=dict)
    user_id: str | None = None


class FashionDnaAnalyzeResponse(BaseModel):
    styleType: str
    fashionPersonality: str
    colorAffinity: dict[str, float]
    topColors: list[str] = Field(default_factory=list)
    colorAffinityScore: int = 0
    brandAffinity: dict[str, float]
    categoryAffinity: dict[str, float] = Field(default_factory=dict)
    budgetRange: str
    fashionConfidenceScore: int
    activityTraits: dict = Field(default_factory=dict)
    vector: list[float] = Field(default_factory=list)
