# Curated Footwear Product Import Report

Automated import of 5 uploaded footwear images into the Wardrobe AI product catalog and `/try-on` studio.

## Activate

```powershell
cd "c:\Users\hp\Desktop\Wardrobe AI"
docker compose build backend
docker compose up -d
```

Manual seed:

```powershell
docker compose exec backend node scripts/seed-curated-footwear-products.js
```

Products appear at `http://localhost:3001/try-on` under **Footwear**.

## Products

| SKU | Name | Color | Price | Sale | Rating | Stock |
|-----|------|-------|-------|------|--------|-------|
| TRYON-WAC-SHOE-01 | Retro Color-Block Low-Top Sneakers | Beige / Cream | ₹2,499 | ₹1,999 | 4.7 | 60 |
| TRYON-WAC-SHOE-02 | Premium Suede Derby Shoes - Dark Brown | Dark Olive Brown | ₹3,499 | ₹2,799 | 4.8 | 45 |
| TRYON-WAC-SHOE-03 | Urban Mesh Platform Sneakers | Off-White | ₹2,999 | ₹2,249 | 4.8 | 75 |
| TRYON-WAC-SHOE-04 | Minimalist Black Criss-Cross Strap Slides | Black | ₹2,499 | ₹1,899 | 4.8 | 120 |
| TRYON-WAC-SHOE-05 | Tactical Olive Green Buckle Sandals | Olive / Tan | ₹2,499 | ₹1,899 | 4.7 | 85 |

**Brand:** Wardrobe AI Collection  
**Category:** Footwear (`subcategory: footwear`)  
**All:** `is_try_on_compatible = true`

## Files

- `backend/assets/curated-footwear/*.png`
- `backend/scripts/lib/curated-footwear-products.seed.cjs`
- `backend/scripts/seed-curated-footwear-products.js`
