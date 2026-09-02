import { useState, useEffect, useCallback } from "react";
import { Wrench, Store, Check, Building2, Coins, ArrowRight, MapPin, Loader2 } from "lucide-react";
import { useAuth } from "@/context/auth-context";
import posCertLogo from "@/assets/pos-cert-logo.png";

const COMMON_CURRENCIES = [
  { code: "BDT", symbol: "Tk", name: "Bangladeshi Taka" },
  { code: "USD", symbol: "$",  name: "US Dollar" },
  { code: "INR", symbol: "₹",  name: "Indian Rupee" },
  { code: "SAR", symbol: "﷼",  name: "Saudi Riyal" },
  { code: "AED", symbol: "د.إ", name: "UAE Dirham" },
  { code: "OMR", symbol: "ر.ع.", name: "Omani Rial" },
  { code: "QAR", symbol: "﷼",  name: "Qatari Riyal" },
  { code: "KWD", symbol: "د.ك", name: "Kuwaiti Dinar" },
  { code: "EUR", symbol: "€",  name: "Euro" },
  { code: "GBP", symbol: "£",  name: "British Pound" },
  { code: "MYR", symbol: "RM", name: "Malaysian Ringgit" },
  { code: "PKR", symbol: "₨",  name: "Pakistani Rupee" },
];

// Helper to determine currency from timezone or coordinates
function detectCurrencyFromTimezone(): string {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "";
    const lowerTz = tz.toLowerCase();

    if (lowerTz.includes("dhaka") || lowerTz.includes("bangladesh")) return "BDT";
    if (lowerTz.includes("kolkata") || lowerTz.includes("calcutta") || lowerTz.includes("india")) return "INR";
    if (lowerTz.includes("riyadh") || lowerTz.includes("saudi")) return "SAR";
    if (lowerTz.includes("dubai") || lowerTz.includes("uae") || lowerTz.includes("muscat") && tz.includes("Dubai")) return "AED";
    if (lowerTz.includes("muscat") || lowerTz.includes("oman")) return "OMR";
    if (lowerTz.includes("qatar") || lowerTz.includes("doha")) return "QAR";
    if (lowerTz.includes("kuwait")) return "KWD";
    if (lowerTz.includes("kuala_lumpur") || lowerTz.includes("malaysia")) return "MYR";
    if (lowerTz.includes("karachi") || lowerTz.includes("pakistan")) return "PKR";
    if (lowerTz.includes("london") || lowerTz.includes("britain") || lowerTz.includes("gb")) return "GBP";
    if (
      lowerTz.includes("europe") ||
      lowerTz.includes("berlin") ||
      lowerTz.includes("paris") ||
      lowerTz.includes("rome") ||
      lowerTz.includes("madrid") ||
      lowerTz.includes("amsterdam")
    ) {
      return "EUR";
    }
  } catch {}
  return "USD";
}

function detectCurrencyFromCoords(lat: number, lon: number): string | null {
  // Bangladesh approx bbox
  if (lat >= 20.5 && lat <= 26.8 && lon >= 88.0 && lon <= 92.8) return "BDT";
  // India approx bbox
  if (lat >= 6.5 && lat <= 36.0 && lon >= 68.0 && lon <= 97.5) return "INR";
  // Saudi Arabia approx bbox
  if (lat >= 16.0 && lat <= 32.5 && lon >= 34.5 && lon <= 55.8) return "SAR";
  // UAE approx bbox
  if (lat >= 22.5 && lat <= 26.2 && lon >= 51.5 && lon <= 56.6) return "AED";
  // Oman approx bbox
  if (lat >= 16.5 && lat <= 26.5 && lon >= 52.0 && lon <= 60.0) return "OMR";
  // Qatar approx bbox
  if (lat >= 24.5 && lat <= 26.3 && lon >= 50.7 && lon <= 51.7) return "QAR";
  // Kuwait approx bbox
  if (lat >= 28.5 && lat <= 30.2 && lon >= 46.5 && lon <= 48.5) return "KWD";
  // Malaysia approx bbox
  if (lat >= 1.0 && lat <= 7.5 && lon >= 99.5 && lon <= 119.5) return "MYR";
  // Pakistan approx bbox
  if (lat >= 23.5 && lat <= 37.0 && lon >= 60.5 && lon <= 77.0) return "PKR";
  // UK approx bbox
  if (lat >= 49.8 && lat <= 60.9 && lon >= -8.6 && lon <= 1.8) return "GBP";
  // Europe approx bbox
  if (lat >= 35.0 && lat <= 70.0 && lon >= -10.0 && lon <= 40.0) return "EUR";
  return null;
}

export function OnboardingModal() {
  const { user, refreshUser } = useAuth();
  const [open, setOpen] = useState(false);
  const [businessType, setBusinessType] = useState<"mobile_repair" | "general_store">("mobile_repair");
  const [shopName, setShopName] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [detectingLocation, setDetectingLocation] = useState(false);
  const [detectedSource, setDetectedSource] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Auto-detect currency via GPS and Timezone
  const autoDetectCurrency = useCallback(() => {
    // 1. Initial fast fallback from Timezone
    const tzCurrency = detectCurrencyFromTimezone();
    if (tzCurrency && tzCurrency !== "USD") {
      setCurrency(tzCurrency);
      setDetectedSource("Timezone / Region");
    }

    // 2. Request GPS Geolocation for precision
    if (typeof navigator !== "undefined" && navigator.geolocation) {
      setDetectingLocation(true);
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          setDetectingLocation(false);
          const { latitude, longitude } = position.coords;
          // Direct coordinate bbox check
          const bboxCurrency = detectCurrencyFromCoords(latitude, longitude);
          if (bboxCurrency) {
            setCurrency(bboxCurrency);
            setDetectedSource("GPS Location");
            return;
          }

          // Optional reverse-geocode
          try {
            const res = await fetch(
              `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
            );
            if (res.ok) {
              const data = await res.json();
              const countryCode = data.countryCode?.toUpperCase();
              const map: Record<string, string> = {
                BD: "BDT",
                IN: "INR",
                SA: "SAR",
                AE: "AED",
                OM: "OMR",
                QA: "QAR",
                KW: "KWD",
                MY: "MYR",
                PK: "PKR",
                GB: "GBP",
                US: "USD",
                DE: "EUR",
                FR: "EUR",
                IT: "EUR",
                ES: "EUR",
              };
              if (countryCode && map[countryCode]) {
                setCurrency(map[countryCode]);
                setDetectedSource(`GPS: ${data.countryName || countryCode}`);
              }
            }
          } catch {
            // Geocode fallback kept
          }
        },
        () => {
          // GPS denied/failed, keep timezone detection
          setDetectingLocation(false);
        },
        { timeout: 8000, enableHighAccuracy: false, maximumAge: 60000 }
      );
    }
  }, []);

  // Lock background scroll when modal is open
  useEffect(() => {
    if (open) {
      const originalOverflow = document.body.style.overflow;
      const originalTouchAction = document.body.style.touchAction;
      document.body.style.overflow = "hidden";
      document.body.style.touchAction = "none";
      return () => {
        document.body.style.overflow = originalOverflow;
        document.body.style.touchAction = originalTouchAction;
      };
    }
  }, [open]);

  useEffect(() => {
    if (!user || !user.id) return;
    const storageKey = `cf_onboarding_completed_${user.id}`;
    const isCompleted = localStorage.getItem(storageKey);
    
    // If onboarding not completed in localStorage and user has no custom shopName or needs setup
    if (!isCompleted) {
      if (!user.shopName || user.shopName.trim() === "") {
        setBusinessType(user.businessType === "general_store" ? "general_store" : "mobile_repair");
        setShopName(user.name ? `${user.name}'s Shop` : "");
        
        if (user.currency) {
          setCurrency(user.currency);
        } else {
          autoDetectCurrency();
        }
        setOpen(true);
      } else {
        localStorage.setItem(storageKey, "1");
      }
    }
  }, [user, autoDetectCurrency]);

  if (!open || !user) return null;

  async function handleComplete() {
    const trimmedName = shopName.trim();
    if (!trimmedName) {
      setError("Shop / Business Name is mandatory. Please enter your shop name.");
      return;
    }
    setError("");
    setSaving(true);
    try {
      const res = await fetch("/api/auth/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          shopName: trimmedName,
          businessType,
          currency,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to save settings");
      }

      if (user?.id) {
        localStorage.setItem(`cf_onboarding_completed_${user.id}`, "1");
      }
      setOpen(false);
      await refreshUser();
    } catch (err: any) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md overflow-y-auto overscroll-contain animate-in fade-in duration-200"
      onClick={(e) => e.stopPropagation()}
    >
      <div
        className="w-full max-w-lg rounded-3xl p-6 md:p-8 shadow-2xl space-y-6 overflow-hidden border border-border my-auto"
        style={{ background: "hsl(var(--card))", color: "hsl(var(--card-foreground))" }}
      >
        {/* Header with App Logo */}
        <div className="text-center space-y-2">
          <div className="mx-auto flex items-center justify-center">
            <img
              src={posCertLogo}
              alt="PosCert Logo"
              className="w-14 h-14 rounded-2xl object-contain shadow-lg ring-2 ring-primary/20"
              onError={(e) => {
                // Fallback to favicon if logo png loading fails
                (e.target as HTMLImageElement).src = "/favicon.svg";
              }}
            />
          </div>
          <h2 className="text-xl md:text-2xl font-extrabold tracking-tight">
            Welcome to PosCert!
          </h2>
          <p className="text-xs md:text-sm text-muted-foreground">
            Let's configure your business profile to personalize your experience.
          </p>
        </div>

        {/* Business Type Selector */}
        <div className="space-y-2.5">
          <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
            Select Your Business Type
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Mobile Repair Option */}
            <button
              type="button"
              onClick={() => setBusinessType("mobile_repair")}
              className={`flex flex-col items-start p-4 rounded-2xl border text-left transition-all relative ${
                businessType === "mobile_repair"
                  ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                  : "border-border hover:border-primary/40 bg-card"
              }`}
            >
              <div className="flex items-center justify-between w-full mb-2">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                    businessType === "mobile_repair" ? "bg-primary text-white" : "bg-muted text-foreground"
                  }`}
                >
                  <Wrench className="w-4 h-4" />
                </div>
                {businessType === "mobile_repair" && (
                  <div className="w-5 h-5 rounded-full bg-primary text-white flex items-center justify-center">
                    <Check className="w-3 h-3 stroke-[3]" />
                  </div>
                )}
              </div>
              <p className="font-bold text-sm text-foreground">Mobile Repair & Lab</p>
              <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">
                Repairs tracking, combo finder, pinouts & spare parts.
              </p>
            </button>

            {/* General Store Option */}
            <button
              type="button"
              onClick={() => setBusinessType("general_store")}
              className={`flex flex-col items-start p-4 rounded-2xl border text-left transition-all relative ${
                businessType === "general_store"
                  ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                  : "border-border hover:border-primary/40 bg-card"
              }`}
            >
              <div className="flex items-center justify-between w-full mb-2">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                    businessType === "general_store" ? "bg-primary text-white" : "bg-muted text-foreground"
                  }`}
                >
                  <Store className="w-4 h-4" />
                </div>
                {businessType === "general_store" && (
                  <div className="w-5 h-5 rounded-full bg-primary text-white flex items-center justify-center">
                    <Check className="w-3 h-3 stroke-[3]" />
                  </div>
                )}
              </div>
              <p className="font-bold text-sm text-foreground">General Store & Retail</p>
              <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">
                Barcode POS, stock in, customer ledger & sales reports.
              </p>
            </button>
          </div>
        </div>

        {/* Shop Name & Currency */}
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-foreground flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-primary" /> Shop / Business Name{" "}
                <span className="text-destructive font-black">*</span>
              </span>
              <span className="text-[10px] font-semibold text-destructive uppercase tracking-wider">Required</span>
            </label>
            <input
              type="text"
              value={shopName}
              onChange={(e) => {
                setShopName(e.target.value);
                if (error) setError("");
              }}
              required
              placeholder="e.g. Mubarok Telecom"
              className={`w-full px-4 py-3 rounded-xl border text-sm font-medium outline-none transition-all focus:ring-2 ${
                !shopName.trim() && error
                  ? "border-destructive focus:ring-destructive/20"
                  : "focus:ring-primary/20 focus:border-primary"
              }`}
              style={{
                borderColor: !shopName.trim() && error ? "hsl(var(--destructive))" : "hsl(var(--border))",
                background: "hsl(var(--background))",
                color: "hsl(var(--foreground))",
              }}
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <Coins className="w-3.5 h-3.5 text-primary" /> Currency
              </label>
              {detectingLocation ? (
                <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                  <Loader2 className="w-3 h-3 animate-spin text-primary" />
                  Auto-detecting GPS...
                </span>
              ) : detectedSource ? (
                <span className="text-[10px] font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-md flex items-center gap-1">
                  <MapPin className="w-3 h-3" /> {detectedSource}
                </span>
              ) : null}
            </div>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border text-sm font-medium outline-none transition-all focus:ring-2 focus:ring-primary/20 focus:border-primary"
              style={{
                borderColor: "hsl(var(--border))",
                background: "hsl(var(--background))",
                color: "hsl(var(--foreground))",
              }}
            >
              {COMMON_CURRENCIES.map((curr) => (
                <option key={curr.code} value={curr.code}>
                  {curr.code} ({curr.symbol}) — {curr.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {error && (
          <p className="text-xs text-destructive text-center font-semibold bg-destructive/10 py-2.5 px-3 rounded-xl border border-destructive/20">
            {error}
          </p>
        )}

        {/* Submit button */}
        <button
          type="button"
          disabled={saving || !shopName.trim()}
          onClick={handleComplete}
          className="w-full py-3.5 px-4 rounded-xl font-bold text-white text-sm flex items-center justify-center gap-2 shadow-lg transition-all active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          style={{ background: "hsl(var(--primary))" }}
        >
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" /> Saving Setup...
            </>
          ) : (
            <>
              Get Started <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>
    </div>
  );
}
