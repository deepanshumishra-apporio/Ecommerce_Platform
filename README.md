# Ecommerce Platform

A full-stack ecommerce application built with a **Next.js** frontend and an **Express** backend, structured as a **Turborepo** monorepo.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 15, TypeScript, Tailwind CSS |
| Backend | Express 5, TypeScript, Node.js |
| Database | PostgreSQL via Prisma ORM (hosted on Neon) |
| Auth | Clerk (JWT-based, webhook sync) |
| Payments | Razorpay |
| Media Storage | ImageKit (images/videos) |
| File Storage | Cloudflare R2 (S3-compatible) |
| Monorepo | Turborepo + npm workspaces |

---

## Features

- **Product catalogue** — list, search, filter by category, price range, sort
- **Product detail** — image gallery, reviews, stock indicator
- **Cart** — add / update / remove items, persisted per user
- **Wishlist** — save products for later
- **Checkout & Payments** — Razorpay integration with order + transaction tracking
- **Orders** — user order history with status tracking
- **Reviews** — leave a review only after purchasing a product
- **Addresses** — save delivery addresses with geo-coordinates
- **Admin dashboard** — metrics (revenue, orders, low-stock alerts)
- **Admin products** — create/edit/delete products with URL or local file upload (ImageKit)
- **Admin orders** — view all orders, update order status
- **Admin users** — view all registered users

---

## Project Structure

```
encommerce_application/
├── apps/
│   ├── backend/          # Express API (REST, /api/v1)
│   │   ├── src/
│   │   │   ├── controllers/
│   │   │   ├── services/
│   │   │   ├── routes/
│   │   │   ├── middlewares/
│   │   │   ├── validations/
│   │   │   ├── lib/        # Prisma, ImageKit, R2, async-handler
│   │   │   └── utils/
│   │   └── .env.example
│   └── frontend/          # Next.js app (App Router)
│       ├── app/
│       │   ├── (admin)/   # Admin pages (protected)
│       │   ├── (auth)/    # Sign-in / Sign-up
│       │   └── (shop)/    # Public storefront
│       ├── components/
│       ├── lib/
│       │   └── api.ts     # All API client functions
│       └── .env.example
└── packages/
    └── db/                # Shared Prisma schema & client
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- npm 11+
- A PostgreSQL database (e.g. [Neon](https://neon.tech))
- [Clerk](https://clerk.com) account
- [Razorpay](https://razorpay.com) test account
- [ImageKit](https://imagekit.io) account
- [Cloudflare R2](https://developers.cloudflare.com/r2/) bucket (optional — for R2 uploads)

### Installation

```bash
# Clone the repo
git clone https://github.com/Deepanshumishra2004/Ecommerce_Platform.git
cd Ecommerce_Platform

# Install all dependencies
npm install
```

### Environment Variables

Copy the example files and fill in your credentials:

```bash
cp apps/backend/.env.example   apps/backend/.env
cp apps/frontend/.env.example  apps/frontend/.env.local
```

**Backend** (`apps/backend/.env`) — see [.env.example](apps/backend/.env.example)

**Frontend** (`apps/frontend/.env.local`) — see [.env.example](apps/frontend/.env.example)

### Database Setup

```bash
# Generate Prisma client and push schema to DB
cd packages/db
npx prisma db push
npx prisma generate
```

### Run in Development

```bash
# From repo root — starts both frontend (3000) and backend (3001)
npm run dev
```

Or run individually:

```bash
# Backend only
cd apps/backend && npm run dev

# Frontend only
cd apps/frontend && npm run dev
```

---

## API Overview

All endpoints are prefixed with `/api/v1`.

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/products` | — | List products (paginated, filterable) |
| GET | `/products/:id` | — | Get single product |
| POST | `/products` | Admin | Create product (supports file upload) |
| PUT | `/products/:id` | Admin | Update product (supports file upload) |
| DELETE | `/products/:id` | Admin | Delete product |
| GET | `/categories` | — | List categories |
| POST | `/categories` | Admin | Create category |
| GET | `/cart` | User | Get cart |
| POST | `/cart/add` | User | Add item to cart |
| PUT | `/cart/update` | User | Update cart item quantity |
| DELETE | `/cart/remove` | User | Remove cart item |
| GET | `/orders` | User | Get user orders |
| POST | `/orders` | User | Create order from cart |
| POST | `/payments/create` | User | Create Razorpay payment order |
| POST | `/payments/verify` | User | Verify payment signature |
| GET | `/wishlist` | User | Get wishlist |
| POST | `/wishlist/add` | User | Add to wishlist |
| DELETE | `/wishlist/remove` | User | Remove from wishlist |
| GET | `/addresses` | User | Get saved addresses |
| POST | `/addresses` | User | Save address |
| GET | `/reviews/can-review/:productId` | User | Check if user can review |
| POST | `/reviews` | User | Submit a review |
| GET | `/admin/dashboard` | Admin | Dashboard stats |
| GET | `/admin/orders` | Admin | All orders |
| PATCH | `/admin/orders/:id/status` | Admin | Update order status |
| GET | `/admin/users` | Admin | All users |

---

## Media Upload

Product images and videos are uploaded directly through the `POST /products` and `PUT /products/:id` endpoints using `multipart/form-data`:

- Attach files under the field name `files` (max 5)
- Attach a `mediaSlots` JSON string describing slot order (`{kind:"url",value:"..."}` or `{kind:"file"}`)
- The backend uploads files to ImageKit `/ecommerce` folder and returns the CDN URLs saved to the database

---

## License

MIT
