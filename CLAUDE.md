# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## Commands

### Development

```bash
# Start both frontend (port 3000) and backend (port 3001) via Turborepo
npm run dev

# Run individually
cd apps/backend && npm run dev    # tsx watch — hot reloads on save
cd apps/frontend && npm run dev   # Next.js dev server
```

### Build & Type-check

```bash
npm run build          # Turborepo parallel build
npm run check-types    # tsc --noEmit across all packages
npm run lint           # ESLint across all packages
npm run format         # Prettier on all .ts/.tsx/.md files
```

### Database (run from `packages/db/`)

```bash
cd packages/db
npx prisma db push        # Push schema to DB (no migration history)
npx prisma generate       # Regenerate Prisma client after schema changes
npx prisma studio         # Visual DB browser
```

### Environment setup

```bash
cp apps/backend/.env.example   apps/backend/.env
cp apps/frontend/.env.example  apps/frontend/.env.local
```

---

## Architecture Overview

This is a **Turborepo + npm workspaces** monorepo. Shared packages live in `packages/`; apps live in `apps/`.

### Packages

| Package | Path | Purpose |
|---|---|---|
| `@repo/db` | `packages/db/` | Single Prisma schema + generated client; imported by backend |
| `@repo/ui` | `packages/ui/` | Shared React UI primitives |
| `@repo/eslint-config` | `packages/eslint-config/` | Shared ESLint config |
| `@repo/typescript-config` | `packages/typescript-config/` | Shared `tsconfig` bases |

### Backend (`apps/backend/`)

Express 5 REST API, ESM (`"type":"module"`), run via `tsx`.

**Request lifecycle:**
```
Request → rate-limit → helmet/CORS → JSON parse → XSS sanitize
       → auth middleware (JWT verify) → Zod validate → controller → service → Prisma → DB
       → error-handler (global catch)
```

- **Controllers** (`src/controllers/`): Thin HTTP layer — parse req, call service, send response.
- **Services** (`src/services/`): All business logic and Prisma calls.
- **Middlewares** (`src/middlewares/`): `auth.middleware.ts` injects `req.userId` / `req.role` after verifying the Bearer JWT. `validate.ts` wraps Zod schemas.
- **Config** (`src/config/env.ts`): All env vars are parsed and validated with Zod at startup — add new vars here before using them.
- **Async errors**: Wrap async route handlers with `asyncHandler` from `src/lib/async-handler.ts` so errors forward to the global error handler automatically.
- **API prefix**: All routes are mounted under `/api/v1` (see `src/routes/index.ts`).

### Authentication

The backend uses **custom JWT auth** (not Clerk at runtime), despite Clerk keys being in `.env`. Flow:

1. `POST /api/v1/auth/signup` or `/signin` → returns a signed JWT (7-day expiry, `{ userId, email, role }` payload).
2. Frontend stores token in `localStorage` under key `auth` via `AuthContext`.
3. Axios interceptor in `apps/frontend/lib/api.ts` auto-attaches `Authorization: Bearer <token>`.
4. `auth.middleware.ts` verifies the token and attaches `req.userId` / `req.role`.
5. **First user to sign up** is automatically promoted to ADMIN.

### Frontend (`apps/frontend/`)

Next.js 16 with the App Router. **Important:** Next.js 16 has breaking API changes from older versions — check `node_modules/next/dist/docs/` before using Next.js APIs.

**Route groups:**

| Group | Path | Access |
|---|---|---|
| `(shop)` | `/products`, `/cart`, `/checkout`, `/orders`, `/wishlist` | Public / authenticated users |
| `(auth)` | `/sign-in`, `/sign-up` | Unauthenticated |
| `(admin)` | `/admin/dashboard`, `/admin/products`, `/admin/orders`, `/admin/users` | ADMIN role only |

**State management:**

- `AuthContext` (`contexts/AuthContext.tsx`): Token + user, `signIn()` / `signOut()` / `getToken()`. Hook: `useAuth()`.
- `CountsContext` (`contexts/CountsContext.tsx`): Live cart and wishlist badge counts.
- `useProductStore` (Zustand, `stores/useProductStore.ts`): Product list filters (search, category, sort, pagination) with 5-minute cache TTL.

**API client** (`lib/api.ts`): All API calls are defined here as typed functions. Base URL defaults to `http://localhost:3001/api/v1` (`NEXT_PUBLIC_API_URL`).

### Media Uploads

Product images are handled by the backend via `multipart/form-data` on `POST /products` and `PUT /products/:id`:

- Files go in field `files` (max 5).
- A `mediaSlots` JSON string describes ordering: `{ kind: "url", value: "..." }` for existing URLs, `{ kind: "file" }` for uploaded files.
- Backend uploads to **ImageKit** (`/ecommerce` folder) and saves CDN URLs to the DB. **Cloudflare R2** is an alternative storage path for non-image files.

### Database

PostgreSQL via Prisma 7 with the `@prisma/adapter-pg` driver. Schema is in `packages/db/prisma/schema.prisma`. Key models: `User`, `Product`, `Category`, `Cart`/`CartItem`, `Order`/`OrderItem`, `Payment`, `Review`, `Address`, `Wishlist`/`WishlistItem`, `Coupon`.

After any schema change: run `prisma db push` then `prisma generate`.

---

## Key Conventions

- **ESM throughout**: Backend uses `import`/`export` (NodeNext resolution). Use `.js` extensions on relative imports in backend TypeScript files.
- **Zod for validation**: Schemas live in `src/validations/`. Always pass through the `validate` middleware before controllers.
- **Rate limits**: Auth = 10 req/15 min, Payments = 20 req/15 min, General = 200 req/15 min.
- **Tailwind v4**: Config is in `postcss.config.mjs` with `@tailwindcss/postcss`. No `tailwind.config.js` — use CSS-first configuration.
