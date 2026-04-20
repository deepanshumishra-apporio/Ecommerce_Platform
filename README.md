# Ecommerce Platform

A full-stack ecommerce application built with **Next.js** and **Express**, structured as a **Turborepo** monorepo.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16, React 19, TypeScript, Tailwind CSS 4 |
| Backend | Express 5, TypeScript, Node.js |
| Auth | Custom JWT (bcrypt + jsonwebtoken) |
| Database | PostgreSQL via Prisma ORM |
| Payments | Razorpay |
| Media Storage | ImageKit |
| Monorepo | Turborepo + npm workspaces |

---

## Features

- **Product catalogue** — list, search, filter by category, sort
- **Product detail** — image gallery, reviews, stock indicator
- **Cart** — add / update / remove items, persisted per user
- **Wishlist** — save products for later
- **Checkout & Payments** — Razorpay integration with order and transaction tracking
- **Orders** — user order history with status tracking
- **Reviews** — submit a review only after purchasing a product
- **Addresses** — save and manage delivery addresses
- **Coupons** — percentage and fixed discount codes with max-cap support
- **Admin dashboard** — revenue metrics, order stats, low-stock alerts
- **Admin products** — create / edit / delete products with image uploads via ImageKit
- **Admin orders** — view all orders, update order status
- **Admin users** — view all registered users

---

## Project Structure

```
encommerce_application/
├── apps/
│   ├── backend/               # Express REST API (/api/v1)
│   │   └── src/
│   │       ├── controllers/
│   │       ├── services/
│   │       ├── routes/
│   │       ├── middlewares/
│   │       ├── validations/
│   │       ├── lib/           # Prisma client, ImageKit, R2, async-handler
│   │       └── utils/
│   └── frontend/              # Next.js App Router
│       ├── app/
│       │   ├── (admin)/       # Admin pages (role-protected)
│       │   ├── (auth)/        # Sign-in / Sign-up / Profile
│       │   └── (shop)/        # Public storefront
│       ├── components/
│       ├── contexts/          # AuthContext, CountsContext
│       ├── stores/            # Zustand product store
│       └── lib/
│           └── api.ts         # Typed API client functions
└── packages/
    ├── db/                    # Shared Prisma schema & generated client
    └── ui/                    # Shared UI primitives
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- npm 11+
- A PostgreSQL database (e.g. [Neon](https://neon.tech))
- [Razorpay](https://razorpay.com) test account
- [ImageKit](https://imagekit.io) account

### Installation

```bash
git clone https://github.com/deepanshumishra-apporio/Ecommerce_Platform.git
cd Ecommerce_Platform
npm install
```

### Environment Variables

```bash
cp apps/backend/.env.example  apps/backend/.env
cp apps/frontend/.env.example apps/frontend/.env.local
```

**Backend** (`apps/backend/.env`):

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `JWT_SECRET` | Yes | Secret key for signing JWTs |
| `PORT` | No | API server port (default: `3001`) |
| `FRONTEND_URL` | No | Frontend origin for CORS (default: `http://localhost:3000`) |
| `RAZORPAY_KEY_ID` | No | Razorpay key ID |
| `RAZORPAY_KEY_SECRET` | No | Razorpay key secret |
| `IMAGEKIT_PUBLIC_KEY` | No | ImageKit public key |
| `IMAGEKIT_PRIVATE_KEY` | No | ImageKit private key |
| `IMAGEKIT_URL_ENDPOINT` | No | ImageKit URL endpoint |

### Database Setup

```bash
cd packages/db
npx prisma db push
npx prisma generate
```

### Run in Development

```bash
# From repo root — starts frontend (3000) and backend (3001) concurrently
npm run dev
```

---

## API Overview

All endpoints are prefixed with `/api/v1`. Protected routes require a `Bearer <token>` header.

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/auth/signup` | — | Register a new user |
| POST | `/auth/signin` | — | Sign in, returns JWT |
| GET | `/auth/me` | User | Get current user profile |
| PATCH | `/auth/profile` | User | Update name / phone |
| PATCH | `/auth/password` | User | Change password |
| GET | `/products` | — | List products (paginated, filterable) |
| GET | `/products/:id` | — | Get single product |
| POST | `/products` | Admin | Create product |
| PUT | `/products/:id` | Admin | Update product |
| DELETE | `/products/:id` | Admin | Delete product |
| GET | `/categories` | — | List categories |
| POST | `/categories` | Admin | Create category |
| GET | `/cart` | User | Get cart |
| POST | `/cart/add` | User | Add item to cart |
| PUT | `/cart/update` | User | Update item quantity |
| DELETE | `/cart/remove` | User | Remove item from cart |
| GET | `/wishlist` | User | Get wishlist |
| POST | `/wishlist/add` | User | Add to wishlist |
| DELETE | `/wishlist/remove` | User | Remove from wishlist |
| GET | `/orders` | User | Get user orders |
| POST | `/orders` | User | Create order from cart |
| POST | `/payments/create` | User | Create Razorpay payment order |
| POST | `/payments/verify` | User | Verify payment signature |
| GET | `/addresses` | User | Get saved addresses |
| POST | `/addresses` | User | Save a new address |
| POST | `/reviews` | User | Submit a review |
| POST | `/coupons/apply` | User | Apply a coupon code |
| GET | `/admin/dashboard` | Admin | Dashboard stats |
| GET | `/admin/orders` | Admin | All orders |
| PATCH | `/admin/orders/:id/status` | Admin | Update order status |
| GET | `/admin/users` | Admin | All users |

---

## Authentication

The platform uses **custom JWT authentication**:

1. `POST /auth/signup` or `/auth/signin` returns a signed JWT (7-day expiry).
2. The frontend stores the token in `localStorage` via `AuthContext`.
3. The Axios client in `lib/api.ts` auto-attaches `Authorization: Bearer <token>`.
4. `auth.middleware.ts` verifies the token and injects `req.userId` / `req.role`.
5. The **first user to sign up** is automatically promoted to `ADMIN`.

---

## Media Uploads

Product images are uploaded via `multipart/form-data` on `POST /products` and `PUT /products/:id`:

- Attach files under the field name `files` (max 5).
- Attach a `mediaSlots` JSON string to describe ordering: `{ kind: "url", value: "..." }` for existing URLs, `{ kind: "file" }` for new uploads.
- The backend uploads to ImageKit (`/ecommerce` folder) and saves CDN URLs to the database.

---

## Scripts

Run from the repository root:

| Command | Description |
|---|---|
| `npm run dev` | Start all apps in development mode |
| `npm run build` | Build all apps and packages |
| `npm run lint` | Run ESLint across the monorepo |
| `npm run check-types` | Run TypeScript type checks |
| `npm run format` | Format all files with Prettier |

---

## License

MIT
