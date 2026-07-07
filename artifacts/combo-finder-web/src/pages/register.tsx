import { useState, type FormEvent } from "react";
import { Link, useLocation } from "wouter";
import { Eye, EyeOff, Smartphone, Globe, MessageCircle } from "lucide-react";
import { useAuth } from "@/context/auth-context";

const WHATSAPP_URL = "https://wa.me/96897043234";

export default function Register() {
  const { register } = useAuth();
  const [, navigate] = useLocation();
  const [form, setForm] = useState({ email: "", password: "", confirmPassword: "" });
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState("");
  const [emailAlreadyExists, setEmailAlreadyExists] = useState(false);
  const [loading, setLoading] = useState(false);
  const [lang, setLang] = useState<"en" | "bn">("en");

  const t = {
    en: {
      title: "Create Account",
      sub: "Sign up to get started — it's free!",
      emailLabel: "Email",
      emailPh: "Enter your email",
      passLabel: "Password",
      passPh: "Min. 6 characters",
      confirmLabel: "Confirm Password",
      confirmPh: "Repeat your password",
      terms1: "I agree to the",
      terms2: "Terms of Service",
      terms3: "and",
      terms4: "Privacy Policy",
      btn: "Create Account",
      btnLoading: "Creating account…",
      haveAccount: "Already have an account?",
      login: "Login",
      support: "Support",
      dupEmail: "This email is already registered.",
      dupLoginCta: "Login instead →",
    },
    bn: {
      title: "অ্যাকাউন্ট তৈরি করুন",
      sub: "সাইন আপ করুন — সম্পূর্ণ বিনামূল্যে!",
      emailLabel: "ইমেইল",
      emailPh: "ইমেইল লিখুন",
      passLabel: "পাসওয়ার্ড",
      passPh: "কমপক্ষে ৬ অক্ষর",
      confirmLabel: "পাসওয়ার্ড নিশ্চিত করুন",
      confirmPh: "পাসওয়ার্ড আবার লিখুন",
      terms1: "আমি সম্মত",
      terms2: "সেবার শর্তাবলী",
      terms3: "এবং",
      terms4: "গোপনীয়তা নীতি",
      btn: "অ্যাকাউন্ট তৈরি করুন",
      btnLoading: "তৈরি হচ্ছে…",
      haveAccount: "আগে থেকে অ্যাকাউন্ট আছে?",
      login: "লগিন করুন",
      support: "সাপোর্ট",
      dupEmail: "এই ইমেইলে আগেই অ্যাকাউন্ট আছে।",
      dupLoginCta: "লগিন করুন →",
    },
  }[lang];

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(prev => ({ ...prev, [k]: e.target.value }));
    if (k === "email") setEmailAlreadyExists(false);
  };

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setEmailAlreadyExists(false);

    if (!form.email || !form.password) { setError("Email and password are required"); return; }
    if (form.password.length < 6) { setError("Password must be at least 6 characters"); return; }
    if (form.password !== form.confirmPassword) { setError("Passwords do not match"); return; }
    if (!agreed) { setError("Please agree to the Terms of Service and Privacy Policy"); return; }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.email)) { setError("Enter a valid email address"); return; }

    setLoading(true);
    try {
      // Use email as name (will be updatable from settings)
      const name = form.email.split("@")[0];
      await register({ name, email: form.email, password: form.password });
      navigate("/");
    } catch (err: any) {
      const msg: string = err.message ?? "Registration failed";
      if (msg.toLowerCase().includes("already registered") || msg.toLowerCase().includes("already exists") || msg.toLowerCase().includes("email already")) {
        setEmailAlreadyExists(true);
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  }

  const fieldStyle = {
    base: "w-full px-4 py-3.5 rounded-xl border text-sm outline-none transition-all",
    border: "hsl(var(--border))",
    bg: "hsl(var(--card))",
  };

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
          <button
            onClick={() => setLang(l => l === "en" ? "bn" : "en")}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border text-xs font-semibold transition-colors"
            style={{ borderColor: "hsl(var(--border))", color: "hsl(var(--muted-foreground))", background: "hsl(var(--background))" }}>
            <Globe className="w-3.5 h-3.5" />
            {lang === "en" ? "বাংলা" : "English"}
          </button>
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
          <div className="mb-6">
            <h1 className="text-2xl font-extrabold">{t.title}</h1>
            <p className="text-sm mt-1" style={{ color: "hsl(var(--muted-foreground))" }}>{t.sub}</p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* Email */}
            <div>
              <label className="text-sm font-semibold block mb-1.5">
                {t.emailLabel} <span style={{ color: "hsl(var(--destructive))" }}>*</span>
              </label>
              <input
                type="email"
                placeholder={t.emailPh}
                value={form.email}
                onChange={set("email")}
                className={fieldStyle.base}
                style={{
                  borderColor: emailAlreadyExists ? "hsl(var(--destructive))" : fieldStyle.border,
                  background: fieldStyle.bg,
                }}
                onFocus={e => { e.currentTarget.style.borderColor = emailAlreadyExists ? "hsl(var(--destructive))" : "hsl(var(--primary))"; }}
                onBlur={e => { e.currentTarget.style.borderColor = emailAlreadyExists ? "hsl(var(--destructive))" : fieldStyle.border; }}
              />
              {emailAlreadyExists && (
                <div className="mt-2 px-3 py-2.5 rounded-xl text-sm"
                  style={{ background: "hsl(var(--destructive) / 0.08)", color: "hsl(var(--destructive))" }}>
                  {t.dupEmail}{" "}
                  <Link href="/login">
                    <span className="font-bold underline cursor-pointer">{t.dupLoginCta}</span>
                  </Link>
                </div>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="text-sm font-semibold block mb-1.5">
                {t.passLabel} <span style={{ color: "hsl(var(--destructive))" }}>*</span>
              </label>
              <div className="relative">
                <input
                  type={showPass ? "text" : "password"}
                  placeholder={t.passPh}
                  value={form.password}
                  onChange={set("password")}
                  className={`${fieldStyle.base} pr-12`}
                  style={{ borderColor: fieldStyle.border, background: fieldStyle.bg }}
                  onFocus={e => { e.currentTarget.style.borderColor = "hsl(var(--primary))"; }}
                  onBlur={e => { e.currentTarget.style.borderColor = fieldStyle.border; }}
                />
                <button type="button" onClick={() => setShowPass(p => !p)}
                  className="absolute right-4 top-1/2 -translate-y-1/2"
                  style={{ color: "hsl(var(--muted-foreground))" }}>
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="text-sm font-semibold block mb-1.5">
                {t.confirmLabel} <span style={{ color: "hsl(var(--destructive))" }}>*</span>
              </label>
              <div className="relative">
                <input
                  type={showConfirm ? "text" : "password"}
                  placeholder={t.confirmPh}
                  value={form.confirmPassword}
                  onChange={set("confirmPassword")}
                  className={`${fieldStyle.base} pr-12`}
                  style={{ borderColor: fieldStyle.border, background: fieldStyle.bg }}
                  onFocus={e => { e.currentTarget.style.borderColor = "hsl(var(--primary))"; }}
                  onBlur={e => { e.currentTarget.style.borderColor = fieldStyle.border; }}
                />
                <button type="button" onClick={() => setShowConfirm(p => !p)}
                  className="absolute right-4 top-1/2 -translate-y-1/2"
                  style={{ color: "hsl(var(--muted-foreground))" }}>
                  {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Terms & Conditions */}
            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={agreed}
                onChange={e => setAgreed(e.target.checked)}
                className="mt-0.5 rounded shrink-0"
                style={{ accentColor: "hsl(var(--primary))" }}
              />
              <span className="text-sm" style={{ color: "hsl(var(--muted-foreground))" }}>
                {t.terms1}{" "}
                <span className="font-semibold cursor-pointer" style={{ color: "hsl(var(--primary))" }}>{t.terms2}</span>
                {" "}{t.terms3}{" "}
                <span className="font-semibold cursor-pointer" style={{ color: "hsl(var(--primary))" }}>{t.terms4}</span>
              </span>
            </label>

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

          <p className="text-sm text-center mt-5" style={{ color: "hsl(var(--muted-foreground))" }}>
            {t.haveAccount}{" "}
            <Link href="/login">
              <span className="font-bold cursor-pointer" style={{ color: "hsl(var(--primary))" }}>{t.login}</span>
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
