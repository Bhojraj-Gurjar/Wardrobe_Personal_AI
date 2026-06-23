from app.config import get_settings
from app.services.text_embedding_service import EmbeddingService

CATEGORY_KEYWORDS = {
    "tops": ["shirt", "blouse", "top", "tee"],
    "bottoms": ["pants", "jeans", "trousers", "skirt"],
    "dresses": ["dress", "gown"],
    "outerwear": ["jacket", "coat", "blazer"],
    "footwear": ["shoes", "sneakers", "boots"],
    "accessories": ["bag", "belt", "watch", "jewelry"],
}


class RecommendationService:
    def __init__(self) -> None:
        self._embeddings = EmbeddingService()
        self._settings = get_settings()

    def generate(self, profile: dict) -> dict:
        prefs = profile.get("preferences") or {}
        text_parts = [
            profile.get("name", ""),
            profile.get("gender", ""),
            profile.get("body_type", ""),
            " ".join(prefs.get("favorite_colors", [])),
            " ".join(prefs.get("favorite_brands", [])),
            " ".join(prefs.get("preferred_categories", [])),
            prefs.get("occupation", ""),
            prefs.get("budget_preference", ""),
        ]
        text = " ".join(part for part in text_parts if part).strip()
        vector = self._embeddings.encode_text(text, self._settings.product_vector_size)

        preferred = set(prefs.get("preferred_categories", []))
        if preferred:
            categories = list(preferred)
        else:
            categories = self._infer_categories(text)

        return {
            "vector": vector,
            "recommended_categories": categories,
            "dimensions": len(vector),
        }

    def _infer_categories(self, text: str) -> list[str]:
        lower = text.lower()
        matched = [
            category
            for category, keywords in CATEGORY_KEYWORDS.items()
            if any(keyword in lower for keyword in keywords)
        ]
        return matched or ["tops", "bottoms", "outerwear"]
