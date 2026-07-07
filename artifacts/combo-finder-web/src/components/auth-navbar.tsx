import { useState, useRef, useEffect } from "react";
import { Link } from "wouter";
import { Smartphone, ChevronDown, MessageCircle, Globe } from "lucide-react";

const WHATSAPP_URL = "https://wa.me/96897043234";

export type Lang = "en" | "bn" | "ar" | "hi";

const LANGUAGES: { code: Lang; label: string }[] = [
  { code: "en", label: "English" },
  { code: "bn", label: "বাংলা" },
  { code: "ar", label: "العربية" },
  { code: "hi", label: "हिंदी" },
];

interface Props {
  lang: Lang;
  onLangChange: (l: Lang) => void;
  supportLabel?: string;
}

export function AuthNavbar({ lang, onLangChange, supportLabel = "Support" }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const current = LANGUAGES.find(l => l.code === lang) ?? LANGUAGES[0];

  return (
    <header
      className="w-full px-4 py-3 flex items-center justify-between border-b"
      style={{ borderColor: "hsl(var(--border))", background: "hsl(var(--card))" }}
    >
      {/* Logo */}
      <Link href="/">
        <div className="flex items-center gap-2 cursor-pointer select-none">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ background: "hsl(var(--primary))" }}>
            <Smartphone className="w-4 h-4 text-white" />
          </div>
          <span className="text-base font-extrabold" style={{ color: "hsl(var(--foreground))" }}>
            ComboFinder
          </span>
        </div>
      </Link>

      {/* Right */}
      <div className="flex items-center gap-2">
        {/* Language dropdown — no globe, no flag */}
        <div className="relative" ref={ref}>
          <button
            onClick={() => setOpen(o => !o)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold"
            style={{
              borderColor: "hsl(var(--border))",
              color: "hsl(var(--foreground))",
              background: "hsl(var(--background))",
            }}
          >
            <Globe className="w-3.5 h-3.5" style={{ color: "hsl(var(--primary))" }} />
            {current.label}
            <ChevronDown
              className="w-3 h-3 transition-transform"
              style={{
                color: "hsl(var(--muted-foreground))",
                transform: open ? "rotate(180deg)" : "none",
              }}
            />
          </button>

          {open && (
            <div
              className="absolute right-0 mt-2 w-36 rounded-2xl border shadow-2xl z-[100] overflow-hidden"
              style={{ borderColor: "hsl(var(--border))", background: "hsl(var(--card))" }}
            >
              <div className="p-1.5 flex flex-col gap-0.5">
                {LANGUAGES.map(l => (
                  <button
                    key={l.code}
                    onClick={() => { onLangChange(l.code); setOpen(false); }}
                    className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold text-left transition-all"
                    style={{
                      color: l.code === lang ? "hsl(var(--primary))" : "hsl(var(--foreground))",
                      background: l.code === lang ? "hsl(var(--primary) / 0.12)" : "transparent",
                      direction: l.code === "ar" ? "rtl" : "ltr",
                    }}
                    onMouseEnter={e => { if (l.code !== lang) e.currentTarget.style.background = "hsl(var(--muted))"; }}
                    onMouseLeave={e => { e.currentTarget.style.background = l.code === lang ? "hsl(var(--primary) / 0.12)" : "transparent"; }}
                  >
                    <span>{l.label}</span>
                    {l.code === lang && (
                      <span className="w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold"
                        style={{ background: "hsl(var(--primary))", color: "#fff" }}>✓</span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Support */}
        <a
          href={WHATSAPP_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold"
          style={{
            borderColor: "hsl(var(--border))",
            color: "hsl(var(--foreground))",
            background: "hsl(var(--background))",
          }}
        >
          <MessageCircle className="w-3.5 h-3.5" style={{ color: "#25D366" }} />
          {supportLabel}
        </a>
      </div>
    </header>
  );
}
