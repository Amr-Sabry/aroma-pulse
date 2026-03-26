"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Activity, Lock, User, ArrowRight, AlertCircle } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await signIn("credentials", {
        username,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("Invalid username or password. Please try again.");
        setLoading(false);
        return;
      }

      router.push("/admin");
      router.refresh();
    } catch {
      setError("Connection error. Please check your internet and try again.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f1117] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Glows */}
      <div className="absolute top-[-200px] left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-purple-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-100px] right-[-100px] w-[400px] h-[400px] bg-blue-600/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Login Card */}
      <div className="w-full max-w-md animate-slide-up">
        {/* Brand */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-600 to-purple-800 shadow-[0_0_40px_rgba(124,58,237,0.4)] mb-6">
            <Activity className="text-white" size={32} />
          </div>
          <h1 className="font-brand text-3xl font-black text-white tracking-wider mb-2">
            AROMA <span className="text-purple-400">PULSE</span>
          </h1>
          <p className="text-slate-500 text-sm font-ui">
            Creative Team Management System
          </p>
        </div>

        {/* Form */}
        <div className="bg-[#161922] border border-[#2a2f3e] rounded-3xl p-8 shadow-[0_8px_40px_rgba(0,0,0,0.6)]">
          <h2 className="text-xl font-bold text-white mb-6 text-center">
            Sign in to your workspace
          </h2>

          {error && (
            <div className="flex items-center gap-3 bg-red-900/20 border border-red-800/50 rounded-xl p-3 mb-5 animate-fade-in">
              <AlertCircle className="text-red-400 shrink-0" size={18} />
              <p className="text-red-300 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            {/* Username */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <User size={12} />
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="your_username"
                required
                autoComplete="username"
                className="w-full bg-[#0f1117] border border-[#2a2f3e] rounded-xl px-4 py-3.5 text-white placeholder-slate-600 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all outline-none font-ui"
              />
            </div>

            {/* Password */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <Lock size={12} />
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                autoComplete="current-password"
                className="w-full bg-[#0f1117] border border-[#2a2f3e] rounded-xl px-4 py-3.5 text-white placeholder-slate-600 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all outline-none font-ui"
              />
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 text-white font-bold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed shadow-lg shadow-purple-900/30 mt-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  Sign In
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-slate-600 text-xs mt-6 font-ui">
          © 2026 Aroma Studios. All rights reserved.
        </p>
      </div>
    </div>
  );
}
