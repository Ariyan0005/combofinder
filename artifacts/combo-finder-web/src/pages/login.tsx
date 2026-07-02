import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/context/auth-context";
import { Wrench } from "lucide-react";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { login } = useAuth();
  const [, setLocation] = useLocation();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    login();
    setLocation("/");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md bg-card border border-border rounded-2xl shadow-xl overflow-hidden">
        <div className="bg-sidebar p-8 text-center border-b border-border/10">
          <div className="w-12 h-12 rounded-xl bg-primary mx-auto flex items-center justify-center mb-4">
            <Wrench className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">ComboFinder</h1>
          <p className="text-sidebar-foreground/70 text-sm mt-2">Sign in to your shop management dashboard</p>
        </div>
        <form onSubmit={handleLogin} className="p-8 space-y-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Email / Username</label>
              <input
                type="text"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full bg-background border border-border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                placeholder="admin@shop.com"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-sm font-medium text-foreground">Password</label>
                <a href="#" className="text-xs text-primary font-medium hover:underline">Forgot?</a>
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full bg-background border border-border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                placeholder="••••••••"
              />
            </div>
          </div>
          <button type="submit" className="w-full bg-primary hover:bg-primary/90 text-white font-medium rounded-lg px-4 py-2.5 transition-colors">
            Sign In
          </button>
        </form>
      </div>
    </div>
  );
}