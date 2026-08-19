import { Router } from "express";
import { db, staffTable } from "@workspace/db";
import { eq, and, desc, ne } from "drizzle-orm";
import { pbkdf2Sync, randomBytes } from "node:crypto";

const router = Router();

function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  return `${salt}:${pbkdf2Sync(password, salt, 10000, 64, "sha512").toString("hex")}`;
}

function publicStaff(row: any) {
  const { passwordHash: _passwordHash, ...safe } = row;
  return safe;
}

// GET /api/staff — list all staff for the authenticated user
router.get("/", async (req, res) => {
  try {
    const userId: number = (req as any).userId;
    const rows = await db.select().from(staffTable)
      .where(eq(staffTable.userId, userId))
      .orderBy(desc(staffTable.createdAt));
    res.json(rows.map(publicStaff));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to fetch staff" });
  }
});

// POST /api/staff — create a new staff member
router.post("/", async (req, res) => {
  try {
    const userId: number = (req as any).userId;
    const b = req.body;
    const isPro = String((req.session as any).userPlan ?? "").toLowerCase() === "pro";
    if (!isPro && (b.username || b.password)) {
      res.status(403).json({ error: "Staff login is available on the Pro plan only" });
      return;
    }
    if (!b.name || !String(b.name).trim()) {
      res.status(400).json({ error: "Name is required" });
      return;
    }
    const password = b.password ? String(b.password) : "";
    if (password && password.length < 8) {
      res.status(400).json({ error: "Staff password must be at least 8 characters" }); return;
    }
    const username = b.username ? String(b.username).trim().toLowerCase() : "";
    if (username) {
      const [existingUsername] = await db.select({ id: staffTable.id })
        .from(staffTable)
        .where(eq(staffTable.username, username))
        .limit(1);
      if (existingUsername) {
        res.status(409).json({ error: "That username is already in use. Choose another username." });
        return;
      }
    }
    const [row] = await db.insert(staffTable).values({
      userId,
      name:     String(b.name).trim(),
      phone:    b.phone    ? String(b.phone).trim()    : null,
      staffId:  b.staffId  ? String(b.staffId).trim()  : null,
      username: username || null,
      passwordHash: password ? hashPassword(password) : null,
      role:     b.role     ? String(b.role)             : "Staff",
      isActive: b.isActive !== undefined ? Boolean(b.isActive) : true,
      notes:    b.notes    ? String(b.notes).trim()    : null,
      updatedAt: new Date(),
    }).returning();
    res.status(201).json(publicStaff(row));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to create staff member" });
  }
});

// PUT /api/staff/:id — update a staff member
router.put("/:id", async (req, res) => {
  try {
    const userId: number = (req as any).userId;
    const b = req.body;
    const isPro = String((req.session as any).userPlan ?? "").toLowerCase() === "pro";
    if (!isPro && (b.username !== undefined || b.password !== undefined)) {
      res.status(403).json({ error: "Staff login is available on the Pro plan only" });
      return;
    }
    const updates: Record<string, any> = { updatedAt: new Date() };
    if (b.name     !== undefined) updates.name     = String(b.name).trim();
    if (b.phone    !== undefined) updates.phone    = b.phone    ? String(b.phone).trim()    : null;
    if (b.staffId  !== undefined) updates.staffId  = b.staffId  ? String(b.staffId).trim()  : null;
    if (b.username !== undefined) {
      const username = b.username ? String(b.username).trim().toLowerCase() : "";
      if (username) {
        const [existingUsername] = await db.select({ id: staffTable.id })
          .from(staffTable)
          .where(and(eq(staffTable.username, username), ne(staffTable.id, Number(req.params.id))))
          .limit(1);
        if (existingUsername) {
          res.status(409).json({ error: "That username is already in use. Choose another username." });
          return;
        }
      }
      updates.username = username || null;
    }
    if (b.password !== undefined && b.password !== "") {
      if (String(b.password).length < 8) {
        res.status(400).json({ error: "Staff password must be at least 8 characters" }); return;
      }
      updates.passwordHash = hashPassword(String(b.password));
    }
    if (b.role     !== undefined) updates.role     = String(b.role);
    if (b.isActive !== undefined) updates.isActive = Boolean(b.isActive);
    if (b.notes    !== undefined) updates.notes    = b.notes    ? String(b.notes).trim()    : null;

    const [row] = await db.update(staffTable).set(updates)
      .where(and(
        eq(staffTable.id, Number(req.params.id)),
        eq(staffTable.userId, userId),
      ))
      .returning();
    if (!row) {
      res.status(404).json({ error: "Staff member not found" });
      return;
    }
    res.json(publicStaff(row));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to update staff member" });
  }
});

// DELETE /api/staff/:id — delete a staff member
router.delete("/:id", async (req, res) => {
  try {
    const userId: number = (req as any).userId;
    await db.delete(staffTable)
      .where(and(
        eq(staffTable.id, Number(req.params.id)),
        eq(staffTable.userId, userId),
      ));
    res.json({ success: true });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to delete staff member" });
  }
});

export default router;
