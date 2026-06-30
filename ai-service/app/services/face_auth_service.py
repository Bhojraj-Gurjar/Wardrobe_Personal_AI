"""Production face authentication — embedding, Qdrant, duplicate detection."""

from __future__ import annotations

import logging
from dataclasses import dataclass

import numpy as np

from app.config import get_settings
from app.services.face_service import FaceService
from app.services.qdrant_service import QdrantStore
from app.services.face_validation import FaceValidationError
from app.services.liveness_challenge_service import liveness_challenge_service
from app.services.embedding_service import detect_faces
from app.utils.image import image_to_numpy
from app.services.face_diagnostics import (
    DUPLICATE_FACE_BLOCKED,
    FACE_LOGIN_FAILED,
    FACE_LOGIN_SUCCESS,
    FACE_LOGOUT_VERIFY_FAILED,
    FACE_LOGOUT_VERIFY_SUCCESS,
    FACE_REGISTER_SUCCESS,
    FACE_VERIFY_FAILED,
    FACE_VERIFY_SUCCESS,
    face_diagnostics,
)

logger = logging.getLogger(__name__)
face_service = FaceService()
qdrant_store = QdrantStore()


@dataclass
class FaceMatch:
    user_id: str
    score: float


@dataclass
class DuplicateDecision:
    blocked: bool
    message: str | None = None
    matched_user_id: str | None = None
    similarity_score: float = 0.0


class FaceAuthService:
    def __init__(self) -> None:
        self._settings = get_settings()

    @property
    def success_threshold(self) -> float:
        return self._settings.face_similarity_threshold

    @property
    def registration_duplicate_threshold(self) -> float:
        return self._settings.face_registration_duplicate_threshold

    def _collection(self) -> str:
        return self._settings.qdrant_face_collection

    def _vector_size(self) -> int:
        return self._settings.face_vector_size

    @staticmethod
    def _normalize_user_id(user_id: str | None) -> str:
        return str(user_id or "").strip().lower()

    def _embed_image(self, image) -> list[float]:
        embedding, _quality = face_service.embed_from_image(image)
        return embedding

    def _embed_frames_average(
        self,
        images: list,
        *,
        challenge_type: str | None = None,
    ) -> tuple[list[float], float, dict]:
        if not images:
            raise FaceValidationError("Invalid image.", "invalid_image")

        rgb_frames = [image_to_numpy(image) for image in images]
        liveness_meta = {
            "liveness_score": None,
            "challenge_type": None,
            "frame_count": len(rgb_frames),
        }

        vectors: list[np.ndarray] = []
        qualities: list[float] = []
        liveness_detections = None

        if challenge_type:
            liveness = liveness_challenge_service.analyze_frames(
                rgb_frames,
                challenge_type=challenge_type,
            )
            liveness_meta["liveness_score"] = liveness.liveness_score
            liveness_meta["challenge_type"] = liveness.challenge_type
            liveness_meta["frame_count"] = liveness.frame_count
            liveness_detections = liveness.valid_detections
        elif self._settings.face_liveness_required:
            raise FaceValidationError(
                "Liveness verification required.",
                "liveness_failed",
            )

        if liveness_detections:
            for detection in liveness_detections:
                confidence = float(detection.detection_score)
                if confidence < self._settings.face_min_embedding_confidence:
                    continue

                embedding = np.asarray(detection.embedding, dtype=np.float32)
                magnitude = float(np.linalg.norm(embedding))
                if magnitude <= 0:
                    continue

                vectors.append(embedding / magnitude)
                qualities.append(confidence)
        else:
            for rgb in rgb_frames:
                try:
                    frame_detections = detect_faces(rgb)
                except Exception:  # noqa: BLE001
                    continue

                if len(frame_detections) != 1:
                    continue

                detection = frame_detections[0]
                confidence = float(detection.detection_score)
                if confidence < self._settings.face_min_embedding_confidence:
                    continue

                embedding = np.asarray(detection.embedding, dtype=np.float32)
                magnitude = float(np.linalg.norm(embedding))
                if magnitude <= 0:
                    continue

                vectors.append(embedding / magnitude)
                qualities.append(confidence)

        if not vectors:
            raise FaceValidationError("Image quality is too low.", "low_quality")

        stacked = np.stack(vectors, axis=0)
        averaged = np.mean(stacked, axis=0)
        magnitude = float(np.linalg.norm(averaged))
        if magnitude <= 0:
            raise FaceValidationError("Invalid embedding: zero vector.", "invalid_embedding")

        normalized = (averaged / magnitude).tolist()
        mean_quality = float(np.mean(qualities))
        liveness_meta["quality_score"] = mean_quality
        return normalized, mean_quality, liveness_meta

    def _validate_embedding(self, embedding: list[float]) -> None:
        expected = self._vector_size()
        if not embedding or len(embedding) != expected:
            raise FaceValidationError(
                f"Invalid embedding length: expected {expected}, got {len(embedding or [])}.",
                "invalid_embedding",
            )

        arr = np.asarray(embedding, dtype=np.float32)
        magnitude = float(np.linalg.norm(arr))

        if magnitude == 0.0 or np.allclose(arr, 0.0):
            raise FaceValidationError("Invalid embedding: zero vector.", "invalid_embedding")

        logger.info(
            "STEP 6 embedding generated | length=%s | magnitude=%.6f | login_threshold=%.2f | "
            "registration_duplicate_threshold=%.2f",
            len(embedding),
            magnitude,
            self.success_threshold,
            self.registration_duplicate_threshold,
        )

    def _resolve_match_user_id(self, match: dict) -> str:
        payload_user_id = (match.get("payload") or {}).get("user_id")
        if payload_user_id:
            return str(payload_user_id)
        return str(match.get("id", ""))

    def _delete_user_vectors(self, user_id: str) -> int:
        collection = self._collection()
        deleted = qdrant_store.delete_vectors_by_user_id(collection, user_id)
        logger.info(
            "Deleted existing vectors before registration | user_id=%s | deleted=%s",
            user_id,
            deleted,
        )
        return deleted

    def _evaluate_duplicate(self, current_user_id: str, embedding: list[float]) -> DuplicateDecision:
        collection = self._collection()
        matches = qdrant_store.search_vectors(
            collection,
            embedding,
            limit=10,
            size=self._vector_size(),
        )

        normalized_current = self._normalize_user_id(current_user_id)
        threshold = self.registration_duplicate_threshold

        logger.info(
            "Duplicate check | current_user_id=%s | top_results=%s | threshold=%.2f",
            current_user_id,
            len(matches),
            threshold,
        )

        for index, match in enumerate(matches):
            match_vector_id = str(match.get("id", ""))
            match_user_id = self._resolve_match_user_id(match)
            score = float(match.get("score", 0.0))
            is_self = self._normalize_user_id(match_user_id) == normalized_current

            logger.info(
                "Top Qdrant result[%s] | point_id=%s | matched_user_id=%s | "
                "similarity_score=%.4f | is_self=%s",
                index,
                match_vector_id,
                match_user_id,
                score,
                is_self,
            )

        matched_user_id = None
        top_score = 0.0
        decision = "allow"
        message = None

        for match in matches:
            match_user_id = self._resolve_match_user_id(match)
            score = float(match.get("score", 0.0))
            normalized_match = self._normalize_user_id(match_user_id)

            if normalized_match == normalized_current:
                continue

            if score >= threshold:
                matched_user_id = match_user_id
                top_score = score
                decision = "block"
                break

        if decision == "block":
            face_diagnostics.log_event(
                DUPLICATE_FACE_BLOCKED,
                user_id=current_user_id,
                matched_user_id=matched_user_id,
                similarity_score=f"{top_score:.4f}",
            )
            message = (
                f"Face matches existing user {matched_user_id} "
                f"(similarity={top_score:.4f}, threshold={threshold:.2f})."
            )

        logger.info(
            "Face registration decision |\n"
            "  Current User: %s\n"
            "  Matched User: %s\n"
            "  Similarity Score: %.4f\n"
            "  Threshold: %.2f\n"
            "  Decision: %s",
            current_user_id,
            matched_user_id or "none",
            top_score,
            threshold,
            decision,
        )

        return DuplicateDecision(
            blocked=decision == "block",
            message=message,
            matched_user_id=matched_user_id,
            similarity_score=top_score,
        )

    def register(self, user_id: str, image, *, challenge_type: str | None = None, images: list | None = None) -> dict:
        if not qdrant_store.enabled:
            raise RuntimeError("Qdrant is not configured")

        user_id = str(user_id).strip()
        collection = self._collection()
        vectors_before = qdrant_store.count_points(collection)

        logger.info(
            "STEP 5 FastAPI register | user_id=%s | vectors_before=%s | "
            "login_threshold=%.2f | registration_duplicate_threshold=%.2f | liveness=%s",
            user_id,
            vectors_before,
            self.success_threshold,
            self.registration_duplicate_threshold,
            bool(challenge_type or images),
        )

        frame_images = images if images else [image]
        embedding, quality, liveness_meta = self._embed_frames_average(
            frame_images,
            challenge_type=challenge_type,
        )
        self._validate_embedding(embedding)

        self._delete_user_vectors(user_id)

        duplicate = self._evaluate_duplicate(user_id, embedding)
        if duplicate.blocked:
            raise FaceValidationError(
                "This face already belongs to another account.",
                "duplicate_face",
            )

        with face_diagnostics.measure("registration_total", user_id=user_id):
            qdrant_store.upsert_vector(
                collection,
                user_id,
                embedding,
                {"user_id": user_id},
                self._vector_size(),
            )

        vectors_after = qdrant_store.count_points(collection)
        logger.info(
            "STEP 7 vector saved | user_id=%s | collection=%s | vectors_after=%s",
            user_id,
            collection,
            vectors_after,
        )
        logger.info("STEP 8 registration completed | user_id=%s", user_id)
        face_diagnostics.log_event(
            FACE_REGISTER_SUCCESS,
            user_id=user_id,
            embedding_dim=len(embedding),
            collection=collection,
            liveness_score=liveness_meta.get("liveness_score"),
            challenge_type=liveness_meta.get("challenge_type"),
        )

        return {
            "message": "Face registered successfully",
            "user_id": user_id,
            "face_embedding_id": user_id,
            "is_face_registered": True,
            "vectors_before": vectors_before,
            "vectors_after": vectors_after,
            "re_registered": vectors_before > 0,
            "liveness_score": liveness_meta.get("liveness_score"),
            "quality_score": quality,
            "challenge_type": liveness_meta.get("challenge_type"),
            "frame_count": liveness_meta.get("frame_count"),
        }

    def login(self, image, *, challenge_type: str | None = None, images: list | None = None) -> FaceMatch:
        if not qdrant_store.enabled:
            raise RuntimeError("Qdrant is not configured")

        with face_diagnostics.measure("login_liveness_embed"):
            frame_images = images if images else [image]
            embedding, _quality, liveness_meta = self._embed_frames_average(
                frame_images,
                challenge_type=challenge_type,
            )
            self._validate_embedding(embedding)

        with face_diagnostics.measure("login_qdrant_search"):
            matches = qdrant_store.search_vectors(
                self._collection(),
                embedding,
                limit=1,
                size=self._vector_size(),
            )

        if not matches:
            face_diagnostics.log_event(FACE_LOGIN_FAILED, reason="no_match")
            raise FaceValidationError("Face not recognized.", "not_recognized")

        best = matches[0]
        score = float(best.get("score", 0.0))
        user_id = self._resolve_match_user_id(best)

        logger.info(
            "Face login match | matched_vector_id=%s | matched_user_id=%s | score=%.4f | threshold=%.2f | liveness=%s",
            best.get("id"),
            user_id,
            score,
            self.success_threshold,
            liveness_meta.get("challenge_type"),
        )

        if score < self.success_threshold:
            face_diagnostics.log_event(
                FACE_LOGIN_FAILED,
                matched_user_id=user_id,
                similarity_score=f"{score:.4f}",
                threshold=f"{self.success_threshold:.2f}",
            )
            raise FaceValidationError("Face not recognized.", "not_recognized")

        face_diagnostics.log_event(
            FACE_LOGIN_SUCCESS,
            user_id=user_id,
            similarity_score=f"{score:.4f}",
            liveness_score=liveness_meta.get("liveness_score"),
        )
        return FaceMatch(user_id=user_id, score=score)

    def verify(self, user_id: str, image) -> dict:
        if not qdrant_store.enabled:
            raise RuntimeError("Qdrant is not configured")

        stored = qdrant_store.get_vector(self._collection(), user_id)
        if not stored:
            raise FaceValidationError("Face not registered.", "not_registered")

        result = face_service.verify_from_image(image, stored, strict=True)
        if not result.verified:
            face_diagnostics.log_event(
                FACE_VERIFY_FAILED,
                user_id=user_id,
                similarity_score=f"{result.score:.4f}",
            )
            raise FaceValidationError("Face not recognized.", "not_recognized")

        face_diagnostics.log_event(
            FACE_VERIFY_SUCCESS,
            user_id=user_id,
            similarity_score=f"{result.score:.4f}",
        )
        return {
            "message": "Face verified successfully",
            "similarity_score": round(result.score, 4),
            "verified": True,
        }

    def logout_verify(self, user_id: str, image) -> dict:
        try:
            result = self.verify(user_id, image)
            face_diagnostics.log_event(FACE_LOGOUT_VERIFY_SUCCESS, user_id=user_id)
            return result
        except FaceValidationError:
            face_diagnostics.log_event(FACE_LOGOUT_VERIFY_FAILED, user_id=user_id)
            raise

    def reset_face_data(self) -> dict:
        collection = self._collection()
        deleted = qdrant_store.clear_collection(collection, self._vector_size())
        return {
            "message": "Face vector collection reset",
            "collection": collection,
            "deleted_vectors": deleted,
            "vectors_after": 0,
        }


face_auth_service = FaceAuthService()
