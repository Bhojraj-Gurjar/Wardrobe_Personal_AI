from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    ai_service_host: str = "0.0.0.0"
    ai_service_port: int = 8000

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
    face_similarity_threshold: float = 0.40
    face_registration_duplicate_threshold: float = 0.45
    face_similarity_uncertain: float = 0.32
    face_min_detection_score: float = 0.50
    face_min_blur_variance: float = 80.0
    face_min_brightness: float = 35.0
    face_max_brightness: float = 220.0
    face_blink_ear_threshold: float = 0.21
    face_head_movement_min_delta: float = 12.0
    face_smile_score_threshold: float = 0.55
    environment: str = "development"
    product_vector_size: int = 384
    dna_vector_size: int = 384

    sentence_model: str = "all-MiniLM-L6-v2"


@lru_cache
def get_settings() -> Settings:
    return Settings()
