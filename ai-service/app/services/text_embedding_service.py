"""Sentence-transformer text embeddings for products and Fashion DNA."""

from __future__ import annotations

import logging

import numpy as np

from app.config import get_settings

logger = logging.getLogger(__name__)

_model = None


class EmbeddingService:
    def __init__(self) -> None:
        self._settings = get_settings()

    def _load_model(self):
        global _model

        if _model is not None:
            return _model

        from sentence_transformers import SentenceTransformer

        model_name = self._settings.sentence_model
        logger.info("Loading sentence-transformer model: %s", model_name)
        _model = SentenceTransformer(model_name)
        return _model

    def encode_text(self, text: str, vector_size: int) -> list[float]:
        model = self._load_model()
        normalized_text = (text or " ").strip() or " "
        embedding = model.encode(normalized_text, normalize_embeddings=True)
        vector = np.asarray(embedding, dtype=np.float32).reshape(-1).tolist()

        if len(vector) != vector_size:
            raise ValueError(
                f"Embedding dimension mismatch: expected {vector_size}, got {len(vector)}",
            )

        return vector
