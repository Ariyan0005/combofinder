import { useState, type FormEvent } from "react";
import { Link, useLocation } from "wouter";
import { Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { AuthNavbar, type Lang } from "@/components/auth-navbar";

const T = {
  en: {
    welcome: "Welcome Back!",
    sub: "Sign in to your account",
    emailLabel: "Email",
    emailPh: "Enter your email address",
    passLabel: "Password",
    passPh: "Enter your password",
    forgot: "Forgot password?",
    remember: "Remember me",
    btn: "Sign In",
    btnLoading: "Signing in…",
    noAccount: "New user?",
    signUp: "Create an account",
    support: "Support",
  },
  bn: {
    welcome: "স্বাগতম!",
    sub: "আপনার অ্যাকাউন্টে সাইন ইন করুন",
    emailLabel: "ইমেইল",
    emailPh: "ইমেইল লিখুন",
    passLabel: "পাসওয়ার্ড",
    passPh: "পাসওয়ার্ড লিখুন",
    forgot: "পাসওয়ার্ড ভুলেছেন?",
    remember: "মনে রাখুন",
    btn: "সাইন ইন",
    btnLoading: "সাইন ইন হচ্ছে…",
    noAccount: "নতুন ব্যবহারকারী?",
    signUp: "অ্যাকাউন্ট তৈরি করুন",
    support: "সাপোর্ট",
  },
  ar: {
    welcome: "مرحباً بعودتك!",
    sub: "تسجيل الدخول إلى حسابك",
    emailLabel: "البريد الإلكتروني",
    emailPh: "أدخل بريدك الإلكتروني",
    passLabel: "كلمة المرور",
    passPh: "أدخل كلمة المرور",
    forgot: "نسيت كلمة المرور؟",
    remember: "تذكرني",
    btn: "تسجيل الدخول",
    btnLoading: "جارٍ تسجيل الدخول…",
    noAccount: "مستخدم جديد؟",
    signUp: "إنشاء حساب",
    support: "الدعم",
  },
  hi: {
    welcome: "वापस आपका स्वागत है!",
    sub: "अपने अकाउंट में साइन इन करें",
    emailLabel: "ईमेल",
    emailPh: "अपना ईमेल दर्ज करें",
    passLabel: "पासवर्ड",
    passPh: "पासवर्ड दर्ज करें",
    forgot: "पासवर्ड भूल गए?",
    remember: "मुझे याद रखें",
    btn: "साइन इन करें",
    btnLoading: "साइन इन हो रहा है…",
    noAccount: "नए उपयोगकर्ता?",
    signUp: "अकाउंट बनाएं",
    support: "सहायता",
  },
} as const;

export default function Login() {
  const { login } = useAuth();
  const [, navigate] = useLocation();
  const [lang, setLang] = useState<Lang>("en");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const t = T[lang];
  const isRtl = lang === "ar";

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    if (!email || !password) { setError("All fields are required"); return; }
    setLoading(true);
    try {
      await login(email, password);
      navigate("/");
    } catch (err: any) {
      setError(err.message ?? "Login failed");
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
          <div className="mb-8">
            <h1 className="text-2xl font-extrabold">{t.welcome}</h1>
            <p className="text-sm mt-1" style={{ color: "hsl(var(--muted-foreground))" }}>{t.sub}</p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="text-sm font-semibold block mb-1.5">{t.emailLabel}</label>
              <input
                type="email"
                placeholder={t.emailPh}
                value={email}
                onChange={e => setEmail(e.target.value)}
                className={inputCls}
                style={inputStyle}
                onFocus={focusIn}
                onBlur={focusOut}
                dir="ltr"
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
                  className={`${inputCls} pr-12`}
                  style={inputStyle}
                  onFocus={focusIn}
                  onBlur={focusOut}
                  dir="ltr"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(p => !p)}
                  className="absolute right-4 top-1/2 -translate-y-1/2"
                  style={{ color: "hsl(var(--muted-foreground))" }}
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={remember}
                onChange={e => setRemember(e.target.checked)}
                style={{ accentColor: "hsl(var(--primary))" }}
              />
              <span className="text-sm" style={{ color: "hsl(var(--muted-foreground))" }}>{t.remember}</span>
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
