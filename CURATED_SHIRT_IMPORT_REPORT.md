# Curated Shirt Product Import Report

Automated import of 5 uploaded shirt images into the Wardrobe AI product catalog and `/try-on` studio.

## How to activate

```powershell
cd "c:\Users\hp\Desktop\Wardrobe AI"
docker compose build backend
docker compose up -d
```

On backend startup, `seed-curated-shirt-products.js` runs automatically and:

1. Copies originals from `backend/assets/curated-shirts/`
2. Writes try-on PNGs to `uploads/products/curated-shirts/tryon/`
3. Upserts 5 products with `is_try_on_compatible = true`

Manual run:

```powershell
docker compose exec backend node scripts/seed-curated-shirt-products.js
```

## Products created

| SKU | Name | Color | Price | Sale | Rating | Stock |
|-----|------|-------|-------|------|--------|-------|
| TRYON-WAC-SHIRT-05 | Premium Relaxed Fit Linen Shirt - Mocha Brown | Mocha Brown | ₹1,699 | ₹1,299 | 4.6 | 55 |
| TRYON-WAC-SHIRT-06 | Premium Relaxed Fit Linen Shirt - Cornflower Blue | Cornflower Blue | ₹1,899 | ₹1,499 | 4.7 | 65 |
| TRYON-WAC-SHIRT-07 | Premium White Linen Long Sleeve Shirt | White | ₹1,999 | ₹1,499 | 4.7 | 75 |
| TRYON-WAC-SHIRT-08 | Classic Button-Down Linen Shirt | Burgundy | ₹1,799 | ₹1,399 | 4.5 | 60 |
| TRYON-WAC-SHIRT-09 | Relaxed Fit Linen Shirt - Blush Pink | Blush Pink | ₹1,699 | ₹1,299 | 4.6 | 50 |

**Brand:** Wardrobe AI Collection  
**Category:** Shirts (`subcategory: shirts`)  
**Currency:** INR  
**Try-on:** All 5 marked compatible for CatVTON

## Image storage

| Field | Path pattern |
|-------|----------------|
| `image_url` (original) | `/uploads/products/curated-shirts/wac-shirt-*.png` |
| `try_on_image` (extracted) | `/uploads/products/curated-shirts/tryon/tryon-wac-shirt-*-tryon.png` |

Originals are never overwritten. Try-on images are generated via `python/remove_garment_background.py` with copy fallback if Python/OpenCV is unavailable.

## Try-on page

Products appear at `http://localhost:3001/try-on` under the **Shirts** category filter immediately after seeding.

## Files added

- `backend/assets/curated-shirts/*.png` — source product shots
- `backend/scripts/lib/curated-shirt-products.seed.cjs` — metadata definitions
- `backend/scripts/seed-curated-shirt-products.js` — import automation
- `backend/python/remove_garment_background.py` — garment background removal
