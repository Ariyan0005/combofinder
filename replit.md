# ComboFinder

Phone display combo compatibility app — search brands, models, and find compatible display assembly combos.

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
- `lib/db/src/schema/` — Drizzle DB schema (brands, models, combos tables)
- `lib/api-client-react/src/generated/` — generated React Query hooks + Zod schemas
- `artifacts/api-server/src/routes/` — Express route handlers
- `artifacts/admin-panel/src/` — React + Vite admin panel
- `artifacts/combo-finder/app/` — Expo mobile app screens

## Architecture decisions

- Contract-first API: OpenAPI spec → Orval codegen → shared hooks used by both admin panel and mobile app
- Single shared `@workspace/api-client-react` lib consumed by both web and mobile artifacts
- Expo mobile app uses absolute URLs via `setBaseUrl(https://${EXPO_PUBLIC_DOMAIN})` in `_layout.tsx`
- Mobile app navigates: Search tab (search + stats) → model detail; Brands tab → brand models → model detail
- Admin panel theme: Circuit Blue cobalt (HSL 205 100% 43%), slate background, Inter font

## Product

- **Admin Panel** (`/`): Manage brands, models, and display combos. Full CRUD with search and stats dashboard.
- **Mobile App** (`/mobile/`): Search brands/models by name, browse all brands, drill into model detail to see compatible display combos with type (OEM/Compatible/Refurbished), quality grade, stock status, and price range.

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- Run `pnpm --filter @workspace/api-spec run codegen` after any OpenAPI spec change before touching mobile/admin code
- Mobile app needs `EXPO_PUBLIC_DOMAIN` env var — injected automatically by the Expo workflow script
- Do not hardcode port numbers anywhere — all ports are dynamic via `PORT` env var

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
