import os
from functools import lru_cache

from pydantic import model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    ai_service_host: str = "0.0.0.0"
    ai_service_port: int = 8000

    @model_validator(mode="after")
    def apply_platform_port(self):
        # Render/Railway inject PORT; prefer it over AI_SERVICE_PORT defaults.
        platform_port = os.environ.get("PORT")
        if platform_port:
            self.ai_service_port = int(platform_port)
        return self

    redis_url: str | None = None
    redis_host: str = "localhost"
    redis_port: int = 6379
    redis_cache_ttl: int = 3600

    qdrant_url: str | None = None
    qdrant_api_key: str | None = None
    qdrant_face_collection: str = "users_face_vectors"
    qdrant_product_collection: str = "products"
    qdrant_dna_collection: str = "fashion_dna_vectors"

    insightface_model: str = "buffalo_sc"
    face_vector_size: int = 512
    face_similarity_threshold: float = 0.38
    face_verify_threshold: float = 0.52
    face_registration_duplicate_threshold: float = 0.45
    face_similarity_uncertain: float = 0.32
    face_min_detection_score: float = 0.45
    face_min_blur_variance: float = 45.0
    face_liveness_blur_variance: float = 22.0
    face_liveness_min_detection_score: float = 0.35
    face_min_brightness: float = 28.0
    face_max_brightness: float = 220.0
    face_blink_ear_threshold: float = 0.22
    face_head_movement_min_delta: float = 8.0
    face_smile_score_threshold: float = 0.46
    face_smile_delta_threshold: float = 0.04
    face_pitch_delta_threshold: float = 0.06
    face_liveness_required: bool = True
    face_min_capture_frames: int = 2
    face_max_capture_frames: int = 5
    face_hold_still_min_detection_score: float = 0.38
    face_min_area_ratio: float = 0.08
    face_max_area_ratio: float = 0.55
    face_guide_margin_ratio: float = 0.06
    face_anti_spoof_min_motion: float = 0.7
    face_anti_spoof_min_frame_diff: float = 1.1
    face_anti_spoof_max_specular_ratio: float = 0.45
    face_anti_spoof_max_moire_ratio: float = 12.0
    face_anti_spoof_enabled: bool = False
    face_min_embedding_confidence: float = 0.35
    # Downscale oversized liveness frames before InsightFace (0 = disabled). Login frames are ~640px.
    face_liveness_inference_max_dim: int = 640
    face_liveness_parallel_frames: bool = True
    environment: str = "development"
    product_vector_size: int = 384
    dna_vector_size: int = 384

    sentence_model: str = "all-MiniLM-L6-v2"


@lru_cache
def get_settings() -> Settings:
    return Settings()
