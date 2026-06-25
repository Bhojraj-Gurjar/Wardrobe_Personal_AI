# Try-On Studio Refactor Report

**Scope:** `http://localhost:3001/try-on` only  
**Date:** June 25, 2026  
**CatVTON pipeline:** Preserved (unchanged AI service + `TryOnService.generateTryOn`)

---

## Summary

The `/try-on` page was refactored from manual person/garment uploads to an onboarding-driven, catalog-based Try-On Studio. Users now see their onboarding body photo automatically, pick a compatible catalog product, and run the **same CatVTON generation path** (`POST /api/v1/try-on/generate` internally via product wrapper).

`/virtual-try-on` and all other modules were **not modified**.

---

## Routes Verified (unchanged)

| Route | Status |
|-------|--------|
| `/try-on` | Refactored UI, same route |
| `/virtual-try-on` | Untouched |
| Face / Body / Fashion DNA / Avatar / Recommendations / Profile / Cart / Orders / Admin | Untouched |

---

## CatVTON Logic Preserved

| Layer | File | Change |
|-------|------|--------|
| AI Service | `ai-service/app/tryon/service.py` | **No change** |
| Backend proxy | `backend/src/modules/try-on/try-on.service.js` | **No change** to `generateTryOn()` |
| Legacy API | `POST /try-on/generate` | **Still available** (URL-based) |
| Upload APIs | `POST /try-on/upload/person`, `/garment` | **Kept** for backward compatibility |

New flow calls existing `generateTryOn(userId, personImageUrl, garmentImageUrl)` with:
- **Person URL:** onboarding body photo (read-only)
- **Garment URL:** product `tryOnImage` or catalog image

---

## Database

### New table: `try_on_results`

| Column | Type | Notes |
|--------|------|-------|
| id | UUID | Primary key |
| user_id | UUID | FK → users |
| product_id | UUID? | FK → products |
| body_image | VARCHAR | Reference only — never overwrites onboarding |
| garment_image | VARCHAR | Product try-on image URL |
| generated_image | VARCHAR | CatVTON output |
| created_at | TIMESTAMP | |

### Product extensions

| Column | Purpose |
|--------|---------|
| `try_on_image` | Optional dedicated CatVTON garment image (does not replace `image_url`) |
| `is_try_on_compatible` | Optional admin/manual override |

**Migration:** `backend/scripts/apply-try-on-refactor.sql`  
**Prisma:** `TryOnResult` model + Product fields in `schema.prisma`

---

## Backend Files Modified / Added

### Modified
- `backend/prisma/schema.prisma`
- `backend/src/modules/try-on/try-on.module.js`
- `backend/src/modules/try-on/try-on.controller.js`

### Added
- `backend/scripts/apply-try-on-refactor.sql`
- `backend/src/modules/try-on/services/try-on-body-resolver.service.js`
- `backend/src/modules/try-on/services/try-on-studio.service.js`
- `backend/src/modules/try-on/repositories/try-on-result.repository.js`
- `backend/src/modules/try-on/repositories/try-on-user.repository.js`
- `backend/src/modules/try-on/utils/try-on-product-compatibility.util.js`

### New API Endpoints (`/api/v1/try-on`)

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/setup` | Onboarding body photo + user context |
| GET | `/products` | Catalog with `isTryOnCompatible` |
| POST | `/generate/:productId` | CatVTON via body photo + product |
| GET | `/results` | Try-On Studio history |
| POST | `/results/:id/save-outfit` | Save to `saved_outfits` |
| POST | `/results/:id/add-to-closet` | Add to personal closet |

---

## Frontend Files Modified / Added

### Modified
- `frontend/src/app/try-on/_components/TryOnForm.js` — main studio orchestrator
- `frontend/src/app/try-on/_components/try-on.service.js` — new API client methods
- `frontend/src/constants/api.js` — `TRY_ON` endpoint constants

### Added
- `frontend/src/app/try-on/_components/TryOnBodyPanel.js`
- `frontend/src/app/try-on/_components/TryOnProductCatalog.js`
- `frontend/src/app/try-on/_components/TryOnResultSection.js`

### Unchanged
- `frontend/src/app/try-on/page.js`
- `frontend/src/app/try-on/layout.js`

---

## Components Overview

| Component | Responsibility |
|-----------|----------------|
| `TryOnForm` | Setup query, product catalog state, generate mutation |
| `TryOnBodyPanel` | Read-only onboarding body photo, name, body type |
| `TryOnProductCatalog` | Search, category filters, compatibility badges, product selection |
| `TryOnResultSection` | Body + product + result comparison, Download / Save / Closet |

---

## Product Compatibility (`isTryOnCompatible`)

Heuristic in `try-on-product-compatibility.util.js`:
- Requires valid catalog-style image URL
- Clothing category/name keywords (shirts, pants, jackets, etc.)
- Excludes footwear, accessories, bags, etc.
- Respects manual `is_try_on_compatible` override on product
- Uses `try_on_image` when set, otherwise primary product image

UI labels:
- **Try-On Available**
- **Not Compatible**

---

## Safety Rules

| Rule | Implementation |
|------|----------------|
| Never overwrite face/body/profile photos | `TryOnBodyResolverService` is read-only |
| Generated results stored separately | `try_on_results` table |
| Onboarding data untouched | Body path resolved from `/uploads/body/` only |
| Virtual Try-On isolated | No files changed under `virtual-try-on/` |

---

## Onboarding Integration

Body photo resolution order:
1. `UserProfile.body_image`
2. `BodyAnalysis.body_image_url`
3. Profile preferences (`bodyPhoto`, `onboardingBodyPhoto`)
4. Stored body image via `BodyImageStorageService`

Frontend also uses `resolveBodyPhotoUrl()` (same helper as Body Analysis) for display consistency.

---

## Testing Checklist

- [ ] Open `/try-on` — body photo loads without upload
- [ ] Product catalog shows compatibility badges
- [ ] Select compatible product → Generate → CatVTON result appears
- [ ] Download / Save Outfit / Add To Closet work
- [ ] `/virtual-try-on` still works independently
- [ ] Face / Body / Fashion DNA / Admin unaffected
- [ ] Legacy `POST /try-on/generate` still accepts URL pair (API compat)

---

## Deploy Notes

Rebuild and restart after pulling:

```bash
docker compose build backend frontend
docker compose up -d backend frontend
```

Prisma `db push` runs on backend container startup. Optional manual SQL:

```bash
docker exec -i wardrobe-postgres psql -U wardrobe -d wardrobe_db < backend/scripts/apply-try-on-refactor.sql
```
