---
name: ComboFinder architecture
description: Key decisions for the ComboFinder phone display compatibility app — API contract, shared lib, mobile URL setup
---

# ComboFinder Architecture

## Rule
OpenAPI spec is the source of truth. Any API change: edit `lib/api-spec/openapi.yaml` → run `pnpm --filter @workspace/api-spec run codegen` → use generated hooks. Do not write manual fetch wrappers.

**Why:** Both the admin panel (React Vite) and mobile app (Expo) share `@workspace/api-client-react`. Bypassing codegen creates drift.

**How to apply:** Every new endpoint needs an OpenAPI entry + codegen run before writing screen code.

## Rule
Mobile app must call `setBaseUrl(\`https://${process.env.EXPO_PUBLIC_DOMAIN}\`)` at module level in `app/_layout.tsx` (outside any component).

**Why:** Expo bundles run outside the shared proxy and need absolute URLs. `EXPO_PUBLIC_DOMAIN` is injected by the workflow dev script as `$REPLIT_DEV_DOMAIN`.

## Navigation structure
- Tab 1 (Search): stats + search bar → results (brands/models) → `/model/[id]` or `/brand/[id]`
- Tab 2 (Brands): all brands list → `/brand/[id]` → models list → `/model/[id]`
- Stack screens: `app/brand/[id].tsx`, `app/model/[id].tsx`

## Color theme (shared across admin panel + mobile)
- Primary: `#0080DB` (light) / `#1AABFF` (dark) — Circuit Blue cobalt, HSL 205 100% 43%
- Background: `#F1F4F8` (light) / `#0F1729` (dark)
- Card: `#FFFFFF` (light) / `#111C2E` (dark)
- Border: `#D5DCE8` (light) / `#1E2A3A` (dark)
- Font: Inter (400/500/600/700)
