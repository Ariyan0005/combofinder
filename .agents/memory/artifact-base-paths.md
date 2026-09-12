---
name: Artifact base paths
description: Routed web artifacts need base-aware client asset and service-worker URLs.
---

Web artifacts are served below a path prefix in Replit previews and deployments, so client-owned assets and service workers must resolve from `import.meta.env.BASE_URL` rather than assuming `/`.

**Why:** Root-absolute service-worker and asset URLs bypass the artifact route and produce failed requests in preview.

**How to apply:** Use Vite base-aware URLs for service-worker registration and static shell assets; keep `/api` calls root-relative when the API is intentionally shared at the project root.