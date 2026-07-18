/**
 * Local-First Storage for Free-plan users.
 * Uses localStorage with JSON serialization.
 * Negative IDs are used for local records to avoid conflicts with server IDs.
 * No limits — data lives on the user's device, so they own it all.
 */

// ── ID generator ──────────────────────────────────────────────────────────────
function genLocalId(): number {
  const KEY = "__cf_lid__";
  const v = Number(localStorage.getItem(KEY) ?? "0") - 1;
  localStorage.setItem(KEY, String(v));
  return v;
}

function read<T>(key: string): T[] {
  try { return JSON.parse(localStorage.getItem(key) ?? "[]") as T[]; }
  catch { return []; }
}
function write<T>(key: string, data: T[]) {
  localStorage.setItem(key, JSON.stringify(data));
}

// ── Repairs ───────────────────────────────────────────────────────────────────
const rKey = (uid: number) => `cf_r_${uid}`;

export const localRepairs = {
  getAll(uid: number): any[] {
    return read<any>(rKey(uid));
  },
  create(uid: number, data: any): any {
    const items = read<any>(rKey(uid));
    const item = {
      ...data,
      id: genLocalId(),
      userId: uid,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    items.unshift(item);
    write(rKey(uid), items);
    return item;
  },
  update(uid: number, id: number, data: any): any {
    const items = read<any>(rKey(uid));
    const idx = items.findIndex((i: any) => i.id === id);
    if (idx === -1) throw new Error("Repair not found");
    items[idx] = { ...items[idx], ...data, id, updatedAt: new Date().toISOString() };
    write(rKey(uid), items);
    return items[idx];
  },
  delete(uid: number, id: number) {
    write(rKey(uid), read<any>(rKey(uid)).filter((i: any) => i.id !== id));
  },
  exportAll(uid: number): any[] { return read<any>(rKey(uid)); },
  clear(uid: number) { localStorage.removeItem(rKey(uid)); },
  hasData(uid: number): boolean { return read<any>(rKey(uid)).length > 0; },

  /** @deprecated No longer used — free plan has no monthly limit */
  countThisMonth(uid: number): number {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
    return read<any>(rKey(uid)).filter((r: any) => {
      try { return new Date(r.createdAt).getTime() >= startOfMonth; } catch { return true; }
    }).length;
  },
};

// ── Inventory ─────────────────────────────────────────────────────────────────
const iKey = (uid: number) => `cf_inv_${uid}`;

export const localInventory = {
  getAll(uid: number): any[] {
    return read<any>(iKey(uid));
  },
  create(uid: number, data: any): any {
    const items = read<any>(iKey(uid));
    const item = {
      ...data,
      id: genLocalId(),
      userId: uid,
      quantity: Number(data.quantity) || 0,
      minStock: Number(data.minStock) || 2,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    items.push(item);
    write(iKey(uid), items);
    return item;
  },
  update(uid: number, id: number, data: any): any {
    const items = read<any>(iKey(uid));
    const idx = items.findIndex((i: any) => i.id === id);
    if (idx === -1) throw new Error("Item not found");
    items[idx] = { ...items[idx], ...data, id, updatedAt: new Date().toISOString() };
    write(iKey(uid), items);
    return items[idx];
  },
  delete(uid: number, id: number) {
    write(iKey(uid), read<any>(iKey(uid)).filter((i: any) => i.id !== id));
  },
  /** Deduct stock when parts are used in a repair */
  deductStock(uid: number, inventoryId: number, qty: number) {
    const items = read<any>(iKey(uid));
    const idx = items.findIndex((i: any) => i.id === inventoryId);
    if (idx !== -1) {
      items[idx].quantity = Math.max(0, (Number(items[idx].quantity) || 0) - qty);
      write(iKey(uid), items);
    }
  },
  exportAll(uid: number): any[] { return read<any>(iKey(uid)); },
  clear(uid: number) { localStorage.removeItem(iKey(uid)); },
  hasData(uid: number): boolean { return read<any>(iKey(uid)).length > 0; },
};

// ── Customers ─────────────────────────────────────────────────────────────────
const cKey = (uid: number) => `cf_c_${uid}`;

export const localCustomers = {
  getAll(uid: number): any[] {
    return read<any>(cKey(uid));
  },
  search(uid: number, q: string): any[] {
    const all = read<any>(cKey(uid));
    if (!q) return all;
    const lower = q.toLowerCase();
    return all.filter((c: any) =>
      (c.name ?? "").toLowerCase().includes(lower) ||
      (c.phone ?? "").includes(q) ||
      (c.whatsapp ?? "").includes(q)
    );
  },
  create(uid: number, data: any): any {
    const items = read<any>(cKey(uid));
    const item = {
      ...data,
      id: genLocalId(),
      userId: uid,
      totalRepairs: 0,
      repairDue: 0,
      creditDue: 0,
      createdAt: new Date().toISOString(),
    };
    items.unshift(item);
    write(cKey(uid), items);
    return item;
  },
  update(uid: number, id: number, data: any): any {
    const items = read<any>(cKey(uid));
    const idx = items.findIndex((i: any) => i.id === id);
    if (idx === -1) throw new Error("Customer not found");
    items[idx] = { ...items[idx], ...data, id };
    write(cKey(uid), items);
    return items[idx];
  },
  delete(uid: number, id: number) {
    write(cKey(uid), read<any>(cKey(uid)).filter((i: any) => i.id !== id));
  },
  exportAll(uid: number): any[] { return read<any>(cKey(uid)); },
  clear(uid: number) { localStorage.removeItem(cKey(uid)); },
  hasData(uid: number): boolean { return read<any>(cKey(uid)).length > 0; },
};

// ── Ledger (Accounts + Entries) ───────────────────────────────────────────────
const laKey = (uid: number) => `cf_la_${uid}`; // accounts
const leKey = (uid: number) => `cf_le_${uid}`; // entries

export const localLedger = {
  // ── Accounts ──────────────────────────────────────────────────────────────
  getAllAccounts(uid: number): any[] {
    const accounts = read<any>(laKey(uid));
    const entries = read<any>(leKey(uid));
    return accounts.map((acc: any) => {
      const accEntries = entries.filter((e: any) => e.accountId === acc.id);
      const creditSum = accEntries.filter((e: any) => e.type === "credit").reduce((s: number, e: any) => s + Number(e.amount), 0);
      const debitSum  = accEntries.filter((e: any) => e.type === "debit").reduce((s: number, e: any)  => s + Number(e.amount), 0);
      return { ...acc, creditSum, debitSum, balance: creditSum - debitSum };
    });
  },
  getAccount(uid: number, accountId: number): any | null {
    const accounts = read<any>(laKey(uid));
    const acc = accounts.find((a: any) => a.id === accountId);
    if (!acc) return null;
    const entries = read<any>(leKey(uid)).filter((e: any) => e.accountId === accountId);
    const creditSum = entries.filter((e: any) => e.type === "credit").reduce((s: number, e: any) => s + Number(e.amount), 0);
    const debitSum  = entries.filter((e: any) => e.type === "debit").reduce((s: number, e: any)  => s + Number(e.amount), 0);
    return { ...acc, creditSum, debitSum, balance: creditSum - debitSum, entries };
  },
  createAccount(uid: number, data: any): any {
    const items = read<any>(laKey(uid));
    const item = { ...data, id: genLocalId(), userId: uid, createdAt: new Date().toISOString() };
    items.push(item);
    write(laKey(uid), items);
    return item;
  },
  updateAccount(uid: number, id: number, data: any): any {
    const items = read<any>(laKey(uid));
    const idx = items.findIndex((i: any) => i.id === id);
    if (idx === -1) throw new Error("Account not found");
    items[idx] = { ...items[idx], ...data, id };
    write(laKey(uid), items);
    return items[idx];
  },
  deleteAccount(uid: number, id: number) {
    write(laKey(uid), read<any>(laKey(uid)).filter((i: any) => i.id !== id));
    // Also delete all entries for this account
    write(leKey(uid), read<any>(leKey(uid)).filter((e: any) => e.accountId !== id));
  },

  // ── Entries ───────────────────────────────────────────────────────────────
  createEntry(uid: number, data: any): any {
    const items = read<any>(leKey(uid));
    const item = {
      ...data,
      id: genLocalId(),
      userId: uid,
      date: data.date ?? new Date().toISOString().slice(0, 10),
      createdAt: new Date().toISOString(),
    };
    items.push(item);
    write(leKey(uid), items);
    return item;
  },
  updateEntry(uid: number, id: number, data: any): any {
    const items = read<any>(leKey(uid));
    const idx = items.findIndex((i: any) => i.id === id);
    if (idx === -1) throw new Error("Entry not found");
    items[idx] = { ...items[idx], ...data, id };
    write(leKey(uid), items);
    return items[idx];
  },
  deleteEntry(uid: number, id: number) {
    write(leKey(uid), read<any>(leKey(uid)).filter((i: any) => i.id !== id));
  },

  exportAll(uid: number): { accounts: any[]; entries: any[] } {
    return { accounts: read<any>(laKey(uid)), entries: read<any>(leKey(uid)) };
  },
  clear(uid: number) {
    localStorage.removeItem(laKey(uid));
    localStorage.removeItem(leKey(uid));
  },
  hasData(uid: number): boolean {
    return read<any>(laKey(uid)).length > 0 || read<any>(leKey(uid)).length > 0;
  },
};

// ── Sales / Invoices ──────────────────────────────────────────────────────────
const sKey = (uid: number) => `cf_s_${uid}`;

export const localSales = {
  getAll(uid: number): any[] {
    return read<any>(sKey(uid));
  },
  getById(uid: number, id: number): any | null {
    return read<any>(sKey(uid)).find((s: any) => s.id === id) ?? null;
  },
  create(uid: number, data: any): any {
    const list = read<any>(sKey(uid));
    const now = new Date();
    const seq = list.length + 1;
    const id = genLocalId();
    const item = {
      ...data,
      id,
      userId: uid,
      invoiceNumber: `INV-L${String(seq).padStart(4, "0")}`,
      date: data.date ?? now.toISOString().slice(0, 10),
      status: data.status ?? "Completed",
      returns: data.returns ?? [],
      createdAt: now.toISOString(),
    };
    list.unshift(item);
    write(sKey(uid), list);
    return item;
  },
  update(uid: number, id: number, data: any): any {
    const items = read<any>(sKey(uid));
    const idx = items.findIndex((i: any) => i.id === id);
    if (idx === -1) throw new Error("Sale not found");
    items[idx] = { ...items[idx], ...data, id };
    write(sKey(uid), items);
    return items[idx];
  },
  delete(uid: number, id: number) {
    write(sKey(uid), read<any>(sKey(uid)).filter((i: any) => i.id !== id));
  },
  exportAll(uid: number): any[] { return read<any>(sKey(uid)); },
  clear(uid: number) { localStorage.removeItem(sKey(uid)); },
  hasData(uid: number): boolean { return read<any>(sKey(uid)).length > 0; },
};

// ── Expenses ──────────────────────────────────────────────────────────────────
type LocalExpense = {
  id: number;
  category: string;
  amount: number;
  description?: string;
  date?: string;
  createdAt: string;
};

const eKey = (uid: number) => `cf_expenses_${uid}`;

export const localExpenses = {
  getAll(uid: number): LocalExpense[] { return read<LocalExpense>(eKey(uid)); },
  create(uid: number, data: Omit<LocalExpense, "id" | "createdAt">): LocalExpense {
    const list = read<LocalExpense>(eKey(uid));
    const id = -(Date.now());
    const item: LocalExpense = { ...data, id, createdAt: new Date().toISOString() };
    write(eKey(uid), [item, ...list]);
    return item;
  },
  update(uid: number, id: number, data: Partial<Omit<LocalExpense, "id" | "createdAt">>) {
    write(eKey(uid), read<LocalExpense>(eKey(uid)).map(e => e.id === id ? { ...e, ...data } : e));
  },
  delete(uid: number, id: number) {
    write(eKey(uid), read<LocalExpense>(eKey(uid)).filter(e => e.id !== id));
  },
  exportAll(uid: number): LocalExpense[] { return read<LocalExpense>(eKey(uid)); },
  clear(uid: number) { localStorage.removeItem(eKey(uid)); },
  hasData(uid: number): boolean { return read<LocalExpense>(eKey(uid)).length > 0; },
};

// ── Full Backup Export ────────────────────────────────────────────────────────
/** Export ALL local data for a user as a single JSON object */
export function exportAllLocalData(uid: number): object {
  return {
    exportedAt:  new Date().toISOString(),
    userId:      uid,
    repairs:     localRepairs.exportAll(uid),
    inventory:   localInventory.exportAll(uid),
    customers:   localCustomers.exportAll(uid),
    ledger:      localLedger.exportAll(uid),
    sales:       localSales.exportAll(uid),
    expenses:    localExpenses.exportAll(uid),
    suppliers:   localSuppliers.exportAll(uid),
    categories:  localCategories.exportAll(uid),
  };
}

/** Trigger a JSON file download in the browser */
export function downloadLocalBackup(uid: number, shopName?: string) {
  const data = exportAllLocalData(uid);
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const date = new Date().toISOString().slice(0, 10);
  a.href = url;
  a.download = `combofinder-backup-${(shopName ?? "data").replace(/\s+/g, "-")}-${date}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

/** Check if any local data exists */
export function hasAnyLocalData(uid: number): boolean {
  return (
    localRepairs.hasData(uid) ||
    localInventory.hasData(uid) ||
    localCustomers.hasData(uid) ||
    localLedger.hasData(uid) ||
    localSales.hasData(uid) ||
    localExpenses.hasData(uid) ||
    localSuppliers.hasData(uid) ||
    localCategories.hasData(uid)
  );
}

// ── Suppliers ─────────────────────────────────────────────────────────────────
const suplKey = (uid: number) => `cf_supl_${uid}`;

type LocalSupplier = {
  id: number; userId: number; name: string; phone?: string | null;
  whatsapp?: string | null; partTypes?: string | null; notes?: string | null;
  isActive: boolean; createdAt: string; updatedAt: string;
};

export const localSuppliers = {
  getAll(uid: number): LocalSupplier[] { return read<LocalSupplier>(suplKey(uid)); },
  create(uid: number, data: any): LocalSupplier {
    const items = read<LocalSupplier>(suplKey(uid));
    const item: LocalSupplier = {
      ...data,
      id: genLocalId(),
      userId: uid,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    items.push(item);
    write(suplKey(uid), items);
    return item;
  },
  update(uid: number, id: number, data: any): LocalSupplier {
    const items = read<LocalSupplier>(suplKey(uid));
    const idx = items.findIndex(i => i.id === id);
    if (idx === -1) throw new Error("Supplier not found");
    items[idx] = { ...items[idx], ...data, id, updatedAt: new Date().toISOString() };
    write(suplKey(uid), items);
    return items[idx];
  },
  delete(uid: number, id: number) {
    write(suplKey(uid), read<LocalSupplier>(suplKey(uid)).filter(i => i.id !== id));
  },
  exportAll(uid: number): LocalSupplier[] { return read<LocalSupplier>(suplKey(uid)); },
  clear(uid: number) { localStorage.removeItem(suplKey(uid)); },
  hasData(uid: number): boolean { return read<LocalSupplier>(suplKey(uid)).length > 0; },
};

// ── Inventory Categories ──────────────────────────────────────────────────────
const catKey = (uid: number) => `cf_cat_${uid}`;

type LocalCategory = {
  id: number; userId: number; name: string; description?: string | null;
  parentId?: number | null; icon?: string | null; color?: string | null; createdAt: string;
};

export const localCategories = {
  getAll(uid: number): LocalCategory[] { return read<LocalCategory>(catKey(uid)); },
  create(uid: number, data: any): LocalCategory {
    const items = read<LocalCategory>(catKey(uid));
    const item: LocalCategory = {
      ...data,
      id: genLocalId(),
      userId: uid,
      createdAt: new Date().toISOString(),
    };
    items.push(item);
    write(catKey(uid), items);
    return item;
  },
  update(uid: number, id: number, data: any): LocalCategory {
    const items = read<LocalCategory>(catKey(uid));
    const idx = items.findIndex(i => i.id === id);
    if (idx === -1) throw new Error("Category not found");
    items[idx] = { ...items[idx], ...data, id };
    write(catKey(uid), items);
    return items[idx];
  },
  delete(uid: number, id: number) {
    // Also delete all subcategories of this parent
    const items = read<LocalCategory>(catKey(uid));
    const toDelete = new Set<number>([id]);
    items.filter(i => i.parentId === id).forEach(i => toDelete.add(i.id));
    write(catKey(uid), items.filter(i => !toDelete.has(i.id)));
  },
  exportAll(uid: number): LocalCategory[] { return read<LocalCategory>(catKey(uid)); },
  clear(uid: number) { localStorage.removeItem(catKey(uid)); },
  hasData(uid: number): boolean { return read<LocalCategory>(catKey(uid)).length > 0; },
};
