# Curated T-Shirt Product Import Report

Automated import of 5 uploaded t-shirt images into the Wardrobe AI product catalog and `/try-on` studio.

## Activate

```powershell
cd "c:\Users\hp\Desktop\Wardrobe AI"
docker compose build backend
docker compose up -d
```

Manual seed:

```powershell
docker compose exec backend node scripts/seed-curated-tshirt-products.js
```

Products appear at `http://localhost:3001/try-on` under **T-Shirts**.

## Products

| SKU | Name | Color | Price | Sale | Rating | Stock |
|-----|------|-------|-------|------|--------|-------|
| TRYON-WAC-TEE-01 | Premium Navy Ringer T-Shirt | Navy / White Trim | ₹1,299 | ₹999 | 4.6 | 80 |
| TRYON-WAC-TEE-02 | Classic Cream Ringer T-Shirt - Black Trim | Cream / Black | ₹1,199 | ₹899 | 4.5 | 70 |
| TRYON-WAC-TEE-03 | Retro USA 94 Polo T-Shirt | Cream / Navy | ₹1,599 | ₹1,199 | 4.7 | 55 |
| TRYON-WAC-TEE-04 | Field Club West Coast Graphic T-Shirt | Off-White | ₹1,499 | ₹1,099 | 4.6 | 65 |
| TRYON-WAC-TEE-05 | Premium Essential Burgundy Crew Neck T-Shirt | Burgundy | ₹1,299 | ₹899 | 4.8 | 75 |

**Brand:** Wardrobe AI Collection  
**Category:** T-Shirts (`subcategory: t-shirts`)  
**All:** `is_try_on_compatible = true`

## Files

- `backend/assets/curated-tshirts/*.png`
- `backend/scripts/lib/curated-tshirt-products.seed.cjs`
- `backend/scripts/seed-curated-tshirt-products.js`
- `backend/scripts/lib/curated-product-seed.util.cjs` (shared seeder)
