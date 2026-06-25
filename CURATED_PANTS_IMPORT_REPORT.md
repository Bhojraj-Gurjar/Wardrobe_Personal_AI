# Curated Pants Product Import Report

Automated import of 5 uploaded pants images into the Wardrobe AI product catalog and `/try-on` studio.

## Activate

```powershell
cd "c:\Users\hp\Desktop\Wardrobe AI"
docker compose build backend
docker compose up -d
```

Manual seed:

```powershell
docker compose exec backend node scripts/seed-curated-pants-products.js
```

Products appear at `http://localhost:3001/try-on` under **Pants**.

## Products

| SKU | Name | Color | Price | Sale | Rating | Stock |
|-----|------|-------|-------|------|--------|-------|
| TRYON-WAC-PANT-01 | Essential Off-White Straight Leg Trousers | Off-White | ₹1,999 | ₹1,599 | 4.7 | 45 |
| TRYON-WAC-PANT-02 | Premium Black Relaxed Straight Trousers | Black | ₹1,899 | ₹1,499 | 4.6 | 55 |
| TRYON-WAC-PANT-03 | Wide-Leg Espresso Trousers | Espresso Brown | ₹2,199 | ₹1,699 | 4.7 | 40 |
| TRYON-WAC-PANT-04 | Relaxed Drawstring Linen Pants | Dark Earth Brown | ₹1,799 | ₹1,399 | 4.5 | 50 |
| TRYON-WAC-PANT-05 | Premium Beige Linen Pressed Trousers | Light Beige | ₹2,099 | ₹1,649 | 4.8 | 42 |

**Brand:** Wardrobe AI Collection  
**Category:** Pants (`subcategory: pants`)  
**All:** `is_try_on_compatible = true`

## Files

- `backend/assets/curated-pants/*.png`
- `backend/scripts/lib/curated-pants-products.seed.cjs`
- `backend/scripts/seed-curated-pants-products.js`
