# Try-On Product Seed Report

**Date:** June 25, 2026  
**Scope:** `/try-on` Product Catalog only  
**CatVTON / Virtual Try-On:** Not modified

---

## Problem

Product Catalog showed **"No products match your filters"** because:
- **Show Try-On Products only** was enabled by default
- No products had `is_try_on_compatible = true` in the database

---

## Solution

### 1. Dedicated Try-On product dataset (20 products)

| Category | Count | Brands |
|----------|-------|--------|
| T-Shirts | 4 | H&M, Zara, Uniqlo, Mango |
| Shirts | 4 | Allen Solly, Van Heusen, Louis Philippe, H&M |
| Jackets | 4 | Zara, Levi's, Uniqlo, Mango |
| Pants | 4 | Levi's, H&M, Zara, Uniqlo |
| Footwear | 4 | H&M, Zara, Uniqlo, Levi's |

**SKU prefix:** `TRYON-` (e.g. `TRYON-HM-TEE-01`)

### 2. Database fields per product

| Field | Value |
|-------|--------|
| `image_url` | Royalty-free Unsplash/Pexels catalog garment photo |
| `try_on_image` | Same dedicated front-facing garment image |
| `is_try_on_compatible` | `true` |
| `category` | T-Shirts, Shirts, Jackets, Pants, Footwear |
| `subcategory` | t-shirts, shirts, jackets, pants, footwear |

### 3. Auto-fallback (never empty catalog)

**Frontend (`TryOnForm.js`):**
- If compatible-only query returns 0 products (no search/category), automatically unchecks **Show Try-On Products only**

**Backend (`try-on-studio.service.js`):**
- If compatible filter yields 0 results, returns all active products with `meta.compatibleFallbackApplied: true`

---

## Files Added

| File | Purpose |
|------|---------|
| `backend/src/modules/try-on/constants/try-on-products.seed.js` | 20-product seed definitions |
| `backend/scripts/seed-try-on-products.js` | Upsert script |
| `TRY_ON_PRODUCT_SEED_REPORT.md` | This report |

## Files Modified

| File | Change |
|------|--------|
| `backend/package.json` | `seed:try-on-products` script |
| `backend/docker-entrypoint.sh` | Auto-seed on container start |
| `backend/src/modules/try-on/services/try-on-studio.service.js` | API fallback + limit 48 |
| `frontend/src/app/try-on/_components/TryOnForm.js` | Auto-fallback effect |
| `frontend/src/app/try-on/_components/TryOnProductCatalog.js` | UI cards, Try On button, selection glow |

---

## UI Improvements

Product cards now show:
- Large garment image (3:4 aspect)
- Name, brand, category, price
- **Try-On Available** / **Not Compatible** badge
- **Try On** button per card
- Selected state: purple border, glow, **Selected** badge

Category filters: All, T-Shirts, Shirts, Jackets, Pants, Footwear

---

## Run Seed Manually

```bash
cd backend
npm run seed:try-on-products
```

**Docker (auto on backend start):**

```bash
docker compose build backend
docker compose up -d backend
```

**Verify in database:**

```sql
SELECT sku, name, brand, category, is_try_on_compatible
FROM products
WHERE sku LIKE 'TRYON-%';
```

Expected: **20 rows**, all `is_try_on_compatible = true`

---

## Testing Checklist

- [ ] Hard refresh `/try-on` — catalog shows 20+ products
- [ ] **Show Try-On Products only** lists compatible items
- [ ] Category filters (Shirts, Pants, etc.) work
- [ ] Product selection shows purple glow + Selected badge
- [ ] **Generate Try-On** still uses CatVTON pipeline
- [ ] Empty catalog does not appear on initial load
- [ ] `/virtual-try-on` unchanged

---

## Image Sources

All images are royalty-free placeholder URLs from:
- [Unsplash](https://unsplash.com)
- [Pexels](https://pexels.com)

Formatted for catalog use: `w=1000&h=1200` crop, suitable for CatVTON garment input.

---

## Not Modified

- CatVTON logic (`ai-service/app/tryon/service.py`)
- Try-On generation pipeline (`try-on.service.js` `generateTryOn`)
- Onboarding, Face/Body Analysis, Virtual Try-On routes
- Existing product catalog (`WA-*` SKUs) — untouched
