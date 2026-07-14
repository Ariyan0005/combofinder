---
name: pnpm workspace typecheck false failures
description: Plain `tsc --noEmit` can report spurious "module has no exported member" errors in a TS project-references monorepo where `tsc --build` succeeds.
---

In a pnpm workspace using TypeScript project references (composite
`tsconfig.json`s across `lib/*` and `artifacts/*`), running
`tsc -p <package>/tsconfig.json --noEmit` directly from a package that
depends on another workspace package (e.g. `@workspace/db`) can report
`Module "@workspace/db" has no exported member 'xTable'` even when:
- the schema file actually exports the member,
- `tsc -p lib/db/tsconfig.json --noEmit` on that package alone is clean,
- Node module resolution correctly points at the TS source (not a stale
  `dist/*.d.ts`).

**Why:** project references need to be built as a graph (`tsc --build`) so
each referenced project's `.d.ts`/`.tsbuildinfo` output is produced in the
right order first. Invoking `tsc --noEmit` on a single leaf package instead
skips that graph build and can see incomplete/stale declarations for its
dependencies, producing false errors.

**How to apply:** the repo's root `pnpm run typecheck:libs` (`tsc --build`)
is the authoritative check for `lib/*` packages and passes cleanly. If a
leaf package's own `pnpm run typecheck` (plain `tsc -p ... --noEmit`)
reports "has no exported member" errors pointing at a `lib/*` package,
first confirm `pnpm run typecheck:libs` at the repo root is clean before
concluding there's a real bug — it usually is not, and is a pre-existing,
non-blocking quirk of invoking `tsc` outside build-graph mode. It does not
affect Vite/esbuild dev or production builds, which don't use `tsc` for
type-only checks.

Separately, some existing pages in this repo pass
`{ query: { enabled: boolean } }` to generated `useGet*` hooks without a
`queryKey`, which the installed `@tanstack/react-query` + generated-hook
types reject (`TS2741: Property 'queryKey' is missing`) even though it
works fine at runtime (Orval's generated hook merges in a default
`queryKey`). This is a pre-existing, repo-wide, non-blocking type-only
mismatch — don't treat it as a regression when it shows up in a page you
copied the pattern from.
