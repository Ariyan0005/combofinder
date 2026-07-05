---
name: ComboFinder web app conventions (combo-finder-web) and POS/inventory mutation pattern
description: combo-finder-web deviates from OpenAPI-codegen convention; inventory-affecting writes must use atomic DB transactions
---

# combo-finder-web conventions

## Rule
`artifacts/combo-finder-web` (repair-shop web app, not the admin panel) calls Express routes directly with raw `fetch(...)` + React Query, not the generated `@workspace/api-client-react` hooks — unlike the admin panel/mobile.

**Why:** This is how the app was originally built (pre-existing convention when picked up from the user's GitHub repo). No OpenAPI spec entries exist for its routes (inventory, sales/POS, customers, repairs, etc).

**How to apply:** When adding endpoints for combo-finder-web, add a plain Express route under `artifacts/api-server/src/routes/` and call it with `fetch(..., { credentials: "include" })` from the page — don't force OpenAPI codegen retrofitting unless asked.

## Rule
Any mutation that changes `inventoryTable.quantity` must run inside `db.transaction(...)` with a conditional `WHERE quantity >= X` (or `GREATEST(0, quantity + delta)`) update, checking the returned row exists before proceeding.

**Why:** Prevents overselling/negative stock under concurrent requests. Established by `stock-movements.ts` and reused by the POS `sales.ts` routes (checkout decrements stock, returns re-increment it).

**How to apply:** Follow the pattern in `artifacts/api-server/src/routes/stock-movements.ts` / `sales.ts` for any new stock-affecting feature (adjustments, transfers, etc).
