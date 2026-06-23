import logging

import numpy as np

from app.config import get_settings
from app.services.face_validation import FaceValidationError, embed_from_validated_face
from app.utils.image import decode_image_base64, image_to_numpy
from app.utils.vectors import resize_vector

logger = logging.getLogger(__name__)


class FaceMatchResult:
    def __init__(self, score: float, verified: bool, status: str) -> None:
        self.score = score
        self.verified = verified
        self.status = status


class FaceService:
    def __init__(self) -> None:
        self._settings = get_settings()

    @property
    def success_threshold(self) -> float:
        return self._settings.face_similarity_threshold

    @property
    def uncertain_threshold(self) -> float:
        return self._settings.face_similarity_uncertain

    def embed(self, image_data: str) -> tuple[list[float], float]:
        image = decode_image_base64(image_data)
        return self.embed_from_image(image)

    def embed_from_image(self, image) -> tuple[list[float], float]:
        rgb = image_to_numpy(image)
        vector, analysis = embed_from_validated_face(rgb)
        return (
            resize_vector(vector, self._settings.face_vector_size),
            analysis.quality_score,
        )

    def verify(self, image_data: str, stored_embedding: list[float]) -> FaceMatchResult:
        image = decode_image_base64(image_data)
        return self.verify_from_image(image, stored_embedding)

    def verify_from_image(self, image, stored_embedding: list[float]) -> FaceMatchResult:
        current, _quality = self.embed_from_image(image)
        score = self._cosine(current, stored_embedding)
        return self._match_result(score)

    def _match_result(self, score: float) -> FaceMatchResult:
        if score >= self.success_threshold:
            return FaceMatchResult(score=score, verified=True, status="success")
        if score >= self.uncertain_threshold:
            return FaceMatchResult(score=score, verified=False, status="uncertain")
        return FaceMatchResult(score=score, verified=False, status="reject")

    def _cosine(self, a: list[float], b: list[float]) -> float:
        va = np.asarray(a, dtype=np.float32)
        vb = np.asarray(b, dtype=np.float32)
        if va.shape != vb.shape:
            target = max(va.size, vb.size)
            va = np.asarray(resize_vector(va.tolist(), target), dtype=np.float32)
            vb = np.asarray(resize_vector(vb.tolist(), target), dtype=np.float32)
        denom = np.linalg.norm(va) * np.linalg.norm(vb)
        if denom == 0:
            return 0.0
        return float(np.dot(va, vb) / denom)
