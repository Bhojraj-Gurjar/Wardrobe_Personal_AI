"""Garment size recommendations from estimated body measurements."""

from __future__ import annotations

from typing import Any

CM_PER_INCH = 2.54

# Men's US sizing bands (chest circumference cm).
SHIRT_SIZE_BANDS: list[tuple[str, float, float]] = [
    ("XS", 0, 88),
    ("S", 88, 96),
    ("M", 96, 104),
    ("L", 104, 112),
    ("XL", 112, 120),
    ("XXL", 120, 128),
    ("3XL", 128, 999),
]

JACKET_SIZE_BANDS: list[tuple[str, float, float]] = [
    ("XS", 0, 92),
    ("S", 92, 100),
    ("M", 100, 108),
    ("L", 108, 116),
    ("XL", 116, 124),
    ("XXL", 124, 132),
    ("3XL", 132, 999),
]

# Waist circumference (cm) → US pant size (inches).
PANT_SIZE_BANDS: list[tuple[int, float, float]] = [
    (28, 0, 74),
    (30, 74, 79),
    (32, 79, 84),
    (34, 84, 89),
    (36, 89, 94),
    (38, 94, 99),
    (40, 99, 104),
    (42, 104, 999),
]


def _pick_band(value: float, bands: list[tuple[str, float, float]]) -> str:
    for label, low, high in bands:
        if low <= value < high:
            return label
    return bands[-1][0]


def _pick_pant_size(waist_cm: float) -> int:
    for size, low, high in PANT_SIZE_BANDS:
        if low <= waist_cm < high:
            return size
    return PANT_SIZE_BANDS[-1][0]


def generate_size_recommendations(
    *,
    chest_cm: float | None,
    waist_cm: float | None,
    shoulder_cm: float | None = None,
) -> dict[str, Any] | None:
    if not chest_cm or chest_cm <= 0 or not waist_cm or waist_cm <= 0:
        return None

    shirt = _pick_band(chest_cm, SHIRT_SIZE_BANDS)
    t_shirt = shirt
    jacket = _pick_band(chest_cm + 4, JACKET_SIZE_BANDS)
    pant = _pick_pant_size(waist_cm)
    waist_inches = round(waist_cm / CM_PER_INCH)

    summary_parts = [
        f"Shirt {shirt}",
        f"T-shirt {t_shirt}",
        f"Jacket {jacket}",
        f"Pant {pant}",
    ]

    why = (
        f"Based on your estimated chest ({round(chest_cm)} cm) and waist ({round(waist_cm)} cm) "
        f"from pose landmark analysis calibrated to your height."
    )

    if shoulder_cm and shoulder_cm > 0:
        shoulder_ratio = shoulder_cm / chest_cm if chest_cm else 0
        if shoulder_ratio >= 0.46:
            why += " Broad shoulders suggest sizing for chest and tapering the waist in jackets."

    return {
        "shirt": shirt,
        "tShirt": t_shirt,
        "jacket": jacket,
        "pant": pant,
        "pantWaistInches": pant,
        "waistInches": waist_inches,
        "summary": " · ".join(summary_parts),
        "why": why,
    }
