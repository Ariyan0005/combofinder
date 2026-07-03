import { useState, type FormEvent } from "react";
import { Link, useLocation } from "wouter";
import { Eye, EyeOff, ArrowLeft } from "lucide-react";
import { useAuth } from "@/context/auth-context";

export default function Register() {
  const { register } = useAuth();
  const [, navigate] = useLocation();
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "" });
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(prev => ({ ...prev, [k]: e.target.value }));

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    if (!form.name || !form.email || !form.password) { setError("Name, email and password are required"); return; }
    if (form.password.length < 6) { setError("Password must be at least 6 characters"); return; }
    setLoading(true);
    try {
      await register({ name: form.name, email: form.email, phone: form.phone || undefined, password: form.password });
      navigate("/");
    } catch (err: any) {
      setError(err.message ?? "Registration failed");
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
        <Link href="/login">
          <button className="mb-6 flex items-center gap-1.5 text-sm font-medium"
            style={{ color: "hsl(var(--muted-foreground))" }}>
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
        </Link>

        <div className="mb-6">
          <h1 className="text-2xl font-extrabold">Create Account</h1>
          <p className="text-sm mt-1" style={{ color: "hsl(var(--muted-foreground))" }}>Sign up to get started</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {[
            { label: "Full Name", key: "name" as const, type: "text", placeholder: "Enter your full name" },
            { label: "Email", key: "email" as const, type: "email", placeholder: "Enter your email" },
            { label: "Phone Number", key: "phone" as const, type: "tel", placeholder: "Enter your phone number (optional)" },
          ].map(({ label, key, type, placeholder }) => (
            <div key={key}>
              <label className="text-sm font-semibold block mb-1.5">{label}</label>
              <input
                type={type}
                placeholder={placeholder}
                value={form[key]}
                onChange={set(key)}
                className={fieldStyle.base}
                style={{ borderColor: fieldStyle.border, background: fieldStyle.bg }}
                onFocus={e => { e.currentTarget.style.borderColor = "hsl(var(--primary))"; }}
                onBlur={e => { e.currentTarget.style.borderColor = fieldStyle.border; }}
              />
            </div>
          ))}

          <div>
            <label className="text-sm font-semibold block mb-1.5">Password</label>
            <div className="relative">
              <input
                type={showPass ? "text" : "password"}
                placeholder="Create a password (min. 6 characters)"
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

          {error && (
            <p className="text-sm text-center px-3 py-2.5 rounded-xl font-medium"
              style={{ color: "hsl(var(--destructive))", background: "hsl(var(--destructive) / 0.08)" }}>
              {error}
            </p>
          )}

          <button type="submit" disabled={loading}
            className="w-full py-4 rounded-xl font-bold text-white text-sm transition-opacity disabled:opacity-60 mt-1"
            style={{ background: "hsl(var(--primary))" }}>
            {loading ? "Creating account…" : "Sign Up"}
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
