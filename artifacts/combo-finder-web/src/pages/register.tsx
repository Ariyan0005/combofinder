import { useState, type FormEvent } from "react";
import { Link, useLocation } from "wouter";
import { Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { AuthNavbar, type Lang } from "@/components/auth-navbar";

const T = {
  en: {
    title: "Account Information",
    sub: "Enter your account details",
    emailLabel: "E-Mail",
    emailPh: "Enter your email",
    passLabel: "Password",
    passPh: "Create a strong password",
    confirmLabel: "Confirm Password",
    confirmPh: "Repeat your password",
    terms1: "I agree to the",
    terms2: "Terms",
    terms3: "&",
    terms4: "Privacy Policy",
    btn: "Next →",
    btnLoading: "Creating account…",
    haveAccount: "Already have an account?",
    login: "Sign in",
    support: "Support",
    dupEmail: "This email is already registered.",
    dupCta: "Sign in instead →",
  },
  bn: {
    title: "অ্যাকাউন্ট তথ্য",
    sub: "আপনার অ্যাকাউন্টের বিবরণ দিন",
    emailLabel: "ইমেইল",
    emailPh: "ইমেইল লিখুন",
    passLabel: "পাসওয়ার্ড",
    passPh: "শক্তিশালী পাসওয়ার্ড তৈরি করুন",
    confirmLabel: "পাসওয়ার্ড নিশ্চিত করুন",
    confirmPh: "পাসওয়ার্ড আবার লিখুন",
    terms1: "আমি সম্মত",
    terms2: "শর্তাবলী",
    terms3: "এবং",
    terms4: "গোপনীয়তা নীতি",
    btn: "পরবর্তী →",
    btnLoading: "তৈরি হচ্ছে…",
    haveAccount: "আগে থেকে অ্যাকাউন্ট আছে?",
    login: "সাইন ইন",
    support: "সাপোর্ট",
    dupEmail: "এই ইমেইলে আগেই অ্যাকাউন্ট আছে।",
    dupCta: "সাইন ইন করুন →",
  },
  ar: {
    title: "معلومات الحساب",
    sub: "أدخل تفاصيل حسابك",
    emailLabel: "البريد الإلكتروني",
    emailPh: "أدخل بريدك الإلكتروني",
    passLabel: "كلمة المرور",
    passPh: "أنشئ كلمة مرور قوية",
    confirmLabel: "تأكيد كلمة المرور",
    confirmPh: "أعد إدخال كلمة المرور",
    terms1: "أوافق على",
    terms2: "الشروط",
    terms3: "و",
    terms4: "سياسة الخصوصية",
    btn: "التالي →",
    btnLoading: "جارٍ الإنشاء…",
    haveAccount: "هل لديك حساب بالفعل؟",
    login: "تسجيل الدخول",
    support: "الدعم",
    dupEmail: "هذا البريد الإلكتروني مسجل بالفعل.",
    dupCta: "تسجيل الدخول →",
  },
  hi: {
    title: "खाता जानकारी",
    sub: "अपने खाते का विवरण दर्ज करें",
    emailLabel: "ईमेल",
    emailPh: "अपना ईमेल दर्ज करें",
    passLabel: "पासवर्ड",
    passPh: "एक मजबूत पासवर्ड बनाएं",
    confirmLabel: "पासवर्ड की पुष्टि करें",
    confirmPh: "पासवर्ड दोबारा दर्ज करें",
    terms1: "मैं सहमत हूं",
    terms2: "शर्तें",
    terms3: "और",
    terms4: "गोपनीयता नीति",
    btn: "अगला →",
    btnLoading: "बनाया जा रहा है…",
    haveAccount: "पहले से खाता है?",
    login: "साइन इन करें",
    support: "सहायता",
    dupEmail: "यह ईमेल पहले से पंजीकृत है।",
    dupCta: "साइन इन करें →",
  },
} as const;

export default function Register() {
  const { register } = useAuth();
  const [, navigate] = useLocation();
  const [lang, setLang] = useState<Lang>("en");
  const [form, setForm] = useState({ email: "", password: "", confirmPassword: "" });
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState("");
  const [dupEmail, setDupEmail] = useState(false);
  const [loading, setLoading] = useState(false);

  const t = T[lang];
  const isRtl = lang === "ar";

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(p => ({ ...p, [k]: e.target.value }));
    if (k === "email") setDupEmail(false);
  };

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(""); setDupEmail(false);
    if (!form.email || !form.password) { setError("Email and password are required"); return; }
    if (form.password.length < 6) { setError("Password must be at least 6 characters"); return; }
    if (form.password !== form.confirmPassword) { setError("Passwords do not match"); return; }
    if (!agreed) { setError("Please agree to the Terms and Privacy Policy"); return; }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.email)) { setError("Enter a valid email address"); return; }

    setLoading(true);
    try {
      const name = form.email.split("@")[0];
      await register({ name, email: form.email, password: form.password });
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

  const inputCls = "w-full px-4 py-3.5 rounded-xl border text-sm outline-none transition-colors";
  const inputStyle = { borderColor: "hsl(var(--border))", background: "hsl(var(--card))", color: "hsl(var(--foreground))" };
  const focusIn = (e: React.FocusEvent<HTMLInputElement>) => { e.currentTarget.style.borderColor = "hsl(var(--primary))"; };
  const focusOut = (e: React.FocusEvent<HTMLInputElement>) => { e.currentTarget.style.borderColor = "hsl(var(--border))"; };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "hsl(var(--background))", direction: isRtl ? "rtl" : "ltr" }}>
      <AuthNavbar lang={lang} onLangChange={setLang} supportLabel={t.support} />

      <div className="flex-1 flex items-center justify-center p-5">
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
                className={inputCls}
                style={{
                  ...inputStyle,
                  borderColor: dupEmail ? "hsl(var(--destructive))" : "hsl(var(--border))",
                }}
                onFocus={e => { e.currentTarget.style.borderColor = dupEmail ? "hsl(var(--destructive))" : "hsl(var(--primary))"; }}
                onBlur={e => { e.currentTarget.style.borderColor = dupEmail ? "hsl(var(--destructive))" : "hsl(var(--border))"; }}
                dir="ltr"
              />
              {dupEmail && (
                <div className="mt-2 px-3 py-2.5 rounded-xl text-sm"
                  style={{ background: "hsl(var(--destructive) / 0.08)", color: "hsl(var(--destructive))" }}>
                  {t.dupEmail}{" "}
                  <Link href="/login">
                    <span className="font-bold underline cursor-pointer">{t.dupCta}</span>
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
                  className={`${inputCls} pr-12`}
                  style={inputStyle}
                  onFocus={focusIn}
                  onBlur={focusOut}
                  dir="ltr"
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
                  className={`${inputCls} pr-12`}
                  style={inputStyle}
                  onFocus={focusIn}
                  onBlur={focusOut}
                  dir="ltr"
                />
                <button type="button" onClick={() => setShowConfirm(p => !p)}
                  className="absolute right-4 top-1/2 -translate-y-1/2"
                  style={{ color: "hsl(var(--muted-foreground))" }}>
                  {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Terms */}
            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={agreed}
                onChange={e => setAgreed(e.target.checked)}
                className="mt-0.5 shrink-0"
                style={{ accentColor: "hsl(var(--primary))" }}
              />
              <span className="text-sm" style={{ color: "hsl(var(--muted-foreground))" }}>
                {t.terms1}{" "}
                <span className="font-semibold" style={{ color: "hsl(var(--primary))" }}>{t.terms2}</span>
                {" "}{t.terms3}{" "}
                <span className="font-semibold" style={{ color: "hsl(var(--primary))" }}>{t.terms4}</span>
              </span>
            </label>

            {error && (
              <p className="text-sm text-center px-3 py-2.5 rounded-xl font-medium"
                style={{ color: "hsl(var(--destructive))", background: "hsl(var(--destructive) / 0.08)" }}>
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 rounded-xl font-bold text-white text-sm transition-opacity disabled:opacity-60 mt-1"
              style={{ background: "hsl(var(--primary))" }}
            >
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
