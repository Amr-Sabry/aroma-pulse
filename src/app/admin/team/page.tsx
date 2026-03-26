"use client";

import { useState, useEffect, useMemo } from "react";
import { useSession } from "next-auth/react";
import {
  collection,
  onSnapshot,
  updateDoc,
  doc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { INITIAL_TEAM_DATA, INITIAL_TASKS_DATA } from "@/lib/initialData";
import type { TeamMember, Task } from "@/types";
import {
  Users,
  Loader2,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  Activity,
  X,
} from "lucide-react";

const ROLES_KIND = {
  admin: { label: "Admin", icon: "👑", color: "text-purple-400 bg-purple-400/10 border-purple-400/30" },
  producer: { label: "Producer", icon: "🎬", color: "text-blue-400 bg-blue-400/10 border-blue-400/30" },
  head: { label: "Head", icon: "👁", color: "text-amber-400 bg-amber-400/10 border-amber-400/30" },
  creative: { label: "Designer", icon: "🎨", color: "text-green-400 bg-green-400/10 border-green-400/30" },
};

const METRICS_LABELS = [
  { key: "speed", label: "Speed", emoji: "⚡" },
  { key: "quality", label: "Quality", emoji: "💎" },
  { key: "creativity", label: "Creativity", emoji: "🎨" },
  { key: "reliability", label: "Reliability", emoji: "🛡️" },
  { key: "teamwork", label: "Teamwork", emoji: "🤝" },
];

function statusConfig(status: string) {
  if (status === "online") return { dot: "bg-green-500", label: "Online", color: "text-green-400", border: "border-green-500/30" };
  if (status === "busy") return { dot: "bg-orange-500", label: "Busy", color: "text-orange-400", border: "border-orange-500/30" };
  return { dot: "bg-slate-600", label: "Offline", color: "text-slate-500", border: "border-slate-700" };
}

export default function TeamHubPage() {
  const { data: session } = useSession();
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [notification, setNotification] = useState<{ m: string; t: "s" | "e" } | null>(null);
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const [metricsMode, setMetricsMode] = useState<"radar" | "bars">("bars");

  useEffect(() => {
    const unsubT = onSnapshot(collection(db, "aroma-pulse/production/team"), (snap) => {
      const data = snap.docs.map((d) => ({ id: d.id, ...d.data() } as TeamMember));
      if (data.length === 0) setSeeding(true);
      setTeam(data);
      setLoading(false);
    });
    const unsubTk = onSnapshot(collection(db, "aroma-pulse/production/tasks"), (snap) => {
      setTasks(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Task)));
    });
    return () => { unsubT(); unsubTk(); };
  }, []);

  useEffect(() => {
    if (notification) {
      const t = setTimeout(() => setNotification(null), 3000);
      return () => clearTimeout(t);
    }
  }, [notification]);

  async function handleSeed() {
    setSeeding(true);
    for (const m of INITIAL_TEAM_DATA) {
      try {
        await import("firebase/firestore").then(({ addDoc }) =>
          addDoc(collection(db, "aroma-pulse/production/team"), m)
        );
      } catch {}
    }
    for (const t of INITIAL_TASKS_DATA) {
      try {
        await import("firebase/firestore").then(({ addDoc }) =>
          addDoc(collection(db, "aroma-pulse/production/tasks"), t)
        );
      } catch {}
    }
    setSeeding(false);
    setNotification({ m: "✅ Team data seeded!", t: "s" });
  }

  // Calculate team with live metrics
  const teamWithMetrics = useMemo(() => {
    const memberMap = new Map(team.map((m) => [m.name, { ...m, bookedHours: 0, availableHours: m.capacityHours }]));
    tasks.forEach((task) => {
      const consumed = task.actualHours + (task.extensions?.reduce((s, e) => s + e.hours, 0) || 0);
      task.assignees.forEach((name) => {
        const member = memberMap.get(name);
        if (member) {
          member.bookedHours += consumed;
          member.availableHours = Math.max(0, member.capacityHours - member.bookedHours);
          memberMap.set(name, member);
        }
      });
    });
    return Array.from(memberMap.values());
  }, [team, tasks]);

  async function updateMemberStatus(id: string, status: "online" | "busy" | "offline") {
    try {
      await updateDoc(doc(db, "aroma-pulse/production/team", id), { status });
    } catch { setNotification({ m: "❌ Failed to update status", t: "e" }); }
  }

  const getMemberTasks = (memberName: string) => tasks.filter((t) => t.assignees.includes(memberName));
  const getActiveTask = (memberName: string) =>
    tasks.find((t) => t.assignees.includes(memberName) && t.status === "In Progress");

  const stats = useMemo(() => {
    const online = teamWithMetrics.filter((m) => m.status === "online").length;
    const busy = teamWithMetrics.filter((m) => m.status === "busy").length;
    const totalBooked = teamWithMetrics.reduce((s, m) => s + m.bookedHours, 0);
    const totalAvailable = teamWithMetrics.reduce((s, m) => s + m.availableHours, 0);
    return { online, busy, total: teamWithMetrics.length, totalBooked, totalAvailable };
  }, [teamWithMetrics]);

  return (
    <div className="space-y-6 animate-fade-in">
      {notification && (
        <div className={`fixed top-20 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-3 px-6 py-3 rounded-2xl border shadow-2xl animate-slide-up ${
          notification.t === "s" ? "bg-green-900/90 border-green-600 text-green-200" : "bg-red-900/90 border-red-600 text-red-200"
        }`}>
          {notification.t === "s" ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
          <span className="font-bold">{notification.m}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white font-ui">
            <span className="text-purple-400">Team</span> Hub
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {stats.online} online · {stats.busy} busy · {stats.total} members
          </p>
        </div>
        <div className="flex items-center gap-3">
          {team.length === 0 && !loading && (
            <button onClick={handleSeed} disabled={seeding}
              className="flex items-center gap-2 px-4 py-2 bg-[#1e2330] border border-[#2a2f3e] rounded-xl text-sm font-semibold text-slate-400 hover:text-white hover:border-blue-500/40 transition-all disabled:opacity-40">
              {seeding ? <Loader2 size={14} className="animate-spin" /> : <Users size={14} />}
              Seed Team Data
            </button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Team Size", value: stats.total, color: "text-purple-400" },
          { label: "Online Now", value: stats.online, color: "text-green-400" },
          { label: "Hours Booked", value: `${stats.totalBooked.toFixed(0)}h`, color: "text-blue-400" },
          { label: "Hours Available", value: `${stats.totalAvailable.toFixed(0)}h`, color: "text-green-400" },
        ].map((s) => (
          <div key={s.label} className="bg-[#161922] border border-[#2a2f3e] rounded-2xl p-4">
            <div className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1">{s.label}</div>
            <div className={`text-2xl font-bold font-mono ${s.color}`}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Team Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20"><Loader2 size={32} className="animate-spin text-purple-500" /></div>
      ) : teamWithMetrics.length === 0 ? (
        <div className="bg-[#161922] border border-[#2a2f3e] rounded-3xl p-12 text-center">
          <Users size={40} className="text-slate-700 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-white mb-2">No team members yet</h3>
          <p className="text-sm text-slate-500 mb-5">Click &quot;Seed Team Data&quot; to load sample team members.</p>
          <button onClick={handleSeed}
            className="px-6 py-3 bg-purple-600 hover:bg-purple-500 rounded-xl text-sm font-bold text-white transition-all inline-flex items-center gap-2">
            <Users size={16} /> Load Sample Team
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {teamWithMetrics.map((member) => {
            const role = ROLES_KIND[member.role as keyof typeof ROLES_KIND] || ROLES_KIND.creative;
            const sc = statusConfig(member.status);
            const activeTask = getActiveTask(member.name);
            const memberTasks = getMemberTasks(member.name);
            const completedTasks = memberTasks.filter((t) => t.status === "Completed").length;
            const progress = activeTask ? Math.min(100, (activeTask.actualHours / activeTask.estHours) * 100) : 0;

            return (
              <div key={member.id}
                className="bg-[#161922] border border-[#2a2f3e] rounded-2xl p-5 hover:border-purple-500/30 transition-all group cursor-pointer"
                onClick={() => setSelectedMember(member)}>

                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-700 to-purple-900 flex items-center justify-center text-sm font-bold text-white shadow-md">
                        {member.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-[#0f1117] ${sc.dot} animate-pulse`} />
                    </div>
                    <div>
                      <h4 className="font-bold text-white text-sm">{member.name}</h4>
                      <p className="text-xs text-slate-500">{member.role}</p>
                    </div>
                  </div>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-lg border ${sc.color} ${sc.border}`}>{sc.label}</span>
                </div>

                {/* Role + Skills */}
                <div className="flex flex-wrap gap-1 mb-3">
                  {member.skills.slice(0, 3).map((s) => (
                    <span key={s} className="text-[9px] px-2 py-0.5 bg-[#1e2330] text-slate-400 rounded-full border border-[#2a2f3e]">{s}</span>
                  ))}
                  {member.skills.length > 3 && (
                    <span className="text-[9px] px-2 py-0.5 bg-[#1e2330] text-slate-600 rounded-full">+{member.skills.length - 3}</span>
                  )}
                </div>

                {/* Active Task */}
                {activeTask ? (
                  <div className="bg-[#1e2330] rounded-xl p-3 border border-[#2a2f3e] mb-3">
                    <div className="flex justify-between items-start mb-1.5">
                      <span className="text-xs font-bold text-white truncate max-w-[160px]">{activeTask.title}</span>
                      <span className={`text-[10px] font-mono font-bold ml-2 shrink-0 ${progress >= 100 ? "text-red-400" : "text-green-400"}`}>
                        {progress.toFixed(0)}%
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-[#0f1117] rounded-full overflow-hidden">
                      <div className="h-full bg-green-500 rounded-full transition-all" style={{ width: `${progress}%` }} />
                    </div>
                  </div>
                ) : (
                  <div className="bg-[#1e2330] rounded-xl p-3 border border-[#2a2f3e] mb-3 text-center text-xs text-slate-600 font-bold py-2">
                    No active task
                  </div>
                )}

                {/* Metrics bars */}
                <div className="space-y-1.5">
                  {METRICS_LABELS.map((m) => (
                    <div key={m.key} className="flex items-center gap-2">
                      <span className="text-[9px] text-slate-600 font-bold w-8 shrink-0">{m.emoji}</span>
                      <div className="flex-1 h-1.5 bg-[#0f1117] rounded-full overflow-hidden">
                        <div className="h-full bg-purple-500 rounded-full transition-all"
                          style={{ width: `${(member.metrics[m.key as keyof typeof member.metrics] / 10) * 100}%` }} />
                      </div>
                      <span className="text-[9px] text-slate-400 font-mono font-bold w-4 text-right">
                        {member.metrics[m.key as keyof typeof member.metrics]}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Footer stats */}
                <div className="flex justify-between items-center mt-3 pt-3 border-t border-[#2a2f3e]">
                  <span className="text-[10px] text-slate-600">
                    {memberTasks.length} tasks · {completedTasks} done
                  </span>
                  <span className="text-[10px] text-green-400 font-bold">
                    {member.availableHours.toFixed(0)}h free
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Member Detail Modal */}
      {selectedMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setSelectedMember(null); }}>
          <div className="bg-[#161922] border border-[#2a2f3e] w-full max-w-lg rounded-3xl p-6 shadow-2xl animate-slide-up max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-700 to-purple-900 flex items-center justify-center text-sm font-bold text-white">
                  {selectedMember.name.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-xl font-black text-white">{selectedMember.name}</h3>
                  <p className="text-sm text-slate-500">{selectedMember.role}</p>
                </div>
              </div>
              <button onClick={() => setSelectedMember(null)} className="text-slate-500 hover:text-white"><X size={20} /></button>
            </div>

            {/* Skills */}
            <div className="mb-4">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Skills</h4>
              <div className="flex flex-wrap gap-1.5">
                {selectedMember.skills.map((s) => (
                  <span key={s} className="text-xs px-3 py-1 bg-yellow-600/10 text-yellow-400 rounded-full border border-yellow-600/20">{s}</span>
                ))}
              </div>
            </div>

            {/* Software */}
            <div className="mb-4">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Software</h4>
              <div className="flex flex-wrap gap-1.5">
                {selectedMember.software.map((s) => (
                  <span key={s} className="text-xs px-3 py-1 bg-blue-600/10 text-blue-400 rounded-full border border-blue-600/20">{s}</span>
                ))}
              </div>
            </div>

            {/* Metrics */}
            <div className="mb-4">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Performance Metrics</h4>
              <div className="grid grid-cols-5 gap-2">
                {METRICS_LABELS.map((m) => (
                  <div key={m.key} className="bg-[#1e2330] rounded-xl p-3 text-center border border-[#2a2f3e]">
                    <div className="text-lg font-black text-purple-400">{selectedMember.metrics[m.key as keyof typeof selectedMember.metrics]}</div>
                    <div className="text-[9px] text-slate-600 font-bold mt-1">{m.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Capacity */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-[#1e2330] rounded-xl p-3 border border-[#2a2f3e] text-center">
                <div className="text-lg font-black text-blue-400">{selectedMember.bookedHours.toFixed(0)}h</div>
                <div className="text-[10px] text-slate-600 font-bold">BOOKED</div>
              </div>
              <div className="bg-[#1e2330] rounded-xl p-3 border border-[#2a2f3e] text-center">
                <div className="text-lg font-black text-green-400">{selectedMember.availableHours.toFixed(0)}h</div>
                <div className="text-[10px] text-slate-600 font-bold">FREE</div>
              </div>
              <div className="bg-[#1e2330] rounded-xl p-3 border border-[#2a2f3e] text-center">
                <div className="text-lg font-black text-purple-400">{selectedMember.capacityHours}h</div>
                <div className="text-[10px] text-slate-600 font-bold">CAPACITY</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
