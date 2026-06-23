"""Color affinity engine — ranks colors from onboarding and shopping activity."""

from __future__ import annotations

import re
from typing import Any

MIN_SCORE = 0
MAX_SCORE = 100
MAX_COLOR_AFFINITY = 10


def _normalize_key(value: str) -> str:
    return re.sub(r"\s+", " ", str(value or "").strip().lower())


def _normalize_color_key(color: Any) -> str | None:
    key = _normalize_key(str(color or ""))
    return key or None


def _clamp_score(value: float) -> float:
    return float(max(MIN_SCORE, min(MAX_SCORE, value)))


def _increment_color_count(
    counts: dict[str, int],
    color_key: str | None,
    amount: int = 1,
) -> None:
    if not color_key:
        return

    counts[color_key] = counts.get(color_key, 0) + amount


def _extract_colors_from_item(item: dict[str, Any]) -> list[str]:
    colors: list[str] = []

    single_color = _normalize_color_key(item.get("color"))
    if single_color:
        colors.append(single_color)

    for color in item.get("colors") or []:
        normalized = _normalize_color_key(color)
        if normalized:
            colors.append(normalized)

    return colors


def _count_onboarding_colors(preferences: dict[str, Any]) -> dict[str, int]:
    counts: dict[str, int] = {}

    for color in preferences.get("favorite_colors") or []:
        _increment_color_count(counts, _normalize_color_key(color))

    return counts


def _count_activity_colors(history: dict[str, Any]) -> dict[str, int]:
    counts: dict[str, int] = {}

    for order in history.get("orders") or []:
        if isinstance(order, dict):
            for color_key in _extract_colors_from_item(order):
                _increment_color_count(counts, color_key)

    for item in history.get("wishlist") or []:
        if isinstance(item, dict):
            for color_key in _extract_colors_from_item(item):
                _increment_color_count(counts, color_key)

    for view in history.get("product_views") or []:
        if isinstance(view, dict):
            for color_key in _extract_colors_from_item(view):
                _increment_color_count(counts, color_key)

    return counts


def _merge_color_counts(*sources: dict[str, int]) -> dict[str, int]:
    merged: dict[str, int] = {}

    for source in sources:
        for color_key, frequency in source.items():
            merged[color_key] = merged.get(color_key, 0) + frequency

    return merged


def _rank_top_colors(
    color_counts: dict[str, int],
    limit: int = MAX_COLOR_AFFINITY,
) -> list[str]:
    if not color_counts:
        return []

    ranked = sorted(
        color_counts.items(),
        key=lambda entry: (-entry[1], entry[0]),
    )[:limit]

    return [color for color, _ in ranked]


def _rank_color_affinity(
    color_counts: dict[str, int],
    limit: int = MAX_COLOR_AFFINITY,
) -> dict[str, float]:
    if not color_counts:
        return {}

    ranked = sorted(
        color_counts.items(),
        key=lambda entry: (-entry[1], entry[0]),
    )[:limit]

    total = sum(frequency for _, frequency in ranked)
    if total <= 0:
        return {}

    return {
        color: round(frequency / total, 4)
        for color, frequency in ranked
    }


def _derive_color_affinity_score(
    merged_counts: dict[str, int],
    onboarding_counts: dict[str, int],
    activity_counts: dict[str, int],
) -> int:
    if not merged_counts:
        return 0

    total_signals = sum(merged_counts.values())
    unique_colors = len(merged_counts)

    source_score = 0.0
    if onboarding_counts:
        source_score += 30.0
    if activity_counts:
        source_score += 30.0

    volume_score = min(25.0, total_signals * 5.0)
    diversity_score = min(15.0, unique_colors * 3.0)

    return int(_clamp_score(round(source_score + volume_score + diversity_score)))


def analyze_color_affinity(
    preferences: dict[str, Any] | None = None,
    history: dict[str, Any] | None = None,
) -> dict[str, Any]:
    """
    Analyze color affinity from onboarding favorites and shopping activity.

    Returns topColors, colorAffinityScore, and colorAffinity (ranked weights).
    """
    prefs = preferences or {}
    hist = history or {}

    onboarding_counts = _count_onboarding_colors(prefs)
    activity_counts = _count_activity_colors(hist)
    merged_counts = _merge_color_counts(onboarding_counts, activity_counts)

    top_colors = _rank_top_colors(merged_counts)
    color_affinity = _rank_color_affinity(merged_counts)
    color_affinity_score = _derive_color_affinity_score(
        merged_counts,
        onboarding_counts,
        activity_counts,
    )

    return {
        "topColors": top_colors,
        "colorAffinityScore": color_affinity_score,
        "colorAffinity": color_affinity,
    }
