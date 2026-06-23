from app.config import get_settings
from app.services.text_embedding_service import EmbeddingService


class ProductService:
    def __init__(self) -> None:
        self._embeddings = EmbeddingService()
        self._settings = get_settings()

    def embed(self, product: dict) -> dict:
        text_parts = [
            product.get("name", ""),
            product.get("description", ""),
            product.get("category", ""),
            product.get("brand", ""),
            product.get("sku", ""),
        ]
        text = " ".join(part for part in text_parts if part).strip()
        vector = self._embeddings.encode_text(text, self._settings.product_vector_size)

        return {
            "vector": vector,
            "dimensions": len(vector),
            "text": text[:240],
        }
