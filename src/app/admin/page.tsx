"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  Activity,
  Users,
  Layers,
  Wallet,
  Clock,
  TrendingUp,
  TrendingDown,
  Zap,
  Flame,
  Diamond,
  AlertOctagon,
  Play,
  PauseCircle,
  Coffee,
  ChevronRight,
  Plus,
  Calendar,
  Timer,
  CheckCircle,
  Bell,
  ArrowUpRight,
} from "lucide-react";
import {
  INITIAL_TEAM_DATA,
  INITIAL_PROJECTS_DATA,
  INITIAL_TASKS_DATA,
  MONTHLY_CAPACITY_LIMIT,
} from "@/lib/initialData";
import type { TeamMember, Project, Task } from "@/types";

// ─── HELPERS ─────────────────────────────────────────────────────────────────

function formatTime(seconds: number): string {
  const h = Math.floor(Math.abs(seconds) / 3600);
  const m = Math.floor((Math.abs(seconds) % 3600) / 60);
  const s = Math.abs(seconds) % 60;
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

function getDateString(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

// ─── DYNAMIC DATA CALC ────────────────────────────────────────────────────────

function calculateTeamMetrics(tasks: Task[], team: TeamMember[]): TeamMember[] {
  const memberMap = new Map(team.map((m) => [m.name, { ...m, bookedHours: 0 }]));

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
}

function calculateProjectMetrics(tasks: Task[], projects: Project[]): Project[] {
  return projects.map((p) => {
    const projTasks = tasks.filter((t) => t.project === p.name);
    const consumed = projTasks.reduce(
      (sum, t) => sum + t.actualHours + (t.extensions?.reduce((s, e) => s + e.hours, 0) || 0),
      0
    );
    const revisions = projTasks.reduce((sum, t) => {
      const variance = t.actualHours - t.estHours;
      return sum + (variance > 0 ? variance : 0);
    }, 0);
    const savings = projTasks.reduce((sum, t) => {
      if (t.status === "Completed") {
        const variance = t.estHours - t.actualHours;
        return sum + (variance > 0 ? variance : 0);
      }
      return sum;
    }, 0);
    return {
      ...p,
      consumedHours: consumed,
      remainingBudget: Math.max(0, p.budgetHours - consumed),
      revisions,
      savings,
    };
  });
}

function calculateStudioStats(tasks: Task[], team: TeamMember[]) {
  const totalCapacity = team.length * MONTHLY_CAPACITY_LIMIT;
  const totalBooked = tasks.reduce(
    (sum, t) => sum + t.actualHours + (t.extensions?.reduce((s, e) => s + e.hours, 0) || 0),
    0
  );
  const revisions = tasks.reduce((sum, t) => {
    const variance = t.actualHours - t.estHours;
    return sum + (variance > 0 ? variance : 0);
  }, 0);
  const savings = tasks.reduce((sum, t) => {
    if (t.status === "Completed") {
      const variance = t.estHours - t.actualHours;
      return sum + (variance > 0 ? variance : 0);
    }
    return sum;
  }, 0);
  return {
    totalCapacity,
    totalBooked,
    totalAvailable: Math.max(0, totalCapacity - totalBooked),
    totalRevisions: revisions,
    totalSavings: savings,
  };
}

// ─── COMPONENTS ───────────────────────────────────────────────────────────────

function StudioTimeBank({ stats, tasks }: { stats: ReturnType<typeof calculateStudioStats>; tasks: Task[] }) {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const i = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(i);
  }, []);

  const hasActiveWork = tasks.some((t) => t.status === "In Progress" && (t.workState === "play" || t.workState === "meeting"));
  const currentHour = now.getHours();
  const isOvertime = currentHour < 12 || currentHour >= 22;
  const isOvertimeActive = isOvertime && hasActiveWork;

  const { totalAvailable } = stats;
  const availableSeconds = Math.max(0, totalAvailable) * 3600;
  const displaySeconds = isOvertimeActive ? availableSeconds + Math.floor((now.getTime() % 60000) / 1000) : availableSeconds;

  return (
    <div className="bg-[#161922] border border-[#2a2f3e] rounded-3xl p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-purple-500/20 rounded-xl flex items-center justify-center">
          <Wallet className="text-purple-400" size={20} />
        </div>
        <div>
          <h2 className="text-base font-bold text-white">Studio Time Bank</h2>
          <p className="text-xs text-slate-500 font-ui">Monthly Balance</p>
        </div>
      </div>

      <div className="flex items-end gap-4 mb-6">
        <span className={`text-5xl font-bold font-mono tracking-tighter ${stats.totalAvailable < 0 ? "text-red-400" : "text-green-400"}`}>
          {formatTime(displaySeconds).slice(0, 5)}
        </span>
        <span className="text-sm text-slate-400 mb-2 font-bold">REMAINING</span>
      </div>

      <div className="grid grid-cols-4 gap-3">
        <div className="bg-[#1e2330] p-3 rounded-xl border border-[#2a2f3e]">
          <div className="flex items-center gap-1 text-[10px] text-slate-500 font-bold uppercase mb-1">
            {isOvertimeActive ? <Flame size={10} className="text-red-400" /> : <Clock size={10} />}
            Overtime
          </div>
          <div className={`text-xl font-bold font-mono ${isOvertimeActive ? "text-red-400" : "text-slate-600"}`}>
            {formatTime(isOvertimeActive ? displaySeconds : 0).slice(0, 5)}
          </div>
        </div>
        <div className="bg-[#1e2330] p-3 rounded-xl border border-[#2a2f3e]">
          <div className="text-[10px] text-slate-500 font-bold uppercase mb-1">🔥 Occupied</div>
          <div className="text-xl font-bold text-blue-400 font-mono">{stats.totalBooked.toFixed(0)}h</div>
        </div>
        <div className="bg-[#1e2330] p-3 rounded-xl border border-[#2a2f3e]">
          <div className="text-[10px] text-slate-500 font-bold uppercase mb-1">🔻 Revisions</div>
          <div className="text-xl font-bold text-red-400 font-mono">{stats.totalRevisions.toFixed(1)}h</div>
        </div>
        <div className="bg-[#1e2330] p-3 rounded-xl border border-[#2a2f3e]">
          <div className="text-[10px] text-slate-500 font-bold uppercase mb-1">💎 Savings</div>
          <div className="text-xl font-bold text-yellow-400 font-mono">{stats.totalSavings.toFixed(1)}h</div>
        </div>
      </div>
    </div>
  );
}

function BigClock() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const i = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(i);
  }, []);

  return (
    <div className="bg-[#161922] border border-[#2a2f3e] rounded-3xl p-6 flex flex-col items-center justify-center">
      <div className="text-5xl font-mono font-bold text-white tracking-widest mb-1">
        {now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false })}
      </div>
      <div className="text-sm text-slate-500 font-ui">
        {now.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
      </div>
      <div className="flex items-center gap-2 mt-4 text-xs text-green-400 bg-green-900/20 px-3 py-1 rounded-full border border-green-800/50">
        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
        STUDIO LIVE
      </div>
    </div>
  );
}

function EnhancedTeamCard({ member, activeTask, onClick }: {
  member: TeamMember;
  activeTask?: Task;
  onClick: () => void;
}) {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const i = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(i);
  }, []);

  const currentStatus = activeTask?.workState || "pause";
  const statusConfig = {
    play: { border: "border-green-500/40", bg: "bg-green-900/5", dot: "bg-green-500", label: "BUSY", color: "text-green-400" },
    meeting: { border: "border-purple-500/40", bg: "bg-purple-900/5", dot: "bg-purple-500", label: "MEETING", color: "text-purple-400" },
    pause: { border: "border-orange-500/40", bg: "bg-orange-900/5", dot: "bg-orange-500", label: "ON HOLD", color: "text-orange-400" },
  };
  const sc = statusConfig[currentStatus as keyof typeof statusConfig] || statusConfig.pause;

  const progress = activeTask ? Math.min(100, (activeTask.actualHours / activeTask.estHours) * 100) : 0;
  const remainingSeconds = activeTask ? Math.max(0, (activeTask.estHours - activeTask.actualHours) * 3600) : 0;
  const remainingDisplay = formatTime(remainingSeconds).slice(0, 5);

  return (
    <div
      onClick={onClick}
      className={`bg-[#161922] border ${sc.border} ${sc.bg} rounded-2xl p-4 cursor-pointer hover:border-purple-500/30 transition-all group`}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-12 h-12 rounded-full bg-[#1e2330] flex items-center justify-center text-sm font-bold text-slate-300 border-2 border-[#2a2f3e]">
              {member.name.slice(0, 2).toUpperCase()}
            </div>
            <div className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-[#0f1117] ${sc.dot} animate-pulse`} />
          </div>
          <div>
            <h4 className="font-bold text-white text-sm">{member.name}</h4>
            <p className="text-xs text-slate-500 font-ui">{member.role}</p>
          </div>
        </div>
        <div className={`text-xs font-bold px-2 py-1 rounded-lg border ${sc.color} ${sc.dot}/20 ${sc.dot}/30`}>
          {activeTask ? sc.label : "OFFLINE"}
        </div>
      </div>

      {activeTask ? (
        <div className="bg-[#1e2330] p-3 rounded-xl border border-[#2a2f3e]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-300 truncate max-w-[150px]">{activeTask.title}</span>
            <span className={`font-mono text-xs font-bold ${sc.color}`}>{remainingDisplay}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="flex-1 h-1.5 bg-[#0f1117] rounded-full overflow-hidden">
              <div className="h-full bg-green-500 transition-all" style={{ width: `${progress}%` }} />
            </div>
            <span className="text-[10px] text-slate-500 font-bold">{progress.toFixed(0)}%</span>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-2 text-slate-600 text-xs font-bold py-3">
          <div className="w-1.5 h-1.5 rounded-full bg-slate-700" />
          No active task
        </div>
      )}

      <div className="grid grid-cols-5 gap-2 border-t border-[#2a2f3e] pt-3 mt-3">
        <div className="text-center">
          <div className="text-[9px] text-slate-600 font-bold">🔥 BOOKED</div>
          <div className="text-xs font-bold text-blue-400">{member.bookedHours.toFixed(0)}h</div>
        </div>
        <div className="text-center">
          <div className="text-[9px] text-slate-600 font-bold">🟢 FREE</div>
          <div className="text-xs font-bold text-green-400">{member.availableHours.toFixed(0)}h</div>
        </div>
        <div className="text-center">
          <div className="text-[9px] text-slate-600 font-bold">⚡ SPEED</div>
          <div className="text-xs font-bold text-purple-400">{member.metrics.speed}</div>
        </div>
        <div className="text-center">
          <div className="text-[9px] text-slate-600 font-bold">💎 QUALITY</div>
          <div className="text-xs font-bold text-yellow-400">{member.metrics.quality}</div>
        </div>
        <div className="text-center">
          <div className="text-[9px] text-slate-600 font-bold">🎨 CREA</div>
          <div className="text-xs font-bold text-sky-400">{member.metrics.creativity}</div>
        </div>
      </div>
    </div>
  );
}

function HappeningNow({ tasks, team, onTaskClick }: {
  tasks: Task[];
  team: TeamMember[];
  onTaskClick: (task: Task) => void;
}) {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const i = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(i);
  }, []);

  const activeTasks = tasks.filter((t) => t.status === "In Progress");

  return (
    <div className="bg-[#161922] border border-[#2a2f3e] rounded-3xl p-6">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center">
          <Zap className="text-purple-400" size={16} />
        </div>
        <h3 className="text-sm font-bold text-white">Happening Now</h3>
        <span className="text-xs text-slate-600 ml-auto">{activeTasks.length} active</span>
      </div>

      <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
        {activeTasks.map((task) => {
          const progress = Math.min(100, (task.actualHours / task.estHours) * 100);
          const remainingSeconds = Math.max(0, (task.estHours - task.actualHours) * 3600);
          const isOvertime = remainingSeconds <= 0;

          return (
            <div
              key={task.id}
              onClick={() => onTaskClick(task)}
              className="flex items-center justify-between p-3 bg-[#1e2330] rounded-xl border border-[#2a2f3e] cursor-pointer hover:border-purple-500/30 transition-all"
            >
              <div className="flex flex-col gap-1.5 flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <div className={`w-1.5 h-1.5 rounded-full ${isOvertime ? "bg-red-500 animate-pulse" : "bg-green-500 animate-pulse"}`} />
                  <span className="text-xs font-bold text-white truncate">{task.title}</span>
                </div>
                <div className="flex items-center gap-2 pl-3.5">
                  <div className="w-16 h-1 bg-[#0f1117] rounded-full overflow-hidden">
                    <div className="h-full bg-green-500" style={{ width: `${progress}%` }} />
                  </div>
                  <span className="text-[10px] text-slate-400 font-bold">{progress.toFixed(0)}%</span>
                  <span className="text-[10px] text-slate-600">· {task.assignees[0]}</span>
                </div>
              </div>
              <div className={`font-mono text-xs font-bold ml-3 shrink-0 ${isOvertime ? "text-red-400 animate-pulse" : "text-slate-300"}`}>
                {isOvertime ? "+" : ""}{formatTime(remainingSeconds).slice(0, 5)}
              </div>
            </div>
          );
        })}
        {activeTasks.length === 0 && (
          <div className="text-center py-8 text-slate-600 text-sm">No active tasks right now</div>
        )}
      </div>
    </div>
  );
}

function ProjectMiniCard({ project }: { project: Project & { consumedHours?: number; remainingBudget?: number; revisions?: number; savings?: number } }) {
  const consumed = project.consumedHours || 0;
  const progress = Math.min(100, (consumed / project.budgetHours) * 100);
  const isCritical = project.health === "Risk" || project.health === "Critical";

  return (
    <div className="bg-[#1e2330] border border-[#2a2f3e] rounded-2xl p-4 cursor-pointer hover:border-purple-500/30 transition-all">
      <div className="flex justify-between items-start mb-2">
        <span className="text-xs text-slate-500 font-bold uppercase">{project.client}</span>
        <span className={`text-[9px] font-bold px-2 py-0.5 rounded border ${isCritical ? "text-red-400 bg-red-500/10 border-red-500/20" : "text-green-400 bg-green-500/10 border-green-500/20"}`}>
          {isCritical ? "AT RISK" : "ON TRACK"}
        </span>
      </div>
      <h4 className="text-base font-bold text-white mb-2 truncate">{project.name}</h4>
      <div className="flex justify-between items-center mb-2">
        <span className="text-xs text-slate-500">Budget: {consumed.toFixed(0)}h / {project.budgetHours}h</span>
        <span className="text-xs font-bold text-green-400">{project.remainingBudget?.toFixed(0) || 0}h left</span>
      </div>
      <div className="w-full h-1.5 bg-[#0f1117] rounded-full overflow-hidden">
        <div className={`h-full transition-all ${isCritical ? "bg-red-500" : "bg-purple-500"}`} style={{ width: `${progress}%` }} />
      </div>
    </div>
  );
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────

export default function AdminDashboard() {
  const { data: session } = useSession();
  const router = useRouter();

  const [tasks] = useState<Task[]>(INITIAL_TASKS_DATA);
  const [team] = useState<TeamMember[]>(INITIAL_TEAM_DATA);
  const [projects] = useState<Project[]>(INITIAL_PROJECTS_DATA);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const teamWithMetrics = useMemo(() => calculateTeamMetrics(tasks, team), [tasks, team]);
  const projectsWithMetrics = useMemo(() => calculateProjectMetrics(tasks, projects), [tasks, projects]);
  const studioStats = useMemo(() => calculateStudioStats(tasks, teamWithMetrics), [tasks, teamWithMetrics]);

  const getActiveTask = useCallback((member: TeamMember): Task | undefined => {
    if (!member.activeTaskId) return undefined;
    return tasks.find((t) => t.id === member.activeTaskId && t.status === "In Progress");
  }, [tasks]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Welcome */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white font-ui">
            Good {new Date().getHours() < 12 ? "Morning" : new Date().getHours() < 17 ? "Afternoon" : "Evening"},
            <span className="text-purple-400 ml-2">{session?.user?.name?.split(" ")[0] || "Admin"}</span>
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Here&apos;s what&apos;s happening across {projects.length} active projects
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-600 bg-[#161922] border border-[#2a2f3e] px-3 py-1.5 rounded-lg font-ui">
            {studioStats.totalAvailable.toFixed(0)}h available this month
          </span>
        </div>
      </div>

      {/* Top Row: Time Bank + Clock */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2">
          <StudioTimeBank stats={studioStats} tasks={tasks} />
        </div>
        <BigClock />
      </div>

      {/* Live Team + Happening Now */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <Users size={14} />
              Live Team Status
            </h3>
            <button
              onClick={() => router.push("/admin/team")}
              className="text-xs text-purple-400 hover:text-purple-300 font-semibold flex items-center gap-1"
            >
              View All <ChevronRight size={12} />
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {teamWithMetrics.map((member) => (
              <EnhancedTeamCard
                key={member.id}
                member={member}
                activeTask={getActiveTask(member)}
                onClick={() => {}}
              />
            ))}
          </div>
        </div>

        <div>
          <HappeningNow tasks={tasks} team={team} onTaskClick={setSelectedTask} />
        </div>
      </div>

      {/* Projects */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
            <Layers size={14} />
            Active Projects
          </h3>
          <button
            onClick={() => router.push("/admin/projects")}
            className="text-xs text-purple-400 hover:text-purple-300 font-semibold flex items-center gap-1"
          >
            View All <ChevronRight size={12} />
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {projectsWithMetrics.map((project) => (
            <ProjectMiniCard key={project.id} project={project} />
          ))}
        </div>
      </div>
    </div>
  );
}
