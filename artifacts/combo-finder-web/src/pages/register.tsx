import { useState, useEffect, useRef, type FormEvent } from "react";
import { Link, useLocation } from "wouter";
import { Eye, EyeOff, Search, Check, ChevronDown } from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { AuthNavbar, type Lang } from "@/components/auth-navbar";

// Country → currency mapping
const COUNTRY_CURRENCY: Record<string, string> = {
  "Afghanistan": "AFN", "Argentina": "ARS", "Australia": "AUD",
  "Bahrain": "BHD", "Bangladesh": "BDT", "Belgium": "EUR",
  "Brazil": "BRL", "Canada": "CAD", "China": "CNY",
  "Colombia": "COP", "Egypt": "EGP", "Ethiopia": "ETB",
  "France": "EUR", "Germany": "EUR", "Ghana": "GHS",
  "Greece": "EUR", "Hong Kong": "HKD", "India": "INR",
  "Indonesia": "IDR", "Iraq": "IQD", "Italy": "EUR",
  "Japan": "JPY", "Jordan": "JOD", "Kenya": "KES",
  "Kuwait": "KWD", "Malaysia": "MYR", "Mexico": "MXN",
  "Myanmar": "MMK", "Nepal": "NPR", "Netherlands": "EUR",
  "Nigeria": "NGN", "Oman": "OMR", "Pakistan": "PKR",
  "Philippines": "PHP", "Portugal": "EUR", "Qatar": "QAR",
  "Russia": "RUB", "Saudi Arabia": "SAR", "Singapore": "SGD",
  "South Africa": "ZAR", "South Korea": "KRW", "Spain": "EUR",
  "Sri Lanka": "LKR", "Taiwan": "TWD", "Tanzania": "TZS",
  "Thailand": "THB", "Turkey": "TRY", "UAE": "AED",
  "Uganda": "UGX", "UK": "GBP", "Ukraine": "UAH",
  "USA": "USD", "Vietnam": "VND", "Other": "USD",
};

// Timezone → country auto-detect
const TZ_COUNTRY: Record<string, string> = {
  "Asia/Dhaka": "Bangladesh", "Asia/Calcutta": "India", "Asia/Kolkata": "India",
  "Asia/Karachi": "Pakistan", "Asia/Kathmandu": "Nepal", "Asia/Katmandu": "Nepal",
  "Asia/Colombo": "Sri Lanka", "Asia/Rangoon": "Myanmar", "Asia/Yangon": "Myanmar",
  "Asia/Bangkok": "Thailand", "Asia/Jakarta": "Indonesia", "Asia/Makassar": "Indonesia",
  "Asia/Jayapura": "Indonesia", "Asia/Manila": "Philippines", "Asia/Ho_Chi_Minh": "Vietnam",
  "Asia/Saigon": "Vietnam", "Asia/Hanoi": "Vietnam", "Asia/Kuala_Lumpur": "Malaysia",
  "Asia/Singapore": "Singapore", "Asia/Shanghai": "China", "Asia/Hong_Kong": "Hong Kong",
  "Asia/Taipei": "Taiwan", "Asia/Tokyo": "Japan", "Asia/Seoul": "South Korea",
  "Asia/Riyadh": "Saudi Arabia", "Asia/Kuwait": "Kuwait", "Asia/Qatar": "Qatar",
  "Asia/Bahrain": "Bahrain", "Asia/Dubai": "UAE", "Asia/Muscat": "Oman",
  "Asia/Baghdad": "Iraq", "Asia/Amman": "Jordan", "Asia/Kabul": "Afghanistan",
  "Asia/Yekaterinburg": "Russia", "Asia/Novosibirsk": "Russia", "Asia/Krasnoyarsk": "Russia",
  "Asia/Irkutsk": "Russia", "Asia/Vladivostok": "Russia", "Europe/Moscow": "Russia",
  "Europe/Kyiv": "Ukraine", "Europe/Kiev": "Ukraine",
  "Europe/London": "UK", "Europe/Berlin": "Germany", "Europe/Paris": "France",
  "Europe/Rome": "Italy", "Europe/Madrid": "Spain", "Europe/Athens": "Greece",
  "Europe/Amsterdam": "Netherlands", "Europe/Brussels": "Belgium", "Europe/Lisbon": "Portugal",
  "Africa/Cairo": "Egypt", "Africa/Nairobi": "Kenya", "Africa/Lagos": "Nigeria",
  "Africa/Accra": "Ghana", "Africa/Johannesburg": "South Africa",
  "Africa/Addis_Ababa": "Ethiopia", "Africa/Dar_es_Salaam": "Tanzania",
  "Africa/Kampala": "Uganda",
  "America/New_York": "USA", "America/Chicago": "USA", "America/Denver": "USA",
  "America/Los_Angeles": "USA", "America/Phoenix": "USA", "America/Anchorage": "USA",
  "America/Toronto": "Canada", "America/Vancouver": "Canada", "America/Winnipeg": "Canada",
  "America/Sao_Paulo": "Brazil", "America/Mexico_City": "Mexico",
  "America/Argentina/Buenos_Aires": "Argentina", "America/Bogota": "Colombia",
  "Australia/Sydney": "Australia", "Australia/Melbourne": "Australia",
  "Australia/Brisbane": "Australia", "Australia/Perth": "Australia",
  "Pacific/Auckland": "Other",
};

function detectCountry(): string {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (TZ_COUNTRY[tz]) return TZ_COUNTRY[tz];
    // Try matching by region prefix (e.g. "Asia/Dhaka" → "Asia")
    const prefix = tz.split("/")[0];
    const match = Object.entries(TZ_COUNTRY).find(([k]) => k.startsWith(prefix));
    return match ? match[1] : "";
  } catch {
    return "";
  }
}

const COUNTRIES = Object.keys(COUNTRY_CURRENCY).sort();

// ── Searchable Country Picker ──────────────────────────────────────────────────
function CountryPicker({
  value, onChange, iStyle,
}: { value: string; onChange: (c: string) => void; iStyle: React.CSSProperties }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const ref = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close on outside click
  useEffect(() => {
    function h(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  // Auto-focus search when opening
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50);
    else setQuery("");
  }, [open]);

  const filtered = query.trim().length > 0
    ? COUNTRIES.filter(c => c.toLowerCase().includes(query.toLowerCase()))
    : COUNTRIES;

  const currency = value ? COUNTRY_CURRENCY[value] : null;

  return (
    <div ref={ref} className="relative">
      {/* Trigger button */}
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3 rounded-xl border text-sm outline-none text-left transition-colors"
        style={{
          ...iStyle,
          borderColor: open ? "hsl(var(--primary))" : "hsl(var(--border))",
        }}
      >
        {value ? (
          <span className="font-medium">
            {value}
            {currency && <span className="ml-1.5 text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>({currency})</span>}
          </span>
        ) : (
          <span style={{ color: "hsl(var(--muted-foreground))" }}>— Select your country —</span>
        )}
        <ChevronDown className="w-4 h-4 flex-shrink-0 ml-2" style={{ color: "hsl(var(--muted-foreground))", transform: open ? "rotate(180deg)" : "none", transition: "transform .15s" }} />
      </button>

      {/* Dropdown */}
      {open && (
        <div
          className="absolute left-0 right-0 top-full mt-1 rounded-xl border shadow-xl z-50 flex flex-col"
          style={{ background: "hsl(var(--card))", borderColor: "hsl(var(--border))", maxHeight: "52vh" }}
        >
          {/* Search input */}
          <div className="flex-shrink-0 flex items-center gap-2 px-3 py-2.5 border-b" style={{ borderColor: "hsl(var(--border))" }}>
            <Search className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "hsl(var(--muted-foreground))" }} />
            <input
              ref={inputRef}
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search country…"
              className="flex-1 text-sm outline-none bg-transparent"
              style={{ color: "hsl(var(--foreground))" }}
            />
            {query && (
              <button type="button" onClick={() => setQuery("")} className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>✕</button>
            )}
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto">
            {filtered.length === 0 ? (
              <p className="text-xs text-center py-4" style={{ color: "hsl(var(--muted-foreground))" }}>No country found</p>
            ) : (
              filtered.map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => { onChange(c); setOpen(false); }}
                  className="w-full flex items-center justify-between px-4 py-2.5 text-sm text-left hover:bg-muted/30 transition-colors"
                  style={value === c ? { background: "hsl(var(--primary) / 0.1)", color: "hsl(var(--primary))" } : {}}
                >
                  <span className="font-medium">{c}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold" style={{ color: "hsl(var(--muted-foreground))" }}>{COUNTRY_CURRENCY[c]}</span>
                    {value === c && <Check className="w-3.5 h-3.5" style={{ color: "hsl(var(--primary))" }} />}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── SVG Icons ──────────────────────────────────────────────────────────────────
function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
      <path d="M3.964 10.706A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.706V4.962H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.038l3.007-2.332z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.962L3.964 7.294C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
    </svg>
  );
}
function GitHubIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0 1 12 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/>
    </svg>
  );
}
function AppleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
    </svg>
  );
}

// ── Main Register page ─────────────────────────────────────────────────────────
export default function Register() {
  const { register, refreshUser } = useAuth();
  const [, navigate] = useLocation();
  const [lang, setLang] = useState<Lang>("en");
  const [form, setForm] = useState({
    email: "",
    password: "",
    country: "",
    shopName: "",
  });
  const [showPass, setShowPass] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState("");
  const [dupEmail, setDupEmail] = useState(false);
  const [loading, setLoading] = useState(false);

  const isRtl = lang === "ar";

  // Auto-detect country from timezone on mount
  useEffect(() => {
    const detected = detectCountry();
    if (detected) setForm(p => ({ ...p, country: detected }));
  }, []);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(p => ({ ...p, [k]: e.target.value }));
    if (k === "email") setDupEmail(false);
  };

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(""); setDupEmail(false);
    if (!form.email || !form.password) { setError("Email and password are required"); return; }
    if (form.password.length < 6) { setError("Password must be at least 6 characters"); return; }
    if (!form.country) { setError("Please select your country"); return; }
    if (!form.shopName.trim()) { setError("Shop name is required"); return; }
    if (!agreed) { setError("Please agree to the Terms and Privacy Policy"); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) { setError("Enter a valid email address"); return; }
    setLoading(true);
    try {
      const name = form.email.split("@")[0];
      await register({ name, email: form.email, password: form.password });
      const currency = COUNTRY_CURRENCY[form.country] ?? "USD";
      const settingsRes = await fetch("/api/auth/settings", {
        method: "PUT", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shopName: form.shopName.trim(), currency }),
      });
      if (!settingsRes.ok) {
        console.warn("Could not save shop settings after registration; user can update in Settings.");
      }
      await refreshUser();
      navigate("/");
    } catch (err: any) {
      const msg: string = err.message ?? "Registration failed";
      if (msg.toLowerCase().includes("already") || msg.toLowerCase().includes("duplicate")) {
        setDupEmail(true);
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  }

  const inputCls = "w-full px-4 py-3 rounded-xl border text-sm outline-none transition-colors";
  const iStyle = { borderColor: "hsl(var(--border))", background: "hsl(var(--card))", color: "hsl(var(--foreground))" };
  const focIn = (e: React.FocusEvent<HTMLInputElement>) => { e.currentTarget.style.borderColor = "hsl(var(--primary))"; };
  const focOut = (e: React.FocusEvent<HTMLInputElement>) => { e.currentTarget.style.borderColor = "hsl(var(--border))"; };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "hsl(var(--background))", direction: isRtl ? "rtl" : "ltr" }}>
      <AuthNavbar lang={lang} onLangChange={setLang} supportLabel="Support" />

      <div className="flex-1 flex items-start md:items-center justify-center px-5 py-3 overflow-y-auto">
        <div className="w-full max-w-sm">
          <div className="mb-3">
            <h1 className="text-xl font-extrabold">Create Account</h1>
            <p className="text-sm mt-0.5" style={{ color: "hsl(var(--muted-foreground))" }}>Set up your ComboFinder shop</p>
          </div>

          {/* Social buttons */}
          <div className="grid grid-cols-3 gap-2 mb-2">
            {[
              { icon: <GoogleIcon />, label: "Google", href: "/api/auth/google" },
              { icon: <AppleIcon />, label: "Apple", href: "/api/auth/apple" },
              { icon: <GitHubIcon />, label: "GitHub", href: "/api/auth/github" },
            ].map(({ icon, label, href }) => (
              <a key={label} href={href}
                className="flex flex-col items-center justify-center gap-1 py-2 rounded-xl border text-xs font-semibold transition-colors"
                style={{ borderColor: "hsl(var(--border))", background: "hsl(var(--card))", color: "hsl(var(--foreground))" }}
                onMouseEnter={e => { e.currentTarget.style.background = "hsl(var(--muted))"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "hsl(var(--card))"; }}>
                {icon}<span>{label}</span>
              </a>
            ))}
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3 mb-2">
            <div className="flex-1 h-px" style={{ background: "hsl(var(--border))" }} />
            <span className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>or sign up with email</span>
            <div className="flex-1 h-px" style={{ background: "hsl(var(--border))" }} />
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-2.5">
            {/* Email */}
            <div>
              <label className="text-sm font-semibold block mb-1">
                Email <span style={{ color: "hsl(var(--destructive))" }}>*</span>
              </label>
              <input type="email" placeholder="Enter your email" value={form.email} onChange={set("email")}
                className={inputCls} dir="ltr"
                style={{ ...iStyle, borderColor: dupEmail ? "hsl(var(--destructive))" : "hsl(var(--border))" }}
                onFocus={e => { e.currentTarget.style.borderColor = dupEmail ? "hsl(var(--destructive))" : "hsl(var(--primary))"; }}
                onBlur={e => { e.currentTarget.style.borderColor = dupEmail ? "hsl(var(--destructive))" : "hsl(var(--border))"; }}
              />
              {dupEmail && (
                <div className="mt-1.5 px-3 py-2 rounded-xl text-sm"
                  style={{ background: "hsl(var(--destructive) / 0.08)", color: "hsl(var(--destructive))" }}>
                  This email is already registered.{" "}
                  <Link href="/login">
                    <span className="font-bold underline cursor-pointer">Sign in instead →</span>
                  </Link>
                </div>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="text-sm font-semibold block mb-1">
                Password <span style={{ color: "hsl(var(--destructive))" }}>*</span>
              </label>
              <div className="relative">
                <input type={showPass ? "text" : "password"} placeholder="Create a strong password (min 6 chars)"
                  value={form.password} onChange={set("password")}
                  className={`${inputCls} pr-12`} style={iStyle}
                  onFocus={focIn} onBlur={focOut} dir="ltr" />
                <button type="button" onClick={() => setShowPass(p => !p)}
                  className="absolute right-4 top-1/2 -translate-y-1/2" style={{ color: "hsl(var(--muted-foreground))" }}>
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Country — searchable picker with auto-detect */}
            <div>
              <label className="text-sm font-semibold block mb-1">
                Country <span style={{ color: "hsl(var(--destructive))" }}>*</span>
                {form.country && (
                  <span className="ml-2 text-xs font-normal" style={{ color: "hsl(var(--muted-foreground))" }}>
                    🌍 auto-detected
                  </span>
                )}
              </label>
              <CountryPicker
                value={form.country}
                onChange={c => setForm(p => ({ ...p, country: c }))}
                iStyle={iStyle}
              />
            </div>

            {/* Shop Name */}
            <div>
              <label className="text-sm font-semibold block mb-1">
                Business Name <span style={{ color: "hsl(var(--destructive))" }}>*</span>
              </label>
              <input type="text" placeholder="e.g. Ariyan Mobile Center" value={form.shopName}
                onChange={set("shopName")} className={inputCls} style={iStyle}
                onFocus={focIn} onBlur={focOut} />
            </div>

            {/* Terms */}
            <label className="flex items-start gap-2.5 cursor-pointer">
              <input type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)}
                className="mt-0.5 shrink-0" style={{ accentColor: "hsl(var(--primary))" }} />
              <span className="text-sm" style={{ color: "hsl(var(--muted-foreground))" }}>
                I agree to the{" "}
                <span className="font-semibold" style={{ color: "hsl(var(--primary))" }}>Terms</span>
                {" "}&amp;{" "}
                <span className="font-semibold" style={{ color: "hsl(var(--primary))" }}>Privacy Policy</span>
              </span>
            </label>

            {error && (
              <p className="text-sm text-center px-3 py-2 rounded-xl font-medium"
                style={{ color: "hsl(var(--destructive))", background: "hsl(var(--destructive) / 0.08)" }}>
                {error}
              </p>
            )}

            <button type="submit" disabled={loading}
              className="w-full py-3.5 rounded-xl font-bold text-white text-sm transition-opacity disabled:opacity-60"
              style={{ background: "hsl(var(--primary))" }}>
              {loading ? "Creating account…" : "Create Account"}
            </button>
          </form>

          <p className="text-sm text-center mt-3" style={{ color: "hsl(var(--muted-foreground))" }}>
            Already have an account?{" "}
            <Link href="/login">
              <span className="font-bold cursor-pointer" style={{ color: "hsl(var(--primary))" }}>Sign in</span>
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
