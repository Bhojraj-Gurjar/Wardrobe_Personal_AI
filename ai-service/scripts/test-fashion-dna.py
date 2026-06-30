"""Quick sanity check for fashion_dna.analyze_fashion_dna."""

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from fashion_dna import analyze_fashion_dna


def main() -> None:
    result = analyze_fashion_dna(
        face_traits={"is_face_registered": True, "biometric_enabled": True, "quality_score": 1},
        body_traits={
            "gender": "FEMALE",
            "age": 28,
            "height": 165,
            "weight": 58,
            "body_type": "AVERAGE",
            "skin_tone": "MEDIUM",
            "style_fit_hint": "balanced",
            "complementary_colors": ["navy", "white"],
            "analysis_source": "body_analysis_module",
        },
        preferences={
            "occupation": "EMPLOYEE",
            "shopping_frequency": "MONTHLY",
            "budget_preference": "MID_RANGE",
            "preferred_categories": ["CASUAL", "FORMAL"],
            "favorite_colors": ["Navy", "White"],
            "favorite_brands": ["Zara"],
        },
        history={
            "favorite_brands": {"brand-demo": 1.0},
            "favorite_categories": {"cat-demo": 0.8},
            "average_spending": 99.99,
            "search_terms": {"casual": 0.5, "jacket": 0.5},
            "activity_volume": {
                "orders": 1,
                "wishlist": 2,
                "product_views": 2,
                "searches": 1,
            },
            "orders": [
                {"id": "order-1", "total_amount": 99.99, "brand_id": "brand-zara", "color": "Navy"},
            ],
            "wishlist": [
                {"product_id": "p1", "brand_id": "brand-zara", "color": "Navy"},
                {"product_id": "p2", "brand_id": "brand-hm", "color": "Beige"},
            ],
            "product_views": [
                {"product_id": "p1", "brand_id": "brand-zara", "color": "Navy"},
                {"product_id": "p3", "brand_id": "brand-uniqlo", "color": "White"},
            ],
        },
    )

    required = {
        "styleType",
        "colorAffinity",
        "brandAffinity",
        "budgetRange",
        "fashionConfidenceScore",
    }
    missing = required - set(result.keys())
    assert not missing, f"Missing keys: {missing}"
    assert result["styleType"]
    assert result["fashionPersonality"] in {
        "Minimal Professional",
        "Business Casual",
        "Streetwear Enthusiast",
        "Luxury Executive",
        "Athletic Lifestyle",
    }
    assert result["fashionConfidenceScore"] > 0
    assert 0 <= result["fashionConfidenceScore"] <= 100
    assert len(result["brandAffinity"]) <= 10
    assert len(result["topColors"]) <= 10
    assert result["topColors"][0] == "navy"
    assert result["colorAffinityScore"] > 0
    assert 0 <= result["colorAffinityScore"] <= 100
    assert result["colorAffinity"]["navy"] > result["colorAffinity"]["white"]
    assert result["brandAffinity"]["brand-zara"] == 0.6
    assert result["brandAffinity"]["brand-hm"] == 0.2
    assert result["brandAffinity"]["brand-uniqlo"] == 0.2
    breakdown = result["activityTraits"].get("confidence_breakdown", {})
    assert breakdown.get("weighted_score") == result["fashionConfidenceScore"]
    assert breakdown.get("weights", {}).get("face_analysis") == 0.20
    assert "categoryAffinity" in result
    print("PASS fashion_dna.analyze_fashion_dna")
    print(result)


if __name__ == "__main__":
    main()
