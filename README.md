<div align="center">

# 🏪 Warungpedia

### Production-Ready Multi-Vendor Marketplace for Indonesia

![Next.js](https://img.shields.io/badge/Next.js_16-000000?style=flat-square&logo=next.js&logoColor=white)
![React](https://img.shields.io/badge/React_19-61DAFB?style=flat-square&logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS_4-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-3FCF8E?style=flat-square&logo=supabase&logoColor=white)
![Vitest](https://img.shields.io/badge/Tests_327-22C55E?style=flat-square)

[English](./README.md) · [Bahasa Indonesia](./README.id.md)

</div>

---

## 📖 About

**Warungpedia** is a full-stack, production-oriented **multi-vendor marketplace** inspired by Indonesian e-commerce patterns, built with an **original design**, codebase, and brand identity.

> **This is not a UI mockup.** Every feature connects the complete stack — UI → validation → server-side business logic → authorization → database → error handling → audit logging → automated tests. Every money calculation runs on the server as **integer IDR**. The client is never trusted.

The name **Warungpedia** combines *"Warung"* (Indonesian for small shop/stall) with *"-pedia"* (encyclopedia) — symbolizing a comprehensive digital marketplace for Indonesian small businesses.

[🌐 **Live Demo**](#-live-demo) · [📖 [Bahasa Indonesia](./README.id.md)]

---

> ### ⚖️ Intellectual Property Notice
>
> | | |
> |---|---|
> | **Copyright** | © 2026 **Warungpedia**. All rights reserved. |
> | **Brand** | **Warungpedia™** is an original brand identity. The name, logo, design system, and brand palette (`crisp`, `blossom`, `lilac`, `royal`) are the intellectual property of the author. |
> | **License** | This source code is licensed under the [MIT License](./LICENSE). You may study, learn from, and use this code for personal/educational purposes **with proper attribution**. |
> | **Restriction** | **Repackaging, reselling, or commercial redistribution of this project — in whole or in part — as a competing product, SaaS offering, or marketplace template without explicit written permission is strictly prohibited and may constitute intellectual property infringement.** |
>
> *If you intend to use this project commercially or as a base for a product, please contact the author for licensing arrangements.*

---

## 🎯 Purpose

Warungpedia was built as a **portfolio-grade, production-ready project** to demonstrate end-to-end full-stack engineering capabilities:

| Area | Demonstrated Skills |
|---|---|
| **Architecture** | Feature-oriented modular design, clean separation of concerns, 14 server-side service modules |
| **Security** | Defense-in-depth: RBAC, RLS, server-side validation, financial integrity, audit logging |
| **Business Logic** | Multi-vendor cart, parent/child orders, ledger-based financial system, commission engine, voucher & flash-sale promotions |
| **Testing** | 327 automated tests: unit, integration, security, and critical E2E journey simulations |
| **Production Readiness** | SEO, PWA, i18n (ID/EN), dark mode, responsive design, error boundaries, deployment-ready |

---

## 🌐 Live Demo

> 🚀 **Coming soon after Vercel deployment!**
>
> The application will be deployed at: **`https://warungpedia.vercel.app`**
>
> **Demo Accounts:**
> | Role | Email | Password |
> |---|---|---|
> | Super Admin | admin@warungpedia.id | *(set via Supabase Dashboard)* |
> | Seller | seller@warungpedia.id | *(set via Supabase Dashboard)* |
> | Buyer | buyer@warungpedia.id | *(register a new account)* |

---

## ✨ Features

### 🛒 Marketplace Core
- **Multi-Vendor Shopping Cart** — Items from multiple sellers grouped per-store with independent subtotals
- **Parent/Child Order Architecture** — One buyer order splits into per-seller child orders with independent fulfillment
- **Server-Side Checkout** — All price, stock, voucher, and payment calculations run exclusively on the server
- **Integer IDR Money** — All financial values are integer Rupiah, never floating point

### 🏬 Seller System
- **Store Application** — Buyers apply to become sellers with document upload (KTP, NPWP, selfie)
- **Seller Dashboard** — Products, orders, finances, analytics, withdrawals, store settings
- **Product Management** — CRUD with variants, SKU, inventory tracking, multi-image (up to 10), product video
- **Inventory Ledger** — Stock changes tracked with audit trail; prevents overselling and race conditions

### 💰 Financial System
- **Payment Abstraction** — Provider-agnostic payment layer (mock for dev, real provider plug-in ready)
- **Commission Engine** — Global configurable commission rate, recorded in the financial ledger
- **Seller Wallet** — Pending → Available → Settlement → Withdrawal lifecycle
- **Buyer Wallet** — Refund credits usable for future purchases
- **Append-Only Ledger** — Every money movement recorded with signed amounts and balance-after snapshots

### 🎟️ Promotions
- **Vouchers** — Admin-issued discount codes (percent or fixed) with min-spend, per-user limits, usage caps
- **Flash Sales** — Admin-scheduled or seller-initiated time-limited per-product discounts
- **Multi-Voucher Rules** — Configurable combination rules for stacking discounts

### 📦 Shipping & Returns
- **Shipping Integration** — Carrier name, tracking number, delivery status per order
- **Return Requests** — Buyer-initiated returns within configurable window (default 30 days)
- **Dispute Resolution** — Buyer → Seller response → Admin review → Decision workflow
- **Evidence Upload** — Unboxing videos and dispute evidence stored securely

### 💬 Communication
- **Real-Time Chat** — Buyer-seller messaging via Supabase Realtime with typing indicators
- **In-App Notifications** — Order updates, return status, disputes, promotions
- **Email Notifications** — Transactional emails via Edge Functions (opt-in)

### ⭐ Social Commerce
- **Product Reviews** — Verified buyer reviews with 1–5 star ratings
- **Store Following** — Follow stores for notifications
- **Wishlists** — Multiple named collections with product notes
- **Recently Viewed** — Authenticated user browsing history

### 🔍 Search & Discovery
- **Full-Text Search** — PostgreSQL full-text search with trigram similarity for typo tolerance
- **Category Taxonomy** — Hierarchical nested categories (parent/child)
- **Filters & Sorting** — Price, category, rating, location, condition, discount, seller

### 🛡️ Admin & CMS
- **Admin Dashboard** — Marketplace KPIs, user management, store reviews, product moderation
- **AI-Assisted Moderation** — Product screening with admin override and audit trail
- **CMS** — Homepage banners, FAQ, articles, policies (all database-driven)
- **Analytics** — Seller analytics (revenue, orders, conversion) and Admin analytics (GMV, commission, trends)

### 🎨 Design & UX
- **Original Design System** — Custom brand palette and reusable UI components
- **Dark Mode** — Light, dark, and system theme support
- **Responsive** — Mobile, tablet, desktop, and large desktop
- **i18n** — Bahasa Indonesia (default) and English with typed dictionaries
- **PWA** — Installable web app with offline support
- **SEO** — Dynamic metadata, OpenGraph, JSON-LD, sitemap, robots.txt

### 🔒 Security
- **RBAC** — 4 roles (BUYER, SELLER, ADMIN, SUPER_ADMIN) with 15 granular permissions
- **RLS** — Row-Level Security on all sensitive tables
- **Server Authority** — Client never trusted for prices, stock, vouchers, or payment state
- **Input Validation** — Zod schemas on both client and server
- **Audit Logging** — All financial and administrative actions recorded

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | Next.js 16 (App Router, Turbopack) · React 19 · TypeScript · Tailwind CSS 4 |
| **Backend** | Next.js Server Components · Server Actions · Route Handlers · Server-Side Services |
| **Database** | Supabase (PostgreSQL with RLS) |
| **Auth** | Supabase Auth (Email/Password, Google OAuth, Email Verification, Password Reset) |
| **Storage** | Supabase Storage (product images, documents, dispute evidence) |
| **Realtime** | Supabase Realtime (chat, presence, typing indicators) |
| **Edge Functions** | Supabase Edge Functions (email notifications, AI moderation) |
| **Validation** | Zod (both client and server) |
| **Charts** | Recharts (analytics dashboards) |
| **Testing** | Vitest (327 unit, integration & security tests) |
| **Build** | Turbopack (Next.js 16 default) |

---

## 🏗️ Architecture

```
Browser
  │  (Server Components / Server Actions / Route Handlers)
  ▼
Next.js Server (App Router, Turbopack)
  │  Server-side services (src/services/)
  │  Server-only Supabase client (service role)
  │  Request-scoped Supabase client (anon key + session cookie for RLS)
  ▼
Supabase
  ├── PostgreSQL (RLS enforced per row)
  ├── Auth (email/password, OAuth, verification, reset)
  ├── Storage (public + private buckets)
  ├── Realtime (chat, presence)
  └── Edge Functions (AI moderation, email webhooks)
```

### Project Structure

```
src/
├── app/               # App Router routes (pages, layouts, actions, proxy)
│   ├── actions/       # Server Actions (auth, profile, store, product, cart)
│   ├── auth/          # Sign in, sign up, verify, reset, callbacks
│   ├── account/       # Profile & addresses
│   ├── admin/         # Admin dashboard, moderation, CMS
│   ├── seller/        # Seller dashboard, products, orders, finances
│   ├── cart/          # Shopping cart
│   ├── checkout/      # Order confirmation + place order
│   ├── orders/        # Order list & detail
│   ├── search/        # Product & store search
│   ├── chat/          # Buyer-seller messaging
│   └── store/         # Storefront & product detail
├── components/
│   ├── features/      # Feature-specific components
│   ├── layout/        # Header, footer, navigation
│   └── ui/            # Reusable design system
├── config/            # Roles, i18n, site config
├── lib/
│   ├── auth/          # Data Access Layer (identity + RBAC guards)
│   ├── i18n/          # Typed translation dictionaries (id, en)
│   ├── supabase/      # Client / server / service-role clients
│   └── validation/    # Zod schemas
├── services/          # Server-side business logic (14 service modules)
├── styles/            # Global CSS + Tailwind design tokens
├── types/             # TypeScript types (13 domain modules)
└── utils/             # Pure helpers (finance, price, cart, catalog, etc.)

supabase/
├── migrations/        # 13 versioned SQL migrations
├── seed/              # Development seed data
└── functions/         # Edge Functions (email, AI moderation)
```

---

## 📊 Development Phases

| Phase | Focus | Status |
|:---:|---|:---:|
| 0 | Project foundation | ✅ |
| 1 | Authentication & user system | ✅ |
| 2 | Marketplace foundation (UI, homepage, catalog) | ✅ |
| 3 | Seller system | ✅ |
| 4 | Product & inventory | ✅ |
| 5 | Search & discovery | ✅ |
| 6 | Cart & checkout | ✅ |
| 7 | Payment & financial system | ✅ |
| 8 | Shipping, returns & disputes | ✅ |
| 9 | Communication & notifications | ✅ |
| 10 | Promotions | ✅ |
| 11 | Reviews, wishlist & social commerce | ✅ |
| 12 | Admin & CMS | ✅ |
| 13 | Analytics | ✅ |
| 14 | SEO, PWA & performance | ✅ |
| 15 | Comprehensive testing & security audit | ✅ |
| 16 | Production readiness | ✅ |

---

## 🧪 Testing

```text
Test Files  29 passed (29)
     Tests  327 passed (327)
```

| Category | Coverage |
|---|---|
| **Unit Tests** | Finance (commission, return window), promotions (flash sale, voucher), cart (multi-vendor totals), price breakdown, search pagination, catalog tree, analytics series, RBAC permissions |
| **Integration Tests** | Order calculation flow, financial integrity, wallet invariants, refund calculation, settlement, critical E2E journey simulations |
| **Security Tests** | UUID/SQL injection, XSS prevention, privilege escalation, financial tampering, cart manipulation, review rating manipulation, payment method enumeration, dispute escalation DoS |
| **Validation Tests** | Auth, address, product, store, cart, payment, shipping, communication, admin, social, promotions — all Zod schemas |

### Quality Gates

```bash
npm run lint         # ESLint → 0 errors, 0 warnings
npm run typecheck    # TypeScript → 0 errors
npm run test         # Vitest → 327/327 passing
npm run build        # Next.js production build → successful
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18+ (recommended: 20+)
- **npm** 9+
- A **Supabase** project ([create one here](https://supabase.com))

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/warungpedia.git
cd warungpedia

# Install dependencies
npm install

# Configure environment
cp .env.example .env.local
# Edit .env.local with your Supabase credentials
```

### Environment Variables

```env
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_JWT_SECRET=your-jwt-secret
```

### Database Setup

1. Open Supabase Dashboard → **SQL Editor**
2. Run the contents of `supabase/complete_migration.sql`
3. (Optional) Run `supabase/complete_seed.sql` for demo categories & settings

### Run

```bash
npm run dev    # → http://localhost:3000
```

### Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run typecheck` | TypeScript type checking |
| `npm run test` | Run test suite (327 tests) |
| `npm run test:watch` | Run tests in watch mode |
| `npm run test:coverage` | Run tests with coverage |

---

## 🎨 Design System

### Brand Palette

| Token | Color | Hex | Usage |
|---|---|---|---|
| `crisp` | 🟡 | `#FFF4BF` | Highlights, badges |
| `blossom` | 🩷 | `#FFBEFB` | Accent, promotions |
| `lilac` | 🟣 | `#DC95FF` | Secondary accent |
| **`royal`** | 💜 | **`#8C56D4`** | **Primary brand color** |

---

## 📄 Documentation

| Document | Description |
|---|---|
| [ARCHITECTURE.md](./docs/ARCHITECTURE.md) | System architecture and design decisions |
| [DATABASE.md](./docs/DATABASE.md) | Database schema, migrations, and table documentation |
| [SECURITY.md](./docs/SECURITY.md) | Security posture and controls |
| [DEPLOYMENT.md](./docs/DEPLOYMENT.md) | Deployment guide and prerequisites |
| [ENVIRONMENT.md](./docs/ENVIRONMENT.md) | Environment variables and configuration |
| [TESTING.md](./docs/TESTING.md) | Testing strategy and coverage details |

---

## 👨‍💻 Author

Built with ❤️ as a full-stack portfolio project demonstrating production-ready engineering.

**Author:** [irevlix990](https://github.com/irevlix990)
**Brand:** Warungpedia™

---

## 📝 License

This project is licensed under the **MIT License** — see the [LICENSE](./LICENSE) file for details.

```
MIT License — Copyright (c) 2026 Warungpedia
```

### Usage Terms

| ✅ Permitted | ❌ Prohibited |
|---|---|
| Study and learn from the source code | Removing copyright / license notices |
| Fork for personal learning & non-commercial use | Selling this code as a product or template |
| Use with **proper attribution** (author + repo link) | Rebranding as your own marketplace product |
| Contribute back via Pull Requests | Commercial SaaS redistribution without a license |

> **Important:** While MIT permits code reuse, the **Warungpedia™ brand, name, logo, and visual identity** are **NOT** covered by the MIT License and may **NOT** be used without written permission. For commercial licensing inquiries, please open an issue or contact the author directly.

---

<div align="center">

**⭐ Star this repository if you find it impressive!**

*Warungpedia — Where Indonesian Warungs Go Digital* 🏪

</div>
