import { useState, type FormEvent } from "react";
import { Link, useLocation } from "wouter";
import { Eye, EyeOff, Smartphone, Globe, MessageCircle } from "lucide-react";
import { useAuth } from "@/context/auth-context";

const WHATSAPP_URL = "https://wa.me/96897043234";

export default function Login() {
  const { login } = useAuth();
  const [, navigate] = useLocation();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [lang, setLang] = useState<"en" | "bn">("en");

  const t = {
    en: {
      welcome: "Welcome Back!",
      sub: "Login to your account",
      emailLabel: "Email or Username",
      emailPh: "Enter your email or username",
      passLabel: "Password",
      passPh: "Enter your password",
      forgot: "Forgot Password?",
      remember: "Remember me",
      btn: "Login",
      btnLoading: "Logging in…",
      noAccount: "Don't have an account?",
      signUp: "Sign Up",
      support: "Support",
    },
    bn: {
      welcome: "স্বাগতম!",
      sub: "আপনার অ্যাকাউন্টে লগিন করুন",
      emailLabel: "ইমেইল বা ইউজারনেম",
      emailPh: "ইমেইল বা ইউজারনেম লিখুন",
      passLabel: "পাসওয়ার্ড",
      passPh: "পাসওয়ার্ড লিখুন",
      forgot: "পাসওয়ার্ড ভুলেছেন?",
      remember: "মনে রাখুন",
      btn: "লগিন",
      btnLoading: "লগিন হচ্ছে…",
      noAccount: "অ্যাকাউন্ট নেই?",
      signUp: "সাইন আপ",
      support: "সাপোর্ট",
    },
  }[lang];

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    if (!identifier || !password) { setError("All fields are required"); return; }
    setLoading(true);
    try {
      await login(identifier, password);
      navigate("/");
    } catch (err: any) {
      setError(err.message ?? "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "hsl(var(--background))" }}>

      {/* ── Top Navbar ── */}
      <header className="w-full px-4 py-3 flex items-center justify-between border-b"
        style={{ borderColor: "hsl(var(--border))", background: "hsl(var(--card))" }}>
        <Link href="/">
          <div className="flex items-center gap-2 cursor-pointer">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ background: "hsl(var(--primary))" }}>
              <Smartphone className="w-4 h-4 text-white" />
            </div>
            <span className="text-base font-extrabold" style={{ color: "hsl(var(--foreground))" }}>
              ComboFinder
            </span>
          </div>
        </Link>
        <div className="flex items-center gap-2">
          {/* Language switcher */}
          <button
            onClick={() => setLang(l => l === "en" ? "bn" : "en")}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border text-xs font-semibold transition-colors"
            style={{ borderColor: "hsl(var(--border))", color: "hsl(var(--muted-foreground))", background: "hsl(var(--background))" }}>
            <Globe className="w-3.5 h-3.5" />
            {lang === "en" ? "বাংলা" : "English"}
          </button>
          {/* Support */}
          <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border text-xs font-semibold transition-colors"
            style={{ borderColor: "hsl(var(--border))", color: "hsl(var(--muted-foreground))", background: "hsl(var(--background))" }}>
            <MessageCircle className="w-3.5 h-3.5" />
            {t.support}
          </a>
        </div>
      </header>

      {/* ── Form ── */}
      <div className="flex-1 flex flex-col items-center justify-center p-5">
        <div className="w-full max-w-sm">
          <div className="mb-6 text-center">
            <h1 className="text-2xl font-extrabold">{t.welcome}</h1>
            <p className="text-sm mt-1" style={{ color: "hsl(var(--muted-foreground))" }}>{t.sub}</p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="text-sm font-semibold block mb-1.5">{t.emailLabel}</label>
              <input
                type="text"
                placeholder={t.emailPh}
                value={identifier}
                onChange={e => setIdentifier(e.target.value)}
                className="w-full px-4 py-3.5 rounded-xl border text-sm outline-none transition-all"
                style={{ borderColor: "hsl(var(--border))", background: "hsl(var(--card))" }}
                onFocus={e => { e.currentTarget.style.borderColor = "hsl(var(--primary))"; }}
                onBlur={e => { e.currentTarget.style.borderColor = "hsl(var(--border))"; }}
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-sm font-semibold">{t.passLabel}</label>
                <Link href="/forgot-password">
                  <span className="text-xs font-semibold cursor-pointer" style={{ color: "hsl(var(--primary))" }}>
                    {t.forgot}
                  </span>
                </Link>
              </div>
              <div className="relative">
                <input
                  type={showPass ? "text" : "password"}
                  placeholder={t.passPh}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full px-4 py-3.5 pr-12 rounded-xl border text-sm outline-none transition-all"
                  style={{ borderColor: "hsl(var(--border))", background: "hsl(var(--card))" }}
                  onFocus={e => { e.currentTarget.style.borderColor = "hsl(var(--primary))"; }}
                  onBlur={e => { e.currentTarget.style.borderColor = "hsl(var(--border))"; }}
                />
                <button type="button" onClick={() => setShowPass(p => !p)}
                  className="absolute right-4 top-1/2 -translate-y-1/2"
                  style={{ color: "hsl(var(--muted-foreground))" }}>
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input type="checkbox" id="remember" className="rounded" />
              <label htmlFor="remember" className="text-sm cursor-pointer" style={{ color: "hsl(var(--muted-foreground))" }}>
                {t.remember}
              </label>
            </div>

            {error && (
              <p className="text-sm text-center px-3 py-2.5 rounded-xl font-medium"
                style={{ color: "hsl(var(--destructive))", background: "hsl(var(--destructive) / 0.08)" }}>
                {error}
              </p>
            )}

            <button type="submit" disabled={loading}
              className="w-full py-4 rounded-xl font-bold text-white text-sm transition-opacity disabled:opacity-60"
              style={{ background: "hsl(var(--primary))" }}>
              {loading ? t.btnLoading : t.btn}
            </button>
          </form>

          <p className="text-sm text-center mt-6" style={{ color: "hsl(var(--muted-foreground))" }}>
            {t.noAccount}{" "}
            <Link href="/register">
              <span className="font-bold cursor-pointer" style={{ color: "hsl(var(--primary))" }}>{t.signUp}</span>
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
