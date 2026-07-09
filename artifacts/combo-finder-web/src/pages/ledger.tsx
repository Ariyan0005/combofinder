import { useState, useEffect, useRef, useMemo } from "react";
import {
  BookMarked, Plus, X, FileDown, Search, ChevronLeft,
  ArrowUpCircle, ArrowDownCircle, Trash2, Edit2, Phone, Check,
  Printer, CalendarRange, RotateCcw,
} from "lucide-react";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { useAuth } from "@/context/auth-context";
import { ProtectedPage } from "@/components/protected-page";

type Account = {
  id: number;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  notes?: string;
  balance: number;
  creditSum?: number;
  debitSum?: number;
};

type Entry = {
  id: number;
  accountId: number;
  type: "credit" | "debit";
  amount: string;
  description?: string;
  reference?: string;
  date: string;
};

const BASE = "/api/ledger";
const apiFetch = (url: string, opts?: RequestInit) =>
  fetch(url, { credentials: "include", ...opts });

async function safeJson(r: Response) {
  const ct = r.headers.get("content-type") ?? "";
  if (!ct.includes("application/json")) throw new Error("Server error. Please try again later.");
  return r.json();
}

const INPUT_CLS = "w-full px-4 py-3 rounded-xl border text-sm outline-none transition-all";
const INPUT_STYLE = { borderColor: "hsl(var(--border))", background: "hsl(var(--background))" };

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

function localDateStr(d = new Date()) {
  const tzOffsetMs = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - tzOffsetMs).toISOString().slice(0, 10);
}

function escapeHtml(v: unknown) {
  return String(v ?? "").replace(/[&<>"']/g, c => (
    { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] as string
  ));
}

export default function Ledger() {
  const { user } = useAuth();
  const currency = user?.currency ?? "USD";
  const currencySymbols: Record<string, string> = { USD: "$", EUR: "€", GBP: "£", BDT: "৳", INR: "₹", PKR: "₨", AED: "د.إ", SAR: "﷼", MYR: "RM", NGN: "₦", TRY: "₺", PHP: "₱", NPR: "रू" };
  const sym = currencySymbols[currency] ?? currency;

  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loadingEntries, setLoadingEntries] = useState(false);

  // Add account modal
  const [accOpen, setAccOpen] = useState(false);
  const [accEdit, setAccEdit] = useState<Account | null>(null);
  const [accName, setAccName] = useState("");
  const [accPhone, setAccPhone] = useState("");
  const [accEmail, setAccEmail] = useState("");
  const [accAddress, setAccAddress] = useState("");
  const [accNotes, setAccNotes] = useState("");
  const [accSaving, setAccSaving] = useState(false);
  const [accError, setAccError] = useState("");

  // Add entry modal
  const [entryOpen, setEntryOpen] = useState(false);
  const [entryType, setEntryType] = useState<"credit" | "debit">("debit");
  const [entryAmount, setEntryAmount] = useState("");
  const [entryItemName, setEntryItemName] = useState("");
  const [entryDesc, setEntryDesc] = useState("");
  const [entryRef, setEntryRef] = useState("");
  const [entryDate, setEntryDate] = useState(localDateStr());
  const [entrySaving, setEntrySaving] = useState(false);
  const [entryError, setEntryError] = useState("");
  const [entryOk, setEntryOk] = useState(false);

  // Date range filter (account detail view)
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const printRef = useRef<HTMLDivElement>(null);

  const filteredEntries = useMemo(() => {
    if (!dateFrom && !dateTo) return entries;
    return entries.filter(e => {
      const d = e.date.slice(0, 10);
      if (dateFrom && d < dateFrom) return false;
      if (dateTo && d > dateTo) return false;
      return true;
    });
  }, [entries, dateFrom, dateTo]);

  const rangeTotals = useMemo(() => {
    const creditSum = filteredEntries.filter(e => e.type === "credit").reduce((s, e) => s + Number(e.amount), 0);
    const debitSum = filteredEntries.filter(e => e.type === "debit").reduce((s, e) => s + Number(e.amount), 0);
    // Matches API semantics (routes/ledger.ts): balance = creditSum - debitSum; positive = customer owes.
    return { creditSum, debitSum, balance: creditSum - debitSum };
  }, [filteredEntries]);

  const isFiltered = !!(dateFrom || dateTo);

  function clearDateFilter() { setDateFrom(""); setDateTo(""); }

  function exportPdf() {
    const acc = selectedAccount;
    if (!acc) return;
    const shopName = user?.shopName ?? user?.name ?? "My Shop";
    const rows = filteredEntries;
    const totals = isFiltered ? rangeTotals : { creditSum: acc.creditSum ?? 0, debitSum: acc.debitSum ?? 0, balance: acc.balance };

    const doc = new jsPDF({ unit: "mm", format: "a4" });
    const pageW = doc.internal.pageSize.getWidth();

    // Header band
    doc.setFillColor(37, 99, 235);
    doc.rect(0, 0, pageW, 32, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text(shopName, 14, 10);
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text(isFiltered ? `Ledger Statement · ${dateFrom || "…"} to ${dateTo || "…"}` : "Ledger Statement", 14, 16);
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text(acc.name, 14, 24);
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    if (acc.phone) doc.text(`Phone: ${acc.phone}`, 80, 24);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, pageW - 14, 24, { align: "right" });

    // Summary row
    doc.setTextColor(30, 30, 30);
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text(`Total Debit: ${sym}${totals.debitSum.toLocaleString()}`, 14, 42);
    doc.text(`Total Credit: ${sym}${totals.creditSum.toLocaleString()}`, 80, 42);
    const balLabel = totals.balance > 0 ? `Balance Due: ${sym}${totals.balance.toLocaleString()} (Customer owes)`
      : totals.balance < 0 ? `Balance: ${sym}${Math.abs(totals.balance).toLocaleString()} (You owe)`
      : "Balance: Settled";
    doc.text(isFiltered ? `${balLabel} (for selected period)` : balLabel, 14, 49);

    // Table — sorted by date ascending
    const sorted = [...rows].sort((a, b) => a.date.localeCompare(b.date));

    autoTable(doc, {
      startY: 56,
      head: [["Date", "Product / Item", "Description", "Reference", `Credit (${sym})`, `Debit (${sym})`]],
      body: sorted.map(e => [
        fmtDate(e.date),
        (e as any).itemName ?? "—",
        e.description ?? "—",
        e.reference ?? "—",
        e.type === "credit" ? Number(e.amount).toLocaleString() : "",
        e.type === "debit"  ? Number(e.amount).toLocaleString() : "",
      ]),
      styles: { fontSize: 8, cellPadding: 3 },
      headStyles: { fillColor: [37, 99, 235], textColor: 255, fontStyle: "bold" },
      columnStyles: {
        0: { cellWidth: 24 },
        1: { cellWidth: 36 },
        2: { cellWidth: 40 },
        3: { cellWidth: 24 },
        4: { cellWidth: 22, halign: "right", textColor: [22, 163, 74] },
        5: { cellWidth: 22, halign: "right", textColor: [220, 38, 38] },
      },
      alternateRowStyles: { fillColor: [248, 250, 252] },
    });

    // Footer
    const finalY = (doc as any).lastAutoTable?.finalY ?? 200;
    doc.setFontSize(7);
    doc.setTextColor(150, 150, 150);
    doc.text(`${shopName} · Ledger Report`, 14, finalY + 10);
    doc.text(`Page 1`, pageW - 14, finalY + 10, { align: "right" });

    doc.save(`ledger-${acc.name.replace(/\s+/g, "-")}${isFiltered ? `-${dateFrom || "start"}_to_${dateTo || "end"}` : ""}.pdf`);
  }

  async function loadAccounts() {
    setLoading(true);
    try {
      const r = await apiFetch(`${BASE}/accounts`);
      const data = await safeJson(r);
      setAccounts(Array.isArray(data) ? data : []);
    } catch {}
    setLoading(false);
  }

  async function loadEntries(accountId: number) {
    setLoadingEntries(true);
    setDateFrom(""); setDateTo("");
    try {
      const r = await apiFetch(`${BASE}/accounts/${accountId}`);
      const data = await safeJson(r) as Account & { entries: Entry[] };
      setSelectedAccount(data);
      setEntries(data.entries ?? []);
    } catch {}
    setLoadingEntries(false);
  }

  useEffect(() => { loadAccounts(); }, []);

  function openAddAccount(edit?: Account) {
    setAccEdit(edit ?? null);
    setAccName(edit?.name ?? "");
    setAccPhone(edit?.phone ?? "");
    setAccEmail(edit?.email ?? "");
    setAccAddress(edit?.address ?? "");
    setAccNotes(edit?.notes ?? "");
    setAccError("");
    setAccOpen(true);
  }

  async function handleSaveAccount(e: React.FormEvent) {
    e.preventDefault();
    setAccSaving(true); setAccError("");
    const body = { name: accName, phone: accPhone, email: accEmail, address: accAddress, notes: accNotes };
    try {
      const url = accEdit ? `${BASE}/accounts/${accEdit.id}` : `${BASE}/accounts`;
      const method = accEdit ? "PUT" : "POST";
      const r = await apiFetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const data = await safeJson(r);
      if (!r.ok) throw new Error(data.error ?? "Failed");
      setAccOpen(false);
      await loadAccounts();
      if (selectedAccount && accEdit?.id === selectedAccount.id) await loadEntries(selectedAccount.id);
    } catch (err: any) { setAccError(err.message); }
    finally { setAccSaving(false); }
  }

  async function deleteAccount(id: number) {
    if (!confirm("Delete this account and ALL its entries? This cannot be undone.")) return;
    await apiFetch(`${BASE}/accounts/${id}`, { method: "DELETE" });
    if (selectedAccount?.id === id) { setSelectedAccount(null); setEntries([]); }
    await loadAccounts();
  }

  function openAddEntry(type: "credit" | "debit" = "debit") {
    setEntryType(type);
    setEntryAmount(""); setEntryItemName(""); setEntryDesc(""); setEntryRef(""); setEntryOk(false);
    setEntryDate(localDateStr());
    setEntryError("");
    setEntryOpen(true);
  }

  async function handleSaveEntry(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedAccount) return;
    setEntrySaving(true); setEntryError("");
    const body = { accountId: selectedAccount.id, type: entryType, amount: entryAmount, itemName: entryItemName || undefined, description: entryDesc, reference: entryRef, date: entryDate };
    try {
      const r = await apiFetch(`${BASE}/entries`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const data = await safeJson(r);
      if (!r.ok) throw new Error(data.error ?? "Failed");
      setEntryOk(true);
      await loadEntries(selectedAccount.id);
      await loadAccounts();
      setTimeout(() => { setEntryOpen(false); setEntryOk(false); }, 800);
    } catch (err: any) { setEntryError(err.message); }
    finally { setEntrySaving(false); }
  }

  async function deleteEntry(id: number) {
    if (!confirm("Delete this entry?")) return;
    await apiFetch(`${BASE}/entries/${id}`, { method: "DELETE" });
    if (selectedAccount) await loadEntries(selectedAccount.id);
    await loadAccounts();
  }

  function handlePrint() {
    const acc = selectedAccount;
    if (!acc) return;
    const rows = filteredEntries;
    const totals = isFiltered ? rangeTotals : { creditSum: acc.creditSum ?? 0, debitSum: acc.debitSum ?? 0, balance: acc.balance };
    const periodLabel = isFiltered ? `<p style="color:#2563eb;font-weight:600">Period: ${escapeHtml(dateFrom || "…")} → ${escapeHtml(dateTo || "…")}</p>` : "";
    const html = `<!DOCTYPE html><html><head><title>Ledger - ${escapeHtml(acc.name)}</title>
    <style>body{font-family:Arial,sans-serif;padding:24px;max-width:700px;margin:auto;color:#111}
    h2{margin-bottom:4px}p{color:#555;font-size:13px;margin:2px 0}
    table{width:100%;border-collapse:collapse;margin-top:16px}
    th{background:#f3f4f6;text-align:left;padding:8px 10px;font-size:12px;text-transform:uppercase;letter-spacing:.05em}
    td{padding:8px 10px;border-bottom:1px solid #e5e7eb;font-size:13px}
    .credit{color:#16a34a}.debit{color:#dc2626}
    .balance{background:#f9fafb;padding:12px;border-radius:8px;margin-top:16px}
    @media print{button{display:none}}</style></head><body>
    <h2>${escapeHtml(acc.name)}</h2>
    ${acc.phone ? `<p>📞 ${escapeHtml(acc.phone)}</p>` : ""}
    ${acc.email ? `<p>✉ ${escapeHtml(acc.email)}</p>` : ""}
    ${acc.address ? `<p>📍 ${escapeHtml(acc.address)}</p>` : ""}
    ${periodLabel}
    <table><thead><tr><th>Date</th><th>Product/Item</th><th>Description</th><th>Ref</th><th>Credit</th><th>Debit</th></tr></thead>
    <tbody>${rows.map(e => `<tr>
      <td>${escapeHtml(fmtDate(e.date))}</td>
      <td>${escapeHtml((e as any).itemName ?? "")}</td>
      <td>${escapeHtml(e.description ?? "")}</td>
      <td>${escapeHtml(e.reference ?? "")}</td>
      <td class="credit">${e.type === "credit" ? sym + Number(e.amount).toLocaleString() : ""}</td>
      <td class="debit">${e.type === "debit" ? sym + Number(e.amount).toLocaleString() : ""}</td>
    </tr>`).join("")}</tbody></table>
    <div class="balance">
      <strong>Total Credit: <span class="credit">${sym}${totals.creditSum.toLocaleString()}</span></strong><br/>
      <strong>Total Debit: <span class="debit">${sym}${totals.debitSum.toLocaleString()}</span></strong><br/>
      <strong style="font-size:16px">Balance${isFiltered ? " (period)" : ""}: ${totals.balance >= 0 ? `<span class="debit">${sym}${totals.balance.toLocaleString()} (Customer owes)</span>` : `<span class="credit">${sym}${Math.abs(totals.balance).toLocaleString()} (You owe)</span>`}</strong>
    </div>
    <p style="margin-top:20px;font-size:11px;color:#9ca3af">Generated by ComboFinder · ${escapeHtml(new Date().toLocaleString())}</p>
    </body></html>`;
    const w = window.open("", "_blank");
    if (w) { w.document.write(html); w.document.close(); w.print(); }
  }

  function exportCSV() {
    if (!selectedAccount) return;
    const rows = [["Date", "Type", "Amount", "Product/Item", "Description", "Reference"]];
    filteredEntries.forEach(e => rows.push([fmtDate(e.date), e.type, e.amount, (e as any).itemName ?? "", e.description ?? "", e.reference ?? ""]));
    rows.push(["", "", "", "", ""]);
    const totals = isFiltered ? rangeTotals : { creditSum: selectedAccount.creditSum ?? 0, debitSum: selectedAccount.debitSum ?? 0, balance: selectedAccount.balance };
    if (isFiltered) rows.push([`Period: ${dateFrom || "…"} to ${dateTo || "…"}`, "", "", "", "", ""]);
    rows.push(["Total Credit", String(totals.creditSum), "", "", ""]);
    rows.push(["Total Debit", String(totals.debitSum), "", "", ""]);
    rows.push(["Balance", String(totals.balance), "", "", ""]);
    const csv = rows.map(r => r.map(c => `"${c}"`).join(",")).join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = `ledger-${selectedAccount.name.replace(/\s+/g, "-")}${isFiltered ? `-${dateFrom || "start"}_to_${dateTo || "end"}` : ""}.csv`;
    a.click();
  }

  const filteredAccounts = accounts.filter(a =>
    a.name.toLowerCase().includes(search.toLowerCase()) ||
    (a.phone ?? "").includes(search)
  );

  // Detailed account view
  if (selectedAccount) {
    const acc = selectedAccount;
    const displayTotals = isFiltered ? rangeTotals : { creditSum: acc.creditSum ?? 0, debitSum: acc.debitSum ?? 0, balance: acc.balance };

    return (
      <ProtectedPage>
        <div className="space-y-4">
          {/* Back + header */}
          <div className="flex items-center gap-3 pt-1">
            <button onClick={() => { setSelectedAccount(null); setEntries([]); loadAccounts(); }}
              className="w-8 h-8 rounded-xl flex items-center justify-center border border-border hover:border-primary transition-colors flex-shrink-0">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="w-11 h-11 rounded-full flex items-center justify-center text-base font-bold text-white flex-shrink-0"
              style={{ background: "hsl(var(--primary))" }}>
              {acc.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-lg font-extrabold truncate">{acc.name}</h1>
              {acc.phone && <p className="text-xs flex items-center gap-1" style={{ color: "hsl(var(--muted-foreground))" }}><Phone className="w-3 h-3" />{acc.phone}</p>}
            </div>
            <button onClick={() => openAddAccount(acc)}
              className="p-2 rounded-xl border border-border hover:border-primary transition-colors flex-shrink-0">
              <Edit2 className="w-4 h-4" />
            </button>
          </div>

          {/* Balance summary */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-card rounded-2xl border border-border p-3 text-center">
              <p className="text-[10px] font-bold uppercase tracking-wide mb-1" style={{ color: "hsl(var(--muted-foreground))" }}>Credit{isFiltered && " *"}</p>
              <p className="font-bold text-sm" style={{ color: "#16a34a" }}>{sym}{displayTotals.creditSum.toLocaleString()}</p>
            </div>
            <div className="bg-card rounded-2xl border border-border p-3 text-center">
              <p className="text-[10px] font-bold uppercase tracking-wide mb-1" style={{ color: "hsl(var(--muted-foreground))" }}>Debit{isFiltered && " *"}</p>
              <p className="font-bold text-sm" style={{ color: "#dc2626" }}>{sym}{displayTotals.debitSum.toLocaleString()}</p>
            </div>
            <div className="bg-card rounded-2xl border border-border p-3 text-center"
              style={{ background: displayTotals.balance > 0 ? "rgba(220,38,38,0.05)" : displayTotals.balance < 0 ? "rgba(22,163,74,0.05)" : undefined }}>
              <p className="text-[10px] font-bold uppercase tracking-wide mb-1" style={{ color: "hsl(var(--muted-foreground))" }}>{isFiltered ? "Period Bal. *" : "Balance"}</p>
              <p className="font-bold text-sm" style={{ color: displayTotals.balance > 0 ? "#dc2626" : displayTotals.balance < 0 ? "#16a34a" : undefined }}>
                {sym}{Math.abs(displayTotals.balance).toLocaleString()}
              </p>
              {displayTotals.balance > 0 && <p className="text-[9px]" style={{ color: "#dc2626" }}>Customer owes</p>}
              {displayTotals.balance < 0 && <p className="text-[9px]" style={{ color: "#16a34a" }}>You owe</p>}
              {displayTotals.balance === 0 && <p className="text-[9px]" style={{ color: "hsl(var(--muted-foreground))" }}>Settled</p>}
            </div>
          </div>
          {isFiltered && <p className="text-[10px] -mt-2" style={{ color: "hsl(var(--muted-foreground))" }}>* figures reflect the selected date range only — overall balance is {sym}{Math.abs(acc.balance).toLocaleString()} {acc.balance > 0 ? "(customer owes)" : acc.balance < 0 ? "(you owe)" : "(settled)"}</p>}

          {/* Add entry buttons */}
          <div className="grid grid-cols-2 gap-3">
            <button onClick={() => openAddEntry("debit")}
              className="flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm text-white shadow-sm active:scale-[0.98] transition-transform"
              style={{ background: "#dc2626" }}>
              <ArrowDownCircle className="w-4 h-4" />
              Add Debit (sale / receive)
            </button>
            <button onClick={() => openAddEntry("credit")}
              className="flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm text-white shadow-sm active:scale-[0.98] transition-transform"
              style={{ background: "#16a34a" }}>
              <ArrowUpCircle className="w-4 h-4" />
              Add Credit (payment)
            </button>
          </div>

          {/* Entries list */}
          <div className="bg-card rounded-2xl border border-border overflow-hidden">
            <div className="px-4 py-3 border-b border-border space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold uppercase tracking-wide flex items-center gap-1.5" style={{ color: "hsl(var(--muted-foreground))" }}>
                  <CalendarRange className="w-3.5 h-3.5" />
                  Transaction History ({filteredEntries.length}{isFiltered ? ` of ${entries.length}` : ""})
                </p>
                <div className="flex items-center gap-1">
                  <button onClick={exportCSV} title="Export CSV"
                    className="flex items-center gap-1 px-2 py-1.5 rounded-lg border border-border hover:border-primary transition-colors text-[11px] font-bold">
                    <FileDown className="w-3.5 h-3.5" /> CSV
                  </button>
                  <button onClick={exportPdf} title="Export PDF"
                    className="flex items-center gap-1 px-2 py-1.5 rounded-lg border border-border hover:border-primary transition-colors text-[11px] font-bold">
                    <FileDown className="w-3.5 h-3.5" /> PDF
                  </button>
                  <button onClick={handlePrint} title="Print"
                    className="flex items-center gap-1 px-2 py-1.5 rounded-lg border border-border hover:border-primary transition-colors text-[11px] font-bold">
                    <Printer className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1">
                  <label className="text-[9px] font-semibold block mb-1" style={{ color: "hsl(var(--muted-foreground))" }}>From</label>
                  <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
                    max={dateTo || undefined}
                    className="w-full px-2.5 py-1.5 rounded-lg border text-xs outline-none" style={INPUT_STYLE} />
                </div>
                <div className="flex-1">
                  <label className="text-[9px] font-semibold block mb-1" style={{ color: "hsl(var(--muted-foreground))" }}>To</label>
                  <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
                    min={dateFrom || undefined}
                    className="w-full px-2.5 py-1.5 rounded-lg border text-xs outline-none" style={INPUT_STYLE} />
                </div>
                {isFiltered && (
                  <button onClick={clearDateFilter} title="Clear date filter"
                    className="mt-4 p-2 rounded-lg border border-border hover:border-primary transition-colors flex-shrink-0">
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
            {loadingEntries ? (
              <div className="p-8 flex justify-center">
                <div className="w-8 h-8 border-4 rounded-full animate-spin"
                  style={{ borderColor: "hsl(var(--primary))", borderTopColor: "transparent" }} />
              </div>
            ) : entries.length === 0 ? (
              <div className="p-8 text-center text-sm" style={{ color: "hsl(var(--muted-foreground))" }}>
                No transactions yet. Add a debit or credit entry above.
              </div>
            ) : filteredEntries.length === 0 ? (
              <div className="p-8 text-center text-sm" style={{ color: "hsl(var(--muted-foreground))" }}>
                No transactions in this date range.
                <button onClick={clearDateFilter} className="block mx-auto mt-2 text-xs font-bold" style={{ color: "hsl(var(--primary))" }}>Clear filter</button>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {filteredEntries.map(entry => (
                  <div key={entry.id} className="flex items-center gap-3 px-4 py-3">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{ background: entry.type === "credit" ? "rgba(22,163,74,0.1)" : "rgba(220,38,38,0.1)" }}>
                      {entry.type === "credit"
                        ? <ArrowUpCircle className="w-4 h-4" style={{ color: "#16a34a" }} />
                        : <ArrowDownCircle className="w-4 h-4" style={{ color: "#dc2626" }} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold">
                        {(entry as any).itemName
                          ? (entry as any).itemName
                          : entry.description || (entry.type === "credit" ? "Payment Received" : "Sale / Debit")}
                      </p>
                      {(entry as any).itemName && entry.description && (
                        <p className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>{entry.description}</p>
                      )}
                      <p className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>
                        {fmtDate(entry.date)}{entry.reference ? ` · Ref: ${entry.reference}` : ""}
                      </p>
                    </div>
                    <p className="font-bold text-sm flex-shrink-0"
                      style={{ color: entry.type === "credit" ? "#16a34a" : "#dc2626" }}>
                      {entry.type === "credit" ? "+" : "-"}{sym}{Number(entry.amount).toLocaleString()}
                    </p>
                    <button onClick={() => deleteEntry(entry.id)}
                      className="ml-1 p-1 rounded-lg hover:bg-destructive/10 transition-colors">
                      <Trash2 className="w-3.5 h-3.5" style={{ color: "hsl(var(--destructive))" }} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Add Entry Modal */}
        {entryOpen && (
          <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
            <div className="absolute inset-0 bg-black/50" onClick={() => setEntryOpen(false)} />
            <div className="relative w-full max-w-md rounded-t-3xl md:rounded-3xl shadow-2xl"
              style={{ background: "hsl(var(--card))" }}>
              <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b"
                style={{ borderColor: "hsl(var(--border))" }}>
                <div>
                  <h3 className="font-bold text-base">
                    {entryType === "debit" ? "Add Debit (Customer owes you)" : "Add Credit (Customer paid)"}
                  </h3>
                  <p className="text-xs mt-0.5" style={{ color: "hsl(var(--muted-foreground))" }}>{acc.name}</p>
                </div>
                <button onClick={() => setEntryOpen(false)} className="w-8 h-8 rounded-full flex items-center justify-center"
                  style={{ background: "hsl(var(--muted))" }}>
                  <X className="w-4 h-4" />
                </button>
              </div>
              <form onSubmit={handleSaveEntry} className="p-5 flex flex-col gap-3.5">
                <div className="grid grid-cols-2 gap-2">
                  {(["debit", "credit"] as const).map(t => (
                    <button type="button" key={t}
                      onClick={() => setEntryType(t)}
                      className="py-2.5 rounded-xl font-bold text-sm transition-all border"
                      style={{
                        background: entryType === t ? (t === "debit" ? "#dc2626" : "#16a34a") : "transparent",
                        color: entryType === t ? "#fff" : "hsl(var(--muted-foreground))",
                        borderColor: entryType === t ? "transparent" : "hsl(var(--border))",
                      }}>
                      {t === "debit" ? "Debit (owes)" : "Credit (paid)"}
                    </button>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold block mb-1.5" style={{ color: "hsl(var(--muted-foreground))" }}>Amount ({sym}) *</label>
                    <input value={entryAmount} onChange={e => setEntryAmount(e.target.value)} required
                      type="text" inputMode="decimal" placeholder="0.00"
                      className={INPUT_CLS} style={INPUT_STYLE}
                      onFocus={e => { e.currentTarget.style.borderColor = "hsl(var(--primary))"; }}
                      onBlur={e => { e.currentTarget.style.borderColor = "hsl(var(--border))"; }} />
                  </div>
                  <div>
                    <label className="text-xs font-semibold block mb-1.5" style={{ color: "hsl(var(--muted-foreground))" }}>Date *</label>
                    <input value={entryDate} onChange={e => setEntryDate(e.target.value)} required
                      type="date"
                      className={INPUT_CLS} style={INPUT_STYLE}
                      onFocus={e => { e.currentTarget.style.borderColor = "hsl(var(--primary))"; }}
                      onBlur={e => { e.currentTarget.style.borderColor = "hsl(var(--border))"; }} />
                  </div>
                </div>
                {entryType === "debit" && (
                  <div>
                    <label className="text-xs font-semibold block mb-1.5" style={{ color: "hsl(var(--muted-foreground))" }}>
                      Product / Item Name
                    </label>
                    <input value={entryItemName} onChange={e => setEntryItemName(e.target.value)}
                      placeholder="e.g. iPhone 14 Screen, Samsung Battery…"
                      className={INPUT_CLS} style={INPUT_STYLE}
                      onFocus={e => { e.currentTarget.style.borderColor = "hsl(var(--primary))"; }}
                      onBlur={e => { e.currentTarget.style.borderColor = "hsl(var(--border))"; }} />
                  </div>
                )}
                <div>
                  <label className="text-xs font-semibold block mb-1.5" style={{ color: "hsl(var(--muted-foreground))" }}>
                    {entryType === "debit" ? "Notes / Description" : "Notes (e.g. Cash payment)"}
                  </label>
                  <input value={entryDesc} onChange={e => setEntryDesc(e.target.value)}
                    placeholder={entryType === "debit" ? "Optional notes" : "e.g. Paid via bKash"}
                    className={INPUT_CLS} style={INPUT_STYLE}
                    onFocus={e => { e.currentTarget.style.borderColor = "hsl(var(--primary))"; }}
                    onBlur={e => { e.currentTarget.style.borderColor = "hsl(var(--border))"; }} />
                </div>
                <div>
                  <label className="text-xs font-semibold block mb-1.5" style={{ color: "hsl(var(--muted-foreground))" }}>Reference / Invoice #</label>
                  <input value={entryRef} onChange={e => setEntryRef(e.target.value)}
                    placeholder="Optional reference number"
                    className={INPUT_CLS} style={INPUT_STYLE}
                    onFocus={e => { e.currentTarget.style.borderColor = "hsl(var(--primary))"; }}
                    onBlur={e => { e.currentTarget.style.borderColor = "hsl(var(--border))"; }} />
                </div>
                {entryError && <p className="text-xs font-semibold" style={{ color: "hsl(var(--destructive))" }}>{entryError}</p>}
                <button type="submit" disabled={entrySaving}
                  className="py-3 rounded-xl font-bold text-sm text-white disabled:opacity-60 flex items-center justify-center gap-2"
                  style={{ background: entryType === "debit" ? "#dc2626" : "#16a34a" }}>
                  {entryOk ? <><Check className="w-4 h-4" /> Saved!</> : entrySaving ? "Saving…" : `Add ${entryType === "debit" ? "Debit" : "Credit"}`}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Edit Account Modal */}
        {accOpen && (
          <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
            <div className="absolute inset-0 bg-black/50" onClick={() => setAccOpen(false)} />
            <div className="relative w-full max-w-md rounded-t-3xl md:rounded-3xl shadow-2xl"
              style={{ background: "hsl(var(--card))" }}>
              <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b"
                style={{ borderColor: "hsl(var(--border))" }}>
                <h3 className="font-bold text-base">Edit Account</h3>
                <button onClick={() => setAccOpen(false)} className="w-8 h-8 rounded-full flex items-center justify-center"
                  style={{ background: "hsl(var(--muted))" }}>
                  <X className="w-4 h-4" />
                </button>
              </div>
              <form onSubmit={handleSaveAccount} className="p-5 flex flex-col gap-3.5">
                <div>
                  <label className="text-xs font-semibold block mb-1.5" style={{ color: "hsl(var(--muted-foreground))" }}>Customer Name *</label>
                  <input value={accName} onChange={e => setAccName(e.target.value)} required
                    placeholder="Full name" className={INPUT_CLS} style={INPUT_STYLE}
                    onFocus={e => { e.currentTarget.style.borderColor = "hsl(var(--primary))"; }}
                    onBlur={e => { e.currentTarget.style.borderColor = "hsl(var(--border))"; }} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold block mb-1.5" style={{ color: "hsl(var(--muted-foreground))" }}>Phone</label>
                    <input value={accPhone} onChange={e => setAccPhone(e.target.value)}
                      placeholder="Phone" className={INPUT_CLS} style={INPUT_STYLE}
                      onFocus={e => { e.currentTarget.style.borderColor = "hsl(var(--primary))"; }}
                      onBlur={e => { e.currentTarget.style.borderColor = "hsl(var(--border))"; }} />
                  </div>
                  <div>
                    <label className="text-xs font-semibold block mb-1.5" style={{ color: "hsl(var(--muted-foreground))" }}>Email</label>
                    <input value={accEmail} onChange={e => setAccEmail(e.target.value)}
                      placeholder="Email" className={INPUT_CLS} style={INPUT_STYLE}
                      onFocus={e => { e.currentTarget.style.borderColor = "hsl(var(--primary))"; }}
                      onBlur={e => { e.currentTarget.style.borderColor = "hsl(var(--border))"; }} />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold block mb-1.5" style={{ color: "hsl(var(--muted-foreground))" }}>Address</label>
                  <input value={accAddress} onChange={e => setAccAddress(e.target.value)}
                    placeholder="Address" className={INPUT_CLS} style={INPUT_STYLE}
                    onFocus={e => { e.currentTarget.style.borderColor = "hsl(var(--primary))"; }}
                    onBlur={e => { e.currentTarget.style.borderColor = "hsl(var(--border))"; }} />
                </div>
                {accError && <p className="text-xs font-semibold" style={{ color: "hsl(var(--destructive))" }}>{accError}</p>}
                <button type="submit" disabled={accSaving}
                  className="py-3 rounded-xl font-bold text-sm text-white disabled:opacity-60"
                  style={{ background: "hsl(var(--primary))" }}>
                  {accSaving ? "Saving…" : "Save Account"}
                </button>
              </form>
            </div>
          </div>
        )}
      </ProtectedPage>
    );
  }

  // Account list view
  return (
    <ProtectedPage>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pt-1">
          <div>
            <h1 className="text-xl font-extrabold">Ledger</h1>
            <p className="text-xs mt-0.5" style={{ color: "hsl(var(--muted-foreground))" }}>Track customer credit & debt</p>
          </div>
          <button onClick={() => openAddAccount()}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm text-white"
            style={{ background: "hsl(var(--primary))" }}>
            <Plus className="w-4 h-4" />
            Add Account
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2"
            style={{ color: "hsl(var(--muted-foreground))" }} />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by name or phone…"
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm outline-none"
            style={INPUT_STYLE}
            onFocus={e => { e.currentTarget.style.borderColor = "hsl(var(--primary))"; }}
            onBlur={e => { e.currentTarget.style.borderColor = "hsl(var(--border))"; }} />
        </div>

        {/* Stats */}
        {accounts.length > 0 && (
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-card rounded-2xl border border-border p-3">
              <p className="text-[10px] font-bold uppercase tracking-wide mb-1" style={{ color: "hsl(var(--muted-foreground))" }}>Total Customers Owe</p>
              <p className="font-bold text-base" style={{ color: "#dc2626" }}>
                {sym}{accounts.filter(a => a.balance > 0).reduce((s, a) => s + a.balance, 0).toLocaleString()}
              </p>
            </div>
            <div className="bg-card rounded-2xl border border-border p-3">
              <p className="text-[10px] font-bold uppercase tracking-wide mb-1" style={{ color: "hsl(var(--muted-foreground))" }}>Accounts with Balance</p>
              <p className="font-bold text-base">{accounts.filter(a => a.balance !== 0).length}</p>
            </div>
          </div>
        )}

        {/* Accounts list */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-4 rounded-full animate-spin"
              style={{ borderColor: "hsl(var(--primary))", borderTopColor: "transparent" }} />
          </div>
        ) : filteredAccounts.length === 0 ? (
          <div className="bg-card rounded-2xl border border-border p-8 text-center">
            <BookMarked className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p className="font-semibold text-sm">No accounts yet</p>
            <p className="text-xs mt-1" style={{ color: "hsl(var(--muted-foreground))" }}>
              Add a customer account to start tracking credit and debt
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredAccounts.map(acc => (
              <div key={acc.id} className="bg-card rounded-2xl border border-border p-4 flex items-center gap-3 cursor-pointer hover:border-primary transition-colors"
                onClick={() => loadEntries(acc.id)}>
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
                  style={{ background: "hsl(var(--primary))" }}>
                  {acc.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm">{acc.name}</p>
                  {acc.phone && (
                    <p className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>
                      <Phone className="w-3 h-3 inline mr-1" />{acc.phone}
                    </p>
                  )}
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="font-bold text-sm"
                    style={{ color: acc.balance > 0 ? "#dc2626" : acc.balance < 0 ? "#16a34a" : "hsl(var(--muted-foreground))" }}>
                    {acc.balance === 0 ? "Settled" : (acc.balance > 0 ? "-" : "+")}
                    {acc.balance !== 0 ? `${sym}${Math.abs(acc.balance).toLocaleString()}` : ""}
                  </p>
                  {acc.balance > 0 && <p className="text-[9px]" style={{ color: "#dc2626" }}>owes you</p>}
                  {acc.balance < 0 && <p className="text-[9px]" style={{ color: "#16a34a" }}>you owe</p>}
                </div>
                <button onClick={e => { e.stopPropagation(); deleteAccount(acc.id); }}
                  className="p-1.5 rounded-lg hover:bg-destructive/10 transition-colors ml-1">
                  <Trash2 className="w-3.5 h-3.5" style={{ color: "hsl(var(--destructive))" }} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Account Modal */}
      {accOpen && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setAccOpen(false)} />
          <div className="relative w-full max-w-md rounded-t-3xl md:rounded-3xl shadow-2xl"
            style={{ background: "hsl(var(--card))" }}>
            <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b"
              style={{ borderColor: "hsl(var(--border))" }}>
              <div>
                <h3 className="font-bold text-base">{accEdit ? "Edit Account" : "New Ledger Account"}</h3>
                <p className="text-xs mt-0.5" style={{ color: "hsl(var(--muted-foreground))" }}>Track this customer's balance</p>
              </div>
              <button onClick={() => setAccOpen(false)} className="w-8 h-8 rounded-full flex items-center justify-center"
                style={{ background: "hsl(var(--muted))" }}>
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSaveAccount} className="p-5 flex flex-col gap-3.5">
              <div>
                <label className="text-xs font-semibold block mb-1.5" style={{ color: "hsl(var(--muted-foreground))" }}>Customer Name *</label>
                <input value={accName} onChange={e => setAccName(e.target.value)} required
                  placeholder="Full name" className={INPUT_CLS} style={INPUT_STYLE}
                  onFocus={e => { e.currentTarget.style.borderColor = "hsl(var(--primary))"; }}
                  onBlur={e => { e.currentTarget.style.borderColor = "hsl(var(--border))"; }} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold block mb-1.5" style={{ color: "hsl(var(--muted-foreground))" }}>Phone</label>
                  <input value={accPhone} onChange={e => setAccPhone(e.target.value)}
                    placeholder="Phone" className={INPUT_CLS} style={INPUT_STYLE}
                    onFocus={e => { e.currentTarget.style.borderColor = "hsl(var(--primary))"; }}
                    onBlur={e => { e.currentTarget.style.borderColor = "hsl(var(--border))"; }} />
                </div>
                <div>
                  <label className="text-xs font-semibold block mb-1.5" style={{ color: "hsl(var(--muted-foreground))" }}>Email</label>
                  <input value={accEmail} onChange={e => setAccEmail(e.target.value)}
                    placeholder="Email" className={INPUT_CLS} style={INPUT_STYLE}
                    onFocus={e => { e.currentTarget.style.borderColor = "hsl(var(--primary))"; }}
                    onBlur={e => { e.currentTarget.style.borderColor = "hsl(var(--border))"; }} />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold block mb-1.5" style={{ color: "hsl(var(--muted-foreground))" }}>Address</label>
                <input value={accAddress} onChange={e => setAccAddress(e.target.value)}
                  placeholder="Optional address" className={INPUT_CLS} style={INPUT_STYLE}
                  onFocus={e => { e.currentTarget.style.borderColor = "hsl(var(--primary))"; }}
                  onBlur={e => { e.currentTarget.style.borderColor = "hsl(var(--border))"; }} />
              </div>
              <div>
                <label className="text-xs font-semibold block mb-1.5" style={{ color: "hsl(var(--muted-foreground))" }}>Notes</label>
                <input value={accNotes} onChange={e => setAccNotes(e.target.value)}
                  placeholder="Optional notes" className={INPUT_CLS} style={INPUT_STYLE}
                  onFocus={e => { e.currentTarget.style.borderColor = "hsl(var(--primary))"; }}
                  onBlur={e => { e.currentTarget.style.borderColor = "hsl(var(--border))"; }} />
              </div>
              {accError && <p className="text-xs font-semibold" style={{ color: "hsl(var(--destructive))" }}>{accError}</p>}
              <button type="submit" disabled={accSaving}
                className="py-3 rounded-xl font-bold text-sm text-white disabled:opacity-60"
                style={{ background: "hsl(var(--primary))" }}>
                {accSaving ? "Saving…" : accEdit ? "Update Account" : "Create Account"}
              </button>
            </form>
          </div>
        </div>
      )}
    </ProtectedPage>
  );
}
