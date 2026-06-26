"""Dynamic personalised fit guide generated from actual body analysis measurements."""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

FIT_SECTIONS = (
    ("tops", "Tops"),
    ("bottoms", "Bottoms"),
    ("outerwear", "Outerwear"),
    ("formal", "Formal"),
    ("casual", "Casual"),
    ("footwear", "Footwear"),
)


def _num(value: Any) -> float | None:
    if value is None:
        return None
    if isinstance(value, dict):
        parsed = value.get("value")
    else:
        parsed = value
    try:
        number = float(parsed)
    except (TypeError, ValueError):
        return None
    return number if number > 0 else None


def _normalize_code(value: str | None) -> str:
    return str(value or "").strip().upper().replace(" ", "_")


def _normalize_label(value: str | None) -> str:
    return str(value or "").strip().title()


def _pct_diff(larger: float, smaller: float) -> int:
    if smaller <= 0:
        return 0
    return round(((larger - smaller) / smaller) * 100)


def _rec(name: str, confidence: float, reason: str) -> dict[str, Any]:
    return {
        "name": name,
        "confidence": round(max(55, min(98, confidence)), 1),
        "reason": reason,
    }


def _build_context(
    *,
    body_type: str | None,
    body_shape: str | None,
    body_type_code: str | None,
    body_shape_code: str | None,
    measurements: dict[str, Any] | None,
    body_type_ratios: dict[str, float] | None,
    body_shape_ratios: dict[str, float] | None,
    width_measurements: dict[str, float] | None = None,
) -> dict[str, Any]:
    m = measurements or {}
    shoulder = _num(m.get("shoulderWidth"))
    chest = _num(m.get("chest"))
    waist = _num(m.get("waist"))
    hip = _num(m.get("hip"))
    height = _num(m.get("height"))
    arm = _num(m.get("armLength"))
    leg = _num(m.get("legLength"))

    widths = width_measurements or {}
    shoulder_w = _num(widths.get("shoulderWidth")) or shoulder
    waist_w = _num(widths.get("waist")) or (waist / 2.35 if waist else None)
    chest_w = _num(widths.get("chest")) or (chest / 2.55 if chest else None)

    shoulder_to_waist = None
    if body_type_ratios and body_type_ratios.get("shoulderToWaist"):
        shoulder_to_waist = float(body_type_ratios["shoulderToWaist"])
    elif shoulder_w and waist_w:
        shoulder_to_waist = shoulder_w / waist_w

    waist_to_hip = None
    if body_shape_ratios and body_shape_ratios.get("waistToHip"):
        waist_to_hip = float(body_shape_ratios["waistToHip"])
    elif waist and hip:
        waist_to_hip = waist / hip

    shoulder_to_hip = None
    if body_shape_ratios and body_shape_ratios.get("shoulderToHip"):
        shoulder_to_hip = float(body_shape_ratios["shoulderToHip"])
    elif shoulder_w and hip:
        shoulder_to_hip = shoulder_w / hip

    leg_ratio = (leg / height) if leg and height else None
    chest_waist_diff = (chest - waist) if chest and waist else None

    height_band = "average"
    if height and height >= 185:
        height_band = "tall"
    elif height and height <= 168:
        height_band = "short"

    type_code = _normalize_code(body_type_code or body_type)
    shape_code = _normalize_code(body_shape_code or body_shape)

    broad_shoulders = bool(
        shoulder_to_waist and shoulder_to_waist >= 1.18
    ) or shape_code in {"INVERTED_TRIANGLE", "TRAPEZOID"}

    athletic_build = (
        type_code == "ATHLETIC"
        or type_code == "MUSCULAR"
        or (chest_waist_diff is not None and chest_waist_diff >= 12)
    )

    lean_build = type_code == "SLIM" or (
        chest_waist_diff is not None and chest_waist_diff <= 8
    )

    return {
        "bodyType": _normalize_label(body_type),
        "bodyShape": _normalize_label(body_shape),
        "bodyTypeCode": type_code,
        "bodyShapeCode": shape_code,
        "shoulder": shoulder,
        "chest": chest,
        "waist": waist,
        "hip": hip,
        "height": height,
        "arm": arm,
        "leg": leg,
        "shoulderToWaist": shoulder_to_waist,
        "waistToHip": waist_to_hip,
        "shoulderToHip": shoulder_to_hip,
        "legRatio": leg_ratio,
        "chestWaistDiff": chest_waist_diff,
        "heightBand": height_band,
        "broadShoulders": broad_shoulders,
        "athleticBuild": athletic_build,
        "leanBuild": lean_build,
    }


def _build_tops(ctx: dict[str, Any]) -> dict[str, Any]:
    recs: list[dict[str, Any]] = []
    avoid: list[str] = []
    keywords: list[str] = []

    sw = ctx.get("shoulderToWaist")
    chest = ctx.get("chest")
    waist = ctx.get("waist")

    if ctx["athleticBuild"]:
        pct = _pct_diff(ctx["shoulder"] or chest or 0, waist or 1) if ctx.get("shoulder") and waist else 15
        recs.extend([
            _rec(
                "Slim Fit T-Shirts",
                92,
                f"Athletic Fit Shirts are recommended because your shoulder width is {pct}% wider than your waist, creating a V-shaped silhouette.",
            ),
            _rec(
                "Athletic Fit Shirts",
                90,
                f"Your {ctx['bodyType']} build ({round(chest or 0)} cm chest, {round(waist or 0)} cm waist) benefits from stretch fabrics that follow your frame without pulling.",
            ),
            _rec("Stretch Cotton Shirts", 88, "Stretch weaves accommodate chest and shoulder development while keeping the waist clean."),
            _rec("Henley Tees", 84, "Henleys add vertical detail that complements a tapered athletic torso."),
            _rec("Polo Shirts", 82, "Structured polo collars balance broader shoulders with a defined waist."),
        ])
        avoid.extend(["Oversized boxy fits", "Excessively loose shirts", "Heavy drop-shoulder tees"])
        keywords.extend(["slim fit", "athletic", "stretch", "henley", "polo", "fitted"])
    elif ctx["leanBuild"]:
        recs.extend([
            _rec("Regular Fit Tees", 89, f"Your lean {ctx['bodyType']} frame suits clean regular fits that add subtle structure without bulk."),
            _rec("Lightweight Oxford Shirts", 86, "Oxford cloth adds visual weight to a slim upper body."),
            _rec("Layer-Friendly Henleys", 83, "Layering creates dimension on a lean silhouette."),
        ])
        avoid.extend(["Overly baggy oversized tops", "Heavy structured shoulders"])
        keywords.extend(["regular fit", "oxford", "henley", "lightweight"])
    elif ctx["broadShoulders"]:
        pct = _pct_diff(ctx["shoulder"] or 0, waist or 1) if ctx.get("shoulder") and waist else 18
        recs.extend([
            _rec("V-Neck Tees", 91, f"V-necks soften a broad shoulder line — your shoulder-to-waist ratio is {sw:.2f}." if sw else "V-necks soften a broad shoulder line."),
            _rec("Open Collar Shirts", 89, f"Open collars reduce visual width at the shoulders ({pct}% broader than waist)."),
            _rec("Vertical Stripe Knits", 87, "Vertical lines lengthen and balance a wider upper body."),
        ])
        avoid.extend(["Boat necks", "Heavy shoulder padding", "Cap sleeves"])
        keywords.extend(["v-neck", "open collar", "vertical stripe", "regular fit"])
    else:
        recs.extend([
            _rec("Regular Fit Shirts", 88, f"Balanced proportions ({ctx['bodyShape']} shape) work well with versatile regular-fit tops."),
            _rec("Classic Crew Neck Tees", 85, "Crew necks maintain proportion across your chest and shoulder measurements."),
            _rec("Smart Casual Polos", 82, "Polos bridge casual and structured styling for your body profile."),
        ])
        avoid.extend(["Extreme oversized or skin-tight fits"])
        keywords.extend(["regular fit", "crew neck", "polo", "smart casual"])

    if ctx["heightBand"] == "short":
        recs.append(_rec("Cropped Jackets Over Tees", 80, "Shorter proportions benefit from slightly cropped top layers to lengthen the leg line."))
        keywords.append("cropped")

    why = recs[0]["reason"] if recs else f"Top recommendations derived from your {ctx['bodyType']} body type and measured proportions."

    return {
        "id": "tops",
        "title": "Tops",
        "why": why,
        "recommendations": recs[:5],
        "avoid": avoid[:4],
        "productKeywords": keywords,
        "fit": recs[0]["name"] if recs else None,
    }


def _build_bottoms(ctx: dict[str, Any]) -> dict[str, Any]:
    recs: list[dict[str, Any]] = []
    avoid: list[str] = []
    keywords: list[str] = []

    leg_ratio = ctx.get("legRatio")
    waist = ctx.get("waist")
    hip = ctx.get("hip")

    if ctx["athleticBuild"]:
        recs.extend([
            _rec("Tapered Jeans", 95, "Athletic builds with developed thighs need room through the seat that tapers at the ankle."),
            _rec("Athletic Fit Chinos", 92, f"Your {round(waist or 0)} cm waist and narrower lower leg ratio suit athletic-taper chinos."),
            _rec("Straight Fit Trousers", 88, "Straight legs balance a defined waist without clinging to the thigh."),
        ])
        avoid.extend(["Skinny jeans", "Ultra loose baggy fits", "Rigid non-stretch denim"])
        keywords.extend(["tapered", "athletic fit", "straight fit", "stretch", "chino"])
    elif ctx["leanBuild"]:
        recs.extend([
            _rec("Slim Tapered Jeans", 90, "Slim taper follows a lean leg line without excess fabric."),
            _rec("Tailored Chinos", 87, "Clean taper through the leg complements a slim lower body."),
        ])
        avoid.extend(["Wide-leg balloon fits"])
        keywords.extend(["slim", "tapered", "tailored"])
    elif ctx.get("waistToHip") and ctx["waistToHip"] >= 1.02:
        recs.extend([
            _rec("Relaxed Straight Jeans", 88, "A fuller midsection is balanced by straight-leg silhouettes with comfortable rise."),
            _rec("Comfort Stretch Trousers", 85, "Stretch waistbands accommodate hip-to-waist proportions."),
        ])
        avoid.extend(["Ultra low-rise skinny cuts"])
        keywords.extend(["straight", "comfort stretch", "relaxed"])
    else:
        recs.extend([
            _rec("Straight Leg Jeans", 89, f"Your {ctx['bodyShape']} shape pairs well with balanced straight-leg proportions."),
            _rec("Mid-Rise Chinos", 86, "Mid-rise chinos anchor the waist at your measured hip balance point."),
        ])
        avoid.extend(["Extreme skinny or oversized wide-leg defaults"])
        keywords.extend(["straight", "mid-rise", "chino"])

    if leg_ratio and leg_ratio >= 0.48:
        recs.append(_rec("Long Inseam Trousers", 84, f"Your leg length is {round((leg_ratio or 0) * 100)}% of height — longer inseams prevent ankle stacking."))
        keywords.append("long inseam")
    elif leg_ratio and leg_ratio <= 0.44:
        recs.append(_rec("Ankle-Length Tapered Pants", 83, "Shorter leg proportions look cleaner with ankle-length hems."))
        keywords.append("ankle length")

    why = recs[0]["reason"] if recs else "Bottom fits calibrated to your waist, hip, and leg measurements."

    return {
        "id": "bottoms",
        "title": "Bottoms",
        "why": why,
        "recommendations": recs[:5],
        "avoid": avoid[:4],
        "productKeywords": keywords,
        "fit": recs[0]["name"] if recs else None,
    }


def _build_outerwear(ctx: dict[str, Any]) -> dict[str, Any]:
    recs: list[dict[str, Any]] = []
    avoid: list[str] = []
    keywords: list[str] = []

    if ctx["broadShoulders"]:
        recs.extend([
            _rec("Bomber Jackets", 88, "Bomber collars sit clean on broad shoulders without adding upper-body bulk."),
            _rec("Structured Blazers", 90, f"Structured shoulders ({round(ctx['shoulder'] or 0)} cm) need jackets that follow, not pad, your natural line."),
            _rec("Denim Jackets", 86, "Classic denim jackets frame the shoulder line with casual structure."),
            _rec("Harrington Jackets", 85, "Stand collars and clean shoulders suit inverted-triangle proportions."),
        ])
        avoid.extend(["Shoulder-padded jackets", "Heavy epaulettes", "Boxy cocoon coats"])
        keywords.extend(["bomber", "blazer", "denim jacket", "harrington", "structured"])
    elif ctx["athleticBuild"]:
        recs.extend([
            _rec("Stretch Blazers", 89, "Stretch suiting moves with an athletic chest while keeping structure."),
            _rec("Lightweight Bombers", 87, "Streamlined bombers complement a tapered athletic frame."),
            _rec("Tailored Overshirts", 85, "Overshirts add layering without overwhelming your V-shaped torso."),
        ])
        avoid.extend(["Rigid boxy chore coats with no waist"])
        keywords.extend(["stretch blazer", "bomber", "overshirt", "tailored"])
    else:
        recs.extend([
            _rec("Single-Breasted Coats", 88, f"Clean single-breasted lines suit your {ctx['bodyShape']} silhouette."),
            _rec("Unstructured Chore Jackets", 85, "Soft structure adds shape without rigid shoulder emphasis."),
            _rec("Lightweight Trench Coats", 83, "Vertical trench lines lengthen your overall proportion."),
        ])
        avoid.extend(["Overly padded power shoulders"])
        keywords.extend(["single-breasted", "chore", "trench", "lightweight"])

    why = recs[0]["reason"] if recs else "Outerwear matched to shoulder width and body shape."

    return {
        "id": "outerwear",
        "title": "Outerwear",
        "why": why,
        "recommendations": recs[:4],
        "avoid": avoid[:3],
        "productKeywords": keywords,
        "fit": recs[0]["name"] if recs else None,
    }


def _build_formal(ctx: dict[str, Any]) -> dict[str, Any]:
    recs: list[dict[str, Any]] = []
    avoid: list[str] = []
    keywords: list[str] = []

    chest = ctx.get("chest")
    shoulder = ctx.get("shoulder")
    sw = ctx.get("shoulderToWaist")

    if ctx["athleticBuild"]:
        recs.extend([
            _rec("Two-Button Blazers", 91, f"Two-button blazers suit your {round(chest or 0)} cm chest with a natural waist suppression."),
            _rec("Slim Tailored Suits", 90, "Slim tailoring follows athletic proportions without restricting movement."),
            _rec("Medium Lapels", 87, "Medium lapels balance a defined chest without widening the shoulder line."),
        ])
        avoid.extend(["Double-breasted jackets (adds bulk to chest)", "Boxy un-tailored suiting"])
        keywords.extend(["two button", "slim suit", "tailored", "blazer"])
    elif ctx["broadShoulders"]:
        recs.extend([
            _rec("Single-Breasted Suits", 90, "Single-breasted fronts avoid doubling visual width at the chest."),
            _rec("Soft-Shoulder Blazers", 88, "Soft shoulders prevent over-emphasizing your already broad frame."),
            _rec("Medium Lapels", 86, "Medium lapels keep formal looks proportional to shoulder width."),
        ])
        avoid.extend(["Double-breasted jackets", "Heavy shoulder padding"])
        keywords.extend(["single breasted", "soft shoulder", "blazer"])
    else:
        recs.extend([
            _rec("Classic Fit Suits", 88, f"Classic fit formalwear complements your {ctx['bodyShape']} measurements."),
            _rec("Tailored Dress Shirts", 86, "Dress shirts sized to chest ensure clean formal lines."),
        ])
        avoid.extend(["Ill-fitting boxy rental suits"])
        keywords.extend(["classic fit", "dress shirt", "suit"])

    if sw and sw >= 1.2:
        recs.append(_rec("Side-Vented Jackets", 84, f"Side vents improve drape over a {sw:.2f} shoulder-to-waist ratio."))

    why = recs[0]["reason"] if recs else f"Formal recommendations based on chest ({round(chest or 0)} cm) and shoulder proportions."

    return {
        "id": "formal",
        "title": "Formal",
        "why": why,
        "recommendations": recs[:4],
        "avoid": avoid[:3],
        "productKeywords": keywords,
        "fit": recs[0]["name"] if recs else None,
    }


def _build_casual(ctx: dict[str, Any]) -> dict[str, Any]:
    recs: list[dict[str, Any]] = []
    avoid: list[str] = []
    keywords: list[str] = []

    if ctx["heightBand"] == "tall":
        recs.extend([
            _rec("Layered Outfits", 90, f"At {round(ctx['height'] or 0)} cm, layered outfits add depth without shortening your leg line."),
            _rec("Relaxed Overshirts", 87, "Longline overshirts suit taller proportions when worn open over tees."),
            _rec("Clean Minimal Sneakers", 85, "Low-profile sneakers keep casual looks proportional to height."),
        ])
        keywords.extend(["layered", "overshirt", "minimal"])
    elif ctx["heightBand"] == "short":
        recs.extend([
            _rec("Monochrome Looks", 91, "Single-color outfits create an unbroken vertical line for shorter stature."),
            _rec("Vertical Pattern Tees", 88, "Vertical stripes and placket detail add perceived height."),
            _rec("Cropped Outer Layers", 85, "Cropped jackets prevent overwhelming shorter leg ratios."),
        ])
        keywords.extend(["monochrome", "vertical stripe", "cropped"])
    elif ctx["leanBuild"]:
        recs.extend([
            _rec("Relaxed Camp Collar Shirts", 88, "Relaxed camp collars add easy volume to a lean frame."),
            _rec("Textured Knit Polos", 85, "Texture adds dimension to casual smart-casual outfits."),
        ])
        keywords.extend(["camp collar", "knit", "textured"])
    else:
        recs.extend([
            _rec("Smart Casual Layering", 89, f"Your {ctx['bodyType']} build suits structured casual layers over well-fitted bases."),
            _rec("Weekend Denim & Tees", 86, "Classic denim and fitted tees match your everyday proportions."),
        ])
        keywords.extend(["smart casual", "denim", "weekend"])

    avoid.extend(["Unbalanced oversized-only casual defaults"])
    why = recs[0]["reason"] if recs else f"Casual styling tuned to your {ctx['heightBand']} height profile and {ctx['bodyShape']} shape."

    return {
        "id": "casual",
        "title": "Casual",
        "why": why,
        "recommendations": recs[:4],
        "avoid": avoid[:3],
        "productKeywords": keywords,
        "fit": recs[0]["name"] if recs else None,
    }


def _build_footwear(ctx: dict[str, Any]) -> dict[str, Any]:
    recs: list[dict[str, Any]] = []
    avoid: list[str] = []
    keywords: list[str] = []

    if ctx["heightBand"] == "tall" and ctx["athleticBuild"]:
        recs.extend([
            _rec("Minimal Sneakers", 92, "Clean minimal sneakers keep long athletic proportions streamlined."),
            _rec("Chelsea Boots", 89, "Chelsea boots add polish without chunk that shortens the leg line."),
            _rec("Loafers", 86, "Low-profile loafers suit smart-casual outfits on taller frames."),
        ])
        keywords.extend(["minimal sneaker", "chelsea", "loafer"])
    elif ctx["heightBand"] == "short":
        recs.extend([
            _rec("Elevated Sneakers", 90, "Slightly elevated soles add height without obvious bulk."),
            _rec("Low Contrast Footwear", 88, "Shoes that match trouser tone lengthen the leg visually."),
            _rec("Pointed-Toe Loafers", 85, "Elongated toe shapes extend the foot line."),
        ])
        avoid.extend(["Heavy platform soles on every outfit"])
        keywords.extend(["elevated", "low contrast", "loafer"])
    elif ctx.get("legRatio") and ctx["legRatio"] >= 0.48:
        recs.extend([
            _rec("Sleek Running-Inspired Sneakers", 88, f"Long leg length ({round(ctx['leg'] or 0)} cm) pairs with sleek, low-profile shoes."),
            _rec("Classic White Sneakers", 86, "White sneakers anchor casual outfits without visual weight."),
        ])
        keywords.extend(["sleek sneaker", "white sneaker"])
    else:
        recs.extend([
            _rec("Balanced Low-Profile Sneakers", 89, f"Footwear scaled to your {round(ctx['height'] or 0)} cm height and {ctx['bodyType']} build."),
            _rec("Casual Leather Boots", 85, "Mid-profile boots add structure without overwhelming proportions."),
        ])
        keywords.extend(["sneaker", "leather boot", "casual"])

    why = recs[0]["reason"] if recs else "Footwear recommendations based on height, build, and leg length."

    return {
        "id": "footwear",
        "title": "Footwear",
        "why": why,
        "recommendations": recs[:4],
        "avoid": avoid[:3],
        "productKeywords": keywords,
        "fit": recs[0]["name"] if recs else None,
    }


def generate_body_fit_insights(
    *,
    body_type: str | None,
    body_shape: str | None,
    body_type_code: str | None = None,
    body_shape_code: str | None = None,
    measurements: dict[str, Any] | None = None,
    body_type_ratios: dict[str, float] | None = None,
    body_shape_ratios: dict[str, float] | None = None,
    width_measurements: dict[str, float] | None = None,
) -> dict[str, Any] | None:
    ctx = _build_context(
        body_type=body_type,
        body_shape=body_shape,
        body_type_code=body_type_code,
        body_shape_code=body_shape_code,
        measurements=measurements,
        body_type_ratios=body_type_ratios,
        body_shape_ratios=body_shape_ratios,
        width_measurements=width_measurements,
    )

    if not ctx.get("height") and not ctx.get("bodyTypeCode"):
        return None

    builders = (
        _build_tops,
        _build_bottoms,
        _build_outerwear,
        _build_formal,
        _build_casual,
        _build_footwear,
    )
    sections = [builder(ctx) for builder in builders]

    summary_parts = []
    if ctx.get("bodyType"):
        summary_parts.append(f"{ctx['bodyType']} build")
    if ctx.get("chest") and ctx.get("waist"):
        summary_parts.append(f"chest {round(ctx['chest'])} cm / waist {round(ctx['waist'])} cm")
    if ctx.get("shoulderToWaist"):
        summary_parts.append(f"shoulder-to-waist {ctx['shoulderToWaist']:.2f}")

    return {
        "schemaVersion": 2,
        "bodyType": ctx.get("bodyType") or body_type,
        "bodyShape": ctx.get("bodyShape") or body_shape,
        "bodyTypeCode": ctx.get("bodyTypeCode"),
        "bodyShapeCode": ctx.get("bodyShapeCode"),
        "summary": "Personalised from your measured proportions: " + ", ".join(summary_parts) + ".",
        "analysisContext": {
            "heightCm": ctx.get("height"),
            "shoulderToWaist": ctx.get("shoulderToWaist"),
            "chestCm": ctx.get("chest"),
            "waistCm": ctx.get("waist"),
            "hipCm": ctx.get("hip"),
            "legRatio": ctx.get("legRatio"),
            "heightBand": ctx.get("heightBand"),
            "broadShoulders": ctx.get("broadShoulders"),
            "athleticBuild": ctx.get("athleticBuild"),
        },
        "sections": sections,
        "generatedAt": datetime.now(timezone.utc).isoformat(),
    }
