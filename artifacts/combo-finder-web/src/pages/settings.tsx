import { useState, useRef, useEffect, type FormEvent } from "react";
import {
  Store,
  User,
  Lock,
  ChevronRight,
  Check,
  X,
  Globe,
  Eye,
  EyeOff,
  Search,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  CloudOff,
  MapPin,
  ImageIcon,
  Smartphone,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/context/auth-context";
import { ProtectedPage } from "@/components/protected-page";
import { exportAllLocalData, importLocalBackup } from "@/lib/local-store";
import {
  isGDriveConnected,
  requestGDriveToken,
  uploadToDrive,
  downloadFromDrive,
  disconnectGDrive,
  getStoredToken,
} from "@/lib/google-drive";

const CURRENCIES = [
  // Major / Most-used
  { code: "USD", symbol: "$", name: "US Dollar" },
  { code: "EUR", symbol: "€", name: "Euro" },
  { code: "GBP", symbol: "£", name: "British Pound" },
  { code: "JPY", symbol: "¥", name: "Japanese Yen" },
  { code: "CNY", symbol: "¥", name: "Chinese Yuan" },
  { code: "AUD", symbol: "A$", name: "Australian Dollar" },
  { code: "CAD", symbol: "C$", name: "Canadian Dollar" },
  { code: "CHF", symbol: "Fr", name: "Swiss Franc" },
  { code: "HKD", symbol: "HK$", name: "Hong Kong Dollar" },
  { code: "SGD", symbol: "S$", name: "Singapore Dollar" },
  { code: "KRW", symbol: "₩", name: "South Korean Won" },
  { code: "TWD", symbol: "NT$", name: "New Taiwan Dollar" },
  // South Asia
  { code: "BDT", symbol: "Tk", name: "Bangladeshi Taka" },
  { code: "INR", symbol: "₹", name: "Indian Rupee" },
  { code: "PKR", symbol: "₨", name: "Pakistani Rupee" },
  { code: "NPR", symbol: "रू", name: "Nepalese Rupee" },
  { code: "LKR", symbol: "Rs", name: "Sri Lankan Rupee" },
  { code: "MVR", symbol: "Rf", name: "Maldivian Rufiyaa" },
  { code: "BTN", symbol: "Nu", name: "Bhutanese Ngultrum" },
  // Southeast Asia
  { code: "MYR", symbol: "RM", name: "Malaysian Ringgit" },
  { code: "THB", symbol: "฿", name: "Thai Baht" },
  { code: "IDR", symbol: "Rp", name: "Indonesian Rupiah" },
  { code: "PHP", symbol: "₱", name: "Philippine Peso" },
  { code: "VND", symbol: "₫", name: "Vietnamese Dong" },
  { code: "MMK", symbol: "K", name: "Myanmar Kyat" },
  { code: "KHR", symbol: "៛", name: "Cambodian Riel" },
  { code: "LAK", symbol: "₭", name: "Lao Kip" },
  { code: "BND", symbol: "B$", name: "Brunei Dollar" },
  { code: "MOP", symbol: "P", name: "Macanese Pataca" },
  // Middle East
  { code: "AED", symbol: "د.إ", name: "UAE Dirham" },
  { code: "SAR", symbol: "﷼", name: "Saudi Riyal" },
  { code: "QAR", symbol: "﷼", name: "Qatari Riyal" },
  { code: "KWD", symbol: "د.ك", name: "Kuwaiti Dinar" },
  { code: "BHD", symbol: "BD", name: "Bahraini Dinar" },
  { code: "OMR", symbol: "ر.ع.", name: "Omani Rial" },
  { code: "JOD", symbol: "JD", name: "Jordanian Dinar" },
  { code: "IQD", symbol: "ع.د", name: "Iraqi Dinar" },
  { code: "YER", symbol: "﷼", name: "Yemeni Rial" },
  { code: "ILS", symbol: "₪", name: "Israeli Shekel" },
  { code: "LBP", symbol: "ل.ل", name: "Lebanese Pound" },
  { code: "IRR", symbol: "﷼", name: "Iranian Rial" },
  { code: "SYP", symbol: "£", name: "Syrian Pound" },
  { code: "AFN", symbol: "؋", name: "Afghan Afghani" },
  // Europe
  { code: "SEK", symbol: "kr", name: "Swedish Krona" },
  { code: "NOK", symbol: "kr", name: "Norwegian Krone" },
  { code: "DKK", symbol: "kr", name: "Danish Krone" },
  { code: "PLN", symbol: "zł", name: "Polish Zloty" },
  { code: "CZK", symbol: "Kč", name: "Czech Koruna" },
  { code: "HUF", symbol: "Ft", name: "Hungarian Forint" },
  { code: "RON", symbol: "lei", name: "Romanian Leu" },
  { code: "BGN", symbol: "лв", name: "Bulgarian Lev" },
  { code: "HRK", symbol: "kn", name: "Croatian Kuna" },
  { code: "RSD", symbol: "din", name: "Serbian Dinar" },
  { code: "UAH", symbol: "₴", name: "Ukrainian Hryvnia" },
  { code: "RUB", symbol: "₽", name: "Russian Ruble" },
  { code: "TRY", symbol: "₺", name: "Turkish Lira" },
  { code: "ISK", symbol: "kr", name: "Icelandic Krona" },
  { code: "GEL", symbol: "₾", name: "Georgian Lari" },
  { code: "AZN", symbol: "₼", name: "Azerbaijani Manat" },
  { code: "AMD", symbol: "֏", name: "Armenian Dram" },
  // Central Asia
  { code: "KZT", symbol: "₸", name: "Kazakhstani Tenge" },
  { code: "UZS", symbol: "so'm", name: "Uzbekistani Som" },
  { code: "TJS", symbol: "SM", name: "Tajikistani Somoni" },
  { code: "KGS", symbol: "лв", name: "Kyrgyzstani Som" },
  { code: "TMT", symbol: "T", name: "Turkmenistani Manat" },
  { code: "MNT", symbol: "₮", name: "Mongolian Tugrik" },
  // Africa
  { code: "ZAR", symbol: "R", name: "South African Rand" },
  { code: "NGN", symbol: "₦", name: "Nigerian Naira" },
  { code: "KES", symbol: "KSh", name: "Kenyan Shilling" },
  { code: "GHS", symbol: "₵", name: "Ghanaian Cedi" },
  { code: "EGP", symbol: "£", name: "Egyptian Pound" },
  { code: "MAD", symbol: "د.م.", name: "Moroccan Dirham" },
  { code: "DZD", symbol: "دج", name: "Algerian Dinar" },
  { code: "TND", symbol: "د.ت", name: "Tunisian Dinar" },
  { code: "ETB", symbol: "Br", name: "Ethiopian Birr" },
  { code: "TZS", symbol: "TSh", name: "Tanzanian Shilling" },
  { code: "UGX", symbol: "USh", name: "Ugandan Shilling" },
  { code: "ZMW", symbol: "ZK", name: "Zambian Kwacha" },
  { code: "MWK", symbol: "MK", name: "Malawian Kwacha" },
  { code: "MZN", symbol: "MT", name: "Mozambican Metical" },
  { code: "BWP", symbol: "P", name: "Botswana Pula" },
  { code: "NAD", symbol: "N$", name: "Namibian Dollar" },
  { code: "ZWL", symbol: "Z$", name: "Zimbabwean Dollar" },
  { code: "MGA", symbol: "Ar", name: "Malagasy Ariary" },
  { code: "SDG", symbol: "ج.س.", name: "Sudanese Pound" },
  { code: "SOS", symbol: "Sh", name: "Somali Shilling" },
  { code: "LYD", symbol: "ل.د", name: "Libyan Dinar" },
  { code: "XOF", symbol: "Fr", name: "West African CFA Franc" },
  { code: "XAF", symbol: "Fr", name: "Central African CFA Franc" },
  { code: "MRU", symbol: "UM", name: "Mauritanian Ouguiya" },
  { code: "GMD", symbol: "D", name: "Gambian Dalasi" },
  { code: "SLL", symbol: "Le", name: "Sierra Leonean Leone" },
  { code: "GNF", symbol: "Fr", name: "Guinean Franc" },
  { code: "DJF", symbol: "Fdj", name: "Djiboutian Franc" },
  { code: "KMF", symbol: "Fr", name: "Comorian Franc" },
  { code: "MUR", symbol: "Rs", name: "Mauritian Rupee" },
  { code: "SCR", symbol: "SR", name: "Seychellois Rupee" },
  { code: "SZL", symbol: "L", name: "Swazi Lilangeni" },
  { code: "LSL", symbol: "L", name: "Lesotho Loti" },
  // Americas
  { code: "BRL", symbol: "R$", name: "Brazilian Real" },
  { code: "MXN", symbol: "$", name: "Mexican Peso" },
  { code: "ARS", symbol: "$", name: "Argentine Peso" },
  { code: "CLP", symbol: "$", name: "Chilean Peso" },
  { code: "COP", symbol: "$", name: "Colombian Peso" },
  { code: "PEN", symbol: "S/", name: "Peruvian Sol" },
  { code: "UYU", symbol: "$U", name: "Uruguayan Peso" },
  { code: "VES", symbol: "Bs", name: "Venezuelan Bolivar" },
  { code: "BOB", symbol: "Bs", name: "Bolivian Boliviano" },
  { code: "PYG", symbol: "₲", name: "Paraguayan Guarani" },
  { code: "GTQ", symbol: "Q", name: "Guatemalan Quetzal" },
  { code: "HNL", symbol: "L", name: "Honduran Lempira" },
  { code: "NIO", symbol: "C$", name: "Nicaraguan Córdoba" },
  { code: "CRC", symbol: "₡", name: "Costa Rican Colón" },
  { code: "PAB", symbol: "B/.", name: "Panamanian Balboa" },
  { code: "DOP", symbol: "RD$", name: "Dominican Peso" },
  { code: "CUP", symbol: "$", name: "Cuban Peso" },
  { code: "JMD", symbol: "J$", name: "Jamaican Dollar" },
  { code: "TTD", symbol: "TT$", name: "Trinidad and Tobago Dollar" },
  { code: "BBD", symbol: "Bds$", name: "Barbadian Dollar" },
  { code: "BZD", symbol: "BZ$", name: "Belize Dollar" },
  { code: "GYD", symbol: "G$", name: "Guyanese Dollar" },
  { code: "SRD", symbol: "$", name: "Surinamese Dollar" },
  { code: "HTG", symbol: "G", name: "Haitian Gourde" },
  // Pacific
  { code: "NZD", symbol: "NZ$", name: "New Zealand Dollar" },
  { code: "FJD", symbol: "FJ$", name: "Fijian Dollar" },
  { code: "PGK", symbol: "K", name: "Papua New Guinean Kina" },
  { code: "SBD", symbol: "SI$", name: "Solomon Islands Dollar" },
  { code: "TOP", symbol: "T$", name: "Tongan Paʻanga" },
  { code: "WST", symbol: "WS$", name: "Samoan Tala" },
  { code: "VUV", symbol: "VT", name: "Vanuatu Vatu" },
  { code: "XPF", symbol: "Fr", name: "CFP Franc" },
];

const INPUT_CLS = "w-full px-4 py-3 rounded-xl border text-sm outline-none transition-all";
const INPUT_STYLE = { borderColor: "hsl(var(--border))", background: "hsl(var(--background))" };

export default function Settings() {
  const { user, refreshUser } = useAuth();
  const qc = useQueryClient();

  // Google Drive backup state
  const [gDriveConnected, setGDriveConnected] = useState(() => isGDriveConnected());
  const [backupSending, setBackupSending] = useState(false);
  const [backupStatus, setBackupStatus] = useState<"idle" | "success" | "error">("idle");
  const [backupErr, setBackupErr] = useState("");
  const [restoring, setRestoring] = useState(false);
  const [restoreStatus, setRestoreStatus] = useState<"idle" | "success" | "error">("idle");
  const [restoreMsg, setRestoreMsg] = useState("");
  const [connecting, setConnecting] = useState(false);

  // Last backup timestamp
  const [lastBackupTs, setLastBackupTs] = useState<number | null>(() => {
    if (!user?.id) return null;
    const v = localStorage.getItem(`cf_last_backup_${user.id}`);
    return v ? Number(v) : null;
  });

  function fmtLastBackup(ts: number | null) {
    if (!ts) return null;
    const diff = Date.now() - ts;
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    if (mins < 2) return "Just now";
    if (mins < 60) return `${mins} min ago`;
    if (hours < 24) return `${hours} hr ago`;
    return `${days} day${days > 1 ? "s" : ""} ago`;
  }

  useEffect(() => {
    setGDriveConnected(isGDriveConnected());
  }, [user?.id, user?.plan]);

  async function handleConnectDrive() {
    setConnecting(true);
    try {
      await requestGDriveToken();
      setGDriveConnected(true);
    } catch (e: any) {
      alert(e.message ?? "Google Drive connection failed");
    } finally {
      setConnecting(false);
    }
  }

  function handleDisconnectDrive() {
    if (!confirm("Disconnect Google Drive? Auto-backup will stop.")) return;
    disconnectGDrive();
    setGDriveConnected(false);
    setBackupStatus("idle");
    setRestoreStatus("idle");
  }

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

  // Shop & Currency Modal
  const [shopModalOpen, setShopModalOpen] = useState(false);
  const [currency, setCurrency] = useState(user?.currency ?? "USD");
  const [shopName, setShopName] = useState(user?.shopName ?? "");
  const [shopAddress, setShopAddress] = useState(user?.shopAddress ?? "");
  const [shopPhone, setShopPhone] = useState(user?.phone ?? "");
  const [shopLogo, setShopLogo] = useState<string>(user?.shopLogo ?? "");
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [settingsOk, setSettingsOk] = useState(false);
  const [settingsError, setSettingsError] = useState("");

  // Currency picker
  const [currencyOpen, setCurrencyOpen] = useState(false);
  const [currencySearch, setCurrencySearch] = useState("");
  const currencyRef = useRef<HTMLDivElement>(null);

  // Block body scroll when any modal is open
  useEffect(() => {
    if (profileOpen || shopModalOpen || passOpen) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [profileOpen, shopModalOpen, passOpen]);

  // Sync currency/shopName/phone when user loads from server
  useEffect(() => {
    if (user?.currency) setCurrency(user.currency);
    if (user?.shopName) setShopName(user.shopName);
    if (user?.shopAddress !== undefined) setShopAddress(user.shopAddress ?? "");
    if (user?.phone !== undefined) setShopPhone(user.phone ?? "");
    if (user?.shopLogo !== undefined) setShopLogo(user.shopLogo ?? "");
  }, [user?.currency, user?.shopName, user?.shopAddress, user?.phone, user?.shopLogo]);

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
    setPPhone(user?.phone ?? "");
    setPShop(user?.shopName ?? "");
    setPError("");
    setPOk(false);
    setProfileOpen(true);
  }

  function openShopModal() {
    setCurrency(user?.currency ?? "USD");
    setShopName(user?.shopName ?? "");
    setShopAddress(user?.shopAddress ?? "");
    setShopPhone(user?.phone ?? "");
    setShopLogo(user?.shopLogo ?? "");
    setSettingsError("");
    setSettingsOk(false);
    setShopModalOpen(true);
  }

  async function handleProfile(e: FormEvent) {
    e.preventDefault();
    setPSaving(true);
    setPError("");
    try {
      const res = await fetch("/api/auth/profile", {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: pName, phone: pPhone, shopName: pShop }),
      });
      const ct = res.headers.get("content-type") ?? "";
      if (!ct.includes("application/json")) throw new Error("Server error. Please try again later.");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed");
      setPOk(true);
      await refreshUser();
      setTimeout(() => {
        setProfileOpen(false);
        setPOk(false);
      }, 1200);
    } catch (err: any) {
      setPError(err.message);
    } finally {
      setPSaving(false);
    }
  }

  function openPassword() {
    setPassOld("");
    setPassNew("");
    setPassConfirm("");
    setPassError("");
    setPassOk(false);
    setPassOpen(true);
  }

  async function handlePassword(e: FormEvent) {
    e.preventDefault();
    if (passNew !== passConfirm) {
      setPassError("Passwords do not match");
      return;
    }
    setPassSaving(true);
    setPassError("");
    try {
      const res = await fetch("/api/auth/password", {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: passOld, newPassword: passNew }),
      });
      const ct = res.headers.get("content-type") ?? "";
      if (!ct.includes("application/json")) throw new Error("Server error. Please try again later.");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed");
      setPassOk(true);
      setTimeout(() => {
        setPassOpen(false);
        setPassOk(false);
      }, 1200);
    } catch (err: any) {
      setPassError(err.message);
    } finally {
      setPassSaving(false);
    }
  }

  async function handleSettings(e: FormEvent) {
    e.preventDefault();
    setSettingsSaving(true);
    setSettingsError("");
    setSettingsOk(false);
    try {
      const res = await fetch("/api/auth/settings", {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currency, shopName, shopAddress, shopLogo, phone: shopPhone }),
      });
      const ct = res.headers.get("content-type") ?? "";
      if (!ct.includes("application/json")) throw new Error("Server error. Please try again later.");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed");
      setSettingsOk(true);
      await refreshUser();
      setTimeout(() => {
        setSettingsOk(false);
        setShopModalOpen(false);
      }, 1200);
    } catch (err: any) {
      setSettingsError(err.message);
    } finally {
      setSettingsSaving(false);
    }
  }

  const selectedCurr = CURRENCIES.find((c) => c.code === currency);

  return (
    <ProtectedPage>
      <div className="max-w-4xl mx-auto space-y-6 pb-8">
        <div>
          <h1 className="text-2xl font-black tracking-tight">Settings</h1>
          <p className="text-xs mt-1" style={{ color: "hsl(var(--muted-foreground))" }}>
            Manage your account preferences, shop branding, and data backups
          </p>
        </div>

        {/* User Account Card */}
        <div className="bg-card rounded-2xl border border-border p-5 shadow-xs">
          <p
            className="text-xs font-bold uppercase tracking-wider mb-4"
            style={{ color: "hsl(var(--muted-foreground))" }}
          >
            Account Details
          </p>
          <div className="flex items-center gap-4 mb-4 pb-4 border-b border-border">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center text-lg font-black text-white shadow-xs"
              style={{ background: "hsl(var(--primary))" }}
            >
              {user?.name?.charAt(0).toUpperCase() ?? "U"}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-extrabold text-base truncate">{user?.name ?? "User"}</p>
                <span
                  className="px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase"
                  style={{ background: "hsl(var(--primary) / 0.1)", color: "hsl(var(--primary))" }}
                >
                  {user?.plan ?? "Free"} Plan
                </span>
              </div>
              <p className="text-xs mt-1 truncate" style={{ color: "hsl(var(--muted-foreground))" }}>
                {user?.email}
              </p>
            </div>
          </div>

          <div className="divide-y divide-border">
            <div
              className="flex items-center gap-3.5 py-3.5 cursor-pointer rounded-xl hover:bg-muted/50 px-2 transition-all"
              onClick={openProfile}
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: "hsl(var(--muted))" }}
              >
                <User className="w-5 h-5" style={{ color: "hsl(var(--primary))" }} />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold">Profile Settings</p>
                <p className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>
                  Update your display name and contact details
                </p>
              </div>
              <ChevronRight className="w-4 h-4" style={{ color: "hsl(var(--muted-foreground))" }} />
            </div>

            <div
              className="flex items-center gap-3.5 py-3.5 cursor-pointer rounded-xl hover:bg-muted/50 px-2 transition-all"
              onClick={openShopModal}
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: "hsl(var(--muted))" }}
              >
                <Store className="w-5 h-5" style={{ color: "hsl(var(--primary))" }} />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-bold">Shop & Currency</p>
                  {user?.shopName && (
                    <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
                      {user.shopName}
                    </span>
                  )}
                </div>
                <p className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>
                  Configure shop logo, address, mobile number & billing currency
                </p>
              </div>
              <ChevronRight className="w-4 h-4" style={{ color: "hsl(var(--muted-foreground))" }} />
            </div>

            <div
              className="flex items-center gap-3.5 py-3.5 cursor-pointer rounded-xl hover:bg-muted/50 px-2 transition-all"
              onClick={openPassword}
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: "hsl(var(--muted))" }}
              >
                <Lock className="w-5 h-5" style={{ color: "hsl(var(--primary))" }} />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold">Change Password</p>
                <p className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>
                  Update your password to keep your account secure
                </p>
              </div>
              <ChevronRight className="w-4 h-4" style={{ color: "hsl(var(--muted-foreground))" }} />
            </div>
          </div>
        </div>

        {/* Data & Backup Card (Free Plan Only - Pro users synced to cloud DB) */}
        {user?.plan !== "Pro" && (
          <div className="bg-card rounded-2xl border border-border p-5 space-y-4 shadow-xs">
            <div className="flex items-center justify-between">
              <p
                className="text-xs font-bold uppercase tracking-wider"
                style={{ color: "hsl(var(--muted-foreground))" }}
              >
                Data & Backup
              </p>
            </div>

          {/* Status bar */}
          <div
            className="flex items-center gap-2.5 rounded-xl px-4 py-3"
            style={{ background: "hsl(var(--muted))" }}
          >
            {gDriveConnected ? (
              lastBackupTs ? (
                <>
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0" style={{ color: "#10B981" }} />
                  <span className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>
                    Backed up to Google Drive <strong>{fmtLastBackup(lastBackupTs)}</strong> · Auto-backup on
                  </span>
                </>
              ) : (
                <>
                  <AlertCircle className="w-4 h-4 flex-shrink-0" style={{ color: "#F59E0B" }} />
                  <span className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>
                    Google Drive connected · Not backed up yet
                  </span>
                </>
              )
            ) : (
              <>
                <CloudOff className="w-4 h-4 flex-shrink-0" style={{ color: "hsl(var(--muted-foreground))" }} />
                <span className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>
                  Connect Google Drive to enable manual & automatic backups
                </span>
              </>
            )}
          </div>

          {!gDriveConnected ? (
            <button
              type="button"
              disabled={connecting}
              onClick={handleConnectDrive}
              className="w-full py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2.5 border-2 disabled:opacity-60 transition-all shadow-xs"
              style={{
                borderColor: "hsl(var(--primary))",
                color: "hsl(var(--primary))",
                background: "hsl(var(--primary) / 0.06)",
              }}
            >
              {connecting ? (
                <>
                  <span className="w-4 h-4 border-2 border-current/40 border-t-current rounded-full animate-spin" />{" "}
                  Connecting…
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" viewBox="0 0 87.3 78" xmlns="http://www.w3.org/2000/svg">
                    <path
                      d="m6.6 66.85 3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3l13.75-23.8h-27.5c0 1.55.4 3.1 1.2 4.5z"
                      fill="#0066da"
                    />
                    <path
                      d="m43.65 25-13.75-23.8c-1.35.8-2.5 1.9-3.3 3.3l-25.4 44a9.06 9.06 0 0 0 -1.2 4.5h27.5z"
                      fill="#00ac47"
                    />
                    <path
                      d="m73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25c.8-1.4 1.2-2.95 1.2-4.5h-27.502l5.852 11.5z"
                      fill="#ea4335"
                    />
                    <path
                      d="m43.65 25 13.75-23.8c-1.35-.8-2.9-1.2-4.5-1.2h-18.5c-1.6 0-3.15.45-4.5 1.2z"
                      fill="#00832d"
                    />
                    <path
                      d="m59.8 53h-32.3l-13.75 23.8c1.35.8 2.9 1.2 4.5 1.2h50.8c1.6 0 3.15-.45 4.5-1.2z"
                      fill="#2684fc"
                    />
                    <path
                      d="m73.4 26.5-12.7-22c-.8-1.4-1.95-2.5-3.3-3.3l-13.75 23.8 16.15 27h27.45c0-1.55-.4-3.1-1.2-4.5z"
                      fill="#ffba00"
                    />
                  </svg>
                  Connect Google Drive
                </>
              )}
            </button>
          ) : (
            <>
              <button
                type="button"
                disabled={backupSending}
                onClick={async () => {
                  if (!user?.id) return;
                  setBackupSending(true);
                  setBackupStatus("idle");
                  setBackupErr("");
                  try {
                    let token = getStoredToken();
                    if (!token) token = await requestGDriveToken();
                    const data = exportAllLocalData(user.id);
                    await uploadToDrive(data, token);
                    const now = Date.now();
                    localStorage.setItem(`cf_last_backup_${user.id}`, String(now));
                    setLastBackupTs(now);
                    setBackupStatus("success");
                  } catch (e: any) {
                    setBackupStatus("error");
                    setBackupErr(e.message ?? "Backup failed");
                  } finally {
                    setBackupSending(false);
                  }
                }}
                className="w-full py-3.5 rounded-xl font-bold text-sm text-white flex items-center justify-center gap-2 disabled:opacity-60 shadow-xs"
                style={{ background: "hsl(var(--primary))" }}
              >
                {backupSending ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />{" "}
                    Backing up…
                  </>
                ) : backupStatus === "success" ? (
                  <>
                    <CheckCircle2 className="w-4 h-4" /> Backup Complete ✓
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" viewBox="0 0 87.3 78" xmlns="http://www.w3.org/2000/svg">
                      <path
                        d="m6.6 66.85 3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3l13.75-23.8h-27.5c0 1.55.4 3.1 1.2 4.5z"
                        fill="#fff"
                      />
                      <path
                        d="m43.65 25-13.75-23.8c-1.35.8-2.5 1.9-3.3 3.3l-25.4 44a9.06 9.06 0 0 0 -1.2 4.5h27.5z"
                        fill="#fff"
                      />
                      <path
                        d="m73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25c.8-1.4 1.2-2.95 1.2-4.5h-27.502l5.852 11.5z"
                        fill="#fff"
                      />
                      <path
                        d="m43.65 25 13.75-23.8c-1.35-.8-2.9-1.2-4.5-1.2h-18.5c-1.6 0-3.15.45-4.5 1.2z"
                        fill="#fff"
                      />
                      <path
                        d="m59.8 53h-32.3l-13.75 23.8c1.35.8 2.9 1.2 4.5 1.2h50.8c1.6 0 3.15-.45 4.5-1.2z"
                        fill="#fff"
                      />
                      <path
                        d="m73.4 26.5-12.7-22c-.8-1.4-1.95-2.5-3.3-3.3l-13.75 23.8 16.15 27h27.45c0-1.55-.4-3.1-1.2-4.5z"
                        fill="#fff"
                      />
                    </svg>
                    Back Up to Google Drive
                  </>
                )}
              </button>
              {backupStatus === "error" && (
                <p className="text-xs text-center font-semibold" style={{ color: "hsl(var(--destructive))" }}>
                  {backupErr || "Backup failed. Please try again."}
                </p>
              )}
              {backupStatus === "success" && (
                <p className="text-xs text-center" style={{ color: "hsl(var(--muted-foreground))" }}>
                  Saved to Google Drive. Restore on any device by signing in and tapping "Restore".
                </p>
              )}

              {/* Restore from Drive */}
              <div className="border rounded-xl p-3.5 space-y-2.5" style={{ borderColor: "hsl(var(--border))" }}>
                <p className="text-xs font-bold" style={{ color: "hsl(var(--foreground))" }}>
                  📲 Restore to This Device
                </p>
                <p className="text-xs leading-relaxed" style={{ color: "hsl(var(--muted-foreground))" }}>
                  Replaces local device data with your latest Google Drive backup.
                </p>
                <button
                  type="button"
                  disabled={restoring}
                  onClick={async () => {
                    if (!user?.id) return;
                    if (
                      !confirm(
                        "This will replace all local data on this device with your Google Drive backup. Continue?"
                      )
                    )
                      return;
                    setRestoring(true);
                    setRestoreStatus("idle");
                    setRestoreMsg("");
                    try {
                      let token = getStoredToken();
                      if (!token) token = await requestGDriveToken();
                      const data = await downloadFromDrive(token);
                      if (!data) throw new Error("No backup found in Google Drive. Back up first.");
                      const { imported, errors } = importLocalBackup(user.id, data);
                      if (errors.length && !imported.length) throw new Error(errors[0]);
                      setRestoreStatus("success");
                      setRestoreMsg(imported.join(", ") + " restored ✓");
                      qc.invalidateQueries();
                    } catch (e: any) {
                      setRestoreStatus("error");
                      setRestoreMsg(e.message ?? "Restore failed. Please try again.");
                    } finally {
                      setRestoring(false);
                    }
                  }}
                  className="w-full py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-60"
                  style={{ background: "hsl(var(--muted))", color: "hsl(var(--foreground))" }}
                >
                  {restoring ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-current/40 border-t-current rounded-full animate-spin" />{" "}
                      Restoring…
                    </>
                  ) : (
                    <>
                      <RotateCcw className="w-3.5 h-3.5" /> Restore from Drive
                    </>
                  )}
                </button>
                {restoreStatus === "success" && (
                  <p className="text-xs text-center font-semibold text-emerald-600">{restoreMsg}</p>
                )}
                {restoreStatus === "error" && (
                  <p className="text-xs text-center font-semibold text-rose-600">{restoreMsg}</p>
                )}
              </div>

              <button
                type="button"
                onClick={handleDisconnectDrive}
                className="w-full text-xs py-2 rounded-xl font-semibold flex items-center justify-center gap-1.5 transition-colors"
                style={{ color: "hsl(var(--muted-foreground))" }}
              >
                <CloudOff className="w-3.5 h-3.5" /> Disconnect Google Drive
              </button>
            </>
          )}

            <p className="text-xs text-center leading-relaxed pt-1" style={{ color: "hsl(var(--muted-foreground))" }}>
              <Sparkles className="w-3.5 h-3.5 inline mr-1 text-amber-500" />
              Upgrade to Pro for real-time automatic cloud synchronization.{" "}
              <a href="/subscription" className="font-bold underline" style={{ color: "hsl(var(--primary))" }}>
                Upgrade →
              </a>
            </p>
          </div>
        )}

        {/* App Version Footer */}
        <p className="text-xs text-center pt-2" style={{ color: "hsl(var(--muted-foreground))" }}>
          <span>
            <span style={{ color: "#6d28d9", fontWeight: 800 }}>Pos</span>
            <span style={{ color: "#1f2937", fontWeight: 800 }}>Cert</span>
            <span> v1.0 · Smart POS for every Business</span>
          </span>
        </p>
      </div>

      {/* Profile Modal */}
      {profileOpen && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-xs" onClick={() => setProfileOpen(false)} />
          <div
            className="relative w-full max-w-md rounded-t-3xl md:rounded-3xl shadow-2xl overflow-hidden"
            style={{ background: "hsl(var(--card))" }}
          >
            <div
              className="flex items-center justify-between px-6 pt-5 pb-4 border-b"
              style={{ borderColor: "hsl(var(--border))" }}
            >
              <div>
                <h3 className="font-extrabold text-lg">Profile Settings</h3>
                <p className="text-xs mt-0.5" style={{ color: "hsl(var(--muted-foreground))" }}>
                  Update your name and contact info
                </p>
              </div>
              <button
                onClick={() => setProfileOpen(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-muted transition-colors"
                style={{ background: "hsl(var(--muted))" }}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleProfile} className="p-6 flex flex-col gap-4">
              <div>
                <label className="text-xs font-bold block mb-1.5" style={{ color: "hsl(var(--muted-foreground))" }}>
                  Full Name *
                </label>
                <input
                  value={pName}
                  onChange={(e) => setPName(e.target.value)}
                  required
                  placeholder="Your name"
                  className={INPUT_CLS}
                  style={INPUT_STYLE}
                />
              </div>
              <div>
                <label className="text-xs font-bold block mb-1.5" style={{ color: "hsl(var(--muted-foreground))" }}>
                  Phone
                </label>
                <input
                  value={pPhone}
                  onChange={(e) => setPPhone(e.target.value)}
                  placeholder="enter your Mobile number"
                  className={INPUT_CLS}
                  style={INPUT_STYLE}
                />
              </div>
              <div>
                <label className="text-xs font-bold block mb-1.5" style={{ color: "hsl(var(--muted-foreground))" }}>
                  Shop Name
                </label>
                <input
                  value={pShop}
                  onChange={(e) => setPShop(e.target.value)}
                  placeholder="Enter your shop name"
                  className={INPUT_CLS}
                  style={INPUT_STYLE}
                />
              </div>
              {pError && (
                <p className="text-xs font-semibold" style={{ color: "hsl(var(--destructive))" }}>
                  {pError}
                </p>
              )}
              <button
                type="submit"
                disabled={pSaving}
                className="py-3.5 rounded-xl font-bold text-sm text-white disabled:opacity-60 shadow-xs"
                style={{ background: "hsl(var(--primary))" }}
              >
                {pOk ? "✓ Saved!" : pSaving ? "Saving…" : "Save Profile"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Shop & Currency Modal System */}
      {shopModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-xs" onClick={() => setShopModalOpen(false)} />
          <div
            className="relative w-full max-w-lg rounded-t-3xl md:rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
            style={{ background: "hsl(var(--card))" }}
          >
            {/* Header */}
            <div
              className="flex items-center justify-between px-6 pt-5 pb-4 border-b flex-shrink-0"
              style={{ borderColor: "hsl(var(--border))" }}
            >
              <div>
                <h3 className="font-extrabold text-lg">Shop & Currency</h3>
                <p className="text-xs mt-0.5" style={{ color: "hsl(var(--muted-foreground))" }}>
                  Manage shop logo, contact info, address & currency
                </p>
              </div>
              <button
                onClick={() => setShopModalOpen(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-muted transition-colors"
                style={{ background: "hsl(var(--muted))" }}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSettings} className="p-6 overflow-y-auto space-y-4 flex-1">
              {/* Shop Logo URL */}
              <div>
                <label className="text-xs font-bold block mb-1.5" style={{ color: "hsl(var(--muted-foreground))" }}>
                  Shop Logo URL
                </label>
                <div className="flex items-center gap-3 mb-2">
                  {shopLogo ? (
                    <img
                      src={shopLogo}
                      alt="Shop logo"
                      className="w-14 h-14 rounded-xl object-cover border flex-shrink-0"
                      style={{ borderColor: "hsl(var(--border))" }}
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).style.display = "none";
                      }}
                    />
                  ) : (
                    <div
                      className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 border-2 border-dashed"
                      style={{ borderColor: "hsl(var(--border))", background: "hsl(var(--muted))" }}
                    >
                      <ImageIcon className="w-5 h-5" style={{ color: "hsl(var(--muted-foreground))" }} />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <input
                      value={shopLogo}
                      onChange={(e) => setShopLogo(e.target.value)}
                      placeholder="https://res.cloudinary.com/..."
                      className={INPUT_CLS}
                      style={INPUT_STYLE}
                    />
                    {shopLogo && (
                      <button
                        type="button"
                        onClick={() => setShopLogo("")}
                        className="mt-1.5 text-[11px] font-semibold text-rose-600 hover:underline"
                      >
                        ✕ Clear URL
                      </button>
                    )}
                  </div>
                </div>
                <p className="text-[11px] leading-relaxed" style={{ color: "hsl(var(--muted-foreground))" }}>
                  Upload to <span className="font-semibold text-foreground">Cloudinary</span> or any image host → paste the direct image URL here
                </p>
              </div>

              {/* Shop Name */}
              <div>
                <label className="text-xs font-bold block mb-1.5" style={{ color: "hsl(var(--muted-foreground))" }}>
                  Shop Name
                </label>
                <div className="relative">
                  <Store
                    className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2"
                    style={{ color: "hsl(var(--muted-foreground))" }}
                  />
                  <input
                    value={shopName}
                    onChange={(e) => setShopName(e.target.value)}
                    placeholder="Enter your shop name"
                    className={INPUT_CLS + " pl-10"}
                    style={INPUT_STYLE}
                  />
                </div>
              </div>

              {/* Shop Address */}
              <div>
                <label className="text-xs font-bold block mb-1.5" style={{ color: "hsl(var(--muted-foreground))" }}>
                  Shop Address
                </label>
                <div className="relative">
                  <MapPin
                    className="w-4 h-4 absolute left-3.5 top-3.5"
                    style={{ color: "hsl(var(--muted-foreground))" }}
                  />
                  <textarea
                    value={shopAddress}
                    onChange={(e) => setShopAddress(e.target.value)}
                    placeholder="enter your shop address"
                    rows={2}
                    className={INPUT_CLS + " pl-10 resize-none"}
                    style={INPUT_STYLE}
                  />
                </div>
              </div>

              {/* Mobile Number */}
              <div>
                <label className="text-xs font-bold block mb-1.5" style={{ color: "hsl(var(--muted-foreground))" }}>
                  Mobile Number
                </label>
                <div className="relative">
                  <Smartphone
                    className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2"
                    style={{ color: "hsl(var(--muted-foreground))" }}
                  />
                  <input
                    value={shopPhone}
                    onChange={(e) => setShopPhone(e.target.value)}
                    placeholder="enter your Mobile number"
                    className={INPUT_CLS + " pl-10"}
                    style={INPUT_STYLE}
                  />
                </div>
              </div>

              {/* Currency */}
              <div>
                <label className="text-xs font-bold block mb-1.5" style={{ color: "hsl(var(--muted-foreground))" }}>
                  Currency
                </label>
                <div className="relative" ref={currencyRef}>
                  <button
                    type="button"
                    onClick={() => {
                      setCurrencyOpen((v) => !v);
                      setCurrencySearch("");
                    }}
                    className={INPUT_CLS + " pl-10 pr-4 text-left flex items-center justify-between"}
                    style={{
                      ...INPUT_STYLE,
                      borderColor: currencyOpen ? "hsl(var(--primary))" : "hsl(var(--border))",
                    }}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <Globe className="w-4 h-4 flex-shrink-0" style={{ color: "hsl(var(--muted-foreground))" }} />
                      {selectedCurr ? (
                        <span className="truncate">
                          <strong>{selectedCurr.symbol}</strong> {selectedCurr.code} — {selectedCurr.name}
                        </span>
                      ) : (
                        <span style={{ color: "hsl(var(--muted-foreground))" }}>Select currency</span>
                      )}
                    </div>
                  </button>

                  {/* Dropdown panel */}
                  {currencyOpen && (
                    <div
                      className="absolute z-50 left-0 right-0 top-full mt-1 rounded-2xl border shadow-xl overflow-hidden"
                      style={{ background: "hsl(var(--card))", borderColor: "hsl(var(--primary))" }}
                    >
                      <div className="p-2 border-b" style={{ borderColor: "hsl(var(--border))" }}>
                        <div className="relative">
                          <Search
                            className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2"
                            style={{ color: "hsl(var(--muted-foreground))" }}
                          />
                          <input
                            autoFocus
                            value={currencySearch}
                            onChange={(e) => setCurrencySearch(e.target.value)}
                            placeholder="Search currency..."
                            className="w-full pl-9 pr-9 py-2 text-sm rounded-xl border outline-none"
                            style={{ borderColor: "hsl(var(--border))", background: "hsl(var(--background))" }}
                          />
                          {currencySearch && (
                            <button
                              type="button"
                              onClick={() => setCurrencySearch("")}
                              className="absolute right-2 top-1/2 -translate-y-1/2"
                            >
                              <X className="w-3.5 h-3.5" style={{ color: "hsl(var(--muted-foreground))" }} />
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="max-h-48 overflow-y-auto">
                        {(() => {
                          const q = currencySearch.toLowerCase();
                          const filtered = q
                            ? CURRENCIES.filter(
                                (c) =>
                                  c.code.toLowerCase().includes(q) ||
                                  c.name.toLowerCase().includes(q) ||
                                  c.symbol.toLowerCase().includes(q)
                              )
                            : CURRENCIES;
                          if (filtered.length === 0)
                            return (
                              <p
                                className="text-center py-4 text-xs"
                                style={{ color: "hsl(var(--muted-foreground))" }}
                              >
                                No currencies found
                              </p>
                            );
                          return filtered.map((c) => (
                            <button
                              key={c.code}
                              type="button"
                              onClick={() => {
                                setCurrency(c.code);
                                setCurrencyOpen(false);
                                setCurrencySearch("");
                              }}
                              className="w-full text-left px-4 py-2 text-xs flex items-center gap-2 hover:bg-muted/60 transition-colors"
                              style={
                                currency === c.code
                                  ? { background: "hsl(var(--primary) / 0.12)", fontWeight: 700 }
                                  : {}
                              }
                            >
                              <span className="w-7 text-center font-mono font-bold flex-shrink-0">{c.symbol}</span>
                              <span className="font-bold w-10 flex-shrink-0">{c.code}</span>
                              <span className="truncate flex-1" style={{ color: "hsl(var(--muted-foreground))" }}>
                                {c.name}
                              </span>
                              {currency === c.code && (
                                <Check
                                  className="w-3.5 h-3.5 ml-auto flex-shrink-0"
                                  style={{ color: "hsl(var(--primary))" }}
                                />
                              )}
                            </button>
                          ));
                        })()}
                      </div>
                    </div>
                  )}
                </div>
                {selectedCurr && (
                  <p className="text-xs mt-1.5" style={{ color: "hsl(var(--muted-foreground))" }}>
                    Prices will display as: <strong>{selectedCurr.symbol}1,000</strong>
                  </p>
                )}
              </div>

              {settingsError && (
                <p className="text-xs font-semibold" style={{ color: "hsl(var(--destructive))" }}>
                  {settingsError}
                </p>
              )}

              <button
                type="submit"
                disabled={settingsSaving}
                className="w-full py-3.5 rounded-xl font-bold text-sm text-white transition-all disabled:opacity-60 flex items-center justify-center gap-2 shadow-xs"
                style={{ background: "hsl(var(--primary))" }}
              >
                {settingsOk ? (
                  <>
                    <Check className="w-4 h-4" /> Saved!
                  </>
                ) : settingsSaving ? (
                  "Saving…"
                ) : (
                  "Save Changes"
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Password Modal */}
      {passOpen && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-xs" onClick={() => setPassOpen(false)} />
          <div
            className="relative w-full max-w-md rounded-t-3xl md:rounded-3xl shadow-2xl overflow-hidden"
            style={{ background: "hsl(var(--card))" }}
          >
            <div
              className="flex items-center justify-between px-6 pt-5 pb-4 border-b"
              style={{ borderColor: "hsl(var(--border))" }}
            >
              <div>
                <h3 className="font-extrabold text-lg">Change Password</h3>
                <p className="text-xs mt-0.5" style={{ color: "hsl(var(--muted-foreground))" }}>
                  Keep your account secure
                </p>
              </div>
              <button
                onClick={() => setPassOpen(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-muted transition-colors"
                style={{ background: "hsl(var(--muted))" }}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handlePassword} className="p-6 flex flex-col gap-4">
              <div>
                <label className="text-xs font-bold block mb-1.5" style={{ color: "hsl(var(--muted-foreground))" }}>
                  Current Password *
                </label>
                <div className="relative">
                  <input
                    value={passOld}
                    onChange={(e) => setPassOld(e.target.value)}
                    required
                    type={passShowOld ? "text" : "password"}
                    placeholder="Current password"
                    className={INPUT_CLS + " pr-10"}
                    style={INPUT_STYLE}
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                    onClick={() => setPassShowOld((v) => !v)}
                  >
                    {passShowOld ? (
                      <EyeOff className="w-4 h-4" style={{ color: "hsl(var(--muted-foreground))" }} />
                    ) : (
                      <Eye className="w-4 h-4" style={{ color: "hsl(var(--muted-foreground))" }} />
                    )}
                  </button>
                </div>
              </div>
              <div>
                <label className="text-xs font-bold block mb-1.5" style={{ color: "hsl(var(--muted-foreground))" }}>
                  New Password *
                </label>
                <div className="relative">
                  <input
                    value={passNew}
                    onChange={(e) => setPassNew(e.target.value)}
                    required
                    type={passShowNew ? "text" : "password"}
                    placeholder="New password (min 8 chars)"
                    className={INPUT_CLS + " pr-10"}
                    style={INPUT_STYLE}
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                    onClick={() => setPassShowNew((v) => !v)}
                  >
                    {passShowNew ? (
                      <EyeOff className="w-4 h-4" style={{ color: "hsl(var(--muted-foreground))" }} />
                    ) : (
                      <Eye className="w-4 h-4" style={{ color: "hsl(var(--muted-foreground))" }} />
                    )}
                  </button>
                </div>
              </div>
              <div>
                <label className="text-xs font-bold block mb-1.5" style={{ color: "hsl(var(--muted-foreground))" }}>
                  Confirm New Password *
                </label>
                <input
                  value={passConfirm}
                  onChange={(e) => setPassConfirm(e.target.value)}
                  required
                  type="password"
                  placeholder="Repeat new password"
                  className={INPUT_CLS}
                  style={INPUT_STYLE}
                />
              </div>
              {passError && (
                <p className="text-xs font-semibold" style={{ color: "hsl(var(--destructive))" }}>
                  {passError}
                </p>
              )}
              <button
                type="submit"
                disabled={passSaving}
                className="py-3.5 rounded-xl font-bold text-sm text-white disabled:opacity-60 shadow-xs"
                style={{ background: "hsl(var(--primary))" }}
              >
                {passOk ? "✓ Password Changed!" : passSaving ? "Saving…" : "Change Password"}
              </button>
            </form>
          </div>
        </div>
      )}
    </ProtectedPage>
  );
}
