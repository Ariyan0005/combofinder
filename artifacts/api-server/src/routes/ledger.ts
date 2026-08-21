import { Router } from "express";
import { db, ledgerAccountsTable, ledgerEntriesTable } from "@workspace/db";
import { eq, and, desc } from "drizzle-orm";

const router = Router();

function parseAmount(value: unknown): number {
  const amount = Number(String(value ?? "").replace(/,/g, "").trim());
  return Number.isFinite(amount) ? amount : 0;
}

// ── Accounts ─────────────────────────────────────────────────────────────────

router.get("/accounts", async (req, res) => {
  try {
    const userId: number = (req as any).userId;
    const accounts = await db.select().from(ledgerAccountsTable)
      .where(eq(ledgerAccountsTable.userId, userId))
      .orderBy(ledgerAccountsTable.name);

    // Calculate in JavaScript instead of casting every amount in PostgreSQL.
    // A single legacy malformed amount must not make the entire user's
    // otherwise valid ledger return HTTP 500.
    const entries = await db.select({
      accountId: ledgerEntriesTable.accountId,
      type: ledgerEntriesTable.type,
      amount: ledgerEntriesTable.amount,
    }).from(ledgerEntriesTable)
      .where(eq(ledgerEntriesTable.userId, userId));

    const totals = new Map<number, { creditSum: number; debitSum: number }>();
    for (const entry of entries) {
      const amount = parseAmount(entry.amount);
      const current = totals.get(entry.accountId) ?? { creditSum: 0, debitSum: 0 };
      if (entry.type === "credit") current.creditSum += amount;
      if (entry.type === "debit") current.debitSum += amount;
      totals.set(entry.accountId, current);
    }

    const withBalance = accounts.map((acc) => {
      const { creditSum, debitSum } = totals.get(acc.id) ?? { creditSum: 0, debitSum: 0 };
      return { ...acc, creditSum, debitSum, balance: creditSum - debitSum };
    });

    res.json(withBalance);
  } catch (err) { req.log.error(err); res.status(500).json({ error: "Failed to fetch accounts" }); }
});

router.get("/accounts/:id", async (req, res) => {
  try {
    const userId: number = (req as any).userId;
    const [acc] = await db.select().from(ledgerAccountsTable)
      .where(and(eq(ledgerAccountsTable.id, Number(req.params.id)), eq(ledgerAccountsTable.userId, userId)));
    if (!acc) return res.status(404).json({ error: "Not found" });

    const entries = await db.select().from(ledgerEntriesTable)
      .where(and(eq(ledgerEntriesTable.accountId, acc.id), eq(ledgerEntriesTable.userId, userId)))
      .orderBy(desc(ledgerEntriesTable.date));

    const creditSum = entries.filter(e => e.type === "credit").reduce((s, e) => s + parseAmount(e.amount), 0);
    const debitSum = entries.filter(e => e.type === "debit").reduce((s, e) => s + parseAmount(e.amount), 0);
    const balance = creditSum - debitSum;

    res.json({ ...acc, balance, creditSum, debitSum, entries });
  } catch (err) { req.log.error(err); res.status(500).json({ error: "Failed" }); }
});

router.post("/accounts", async (req, res) => {
  try {
    const userId: number = (req as any).userId;
    const { name, phone, email, address, notes } = req.body;
    if (!name?.trim()) return res.status(400).json({ error: "Name is required" });
    const [row] = await db.insert(ledgerAccountsTable).values({ userId, name: name.trim(), phone, email, address, notes }).returning();
    res.status(201).json(row);
  } catch (err) { req.log.error(err); res.status(500).json({ error: "Failed to create account" }); }
});

router.put("/accounts/:id", async (req, res) => {
  try {
    const userId: number = (req as any).userId;
    const { name, phone, email, address, notes } = req.body;
    const [row] = await db.update(ledgerAccountsTable)
      .set({ name, phone, email, address, notes, updatedAt: new Date() })
      .where(and(eq(ledgerAccountsTable.id, Number(req.params.id)), eq(ledgerAccountsTable.userId, userId)))
      .returning();
    if (!row) return res.status(404).json({ error: "Not found" });
    res.json(row);
  } catch (err) { req.log.error(err); res.status(500).json({ error: "Failed to update" }); }
});

router.delete("/accounts/:id", async (req, res) => {
  try {
    const userId: number = (req as any).userId;
    await db.delete(ledgerEntriesTable).where(and(eq(ledgerEntriesTable.accountId, Number(req.params.id)), eq(ledgerEntriesTable.userId, userId)));
    await db.delete(ledgerAccountsTable).where(and(eq(ledgerAccountsTable.id, Number(req.params.id)), eq(ledgerAccountsTable.userId, userId)));
    res.json({ success: true });
  } catch (err) { req.log.error(err); res.status(500).json({ error: "Failed to delete" }); }
});

// ── Entries ───────────────────────────────────────────────────────────────────

router.get("/accounts/:id/entries", async (req, res) => {
  try {
    const userId: number = (req as any).userId;
    const entries = await db.select().from(ledgerEntriesTable)
      .where(and(eq(ledgerEntriesTable.accountId, Number(req.params.id)), eq(ledgerEntriesTable.userId, userId)))
      .orderBy(desc(ledgerEntriesTable.date));
    res.json(entries);
  } catch (err) { req.log.error(err); res.status(500).json({ error: "Failed" }); }
});

router.post("/entries", async (req, res) => {
  try {
    const userId: number = (req as any).userId;
    const { accountId, type, amount, itemName, description, reference, date } = req.body;
    if (!accountId || !type || !amount || !date) return res.status(400).json({ error: "accountId, type, amount, date are required" });
    if (!["credit", "debit"].includes(type)) return res.status(400).json({ error: "type must be credit or debit" });
    const numericAmount = parseAmount(amount);
    if (numericAmount <= 0) return res.status(400).json({ error: "amount must be a positive number" });
    const [account] = await db.select({ id: ledgerAccountsTable.id })
      .from(ledgerAccountsTable)
      .where(and(eq(ledgerAccountsTable.id, Number(accountId)), eq(ledgerAccountsTable.userId, userId)));
    if (!account) return res.status(404).json({ error: "Account not found" });
    const [row] = await db.insert(ledgerEntriesTable).values({ userId, accountId: Number(accountId), type, amount: String(numericAmount), itemName: itemName || null, description, reference, date }).returning();
    res.status(201).json(row);
  } catch (err) { req.log.error(err); res.status(500).json({ error: "Failed to create entry" }); }
});

router.put("/entries/:id", async (req, res) => {
  try {
    const userId: number = (req as any).userId;
    const { type, amount, itemName, description, reference, date } = req.body;
    if (!["credit", "debit"].includes(type)) return res.status(400).json({ error: "type must be credit or debit" });
    const numericAmount = parseAmount(amount);
    if (numericAmount <= 0) return res.status(400).json({ error: "amount must be a positive number" });
    const [row] = await db.update(ledgerEntriesTable)
      .set({ type, amount: String(numericAmount), itemName: itemName || null, description, reference, date })
      .where(and(eq(ledgerEntriesTable.id, Number(req.params.id)), eq(ledgerEntriesTable.userId, userId)))
      .returning();
    if (!row) return res.status(404).json({ error: "Not found" });
    res.json(row);
  } catch (err) { req.log.error(err); res.status(500).json({ error: "Failed to update entry" }); }
});

router.delete("/entries/:id", async (req, res) => {
  try {
    const userId: number = (req as any).userId;
    await db.delete(ledgerEntriesTable).where(and(eq(ledgerEntriesTable.id, Number(req.params.id)), eq(ledgerEntriesTable.userId, userId)));
    res.json({ success: true });
  } catch (err) { req.log.error(err); res.status(500).json({ error: "Failed to delete entry" }); }
});

export default router;
