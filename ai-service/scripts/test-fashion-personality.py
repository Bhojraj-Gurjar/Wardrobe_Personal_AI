"""Unit tests for fashion_personality.analyze_fashion_personality."""

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from fashion_personality import analyze_fashion_personality


def main() -> None:
    luxury = analyze_fashion_personality(
        preferences={
            "occupation": "BUSINESS_OWNER",
            "budget_preference": "LUXURY",
            "preferred_categories": ["LUXURY", "FORMAL"],
            "favorite_brands": ["Gucci"],
            "shopping_frequency": "QUARTERLY",
        },
        history={
            "average_spending": 450.0,
            "activity_volume": {"orders": 2, "wishlist": 1, "product_views": 2, "searches": 1},
        },
        brand_affinity={"gucci": 0.8},
        budget_range="LUXURY",
    )
    assert luxury["fashionPersonality"] == "Luxury Executive"

    athletic = analyze_fashion_personality(
        preferences={
            "occupation": "EMPLOYEE",
            "budget_preference": "MID_RANGE",
            "preferred_categories": ["SPORTS"],
            "favorite_brands": ["Nike"],
            "shopping_frequency": "WEEKLY",
        },
        history={"activity_volume": {"orders": 1, "wishlist": 2, "product_views": 4, "searches": 2}},
        brand_affinity={"nike": 0.7},
        budget_range="MID_RANGE",
        body_traits={"body_type": "ATHLETIC", "style_fit_hint": "sporty"},
    )
    assert athletic["fashionPersonality"] == "Athletic Lifestyle"

    business = analyze_fashion_personality(
        preferences={
            "occupation": "EMPLOYEE",
            "budget_preference": "MID_RANGE",
            "preferred_categories": ["CASUAL", "FORMAL"],
            "shopping_frequency": "MONTHLY",
        },
        history={"activity_volume": {"orders": 1, "wishlist": 1, "product_views": 2, "searches": 1}},
        budget_range="MID_RANGE",
    )
    assert business["fashionPersonality"] == "Business Casual"

    print("PASS fashion_personality.analyze_fashion_personality")
    print({"luxury": luxury, "athletic": athletic, "business": business})


if __name__ == "__main__":
    main()
