# ComboFinder

Phone display compatibility app — search brands, models, and find compatible display assemblies (compatibilities), organised by part category.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `lib/api-spec/openapi.yaml` — source of truth for API contract
- `lib/db/src/schema/` — Drizzle DB schema (categories, brands, models, compatibilities tables)
- `lib/api-client-react/src/generated/` — generated React Query hooks + Zod schemas
- `artifacts/api-server/src/routes/` — Express route handlers
- `artifacts/admin-panel/src/` — React + Vite admin panel
- `artifacts/combo-finder/app/` — Expo mobile app screens

## Architecture decisions

- Contract-first API: OpenAPI spec → Orval codegen → shared hooks used by both admin panel and mobile app
- Single shared `@workspace/api-client-react` lib consumed by both web and mobile artifacts
- Expo mobile app uses absolute URLs via `setBaseUrl(https://${EXPO_PUBLIC_DOMAIN})` in `_layout.tsx`
- Mobile app navigates: Search tab (search + stats) → model detail; Brands tab → brand models → model detail
- Admin panel theme: Replit-style dark UI — violet/indigo primary (HSL 252 100% 64%), slate background, Inter font

## Product

- **Admin Panel** (`/`): Manage categories, brands, models, and compatibilities. Full CRUD with search and stats dashboard.
- **Mobile App** (`/mobile/`): Search brands/models by name, browse all brands, drill into model detail to see compatible display assemblies (compatibilities) with type (OEM/Compatible/Refurbished) and quality grade.
- **ComboFinder Web** (`/combo-finder-web/`): Repair shop management — repairs, inventory, customers, and now a full POS system:
  - `/inventory`: stock management, has a switch to jump to POS
  - `/pos`: cart-based checkout — add products, adjust qty/price, discount, payment method, customer info, checkout creates an invoice and decrements stock atomically
  - `/invoices`: date-range filterable invoice list, invoice detail, return/refund per line item (restocks inventory + logs a Refund transaction), CSV export and PDF export (single invoice or full date-range report) via `src/lib/invoice-pdf.ts`
  - Backend: `sales` / `sale_items` / `sale_returns` tables (`lib/db/src/schema/sales.ts`), routes in `artifacts/api-server/src/routes/sales.ts`

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- Run `pnpm --filter @workspace/api-spec run codegen` after any OpenAPI spec change before touching mobile/admin code
- Mobile app needs `EXPO_PUBLIC_DOMAIN` env var — injected automatically by the Expo workflow script
- Do not hardcode port numbers anywhere — all ports are dynamic via `PORT` env var

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
