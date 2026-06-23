# Wardrobe AI — Architecture Audit Report

**Date:** June 2026  
**Scope:** Full monorepo audit against official tech stack  
**Approach:** Inspect first, apply safe standardization only (no blind rewrite)

---

## Official Tech Stack Compliance

| Technology | Target | Status |
|------------|--------|--------|
| Next.js 15 App Router | Frontend | ✅ In use (`next@15.5.19`) |
| JavaScript only (frontend) | Frontend | ✅ No `.ts`/`.tsx` in `frontend/src` |
| ShadCN UI + Tailwind | Frontend | ✅ Radix primitives + `components/ui/` |
| Zustand | Frontend | ✅ `auth-store`, `onboarding-store`, `ui-store` |
| TanStack Query | Frontend | ✅ All data fetching via hooks |
| React Hook Form + Zod | Frontend | ✅ All major forms (see §Forms) |
| NestJS + JavaScript | Backend | ✅ 108 `.js` modules, SWC build |
| REST APIs | Backend | ✅ `api/v1` prefix |
| PostgreSQL | Database | ✅ Prisma 7 + `schema.prisma` |
| Redis | Cache/Auth | ✅ Refresh token storage |
| Qdrant | Vectors | ✅ Face + recommendations |
| Python + FastAPI | AI services | ⚠️ **Not present** — AI is in-process NestJS + client heuristics |

---

## 1. What Was Already Correct

### Frontend
- **Stack alignment:** No TypeScript, Redux, Axios, or alternate CSS frameworks in dependencies.
- **Page architecture:** All 15 `app/**/page.js` files are thin shells — no API calls in pages.
- **Feature-based structure:** `features/auth`, `face`, `profile`, `onboarding`, `dashboard`, `products`, `ai` with `components/`, `hooks/`, `services/`, `schemas/`.
- **Single HTTP client:** `services/api-client.js` (native `fetch`).
- **State:** Zustand only — no custom React Context for app state.
- **Forms:** Register, login, profile, onboarding (3 steps) all use RHF + Zod.
- **Dashboard:** Independent widget loading, React Query caching, `loading.js` skeletons.
- **Routing:** Root `/` redirects via auth; `router.replace()` used for guards/logout.

### Backend
- **NestJS module pattern:** Controllers → services → repositories → DTOs across 8 active modules.
- **Databases:** PostgreSQL (Prisma), Redis (auth), Qdrant (face + products) correctly wired.
- **Auth:** JWT + refresh tokens, logout revokes refresh only (biometrics preserved).
- **Face:** `register`, `login`, `verify` endpoints with Qdrant storage.

### Infrastructure
- `docker-compose.yml` for Postgres, Redis, Qdrant.

---

## 2. What Was Added

| Change | Location |
|--------|----------|
| Architecture audit report | `ARCHITECTURE_AUDIT.md` (this file) |
| `POST /face/verify` | `backend/src/modules/face/` (prior session) |
| Face logout modal + camera | `frontend/src/features/face/components/face-logout-modal.js`, `face-verification-camera.js` |
| Onboarding hooks barrel | `frontend/src/features/onboarding/hooks/index.js` |
| `useOnboardingStore` barrel export | `frontend/src/stores/index.js` |

---

## 3. What Was Removed

| Item | Reason |
|------|--------|
| `frontend/src/features/onboarding/services/onboardingService.js` | Duplicate of `profile` + `ai` services |
| `frontend/src/features/face/components/instruction-card.js` | Dead export, never imported |
| `frontend/src/features/auth/components/logout-button.jsx` | Renamed to `.js` for consistency |
| `frontend/src/features/face/components/face-logout-modal.jsx` | Renamed to `.js` |
| `frontend/src/features/face/components/face-verification-camera.jsx` | Renamed to `.js` |
| `backend/src/modules/face/validators/face.constants.js` | Duplicated `configuration.js`; unused |
| Old landing page at `/` | Replaced with auth redirect (prior session) |

**Not removed (intentionally):**
- `AppShell` / legacy navbar layout — still used by `/products`, `/profile`, `/recommendations`
- Admin module scaffold — planned feature, zero routes
- `backend/dist/` — build output (see tech debt)
- One-off backend codemod scripts in `backend/scripts/`

---

## 4. What Was Standardized

| Area | Before | After |
|------|--------|-------|
| Onboarding profile API | Duplicate `onboardingService.js` | Uses `features/profile/services` |
| Onboarding Fashion DNA | Duplicate `generateFashionDna` | Uses `features/ai/services` |
| Onboarding profile hook | `useUpdateProfileMutation` (name collision) | `useOnboardingProfileMutation` |
| Product filters form | `useState` only | RHF + Zod (`productFiltersSchema`) |
| Product selects | Inline `<select>` styles | Shared `SelectField` from `components/ui/select` |
| Face components | Mixed `.js` / `.jsx` | All `.js` |
| Store exports | `onboarding-store` imported ad hoc | Exported from `stores/index.js` |
| Face validators | Dead constants file | Config is source of truth in `configuration.js` |

---

## 5. Remaining Technical Debt

### Frontend
| Item | Priority | Notes |
|------|----------|-------|
| Dual layout systems | Medium | `DashboardShell` vs `AppShell` — consolidate when products/profile migrate to dashboard shell |
| Admin feature stubs | Low | `features/admin/` has no routes |
| Dashboard services stub | Low | `features/dashboard/services/index.js` placeholder |
| `generateFashionDna` fire-and-forget | Low | Onboarding completion could use `useGenerateFashionDnaMutation` |
| ShadCN partial install | Low | Only subset of `components/ui/` — add components as needed |
| `lib/` and `types/` folders | Low | Official structure lists them; not required until shared types grow |

### Backend
| Item | Priority | Notes |
|------|----------|-------|
| Auth token logic duplicated in `FaceService` | Medium | Extract shared `TokenService` |
| `formatProduct()` duplicated | Low | recommendations + products services |
| Admin module empty | Low | Scaffold only |
| Products CRUD unauthenticated | Medium | Security review needed |
| `roles.guard.js` unused stub | Low | Implement or remove |
| `indexProductForVectorSearch()` never called | Medium | Products not indexed to Qdrant on CRUD |
| OpenAI embedding provider stub | Low | Reserved for future |
| Stale Jest/e2e tests | Medium | Expect `getHello()` not `getHealth()` |
| `dist/` not gitignored | Low | May cause stale deploys |
| Unused devDeps: `@babel/node`, `@swc-node/register` | Low | Safe to prune |
| `prisma.config.ts` only TS file | Acceptable | Required by Prisma 7 CLI |

### AI / Python
| Item | Priority | Notes |
|------|----------|-------|
| No Python/FastAPI service | Planned | Official stack lists FastAPI — not implemented |
| Heuristic face embeddings | High | Client-side canvas sampling, not ML model |
| Heuristic recommendation vectors | Medium | Hash-based, not semantic embeddings |

---

## 6. Directory Map (Current)

```
Wardrobe AI/
├── frontend/src/
│   ├── app/              # Next.js routes (15 pages)
│   ├── components/       # layout, providers, shared, ui
│   ├── constants/        # api, routes, navigation
│   ├── features/         # auth, face, profile, onboarding, dashboard, products, ai, admin(stub)
│   ├── hooks/            # cross-feature hooks
│   ├── services/         # api-client
│   ├── stores/           # zustand (auth, onboarding, ui)
│   └── utils/
├── backend/src/
│   ├── modules/          # auth, users, products, recommendations, fashion-dna, wishlist, orders, face, admin(stub)
│   ├── database/         # prisma, redis, qdrant
│   ├── config/           # env + configuration
│   └── common/           # guards, pipes, interceptors, filters
└── docker-compose.yml    # postgres, redis, qdrant
```

---

## 7. Migration Plan (Future — Not Applied)

These were identified but **not** executed to avoid breaking working flows:

1. **Unify layouts** — Migrate products/profile/AI routes under `DashboardShell`
2. **Extract `TokenService`** — Deduplicate auth + face token generation
3. **Product Qdrant indexing** — Call `indexProductForVectorSearch` on product CRUD
4. **Python FastAPI microservice** — Real embeddings for face + recommendations
5. **Protect product mutations** — Add JWT guards to POST/PUT/DELETE `/products`
6. **Prune unused backend devDependencies** — After verifying ESLint still passes
7. **Fix stale tests** — Update specs to match `getHealth()` and `/api/v1/health`

---

## 8. Verification Checklist

- [x] No TypeScript in application source (except `prisma.config.ts`)
- [x] No Redux or Axios
- [x] Zustand for global client state
- [x] TanStack Query for server state
- [x] RHF + Zod on all HTML forms
- [x] API logic in `features/*/services`
- [x] No API calls in page components
- [x] Backend module pattern consistent
- [x] PostgreSQL + Redis + Qdrant configured
- [ ] Python/FastAPI AI service (future)

---

*Generated after full codebase inspection. Changes applied conservatively — working modules were preserved.*
