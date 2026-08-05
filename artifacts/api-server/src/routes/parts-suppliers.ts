import { Router } from "express";
import { db } from "@workspace/db";
import { partsSuppliersTable, supplierReviewsTable } from "@workspace/db";
import { eq, and, ilike, sql, desc, asc } from "drizzle-orm";

const router = Router();

// ── Internal helpers ──────────────────────────────────────────────────────────
function adminOnly(req: any, res: any, next: any) {
  if (!req.session?.authenticated) return res.status(401).json({ error: "Unauthorized" });
  const role: string = req.session?.userRole ?? "";
  const ok = role === "Admin" || role === "admin" || role === "superadmin";
  if (!ok) return res.status(403).json({ error: "Forbidden: admin access required" });
  next();
}

// ── GET /parts-suppliers  — public listing ────────────────────────────────────
router.get("/", async (req, res) => {
  try {
    const { country, city } = req.query as Record<string, string | undefined>;

    const conditions: any[] = [eq(partsSuppliersTable.isActive, true)];
    if (country) conditions.push(ilike(partsSuppliersTable.country, country));
    if (city)    conditions.push(ilike(partsSuppliersTable.city, `%${city}%`));

    const rows = await db
      .select()
      .from(partsSuppliersTable)
      .where(and(...conditions))
      .orderBy(desc(partsSuppliersTable.isVerified), asc(partsSuppliersTable.sortOrder), asc(partsSuppliersTable.name));

    res.json(rows);
  } catch (err: any) {
    req.log?.error(err);
    res.status(500).json({ error: "Failed to fetch suppliers" });
  }
});

// ── GET /parts-suppliers/countries — distinct active countries ────────────────
router.get("/countries", async (_req, res) => {
  try {
    const rows = await db
      .selectDistinct({ country: partsSuppliersTable.country })
      .from(partsSuppliersTable)
      .where(eq(partsSuppliersTable.isActive, true))
      .orderBy(asc(partsSuppliersTable.country));
    res.json(rows.map(r => r.country));
  } catch {
    res.status(500).json({ error: "Failed" });
  }
});

// ── GET /parts-suppliers/:id  — public single supplier + recent reviews ───────
router.get("/:id(\\d+)", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const [row] = await db
      .select()
      .from(partsSuppliersTable)
      .where(and(eq(partsSuppliersTable.id, id), eq(partsSuppliersTable.isActive, true)));
    if (!row) return res.status(404).json({ error: "Not found" });

    const reviews = await db
      .select()
      .from(supplierReviewsTable)
      .where(eq(supplierReviewsTable.supplierId, id))
      .orderBy(desc(supplierReviewsTable.createdAt))
      .limit(20);

    res.json({ ...row, reviews });
  } catch (err: any) {
    res.status(500).json({ error: "Failed" });
  }
});

// ── POST /parts-suppliers/:id/reviews — logged-in users ──────────────────────
router.post("/:id(\\d+)/reviews", async (req: any, res) => {
  try {
    if (!req.session?.authenticated) {
      return res.status(401).json({ error: "Login required to post a review" });
    }
    const supplierId = Number(req.params.id);
    const userId: number | undefined = req.session?.userId;
    const { rating, comment } = req.body;
    const r = Number(rating);
    if (!Number.isInteger(r) || r < 1 || r > 5) {
      return res.status(400).json({ error: "Rating must be 1–5" });
    }

    const [supplier] = await db
      .select({ id: partsSuppliersTable.id, reviewCount: partsSuppliersTable.reviewCount, avgRating: partsSuppliersTable.avgRating })
      .from(partsSuppliersTable)
      .where(and(eq(partsSuppliersTable.id, supplierId), eq(partsSuppliersTable.isActive, true)));
    if (!supplier) return res.status(404).json({ error: "Supplier not found" });

    const [review] = await db.insert(supplierReviewsTable).values({
      supplierId,
      userId: userId ?? null,
      rating: r,
      comment: comment ? String(comment).slice(0, 500) : null,
    }).returning();

    // Recompute running average
    const newCount = (supplier.reviewCount ?? 0) + 1;
    const oldAvg   = Number(supplier.avgRating ?? 0);
    const newAvg   = ((oldAvg * (newCount - 1)) + r) / newCount;

    await db.update(partsSuppliersTable)
      .set({ reviewCount: newCount, avgRating: String(newAvg.toFixed(2)), updatedAt: new Date() })
      .where(eq(partsSuppliersTable.id, supplierId));

    res.status(201).json(review);
  } catch (err: any) {
    res.status(500).json({ error: "Failed to post review" });
  }
});

// ── Admin CRUD — all routes below require adminOnly ───────────────────────────

// GET /parts-suppliers/admin — all suppliers (incl inactive) for admin table
router.get("/admin", adminOnly, async (_req, res) => {
  try {
    const rows = await db
      .select()
      .from(partsSuppliersTable)
      .orderBy(asc(partsSuppliersTable.sortOrder), asc(partsSuppliersTable.name));
    res.json(rows);
  } catch (err: any) {
    res.status(500).json({ error: "Failed to fetch suppliers" });
  }
});

router.post("/admin", adminOnly, async (req: any, res) => {
  try {
    const { name, country, city, whatsapp, partTypes, website, isVerified, isActive, sortOrder } = req.body;
    const [row] = await db.insert(partsSuppliersTable).values({
      name, country, city,
      whatsapp:   whatsapp   || null,
      partTypes:  partTypes  || null,
      website:    website    || null,
      isVerified: Boolean(isVerified),
      isActive:   isActive !== false,
      sortOrder:  Number(sortOrder) || 0,
    }).returning();
    res.status(201).json(row);
  } catch (err: any) {
    req.log?.error(err);
    res.status(500).json({ error: "Failed to create supplier" });
  }
});

router.put("/admin/:id", adminOnly, async (req: any, res) => {
  try {
    const { name, country, city, whatsapp, partTypes, website, isVerified, isActive, sortOrder } = req.body;
    const [row] = await db.update(partsSuppliersTable)
      .set({
        name, country, city,
        whatsapp:   whatsapp   || null,
        partTypes:  partTypes  || null,
        website:    website    || null,
        isVerified: Boolean(isVerified),
        isActive:   isActive !== false,
        sortOrder:  Number(sortOrder) || 0,
        updatedAt:  new Date(),
      })
      .where(eq(partsSuppliersTable.id, Number(req.params.id)))
      .returning();
    if (!row) return res.status(404).json({ error: "Not found" });
    res.json(row);
  } catch (err: any) {
    req.log?.error(err);
    res.status(500).json({ error: "Failed to update" });
  }
});

router.delete("/admin/:id", adminOnly, async (req: any, res) => {
  try {
    await db.delete(partsSuppliersTable).where(eq(partsSuppliersTable.id, Number(req.params.id)));
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to delete" });
  }
});

router.patch("/admin/:id/verify", adminOnly, async (req: any, res) => {
  try {
    const [row] = await db.update(partsSuppliersTable)
      .set({ isVerified: Boolean(req.body.isVerified), updatedAt: new Date() })
      .where(eq(partsSuppliersTable.id, Number(req.params.id)))
      .returning();
    if (!row) return res.status(404).json({ error: "Not found" });
    res.json(row);
  } catch (err: any) {
    res.status(500).json({ error: "Failed" });
  }
});

export default router;
