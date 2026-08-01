import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell,
} from "recharts";
import {
  TrendingUp, TrendingDown, DollarSign, ShoppingCart, Wrench,
  Package, ChevronRight, ArrowLeft, Calendar,
} from "lucide-react";
import { Link } from "wouter";
import { useAuth } from "@/context/auth-context";
import { ProtectedPage } from "@/components/protected-page";
import { computeSalesSummary } from "@/lib/sales-summary-local";

const CURRENCY_SYMBOLS: Record<string, string> = {
  USD:"$", EUR:"€", GBP:"£", JPY:"¥", CNY:"¥", AUD:"A$", CAD:"C$", CHF:"Fr",
  HKD:"HK$", SGD:"S$", KRW:"₩", TWD:"NT$", BDT:"৳", INR:"₹", PKR:"₨",
  NPR:"रू", LKR:"Rs", MVR:"Rf", BTN:"Nu", MYR:"RM", THB:"฿", IDR:"Rp",
  PHP:"₱", VND:"₫", MMK:"K", KHR:"៛", LAK:"₭", BND:"B$", MOP:"P",
  AED:"د.إ", SAR:"﷼", QAR:"﷼", KWD:"KD", BHD:"BD", OMR:"﷼",
  TRY:"₺", RUB:"₽", NGN:"₦", ZAR:"R", EGP:"E£", GHS:"₵",
  KES:"KSh", UGX:"USh", TZS:"TSh", ETB:"Br",
};

type Range = "today" | "week" | "month" | "custom";

function fmt(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000)     return (n / 1_000).toFixed(1)     + "K";
  return Math.abs(n).toFixed(0);
}

function pct(a: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((a / total) * 100);
}

const RANGE_LABELS: { key: Range; label: string }[] = [
  { key: "today", label: "Today"      },
  { key: "week",  label: "This Week"  },
  { key: "month", label: "This Month" },
  { key: "custom", label: "Custom"    },
];

const CAT_COLORS = ["#6366F1","#10B981","#F59E0B","#EF4444","#8B5CF6","#0EA5E9","#EC4899","#14B8A6"];

function SummaryCard({ label, value, color, bg, icon: Icon, prefix = "$" }: {
  label: string; value: number; color: string; bg: string;
  icon: React.ElementType; prefix?: string;
}) {
  return (
    <div className="flex flex-col gap-2 p-3 rounded-2xl border"
      style={{ borderColor: "hsl(var(--border))", background: "hsl(var(--card))" }}>
      <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: bg }}>
        <Icon className="w-4 h-4" style={{ color }} />
      </div>
      <div>
        <p className="text-base font-extrabold leading-tight" style={{ color }} dir="ltr">
          {value < 0 ? "-" : ""}{prefix} {fmt(value)}
        </p>
        <p className="text-[10px] font-semibold mt-0.5" style={{ color: "hsl(var(--muted-foreground))" }}>{label}</p>
      </div>
    </div>
  );
}

function BreakdownBar({ label, value, total, color, sym }: { label: string; value: number; total: number; color: string; sym: string }) {
  const p = pct(value, total);
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold" style={{ color: "hsl(var(--foreground))" }}>{label}</span>
        <span className="text-xs font-bold" style={{ color }}>
          {sym} {value.toLocaleString()} <span className="text-[10px] font-medium" style={{ color: "hsl(var(--muted-foreground))" }}>({p}%)</span>
        </span>
      </div>
      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "hsl(var(--muted))" }}>
        <div className="h-full rounded-full transition-all" style={{ width: `${p}%`, background: color }} />
      </div>
    </div>
  );
}

function ChartTooltip({ active, payload, label, sym }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl px-3 py-2 shadow-lg border text-xs"
      style={{ background: "hsl(var(--card))", borderColor: "hsl(var(--border))" }}>
      <p className="font-semibold mb-0.5" style={{ color: "hsl(var(--foreground))" }}>{label}</p>
      <p style={{ color: "hsl(var(--primary))" }}>{sym} {Number(payload[0].value).toLocaleString()}</p>
    </div>
  );
}

export default function SalesReport() {
  const { user } = useAuth();
  const isFreePlan = user?.plan === "Free" || !user?.plan;
  const [range, setRange]       = useState<Range>("month");
  const [customFrom, setFrom]   = useState(() => {
    const d = new Date(); d.setDate(1);
    return d.toISOString().slice(0, 10);
  });
  const [customTo, setTo] = useState(() => new Date().toISOString().slice(0, 10));

  // ── Free plan: compute from localStorage ──────────────────────────────────
  const localSummary = useMemo(() => {
    if (!isFreePlan || !user?.id) return null;
    return computeSalesSummary(user.id, range, customFrom, customTo);
  }, [isFreePlan, user?.id, range, customFrom, customTo]);

  // ── Pro plan: fetch from API ───────────────────────────────────────────────
  const apiParams = range === "custom"
    ? `range=custom&from=${customFrom}&to=${customTo}`
    : `range=${range}`;

  const { data: apiSummary, isLoading } = useQuery<any>({
    queryKey:    ["sales-summary", range, customFrom, customTo],
    queryFn:     () => fetch(`/api/sales-summary?${apiParams}`, { credentials: "include" }).then(r => r.json()),
    enabled:     !isFreePlan,
  });

  const s = isFreePlan ? localSummary : apiSummary;
  const loading = !isFreePlan && isLoading;

  const posRevenue      = s?.posRevenue      ?? 0;
  const posCost         = s?.posCost         ?? 0;
  const repairRevenue   = s?.repairRevenue   ?? 0;
  const repairPartsCost = s?.repairPartsCost ?? 0;
  const totalRevenue    = s?.totalRevenue    ?? 0;
  const totalExpenses   = s?.totalExpenses   ?? 0;
  const netProfit       = s?.netProfit       ?? 0;
  const outstanding     = s?.outstanding     ?? 0;
  const weeklyChart     = s?.weeklyChart     ?? [];
  const expByCategory   = s?.expenseByCategory ?? {};

  // Repair service profit = repairRevenue - repairPartsCost
  const repairServiceProfit = repairRevenue - repairPartsCost;

  const PRIMARY = "hsl(var(--primary))";
  const sym = CURRENCY_SYMBOLS[user?.currency ?? "USD"] ?? user?.currency ?? "$";

  return (
    <ProtectedPage>
      <div className="space-y-4 pb-8">

        {/* Header */}
        <div className="flex items-center gap-3 pt-1">
          <Link href="/">
            <button className="w-8 h-8 rounded-full flex items-center justify-center border"
              style={{ borderColor: "hsl(var(--border))", background: "hsl(var(--card))" }}>
              <ArrowLeft className="w-4 h-4" style={{ color: "hsl(var(--muted-foreground))" }} />
            </button>
          </Link>
          <h1 className="text-xl font-extrabold">Sales Report</h1>
        </div>

        {/* Range Tabs */}
        <div className="flex gap-1.5 p-1 rounded-xl" style={{ background: "hsl(var(--muted))" }}>
          {RANGE_LABELS.map(({ key, label }) => (
            <button key={key} onClick={() => setRange(key)}
              className="flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all"
              style={{
                background:  range === key ? "hsl(var(--card))"        : "transparent",
                color:       range === key ? "hsl(var(--foreground))"  : "hsl(var(--muted-foreground))",
                boxShadow:   range === key ? "0 1px 3px rgba(0,0,0,.08)" : "none",
              }}>
              {label}
            </button>
          ))}
        </div>

        {/* Custom date inputs */}
        {range === "custom" && (
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="text-[10px] font-semibold mb-1 block" style={{ color: "hsl(var(--muted-foreground))" }}>From</label>
              <input type="date" value={customFrom} onChange={e => setFrom(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border text-xs font-medium"
                style={{ borderColor: "hsl(var(--border))", background: "hsl(var(--card))", color: "hsl(var(--foreground))" }} />
            </div>
            <div className="flex-1">
              <label className="text-[10px] font-semibold mb-1 block" style={{ color: "hsl(var(--muted-foreground))" }}>To</label>
              <input type="date" value={customTo} onChange={e => setTo(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border text-xs font-medium"
                style={{ borderColor: "hsl(var(--border))", background: "hsl(var(--card))", color: "hsl(var(--foreground))" }} />
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-4 rounded-full animate-spin"
              style={{ borderColor: PRIMARY, borderTopColor: "transparent" }} />
          </div>
        ) : (
          <>
            {/* ── Summary Cards ── */}
            <div className="grid grid-cols-2 gap-2.5">
              <SummaryCard label="Total Revenue"   value={totalRevenue}   color="#10B981" bg="#ECFDF5" icon={DollarSign} prefix={sym} />
              <SummaryCard label="Total Expenses"  value={totalExpenses}  color="#F97316" bg="#FFF7ED" icon={Package}    prefix={sym} />
              <SummaryCard label="Net Profit"      value={netProfit}
                color={netProfit >= 0 ? PRIMARY : "#EF4444"}
                bg={netProfit >= 0 ? "hsl(var(--primary) / 0.1)" : "#FEF2F2"}
                icon={netProfit >= 0 ? TrendingUp : TrendingDown} prefix={sym} />
              <SummaryCard label="Outstanding"     value={outstanding}    color="#F59E0B" bg="#FFFBEB" icon={Calendar}   prefix={sym} />
            </div>

            {/* ── Revenue Breakdown ── */}
            <div className="rounded-2xl border p-4 space-y-3"
              style={{ borderColor: "hsl(var(--border))", background: "hsl(var(--card))" }}>
              <h3 className="text-sm font-bold">Revenue Sources</h3>
              <BreakdownBar label="POS Sales"     value={posRevenue}    total={totalRevenue} color="#10B981" sym={sym} />
              <BreakdownBar label="Repair Income" value={repairRevenue} total={totalRevenue} color={PRIMARY}  sym={sym} />

              {/* Repair profit breakdown */}
              {repairRevenue > 0 && (
                <div className="mt-3 pt-3 border-t space-y-2" style={{ borderColor: "hsl(var(--border))" }}>
                  <p className="text-[10px] font-bold uppercase tracking-wide" style={{ color: "hsl(var(--muted-foreground))" }}>
                    Repair Breakdown
                  </p>
                  <div className="flex gap-2">
                    <div className="flex-1 rounded-xl p-2.5 text-center"
                      style={{ background: "hsl(var(--primary) / 0.08)" }}>
                      <p className="text-xs font-extrabold" style={{ color: PRIMARY }}>
                        {sym} {fmt(repairServiceProfit)}
                      </p>
                      <p className="text-[9px] mt-0.5" style={{ color: "hsl(var(--muted-foreground))" }}>Service Profit</p>
                    </div>
                    <div className="flex-1 rounded-xl p-2.5 text-center" style={{ background: "#FEF2F2" }}>
                      <p className="text-xs font-extrabold" style={{ color: "#EF4444" }}>
                        {sym} {fmt(repairPartsCost)}
                      </p>
                      <p className="text-[9px] mt-0.5" style={{ color: "hsl(var(--muted-foreground))" }}>Parts Invested</p>
                    </div>
                    <div className="flex-1 rounded-xl p-2.5 text-center" style={{ background: "#ECFDF5" }}>
                      <p className="text-xs font-extrabold" style={{ color: "#10B981" }}>
                        {sym} {fmt(repairRevenue)}
                      </p>
                      <p className="text-[9px] mt-0.5" style={{ color: "hsl(var(--muted-foreground))" }}>Total Billed</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* ── Profit / Loss Summary ── */}
            <div className="rounded-2xl border p-4 space-y-2.5"
              style={{ borderColor: "hsl(var(--border))", background: "hsl(var(--card))" }}>
              <h3 className="text-sm font-bold">Profit & Loss</h3>
              {[
                { label: "POS Revenue",      value: posRevenue,      sign: "+"  },
                { label: "POS Cost (COGS)",  value: posCost,         sign: "−"  },
                { label: "Repair Income",    value: repairRevenue,   sign: "+"  },
                { label: "Parts Invested",   value: repairPartsCost, sign: "−"  },
                { label: "Expenses",         value: totalExpenses,   sign: "−"  },
              ].map(({ label, value, sign }) => (
                <div key={label} className="flex items-center justify-between">
                  <span className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>{label}</span>
                  <span className="text-xs font-semibold"
                    style={{ color: sign === "+" ? "#10B981" : "#EF4444" }}>
                    {sign} {sym} {value.toLocaleString()}
                  </span>
                </div>
              ))}
              <div className="pt-2 border-t flex items-center justify-between"
                style={{ borderColor: "hsl(var(--border))" }}>
                <span className="text-sm font-bold">Net Profit</span>
                <span className="text-sm font-extrabold"
                  style={{ color: netProfit >= 0 ? PRIMARY : "#EF4444" }}>
                  {netProfit < 0 ? "−" : "+"} {sym} {Math.abs(netProfit).toLocaleString()}
                </span>
              </div>
            </div>

            {/* ── 7-day Revenue Chart ── */}
            {weeklyChart.length > 0 && range !== "today" && (
              <div className="rounded-2xl border p-4"
                style={{ borderColor: "hsl(var(--border))", background: "hsl(var(--card))" }}>
                <h3 className="text-sm font-bold mb-3">Daily Revenue (Last 7 Days)</h3>
                <div className="h-36">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={weeklyChart} barSize={22} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                      <XAxis dataKey="day" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 9 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 8 }} axisLine={false} tickLine={false} tickFormatter={v => fmt(v)} />
                      <Tooltip content={(p: any) => <ChartTooltip {...p} sym={sym} />} cursor={{ fill: "hsl(var(--muted))" }} />
                      <Bar dataKey="revenue" radius={[4, 4, 0, 0]}>
                        {weeklyChart.map((_: any, i: number) => (
                          <Cell key={i} fill={i === weeklyChart.length - 1 ? PRIMARY : "hsl(var(--primary) / 0.35)"} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* ── Expense by Category ── */}
            {Object.keys(expByCategory).length > 0 && (
              <div className="rounded-2xl border p-4 space-y-3"
                style={{ borderColor: "hsl(var(--border))", background: "hsl(var(--card))" }}>
                <h3 className="text-sm font-bold">Expenses by Category</h3>
                {Object.entries(expByCategory)
                  .sort(([, a], [, b]) => b - a)
                  .map(([cat, amt], i) => (
                    <div key={cat} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                          style={{ background: CAT_COLORS[i % CAT_COLORS.length] }} />
                        <span className="text-xs font-medium">{cat}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-1.5 rounded-full overflow-hidden" style={{ background: "hsl(var(--muted))" }}>
                          <div className="h-full rounded-full"
                            style={{ width: `${pct(amt, totalExpenses)}%`, background: CAT_COLORS[i % CAT_COLORS.length] }} />
                        </div>
                        <span className="text-xs font-semibold w-16 text-right">{sym} {(amt as number).toLocaleString()}</span>
                      </div>
                    </div>
                  ))}
              </div>
            )}

            {/* ── Quick navigation ── */}
            <div className="space-y-2">
              {[
                { label: "View Invoices",  href: "/invoices",  icon: ShoppingCart },
                { label: "View Expenses",  href: "/expenses",  icon: Package      },
                { label: "Repair Report",  href: "/reports",   icon: Wrench       },
              ].map(({ label, href, icon: Icon }) => (
                <Link key={href} href={href}>
                  <div className="flex items-center justify-between px-4 py-3 rounded-2xl border cursor-pointer"
                    style={{ borderColor: "hsl(var(--border))", background: "hsl(var(--card))" }}>
                    <div className="flex items-center gap-3">
                      <Icon className="w-4 h-4" style={{ color: PRIMARY }} />
                      <span className="text-sm font-semibold">{label}</span>
                    </div>
                    <ChevronRight className="w-4 h-4" style={{ color: "hsl(var(--muted-foreground))" }} />
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}
      </div>
    </ProtectedPage>
  );
}
