# Northfield Luxe

Northfield Luxe is an open-source, fully client-side e-commerce sandbox built for **hands-on QA and testing practice**. It looks and behaves like a real storefront + admin portal, but there's no real backend or database — everything runs in the browser (IndexedDB + localStorage), seeded with realistic data on first launch.

It exists so QAs, testers, and anyone learning testing can explore real e-commerce flows (browsing, cart, checkout, refunds, coupons, admin management) end-to-end and practice finding issues in a safe, disposable environment.

> ⚠️ This is a training sandbox, not a real store. No real payments, emails, or backend services are involved — all data lives only in your browser and can be wiped and reseeded at any time.

## Features

- **Storefront** — product catalog with categories, search/filter, product detail pages with variants and reviews, cart, and a rich checkout flow (shipping options, tax estimate, coupon codes with live validation, order summary with images).
- **Order lifecycle** — place orders, track status, request refunds as a customer, and have admins review/issue/deny refund requests.
- **Admin portal** — manage products (with variants), users, orders, and coupons, each with search, filtering, sorting, and pagination.
- **Coupons** — percentage/fixed/BOGO discount codes with live, debounced validation at checkout.
- **Accounts & roles** — customer and admin roles with role-based access (e.g. admins can't shop or check out).
- **Dark mode** — full light/dark theming.
- **API docs** — an interactive Swagger UI (`/swagger`) documenting the mock REST API contract, useful for practicing API-level testing even though the "backend" is simulated in-browser.
- **One-time seeding** — the database is seeded automatically the first time the app runs, and a "Reset environment" option (in the info dialog in the nav bar) wipes and reseeds fresh data whenever you want a clean slate.

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The app seeds its own data on first load — no database setup required.

### Seeded test accounts

| Role     | Email                          | Password      |
| -------- | ------------------------------- | -------------- |
| Customer | `customer@atlascommerce.test`   | `password123`  |
| Admin    | `admin@atlascommerce.test`      | `admin123`     |

## What you can test here

Northfield Luxe is designed as a target-rich environment for practicing:

- Functional testing (cart, checkout, orders, refunds, coupons, admin CRUD)
- UI/visual testing
- Accessibility testing
- Cross-role & permissions testing (customer vs. admin)
- Form validation
- Edge cases & negative testing
- API/contract testing (see `/swagger` and `public/openapi.json`)
- Responsive layout & dark mode
- Regression testing

## Tech stack

- [Next.js](https://nextjs.org) (App Router) + React + TypeScript
- [Tailwind CSS](https://tailwindcss.com) + [shadcn/ui](https://ui.shadcn.com) components, [Geist](https://vercel.com/font) font
- [TanStack Query](https://tanstack.com/query) + [TanStack Table](https://tanstack.com/table) for data fetching, caching, and tables
- [IndexedDB](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API) (via `idb`) as the entire persistence layer — there is no server or database beyond the browser

## Resetting your data

Click the pulsating info icon in the nav bar for an "About this site" dialog, which includes a **Reset environment** option to permanently wipe all products, orders, users, coupons, and your session, then reseed fresh sample data.

## License

MIT — see [LICENSE](./LICENSE).
