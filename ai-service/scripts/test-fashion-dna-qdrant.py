"""Verify Fashion DNA vectors are stored in Qdrant with user_id as point id."""

import sys
import uuid
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from app.services.fashion_dna_vector_service import FashionDnaVectorService  # noqa: E402
import fashion_dna  # noqa: E402


def main() -> None:
    user_id = str(uuid.uuid4())
    vector_service = FashionDnaVectorService()
    vector_service.ensure_collection()

    analysis = fashion_dna.analyze_fashion_dna(
        face_traits={"is_face_registered": True},
        body_traits={"gender": "FEMALE", "body_type": "AVERAGE"},
        preferences={
            "preferred_categories": ["CASUAL", "FORMAL"],
            "favorite_colors": ["Navy", "White"],
            "favorite_brands": ["Zara"],
            "budget_preference": "MID_RANGE",
        },
        history={
            "favorite_categories": {"cat-demo": 1.0},
            "activity_volume": {"orders": 1, "wishlist": 1, "product_views": 1, "searches": 1},
            "orders": [{"total_amount": 120.0, "brand_id": "brand-demo"}],
            "wishlist": [{"product_id": "p1", "brand_id": "brand-demo"}],
            "product_views": [{"product_id": "p2", "brand_id": "zara"}],
        },
    )

    first = vector_service.upsert_user_vector(user_id, analysis)
    assert first is not None, "Expected Qdrant upsert result"

    stored = vector_service.get_user_vector(user_id)
    assert stored is not None, "Vector not found after upsert"
    assert len(stored) == vector_service._settings.dna_vector_size

    second = vector_service.upsert_user_vector(user_id, analysis)
    assert second is not None, "Re-upsert should overwrite same point id"

    point_count_before = vector_service._qdrant.count_fashion_dna_points()
    vector_service.upsert_user_vector(user_id, analysis)
    point_count_after = vector_service._qdrant.count_fashion_dna_points()
    assert point_count_after == point_count_before, "Duplicate point created for same user_id"

    payload = first["payload"]
    assert payload["user_id"] == user_id
    assert payload["styleType"] == analysis["styleType"]
    assert "navy" in payload["colors"]
    assert "zara" in payload["brands"] or "brand-demo" in payload["brands"]
    assert "casual" in payload["categories"] or "cat-demo" in payload["categories"]

    print("PASS fashion_dna Qdrant vector storage")
    print(
        {
            "collection": first["collection"],
            "user_id": user_id,
            "dimensions": first["dimensions"],
            "payload_keys": sorted(payload.keys()),
        }
    )


if __name__ == "__main__":
    main()
