import { useState, type FormEvent } from "react";
import { Link, useLocation } from "wouter";
import { Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { AuthNavbar, type Lang } from "@/components/auth-navbar";

const T = {
  en: {
    welcome: "Welcome Back!",
    sub: "Sign in to your account",
    orContinue: "or continue with",
    emailLabel: "Email or Username",
    emailPh: "Enter your email or username",
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
    orContinue: "অথবা এর মাধ্যমে প্রবেশ করুন",
    emailLabel: "ইমেইল বা ইউজারনেম",
    emailPh: "ইমেইল বা ইউজারনেম লিখুন",
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
    orContinue: "أو تابع عبر",
    emailLabel: "البريد الإلكتروني أو اسم المستخدم",
    emailPh: "أدخل بريدك أو اسم المستخدم",
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
    orContinue: "या इससे जारी रखें",
    emailLabel: "ईमेल या यूज़रनेम",
    emailPh: "ईमेल या यूज़रनेम दर्ज करें",
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
  const iStyle = { borderColor: "hsl(var(--border))", background: "hsl(var(--card))", color: "hsl(var(--foreground))" };
  const focIn = (e: React.FocusEvent<HTMLInputElement>) => { e.currentTarget.style.borderColor = "hsl(var(--primary))"; };
  const focOut = (e: React.FocusEvent<HTMLInputElement>) => { e.currentTarget.style.borderColor = "hsl(var(--border))"; };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "hsl(var(--background))", direction: isRtl ? "rtl" : "ltr" }}>
      <AuthNavbar lang={lang} onLangChange={setLang} supportLabel={t.support} />

      <div className="flex-1 flex items-start md:items-center justify-center p-5 pt-3">
        <div className="w-full max-w-sm">
          <div className="mb-4">
            <h1 className="text-2xl font-extrabold">{t.welcome}</h1>
            <p className="text-sm mt-1" style={{ color: "hsl(var(--muted-foreground))" }}>{t.sub}</p>
          </div>

          {/* Social login buttons */}
          <div className="grid grid-cols-3 gap-2 mb-4">
            {[
              { icon: <GoogleIcon />, label: "Google", href: "/api/auth/google" },
              { icon: <AppleIcon />, label: "Apple", href: "/api/auth/apple" },
              { icon: <GitHubIcon />, label: "GitHub", href: "/api/auth/github" },
            ].map(({ icon, label, href }) => (
              <a
                key={label}
                href={href}
                className="flex flex-col items-center justify-center gap-1.5 py-3 rounded-xl border text-xs font-semibold transition-colors"
                style={{ borderColor: "hsl(var(--border))", background: "hsl(var(--card))", color: "hsl(var(--foreground))" }}
                onMouseEnter={e => { e.currentTarget.style.background = "hsl(var(--muted))"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "hsl(var(--card))"; }}
              >
                {icon}
                <span>{label}</span>
              </a>
            ))}
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 h-px" style={{ background: "hsl(var(--border))" }} />
            <span className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>{t.orContinue}</span>
            <div className="flex-1 h-px" style={{ background: "hsl(var(--border))" }} />
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <div>
              <label className="text-sm font-semibold block mb-1.5">{t.emailLabel}</label>
              <input type="text" placeholder={t.emailPh} value={email}
                onChange={e => setEmail(e.target.value)} className={inputCls} style={iStyle}
                onFocus={focIn} onBlur={focOut} dir="ltr" autoComplete="username" />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-sm font-semibold">{t.passLabel}</label>
                <Link href="/forgot-password">
                  <span className="text-xs font-semibold cursor-pointer" style={{ color: "hsl(var(--primary))" }}>{t.forgot}</span>
                </Link>
              </div>
              <div className="relative">
                <input type={showPass ? "text" : "password"} placeholder={t.passPh} value={password}
                  onChange={e => setPassword(e.target.value)} className={`${inputCls} pr-12`} style={iStyle}
                  onFocus={focIn} onBlur={focOut} dir="ltr" />
                <button type="button" onClick={() => setShowPass(p => !p)}
                  className="absolute right-4 top-1/2 -translate-y-1/2" style={{ color: "hsl(var(--muted-foreground))" }}>
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={remember} onChange={e => setRemember(e.target.checked)}
                style={{ accentColor: "hsl(var(--primary))" }} />
              <span className="text-sm" style={{ color: "hsl(var(--muted-foreground))" }}>{t.remember}</span>
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

          <p className="text-sm text-center mt-3" style={{ color: "hsl(var(--muted-foreground))" }}>
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
