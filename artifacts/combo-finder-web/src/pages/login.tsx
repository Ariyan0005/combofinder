import { useState, type FormEvent } from "react";
import { Link, useLocation } from "wouter";
import { Eye, EyeOff, Smartphone } from "lucide-react";
import { useAuth } from "@/context/auth-context";

export default function Login() {
  const { login } = useAuth();
  const [, navigate] = useLocation();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

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

        <div className="mb-6 text-center">
          <h1 className="text-2xl font-extrabold">Welcome Back!</h1>
          <p className="text-sm mt-1" style={{ color: "hsl(var(--muted-foreground))" }}>Login to your account</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="text-sm font-semibold block mb-1.5">Email or Username</label>
            <input
              type="text"
              placeholder="Enter your email or username"
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
              <label className="text-sm font-semibold">Password</label>
              <Link href="/forgot-password">
                <span className="text-xs font-semibold cursor-pointer" style={{ color: "hsl(var(--primary))" }}>
                  Forgot Password?
                </span>
              </Link>
            </div>
            <div className="relative">
              <input
                type={showPass ? "text" : "password"}
                placeholder="Enter your password"
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
              Remember me
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
            {loading ? "Logging in…" : "Login"}
          </button>
        </form>

        <p className="text-sm text-center mt-6" style={{ color: "hsl(var(--muted-foreground))" }}>
          Don't have an account?{" "}
          <Link href="/register">
            <span className="font-bold cursor-pointer" style={{ color: "hsl(var(--primary))" }}>Sign Up</span>
          </Link>
        </p>
      </div>
    </div>
  );
}
