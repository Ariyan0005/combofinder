---
name: ComboFinder branch integration
description: The public GitHub repository may contain a nested full-source snapshot on update branches; compare normalized source trees before merging.
---

When reconciling ComboFinder branches, compare the actual project root against any nested `combofinder/` or `combofinder-repo/` snapshot instead of merging the branch wholesale. Preserve the current main line and selectively port registration/schema fixes.

**Why:** The update branch contained duplicate nested source trees and did not share a merge base with main, so a direct merge could duplicate or overwrite the active application.

**How to apply:** Normalize both branch trees first, isolate auth and migration changes, then validate the resulting main branch before pushing.