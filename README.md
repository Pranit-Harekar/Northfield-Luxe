# Northfield Luxe

**🔗 Try it now: [northfield-luxe.vercel.app](https://northfield-luxe.vercel.app)** — no installation, no signup, no setup. It seeds its own sample data the moment you open it.

Northfield Luxe is an open-source, fully client-side e-commerce sandbox built for **hands-on QA and testing practice**. It looks and behaves like a real storefront + admin portal, but there's no real backend or database — everything runs in the browser (IndexedDB + localStorage), seeded with realistic data on first launch.

> ⚠️ This is a training sandbox, not a real store. No real payments, emails, or backend services are involved — all data lives only in your browser and can be wiped and reseeded at any time.

## Why this exists

Most "practice" QA sites are either too trivial (a single to-do list, a login form) or too heavyweight (a full app you have to install, configure, and seed yourself before you can even start testing). Northfield Luxe aims to sit in between: a **realistic, feature-complete e-commerce product** — catalog, cart, checkout, orders, refunds, coupons, and a full admin back-office — that anyone can open in a browser tab and start testing in seconds, with zero setup.

It's aimed at:

- **QA engineers and testers** who want a realistic, disposable product to practice manual and exploratory testing, write test cases, and file defect reports against.
- **People learning software testing** who need real multi-step flows (not toy examples) to practice functional, UI, accessibility, cross-role, and regression testing.
- **Teams evaluating test tooling** (test automation frameworks, bug trackers, API clients) who want a stable, resettable target application to script against, without touching a production system or standing up infrastructure.

Because every "backend" call is simulated in the browser and durable state lives entirely in IndexedDB, the environment is fully self-contained and disposable: reset it, break it, fill it with garbage data — nothing outside your own browser tab is ever affected, and a clean slate is always one click away.

See [`requirements.md`](./requirements.md) for a full breakdown of the product's intended behavior, written for QA use in designing test plans and test cases.

## Features

- **Storefront** — product catalog with categories, search/filter, product detail pages with variants and reviews, cart, and a rich checkout flow (shipping options, tax estimate, coupon codes with live validation, order summary with images).
- **Order lifecycle** — place orders, track status, request refunds as a customer, and have admins review/issue/deny refund requests.
- **Admin portal** — manage products (with variants), users, orders, and coupons, each with search, filtering, sorting, and pagination.
- **Coupons** — percentage/fixed/BOGO discount codes with live, debounced validation at checkout.
- **Accounts & roles** — customer and admin roles with role-based access (e.g. admins can't shop or check out).
- **Dark mode** — full light/dark theming.
- **API docs** — an interactive Swagger UI (`/swagger`) documenting the mock REST API contract, useful for practicing API-level testing even though the "backend" is simulated in-browser.
- **One-time seeding** — the database is seeded automatically the first time the app runs, and a "Reset environment" option (in the info dialog in the nav bar) wipes and reseeds fresh data whenever you want a clean slate.

### Seeded test accounts

Both the deployed app and a local checkout come pre-loaded with these accounts (also shown, and clickable to autofill, on the login page):

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

For a detailed, structured list of expected behaviors to test against, see [`requirements.md`](./requirements.md).

## Resetting your data

Click the pulsating info icon in the nav bar for an "About this site" dialog, which includes a **Reset environment** option to permanently wipe all products, orders, users, coupons, and your session, then reseed fresh sample data. This works identically on the deployed site and locally.

## Tech stack

- [Next.js](https://nextjs.org) (App Router) + React + TypeScript
- [Tailwind CSS](https://tailwindcss.com) + [shadcn/ui](https://ui.shadcn.com) components, [Geist](https://vercel.com/font) font
- [TanStack Query](https://tanstack.com/query) + [TanStack Table](https://tanstack.com/table) for data fetching, caching, and tables
- [IndexedDB](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API) (via `idb`) as the entire persistence layer — there is no server or database beyond the browser

## Running it locally

You almost certainly don't need this — **[northfield-luxe.vercel.app](https://northfield-luxe.vercel.app)** is the same app, always up to date, and requires nothing but a browser. Only set this up locally if you want to modify the code, run it offline, or inspect/debug it outside the browser.

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The app seeds its own data on first load — no database setup required.

### Optional: AdSense hero carousel

The shop page has a small hero ad carousel above the product grid. It's entirely optional and self-disables — copy [`.env.example`](./.env.example) to `.env.local` and fill in your own `NEXT_PUBLIC_ADSENSE_CLIENT_ID` / `NEXT_PUBLIC_ADSENSE_HERO_SLOT_ID` to enable it. Never commit real AdSense ids — `.env.local` is git-ignored.

## License

MIT — see [LICENSE](./LICENSE).
