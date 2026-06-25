# Curated Jackets Product Import Report

Automated import of 5 uploaded jacket images into the Wardrobe AI product catalog and `/try-on` studio.

## Activate

```powershell
cd "c:\Users\hp\Desktop\Wardrobe AI"
docker compose build backend
docker compose up -d
```

Manual seed:

```powershell
docker compose exec backend node scripts/seed-curated-jackets-products.js
```

Products appear at `http://localhost:3001/try-on` under **Jackets**.

## Products

| SKU | Name | Color | Price | Sale | Rating | Stock |
|-----|------|-------|-------|------|--------|-------|
| TRYON-WAC-JKT-01 | Retro Color-Block Track Jacket | Black / Red | ₹1,999 | ₹1,599 | 4.8 | 65 |
| TRYON-WAC-JKT-02 | Lightweight Technical Windbreaker | Olive Green | ₹1,899 | ₹1,499 | 4.6 | 75 |
| TRYON-WAC-JKT-03 | Minimalist Sand Harrington Jacket | Sand / Beige | ₹2,499 | ₹1,999 | 4.7 | 35 |
| TRYON-WAC-JKT-04 | Urban Tech Hooded Utility Jacket | Black | ₹2,499 | ₹1,999 | 4.7 | 75 |
| TRYON-WAC-JKT-05 | Minimalist Faux Leather Zip-Up Jacket | Black | ₹2,999 | ₹2,499 | 4.8 | 40 |

**Brand:** Wardrobe AI Collection  
**Category:** Jackets (`subcategory: jackets`)  
**All:** `is_try_on_compatible = true`

## Files

- `backend/assets/curated-jackets/*.png`
- `backend/scripts/lib/curated-jackets-products.seed.cjs`
- `backend/scripts/seed-curated-jackets-products.js`
