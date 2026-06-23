import logging
import sys
from pathlib import Path

from app.config import get_settings
from app.services.text_embedding_service import EmbeddingService
from app.services.qdrant_service import QdrantStore

ROOT_DIR = Path(__file__).resolve().parents[2]
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

import fashion_dna  # noqa: E402

logger = logging.getLogger(__name__)


class FashionDnaVectorService:
    """Generate Fashion DNA embeddings and persist them in Qdrant."""

    def __init__(self) -> None:
        self._settings = get_settings()
        self._embeddings = EmbeddingService()
        self._qdrant = QdrantStore()

    def ensure_collection(self) -> None:
        if not self._qdrant.enabled:
            return

        self._qdrant.ensure_collection(
            self._qdrant.dna_collection(),
            self._settings.dna_vector_size,
        )

    def build_embedding_text(self, analysis: dict) -> str:
        return fashion_dna.build_embedding_text(
            style_type=analysis.get("styleType", "general"),
            color_affinity=analysis.get("colorAffinity") or {},
            brand_affinity=analysis.get("brandAffinity") or {},
            category_affinity=analysis.get("categoryAffinity") or {},
            fashion_personality=analysis.get("fashionPersonality"),
        )

    def generate_embedding(self, analysis: dict) -> list[float]:
        text = self.build_embedding_text(analysis)
        vector_size = self._settings.dna_vector_size

        try:
            return self._embeddings.encode_text(text, vector_size)
        except Exception as error:
            logger.warning(
                "Sentence-transformer embedding unavailable, using deterministic fallback: %s",
                error,
            )
            return fashion_dna.build_deterministic_vector(text, vector_size)

    def build_payload(self, user_id: str, analysis: dict) -> dict:
        color_affinity = analysis.get("colorAffinity") or {}
        brand_affinity = analysis.get("brandAffinity") or {}
        category_affinity = analysis.get("categoryAffinity") or {}

        return {
            "user_id": user_id,
            "styleType": analysis.get("styleType"),
            "fashionPersonality": analysis.get("fashionPersonality"),
            "colors": list(color_affinity.keys()),
            "topColors": analysis.get("topColors") or [],
            "colorAffinity": color_affinity,
            "colorAffinityScore": analysis.get("colorAffinityScore"),
            "brands": list(brand_affinity.keys()),
            "brandAffinity": brand_affinity,
            "categories": list(category_affinity.keys()),
            "categoryAffinity": category_affinity,
            "budgetRange": analysis.get("budgetRange"),
            "fashionConfidenceScore": analysis.get("fashionConfidenceScore"),
        }

    def upsert_user_vector(self, user_id: str, analysis: dict) -> dict | None:
        """
        Upsert a user's Fashion DNA vector using user_id as the point id.
        Re-running for the same user overwrites the prior point (no duplicates).
        """
        if not self._qdrant.enabled:
            logger.debug("Qdrant disabled — skipping Fashion DNA vector upsert")
            return None

        if not user_id:
            logger.debug("Missing user_id — skipping Fashion DNA vector upsert")
            return None

        vector = self.generate_embedding(analysis)
        payload = self.build_payload(user_id, analysis)

        self._qdrant.upsert_vector(
            self._qdrant.dna_collection(),
            user_id,
            vector,
            payload,
            self._settings.dna_vector_size,
        )

        return {
            "collection": self._qdrant.dna_collection(),
            "user_id": user_id,
            "dimensions": len(vector),
            "payload": payload,
        }

    def search_similar(self, analysis: dict, limit: int = 10) -> list[dict]:
        if not self._qdrant.enabled:
            return []

        vector = self.generate_embedding(analysis)
        return self._qdrant.search_vectors(
            self._qdrant.dna_collection(),
            vector,
            limit,
            self._settings.dna_vector_size,
        )

    def get_user_vector(self, user_id: str) -> list[float] | None:
        if not self._qdrant.enabled or not user_id:
            return None

        return self._qdrant.get_vector(self._qdrant.dna_collection(), user_id)

    def attach_vector(self, analysis: dict) -> dict:
        vector = self.generate_embedding(analysis)
        return {**analysis, "vector": vector}
