import { useState, type FormEvent } from "react";
import { Link, useLocation } from "wouter";
import { ArrowLeft, Mail, CheckCircle2, KeyRound, Eye, EyeOff } from "lucide-react";
import { AuthNavbar, type Lang } from "@/components/auth-navbar";

type Step = "request" | "verify" | "done";

export default function ForgotPassword() {
  const [, navigate] = useLocation();
  const [step, setStep] = useState<Step>("request");
  const [lang, setLang] = useState<Lang>("en");
  const [email, setEmail] = useState("");
  const [token, setToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleRequestReset(e: FormEvent) {
    e.preventDefault();
    setError("");
    if (!email) { setError("Email is required"); return; }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) { setError("Enter a valid email address"); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json() as { success?: boolean; error?: string };
      if (!res.ok) throw new Error(data.error ?? "Failed to send reset email");
      setStep("verify");
    } catch (err: any) {
      setError(err.message ?? "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function handleResetPassword(e: FormEvent) {
    e.preventDefault();
    setError("");
    if (!token) { setError("Reset code is required"); return; }
    if (!newPassword) { setError("New password is required"); return; }
    if (newPassword.length < 6) { setError("Password must be at least 6 characters"); return; }
    if (newPassword !== confirmPassword) { setError("Passwords do not match"); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, token, newPassword }),
      });
      const data = await res.json() as { success?: boolean; error?: string };
      if (!res.ok) throw new Error(data.error ?? "Failed to reset password");
      setStep("done");
    } catch (err: any) {
      setError(err.message ?? "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  const inputStyle = {
    base: "w-full px-4 py-3.5 rounded-xl border text-sm outline-none transition-all",
    border: "hsl(var(--border))",
    bg: "hsl(var(--card))",
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "hsl(var(--background))" }}>

      <AuthNavbar lang={lang} onLangChange={setLang} />

      <div className="flex-1 flex items-center justify-center p-5 pt-8">
      <div className="w-full max-w-sm">

        {step === "request" && (
          <>
            <div className="mb-6">
              <h1 className="text-2xl font-extrabold">Forgot Password?</h1>
              <p className="text-sm mt-1" style={{ color: "hsl(var(--muted-foreground))" }}>
                Enter your email and we'll send you a reset code.
              </p>
            </div>
            <form onSubmit={handleRequestReset} className="flex flex-col gap-4">
              <div>
                <label className="text-sm font-semibold block mb-1.5">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "hsl(var(--muted-foreground))" }} />
                  <input
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className={`${inputStyle.base} pl-10`}
                    style={{ borderColor: inputStyle.border, background: inputStyle.bg }}
                    onFocus={e => { e.currentTarget.style.borderColor = "hsl(var(--primary))"; }}
                    onBlur={e => { e.currentTarget.style.borderColor = inputStyle.border; }}
                  />
                </div>
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
                {loading ? "Sending…" : "Send Reset Code"}
              </button>
            </form>
          </>
        )}

        {step === "verify" && (
          <>
            <div className="mb-6 flex items-start gap-3 p-4 rounded-xl" style={{ background: "hsl(var(--primary) / 0.08)" }}>
              <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" style={{ color: "hsl(var(--primary))" }} />
              <div>
                <p className="text-sm font-semibold" style={{ color: "hsl(var(--foreground))" }}>Code sent!</p>
                <p className="text-xs mt-0.5" style={{ color: "hsl(var(--muted-foreground))" }}>
                  Check your inbox at <strong>{email}</strong>. The code expires in 1 hour.
                </p>
              </div>
            </div>
            <div className="mb-6">
              <h1 className="text-2xl font-extrabold">Reset Password</h1>
              <p className="text-sm mt-1" style={{ color: "hsl(var(--muted-foreground))" }}>
                Enter the code from your email and your new password.
              </p>
            </div>
            <form onSubmit={handleResetPassword} className="flex flex-col gap-4">
              <div>
                <label className="text-sm font-semibold block mb-1.5">Reset Code</label>
                <div className="relative">
                  <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "hsl(var(--muted-foreground))" }} />
                  <input
                    type="text"
                    placeholder="Enter the 6-digit code"
                    value={token}
                    onChange={e => setToken(e.target.value)}
                    className={`${inputStyle.base} pl-10`}
                    style={{ borderColor: inputStyle.border, background: inputStyle.bg }}
                    onFocus={e => { e.currentTarget.style.borderColor = "hsl(var(--primary))"; }}
                    onBlur={e => { e.currentTarget.style.borderColor = inputStyle.border; }}
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-semibold block mb-1.5">New Password</label>
                <div className="relative">
                  <input
                    type={showPass ? "text" : "password"}
                    placeholder="Min. 6 characters"
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    className={`${inputStyle.base} pr-12`}
                    style={{ borderColor: inputStyle.border, background: inputStyle.bg }}
                    onFocus={e => { e.currentTarget.style.borderColor = "hsl(var(--primary))"; }}
                    onBlur={e => { e.currentTarget.style.borderColor = inputStyle.border; }}
                  />
                  <button type="button" onClick={() => setShowPass(p => !p)}
                    className="absolute right-4 top-1/2 -translate-y-1/2"
                    style={{ color: "hsl(var(--muted-foreground))" }}>
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="text-sm font-semibold block mb-1.5">Confirm Password</label>
                <input
                  type="password"
                  placeholder="Repeat your password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  className={inputStyle.base}
                  style={{ borderColor: inputStyle.border, background: inputStyle.bg }}
                  onFocus={e => { e.currentTarget.style.borderColor = "hsl(var(--primary))"; }}
                  onBlur={e => { e.currentTarget.style.borderColor = inputStyle.border; }}
                />
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
                {loading ? "Resetting…" : "Reset Password"}
              </button>
              <button type="button" onClick={() => { setStep("request"); setError(""); }}
                className="text-sm font-medium text-center"
                style={{ color: "hsl(var(--muted-foreground))" }}>
                ← Resend code
              </button>
            </form>
          </>
        )}

        {step === "done" && (
          <div className="flex flex-col items-center gap-5 text-center">
            <div className="w-16 h-16 rounded-full flex items-center justify-center"
              style={{ background: "hsl(var(--primary) / 0.1)" }}>
              <CheckCircle2 className="w-8 h-8" style={{ color: "hsl(var(--primary))" }} />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold">Password Reset!</h1>
              <p className="text-sm mt-2" style={{ color: "hsl(var(--muted-foreground))" }}>
                Your password has been successfully updated. You can now log in.
              </p>
            </div>
            <button onClick={() => navigate("/login")}
              className="w-full py-4 rounded-xl font-bold text-white text-sm"
              style={{ background: "hsl(var(--primary))" }}>
              Go to Login
            </button>
          </div>
        )}

        {step !== "done" && (
          <div className="mt-6 text-center">
            <Link href="/login">
              <span className="flex items-center justify-center gap-1.5 text-sm font-medium cursor-pointer"
                style={{ color: "hsl(var(--muted-foreground))" }}>
                <ArrowLeft className="w-4 h-4" /> Back to Login
              </span>
            </Link>
          </div>
        )}
      </div>
      </div>
    </div>
  );
}
