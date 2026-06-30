"""Fit recommendations generated from body type and body shape."""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

from app.services.body_fit_insights import generate_body_fit_insights
from app.services.body_shape_classifier import (
    BODY_SHAPE_INVERTED_TRIANGLE,
    BODY_SHAPE_LABELS,
    BODY_SHAPE_OVAL,
    BODY_SHAPE_RECTANGLE,
    BODY_SHAPE_TRAPEZOID,
    BODY_SHAPE_TRIANGLE,
)
from app.services.body_type_classifier import (
    BODY_TYPE_ATHLETIC,
    BODY_TYPE_AVERAGE,
    BODY_TYPE_LABELS,
    BODY_TYPE_MUSCULAR,
    BODY_TYPE_PLUS_SIZE,
    BODY_TYPE_SLIM,
)

FIT_SECTION_ORDER: tuple[tuple[str, str], ...] = (
    ("tops", "Tops"),
    ("bottoms", "Bottoms"),
    ("outerwear", "Outerwear"),
    ("formal", "Formal"),
    ("casual", "Casual"),
    ("footwear", "Footwear"),
)

SectionContent = dict[str, Any]

SHAPE_SECTION_BASE: dict[str, dict[str, SectionContent]] = {
    BODY_SHAPE_RECTANGLE: {
        "tops": {
            "fit": "Regular fit with light waist definition",
            "recommendations": [
                "Peplum and wrap tops",
                "Soft structured blouses",
                "Vertical stripe knits",
                "Henleys with subtle taper",
            ],
            "tips": [
                "Semi-tuck tops to create waist shape",
                "Use color blocking to add dimension",
            ],
            "avoid": ["Boxy oversized tops without structure"],
        },
        "bottoms": {
            "fit": "Mid-rise with gentle taper",
            "recommendations": [
                "Straight-leg trousers",
                "Bootcut jeans",
                "A-line skirts",
                "Pleated midi skirts",
            ],
            "tips": [
                "Choose bottoms with pocket and seam detail",
                "Balance proportions with a defined waistband",
            ],
            "avoid": ["Ultra-straight tubular cuts with no shape"],
        },
        "outerwear": {
            "fit": "Structured through shoulders, slight waist shaping",
            "recommendations": [
                "Belted trench coats",
                "Single-breasted wool coats",
                "Cropped moto jackets",
            ],
            "tips": ["Belt outerwear at the waist for contour"],
            "avoid": ["Shapeless cocoon coats"],
        },
        "formal": {
            "fit": "Tailored with soft waist suppression",
            "recommendations": [
                "Single-breasted suits with light darting",
                "Sheath dresses with seaming",
                "Wrap dresses for evening",
            ],
            "tips": ["Prioritize vertical lines and clean lapels"],
            "avoid": ["Rigid boxy suiting with no waist shaping"],
        },
        "casual": {
            "fit": "Easy regular fit with structure",
            "recommendations": [
                "Chore jackets",
                "Camp-collar shirts",
                "Relaxed polos with rib trim",
            ],
            "tips": ["Layer with a lightweight overshirt for shape"],
            "avoid": ["Unstructured oversized hoodies as a default layer"],
        },
        "footwear": {
            "fit": "Balanced heel and toe proportions",
            "recommendations": [
                "Chelsea boots",
                "Low-profile sneakers",
                "Block-heel loafers",
            ],
            "tips": ["Pointed or almond toes add length to the silhouette"],
            "avoid": ["Bulky platform soles on every outfit"],
        },
    },
    BODY_SHAPE_TRIANGLE: {
        "tops": {
            "fit": "Structured shoulders with clean neckline",
            "recommendations": [
                "Boat neck and off-shoulder tops",
                "Structured blazers worn open",
                "Horizontal stripe knits",
                "Embellished shoulder detail",
            ],
            "tips": [
                "Draw attention upward with brighter top colors",
                "Keep hemlines at hip or above",
            ],
            "avoid": ["Tight clingy fabrics through the hip line"],
        },
        "bottoms": {
            "fit": "Relaxed through hip and thigh, clean taper below knee",
            "recommendations": [
                "Dark straight-leg denim",
                "Wide-leg trousers",
                "A-line and flared skirts",
                "Bootcut pants",
            ],
            "tips": [
                "Choose solid darker washes below the waist",
                "Use mid or high rise for support",
            ],
            "avoid": ["Skinny jeans with heavy pocket detailing at the hip"],
        },
        "outerwear": {
            "fit": "Strong shoulder line, minimal bulk at hem",
            "recommendations": [
                "Structured blazers",
                "Cropped jackets",
                "Shoulder-detail coats",
            ],
            "tips": ["Keep outerwear hem above the widest hip point when possible"],
            "avoid": ["Long unbelted coats that widen at the hip"],
        },
        "formal": {
            "fit": "Balanced upper structure with flowing lower silhouette",
            "recommendations": [
                "A-line formal dresses",
                "Wide-leg formal trousers with crisp tops",
                "Tuxedo-inspired jackets with drape trousers",
            ],
            "tips": ["Pair fitted or structured tops with fuller bottoms"],
            "avoid": ["Pencil skirts that emphasize hip width"],
        },
        "casual": {
            "fit": "Relaxed lower body, defined upper frame",
            "recommendations": [
                "Denim jackets",
                "Graphic tees with structured sleeves",
                "Flowy casual blouses",
            ],
            "tips": ["Balance volume below with cleaner lines above"],
            "avoid": ["Hip-heavy cargo detailing on both top and bottom"],
        },
        "footwear": {
            "fit": "Medium to slightly chunky sole for balance",
            "recommendations": [
                "Ankle boots with slight heel",
                "Platform sneakers",
                "Knee-high boots",
            ],
            "tips": ["Add visual weight below to balance broader hips"],
            "avoid": ["Delicate ultra-pointed flats on wide-leg bottoms"],
        },
    },
    BODY_SHAPE_INVERTED_TRIANGLE: {
        "tops": {
            "fit": "Relaxed through shoulders and chest",
            "recommendations": [
                "V-neck and scoop-neck tops",
                "Vertical drape blouses",
                "Raglan and dolman sleeves",
                "Soft knit tees",
            ],
            "tips": [
                "Keep shoulder detail minimal",
                "Use darker colors above the waist",
            ],
            "avoid": ["Heavy shoulder pads and epaulettes"],
        },
        "bottoms": {
            "fit": "Adds volume through hip and leg",
            "recommendations": [
                "Wide-leg trousers",
                "Cargo and utility pants",
                "Pleated skirts",
                "Relaxed tapered denim",
            ],
            "tips": [
                "Use pattern or texture below the waist",
                "Prefer mid-rise for proportion balance",
            ],
            "avoid": ["Ultra-skinny bottoms that over-emphasize shoulders"],
        },
        "outerwear": {
            "fit": "Minimal shoulder structure, longer hem",
            "recommendations": [
                "Unstructured car coats",
                "Waterfall cardigan coats",
                "Hip-length parkas",
            ],
            "tips": ["Choose coats without strong shoulder padding"],
            "avoid": ["Double-breasted broad-shoulder overcoats"],
        },
        "formal": {
            "fit": "Clean upper line with fuller lower silhouette",
            "recommendations": [
                "Wide-leg suiting",
                "Bias-cut skirts with soft tops",
                "Wrap dresses with lower volume emphasis",
            ],
            "tips": ["Soften the upper body with drape and open necklines"],
            "avoid": ["Sharp padded blazer shoulders with slim trousers"],
        },
        "casual": {
            "fit": "Easy drape above, relaxed leg line below",
            "recommendations": [
                "Open overshirts",
                "Soft hoodies without shoulder seams",
                "Relaxed chinos",
            ],
            "tips": ["Layer lightweight pieces instead of bulky shoulder layers"],
            "avoid": ["Rugby shirts with strong shoulder stripes"],
        },
        "footwear": {
            "fit": "Grounded soles with visual weight",
            "recommendations": [
                "Chunky sneakers",
                "Desert boots",
                "Loafers with thicker soles",
            ],
            "tips": ["Add substance below to balance broad shoulders"],
            "avoid": ["Very delicate narrow footwear with wide tops"],
        },
    },
    BODY_SHAPE_OVAL: {
        "tops": {
            "fit": "Skims the torso without clinging",
            "recommendations": [
                "Empire waist tops",
                "Open-front cardigans",
                "Vertical rib knits",
                "Tunics with side slits",
            ],
            "tips": [
                "Create length with vertical seams and V-necks",
                "Leave the last button open on shirts",
            ],
            "avoid": ["Tight waist-cling fabrics and wide horizontal belts"],
        },
        "bottoms": {
            "fit": "Mid-rise with smooth waistband",
            "recommendations": [
                "Straight-leg trousers",
                "Bootcut denim",
                "A-line skirts",
                "Full-length wide legs with flat front",
            ],
            "tips": [
                "Choose flat-front styles for a cleaner midsection",
                "Keep rises consistent for comfort",
            ],
            "avoid": ["Low-rise tight waistbands"],
        },
        "outerwear": {
            "fit": "Longline with open front",
            "recommendations": [
                "Single-breasted long coats",
                "Waterfall cardigans",
                "Lightweight dusters",
            ],
            "tips": ["Wear outerwear open to create vertical lines"],
            "avoid": ["Belted coats that gather at the midsection"],
        },
        "formal": {
            "fit": "Elongating silhouette with gentle drape",
            "recommendations": [
                "Empire waist dresses",
                "Single-breasted suits with longline jackets",
                "Column dresses with strategic ruching",
            ],
            "tips": ["Use monochrome or tonal dressing for continuity"],
            "avoid": ["Heavy waist emphasis and cropped formal jackets"],
        },
        "casual": {
            "fit": "Comfort-forward with vertical structure",
            "recommendations": [
                "Longline shirts",
                "Soft knit polos",
                "Relaxed straight chinos",
            ],
            "tips": ["Layer long pieces instead of cropped casual tops"],
            "avoid": ["Tight cropped tees paired with low-rise bottoms"],
        },
        "footwear": {
            "fit": "Elongating toe shape with stable base",
            "recommendations": [
                "Pointed flats",
                "Low block heels",
                "Sleek leather sneakers",
            ],
            "tips": ["Nude or tonal footwear extends the leg line"],
            "avoid": ["Ankle straps that cut the leg line horizontally"],
        },
    },
    BODY_SHAPE_TRAPEZOID: {
        "tops": {
            "fit": "Fitted shoulders with tapered waist",
            "recommendations": [
                "Tailored dress shirts",
                "Athletic-fit polos",
                "Structured crew neck knits",
                "Zip polos and quarter-zips",
            ],
            "tips": [
                "Highlight the natural V-taper",
                "Keep shoulder seams aligned with your frame",
            ],
            "avoid": ["Overly baggy tops that hide your taper"],
        },
        "bottoms": {
            "fit": "Slim to straight through hip with clean taper",
            "recommendations": [
                "Slim straight denim",
                "Tapered chinos",
                "Tailored trousers",
                "Flat-front shorts with moderate width",
            ],
            "tips": [
                "Balance broad shoulders with clean leg lines",
                "Avoid excess fabric at the thigh",
            ],
            "avoid": ["Extremely wide or overly baggy bottoms"],
        },
        "outerwear": {
            "fit": "Defined shoulders with slight waist suppression",
            "recommendations": [
                "Bomber jackets",
                "Structured denim jackets",
                "Tailored wool blazers",
            ],
            "tips": ["Cropped or waist-length jackets complement the taper"],
            "avoid": ["Oversized boxy coats that hide shoulder definition"],
        },
        "formal": {
            "fit": "Classic tailored proportions",
            "recommendations": [
                "Slim-fit suits",
                "Two-button jackets with tapered trousers",
                "Spread-collar dress shirts",
            ],
            "tips": ["Prioritize jacket waist suppression and clean trouser break"],
            "avoid": ["Relaxed boxy suiting with wide pleated trousers"],
        },
        "casual": {
            "fit": "Athletic casual with structure",
            "recommendations": [
                "Fitted henleys",
                "Slim joggers with tapered cuffs",
                "Field jackets",
            ],
            "tips": ["Show the shoulder-to-waist taper with fitted layers"],
            "avoid": ["Shapeless oversized sweatsets"],
        },
        "footwear": {
            "fit": "Proportional sleek to medium profile",
            "recommendations": [
                "Chelsea boots",
                "Minimal leather sneakers",
                "Cap-toe oxfords",
            ],
            "tips": ["Clean lines support the athletic taper"],
            "avoid": ["Overly bulky footwear that competes with shoulders"],
        },
    },
}

TYPE_SECTION_ADJUSTMENTS: dict[str, dict[str, SectionContent]] = {
    BODY_TYPE_SLIM: {
        "tops": {
            "fit": "Slim fit",
            "add_recommendations": ["Fine-gauge merino layers", "Slim oxford shirts"],
            "add_tips": ["Add light layering for dimension without bulk"],
        },
        "bottoms": {
            "fit": "Slim straight",
            "add_recommendations": ["Slim chinos", "Tapered denim"],
        },
        "outerwear": {
            "fit": "Slim tailored",
            "add_recommendations": ["Slim quilted liners"],
        },
        "formal": {
            "fit": "Slim tailored",
            "add_tips": ["Keep lapel width moderate to frame a narrower frame"],
        },
        "casual": {
            "fit": "Slim casual",
            "add_recommendations": ["Slim-fit tees", "Tailored sweatshirts"],
        },
        "footwear": {
            "fit": "Sleek profile",
            "add_recommendations": ["Low-profile leather sneakers"],
        },
    },
    BODY_TYPE_ATHLETIC: {
        "tops": {
            "fit": "Athletic fit with stretch",
            "add_recommendations": ["Performance polos", "Stretch woven shirts"],
            "add_tips": ["Prioritize stretch recovery in shoulder and chest"],
        },
        "bottoms": {
            "fit": "Athletic taper",
            "add_recommendations": ["Athletic-fit chinos", "Stretch denim"],
        },
        "outerwear": {
            "fit": "Athletic structured",
            "add_recommendations": ["Stretch blazers", "Lightweight performance shells"],
        },
        "formal": {
            "fit": "Athletic tailored",
            "add_tips": ["Choose jackets with stretch panels or athletic block"],
        },
        "casual": {
            "fit": "Athletic casual",
            "add_recommendations": ["Tech fleece layers", "Performance joggers"],
        },
        "footwear": {
            "fit": "Supportive athletic casual",
            "add_recommendations": ["Cross-training inspired sneakers"],
        },
    },
    BODY_TYPE_AVERAGE: {
        "tops": {"fit": "Regular fit"},
        "bottoms": {"fit": "Regular straight"},
        "outerwear": {"fit": "Regular structured"},
        "formal": {"fit": "Regular tailored"},
        "casual": {"fit": "Regular casual"},
        "footwear": {"fit": "Versatile everyday"},
    },
    BODY_TYPE_MUSCULAR: {
        "tops": {
            "fit": "Relaxed chest with tapered waist",
            "add_recommendations": ["Stretch dress shirts", "Raglan workout polos"],
            "add_tips": ["Size for chest and shoulder, tailor the waist"],
        },
        "bottoms": {
            "fit": "Athletic thigh with taper",
            "add_recommendations": ["Athletic-cut trousers", "Stretch slim denim"],
        },
        "outerwear": {
            "fit": "Roomy shoulders, shaped waist",
            "add_recommendations": ["Stretch wool blazers", "Layer-friendly overcoats"],
        },
        "formal": {
            "fit": "Athletic formal",
            "add_tips": ["Look for athletic-fit suiting or mobile stretch cloth"],
        },
        "casual": {
            "fit": "Relaxed athletic",
            "add_recommendations": ["Heavyweight tees", "Relaxed tapered joggers"],
        },
        "footwear": {
            "fit": "Stable medium profile",
            "add_recommendations": ["Supportive leather sneakers"],
        },
    },
    BODY_TYPE_PLUS_SIZE: {
        "tops": {
            "fit": "Comfort-forward with structure",
            "add_recommendations": ["Wrap tops", "Soft structured tunics"],
            "add_tips": ["Choose fabrics with drape and recovery"],
        },
        "bottoms": {
            "fit": "Comfort taper with stretch waist",
            "add_recommendations": ["Stretch waist trousers", "Bootcut denim"],
        },
        "outerwear": {
            "fit": "Longline structured",
            "add_recommendations": ["Single-breasted long coats"],
        },
        "formal": {
            "fit": "Comfort tailored",
            "add_tips": ["Prioritize clean vertical seaming and full-length lines"],
        },
        "casual": {
            "fit": "Relaxed comfort",
            "add_recommendations": ["Soft brushed flannels", "Comfort waist chinos"],
        },
        "footwear": {
            "fit": "Supportive cushioned",
            "add_recommendations": ["Cushioned loafers", "Supportive walking sneakers"],
        },
    },
}

SUMMARY_TEMPLATES = {
    BODY_SHAPE_RECTANGLE: "Your rectangle proportions are balanced across shoulders, waist, and hips. Focus on adding gentle waist definition and vertical structure.",
    BODY_SHAPE_TRIANGLE: "Your triangle shape carries more volume through the hips. Balance the silhouette with structure and interest above the waist.",
    BODY_SHAPE_INVERTED_TRIANGLE: "Your inverted triangle shape is broader through the shoulders. Soften the upper body and add volume below the waist for balance.",
    BODY_SHAPE_OVAL: "Your oval shape gathers volume through the midsection. Prioritize vertical lines, open layers, and skimming fits.",
    BODY_SHAPE_TRAPEZOID: "Your trapezoid shape has a strong shoulder-to-waist taper. Lean into tailored pieces that follow your natural V-frame.",
}

TYPE_SUMMARY_ADJUSTMENTS = {
    BODY_TYPE_SLIM: "Favor slimmer cuts and lightweight layers to maintain proportion.",
    BODY_TYPE_ATHLETIC: "Choose stretch and athletic-tailored fits for mobility and clean lines.",
    BODY_TYPE_AVERAGE: "Regular fits across categories will give you the most versatility.",
    BODY_TYPE_MUSCULAR: "Size for chest and shoulders, then taper the waist for a polished fit.",
    BODY_TYPE_PLUS_SIZE: "Prioritize comfort-forward fabrics with structure and vertical flow.",
}


def _resolve_body_type_code(body_type: str | None, body_type_code: str | None) -> str | None:
    if body_type_code:
        return body_type_code.upper().replace(" ", "_")

    if not body_type:
        return None

    normalized = body_type.strip().lower()
    for code, label in BODY_TYPE_LABELS.items():
        if label.lower() == normalized:
            return code

    return body_type.upper().replace(" ", "_")


def _resolve_body_shape_code(body_shape: str | None, body_shape_code: str | None) -> str | None:
    if body_shape_code:
        return body_shape_code.upper().replace(" ", "_")

    if not body_shape:
        return None

    normalized = body_shape.strip().lower()
    for code, label in BODY_SHAPE_LABELS.items():
        if label.lower() == normalized:
            return code

    return body_shape.upper().replace(" ", "_")


def _merge_section(base: SectionContent, adjustment: SectionContent | None) -> SectionContent:
    merged: SectionContent = {
        "fit": adjustment.get("fit") if adjustment and adjustment.get("fit") else base.get("fit"),
        "recommendations": list(base.get("recommendations", [])),
        "tips": list(base.get("tips", [])),
        "avoid": list(base.get("avoid", [])),
    }

    if not adjustment:
        return merged

    if adjustment.get("add_recommendations"):
        merged["recommendations"].extend(adjustment["add_recommendations"])
    if adjustment.get("add_tips"):
        merged["tips"].extend(adjustment["add_tips"])
    if adjustment.get("add_avoid"):
        merged["avoid"].extend(adjustment["add_avoid"])

    # Deduplicate while preserving order.
    for key in ("recommendations", "tips", "avoid"):
        seen: set[str] = set()
        unique: list[str] = []
        for item in merged[key]:
            if item not in seen:
                seen.add(item)
                unique.append(item)
        merged[key] = unique

    return merged


def _build_summary(shape_code: str | None, type_code: str | None) -> str:
    parts: list[str] = []

    if shape_code and shape_code in SUMMARY_TEMPLATES:
        parts.append(SUMMARY_TEMPLATES[shape_code])

    if type_code and type_code in TYPE_SUMMARY_ADJUSTMENTS:
        parts.append(TYPE_SUMMARY_ADJUSTMENTS[type_code])

    return " ".join(parts) if parts else "Fit recommendations based on your body type and shape."


def _build_measurement_adjustments(
    measurements: dict[str, float | None] | None,
    body_type_ratios: dict[str, float] | None,
    body_shape_ratios: dict[str, float] | None,
) -> dict[str, SectionContent]:
    """Dynamic fit tweaks from measured ratios — not generic placeholders."""
    adjustments: dict[str, SectionContent] = {}

    shoulder = float(measurements.get("shoulderWidth") or 0) if measurements else 0
    waist = float(measurements.get("waist") or 0) if measurements else 0
    chest = float(measurements.get("chest") or 0) if measurements else 0
    height = float(measurements.get("height") or 0) if measurements else 0

    shoulder_to_waist = None
    if body_type_ratios and body_type_ratios.get("shoulderToWaist"):
        shoulder_to_waist = float(body_type_ratios["shoulderToWaist"])
    elif shoulder > 0 and waist > 0:
        shoulder_to_waist = shoulder / waist

    if shoulder_to_waist and shoulder_to_waist >= 1.45:
        adjustments["tops"] = {
            "add_recommendations": [
                "V-neck and open-collar shirts to balance broad shoulders",
                "Structured shoulders with tapered waist",
            ],
            "add_tips": [
                f"Your shoulder-to-waist ratio ({shoulder_to_waist:.2f}) suggests emphasizing vertical lines through the torso.",
            ],
        }
        adjustments["outerwear"] = {
            "add_recommendations": ["Structured jackets with clean shoulder lines"],
        }

    if shoulder_to_waist and shoulder_to_waist <= 1.15:
        adjustments["tops"] = {
            "add_recommendations": [
                "Layered tops and horizontal detail to add upper-body structure",
                "Boat necks and wider collars",
            ],
        }

    if chest and waist and chest > 0:
        chest_waist_diff = chest - waist
        if chest_waist_diff >= 14:
            adjustments["formal"] = {
                "add_recommendations": ["Athletic-fit suiting sized for chest with waist suppression"],
                "add_tips": ["Size jackets by chest measurement, then tailor the waist."],
            }
            adjustments["bottoms"] = {
                "add_recommendations": ["Straight or athletic-taper jeans"],
            }

    if height and height >= 185:
        adjustments["bottoms"] = {
            "add_tips": ["Choose long or tall inseams to match your leg length."],
        }
    elif height and height <= 168:
        adjustments["bottoms"] = {
            "add_tips": ["Avoid excess stacking at the ankle — choose shorter inseams or tapered hems."],
        }

    shape_ratios = body_shape_ratios or {}
    shoulder_to_hip = shape_ratios.get("shoulderToHip")
    if shoulder_to_hip and float(shoulder_to_hip) >= 1.12:
        adjustments.setdefault("tops", {})
        adjustments["tops"].setdefault("add_recommendations", [])
        adjustments["tops"]["add_recommendations"].append("Straight-fit jeans and structured overshirts for inverted-triangle balance")

    return adjustments


def generate_fit_profile(
    body_type: str | None,
    body_shape: str | None,
    *,
    body_type_code: str | None = None,
    body_shape_code: str | None = None,
    measurements: dict[str, float | None] | None = None,
    body_type_ratios: dict[str, float] | None = None,
    body_shape_ratios: dict[str, float] | None = None,
    width_measurements: dict[str, float] | None = None,
) -> dict[str, Any] | None:
    """Generate measurement-driven fit guide (schema v2)."""
    return generate_body_fit_insights(
        body_type=body_type,
        body_shape=body_shape,
        body_type_code=body_type_code,
        body_shape_code=body_shape_code,
        measurements=measurements,
        body_type_ratios=body_type_ratios,
        body_shape_ratios=body_shape_ratios,
        width_measurements=width_measurements,
    )


def _generate_fit_profile_legacy(
    body_type: str | None,
    body_shape: str | None,
    *,
    body_type_code: str | None = None,
    body_shape_code: str | None = None,
    measurements: dict[str, float | None] | None = None,
    body_type_ratios: dict[str, float] | None = None,
    body_shape_ratios: dict[str, float] | None = None,
) -> dict[str, Any] | None:
    shape_code = _resolve_body_shape_code(body_shape, body_shape_code)
    type_code = _resolve_body_type_code(body_type, body_type_code)

    if not shape_code or shape_code not in SHAPE_SECTION_BASE:
        return None

    shape_sections = SHAPE_SECTION_BASE[shape_code]
    type_sections = TYPE_SECTION_ADJUSTMENTS.get(type_code or "", {})
    measurement_sections = _build_measurement_adjustments(
        measurements,
        body_type_ratios,
        body_shape_ratios,
    )

    sections: list[dict[str, Any]] = []
    for section_id, title in FIT_SECTION_ORDER:
        base = shape_sections.get(section_id)
        if not base:
            continue

        content = _merge_section(base, type_sections.get(section_id))
        content = _merge_section(content, measurement_sections.get(section_id))
        sections.append(
            {
                "id": section_id,
                "title": title,
                "fit": content.get("fit"),
                "recommendations": content.get("recommendations", []),
                "tips": content.get("tips", []),
                "avoid": content.get("avoid", []),
            }
        )

    return {
        "schemaVersion": 1,
        "bodyType": body_type or BODY_TYPE_LABELS.get(type_code or "", body_type),
        "bodyShape": body_shape or BODY_SHAPE_LABELS.get(shape_code or "", body_shape),
        "bodyTypeCode": type_code,
        "bodyShapeCode": shape_code,
        "summary": _build_summary(shape_code, type_code),
        "sections": sections,
        "generatedAt": datetime.now(timezone.utc).isoformat(),
    }
