import { useState, useRef, useEffect, type FormEvent } from "react";
import { Store, User, Lock, Bell, ChevronRight, Check, X, Globe, Eye, EyeOff, Search } from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { ProtectedPage } from "@/components/protected-page";

const CURRENCIES = [
  // Major / Most-used
  { code: "USD", symbol: "$",    name: "US Dollar" },
  { code: "EUR", symbol: "€",    name: "Euro" },
  { code: "GBP", symbol: "£",    name: "British Pound" },
  { code: "JPY", symbol: "¥",    name: "Japanese Yen" },
  { code: "CNY", symbol: "¥",    name: "Chinese Yuan" },
  { code: "AUD", symbol: "A$",   name: "Australian Dollar" },
  { code: "CAD", symbol: "C$",   name: "Canadian Dollar" },
  { code: "CHF", symbol: "Fr",   name: "Swiss Franc" },
  { code: "HKD", symbol: "HK$",  name: "Hong Kong Dollar" },
  { code: "SGD", symbol: "S$",   name: "Singapore Dollar" },
  { code: "KRW", symbol: "₩",   name: "South Korean Won" },
  { code: "TWD", symbol: "NT$",  name: "New Taiwan Dollar" },
  // South Asia
  { code: "BDT", symbol: "৳",   name: "Bangladeshi Taka" },
  { code: "INR", symbol: "₹",   name: "Indian Rupee" },
  { code: "PKR", symbol: "₨",   name: "Pakistani Rupee" },
  { code: "NPR", symbol: "रू",   name: "Nepalese Rupee" },
  { code: "LKR", symbol: "Rs",   name: "Sri Lankan Rupee" },
  { code: "MVR", symbol: "Rf",   name: "Maldivian Rufiyaa" },
  { code: "BTN", symbol: "Nu",   name: "Bhutanese Ngultrum" },
  // Southeast Asia
  { code: "MYR", symbol: "RM",   name: "Malaysian Ringgit" },
  { code: "THB", symbol: "฿",   name: "Thai Baht" },
  { code: "IDR", symbol: "Rp",   name: "Indonesian Rupiah" },
  { code: "PHP", symbol: "₱",   name: "Philippine Peso" },
  { code: "VND", symbol: "₫",   name: "Vietnamese Dong" },
  { code: "MMK", symbol: "K",    name: "Myanmar Kyat" },
  { code: "KHR", symbol: "៛",   name: "Cambodian Riel" },
  { code: "LAK", symbol: "₭",   name: "Lao Kip" },
  { code: "BND", symbol: "B$",   name: "Brunei Dollar" },
  { code: "MOP", symbol: "P",    name: "Macanese Pataca" },
  // Middle East
  { code: "AED", symbol: "د.إ", name: "UAE Dirham" },
  { code: "SAR", symbol: "﷼",   name: "Saudi Riyal" },
  { code: "QAR", symbol: "﷼",   name: "Qatari Riyal" },
  { code: "KWD", symbol: "د.ك", name: "Kuwaiti Dinar" },
  { code: "BHD", symbol: "BD",   name: "Bahraini Dinar" },
  { code: "OMR", symbol: "ر.ع.", name: "Omani Rial" },
  { code: "JOD", symbol: "JD",   name: "Jordanian Dinar" },
  { code: "IQD", symbol: "ع.د", name: "Iraqi Dinar" },
  { code: "YER", symbol: "﷼",   name: "Yemeni Rial" },
  { code: "ILS", symbol: "₪",   name: "Israeli Shekel" },
  { code: "LBP", symbol: "ل.ل", name: "Lebanese Pound" },
  { code: "IRR", symbol: "﷼",   name: "Iranian Rial" },
  { code: "SYP", symbol: "£",    name: "Syrian Pound" },
  { code: "AFN", symbol: "؋",   name: "Afghan Afghani" },
  // Europe
  { code: "SEK", symbol: "kr",   name: "Swedish Krona" },
  { code: "NOK", symbol: "kr",   name: "Norwegian Krone" },
  { code: "DKK", symbol: "kr",   name: "Danish Krone" },
  { code: "PLN", symbol: "zł",   name: "Polish Zloty" },
  { code: "CZK", symbol: "Kč",   name: "Czech Koruna" },
  { code: "HUF", symbol: "Ft",   name: "Hungarian Forint" },
  { code: "RON", symbol: "lei",  name: "Romanian Leu" },
  { code: "BGN", symbol: "лв",   name: "Bulgarian Lev" },
  { code: "HRK", symbol: "kn",   name: "Croatian Kuna" },
  { code: "RSD", symbol: "din",  name: "Serbian Dinar" },
  { code: "UAH", symbol: "₴",   name: "Ukrainian Hryvnia" },
  { code: "RUB", symbol: "₽",   name: "Russian Ruble" },
  { code: "TRY", symbol: "₺",   name: "Turkish Lira" },
  { code: "ISK", symbol: "kr",   name: "Icelandic Krona" },
  { code: "GEL", symbol: "₾",   name: "Georgian Lari" },
  { code: "AZN", symbol: "₼",   name: "Azerbaijani Manat" },
  { code: "AMD", symbol: "֏",   name: "Armenian Dram" },
  // Central Asia
  { code: "KZT", symbol: "₸",   name: "Kazakhstani Tenge" },
  { code: "UZS", symbol: "so'm", name: "Uzbekistani Som" },
  { code: "TJS", symbol: "SM",   name: "Tajikistani Somoni" },
  { code: "KGS", symbol: "лв",   name: "Kyrgyzstani Som" },
  { code: "TMT", symbol: "T",    name: "Turkmenistani Manat" },
  { code: "MNT", symbol: "₮",   name: "Mongolian Tugrik" },
  // Africa
  { code: "ZAR", symbol: "R",    name: "South African Rand" },
  { code: "NGN", symbol: "₦",   name: "Nigerian Naira" },
  { code: "KES", symbol: "KSh",  name: "Kenyan Shilling" },
  { code: "GHS", symbol: "₵",   name: "Ghanaian Cedi" },
  { code: "EGP", symbol: "£",    name: "Egyptian Pound" },
  { code: "MAD", symbol: "د.م.", name: "Moroccan Dirham" },
  { code: "DZD", symbol: "دج",   name: "Algerian Dinar" },
  { code: "TND", symbol: "د.ت", name: "Tunisian Dinar" },
  { code: "ETB", symbol: "Br",   name: "Ethiopian Birr" },
  { code: "TZS", symbol: "TSh",  name: "Tanzanian Shilling" },
  { code: "UGX", symbol: "USh",  name: "Ugandan Shilling" },
  { code: "ZMW", symbol: "ZK",   name: "Zambian Kwacha" },
  { code: "MWK", symbol: "MK",   name: "Malawian Kwacha" },
  { code: "MZN", symbol: "MT",   name: "Mozambican Metical" },
  { code: "BWP", symbol: "P",    name: "Botswana Pula" },
  { code: "NAD", symbol: "N$",   name: "Namibian Dollar" },
  { code: "ZWL", symbol: "Z$",   name: "Zimbabwean Dollar" },
  { code: "MGA", symbol: "Ar",   name: "Malagasy Ariary" },
  { code: "SDG", symbol: "ج.س.", name: "Sudanese Pound" },
  { code: "SOS", symbol: "Sh",   name: "Somali Shilling" },
  { code: "LYD", symbol: "ل.د", name: "Libyan Dinar" },
  { code: "XOF", symbol: "Fr",   name: "West African CFA Franc" },
  { code: "XAF", symbol: "Fr",   name: "Central African CFA Franc" },
  { code: "MRU", symbol: "UM",   name: "Mauritanian Ouguiya" },
  { code: "GMD", symbol: "D",    name: "Gambian Dalasi" },
  { code: "SLL", symbol: "Le",   name: "Sierra Leonean Leone" },
  { code: "GNF", symbol: "Fr",   name: "Guinean Franc" },
  { code: "DJF", symbol: "Fdj",  name: "Djiboutian Franc" },
  { code: "KMF", symbol: "Fr",   name: "Comorian Franc" },
  { code: "MUR", symbol: "Rs",   name: "Mauritian Rupee" },
  { code: "SCR", symbol: "SR",   name: "Seychellois Rupee" },
  { code: "SZL", symbol: "L",    name: "Swazi Lilangeni" },
  { code: "LSL", symbol: "L",    name: "Lesotho Loti" },
  // Americas
  { code: "BRL", symbol: "R$",   name: "Brazilian Real" },
  { code: "MXN", symbol: "$",    name: "Mexican Peso" },
  { code: "ARS", symbol: "$",    name: "Argentine Peso" },
  { code: "CLP", symbol: "$",    name: "Chilean Peso" },
  { code: "COP", symbol: "$",    name: "Colombian Peso" },
  { code: "PEN", symbol: "S/",   name: "Peruvian Sol" },
  { code: "UYU", symbol: "$U",   name: "Uruguayan Peso" },
  { code: "VES", symbol: "Bs",   name: "Venezuelan Bolivar" },
  { code: "BOB", symbol: "Bs",   name: "Bolivian Boliviano" },
  { code: "PYG", symbol: "₲",   name: "Paraguayan Guarani" },
  { code: "GTQ", symbol: "Q",    name: "Guatemalan Quetzal" },
  { code: "HNL", symbol: "L",    name: "Honduran Lempira" },
  { code: "NIO", symbol: "C$",   name: "Nicaraguan Córdoba" },
  { code: "CRC", symbol: "₡",   name: "Costa Rican Colón" },
  { code: "PAB", symbol: "B/.",  name: "Panamanian Balboa" },
  { code: "DOP", symbol: "RD$",  name: "Dominican Peso" },
  { code: "CUP", symbol: "$",    name: "Cuban Peso" },
  { code: "JMD", symbol: "J$",   name: "Jamaican Dollar" },
  { code: "TTD", symbol: "TT$",  name: "Trinidad and Tobago Dollar" },
  { code: "BBD", symbol: "Bds$", name: "Barbadian Dollar" },
  { code: "BZD", symbol: "BZ$",  name: "Belize Dollar" },
  { code: "GYD", symbol: "G$",   name: "Guyanese Dollar" },
  { code: "SRD", symbol: "$",    name: "Surinamese Dollar" },
  { code: "HTG", symbol: "G",    name: "Haitian Gourde" },
  // Pacific
  { code: "NZD", symbol: "NZ$",  name: "New Zealand Dollar" },
  { code: "FJD", symbol: "FJ$",  name: "Fijian Dollar" },
  { code: "PGK", symbol: "K",    name: "Papua New Guinean Kina" },
  { code: "SBD", symbol: "SI$",  name: "Solomon Islands Dollar" },
  { code: "TOP", symbol: "T$",   name: "Tongan Paʻanga" },
  { code: "WST", symbol: "WS$",  name: "Samoan Tala" },
  { code: "VUV", symbol: "VT",   name: "Vanuatu Vatu" },
  { code: "XPF", symbol: "Fr",   name: "CFP Franc" },
];

const INPUT_CLS = "w-full px-4 py-3 rounded-xl border text-sm outline-none transition-all";
const INPUT_STYLE = { borderColor: "hsl(var(--border))", background: "hsl(var(--background))" };

export default function Settings() {
  const { user, refreshUser } = useAuth();

  // Profile modal
  const [profileOpen, setProfileOpen] = useState(false);
  const [pName, setPName] = useState("");
  const [pPhone, setPPhone] = useState("");
  const [pShop, setPShop] = useState("");
  const [pSaving, setPSaving] = useState(false);
  const [pError, setPError] = useState("");
  const [pOk, setPOk] = useState(false);

  // Password modal
  const [passOpen, setPassOpen] = useState(false);
  const [passOld, setPassOld] = useState("");
  const [passNew, setPassNew] = useState("");
  const [passConfirm, setPassConfirm] = useState("");
  const [passShowOld, setPassShowOld] = useState(false);
  const [passShowNew, setPassShowNew] = useState(false);
  const [passSaving, setPassSaving] = useState(false);
  const [passError, setPassError] = useState("");
  const [passOk, setPassOk] = useState(false);

  // Settings (currency + shop)
  const [currency, setCurrency] = useState(user?.currency ?? "USD");
  const [shopName, setShopName] = useState(user?.shopName ?? "");
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [settingsOk, setSettingsOk] = useState(false);
  const [settingsError, setSettingsError] = useState("");
  // Currency picker
  const [currencyOpen, setCurrencyOpen] = useState(false);
  const [currencySearch, setCurrencySearch] = useState("");
  const currencyRef = useRef<HTMLDivElement>(null);

  // Sync currency/shopName when user loads from server
  useEffect(() => {
    if (user?.currency) setCurrency(user.currency);
    if (user?.shopName) setShopName(user.shopName);
  }, [user?.currency, user?.shopName]);

  // Close currency dropdown when clicking outside
  useEffect(() => {
    if (!currencyOpen) return;
    function handler(e: MouseEvent) {
      if (currencyRef.current && !currencyRef.current.contains(e.target as Node)) {
        setCurrencyOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [currencyOpen]);

  function openProfile() {
    setPName(user?.name ?? "");
    setPPhone("");
    setPShop(user?.shopName ?? "");
    setPError("");
    setPOk(false);
    setProfileOpen(true);
  }

  async function handleProfile(e: FormEvent) {
    e.preventDefault();
    setPSaving(true); setPError("");
    try {
      const res = await fetch("/api/auth/profile", {
        method: "PUT", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: pName, phone: pPhone, shopName: pShop }),
      });
      const ct = res.headers.get("content-type") ?? "";
      if (!ct.includes("application/json")) throw new Error("Server error. Please try again later.");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed");
      setPOk(true);
      await refreshUser();
      setTimeout(() => { setProfileOpen(false); setPOk(false); }, 1200);
    } catch (err: any) { setPError(err.message); }
    finally { setPSaving(false); }
  }

  function openPassword() {
    setPassOld(""); setPassNew(""); setPassConfirm(""); setPassError(""); setPassOk(false);
    setPassOpen(true);
  }

  async function handlePassword(e: FormEvent) {
    e.preventDefault();
    if (passNew !== passConfirm) { setPassError("Passwords do not match"); return; }
    setPassSaving(true); setPassError("");
    try {
      const res = await fetch("/api/auth/password", {
        method: "PUT", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: passOld, newPassword: passNew }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed");
      setPassOk(true);
      setTimeout(() => { setPassOpen(false); setPassOk(false); }, 1200);
    } catch (err: any) { setPassError(err.message); }
    finally { setPassSaving(false); }
  }

  async function handleSettings(e: FormEvent) {
    e.preventDefault();
    setSettingsSaving(true); setSettingsError(""); setSettingsOk(false);
    try {
      const res = await fetch("/api/auth/settings", {
        method: "PUT", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currency, shopName }),
      });
      const ct = res.headers.get("content-type") ?? "";
      if (!ct.includes("application/json")) throw new Error("Server error. Please try again later.");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed");
      setSettingsOk(true);
      await refreshUser();
      setTimeout(() => setSettingsOk(false), 2000);
    } catch (err: any) { setSettingsError(err.message); }
    finally { setSettingsSaving(false); }
  }

  const MENU_ITEMS = [
    { label: "Profile Settings", icon: User, description: "Update your name and contact", action: openProfile },
    { label: "Notifications", icon: Bell, description: "Manage notification preferences", action: () => {} },
    { label: "Change Password", icon: Lock, description: "Update your account password", action: openPassword },
  ];

  const selectedCurr = CURRENCIES.find(c => c.code === currency);

  return (
    <ProtectedPage>
      <div className="space-y-5">
        <h1 className="text-xl font-extrabold pt-1">Settings</h1>

        {/* Account info */}
        <div className="bg-card rounded-2xl border border-border p-4">
          <p className="text-xs font-bold uppercase tracking-wide mb-3"
            style={{ color: "hsl(var(--muted-foreground))" }}>Account</p>
          <div className="flex items-center gap-3 mb-4 pb-4 border-b border-border">
            <div className="w-12 h-12 rounded-full flex items-center justify-center text-sm font-extrabold text-white"
              style={{ background: "hsl(var(--primary))" }}>
              {user?.name?.charAt(0).toUpperCase() ?? "U"}
            </div>
            <div>
              <p className="font-bold">{user?.name ?? "User"}</p>
              <p className="text-xs mt-0.5" style={{ color: "hsl(var(--muted-foreground))" }}>
                {user?.email && <span>{user.email} · </span>}
                {user?.role ?? "Technician"} · {user?.plan ?? "Free"} Plan
              </p>
            </div>
          </div>
          <div className="divide-y divide-border">
            {MENU_ITEMS.map(({ label, icon: Icon, description, action }) => (
              <div key={label} className="flex items-center gap-3 py-3 cursor-pointer rounded-xl hover:bg-muted/40 px-1 transition-colors"
                onClick={action}>
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: "hsl(var(--muted))" }}>
                  <Icon className="w-4 h-4" style={{ color: "hsl(var(--primary))" }} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold">{label}</p>
                  <p className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>{description}</p>
                </div>
                <ChevronRight className="w-4 h-4" style={{ color: "hsl(var(--muted-foreground))" }} />
              </div>
            ))}
          </div>
        </div>

        {/* Shop & Currency settings */}
        <div className="bg-card rounded-2xl border border-border p-4">
          <p className="text-xs font-bold uppercase tracking-wide mb-3"
            style={{ color: "hsl(var(--muted-foreground))" }}>Shop & Currency</p>
          <form onSubmit={handleSettings} className="flex flex-col gap-3.5">
            <div>
              <label className="text-xs font-semibold block mb-1.5" style={{ color: "hsl(var(--muted-foreground))" }}>Shop Name</label>
              <div className="relative">
                <Store className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2"
                  style={{ color: "hsl(var(--muted-foreground))" }} />
                <input value={shopName} onChange={e => setShopName(e.target.value)}
                  placeholder="Enter your shop name"
                  className={INPUT_CLS + " pl-10"}
                  style={INPUT_STYLE}
                  onFocus={e => { e.currentTarget.style.borderColor = "hsl(var(--primary))"; }}
                  onBlur={e => { e.currentTarget.style.borderColor = "hsl(var(--border))"; }} />
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold block mb-1.5" style={{ color: "hsl(var(--muted-foreground))" }}>
                Currency
              </label>
              <div className="relative" ref={currencyRef}>
                {/* Trigger button showing selected currency */}
                <button
                  type="button"
                  onClick={() => { setCurrencyOpen(v => !v); setCurrencySearch(""); }}
                  className={INPUT_CLS + " pl-10 pr-4 text-left flex items-center"}
                  style={{ ...INPUT_STYLE, borderColor: currencyOpen ? "hsl(var(--primary))" : "hsl(var(--border))" }}
                >
                  <Globe className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2"
                    style={{ color: "hsl(var(--muted-foreground))" }} />
                  {selectedCurr
                    ? <span className="truncate">{selectedCurr.symbol} {selectedCurr.code} — {selectedCurr.name}</span>
                    : <span style={{ color: "hsl(var(--muted-foreground))" }}>Select currency</span>}
                </button>

                {/* Dropdown panel */}
                {currencyOpen && (
                  <div className="absolute z-50 left-0 right-0 top-full mt-1 rounded-xl border shadow-xl overflow-hidden"
                    style={{ background: "hsl(var(--card))", borderColor: "hsl(var(--primary))" }}>
                    {/* Search bar */}
                    <div className="p-2 border-b" style={{ borderColor: "hsl(var(--border))" }}>
                      <div className="relative">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2"
                          style={{ color: "hsl(var(--muted-foreground))" }} />
                        <input
                          autoFocus
                          value={currencySearch}
                          onChange={e => setCurrencySearch(e.target.value)}
                          placeholder="Search currency..."
                          className="w-full pl-9 pr-9 py-2 text-sm rounded-lg border outline-none"
                          style={{ borderColor: "hsl(var(--border))", background: "hsl(var(--background))" }}
                        />
                        {currencySearch && (
                          <button type="button" onClick={() => setCurrencySearch("")}
                            className="absolute right-2 top-1/2 -translate-y-1/2">
                            <X className="w-3.5 h-3.5" style={{ color: "hsl(var(--muted-foreground))" }} />
                          </button>
                        )}
                      </div>
                    </div>
                    {/* Currency list */}
                    <div className="max-h-52 overflow-y-auto">
                      {(() => {
                        const q = currencySearch.toLowerCase();
                        const filtered = q
                          ? CURRENCIES.filter(c =>
                              c.code.toLowerCase().includes(q) ||
                              c.name.toLowerCase().includes(q) ||
                              c.symbol.toLowerCase().includes(q))
                          : CURRENCIES;
                        if (filtered.length === 0)
                          return <p className="text-center py-4 text-sm" style={{ color: "hsl(var(--muted-foreground))" }}>No currencies found</p>;
                        return filtered.map(c => (
                          <button
                            key={c.code}
                            type="button"
                            onClick={() => { setCurrency(c.code); setCurrencyOpen(false); setCurrencySearch(""); }}
                            className="w-full text-left px-4 py-2.5 text-sm flex items-center gap-2 transition-colors"
                            style={currency === c.code
                              ? { background: "hsl(var(--primary) / 0.12)", fontWeight: 600 }
                              : {}}
                          >
                            <span className="w-7 text-center font-mono text-xs flex-shrink-0">{c.symbol}</span>
                            <span className="font-semibold w-10 flex-shrink-0">{c.code}</span>
                            <span className="text-xs truncate" style={{ color: "hsl(var(--muted-foreground))" }}>{c.name}</span>
                            {currency === c.code && <Check className="w-3.5 h-3.5 ml-auto flex-shrink-0" style={{ color: "hsl(var(--primary))" }} />}
                          </button>
                        ));
                      })()}
                    </div>
                  </div>
                )}
              </div>
              {selectedCurr && (
                <p className="text-xs mt-1" style={{ color: "hsl(var(--muted-foreground))" }}>
                  Prices will display as: <strong>{selectedCurr.symbol}1,000</strong>
                </p>
              )}
            </div>
            {settingsError && (
              <p className="text-xs font-semibold" style={{ color: "hsl(var(--destructive))" }}>{settingsError}</p>
            )}
            <button type="submit" disabled={settingsSaving}
              className="flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm text-white transition-all disabled:opacity-60"
              style={{ background: "hsl(var(--primary))" }}>
              {settingsOk ? <><Check className="w-4 h-4" /> Saved!</> : settingsSaving ? "Saving…" : "Save Changes"}
            </button>
          </form>
        </div>

        {/* App version */}
        <p className="text-xs text-center pb-2" style={{ color: "hsl(var(--muted-foreground))" }}>
          ComboFinder v1.0 · All-in-One for Technicians
        </p>
      </div>

      {/* Profile Modal */}
      {profileOpen && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setProfileOpen(false)} />
          <div className="relative w-full max-w-md rounded-t-3xl md:rounded-3xl shadow-2xl"
            style={{ background: "hsl(var(--card))" }}>
            <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b"
              style={{ borderColor: "hsl(var(--border))" }}>
              <div>
                <h3 className="font-bold text-base">Profile Settings</h3>
                <p className="text-xs mt-0.5" style={{ color: "hsl(var(--muted-foreground))" }}>Update your name and contact</p>
              </div>
              <button onClick={() => setProfileOpen(false)} className="w-8 h-8 rounded-full flex items-center justify-center"
                style={{ background: "hsl(var(--muted))" }}>
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleProfile} className="p-5 flex flex-col gap-3.5">
              <div>
                <label className="text-xs font-semibold block mb-1.5" style={{ color: "hsl(var(--muted-foreground))" }}>Full Name *</label>
                <input value={pName} onChange={e => setPName(e.target.value)} required
                  placeholder="Your name"
                  className={INPUT_CLS} style={INPUT_STYLE}
                  onFocus={e => { e.currentTarget.style.borderColor = "hsl(var(--primary))"; }}
                  onBlur={e => { e.currentTarget.style.borderColor = "hsl(var(--border))"; }} />
              </div>
              <div>
                <label className="text-xs font-semibold block mb-1.5" style={{ color: "hsl(var(--muted-foreground))" }}>Phone</label>
                <input value={pPhone} onChange={e => setPPhone(e.target.value)}
                  placeholder="Phone number"
                  className={INPUT_CLS} style={INPUT_STYLE}
                  onFocus={e => { e.currentTarget.style.borderColor = "hsl(var(--primary))"; }}
                  onBlur={e => { e.currentTarget.style.borderColor = "hsl(var(--border))"; }} />
              </div>
              <div>
                <label className="text-xs font-semibold block mb-1.5" style={{ color: "hsl(var(--muted-foreground))" }}>Shop Name</label>
                <input value={pShop} onChange={e => setPShop(e.target.value)}
                  placeholder="Your shop name"
                  className={INPUT_CLS} style={INPUT_STYLE}
                  onFocus={e => { e.currentTarget.style.borderColor = "hsl(var(--primary))"; }}
                  onBlur={e => { e.currentTarget.style.borderColor = "hsl(var(--border))"; }} />
              </div>
              {pError && <p className="text-xs font-semibold" style={{ color: "hsl(var(--destructive))" }}>{pError}</p>}
              <button type="submit" disabled={pSaving}
                className="py-3 rounded-xl font-bold text-sm text-white disabled:opacity-60"
                style={{ background: "hsl(var(--primary))" }}>
                {pOk ? "✓ Saved!" : pSaving ? "Saving…" : "Save Profile"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Password Modal */}
      {passOpen && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setPassOpen(false)} />
          <div className="relative w-full max-w-md rounded-t-3xl md:rounded-3xl shadow-2xl"
            style={{ background: "hsl(var(--card))" }}>
            <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b"
              style={{ borderColor: "hsl(var(--border))" }}>
              <div>
                <h3 className="font-bold text-base">Change Password</h3>
                <p className="text-xs mt-0.5" style={{ color: "hsl(var(--muted-foreground))" }}>Keep your account secure</p>
              </div>
              <button onClick={() => setPassOpen(false)} className="w-8 h-8 rounded-full flex items-center justify-center"
                style={{ background: "hsl(var(--muted))" }}>
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handlePassword} className="p-5 flex flex-col gap-3.5">
              <div>
                <label className="text-xs font-semibold block mb-1.5" style={{ color: "hsl(var(--muted-foreground))" }}>Current Password *</label>
                <div className="relative">
                  <input value={passOld} onChange={e => setPassOld(e.target.value)} required
                    type={passShowOld ? "text" : "password"} placeholder="Current password"
                    className={INPUT_CLS + " pr-10"} style={INPUT_STYLE}
                    onFocus={e => { e.currentTarget.style.borderColor = "hsl(var(--primary))"; }}
                    onBlur={e => { e.currentTarget.style.borderColor = "hsl(var(--border))"; }} />
                  <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2"
                    onClick={() => setPassShowOld(v => !v)}>
                    {passShowOld ? <EyeOff className="w-4 h-4" style={{ color: "hsl(var(--muted-foreground))" }} /> : <Eye className="w-4 h-4" style={{ color: "hsl(var(--muted-foreground))" }} />}
                  </button>
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold block mb-1.5" style={{ color: "hsl(var(--muted-foreground))" }}>New Password *</label>
                <div className="relative">
                  <input value={passNew} onChange={e => setPassNew(e.target.value)} required
                    type={passShowNew ? "text" : "password"} placeholder="New password (min 6 chars)"
                    className={INPUT_CLS + " pr-10"} style={INPUT_STYLE}
                    onFocus={e => { e.currentTarget.style.borderColor = "hsl(var(--primary))"; }}
                    onBlur={e => { e.currentTarget.style.borderColor = "hsl(var(--border))"; }} />
                  <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2"
                    onClick={() => setPassShowNew(v => !v)}>
                    {passShowNew ? <EyeOff className="w-4 h-4" style={{ color: "hsl(var(--muted-foreground))" }} /> : <Eye className="w-4 h-4" style={{ color: "hsl(var(--muted-foreground))" }} />}
                  </button>
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold block mb-1.5" style={{ color: "hsl(var(--muted-foreground))" }}>Confirm New Password *</label>
                <input value={passConfirm} onChange={e => setPassConfirm(e.target.value)} required
                  type="password" placeholder="Repeat new password"
                  className={INPUT_CLS} style={INPUT_STYLE}
                  onFocus={e => { e.currentTarget.style.borderColor = "hsl(var(--primary))"; }}
                  onBlur={e => { e.currentTarget.style.borderColor = "hsl(var(--border))"; }} />
              </div>
              {passError && <p className="text-xs font-semibold" style={{ color: "hsl(var(--destructive))" }}>{passError}</p>}
              <button type="submit" disabled={passSaving}
                className="py-3 rounded-xl font-bold text-sm text-white disabled:opacity-60"
                style={{ background: "hsl(var(--primary))" }}>
                {passOk ? "✓ Password Changed!" : passSaving ? "Saving…" : "Change Password"}
              </button>
            </form>
          </div>
        </div>
      )}
    </ProtectedPage>
  );
}
