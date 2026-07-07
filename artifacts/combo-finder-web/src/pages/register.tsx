import { useState, type FormEvent } from "react";
import { Link, useLocation } from "wouter";
import { Eye, EyeOff, Smartphone } from "lucide-react";
import { useAuth } from "@/context/auth-context";

export default function Register() {
  const { register } = useAuth();
  const [, navigate] = useLocation();
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "", confirmPassword: "" });
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");
  const [emailAlreadyExists, setEmailAlreadyExists] = useState(false);
  const [loading, setLoading] = useState(false);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(prev => ({ ...prev, [k]: e.target.value }));
    if (k === "email") setEmailAlreadyExists(false);
  };

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setEmailAlreadyExists(false);

    if (!form.name || !form.email || !form.password) { setError("Name, email and password are required"); return; }
    if (form.password.length < 6) { setError("Password must be at least 6 characters"); return; }
    if (form.password !== form.confirmPassword) { setError("Passwords do not match"); return; }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.email)) { setError("Enter a valid email address"); return; }

    setLoading(true);
    try {
      await register({ name: form.name, email: form.email, phone: form.phone || undefined, password: form.password });
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
    <div className="min-h-screen flex flex-col items-center justify-center p-5"
      style={{ background: "hsl(var(--background))" }}>

      <div className="w-full max-w-sm">
        {/* Logo + Site Name — links to home/splash */}
        <Link href="/">
          <div className="flex justify-center items-center gap-2.5 mb-8 cursor-pointer group">
            <div className="w-11 h-11 rounded-2xl flex items-center justify-center transition-transform group-active:scale-95"
              style={{ background: "hsl(var(--primary))" }}>
              <Smartphone className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-extrabold tracking-tight" style={{ color: "hsl(var(--foreground))" }}>
              ComboFinder
            </span>
          </div>
        </Link>

        <div className="mb-6">
          <h1 className="text-2xl font-extrabold">Create Account</h1>
          <p className="text-sm mt-1" style={{ color: "hsl(var(--muted-foreground))" }}>Sign up to get started — it's free!</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Full Name */}
          <div>
            <label className="text-sm font-semibold block mb-1.5">Full Name <span style={{ color: "hsl(var(--destructive))" }}>*</span></label>
            <input
              type="text"
              placeholder="Enter your full name"
              value={form.name}
              onChange={set("name")}
              className={fieldStyle.base}
              style={{ borderColor: fieldStyle.border, background: fieldStyle.bg }}
              onFocus={e => { e.currentTarget.style.borderColor = "hsl(var(--primary))"; }}
              onBlur={e => { e.currentTarget.style.borderColor = fieldStyle.border; }}
            />
          </div>

          {/* Email */}
          <div>
            <label className="text-sm font-semibold block mb-1.5">Email <span style={{ color: "hsl(var(--destructive))" }}>*</span></label>
            <input
              type="email"
              placeholder="Enter your email"
              value={form.email}
              onChange={set("email")}
              className={fieldStyle.base}
              style={{
                borderColor: emailAlreadyExists ? "hsl(var(--destructive))" : fieldStyle.border,
                background: fieldStyle.bg
              }}
              onFocus={e => { e.currentTarget.style.borderColor = emailAlreadyExists ? "hsl(var(--destructive))" : "hsl(var(--primary))"; }}
              onBlur={e => { e.currentTarget.style.borderColor = emailAlreadyExists ? "hsl(var(--destructive))" : fieldStyle.border; }}
            />
            {emailAlreadyExists && (
              <div className="mt-2 px-3 py-2.5 rounded-xl text-sm"
                style={{ background: "hsl(var(--destructive) / 0.08)", color: "hsl(var(--destructive))" }}>
                This email is already registered.{" "}
                <Link href="/login">
                  <span className="font-bold underline cursor-pointer">Login instead →</span>
                </Link>
              </div>
            )}
          </div>

          {/* Phone */}
          <div>
            <label className="text-sm font-semibold block mb-1.5">
              Phone Number <span className="font-normal text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>(optional)</span>
            </label>
            <input
              type="tel"
              placeholder="Enter your phone number"
              value={form.phone}
              onChange={set("phone")}
              className={fieldStyle.base}
              style={{ borderColor: fieldStyle.border, background: fieldStyle.bg }}
              onFocus={e => { e.currentTarget.style.borderColor = "hsl(var(--primary))"; }}
              onBlur={e => { e.currentTarget.style.borderColor = fieldStyle.border; }}
            />
          </div>

          {/* Password */}
          <div>
            <label className="text-sm font-semibold block mb-1.5">Password <span style={{ color: "hsl(var(--destructive))" }}>*</span></label>
            <div className="relative">
              <input
                type={showPass ? "text" : "password"}
                placeholder="Min. 6 characters"
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
            <label className="text-sm font-semibold block mb-1.5">Confirm Password <span style={{ color: "hsl(var(--destructive))" }}>*</span></label>
            <div className="relative">
              <input
                type={showConfirm ? "text" : "password"}
                placeholder="Repeat your password"
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

          {error && (
            <p className="text-sm text-center px-3 py-2.5 rounded-xl font-medium"
              style={{ color: "hsl(var(--destructive))", background: "hsl(var(--destructive) / 0.08)" }}>
              {error}
            </p>
          )}

          <button type="submit" disabled={loading}
            className="w-full py-4 rounded-xl font-bold text-white text-sm transition-opacity disabled:opacity-60 mt-1"
            style={{ background: "hsl(var(--primary))" }}>
            {loading ? "Creating account…" : "Create Account"}
          </button>
        </form>

        <p className="text-sm text-center mt-6" style={{ color: "hsl(var(--muted-foreground))" }}>
          Already have an account?{" "}
          <Link href="/login">
            <span className="font-bold cursor-pointer" style={{ color: "hsl(var(--primary))" }}>Login</span>
          </Link>
        </p>
      </div>
    </div>
  );
}
