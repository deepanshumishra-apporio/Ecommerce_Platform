# Encommerce Application Documentation

## 1. Project Overview

The Encommerce Application is a monorepo-based ecommerce platform with:

- A `Next.js` frontend application (`apps/frontend`) for storefront and admin-oriented UI rendering.
- An `Express.js` backend application (`apps/backend`) that exposes REST APIs for ecommerce workflows.
- A shared Prisma database package (`packages/db`) that defines the schema and generated client.

The repository uses npm workspaces and Turbo for task orchestration across apps and packages.

## 2. Repository Structure

- `apps/frontend`: Next.js 16 frontend.
- `apps/backend`: Express + TypeScript backend API server.
- `packages/db`: Prisma schema, config, generated client, and database exports.
- `packages/ui`: Reusable UI primitives.
- `packages/eslint-config`: Shared linting configuration package.

## 3. Technology Stack

- **Frontend**: Next.js 16, React 19, TypeScript, Tailwind CSS 4.
- **Backend**: Node.js, Express, TypeScript, Zod validation, Clerk middleware, Razorpay integration.
- **Database**: PostgreSQL via Prisma ORM.
- **Tooling**: Turbo, npm workspaces, Prettier.

## 4. Current Implementation Status

### 4.1 Frontend (Implemented)

- Root page renders `StorefrontShell` from `apps/frontend/components/storefront-shell.tsx`.
- `StorefrontShell` includes:
  - Sidebar navigation.
  - Header and search/action controls.
  - Hero/overview section.
  - KPI statistics cards.
  - Product grid sections.
  - Order panel.
  - Category spotlight panel.
  - Loader/skeleton states.
- Reusable local UI components are in `apps/frontend/components/ui`.
- Layout metadata and base styling are configured in `apps/frontend/app/layout.tsx`.

### 4.2 Backend (Implemented)

- Server bootstrap:
  - CORS configured with frontend origin.
  - Security middleware via Helmet.
  - Request logging via Morgan.
  - Clerk middleware for auth context.
  - JSON/urlencoded parsers and webhook raw-body route.
  - Health endpoint (`GET /health`).
  - Centralized not-found and error handlers.
- Route registration under `/api/v1` is complete for all core domains.

#### Implemented API Domains

- **Auth**
  - `POST /api/v1/auth/webhook`
  - `GET /api/v1/auth/me`
- **Products**
  - List/get products, list product reviews, admin create/update/delete.
- **Categories**
  - List categories, admin create/update/delete.
- **Cart**
  - Get cart, add item, update item quantity, remove item.
- **Wishlist**
  - Get wishlist, add item, remove item.
- **Orders**
  - Create order, list own orders, get order, admin status update.
- **Payments**
  - Create payment order, verify payment.
- **Reviews**
  - Create review.
- **Addresses**
  - List/create/update/delete addresses.
- **Coupons**
  - Apply coupon, admin create/list coupons.
- **Admin**
  - Dashboard metrics, order overview, user overview endpoints.

#### Backend Supporting Layers

- Validation middleware with Zod schemas per domain.
- Authorization middleware (`requireDbUser`, `requireAdmin`).
- Async handler and structured success response utility.
- Utility functions:
  - `calculateDiscount` for percentage/fixed coupon logic with max-cap handling.
  - `getPagination` with safe defaults and max limit enforcement.
  - `AppError` for standardized error propagation.

### 4.3 Database Layer (Implemented)

- Prisma schema includes models for:
  - `User`, `Product`, `Category`, `Cart`, `CartItem`,
  - `Wishlist`, `WishlistItem`,
  - `Order`, `OrderItem`, `Transaction`,
  - `Review`, `Address`, `Coupon`.
- Enumerations defined:
  - `Role`, `OrderStatus`, `PaymentStatus`, `CouponDiscountType`.
- Core relations, uniqueness constraints, and indexes are configured.
- Prisma client generation is configured to output to `packages/db/generated/client`.
- Prisma config loads `DATABASE_URL` from `packages/db/.env` and validates presence at startup.

## 5. Environment and Configuration

### 5.1 Required Backend Environment Variables

- `NODE_ENV` (optional, defaulted).
- `PORT` (optional, defaulted).
- `FRONTEND_URL` (optional, defaulted).
- `DATABASE_URL` (required).
- `CLERK_PUBLISHABLE_KEY` (required).
- `CLERK_SECRET_KEY` (required).
- `CLERK_WEBHOOK_SIGNING_SECRET` (required).
- `RAZORPAY_KEY_ID` (optional).
- `RAZORPAY_KEY_SECRET` (optional).

### 5.2 Workspace Commands

From repository root:

- `npm run dev` - run development tasks through Turbo.
- `npm run build` - build all workspace targets.
- `npm run lint` - run linting pipelines.
- `npm run check-types` - run type checks.
- `npm run format` - format supported files.

## 6. What Is Completed vs In Progress

### Completed

- Monorepo architecture and workspace tooling.
- Frontend shell UI scaffold with reusable component pattern.
- Backend domain routes/controllers/services/middlewares structure.
- Prisma schema for ecommerce core entities.
- Auth middleware integration and role-protected admin routes.
- Payment route/controller flow for creation and verification.

### Not Yet Evident in Repository (Likely Next Focus)

- Automated tests (unit/integration/e2e) are not currently visible.
- CI/CD pipeline configuration is not currently visible.
- Deployment manifests or infrastructure provisioning are not currently visible.
- End-user documentation for setup and API usage was missing before this document.

## 7. Recommended Next Steps

### Priority 1: Stabilization and Quality

1. Add backend tests:
   - Unit tests for services/utilities.
   - Integration tests for `/api/v1` routes.
2. Add frontend tests:
   - Component tests for shell and UI primitives.
   - Critical flow tests for cart/order states.
3. Add strict lint and type-check enforcement in CI.

### Priority 2: API and Product Readiness

1. Publish an API contract (OpenAPI/Swagger) for all current endpoints.
2. Add request/response examples for each public endpoint.
3. Harden payment and webhook idempotency and audit logging.
4. Add stock, order-state, and coupon-edge-case validations.

### Priority 3: Production Operations

1. Add CI/CD workflow for build, lint, type-check, and tests.
2. Add environment templates (`.env.example`) for backend/db/frontend.
3. Add deployment documentation for staging and production.
4. Add monitoring, structured logging, and error alerting strategy.

### Priority 4: Frontend Completion

1. Connect `StorefrontShell` demo content to live backend APIs.
2. Add authenticated user flows (profile, orders, address management).
3. Implement product detail and checkout experience.
4. Improve accessibility and responsive coverage for all components.

## 8. Documentation Maintenance Notes

- Keep this document updated whenever new modules, endpoints, or workflows are introduced.
- Update the "Completed" and "Recommended Next Steps" sections at the end of each milestone.
- Keep environment variable sections synchronized with runtime validation schemas.
