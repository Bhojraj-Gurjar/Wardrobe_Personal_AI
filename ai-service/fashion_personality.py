"""Fashion personality engine — derives a single style label from user signals."""

from __future__ import annotations

import re
from typing import Any

PERSONALITY_LABELS = (
    "Minimal Professional",
    "Business Casual",
    "Streetwear Enthusiast",
    "Luxury Executive",
    "Athletic Lifestyle",
)

PERSONALITY_TIE_BREAK_ORDER = (
    "Business Casual",
    "Luxury Executive",
    "Athletic Lifestyle",
    "Minimal Professional",
    "Streetwear Enthusiast",
)

DEFAULT_PERSONALITY = "Business Casual"

LUXURY_BRAND_HINTS = frozenset(
    {
        "gucci",
        "prada",
        "louis vuitton",
        "chanel",
        "dior",
        "versace",
        "burberry",
        "armani",
    }
)

SPORT_BRAND_HINTS = frozenset(
    {
        "nike",
        "adidas",
        "puma",
        "reebok",
        "under armour",
        "underarmour",
    }
)

STREET_BRAND_HINTS = frozenset(
    {
        "supreme",
        "stussy",
        "off-white",
        "off white",
        "bape",
        "zara",
        "h&m",
        "hm",
        "uniqlo",
        "forever 21",
        "forever21",
    }
)


def _normalize_key(value: str) -> str:
    return re.sub(r"\s+", " ", str(value or "").strip().lower())


def _normalize_occupation(value: str | None) -> str:
    occupation = _normalize_key(str(value or ""))

    aliases = {
        "business owner": "entrepreneur",
        "business_owner": "entrepreneur",
        "freelancer": "creative",
        "homemaker": "homemaker",
    }

    return aliases.get(occupation, occupation.replace(" ", "_"))


def _category_set(preferences: dict[str, Any]) -> set[str]:
    return {
        _normalize_key(category)
        for category in (preferences.get("preferred_categories") or [])
        if _normalize_key(category)
    }


def _brand_tokens(
    preferences: dict[str, Any],
    brand_affinity: dict[str, float] | None,
) -> set[str]:
    tokens: set[str] = set()

    for brand in preferences.get("favorite_brands") or []:
        key = _normalize_key(str(brand))
        if key:
            tokens.add(key)

    for brand in (brand_affinity or {}).keys():
        key = _normalize_key(str(brand))
        if key:
            tokens.add(key)

    return tokens


def _activity_volume(history: dict[str, Any]) -> dict[str, int]:
    volume = history.get("activity_volume") or {}

    return {
        "orders": int(volume.get("orders", 0) or len(history.get("orders") or [])),
        "wishlist": int(volume.get("wishlist", 0) or len(history.get("wishlist") or [])),
        "product_views": int(
            volume.get("product_views", 0) or len(history.get("product_views") or [])
        ),
        "searches": int(volume.get("searches", 0) or len(history.get("searches") or [])),
    }


def _personality_slug(label: str) -> str:
    return _normalize_key(label).replace(" ", "_")


def _score_personalities(
    preferences: dict[str, Any],
    history: dict[str, Any],
    brand_affinity: dict[str, float] | None,
    budget_range: str | None,
    body_traits: dict[str, Any] | None,
) -> dict[str, float]:
    scores = {label: 0.0 for label in PERSONALITY_LABELS}

    occupation = _normalize_occupation(preferences.get("occupation"))
    budget_pref = _normalize_key(str(preferences.get("budget_preference") or ""))
    budget = _normalize_key(str(budget_range or budget_pref or ""))
    categories = _category_set(preferences)
    brands = _brand_tokens(preferences, brand_affinity)
    activity = _activity_volume(history)
    shopping_frequency = _normalize_key(str(preferences.get("shopping_frequency") or ""))
    body = body_traits or {}

    browsing_score = activity["wishlist"] + activity["product_views"] + activity["searches"]
    purchase_score = activity["orders"]
    brand_breadth = len(brands)

    # Luxury Executive
    if budget in {"luxury", "premium"} or budget_pref in {"luxury", "premium"}:
        scores["Luxury Executive"] += 4.0
    if "luxury" in categories:
        scores["Luxury Executive"] += 4.0
    if occupation in {"entrepreneur", "employee"}:
        scores["Luxury Executive"] += 2.0
    if history.get("average_spending") and float(history["average_spending"]) >= 300:
        scores["Luxury Executive"] += 2.0
    if brands & LUXURY_BRAND_HINTS:
        scores["Luxury Executive"] += 3.0
    if shopping_frequency == "quarterly":
        scores["Luxury Executive"] += 1.0

    # Athletic Lifestyle
    if "sports" in categories:
        scores["Athletic Lifestyle"] += 5.0
    if _normalize_key(str(body.get("body_type") or "")) == "athletic":
        scores["Athletic Lifestyle"] += 3.0
    if _normalize_key(str(body.get("style_fit_hint") or "")) in {"sporty", "athletic"}:
        scores["Athletic Lifestyle"] += 2.0
    if _normalize_key(str(body.get("lifestyle_hint") or "")) in {"active", "sporty"}:
        scores["Athletic Lifestyle"] += 2.0
    if brands & SPORT_BRAND_HINTS:
        scores["Athletic Lifestyle"] += 3.0

    # Streetwear Enthusiast
    if "casual" in categories:
        scores["Streetwear Enthusiast"] += 2.0
    if occupation in {"student", "creative"}:
        scores["Streetwear Enthusiast"] += 3.0
    if browsing_score >= 3:
        scores["Streetwear Enthusiast"] += 3.0
    if shopping_frequency == "weekly":
        scores["Streetwear Enthusiast"] += 2.0
    if budget in {"economy", "mid_range"}:
        scores["Streetwear Enthusiast"] += 1.5
    if brands & STREET_BRAND_HINTS:
        scores["Streetwear Enthusiast"] += 2.0
    if brand_breadth >= 4:
        scores["Streetwear Enthusiast"] += 1.5

    # Minimal Professional
    if occupation == "employee":
        scores["Minimal Professional"] += 3.0
    if "formal" in categories:
        scores["Minimal Professional"] += 3.0
    if budget in {"mid_range", "premium"}:
        scores["Minimal Professional"] += 2.0
    if purchase_score >= 1 and browsing_score <= 4:
        scores["Minimal Professional"] += 1.5
    if brand_breadth <= 3:
        scores["Minimal Professional"] += 1.0
    if "luxury" not in categories and budget != "luxury":
        scores["Minimal Professional"] += 1.0

    # Business Casual
    if occupation in {"employee", "entrepreneur", "business_owner"}:
        scores["Business Casual"] += 2.0
    if {"casual", "formal"}.issubset(categories):
        scores["Business Casual"] += 4.0
    elif "casual" in categories or "formal" in categories:
        scores["Business Casual"] += 2.0
    if budget == "mid_range":
        scores["Business Casual"] += 2.0
    if shopping_frequency == "monthly":
        scores["Business Casual"] += 1.5
    if purchase_score >= 1 and browsing_score >= 1:
        scores["Business Casual"] += 1.0
    scores["Business Casual"] += 1.0

    return scores


def analyze_fashion_personality(
    preferences: dict[str, Any] | None = None,
    history: dict[str, Any] | None = None,
    brand_affinity: dict[str, float] | None = None,
    budget_range: str | None = None,
    body_traits: dict[str, Any] | None = None,
) -> dict[str, str]:
    """
    Derive a single fashion personality label and storage slug.

    Uses occupation, budget, preferred categories, brands, and shopping behavior.
    """
    prefs = preferences or {}
    hist = history or {}

    scores = _score_personalities(
        prefs,
        hist,
        brand_affinity,
        budget_range,
        body_traits,
    )

    best_score = max(scores.values())
    if best_score <= 0:
        label = DEFAULT_PERSONALITY
    else:
        leaders = [label for label, score in scores.items() if score == best_score]
        label = next(
            (candidate for candidate in PERSONALITY_TIE_BREAK_ORDER if candidate in leaders),
            leaders[0],
        )

    return {
        "fashionPersonality": label,
        "styleType": _personality_slug(label),
    }
