---
name: ComboFinder category-scoped module pattern
description: How Display/Battery/etc. "part type" compatibility modules share one generic schema in the ComboFinder project, and the gotchas when adding a new one.
---

ComboFinder (phone parts compatibility finder) has one generic schema —
`categoriesTable` / `brandsTable` (with nullable `categoryId` FK) /
`modelsTable` / `compatibilitiesTable` — reused across every "part type"
module (Display, Battery, IC, ...) instead of per-type tables.

**Why:** the original "Display Compatibility" feature predates the
`categories` concept, so all pre-existing brands have `categoryId = null`.
Adding a second module means scoping *new* brands to a category id rather
than creating parallel tables.

**How to apply**, when adding a new part-type module (e.g. Battery):
1. Create a row in `categoriesTable` (name + slug, e.g. slug `"battery"`).
   The customer-facing web `compatibility.tsx` page and the customer-facing
   mobile `search.tsx` screen both load categories dynamically from
   `GET /api/categories` and need **zero code changes** to pick up a new one.
2. `GET /brands` supports `?category_id=` filtering server-side, but the
   generated `useGetBrands` React Query hook only exposes a `category_id`
   param if the OpenAPI spec's `/brands` GET operation declares it as a
   query parameter — check `lib/api-spec/openapi.yaml` before assuming the
   hook takes params, and re-run codegen (`pnpm --filter @workspace/api-spec
   run codegen`) after adding it.
3. **Gotcha:** the original "Display Compatibility" admin list page queries
   `useGetBrands()` with no filter, so it shows *every* brand regardless of
   category. Once you scope new brands to a category id, you must also add a
   client-side exclusion filter to the legacy Display page (exclude brands
   whose `categoryId` is one of the new module's category ids), or new
   category's brands leak into the Display list.
4. `/brands/:id/models` and `/models/:id` admin routes are generic (keyed by
   brandId/modelId, not category) and can be reused unmodified — but any
   breadcrumb/back-link that hardcodes `/brands` should be made
   category-aware (look up the brand's `categoryId` against the known
   category ids and route back to the correct list page).
5. The mobile Expo app's *Inventory* tab (separate from the compatibility
   Search tab) hardcodes its own category chip list — adding a DB category
   does not affect it and is a separate, unrelated concern.
6. Admin API writes (POST/PUT/DELETE) require an authenticated session.
   There is no seed admin user in a fresh dev DB — login only works via
   `ADMIN_USERNAME`/`ADMIN_PASSWORD` env vars (if set) or a real row in
   `usersTable`. For one-off dev/verification work without those
   credentials, insert a `usersTable` row directly via a script using the
   same `pbkdf2Sync` password-hash format the app's `auth.ts` uses, log in
   through `/api/auth/login` to get a session cookie, then delete the row
   afterward.
