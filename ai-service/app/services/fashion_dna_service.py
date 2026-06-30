import sys
from pathlib import Path

from app.config import get_settings
from app.services.fashion_dna_vector_service import FashionDnaVectorService

ROOT_DIR = Path(__file__).resolve().parents[2]
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

import fashion_dna  # noqa: E402


class FashionDnaService:
    def __init__(self) -> None:
        self._vector_service = FashionDnaVectorService()

    def analyze(
        self,
        face_traits: dict,
        body_traits: dict,
        preferences: dict,
        history: dict | None = None,
        *,
        user_id: str | None = None,
    ) -> dict:
        history_payload = history.model_dump() if hasattr(history, "model_dump") else (history or {})

        analysis = fashion_dna.analyze_fashion_dna(
            face_traits=face_traits,
            body_traits=body_traits,
            preferences=preferences,
            history=history_payload,
        )

        if user_id:
            self._vector_service.upsert_user_vector(user_id, analysis)

        return self._vector_service.attach_vector(analysis)
