from fastapi import APIRouter, HTTPException

from app.config import get_settings
from app.schemas.products import ProductEmbedRequest, ProductEmbedResponse
from app.services.cache_service import CacheService
from app.services.product_service import ProductService
from app.services.qdrant_service import QdrantStore

router = APIRouter(prefix="/products", tags=["products"])
service = ProductService()
cache_service = CacheService()
qdrant_store = QdrantStore()


@router.post("/embed", response_model=ProductEmbedResponse)
def embed_product(payload: ProductEmbedRequest) -> ProductEmbedResponse:
    cache_key = {"product_id": payload.product_id, "product": payload.product}
    cached = cache_service.get_json("product-embed", cache_key)
    if cached:
        return ProductEmbedResponse(**cached)

    try:
        result = service.embed(payload.product)
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    response = ProductEmbedResponse(**result)
    cache_service.set_json("product-embed", cache_key, response.model_dump())

    settings = get_settings()
    if qdrant_store.enabled and payload.product_id:
        qdrant_store.upsert_vector(
            qdrant_store.product_collection(),
            payload.product_id,
            result["vector"],
            {"product_id": payload.product_id, **payload.product},
            settings.product_vector_size,
        )

    return response
