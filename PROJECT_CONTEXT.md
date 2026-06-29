# PROJECT_CONTEXT.md

> **Single source of truth for Wardrobe AI.**  
> Generated from full repository analysis. Last updated: 2026-06-26.  
> When in doubt, verify against source code — this document reflects the repo at generation time.

---

# Project Overview

**Wardrobe AI** is an AI-powered fashion e-commerce platform that combines personalized styling, biometric authentication, body/face analysis, virtual try-on, 3D digital avatars, and a full shopping workflow (catalog → cart → orders → personal closet).

The application helps users:

1. **Onboard** with profile, lifestyle, and style preferences plus a body photo.
2. **Authenticate** via email/password or **face recognition** (InsightFace + Qdrant).
3. **Discover style** through Fashion DNA profiling, AI recommendations, and an AI stylist chat.
4. **Visualize outfits** via CatVTON virtual try-on (Hugging Face) and layered wardrobe avatars.
5. **Shop** curated apparel with wishlist, cart, checkout, and order history.
6. **Manage wardrobe** in a personal closet with saved outfits and favorite brands/colors.

### Architecture (3-tier monorepo)

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  Frontend       │────▶│  Backend        │────▶│  AI Service     │
│  Next.js 15     │     │  NestJS 11      │     │  FastAPI        │
│  :3001          │     │  :3000/api/v1   │     │  :8000          │
└─────────────────┘     └────────┬────────┘     └────────┬────────┘
                                   │                        │
                    ┌──────────────┼──────────────┐         │
                    ▼              ▼              ▼         ▼
              PostgreSQL 16   Redis 7      Qdrant      HuggingFace
              (Prisma 7)                   (vectors)   CatVTON Space
```

**Important:** There is **no root README.md**. Service-specific READMEs exist under `frontend/`, `backend/`, and `ai-service/`.

---

# Tech Stack

## Frontend (`frontend/package.json` v0.1.0)

| Technology | Version | Purpose |
|------------|---------|---------|
| **Next.js** | ^15.5.19 | App Router, SSR/SSG |
| **React** | 19.2.4 | UI |
| **Tailwind CSS** | ^4 | Styling (`@tailwindcss/postcss`) |
| **TanStack React Query** | ^5.101.0 | Server state, caching |
| **Zustand** | ^5.0.14 | Client global state |
| **React Hook Form** | ^7.79.0 | Forms |
| **Zod** | ^4.4.3 | Validation |
| **Framer Motion** | ^12.42.0 | Animations |
| **Three.js** | ^0.184.0 | 3D rendering |
| **React Three Fiber** | ^9.6.1 | React 3D |
| **@react-three/drei** | ^10.7.7 | 3D helpers |
| **@avaturn/sdk** | ^1.1.4 | Avaturn avatar creator |
| **Recharts** | ^3.8.1 | Charts (Fashion DNA) |
| **Radix UI** | select, scroll-area, separator, slot | Accessible primitives |
| **Lucide React** | ^1.21.0 | Icons |
| **class-variance-authority** | ^0.7.1 | Button variants |
| **xlsx** | ^0.18.5 | Admin bulk product import |
| **ESLint** | ^9 | Linting |

**Language:** JavaScript (`.js`), not TypeScript in frontend source.

## Backend (`backend/package.json` v0.0.1)

| Technology | Version | Purpose |
|------------|---------|---------|
| **NestJS** | ^11.0.1 | REST API framework |
| **Prisma** | ^7.8.0 | ORM (`@prisma/client`, `@prisma/adapter-pg`) |
| **PostgreSQL** | via `pg ^8.22.0` | Primary database |
| **Redis** | `ioredis ^5.11.1` | Refresh tokens, caching |
| **Qdrant** | `@qdrant/js-client-rest ^1.18.0` | Vector search |
| **Passport JWT** | passport-jwt ^4.0.1 | Authentication |
| **bcryptjs** | ^3.0.3 | Password hashing |
| **Swagger** | @nestjs/swagger ^11.4.4 | API docs at `/docs` |
| **Winston** | nest-winston ^1.10.2 | Logging |
| **Helmet + compression** | Security/performance |
| **SWC** | Build (Babel decorators for Nest) |
| **Jest** | 30.3.0 | Testing |

**Language:** JavaScript (`.js`), compiled to `dist/` via SWC.

## AI Service (`ai-service/requirements.txt`)

| Technology | Version | Purpose |
|------------|---------|---------|
| **Python** | 3.11+ | Runtime |
| **FastAPI** | >=0.115.0 | HTTP API |
| **Uvicorn** | >=0.32.0 | ASGI server |
| **InsightFace** | >=0.7.3 | Face embeddings |
| **ONNX Runtime** | >=1.19.0 | Model inference |
| **DeepFace / TensorFlow** | Face analysis |
| **MediaPipe** | Body pose/measurements |
| **sentence-transformers** | Product/DNA embeddings |
| **qdrant-client** | Vector DB |
| **redis** | Caching |
| **gradio_client** | CatVTON Hugging Face Space |
| **rembg** | Background removal |
| **OpenCV, Pillow, NumPy, SciPy** | Image processing |

## Infrastructure (Docker)

| Service | Image |
|---------|-------|
| PostgreSQL | postgres:16-alpine |
| Redis | redis:7-alpine |
| Qdrant | qdrant/qdrant:latest |
| Node | 22 (backend/frontend Dockerfiles) |

## External Services

| Service | Usage |
|---------|-------|
| **Hugging Face** | CatVTON virtual try-on (`zhengchong/CatVTON` Space) |
| **OpenAI** | AI Stylist chat (`gpt-4o-mini`) — optional, requires `OPENAI_API_KEY` |
| **Ready Player Me** | 3D avatar GLB URLs (`models.readyplayer.me`) |
| **Avaturn** | Alternative avatar creator via `@avaturn/sdk` |

---

# Folder Structure

```
Wardrobe AI/
├── frontend/                 # Next.js 15 App Router client
│   ├── src/
│   │   ├── app/              # Routes (page.js per route)
│   │   ├── components/       # Shared UI (ui/, providers/, layout/)
│   │   ├── constants/        # routes.js, api.js, product-types.js
│   │   ├── features/         # Feature-sliced modules (20 domains)
│   │   ├── hooks/            # Shared hooks
│   │   ├── lib/              # lazy-pages, utilities
│   │   ├── services/         # api-client.js
│   │   ├── stores/           # Zustand stores
│   │   ├── styles/           # Global style helpers
│   │   └── utils/            # cn(), formatters
│   ├── public/               # Static assets, avatar overlays
│   └── Dockerfile
│
├── backend/                  # NestJS REST API
│   ├── src/
│   │   ├── modules/          # Feature modules (auth, products, try-on, etc.)
│   │   ├── database/         # Prisma, Redis, Qdrant modules
│   │   ├── storage/          # File upload (local/S3/Cloudinary)
│   │   ├── guards/           # JWT, AdminRole
│   │   ├── middleware/       # RequestId
│   │   ├── config/           # Env configuration
│   │   └── common/           # Filters, interceptors, decorators
│   ├── prisma/
│   │   └── schema.prisma     # 26 models (source of truth)
│   ├── scripts/              # Seeds, backfills, manual SQL migrations
│   └── docs/                 # OpenAPI export, Postman
│
├── ai-service/               # FastAPI ML microservice
│   ├── app/
│   │   ├── routers/          # HTTP endpoints
│   │   ├── services/         # ML business logic
│   │   ├── tryon/            # CatVTON integration
│   │   └── schemas/          # Pydantic models
│   ├── models/               # Downloaded ML weights (InsightFace, etc.)
│   └── tests/
│
├── scripts/                  # Monorepo dev scripts (PowerShell)
├── docker-compose.yml        # Full stack orchestration
├── uploads/                  # Local file storage (gitignored)
└── package.json              # Root orchestration (dev, reset, infra)
```

### Frontend feature modules (`src/features/`)

| Folder | Purpose |
|--------|---------|
| `admin` | Admin CMS, users, orders, analytics |
| `ai` | Recommendations UI |
| `auth` | Login, register, guards, session |
| `body-analysis` | Body measurements, fit guide |
| `cart` | Shopping cart |
| `dashboard` | User dashboard shell and widgets |
| `digital-avatar` | 3D avatar (RPM/Avaturn/Three.js) |
| `face` | Face registration and login camera flow |
| `face-analysis` | Face trait analysis UI |
| `fashion-dna` | Style DNA radar, confidence, insights |
| `landing` | Marketing landing page |
| `onboarding` | Profile, lifestyle, style steps |
| `orders` | Order history |
| `personal-closet` | Purchased items, saved outfits |
| `products` | Catalog, filters, product detail |
| `profile` | User profile dashboard |
| `stylist-chat` | AI stylist conversational UI |
| `user-activity` | Product views, search tracking hooks |
| `virtual-try-on` | CatVTON try-on studio (premium UI) |
| `wishlist` | Wishlist |

---

# Application Flow

```
Landing (/)
    │
    ├─► Register (/register) ──► Face Register (/face/register)
    │                                    │
    └─► Login (/login) ◄────────────────┘
            │         Face Login (/face/login)
            ▼
    Onboarding (/onboarding/profile → lifestyle → style)
            │
            ▼
    Dashboard (/dashboard)
            │
    ┌───────┼───────┬───────────┬────────────┬──────────────┐
    ▼       ▼       ▼           ▼            ▼              ▼
 Face    Body   Fashion    Digital      Virtual        Recommendations
Analysis Analysis  DNA      Avatar       Try-On         + Stylist
    │       │       │           │            │              │
    └───────┴───────┴───────────┴────────────┴──────────────┘
                            │
                    Products (/products)
                            │
              Wishlist ── Cart ── Orders ── Personal Closet
```

### Admin flow

```
/login (Admin tab) or /admin/login
    │
    ▼
/admin/dashboard → users, products, orders, analytics, profile
```

---

# Features

## Authentication

**Purpose:** User and admin identity, JWT sessions, optional face biometrics.

**Current flow:**
1. `POST /auth/register` → JWT + redirect to face registration.
2. `POST /auth/login` → access + refresh tokens stored in Zustand (`wardrobe-auth` persist).
3. `SessionProvider` validates via `GET /auth/me`, refreshes on 401.
4. Face: `POST /face/register` (JWT), `POST /face/login` (public) → InsightFace embed → Qdrant match → JWT.

**Data used:** User, FaceRegistration, Redis refresh tokens.

**APIs:** `AUTH.*`, `FACE.*`, `ADMIN.login`, `ADMIN.face-login`.

**Components:** `auth-guard`, `guest-guard`, `session-provider`, `login-form`, `register-form`, `face-login-view`, `face-registration-stepper`.

**Guards:** Client-side only — **no Next.js middleware**. `AuthGuard`, `AdminGuard`, `GuestGuard`, `LandingGate`.

**Improvement opportunities:** Forgot password is UI-only mock. `RolesGuard` is a stub (always `true`). Public `POST/PUT/DELETE /products` has no auth.

---

## Onboarding

**Purpose:** Collect profile, lifestyle, style preferences before dashboard.

**Flow:** Three steps guarded by `OnboardingStepGuard` + `useOnboardingStore` (persisted `wardrobe-onboarding`).

**Routes:** `/onboarding/profile`, `/lifestyle`, `/style`.

**APIs:** `PUT /users/profile`, body image upload via profile/onboarding forms.

---

## Dashboard

**Purpose:** Central hub with stats, quick actions, today's picks, Fashion DNA summary.

**Route:** `/dashboard`.

**Components:** `dashboard-view`, `welcome-section`, `stats-grid`, `action-buttons`, `todays-picks`, `fashion-dna-card`.

---

## Face Analysis

**Purpose:** AI analysis of face shape, skin tone, hair traits for styling.

**Flow:** Upload/capture face → `POST /face-analysis/analyze` → FastAPI DeepFace pipeline → stored in `FaceAnalysis` + Qdrant vector.

**Route:** `/face-analysis`.

**APIs:** `FACE_ANALYSIS.*`.

**Components:** `face-analysis-view`, `face-scan-card`, `face-trait-analysis-card`.

---

## Body Analysis

**Purpose:** Body measurements, body type, fit profile from photo/video.

**Flow:** MediaPipe pose estimation → measurements → `BodyAnalysis` record.

**Route:** `/body-analysis`.

**APIs:** `BODY_ANALYSIS.*`, background removal via `POST /virtual-tryon/remove-background`.

**Components:** `body-analysis-view`, `studio-body-photo`, `body-proportions-radar`.

**Store:** `useBodyCaptureStore` for capture files.

---

## Fashion DNA

**Purpose:** Computed style profile from face, body, preferences, and behavioral signals.

**Inputs:** Face analysis, body analysis, onboarding preferences, closet, purchases, wishlist, try-ons, stylist chats, product views.

**Scoring:** `fashion-dna-engine.service.js` — style axes (Minimalist, Classic, Streetwear, etc.), confidence weights (face 15%, body 15%, closet 15%, etc.), budget tiers, brand/color affinity JSON.

**APIs:** `FASHION_DNA.generate`, `.me`, `.history`, `.update`.

**FastAPI:** `POST /fashion-dna/analyze` — sentence-transformers embedding → Qdrant.

**Route:** `/fashion-dna`.

**Components:** `StyleRadarChart`, `FashionConfidenceCard`, `BrandAffinityCard`, `ColorAffinityCard`, `StyleEvolutionCard`.

---

## AI Recommendations

**Purpose:** Personalized product recommendations (daily, seasonal, event, trending).

**Flow:** Backend builds context from Fashion DNA + activity → `POST /recommendations/generate` (FastAPI) → ranked products.

**Route:** `/recommendations`.

**APIs:** `RECOMMENDATIONS_*`.

**Components:** `recommendations-view`, `recommendation-carousel-section`.

---

## AI Stylist

**Purpose:** Conversational outfit advice with product suggestions.

**Flow:** Chat sessions stored in SQL (`stylist_chat_sessions` — **not in Prisma schema**). `StylistLlmService` calls OpenAI `gpt-4o-mini` with JSON response format when `OPENAI_API_KEY` set; falls back to rule-based suggestions otherwise.

**Route:** `/stylist`.

**APIs:** `STYLIST.suggestions`, `.sessions`, `.chat`.

**Components:** `stylist-chat-view`, `stylist-product-card`.

---

## Virtual Try-On

**Purpose:** CatVTON-powered garment overlay on user's body photo.

**Route:** `/virtual-try-on` (consolidated — `/try-on` removed).

**See dedicated section below.**

---

## Digital Avatar

**Purpose:** 3D wardrobe avatar with outfit layering.

**Providers:**
- **Ready Player Me** — GLB models via `models.readyplayer.me`, editor config from body type.
- **Avaturn** — `@avaturn/sdk`, `NEXT_PUBLIC_AVATAR_CREATOR_PROVIDER=avaturn|native`.
- **Native** — 2D layered overlays from `public/avatar/` placeholders.

**Routes:** `/digital-avatar`.

**APIs:** `DIGITAL_AVATAR.*`, `AVATAR.*` (wardrobe avatar module — distinct from digital-avatar).

**Components:** `digital-avatar-view`, `avatar-3d-canvas`, `avaturn-creator-panel`, `rpm-creator-panel`, Three.js viewers.

**Note:** `POST /digital-avatar/generate/digital-twin` → `digital_twin_3d_service.py` is documented as **architecture stub (not implemented)**.

---

## Wardrobe Avatar (`/avatar` API)

**Purpose:** 2D/3D outfit composition on avatar (pants, shirt, jacket, shoes layers).

**APIs:** `AVATAR.me`, `.generate`, `.outfit`, `.save-look`.

**Separate from** `DigitalAvatar` Prisma model (premium 3D twin).

---

## Product Catalog

**Purpose:** Browse, search, filter, sort apparel.

**Routes:** `/products`, `/products/[id]`.

**APIs:** Public `GET /products`, `/products/search`, `/products/category/:category`.

**Components:** `products-view`, `product-catalog-toolbar`, `product-sort-dropdown` (Radix), `product-sidebar-filters`.

---

## Wishlist / Cart / Orders

| Feature | Route | Key APIs |
|---------|-------|----------|
| Wishlist | `/wishlist` | `WISHLIST.*` |
| Cart | `/cart` | `CART.*`, checkout via `POST /cart/checkout` |
| Orders | `/orders` | `ORDERS.*` |
| Checkout | `/checkout` | **Redirects to** `/cart?checkout=1` |

---

## Personal Closet

**Purpose:** Purchased items, saved outfits, favorite brands/colors from try-on and orders.

**Route:** `/my-closet`.

**APIs:** `PERSONAL_CLOSET.*`.

---

## Profile

**Purpose:** Unified profile dashboard — face, body, DNA, settings, journey timeline.

**Routes:** `/profile`, `/profile/settings`.

---

## Admin Dashboard

**Purpose:** CMS, user management, order fulfillment, analytics.

**Routes:** `/admin/dashboard`, `/users`, `/products`, `/orders`, `/analytics`, `/profile`.

**Auth:** `AdminGuard` + `AdminRoleGuard` (DB `role === ADMIN`).

**Product CMS:** Multi-step wizard, bulk XLSX import, variants, inventory history, image upload.

**APIs:** `ADMIN.*` (~33 protected routes).

---

# Database Schema

**Provider:** PostgreSQL  
**ORM:** Prisma 7.8  
**Sync:** `prisma db push` (no versioned migrations in repo)

## Enums

`UserStatus`, `UserRole`, `Gender`, `BodyType`, `SkinTone`, `ProductCategoryGroupCode`, `AvatarCategory`, `OrderStatus`

## Models (26)

| Model | Table | Purpose |
|-------|-------|---------|
| User | users | Core account, role, status |
| UserProfile | user_profiles | Demographics, preferences, body_image |
| FaceRegistration | face_registrations | Face embed ID, liveness metadata |
| FaceAnalysis | face_analysis | AI face traits |
| BodyAnalysis | body_analysis | Measurements, fit_profile |
| FashionDna | fashion_dna | Style profile JSON + confidence |
| FashionDnaHistory | fashion_dna_history | Archived DNA snapshots |
| DigitalAvatar | digital_avatars | 3D avatar versions per user |
| VirtualTryOn | virtual_try_on | User try-on session state |
| VirtualTryOnResult | virtual_tryons | Generated try-on history |
| TryOnResult | try_on_results | Legacy try-on results (linked to Product) |
| SavedOutfit | saved_outfits | Saved looks from try-on/avatar |
| Product | products | Catalog SKU, CMS fields, try-on flags |
| ProductVariant | product_variants | Color/size SKUs, stock |
| ProductImage | product_images | Gallery images |
| ProductInventoryHistory | product_inventory_history | Stock audit trail |
| ProductCategoryGroup | product_category_groups | MEN, WOMEN, etc. |
| ProductCategory | product_categories | Taxonomy |
| Wishlist | wishlist | User ↔ Product |
| CartItem | cart_items | Shopping cart |
| Order | orders | Purchase records |
| PersonalClosetItem | personal_closet | Owned items |
| FavoriteBrand | favorite_brands | Brand preferences |
| FavoriteColor | favorite_colors | Color preferences |
| ProductView | product_views | Behavioral tracking |
| SearchHistory | search_history | Search queries |

## Key relationships

```
User 1──1 UserProfile, FaceRegistration, FaceAnalysis, BodyAnalysis, FashionDna, VirtualTryOn
User 1──* Order, Wishlist, CartItem, DigitalAvatar, VirtualTryOnResult, TryOnResult, SavedOutfit
Product 1──* ProductVariant, ProductImage, Wishlist, CartItem, TryOnResult
ProductCategoryGroup 1──* ProductCategory
```

## Schema drift (known)

- `order_items`, `stylist_chat_sessions`, `stylist_chat_messages` exist in SQL scripts but **not in Prisma**.
- `Product.category_id` / `brand_id` indexed without Prisma `@relation`.
- `PersonalClosetItem.order_id` / `product_id` — logical FKs only.
- `FashionDnaHistory.fashion_dna_id` — no Prisma relation.

---

# API Documentation

**Base URL:** `http://localhost:3000/api/v1`  
**Swagger:** `http://localhost:3000/docs`  
**Response shape:** `{ success: true, data, timestamp }` (ResponseInterceptor)

## Health (public)

| Method | Path | Auth |
|--------|------|------|
| GET | `/health` | No |
| GET | `/ai/health` | No |
| GET | `/qdrant/health` | No |
| GET | `/health/diagnostics` | No |
| GET | `/metrics` | No |

## Auth

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| POST | `/auth/register` | No | Create account |
| POST | `/auth/login` | No | Email/password login |
| POST | `/auth/refresh` | No | Refresh access token |
| POST | `/auth/logout` | No | Invalidate refresh |
| GET | `/auth/me` | JWT | Current user |

## Users (JWT)

| Method | Path | Purpose |
|--------|------|---------|
| GET/PUT | `/users/profile` | Profile CRUD |
| POST | `/users/artifacts/ensure` | Ensure user artifacts |

## Products (mostly public — security note)

| Method | Path | Auth |
|--------|------|------|
| GET | `/products`, `/products/search`, `/products/category/:cat`, `/products/:id` | No |
| POST/PUT/DELETE | `/products`, `/products/:id` | **No** (use `/admin/products` instead) |

## Face (mixed)

| Method | Path | Auth |
|--------|------|------|
| POST | `/face/login` | No |
| POST | `/face/register`, `/face/verify`, `/face/logout`, PUT `/face/photo` | JWT |

## Face / Body / Fashion DNA / Recommendations (JWT)

Standard CRUD + analyze endpoints per module prefix.

## Virtual Try-On (JWT)

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/virtual-try-on/setup` | Body photo readiness |
| POST | `/virtual-try-on/upload/person` | Temporary body upload |
| GET | `/virtual-try-on/products` | Catalog with try-on filters |
| POST | `/virtual-try-on/generate/:productId` | CatVTON generation |
| GET | `/virtual-try-on/results` | History |
| DELETE | `/virtual-try-on/results/:id` | Delete result |
| POST | `/virtual-try-on/results/:id/save-outfit` | Save look |
| POST | `/virtual-try-on/results/:id/add-to-closet` | Add to closet |
| POST | `/virtual-try-on/apply`, `/reset` | Avatar layer bridge (legacy) |
| GET/POST/DELETE | `/virtual-try-on/saved-outfits` | Saved outfits |

## Cart, Orders, Wishlist, Stylist, Avatar, Digital Avatar, Personal Closet (JWT)

See `frontend/src/constants/api.js` for full endpoint list (~130 backend routes total).

## Admin (`/admin/*`)

Login/face-login public; all other routes require JWT + `role === ADMIN`.

## AI Service (FastAPI `:8000`)

| Prefix | Endpoints |
|--------|-----------|
| `/health`, `/qdrant/health` | Health checks |
| `/face/*` | register, login, verify, logout, embed |
| `/face-analysis/analyze` | Face traits |
| `/body-analysis/analyze`, `/fit-profile` | Body measurements |
| `/fashion-dna/analyze` | DNA embedding |
| `/recommendations/generate` | Product recommendations |
| `/products/embed` | Product vector embedding |
| `/avatar/generate` | 2D avatar generation |
| `/digital-avatar/generate` | Digital twin image |
| `/virtual-tryon/remove-background` | rembg pipeline |
| `/tryon/generate` | **CatVTON** (person + garment URLs in, result URL out) |

**No Server Actions** in Next.js — all mutations via REST from client.

---

# Environment Variables

## Frontend (`frontend/.env.example`)

| Variable | Required | Purpose |
|----------|----------|---------|
| `NEXT_PUBLIC_API_BASE_URL` | Yes | Backend API base (default `http://localhost:3000/api/v1`) |
| `NEXT_PUBLIC_FACE_VECTOR_SIZE` | Optional | Face vector display (example: 128; backend uses 512) |
| `NEXT_PUBLIC_AVATAR_CREATOR_PROVIDER` | Optional | `avaturn` or `native` |
| `NEXT_PUBLIC_AVATURN_SUBDOMAIN` | Optional | Avaturn studio subdomain |
| `NEXT_PUBLIC_DEFAULT_AVATAR_3D_URL` | Optional | Fallback GLB |
| `NEXT_PUBLIC_AI_SERVICE_URL` | Optional | Direct AI service URL (try-on image resolve) |

## Backend (`backend/.env.example`)

| Variable | Required | Purpose |
|----------|----------|---------|
| `DATABASE_URL` | Yes | PostgreSQL connection |
| `JWT_SECRET` | Yes | JWT signing |
| `JWT_EXPIRES_IN` | Optional | Default `7d` |
| `JWT_REFRESH_EXPIRES_IN` | Optional | Default `30d` |
| `REDIS_HOST`, `REDIS_PORT` | Yes | Refresh tokens |
| `QDRANT_URL`, `QDRANT_API_KEY` | Yes | Vector DB |
| `QDRANT_*_COLLECTION` | Optional | Collection names |
| `FACE_VECTOR_SIZE` | Optional | Default 512 |
| `FACE_SIMILARITY_THRESHOLD` | Optional | Match threshold |
| `AI_SERVICE_URL` | Yes | FastAPI internal URL |
| `AI_SERVICE_PUBLIC_URL` | Yes | Public URL for image fetch |
| `STORAGE_*` | Optional | Local upload config |
| `OPENAI_API_KEY` | Optional | AI Stylist |
| `CORS_ORIGINS` | Optional | Allowed origins |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD` | Optional | Bootstrap admin (not in .env.example) |
| `PYTHON_BIN` | Optional | Body photo processing script |

## AI Service (`ai-service/.env.example`)

| Variable | Required | Purpose |
|----------|----------|---------|
| `HF_TOKEN` | **Yes for try-on** | Hugging Face CatVTON quota |
| `INSIGHTFACE_MODEL` | Optional | Default `buffalo_sc` |
| `TRYON_TIMEOUT_SECONDS` | Optional | Default 120 |
| `TRYON_FALLBACK_ON_QUOTA_EXCEEDED` | Optional | Local overlay fallback |
| `SENTENCE_MODEL` | Optional | `all-MiniLM-L6-v2` |
| Redis/Qdrant | Same as backend | Shared infra |

---

# Components

## Shared UI (`src/components/ui/`)

| Component | Purpose |
|-----------|---------|
| `button` | CVA variants (default, outline, ghost, destructive) |
| `input`, `label`, `checkbox` | Form controls |
| `card`, `glass-card` | Surface containers |
| `alert` | Status messages |
| `badge` | Labels |
| `select` | Radix dropdown |
| `scroll-area` | Scrollable regions |
| `skeleton` | Loading placeholders |
| `progress` | Progress bars |
| `separator` | Dividers |
| `primary-button`, `secondary-button` | Branded CTAs |

## Shared (`src/components/shared/`)

`empty-state`, `error-state`, `loading-state`, `form-field`

## Providers

`AppProviders` → `QueryClientProvider` + `SessionProvider`

## Feature components

Documented per feature in **Features** section. Virtual try-on uses decomposed components:

`UploadPanel`, `UploadDropzone`, `WebcamButton`, `OutfitCarousel`, `OutfitCard`, `PreviewPanel`, `EmptyPreview`, `LoadingPreview`, `GeneratedPreview`, `TryOnFooter`, `ActionButtons`, `TryOnHistory`

---

# UI Design System

## Brand colors (`globals.css`)

| Token | Value | Usage |
|-------|-------|-------|
| `--navy` | #111827 | Auth panels |
| `--purple` | #8b5cf6 | Primary brand |
| `--purple-light` | #a78bfa | Highlights |
| `--purple-dark` | #7c3aed | Hover states |
| `--dashboard-bg` | #060b1f | App background |
| `--dashboard-surface` | #111827 | Cards |
| `--dashboard-surface-elevated` | #1a2235 | Elevated surfaces |
| `--dashboard-border` | rgba(255,255,255,0.08) | Borders |
| `--dashboard-foreground` | #f9fafb | Text |
| `--dashboard-muted` | rgba(255,255,255,0.55) | Secondary text |

## Virtual Try-On premium tokens (`virtual-try-on-tokens.js`)

| Token | Value |
|-------|-------|
| Background | #090B18 |
| Card | #141B2D |
| Purple | #7C3AED |
| Accent | #A855F7 |
| Border radius | 20px |
| Transition | 300ms ease |

## Typography

- **Font:** Inter (Google Fonts import)
- **Base size:** 16px (`--font-size`)

## Spacing & radius

- **Default radius:** `--radius: 1.25rem` (20px)
- Tailwind v4 `@theme inline` maps CSS variables to utilities

## Patterns

- **Dark glassmorphism:** `backdrop-blur-md`, semi-transparent borders
- **Cards:** `rounded-[20px]` or `rounded-[24px]`, border `white/10`
- **Buttons:** Gradient purple CTAs, outline secondary
- **Loading:** Skeleton pulses, shimmer animations (`vto-shimmer`, `vto-progress` keyframes)
- **Icons:** Lucide React throughout
- **Charts:** Recharts for Fashion DNA radar/history

## Toast system

**Not identified** — no dedicated toast library (sonner/react-hot-toast) in dependencies. Errors shown inline via `Alert` or panel messages.

---

# State Management

## Global (Zustand)

| Store | Persist | Keys |
|-------|---------|------|
| `useAuthStore` | Yes (`wardrobe-auth`) | accessToken, refreshToken, user |
| `useOnboardingStore` | Yes (`wardrobe-onboarding`) | personalDetails, lifestyle, style, completed |
| `useUiStore` | No | sidebar collapse, mobile menu |
| `useBodyCaptureStore` | No | bodyImageFile, videoFile |

## Server state (TanStack Query)

- Feature hooks: `use-virtual-try-on.js`, `use-body-analysis.js`, `use-profile.js`, etc.
- Stale times from `constants/app.js` (`QUERY_STALE_TIME`)
- Mutations invalidate related query keys

## Context

- `SessionProvider` — auth status, `revalidate()`

## Caching

- **Redis:** Refresh tokens, AI service response cache (`REDIS_CACHE_TTL`)
- **React Query:** Client-side API response cache
- **Qdrant:** Vector similarity (not HTTP cache)

**No Redux.**

---

# Authentication

| Mechanism | Implementation |
|-----------|----------------|
| **JWT access** | Bearer header, 7d default |
| **Refresh token** | UUID in Redis `auth:refresh:{token}` |
| **Password** | bcryptjs hash |
| **Face login** | InsightFace 512-dim embed → Qdrant cosine similarity |
| **Admin** | `UserRole.ADMIN` + `AdminRoleGuard` DB check |
| **OAuth** | **Not implemented** |

### Protected routes (client-side)

`PROTECTED_ROUTES` in `routes.js` is **reference only** — enforcement via layout guards:

- `(dashboard)`, `(products)`, `(profile)`, `(ai)` layouts → `AuthGuard`
- `admin/layout.js` → `AdminGuard`
- Public: `/`, `/login`, `/register`, `/forgot-password`, `/face/login`

---

# AI Integrations

## Face Recognition (InsightFace)

```
Camera → Frontend → Backend /face/login → FastAPI /face/login
    → InsightFace embed → Qdrant search → JWT if match
```

- Model: `buffalo_sc` (configurable)
- Thresholds: `FACE_SIMILARITY_THRESHOLD` (0.40), uncertain band 0.32
- Liveness: blink/smile detection on registration

## Face Analysis (DeepFace)

- Traits: face shape, skin tone, hair attributes
- Stored: `FaceAnalysis` + Qdrant `face_analysis_vectors`

## Body Analysis (MediaPipe)

- Pose landmarks → measurements → body type
- `fit-profile` endpoint for sizing recommendations
- Background removal: rembg via `BodyPhotoProcessingService`

## Fashion DNA (sentence-transformers + rules engine)

- FastAPI generates embedding; NestJS `fashion-dna-engine.service.js` computes scores, confidence, budget tier, style personality

## Recommendations

- Context builder aggregates DNA + activity → FastAPI `/recommendations/generate`

## Virtual Try-On (CatVTON / Hugging Face)

- See **Virtual Try-On** section

## AI Stylist (OpenAI)

- `gpt-4o-mini`, JSON mode, product ID matching
- Graceful fallback when `OPENAI_API_KEY` missing

## Product Embeddings

- `POST /products/embed` on create/update (async fire-and-forget)

## Error handling

- `AiService.mapResponseError()` — maps FastAPI status to Nest exceptions
- Try-on: retry delays [2s, 4s, 8s], model-loading detection
- Timeouts: 30s default API, 120s face/try-on

---

# Virtual Try-On

## Current implementation

**Single user-facing route:** `/virtual-try-on`  
**HTTP API:** `/api/v1/virtual-try-on/*`  
**Engine module:** `backend/src/modules/try-on/` (internal, no HTTP controller)

## Pipeline

```
1. User body photo (onboarding OR temporary upload OR webcam)
2. User selects product from catalog (compatibleOnly filter)
3. POST /virtual-try-on/generate/:productId
4. VirtualTryOnService resolves body + garment URLs
5. TryOnService → POST ai-service/tryon/generate
6. CatVTON Gradio Client (zhengchong/CatVTON on Hugging Face)
7. Result image saved → storage → VirtualTryOnResult record
8. UI: before/after slider, download, save, closet, history
```

## Image upload

- Person: `POST /virtual-try-on/upload/person` (12MB max, multer memory)
- Storage path: `uploads/try-on/{userId}/person.{ext}`
- Background removal triggered on person upload via `TryOnUploadService`

## Product filtering

- `is_try_on_compatible` flag on Product
- `TRY_ON_COMPATIBLE_PRODUCT_TYPES` constant (upper/lower body garments)
- Query param `compatibleOnly=true` with auto-fallback

## HF model

- **Space:** `zhengchong/CatVTON` (env `CATVTON_SPACE`)
- **Client:** `gradio_client`
- **Token:** `HF_TOKEN` required for production
- **Fallback:** Local overlay if quota exceeded (disabled when HF_TOKEN set by default)

## Output

- Served from `ai-service/app/generated/tryon/` or storage
- URLs under `/tryon/` resolved against `AI_SERVICE_PUBLIC_URL`

## History

- `VirtualTryOnResult` table (`virtual_tryons`)
- UI: `TryOnHistory` — save outfit, download, add to closet, delete

## Limitations

- 15–90 second generation time; HF quota/rate limits
- Upper/lower body garments only (CatVTON constraint)
- Requires body photo for quality results
- No real-time video try-on

## Future improvements

- Queue system for concurrent generations
- GPU self-hosting to remove HF dependency
- Garment segmentation quality improvements

---

# Digital Avatar

## Ready Player Me

- GLB URLs: `https://models.readyplayer.me/{avatarId}.glb`
- `rpm-avatar.util.js` — extract ID, build editor config from body type
- Frontend: RPM creator panel, Three.js `avatar-3d-canvas`

## Avaturn

- `@avaturn/sdk` integration
- `NEXT_PUBLIC_AVATAR_CREATOR_PROVIDER=avaturn`
- Subdomain from `NEXT_PUBLIC_AVATURN_SUBDOMAIN`

## Native / 2D overlays

- `public/avatar/{category}/placeholder.png`
- Layer stack: body → pants → tshirt → shirt → jacket → shoes

## Avatar generation (FastAPI)

- `POST /avatar/generate` — 2D composite from traits
- `POST /digital-avatar/generate` — image-based digital twin
- `POST /digital-avatar/generate/digital-twin` — **stub, not implemented**

## Customization

- Body type → RPM body type mapping (`avatar-parameter-engine.js`)
- Outfit slots via `AVATAR.outfit` API

---

# Fashion DNA

## Inputs

Face analysis, body analysis, onboarding style/lifestyle, product views, searches, wishlist, cart, orders, try-ons, stylist sessions, closet items.

## Scoring algorithm (`fashion-dna-engine.service.js`)

**Confidence weights (total 100%):**
- Face 15%, Body 15%, Preferences 15%, Closet 15%, Purchases 15%
- Wishlist 10%, Try-on 10%, Stylist 5%, Consistency 10%

**Style axes:** Minimalist, Classic, Casual, Formal, Streetwear, Luxury, Athleisure, Avant-garde

**Budget tiers:** BUDGET → LUXURY based on average purchase price

**Outputs:** `style_type`, `budget_range`, `color_affinity`, `brand_affinity`, `fashion_confidence_score`, trait JSON blobs

## UI

- `StyleRadarChart` — Recharts radar
- `ScoreHistoryChart` — DNA evolution over time
- Confidence breakdown cards

---

# Product Management

## Taxonomy

- Groups: MEN, WOMEN, ACCESSORIES, FOOTWEAR
- Categories: shirts, t-shirts, jackets, pants, footwear, etc.
- `product_type` field drives try-on slot mapping

## CMS fields (admin)

- Multi-step wizard: basics → details → media → variants → inventory → publish
- Variants: color, size, SKU, stock, price override
- Bulk XLSX validate/import
- Inventory history audit trail
- Image uploader (up to 12 images, 8MB each)

## Virtual try-on mapping

- `PRODUCT_TYPE_TO_TRY_ON_SLOT` — maps type to outfit slot
- `is_try_on_compatible` boolean
- `try_on_image` — garment image for CatVTON

## Public vs admin APIs

- Public read: `GET /products`
- Admin write: `/admin/products/*` (authenticated)

---

# Admin Module

| Page | Route | Features |
|------|-------|----------|
| Dashboard | `/admin/dashboard` | Metrics overview |
| Analytics | `/admin/analytics` | Charts, KPIs |
| Users | `/admin/users` | List, edit, deactivate, delete |
| Products | `/admin/products` | CMS wizard, bulk import, inventory |
| Orders | `/admin/orders` | Status updates, export CSV, analytics |
| Profile | `/admin/profile` | Admin profile, change password, face register |

---

# Known Issues

| Category | Issue |
|----------|-------|
| **Incomplete features** | Forgot password — UI mock only (`setTimeout`, no API) |
| | Checkout page redirects to cart — no dedicated checkout flow |
| | Digital Twin 3D — stub in `digital_twin_3d_service.py` |
| | `RolesGuard` always returns `true` |
| **Security** | Public `POST/PUT/DELETE /products` without auth |
| | Default JWT secret in docker-compose example |
| **Schema drift** | `order_items`, stylist chat tables not in Prisma |
| | Manual SQL migrations vs `db push` only |
| **Config inconsistency** | `NEXT_PUBLIC_FACE_VECTOR_SIZE=128` in frontend example vs 512 in backend |
| **Dead code** | `PROTECTED_ROUTES` / `PUBLIC_ROUTES` unused for enforcement |
| | Legacy `/virtual-try-on/apply`, `/reset` frontend service methods unused |
| | Empty `app/(admin)/` route group folders |
| | `app/try-on/_components/` remnants may exist without page |
| **Placeholders** | Avatar overlay `placeholder.png` files |
| | Product avatar overlays point to placeholders |
| **Documentation** | No root README |
| | `TRY_ON_REFACTOR_REPORT.md` references removed `/try-on` route |

---

# Performance Report

| Area | Finding |
|------|---------|
| **Large components** | `admin-products-view.js`, `virtual-try-on-view.js`, `digital-avatar-view.js` — orchestration-heavy |
| **Duplicate logic** | Product formatting in multiple mappers; try-on URL resolution in frontend + backend |
| **Re-renders** | Virtual try-on loading phase interval (3.5s) — acceptable |
| **Heavy queries** | Product catalog with 48-item limit; admin product list pagination |
| **Slow APIs** | CatVTON try-on 15–120s; face analysis with TensorFlow cold start |
| **Bundle** | Three.js + R3F + Framer Motion — significant JS on digital-avatar route |
| **Build** | ESLint warning: `nextVitals is not iterable` (non-blocking) |
| **OneDrive** | `.next` cache corruption risk noted in dev |

---

# Refactoring Suggestions

## Critical

1. **Secure public product mutation routes** — require admin JWT on POST/PUT/DELETE `/products`.
2. **Add Prisma migrations** — replace `db push` for production schema versioning.
3. **Sync Prisma schema** with `order_items`, stylist chat tables.

## High

4. Consolidate try-on URL resolution into single shared utility.
5. Implement forgot-password API or remove route.
6. Add Next.js middleware for server-side auth redirect (defense in depth).
7. Remove or implement `RolesGuard`.

## Medium

8. Split large view components into smaller hooks + presentational components.
9. Add toast notification system for global feedback.
10. Document and fix env variable inconsistencies (face vector size).
11. Lazy-load Three.js only on digital-avatar route.

## Low

12. Add root README linking to service READMEs.
13. Remove unused virtual-try-on legacy API client methods.
14. Update historical markdown reports.

---

# Future Roadmap

## Enterprise

- Multi-tenant admin, RBAC beyond USER/ADMIN
- Payment gateway integration (Stripe)
- Email service (password reset, order confirmations)
- Audit logging for admin actions

## AI

- Self-hosted CatVTON inference
- Real-time try-on video
- Digital Twin 3D implementation
- Fine-tuned recommendation models
- On-device face recognition option

## Performance

- CDN for product images
- ISR for product catalog pages
- API response compression (already has helmet/compression)
- Background job queue (BullMQ) for try-on

## UX

- Unified design tokens across dashboard and premium pages (virtual try-on already premium)
- PWA offline catalog browsing
- Push notifications for order status

---

# Coding Standards

Detected from codebase:

| Convention | Pattern |
|------------|---------|
| **Language** | JavaScript (not TypeScript) for app code |
| **Frontend structure** | Feature-sliced: `features/{domain}/components|hooks|services|utils` |
| **Backend structure** | NestJS modules: `controllers/`, `services/`, `repositories/`, `dto/` |
| **File naming** | kebab-case: `virtual-try-on.service.js` |
| **Components** | PascalCase exports, `'use client'` directive for interactive |
| **API client** | Central `apiClient()` in `services/api-client.js` |
| **Constants** | `ROUTES`, `API_ENDPOINTS` in `constants/` |
| **Styling** | Tailwind utility classes; `cn()` from `clsx` + `tailwind-merge` |
| **Forms** | React Hook Form + Zod resolvers |
| **Data fetching** | TanStack Query hooks per feature |
| **Auth** | Zustand persist + SessionProvider validation |
| **Backend DI** | `@Inject()` constructor injection (Babel decorators) |
| **Validation** | class-validator DTOs + global ValidationPipe |
| **Error responses** | `{ success: false, statusCode, message[], timestamp }` |

---

# Prompt Context

> **For AI assistants:** Read this section first.

**Wardrobe AI** is a **monorepo** with three apps:

1. **`frontend/`** — Next.js 15 App Router, React 19, Tailwind 4, Zustand, TanStack Query. JavaScript only. Port **3001** in dev. No middleware; client-side `AuthGuard`/`AdminGuard`. No Server Actions.

2. **`backend/`** — NestJS 11 REST API at `/api/v1`. Prisma 7 + PostgreSQL. Redis (refresh tokens). Qdrant (vectors). Port **3000**. Swagger at `/docs`.

3. **`ai-service/`** — FastAPI Python ML service. Port **8000**. InsightFace (face), MediaPipe (body), CatVTON/HuggingFace (try-on), sentence-transformers (embeddings).

**Key user flows:** Register → Face register → Onboarding → Dashboard → AI features (DNA, recommendations, stylist, try-on, avatar) → Shop (products, cart, orders, closet).

**Auth:** JWT Bearer + optional face login. Admin role via `UserRole.ADMIN`.

**Virtual try-on:** Only `/virtual-try-on` (not `/try-on`). Backend `VirtualTryOnModule` → internal `TryOnModule` → `ai-service/tryon/generate` (CatVTON). Requires `HF_TOKEN`.

**Digital avatar:** Ready Player Me + Avaturn + native 2D overlays. Three.js on frontend.

**Database:** 26 Prisma models. Use `prisma db push` (no migrations folder). Watch for schema drift (stylist chat, order_items).

**Env files:** `frontend/.env.local`, `backend/.env`, `ai-service/.env` (gitignored). Examples in each service's `.env.example`.

**Do not assume TypeScript.** Do not add Server Actions. Prefer existing patterns: feature folders, React Query hooks, `apiClient`, Nest repositories.

**Known gaps:** Forgot password mock, checkout redirect-only, public product write routes unguarded, digital twin 3D stub.

**Start dev:** `npm run dev` from root (PowerShell scripts) or separately: backend `:3000`, frontend `npm run dev:3001`, ai-service `:8000`, Docker for postgres/redis/qdrant.

---

*End of PROJECT_CONTEXT.md*
