"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Activity,
  LayoutDashboard,
  Users,
  FolderKanban,
  GanttChartSquare,
  Settings,
  LogOut,
  Zap,
  Shield,
} from "lucide-react";
import Link from "next/link";

const navItems = [
  { href: "/admin", icon: LayoutDashboard, label: "Live Pulse" },
  { href: "/admin/team", icon: Users, label: "Team Hub" },
  { href: "/admin/projects", icon: FolderKanban, label: "Projects" },
  { href: "/admin/users", icon: Shield, label: "Users" },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-[#0f1117] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-500 text-sm font-ui">Loading workspace...</p>
        </div>
      </div>
    );
  }

  if (!session?.user) return null;

  const user = session.user;
  const roleColors: Record<string, string> = {
    admin: "text-purple-400 bg-purple-400/10 border-purple-400/30",
    producer: "text-blue-400 bg-blue-400/10 border-blue-400/30",
    head: "text-amber-400 bg-amber-400/10 border-amber-400/30",
    creative: "text-green-400 bg-green-400/10 border-green-400/30",
  };

  return (
    <div className="min-h-screen bg-[#0f1117] flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#0f1117]/90 backdrop-blur-xl border-b border-[#2a2f3e]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-purple-600 to-purple-800 rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(124,58,237,0.4)]">
              <Zap className="text-white" size={18} />
            </div>
            <div>
              <h1 className="font-brand text-sm font-bold text-white tracking-wider leading-none">
                AROMA <span className="text-purple-400">PULSE</span>
              </h1>
              <p className="text-[10px] text-slate-600 font-ui">Studio OS</p>
            </div>
          </div>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center bg-[#161922] border border-[#2a2f3e] rounded-xl p-1 gap-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-white hover:bg-[#1e2330] transition-all"
              >
                <item.icon size={14} />
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Right Side */}
          <div className="flex items-center gap-3">
            <span className={`hidden sm:inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-lg border capitalize ${roleColors[user.role] || roleColors.creative}`}>
              <Activity size={10} />
              {user.role}
            </span>

            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-700 to-purple-900 rounded-full flex items-center justify-center text-xs font-bold text-white">
                {(user.name || "US").slice(0, 2).toUpperCase()}
              </div>
              <span className="hidden sm:block text-sm font-medium text-slate-300 font-ui">{user.name}</span>
            </div>

            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-red-400 transition-colors px-2 py-1.5 rounded-lg hover:bg-red-900/10"
            >
              <LogOut size={14} />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Nav */}
      <div className="md:hidden border-b border-[#2a2f3e] bg-[#0f1117]/95 px-4 py-2 overflow-x-auto flex gap-2">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-400 bg-[#161922] border border-[#2a2f3e] whitespace-nowrap hover:text-white hover:bg-[#1e2330] transition-all"
          >
            <item.icon size={12} />
            {item.label}
          </Link>
        ))}
      </div>

      {/* Content */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-6">
        {children}
      </main>
    </div>
  );
}
