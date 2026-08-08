import { useQuery } from "@tanstack/react-query";
import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import {
  Users, Package, Bell,
  ShoppingCart, Wallet, Receipt, Battery,
  Cpu, CreditCard, LayoutDashboard, MessageCircle, Zap, Megaphone, X,
  TrendingUp, TrendingDown, BarChart2, AlertCircle,
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell } from "recharts";
import { Link } from "wouter";
import { useAuth } from "@/context/auth-context";
import { ProtectedPage } from "@/components/protected-page";
import { computeSalesSummary } from "@/lib/sales-summary-local";

const ADMIN_PANEL_URL  = "/admin/";
const WHATSAPP_URL     = "https://wa.me/96897043234?text=Hi%21+I+need+support.+I%27m+contacting+you+from+the+ComboFinder+app.";

const CURRENCY_SYMBOLS: Record<string, string> = {
  USD:"$", EUR:"€", GBP:"£", JPY:"¥", CNY:"¥", AUD:"A$", CAD:"C$", CHF:"Fr",
  HKD:"HK$", SGD:"S$", KRW:"₩", TWD:"NT$", BDT:"Tk", INR:"₹", PKR:"₨",
  NPR:"रू", LKR:"Rs", MVR:"Rf", BTN:"Nu", MYR:"RM", THB:"฿", IDR:"Rp",
  PHP:"₱", VND:"₫", MMK:"K", KHR:"៛", LAK:"₭", BND:"B$", MOP:"P",
  AED:"د.إ", SAR:"﷼", QAR:"﷼", KWD:"KD", BHD:"BD", OMR:"﷼",
  TRY:"₺", RUB:"₽", NGN:"₦", ZAR:"R", EGP:"E£", GHS:"₵",
  KES:"KSh", UGX:"USh", TZS:"TSh", ETB:"Br",
};

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good Morning";
  if (h < 18) return "Good Afternoon";
  return "Good Evening";
}

function fmt(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000)     return (n / 1_000).toFixed(1)     + "K";
  return n.toFixed(0);
}

function pctChange(today: number, yesterday: number): number | null {
  if (yesterday === 0) return today > 0 ? 100 : null;
  return Math.round(((today - yesterday) / yesterday) * 100);
}

// Mobile LCD icon
function MobileLcdIcon({ className, style }: { className?: string; style?: Record<string, string | number> }) {
  return (
    <svg className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="5" y="2" width="14" height="20" rx="2"/>
      <rect x="7" y="4" width="10" height="13" rx="1"/>
      <circle cx="12" cy="19.5" r="0.7" fill="currentColor" stroke="none"/>
    </svg>
  );
}

// ── Quick Actions ─────────────────────────────────────────────────────────────
const QUICK_LINKS = [
  { label: "Customers",    icon: Users,        href: "/customers",     color: "#8B5CF6", bg: "#F5F3FF" },
  { label: "POS",          icon: ShoppingCart, href: "/pos",           color: "#10B981", bg: "#ECFDF5" },
  { label: "Sales Report", icon: BarChart2,    href: "/sales-report",  color: "#0EA5E9", bg: "#F0FDFF" },
  { label: "Invoices",     icon: Receipt,      href: "/invoices",      color: "#6366F1", bg: "#EEF2FF" },
  { label: "Expenses",     icon: Wallet,       href: "/expenses",      color: "#F97316", bg: "#FFF7ED" },
  { label: "Ledger",       icon: CreditCard,   href: "/ledger",        color: "#8B5CF6", bg: "#F5F3FF" },
];

// ── ComboFinder Tools ─────────────────────────────────────────────────────────
const CF_TOOLS = [
  { label: "Display\nCompatibility", iconType: "display" as const, href: "/compatibility?category=display", color: "#6248FF", bg: "#EEF2FF", desc: "Screen swap guide" },
  { label: "Battery\nCompatibility", iconType: "battery" as const, href: "/compatibility?category=battery", color: "#10B981", bg: "#ECFDF5", desc: "Safe replacements" },
  { label: "ISP & Pinout",           iconType: "cpu"     as const, href: "/isp-pinout",                    color: "#F59E0B", bg: "#FFF7E6", desc: "Model-wise diagrams", badge: "NEW" },
];

function CfToolIcon({ type, color, size = 24 }: { type: "display" | "battery" | "cpu"; color: string; size?: number }) {
  if (type === "display") return <MobileLcdIcon style={{ width: size, height: size, color }} />;
  if (type === "battery") return <Battery style={{ width: size, height: size, color }} />;
  return <Cpu style={{ width: size, height: size, color }} />;
}


export default function Dashboard() {
  const { user } = useAuth();
  const [showNotif, setShowNotif] = useState(false);
  const bellRef  = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const isFreePlan = user?.plan === "Free" || !user?.plan;

  useEffect(() => {
    if (!showNotif) return;
    function handleClick(e: MouseEvent) {
      if (
        bellRef.current  && !bellRef.current.contains(e.target  as Node) &&
        panelRef.current && !panelRef.current.contains(e.target as Node)
      ) setShowNotif(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [showNotif]);

  // ── Announcements ──────────────────────────────────────────────────────────
  const { data: allAnnouncements = [] } = useQuery<any[]>({
    queryKey: ["announcements"],
    queryFn:  () => fetch(`/api/announcements`, { credentials: "include" }).then(r => r.json()),
    refetchInterval: 60_000,
  });
  const announcements = allAnnouncements.filter((a: any) => {
    if (!a.isPublished) return false;
    if (a.expiresAt && new Date(a.expiresAt) < new Date()) return false;
    return true;
  });

  // ── Low-stock alert (Pro only) ─────────────────────────────────────────────
  const { data: stats } = useQuery<{ lowStock?: number }>({
    queryKey: ["stats"],
    queryFn:  () => fetch(`/api/stats`, { credentials: "include" }).then(r => r.json()),
    enabled:  !isFreePlan,
  });

  // ── Sales Summary — Pro: API, Free: localStorage ───────────────────────────
  const localSummary = useMemo(() => {
    if (!isFreePlan || !user?.id) return null;
    return computeSalesSummary(user.id, "month");
  }, [isFreePlan, user?.id]);

  const { data: apiSummary } = useQuery<any>({
    queryKey: ["sales-summary", "month"],
    queryFn:  () => fetch(`/api/sales-summary?range=month&tz=${encodeURIComponent(Intl.DateTimeFormat().resolvedOptions().timeZone)}`, { credentials: "include" }).then(r => r.json()),
    enabled:  !isFreePlan,
  });

  const summary = isFreePlan ? localSummary : apiSummary;

  const todayRevenue     = summary?.todayRevenue     ?? 0;
  const yesterdayRevenue = summary?.yesterdayRevenue ?? 0;
  const totalRevenue     = summary?.totalRevenue     ?? 0;
  const totalExpenses    = summary?.totalExpenses    ?? 0;
  const netProfit        = summary?.netProfit        ?? 0;
  const outstanding      = summary?.outstanding      ?? 0;
  const weeklyChart      = summary?.weeklyChart      ?? [];
  const pct              = pctChange(todayRevenue, yesterdayRevenue);

  // ── Hero/KPI slider ───────────────────────────────────────────────────────
  const sliderRef    = useRef<HTMLDivElement>(null);
  const [activeSlide, setActiveSlide] = useState(0);
  const [selectedDayIdx, setSelectedDayIdx] = useState<number | null>(null);
  const handleSliderScroll = useCallback(() => {
    if (!sliderRef.current) return;
    const { scrollLeft, clientWidth } = sliderRef.current;
    if (clientWidth > 0) setActiveSlide(Math.round(scrollLeft / clientWidth));
  }, []);

  const PRIMARY = "hsl(var(--primary))";
  const sym = CURRENCY_SYMBOLS[user?.currency ?? "USD"] ?? user?.currency ?? "$";

  const KPI_CARDS = [
    { label: "Revenue",     value: totalRevenue,  color: "#10B981", bg: "#ECFDF5", prefix: sym },
    { label: "Expenses",    value: totalExpenses, color: "#F97316", bg: "#FFF7ED", prefix: sym },
    { label: "Net Profit",  value: netProfit,     color: netProfit >= 0 ? PRIMARY : "#EF4444", bg: netProfit >= 0 ? "hsl(var(--primary) / 0.1)" : "#FEF2F2", prefix: sym },
    { label: "Outstanding", value: outstanding,   color: "#F59E0B", bg: "#FFFBEB", prefix: sym },
  ];

  return (
    <ProtectedPage>
      <div className="space-y-5 pb-6">

        {/* ── Header ── */}
        <div className="flex items-center justify-between pt-1">
          <div>
            <p className="text-[11px] font-medium" style={{ color: "hsl(var(--muted-foreground))" }}>
              {greeting()},
            </p>
            <h1 className="text-lg font-extrabold leading-tight mt-0.5 flex items-center gap-2">
              {user?.name ?? "Technician"}
              <span className="w-2 h-2 rounded-full bg-emerald-400 ring-2 ring-emerald-400/30 inline-block" />
            </h1>
          </div>
          <div className="flex items-center gap-2">
            {(user?.role?.toLowerCase() === "admin" || user?.role?.toLowerCase() === "superadmin") ? (
              <a href={ADMIN_PANEL_URL}
                className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg text-white shadow-sm"
                style={{ background: PRIMARY }}>
                <LayoutDashboard className="w-3.5 h-3.5" /> Dashboard
              </a>
            ) : (
              <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg text-white shadow-sm"
                style={{ background: PRIMARY }}>
                <MessageCircle className="w-3.5 h-3.5" /> Support
              </a>
            )}
            <div className="relative">
              <button ref={bellRef} onClick={() => setShowNotif(v => !v)}
                className="w-9 h-9 rounded-full border flex items-center justify-center"
                style={{ borderColor: "hsl(var(--border))", background: "hsl(var(--card))" }}>
                <Bell className="w-4 h-4" style={{ color: announcements.length > 0 ? PRIMARY : "hsl(var(--muted-foreground))" }} />
                {announcements.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center">
                    {announcements.length > 9 ? "9+" : announcements.length}
                  </span>
                )}
              </button>
              {showNotif && (
                <div ref={panelRef}
                  className="absolute right-0 top-full mt-2 z-50 rounded-2xl border shadow-xl overflow-hidden"
                  style={{ width: 300, borderColor: "hsl(var(--border))", background: "hsl(var(--card))" }}>
                  <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: "hsl(var(--border))" }}>
                    <div className="flex items-center gap-2">
                      <Megaphone className="w-4 h-4" style={{ color: PRIMARY }} />
                      <span className="text-sm font-bold">Announcements</span>
                    </div>
                    <button onClick={() => setShowNotif(false)}>
                      <X className="w-4 h-4" style={{ color: "hsl(var(--muted-foreground))" }} />
                    </button>
                  </div>
                  <div className="max-h-72 overflow-y-auto divide-y" style={{ divideColor: "hsl(var(--border))" }}>
                    {announcements.length === 0 ? (
                      <div className="px-4 py-6 text-center text-sm" style={{ color: "hsl(var(--muted-foreground))" }}>
                        No announcements
                      </div>
                    ) : announcements.map((a: any) => (
                      <div key={a.id} className="px-4 py-3 space-y-0.5">
                        <div className="flex items-start gap-2">
                          <span className="mt-0.5 text-[9px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0"
                            style={{
                              background: a.priority === "High" ? "#FEE2E2" : a.priority === "Low" ? "#F0FDF4" : "#EEF2FF",
                              color:      a.priority === "High" ? "#DC2626" : a.priority === "Low" ? "#16A34A" : PRIMARY,
                            }}>
                            {a.priority ?? "Normal"}
                          </span>
                          <p className="text-xs font-semibold leading-snug">{a.title}</p>
                        </div>
                        {a.content && (
                          <p className="text-[11px] leading-relaxed" style={{ color: "hsl(var(--muted-foreground))" }}>
                            {a.content}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Hero + KPI Slider ── */}
        <div>
          {/* Scrollable track — hide native scrollbar via CSS */}
          <div
            ref={sliderRef}
            onScroll={handleSliderScroll}
            style={{
              display: "flex",
              overflowX: "scroll",
              scrollSnapType: "x mandatory",
              scrollbarWidth: "none",
              gap: 0,
            }}
            className="hide-scrollbar"
          >
            {/* Slide 1 — Revenue Hero */}
            <div style={{ flex: "0 0 100%", scrollSnapAlign: "start" }}>
              <div className="rounded-2xl p-4 space-y-3"
                style={{ background: "linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(262 80% 55%) 100%)", minHeight: 210 }}>
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-[11px] font-semibold text-white/70">Today's Revenue</p>
                    <div className="flex items-baseline gap-1 mt-0.5" style={{ direction: "ltr" }}>
                      <span className="text-xl font-extrabold text-white flex-shrink-0">{sym}</span>
                      <span className="text-3xl font-extrabold text-white leading-tight">{todayRevenue.toLocaleString()}</span>
                    </div>
                    {pct !== null && (
                      <div className="flex items-center gap-1 mt-1">
                        {pct >= 0
                          ? <TrendingUp className="w-3 h-3 text-emerald-300" />
                          : <TrendingDown className="w-3 h-3 text-red-300" />}
                        <span className={`text-[11px] font-bold ${pct >= 0 ? "text-emerald-300" : "text-red-300"}`}>
                          {pct >= 0 ? "+" : ""}{pct}% vs yesterday
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-white/60">This Month</p>
                    <div className="flex items-baseline gap-0.5 justify-end" style={{ direction: "ltr" }}><span className="text-sm font-extrabold text-white flex-shrink-0">{sym}</span><span className="text-lg font-extrabold text-white">{fmt(totalRevenue)}</span></div>
                  </div>
                </div>
                {weeklyChart.length > 0 && (
                  <div className="mt-1">
                    {/* Selected day revenue pill */}
                    {selectedDayIdx !== null && weeklyChart[selectedDayIdx] && (
                      <div className="flex items-center justify-center mb-1">
                        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full"
                          style={{ background: "rgba(255,255,255,0.22)" }}>
                          <span className="text-[10px] font-semibold text-white/80">
                            {weeklyChart[selectedDayIdx].date}
                          </span>
                          <span className="text-[10px] font-extrabold text-white">
                            {sym} {fmt(weeklyChart[selectedDayIdx].revenue)}
                          </span>
                        </div>
                      </div>
                    )}
                    <div style={{ height: 76 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={weeklyChart} barSize={12} margin={{ top: 0, right: 0, left: 0, bottom: 32 }}>
                          <XAxis
                            dataKey="day"
                            axisLine={false}
                            tickLine={false}
                            tick={(props: any) => {
                              const { x, y, payload, index } = props;
                              const sel = index === selectedDayIdx;
                              return (
                                <g transform={`translate(${x},${y})`} style={{ cursor: "pointer" }}
                                  onClick={() => setSelectedDayIdx((p: number | null) => p === index ? null : index)}>
                                  <rect x={-18} y={4} width={36} height={24} fill="transparent" />
                                  <text x={0} y={26} textAnchor="middle"
                                    fill={sel ? "#fff" : "rgba(255,255,255,0.65)"}
                                    fontSize={9} fontWeight={sel ? "bold" : "normal"}>
                                    {payload.value}
                                  </text>
                                </g>
                              );
                            }}
                          />
                          <Bar dataKey="revenue" radius={[3, 3, 0, 0]} cursor="pointer" onClick={(_: any, index: number) => setSelectedDayIdx((prev: number | null) => prev === index ? null : index)}>
                            {weeklyChart.map((_: any, i: number) => (
                              <Cell key={i} fill={i === selectedDayIdx ? "#ffffff" : i === weeklyChart.length - 1 ? "rgba(255,255,255,0.8)" : "rgba(255,255,255,0.35)"} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Slide 2 — KPI Cards (gradient, matches Slide 1) */}
            <div style={{ flex: "0 0 100%", scrollSnapAlign: "start" }}>
              <div className="rounded-2xl p-4 space-y-3"
                style={{ background: "linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(262 80% 55%) 100%)", minHeight: 210 }}>
                <div className="flex items-center justify-between">
                  <p className="text-[11px] font-semibold text-white/70">This Month Summary</p>
                  <p className="text-[10px] text-white/50">{new Date().toLocaleString("default", { month: "long", year: "numeric" })}</p>
                </div>
                <div className="grid grid-cols-2 gap-2.5">
                  {KPI_CARDS.map(({ label, value, color, prefix }) => (
                    <div key={label}
                      className="flex flex-col gap-1 p-3 rounded-xl"
                      style={{ background: "rgba(255,255,255,0.15)" }}>
                      <p className="text-[10px] font-semibold text-white/70 leading-tight">{label}</p>
                      <div className="flex items-baseline gap-1" style={{ direction: "ltr" }}>
                        <span className="text-sm font-extrabold text-white flex-shrink-0">{prefix}</span>
                        <span className="text-xl font-extrabold text-white leading-none">{fmt(Math.abs(value))}</span>
                      </div>
                      {value < 0 && (
                        <span className="text-[9px] font-bold text-red-300">↓ Loss</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Pagination dots */}
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 6, marginTop: 10 }}>
            {[0, 1].map(i => (
              <button
                key={i}
                onClick={() => sliderRef.current?.scrollTo({ left: i * (sliderRef.current?.clientWidth ?? 0), behavior: "smooth" })}
                style={{
                  width: i === activeSlide ? 18 : 6,
                  height: 6,
                  borderRadius: 3,
                  background: i === activeSlide ? PRIMARY : "hsl(var(--muted-foreground) / 0.3)",
                  border: "none",
                  padding: 0,
                  cursor: "pointer",
                  transition: "all 0.25s ease",
                }}
              />
            ))}
          </div>
        </div>

        {/* ── Low stock alert (Pro only) ── */}
        {(stats?.lowStock ?? 0) > 0 && (
          <Link href="/inventory?filter=low">
            <div className="flex items-center gap-3 px-4 py-3 rounded-2xl cursor-pointer"
              style={{ background: "hsl(0 84% 60% / 0.08)", border: "1px solid hsl(0 84% 60% / 0.2)" }}>
              <Package className="w-4 h-4 flex-shrink-0" style={{ color: "hsl(var(--destructive))" }} />
              <p className="text-xs font-semibold flex-1" style={{ color: "hsl(var(--destructive))" }}>
                {stats?.lowStock} item{(stats?.lowStock ?? 0) > 1 ? "s" : ""} running low on stock
              </p>
              <AlertCircle className="w-4 h-4 flex-shrink-0" style={{ color: "hsl(var(--destructive))" }} />
            </div>
          </Link>
        )}

        {/* ── ComboFinder Tools — mobile-repair users only ── */}
        {user?.businessType !== "general_store" && <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-sm">ComboFinder Tools</h2>
            <Link href="/compatibility">
              <span className="text-xs font-semibold" style={{ color: PRIMARY }}>See all →</span>
            </Link>
          </div>
          <div className="grid grid-cols-3 gap-2.5">
            {CF_TOOLS.map(({ label, iconType, href, color, bg, desc, badge }) => (
              <Link key={href + label} href={href}>
                <div className="relative flex flex-col items-center gap-2 p-3 rounded-2xl border cursor-pointer"
                  style={{ borderColor: "hsl(var(--border))", background: "hsl(var(--card))" }}>
                  {badge && (
                    <span className="absolute -top-1.5 -right-1.5 text-[9px] font-extrabold px-1.5 py-0.5 rounded-full text-white"
                      style={{ background: "#EF4444" }}>{badge}</span>
                  )}
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: bg }}>
                    <CfToolIcon type={iconType} color={color} size={24} />
                  </div>
                  <div className="text-center">
                    <p className="text-[11px] font-bold leading-tight whitespace-pre-line">{label}</p>
                    <p className="text-[9px] mt-0.5 leading-tight" style={{ color: "hsl(var(--muted-foreground))" }}>{desc}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>}

        {/* ── Quick Actions ── */}
        <div>
          <h2 className="font-bold text-sm mb-3">Quick Actions</h2>
          <div className="grid grid-cols-3 gap-2.5">
            {QUICK_LINKS.map(({ label, icon: Icon, href, color, bg }) => (
              <Link key={href + label} href={href}>
                <button className="w-full flex flex-col items-center gap-2 p-3.5 rounded-2xl border border-border bg-card">
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: bg }}>
                    <Icon className="w-5 h-5" style={{ color }} />
                  </div>
                  <span className="text-[11px] font-semibold text-center leading-tight"
                    style={{ color: "hsl(var(--foreground))" }}>{label}</span>
                </button>
              </Link>
            ))}
          </div>
        </div>

        {/* ── Upgrade banner — Free plan only ── */}
        {isFreePlan && (
          <Link href="/subscription">
            <div className="relative overflow-hidden rounded-2xl p-4 cursor-pointer"
              style={{ background: "linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(262 80% 55%) 100%)" }}>
              <div className="absolute -top-4 -right-4 w-24 h-24 rounded-full opacity-20" style={{ background: "#fff" }} />
              <div className="flex items-center justify-between relative z-10">
                <div>
                  <div className="flex items-center gap-1.5 mb-1">
                    <Zap className="w-3.5 h-3.5 text-yellow-300" fill="currentColor" />
                    <span className="text-xs font-extrabold text-white">Upgrade to Pro</span>
                  </div>
                  <p className="text-[11px] text-white/80 leading-snug">
                    Only $1/month · Unlimited repairs &amp; inventory
                  </p>
                </div>
                <div className="flex-shrink-0 bg-white/20 rounded-xl px-3 py-1.5">
                  <span className="text-xs font-extrabold text-white">Get Pro →</span>
                </div>
              </div>
            </div>
          </Link>
        )}

      </div>
    </ProtectedPage>
  );
}
