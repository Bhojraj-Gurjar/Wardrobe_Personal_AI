"""Fashion DNA analysis — all scoring and affinity logic lives here."""

from __future__ import annotations

import hashlib
import re
from datetime import datetime, timezone
from typing import Any

import numpy as np

import color_affinity
import fashion_personality

MIN_SCORE = 0
MAX_SCORE = 100

MAX_BRAND_AFFINITY = 10

CONFIDENCE_WEIGHTS = {
    "face_analysis": 0.20,
    "body_analysis": 0.20,
    "user_preferences": 0.20,
    "shopping_history": 0.20,
    "wishlist_browsing": 0.20,
}

BODY_CONFIDENCE_FIELDS = (
    "gender",
    "age",
    "height",
    "weight",
    "body_type",
    "skin_tone",
    "bmi",
    "bmi_category",
    "style_fit_hint",
    "complementary_colors",
)

PREFERENCE_CONFIDENCE_FIELDS = (
    "occupation",
    "shopping_frequency",
    "budget_preference",
    "preferred_categories",
    "favorite_colors",
    "favorite_brands",
    "fashion_influencers",
)

BUDGET_TIERS = ("ECONOMY", "MID_RANGE", "PREMIUM", "LUXURY")
BUDGET_SPENDING_THRESHOLDS = {
    "ECONOMY": 50,
    "MID_RANGE": 150,
    "PREMIUM": 400,
}

OCCUPATION_STYLE_HINTS = {
    "STUDENT": "casual",
    "EMPLOYEE": "smart_casual",
    "ENTREPRENEUR": "business_casual",
    "CREATIVE": "eclectic",
    "HOMEMAKER": "comfort",
}

BODY_TYPE_STYLE_HINTS = {
    "SLIM": "fitted",
    "ATHLETIC": "sporty",
    "AVERAGE": "balanced",
    "CURVY": "structured",
    "PLUS": "relaxed",
}


def _is_filled(value: Any) -> bool:
    if value is None or value == "":
        return False
    if isinstance(value, (list, dict)):
        return len(value) > 0
    return True


def _normalize_key(value: str) -> str:
    return re.sub(r"\s+", " ", str(value or "").strip().lower())


def _normalize_affinity(counts: dict[str, float]) -> dict[str, float]:
    if not counts:
        return {}

    total = sum(counts.values())
    if total <= 0:
        return {}

    return {
        key: round(weight / total, 4)
        for key, weight in counts.items()
        if weight > 0
    }


def _merge_affinities(*maps: dict[str, float] | None) -> dict[str, float]:
    totals: dict[str, float] = {}

    for affinity_map in maps:
        for key, weight in (affinity_map or {}).items():
            totals[_normalize_key(key)] = totals.get(_normalize_key(key), 0.0) + float(weight)

    return _normalize_affinity(totals)


def _derive_style_type(
    preferences: dict[str, Any],
    body_traits: dict[str, Any],
) -> str:
    categories = preferences.get("preferred_categories") or []
    normalized = sorted(_normalize_key(category) for category in categories if _normalize_key(category))

    style_parts: list[str] = []

    if normalized:
        if len(normalized) == 1:
            style_parts.append(normalized[0])
        else:
            style_parts.append("_".join(normalized))

    occupation = _normalize_key(preferences.get("occupation", ""))
    if occupation in OCCUPATION_STYLE_HINTS:
        style_parts.append(OCCUPATION_STYLE_HINTS[occupation])

    body_type = _normalize_key(body_traits.get("body_type", ""))
    if body_type in BODY_TYPE_STYLE_HINTS:
        style_parts.append(BODY_TYPE_STYLE_HINTS[body_type])

    style_fit_hint = _normalize_key(body_traits.get("style_fit_hint", ""))
    if style_fit_hint:
        style_parts.append(style_fit_hint)

    lifestyle_hint = _normalize_key(body_traits.get("lifestyle_hint", ""))
    if lifestyle_hint:
        style_parts.append(lifestyle_hint)

    if style_parts:
        return "_".join(dict.fromkeys(style_parts))

    return "general"


def _derive_color_affinity(
    preferences: dict[str, Any],
    history: dict[str, Any],
    body_traits: dict[str, Any],
) -> dict[str, Any]:
    del body_traits
    return color_affinity.analyze_color_affinity(preferences, history)


def _activity_signal_counts(history: dict[str, Any]) -> dict[str, int]:
    volume = history.get("activity_volume") or {}
    return {
        "orders": int(volume.get("orders", 0) or len(history.get("orders") or [])),
        "wishlist": int(volume.get("wishlist", 0) or len(history.get("wishlist") or [])),
        "product_views": int(
            volume.get("product_views", 0) or len(history.get("product_views") or [])
        ),
        "searches": int(volume.get("searches", 0) or len(history.get("searches") or [])),
    }


def _has_behavioral_activity(history: dict[str, Any]) -> bool:
    counts = _activity_signal_counts(history)
    return any(counts[key] > 0 for key in counts)


def _derive_category_affinity(
    preferences: dict[str, Any],
    history: dict[str, Any],
) -> dict[str, float]:
    preferred_categories = preferences.get("preferred_categories") or []
    preference_counts: dict[str, float] = {}

    if preferred_categories:
        weight = 1.0 / len(preferred_categories)
        for category in preferred_categories:
            key = _normalize_key(category)
            if key:
                preference_counts[key] = preference_counts.get(key, 0.0) + weight

    history_categories = history.get("favorite_categories") or {}
    return _merge_affinities(preference_counts, history_categories)


def _extract_brand_key(item: dict[str, Any]) -> str | None:
    brand_id = item.get("brand_id")
    if brand_id:
        key = _normalize_key(str(brand_id))
        return key or None

    return None


def _increment_brand_count(
    counts: dict[str, int],
    brand_key: str | None,
    amount: int = 1,
) -> None:
    if not brand_key:
        return

    counts[brand_key] = counts.get(brand_key, 0) + amount


def _count_brands_from_activity(history: dict[str, Any]) -> dict[str, int]:
    counts: dict[str, int] = {}

    for order in history.get("orders") or []:
        _increment_brand_count(counts, _extract_brand_key(order))

        for item in order.get("items") or []:
            if isinstance(item, dict):
                _increment_brand_count(counts, _extract_brand_key(item))

    for item in history.get("wishlist") or []:
        if isinstance(item, dict):
            _increment_brand_count(counts, _extract_brand_key(item))

    for view in history.get("product_views") or []:
        if isinstance(view, dict):
            _increment_brand_count(counts, _extract_brand_key(view))

    return counts


def _rank_top_brand_affinity(
    brand_counts: dict[str, int],
    limit: int = MAX_BRAND_AFFINITY,
) -> dict[str, float]:
    if not brand_counts:
        return {}

    ranked = sorted(
        brand_counts.items(),
        key=lambda entry: (-entry[1], entry[0]),
    )[:limit]

    total = sum(frequency for _, frequency in ranked)
    if total <= 0:
        return {}

    return {
        brand: round(frequency / total, 4)
        for brand, frequency in ranked
    }


def _derive_brand_affinity(
    preferences: dict[str, Any],
    history: dict[str, Any],
) -> dict[str, float]:
    del preferences
    brand_counts = _count_brands_from_activity(history)
    return _rank_top_brand_affinity(brand_counts)


def _spending_to_budget(average_spending: float | None) -> str | None:
    if average_spending is None or average_spending <= 0:
        return None

    if average_spending < BUDGET_SPENDING_THRESHOLDS["ECONOMY"]:
        return "ECONOMY"
    if average_spending < BUDGET_SPENDING_THRESHOLDS["MID_RANGE"]:
        return "MID_RANGE"
    if average_spending < BUDGET_SPENDING_THRESHOLDS["PREMIUM"]:
        return "PREMIUM"
    return "LUXURY"


def _derive_budget_range(
    preferences: dict[str, Any],
    history: dict[str, Any],
) -> str:
    stated = str(preferences.get("budget_preference") or "").strip().upper()
    if stated in BUDGET_TIERS:
        base = stated
    else:
        base = "MID_RANGE"

    spending_budget = _spending_to_budget(history.get("average_spending"))
    if not spending_budget:
        return base

    base_index = BUDGET_TIERS.index(base)
    spend_index = BUDGET_TIERS.index(spending_budget)
    blended_index = round((base_index * 0.6) + (spend_index * 0.4))
    blended_index = max(0, min(len(BUDGET_TIERS) - 1, blended_index))
    return BUDGET_TIERS[blended_index]


def _clamp_score(value: float) -> float:
    return float(max(MIN_SCORE, min(MAX_SCORE, value)))


def _completeness_score(values: list[Any]) -> float:
    if not values:
        return 0.0

    filled = sum(1 for value in values if _is_filled(value))
    return _clamp_score((filled / len(values)) * MAX_SCORE)


def _saturating_ratio(count: int, target: int) -> float:
    if target <= 0:
        return 0.0

    return _clamp_score((max(count, 0) / target) * MAX_SCORE)


def _score_face_analysis(face_traits: dict[str, Any]) -> float:
    if not face_traits.get("is_face_registered"):
        return 0.0

    score = 40.0

    if face_traits.get("biometric_enabled") or face_traits.get("has_face_vector"):
        score += 35.0

    quality = face_traits.get("quality_score")
    if isinstance(quality, (int, float)):
        score += float(quality) * 25.0

    if face_traits.get("registered_at"):
        score += 5.0

    return _clamp_score(score)


def _score_body_analysis(body_traits: dict[str, Any]) -> float:
    return _completeness_score(
        [body_traits.get(field) for field in BODY_CONFIDENCE_FIELDS]
    )


def _score_user_preferences(preferences: dict[str, Any]) -> float:
    return _completeness_score(
        [preferences.get(field) for field in PREFERENCE_CONFIDENCE_FIELDS]
    )


def _score_shopping_history(history: dict[str, Any]) -> float:
    counts = _activity_signal_counts(history)
    order_count = counts["orders"]
    orders = history.get("orders") or []
    price_affinity = history.get("price_affinity") or {}

    order_volume_score = _saturating_ratio(order_count, target=5)
    spending_score = MAX_SCORE if history.get("average_spending") else 0.0
    price_signal_score = _clamp_score(len(price_affinity) * 25)
    purchase_record_score = _saturating_ratio(len(orders), target=5)

    return _clamp_score(
        order_volume_score * 0.50
        + spending_score * 0.20
        + price_signal_score * 0.15
        + purchase_record_score * 0.15
    )


def _score_wishlist_browsing(history: dict[str, Any]) -> float:
    counts = _activity_signal_counts(history)

    wishlist_score = _saturating_ratio(counts["wishlist"], target=5)
    view_score = _saturating_ratio(counts["product_views"], target=10)
    search_score = _saturating_ratio(counts["searches"], target=5)

    return _clamp_score(
        wishlist_score * 0.35 + view_score * 0.40 + search_score * 0.25
    )


def _derive_confidence_components(
    face_traits: dict[str, Any],
    body_traits: dict[str, Any],
    preferences: dict[str, Any],
    history: dict[str, Any],
) -> dict[str, float]:
    return {
        "face_analysis": _score_face_analysis(face_traits),
        "body_analysis": _score_body_analysis(body_traits),
        "user_preferences": _score_user_preferences(preferences),
        "shopping_history": _score_shopping_history(history),
        "wishlist_browsing": _score_wishlist_browsing(history),
    }


def _derive_confidence_score(
    face_traits: dict[str, Any],
    body_traits: dict[str, Any],
    preferences: dict[str, Any],
    history: dict[str, Any],
) -> int:
    components = _derive_confidence_components(
        face_traits,
        body_traits,
        preferences,
        history,
    )

    weighted_total = sum(
        components[key] * CONFIDENCE_WEIGHTS[key]
        for key in CONFIDENCE_WEIGHTS
    )

    return int(_clamp_score(round(weighted_total)))


def _build_activity_traits(
    history: dict[str, Any],
    confidence_components: dict[str, float] | None = None,
    fashion_confidence_score: int | None = None,
) -> dict[str, Any]:
    volume = history.get("activity_volume") or {}

    traits = {
        "favorite_brands": history.get("favorite_brands") or {},
        "favorite_categories": history.get("favorite_categories") or {},
        "average_spending": history.get("average_spending"),
        "price_affinity": history.get("price_affinity") or {},
        "search_terms": history.get("search_terms") or {},
        "activity_volume": {
            "orders": int(volume.get("orders", 0) or 0),
            "wishlist": int(volume.get("wishlist", 0) or 0),
            "product_views": int(volume.get("product_views", 0) or 0),
            "searches": int(volume.get("searches", 0) or 0),
        },
        "last_activity_at": datetime.now(timezone.utc).isoformat(),
    }

    if confidence_components is not None:
        traits["confidence_breakdown"] = {
            **{key: round(value, 2) for key, value in confidence_components.items()},
            "weights": CONFIDENCE_WEIGHTS,
            "weighted_score": fashion_confidence_score,
        }

    return traits


def build_embedding_text(
    style_type: str,
    color_affinity: dict[str, float],
    brand_affinity: dict[str, float],
    category_affinity: dict[str, float],
    fashion_personality: str | None = None,
) -> str:
    """Build a semantic document for Fashion DNA embedding generation."""
    color_terms = " ".join(
        f"{key}:{value:.3f}" for key, value in sorted(color_affinity.items())
    )
    brand_terms = " ".join(
        f"{key}:{value:.3f}" for key, value in sorted(brand_affinity.items())
    )
    category_terms = " ".join(
        f"{key}:{value:.3f}" for key, value in sorted(category_affinity.items())
    )
    personality = fashion_personality or style_type

    return (
        f"style {style_type} "
        f"personality {personality} "
        f"categories {category_terms} "
        f"colors {color_terms} "
        f"brands {brand_terms}"
    ).strip()


def build_deterministic_vector(
    embedding_text: str,
    target_size: int = 384,
) -> list[float]:
    """Fallback embedding when sentence-transformers is unavailable."""
    digest = hashlib.sha256(embedding_text.encode("utf-8")).digest()
    seed = int.from_bytes(digest[:8], "big") % (2**32 - 1)
    rng = np.random.default_rng(seed)
    vector = rng.standard_normal(target_size).astype(np.float32)
    norm = np.linalg.norm(vector)
    if norm > 0:
        vector = vector / norm
    return vector.tolist()


def analyze_fashion_dna(
    face_traits: dict[str, Any] | None = None,
    body_traits: dict[str, Any] | None = None,
    preferences: dict[str, Any] | None = None,
    history: dict[str, Any] | None = None,
) -> dict[str, Any]:
    """
    Analyze Fashion DNA from user signals.

    Returns styleType, colorAffinity, brandAffinity, categoryAffinity,
    budgetRange, fashionConfidenceScore, and activityTraits.
    Embedding generation is handled by FashionDnaVectorService.
    """
    face = face_traits or {}
    body = body_traits or {}
    prefs = preferences or {}
    hist = history or {}

    if not _has_behavioral_activity(hist):
        hist = hist or {}
        hist.setdefault("activity_volume", {})

    style_type = _derive_style_type(prefs, body)
    color_result = _derive_color_affinity(prefs, hist, body)
    color_affinity_map = color_result["colorAffinity"]
    category_affinity = _derive_category_affinity(prefs, hist)
    brand_affinity = _derive_brand_affinity(prefs, hist)
    budget_range = _derive_budget_range(prefs, hist)
    personality_result = fashion_personality.analyze_fashion_personality(
        preferences=prefs,
        history=hist,
        brand_affinity=brand_affinity,
        budget_range=budget_range,
        body_traits=body,
    )
    confidence_components = _derive_confidence_components(face, body, prefs, hist)
    fashion_confidence_score = _derive_confidence_score(face, body, prefs, hist)
    activity_traits = _build_activity_traits(
        hist,
        confidence_components=confidence_components,
        fashion_confidence_score=fashion_confidence_score,
    )
    activity_traits["favorite_brands"] = brand_affinity
    activity_traits["topColors"] = color_result["topColors"]
    activity_traits["colorAffinityScore"] = color_result["colorAffinityScore"]
    activity_traits["fashionPersonality"] = personality_result["fashionPersonality"]

    return {
        "styleType": personality_result["styleType"],
        "fashionPersonality": personality_result["fashionPersonality"],
        "colorAffinity": color_affinity_map,
        "topColors": color_result["topColors"],
        "colorAffinityScore": color_result["colorAffinityScore"],
        "brandAffinity": brand_affinity,
        "categoryAffinity": category_affinity,
        "budgetRange": budget_range,
        "fashionConfidenceScore": fashion_confidence_score,
        "activityTraits": activity_traits,
    }
