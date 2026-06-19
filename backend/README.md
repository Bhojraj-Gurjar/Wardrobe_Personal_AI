# backend

Wardrobe AI REST API (NestJS + PostgreSQL + Redis + Qdrant).

## Installation

```bash
npm install
```

## Running the app

```bash
# build + start
npm start

# development (rebuild + nodemon)
npm run start:dev
```

Swagger UI: http://localhost:3000/docs

## Postman / API testing

Import-ready files are in `docs/`:

| File | Use |
|------|-----|
| `docs/postman/Wardrobe-AI.postman_collection.json` | **Recommended** — full collection with sample bodies & auto token save |
| `docs/postman/Wardrobe-AI.postman_environment.json` | Local environment (`baseUrl`, tokens) |
| `docs/openapi.json` | OpenAPI 3.0 — import via Postman **Import → File** |

### Postman setup

1. Open Postman → **Import** → select both files in `docs/postman/`.
2. Choose the **Wardrobe AI - Local** environment (top-right).
3. Start the API: `npm start`
4. Run **Auth → Login** — `accessToken` is saved automatically.
5. Call any protected endpoint (Users, Orders, Wishlist, etc.).

To refresh the OpenAPI spec from a running server:

```bash
npm run docs:export
```

## Test

```bash
npm run test
npm run test:e2e
npm run test:cov
```
