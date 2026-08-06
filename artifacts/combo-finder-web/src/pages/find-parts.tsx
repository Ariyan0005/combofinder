import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  MapPin, Phone, Globe, Star, CheckCircle, Search, ChevronDown,
  ArrowLeft, MessageCircle, X, Send, Store,
} from "lucide-react";
import { Link } from "wouter";
import { useAuth } from "@/context/auth-context";

// ── Types ─────────────────────────────────────────────────────────────────────
interface PartsSupplier {
  id: number;
  name: string;
  country: string;
  city: string;
  whatsapp?: string | null;
  partTypes?: string | null;
  website?: string | null;
  isVerified: boolean;
  avgRating: string;
  reviewCount: number;
}

// ── Star Rating Display ───────────────────────────────────────────────────────
function StarRating({ value, size = 14 }: { value: number; size?: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <Star
          key={i}
          style={{ width: size, height: size }}
          fill={i <= Math.round(value) ? "#F59E0B" : "none"}
          stroke={i <= Math.round(value) ? "#F59E0B" : "hsl(var(--muted-foreground))"}
          strokeWidth={1.5}
        />
      ))}
    </div>
  );
}

// ── Supplier Card ─────────────────────────────────────────────────────────────
function SupplierCard({ supplier, onReview }: { supplier: PartsSupplier; onReview: (s: PartsSupplier) => void }) {
  const parts = supplier.partTypes
    ? supplier.partTypes.split(",").map(p => p.trim()).filter(Boolean)
    : [];
  const avg = Number(supplier.avgRating ?? 0);

  return (
    <div
      className="rounded-2xl border p-4 space-y-3"
      style={{ borderColor: "hsl(var(--border))", background: "hsl(var(--card))" }}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3 min-w-0">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: "hsl(var(--primary) / 0.1)" }}
          >
            <Store className="w-5 h-5" style={{ color: "hsl(var(--primary))" }} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <p className="text-sm font-bold truncate">{supplier.name}</p>
              {supplier.isVerified && (
                <span className="flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0"
                  style={{ background: "#ECFDF5", color: "#059669" }}>
                  <CheckCircle className="w-3 h-3" />
                  Verified
                </span>
              )}
            </div>
            <div className="flex items-center gap-1 mt-0.5">
              <MapPin className="w-3 h-3 flex-shrink-0" style={{ color: "hsl(var(--muted-foreground))" }} />
              <p className="text-xs truncate" style={{ color: "hsl(var(--muted-foreground))" }}>
                {supplier.city}, {supplier.country}
              </p>
            </div>
          </div>
        </div>

        {/* Rating */}
        <div className="flex flex-col items-end gap-0.5 flex-shrink-0">
          <StarRating value={avg} />
          <p className="text-[10px]" style={{ color: "hsl(var(--muted-foreground))" }}>
            {avg > 0 ? avg.toFixed(1) : "No ratings"} {supplier.reviewCount > 0 ? `(${supplier.reviewCount})` : ""}
          </p>
        </div>
      </div>

      {/* Part types */}
      {parts.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {parts.map(p => (
            <span key={p} className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
              style={{ background: "hsl(var(--primary) / 0.08)", color: "hsl(var(--primary))" }}>
              {p}
            </span>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2 pt-1">
        {supplier.whatsapp && (
          <a
            href={`https://wa.me/${supplier.whatsapp.replace(/\D/g, "")}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold text-white"
            style={{ background: "#25D366" }}
          >
            <MessageCircle className="w-3.5 h-3.5" />
            WhatsApp
          </a>
        )}
        {supplier.website && (
          <a
            href={supplier.website.startsWith("http") ? supplier.website : `https://${supplier.website}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border text-xs font-bold"
            style={{ borderColor: "hsl(var(--border))", color: "hsl(var(--foreground))", background: "hsl(var(--background))" }}
          >
            <Globe className="w-3.5 h-3.5" />
            Website
          </a>
        )}
        <button
          onClick={() => onReview(supplier)}
          className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border text-xs font-bold"
          style={{ borderColor: "hsl(var(--border))", color: "hsl(var(--muted-foreground))", background: "hsl(var(--background))" }}
        >
          <Star className="w-3.5 h-3.5" />
          Rate
        </button>
      </div>
    </div>
  );
}

// ── Review Modal ──────────────────────────────────────────────────────────────
function ReviewModal({ supplier, onClose }: { supplier: PartsSupplier; onClose: () => void }) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");

  const mut = useMutation({
    mutationFn: () =>
      fetch(`/api/parts-suppliers/${supplier.id}/reviews`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating, comment }),
      }).then(r => r.json()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["parts-suppliers"] });
      onClose();
    },
  });

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center md:items-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-t-2xl md:rounded-2xl p-5 space-y-4"
        style={{ background: "hsl(var(--card))" }}>
        <div className="flex items-center justify-between">
          <p className="font-bold text-sm">Rate {supplier.name}</p>
          <button onClick={onClose} className="w-7 h-7 rounded-full flex items-center justify-center"
            style={{ background: "hsl(var(--muted))" }}>
            <X className="w-4 h-4" style={{ color: "hsl(var(--muted-foreground))" }} />
          </button>
        </div>

        {!user ? (
          <p className="text-sm text-center py-4" style={{ color: "hsl(var(--muted-foreground))" }}>
            Please{" "}
            <Link href="/login" onClick={onClose}>
              <span className="font-bold" style={{ color: "hsl(var(--primary))" }}>log in</span>
            </Link>{" "}
            to leave a review.
          </p>
        ) : (
          <>
            {/* Star picker */}
            <div className="flex justify-center gap-2">
              {[1, 2, 3, 4, 5].map(i => (
                <button key={i} onClick={() => setRating(i)}>
                  <Star
                    className="w-8 h-8 transition-all"
                    fill={i <= rating ? "#F59E0B" : "none"}
                    stroke={i <= rating ? "#F59E0B" : "hsl(var(--muted-foreground))"}
                    strokeWidth={1.5}
                  />
                </button>
              ))}
            </div>

            <textarea
              value={comment}
              onChange={e => setComment(e.target.value)}
              placeholder="Add a comment (optional)..."
              rows={3}
              className="w-full px-3 py-2.5 rounded-xl border text-sm resize-none outline-none"
              style={{ borderColor: "hsl(var(--border))", background: "hsl(var(--background))" }}
            />

            <button
              onClick={() => mut.mutate()}
              disabled={mut.isPending}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm text-white"
              style={{ background: "hsl(var(--primary))", opacity: mut.isPending ? 0.7 : 1 }}
            >
              <Send className="w-4 h-4" />
              {mut.isPending ? "Submitting…" : "Submit Review"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function FindParts() {
  const [detectedCountry, setDetectedCountry] = useState<string | null>(null);
  const [selectedCountry, setSelectedCountry] = useState<string>("");
  const [cityQuery, setCityQuery] = useState<string>("");
  const [reviewTarget, setReviewTarget] = useState<PartsSupplier | null>(null);

  // IP-based country detection
  useEffect(() => {
    fetch("https://ipapi.co/json/")
      .then(r => r.json())
      .then(d => {
        if (d?.country_name) {
          setDetectedCountry(d.country_name);
          setSelectedCountry(d.country_name);
        }
      })
      .catch(() => {}); // silently fail
  }, []);

  // Fetch available countries
  const { data: countries = [] } = useQuery<string[]>({
    queryKey: ["parts-suppliers-countries"],
    queryFn: () => fetch("/api/parts-suppliers/countries").then(r => {
      if (!r.ok) throw new Error("Failed");
      return r.json();
    }),
  });

  // Fetch suppliers
  const params = new URLSearchParams();
  if (selectedCountry) params.set("country", selectedCountry);
  if (cityQuery.trim()) params.set("city", cityQuery.trim());

  const { data: rawSuppliers, isLoading } = useQuery<PartsSupplier[]>({
    queryKey: ["parts-suppliers", selectedCountry, cityQuery],
    queryFn: () => fetch(`/api/parts-suppliers?${params}`).then(r => {
      if (!r.ok) throw new Error("Failed");
      return r.json();
    }),
  });
  const suppliers = Array.isArray(rawSuppliers) ? rawSuppliers : [];

  const PRIMARY = "hsl(var(--primary))";

  return (
    <div className="space-y-4 pb-8">
      {/* Header */}
      <div className="flex items-center gap-3 pt-1">
        <h1 className="text-xl font-extrabold">Find Parts</h1>
      </div>

      {/* Promo Banner */}
      <div
        className="rounded-2xl p-4 relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--primary) / 0.75) 100%)" }}
      >
        <div className="relative z-10 space-y-1">
          <p className="text-white font-extrabold text-sm leading-snug">
            Are you a Mobile Parts Wholesaler?
          </p>
          <p className="text-white/80 text-xs leading-relaxed">
            List your phone parts & accessories store here and reach thousands of repair technicians across your country.
            LCD screens, batteries, charging ports, ICs, flex cables, cameras — any mobile spare parts welcome.
          </p>
          <a
            href="https://wa.me/96897043234"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 mt-2 bg-white text-xs font-bold px-3 py-1.5 rounded-full"
            style={{ color: "hsl(var(--primary))" }}
          >
            <MessageCircle className="w-3.5 h-3.5" />
            Contact Admin to Get Listed
          </a>
        </div>
        {/* decorative circle */}
        <div className="absolute -right-6 -top-6 w-28 h-28 rounded-full bg-white/10 pointer-events-none" />
        <div className="absolute -right-2 -bottom-8 w-20 h-20 rounded-full bg-white/10 pointer-events-none" />
      </div>

      {/* IP detection note */}
      {detectedCountry && (
        <p className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>
          Showing results for <span className="font-semibold">{detectedCountry}</span> based on your location.
        </p>
      )}

      {/* Filters */}
      <div className="flex gap-2">
        {/* Country */}
        <div className="flex-1 relative">
          <select
            value={selectedCountry}
            onChange={e => setSelectedCountry(e.target.value)}
            className="w-full appearance-none px-3 py-2.5 rounded-xl border text-xs font-medium pr-8 outline-none"
            style={{ borderColor: "hsl(var(--border))", background: "hsl(var(--card))", color: "hsl(var(--foreground))" }}
          >
            <option value="">All Countries</option>
            {countries.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none"
            style={{ color: "hsl(var(--muted-foreground))" }} />
        </div>

        {/* City */}
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none"
            style={{ color: "hsl(var(--muted-foreground))" }} />
          <input
            type="text"
            value={cityQuery}
            onChange={e => setCityQuery(e.target.value)}
            placeholder="Filter by city..."
            className="w-full pl-8 pr-3 py-2.5 rounded-xl border text-xs outline-none"
            style={{ borderColor: "hsl(var(--border))", background: "hsl(var(--card))", color: "hsl(var(--foreground))" }}
          />
        </div>
      </div>

      {/* Results */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-40 rounded-2xl animate-pulse" style={{ background: "hsl(var(--muted))" }} />
          ))}
        </div>
      ) : suppliers.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center rounded-2xl border border-dashed"
          style={{ borderColor: "hsl(var(--border))" }}>
          <Store className="w-12 h-12 mb-3 opacity-20" style={{ color: "hsl(var(--foreground))" }} />
          <p className="text-sm font-semibold">No suppliers found</p>
          <p className="text-xs mt-1" style={{ color: "hsl(var(--muted-foreground))" }}>
            {selectedCountry
              ? `No mobile parts suppliers listed for ${selectedCountry} yet.`
              : "Select a country to find local suppliers."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {suppliers.map(s => (
            <SupplierCard key={s.id} supplier={s} onReview={setReviewTarget} />
          ))}
        </div>
      )}

      {/* Review modal */}
      {reviewTarget && (
        <ReviewModal supplier={reviewTarget} onClose={() => setReviewTarget(null)} />
      )}
    </div>
  );
}
