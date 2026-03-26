"use client";

import { useState, useEffect, useMemo } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  collection,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  orderBy,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { INITIAL_PROJECTS_DATA, INITIAL_TASKS_DATA } from "@/lib/initialData";
import type { Project, Task } from "@/types";
import {
  Layers,
  Plus,
  X,
  Pencil,
  Trash2,
  CheckCircle,
  AlertCircle,
  Loader2,
  Calendar,
  Clock,
  Briefcase,
  TrendingUp,
  ChevronRight,
  FolderKanban,
} from "lucide-react";

const HEALTH_COLORS = {
  Good: "text-green-400 bg-green-400/10 border-green-400/30",
  Risk: "text-amber-400 bg-amber-400/10 border-amber-400/30",
  Critical: "text-red-400 bg-red-400/10 border-red-400/30",
};

export default function ProjectsPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Project | null>(null);
  const [notification, setNotification] = useState<{ m: string; t: "s" | "e" } | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "", client: "", budgetHours: "", deadline: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [seeding, setSeeding] = useState(false);

  // Load data
  useEffect(() => {
    const unsubP = onSnapshot(collection(db, "aroma-pulse/production/projects"), (snap) => {
      const data = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Project));
      if (data.length === 0) setSeeding(true);
      setProjects(data);
      setLoading(false);
    });
    const unsubT = onSnapshot(collection(db, "aroma-pulse/production/tasks"), (snap) => {
      const data = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Task));
      setTasks(data);
    });
    return () => { unsubP(); unsubT(); };
  }, []);

  // Auto-dismiss
  useEffect(() => {
    if (notification) {
      const t = setTimeout(() => setNotification(null), 3000);
      return () => clearTimeout(t);
    }
  }, [notification]);

  // Calculate project metrics
  const projectsWithMetrics = useMemo(() => {
    return projects.map((p) => {
      const ptasks = tasks.filter((t) => t.project === p.name);
      const consumed = ptasks.reduce(
        (s, t) => s + t.actualHours + (t.extensions?.reduce((e, x) => e + x.hours, 0) || 0), 0);
      const revisions = ptasks.reduce((s, t) => {
        const v = t.actualHours - t.estHours;
        return s + (v > 0 ? v : 0);
      }, 0);
      const savings = ptasks.reduce((s, t) => {
        if (t.status === "Completed") {
          const v = t.estHours - t.actualHours;
          return s + (v > 0 ? v : 0);
        }
        return s;
      }, 0);
      return { ...p, consumedHours: consumed, remainingBudget: Math.max(0, p.budgetHours - consumed), revisions, savings };
    });
  }, [projects, tasks]);

  // Seed
  async function handleSeed() {
    setSeeding(true);
    for (const p of INITIAL_PROJECTS_DATA) {
      try {
        await addDoc(collection(db, "aroma-pulse/production/projects"), p);
      } catch {}
    }
    for (const t of INITIAL_TASKS_DATA) {
      try {
        await addDoc(collection(db, "aroma-pulse/production/tasks"), t);
      } catch {}
    }
    setSeeding(false);
  }

  // Validate
  function validate() {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = "Project name is required";
    if (!form.client.trim()) e.client = "Client name is required";
    if (!form.budgetHours || Number(form.budgetHours) <= 0) e.budgetHours = "Valid budget required";
    if (!form.deadline) e.deadline = "Deadline is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSave() {
    if (!validate()) return;
    setSaving(true);
    try {
      const data = {
        name: form.name.trim(),
        client: form.client.trim(),
        budgetHours: Number(form.budgetHours),
        deadline: form.deadline,
        status: "Active" as const,
        health: "Good" as const,
        milestones: [] as { title: string; date: number; completed: boolean }[],
      };
      if (editing) {
        await updateDoc(doc(db, "aroma-pulse/production/projects", editing.id), data);
        setNotification({ m: "✅ Project updated!", t: "s" });
      } else {
        await addDoc(collection(db, "aroma-pulse/production/projects"), data);
        setNotification({ m: "✅ Project created!", t: "s" });
      }
      setShowModal(false);
      resetForm();
    } catch {
      setNotification({ m: "❌ Failed to save project", t: "e" });
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(project: Project) {
    if (!confirm(`Delete "${project.name}"?`)) return;
    try {
      await deleteDoc(doc(db, "aroma-pulse/production/projects", project.id));
      setNotification({ m: `✅ "${project.name}" deleted`, t: "s" });
    } catch {
      setNotification({ m: "❌ Failed to delete", t: "e" });
    }
  }

  function openAdd() { resetForm(); setEditing(null); setShowModal(true); }
  function openEdit(p: Project) {
    setForm({ name: p.name, client: p.client, budgetHours: String(p.budgetHours), deadline: p.deadline });
    setEditing(p); setErrors({}); setShowModal(true);
  }
  function resetForm() {
    setForm({ name: "", client: "", budgetHours: "", deadline: "" });
    setErrors({});
  }

  // Stats
  const stats = useMemo(() => {
    const active = projectsWithMetrics.filter((p) => p.status === "Active").length;
    const atRisk = projectsWithMetrics.filter((p) => p.health !== "Good").length;
    const totalBudget = projectsWithMetrics.reduce((s, p) => s + p.budgetHours, 0);
    const totalConsumed = projectsWithMetrics.reduce((s, p) => s + (p.consumedHours || 0), 0);
    return { active, atRisk, totalBudget, totalConsumed };
  }, [projectsWithMetrics]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Notification */}
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
            <span className="text-purple-400">Projects</span>
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">{projectsWithMetrics.length} projects · {stats.active} active · {stats.atRisk} at risk</p>
        </div>
        <div className="flex items-center gap-3">
          {projects.length === 0 && !loading && (
            <button onClick={handleSeed} disabled={seeding}
              className="flex items-center gap-2 px-4 py-2 bg-[#1e2330] border border-[#2a2f3e] rounded-xl text-sm font-semibold text-slate-400 hover:text-white hover:border-blue-500/40 transition-all disabled:opacity-40">
              {seeding ? <Loader2 size={14} className="animate-spin" /> : <FolderKanban size={14} />}
              Seed Sample Projects
            </button>
          )}
          <button onClick={openAdd}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 rounded-xl text-sm font-bold text-white transition-all shadow-lg shadow-purple-900/30">
            <Plus size={16} /> New Project
          </button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Active Projects", value: stats.active, icon: <Briefcase size={16} />, color: "text-purple-400" },
          { label: "At Risk", value: stats.atRisk, icon: <AlertCircle size={16} />, color: "text-red-400" },
          { label: "Total Budget", value: `${stats.totalBudget}h`, icon: <Clock size={16} />, color: "text-blue-400" },
          { label: "Hours Used", value: `${stats.totalConsumed.toFixed(0)}h`, icon: <TrendingUp size={16} />, color: "text-green-400" },
        ].map((stat) => (
          <div key={stat.label} className="bg-[#161922] border border-[#2a2f3e] rounded-2xl p-4">
            <div className={`flex items-center gap-2 mb-2 ${stat.color}`}>{stat.icon}<span className="text-xs font-bold uppercase tracking-wider">{stat.label}</span></div>
            <div className="text-2xl font-bold text-white font-mono">{stat.value}</div>
          </div>
        ))}
      </div>

      {/* Projects Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20"><Loader2 size={32} className="animate-spin text-purple-500" /></div>
      ) : projectsWithMetrics.length === 0 ? (
        <div className="bg-[#161922] border border-[#2a2f3e] rounded-3xl p-12 text-center">
          <Layers size={40} className="text-slate-700 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-white mb-2">No projects yet</h3>
          <p className="text-sm text-slate-500 mb-5">Click &quot;Seed Sample Projects&quot; to load demo data, or create your first project.</p>
          <button onClick={openAdd} className="px-6 py-3 bg-purple-600 hover:bg-purple-500 rounded-xl text-sm font-bold text-white transition-all inline-flex items-center gap-2">
            <Plus size={16} /> Create First Project
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {projectsWithMetrics.map((project) => {
            const progress = Math.min(100, ((project.consumedHours || 0) / project.budgetHours) * 100);
            const isCritical = project.health !== "Good";
            return (
              <div key={project.id}
                className="bg-[#161922] border border-[#2a2f3e] rounded-2xl p-5 hover:border-purple-500/30 transition-all group cursor-pointer"
                onClick={() => router.push(`/admin/projects/${project.id}`)}>
                <div className="flex justify-between items-start mb-3">
                  <span className="text-xs text-slate-500 font-bold uppercase">{project.client}</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${HEALTH_COLORS[project.health]}`}>{project.health.toUpperCase()}</span>
                </div>
                <h3 className="text-lg font-bold text-white mb-3">{project.name}</h3>

                {/* Budget bar */}
                <div className="space-y-1.5 mb-3">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500">Budget: {(project.consumedHours || 0).toFixed(0)}h / {project.budgetHours}h</span>
                    <span className="text-green-400 font-bold">{project.remainingBudget?.toFixed(0) || 0}h left</span>
                  </div>
                  <div className="w-full h-2 bg-[#0f1117] rounded-full overflow-hidden">
                    <div className={`h-full transition-all rounded-full ${isCritical ? "bg-red-500" : "bg-purple-500"}`} style={{ width: `${progress}%` }} />
                  </div>
                </div>

                {/* Meta */}
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-1.5 text-xs text-slate-500">
                    <Calendar size={11} />
                    {project.deadline}
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                    <button onClick={() => openEdit(project)} className="p-1.5 rounded-lg text-slate-600 hover:text-blue-400 hover:bg-blue-900/20 transition-all"><Pencil size={13} /></button>
                    <button onClick={() => handleDelete(project)} className="p-1.5 rounded-lg text-slate-600 hover:text-red-400 hover:bg-red-900/20 transition-all"><Trash2 size={13} /></button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false); }}>
          <div className="bg-[#161922] border border-[#2a2f3e] w-full max-w-md rounded-3xl p-6 shadow-2xl animate-slide-up">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-black text-white">{editing ? "Edit Project" : "New Project"}</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-500 hover:text-white"><X size={20} /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Project Name</label>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Ora Iraq AI AD"
                  className={`w-full bg-[#0f1117] border rounded-xl px-4 py-3 text-white placeholder-slate-600 outline-none transition-all ${errors.name ? "border-red-500" : "border-[#2a2f3e] focus:border-purple-500"}`} />
                {errors.name && <p className="text-xs text-red-400 mt-1">{errors.name}</p>}
              </div>
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Client Name</label>
                <input value={form.client} onChange={(e) => setForm({ ...form, client: e.target.value })} placeholder="e.g. Ora Developers"
                  className={`w-full bg-[#0f1117] border rounded-xl px-4 py-3 text-white placeholder-slate-600 outline-none transition-all ${errors.client ? "border-red-500" : "border-[#2a2f3e] focus:border-purple-500"}`} />
                {errors.client && <p className="text-xs text-red-400 mt-1">{errors.client}</p>}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Budget (hours)</label>
                  <input type="number" value={form.budgetHours} onChange={(e) => setForm({ ...form, budgetHours: e.target.value })} placeholder="e.g. 200"
                    className={`w-full bg-[#0f1117] border rounded-xl px-4 py-3 text-white placeholder-slate-600 outline-none transition-all ${errors.budgetHours ? "border-red-500" : "border-[#2a2f3e] focus:border-purple-500"}`} />
                  {errors.budgetHours && <p className="text-xs text-red-400 mt-1">{errors.budgetHours}</p>}
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Deadline</label>
                  <input type="date" value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })}
                    className={`w-full bg-[#0f1117] border rounded-xl px-4 py-3 text-white outline-none transition-all ${errors.deadline ? "border-red-500" : "border-[#2a2f3e] focus:border-purple-500"}`} />
                  {errors.deadline && <p className="text-xs text-red-400 mt-1">{errors.deadline}</p>}
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowModal(false)} className="flex-1 py-3 rounded-xl bg-[#1e2330] border border-[#2a2f3e] text-slate-400 font-bold hover:text-white transition-colors">Cancel</button>
              <button onClick={handleSave} disabled={saving}
                className="flex-1 py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold flex items-center justify-center gap-2 disabled:opacity-60 transition-all">
                {saving ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle size={16} />}
                {editing ? "Update" : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
