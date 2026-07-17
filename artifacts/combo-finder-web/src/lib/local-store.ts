/**
 * Local-First Storage for Free-plan users.
 * Uses localStorage with JSON serialization.
 * Negative IDs are used for local records to avoid conflicts with server IDs.
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

  /** Count repairs created this calendar month (for enforcing free limit) */
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
