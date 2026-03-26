"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import {
  doc,
  collection,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { hash } from "bcryptjs";
import type { Role } from "@/types";
import {
  Users,
  Plus,
  X,
  Shield,
  Pencil,
  Trash2,
  CheckCircle,
  AlertCircle,
  Loader2,
  UserCog,
} from "lucide-react";

// ─── TYPES ──────────────────────────────────────────────────────────────────

interface AppUser {
  id: string;
  username: string;
  name: string;
  password?: string;
  role: Role;
  createdAt?: string;
}

// ─── ROLE CONFIG ─────────────────────────────────────────────────────────────

const ROLES: { value: Role; label: string; color: string; icon: string }[] = [
  { value: "admin", label: "Admin", color: "text-purple-400 bg-purple-400/10 border-purple-400/30", icon: "👑" },
  { value: "producer", label: "Producer", color: "text-blue-400 bg-blue-400/10 border-blue-400/30", icon: "🎬" },
  { value: "head", label: "Head", color: "text-amber-400 bg-amber-400/10 border-amber-400/30", icon: "👁" },
  { value: "creative", label: "Creative Designer", color: "text-green-400 bg-green-400/10 border-green-400/30", icon: "🎨" },
];

// ─── SEED USERS ──────────────────────────────────────────────────────────────

const DEFAULT_USERS = [
  { username: "amr", name: "Amr Sabry", role: "admin" as Role, password: "aroma2026" },
  { username: "safwat", name: "Mohamed Safwat", role: "creative" as Role, password: "aroma2026" },
  { username: "abbas", name: "Mohamed Abbas", role: "creative" as Role, password: "aroma2026" },
  { username: "rana", name: "Rana Elsherbeny", role: "creative" as Role, password: "aroma2026" },
  { username: "fatma", name: "Fatma Elawady", role: "creative" as Role, password: "aroma2026" },
  { username: "ahmed", name: "Ahmed Esmail", role: "creative" as Role, password: "aroma2026" },
  { username: "maryam", name: "Maryam Elzeiny", role: "producer" as Role, password: "aroma2026" },
  { username: "farida", name: "Farida", role: "producer" as Role, password: "aroma2026" },
];

// ─── COMPONENT ───────────────────────────────────────────────────────────────

export default function UsersPage() {
  const { data: session } = useSession();
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<AppUser | null>(null);
  const [notification, setNotification] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [saving, setSaving] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [form, setForm] = useState({
    username: "",
    name: "",
    password: "",
    role: "creative" as Role,
  });

  // Form errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Load users from Firestore
  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, "aroma-pulse/production/users"),
      (snapshot) => {
        const data: AppUser[] = [];
        snapshot.forEach((docSnap) => {
          const d = docSnap.data();
          data.push({
            id: docSnap.id,
            username: d.username || "",
            name: d.name || "",
            role: d.role || "creative",
            createdAt: d.createdAt || "",
          });
        });
        setUsers(data);
        setLoading(false);
      },
      (error) => {
        console.error("Firestore error:", error);
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, []);

  // Auto-dismiss notifications
  useEffect(() => {
    if (notification) {
      const t = setTimeout(() => setNotification(null), 3000);
      return () => clearTimeout(t);
    }
  }, [notification]);

  // ─── VALIDATE FORM ──────────────────────────────────────────────────────

  function validateForm(): boolean {
    const errs: Record<string, string> = {};
    if (!form.username.trim()) errs.username = "Username is required";
    else if (!/^[a-zA-Z0-9_]+$/.test(form.username)) errs.username = "Only letters, numbers, underscore";
    else if (form.username.length < 3) errs.username = "At least 3 characters";
    else if (!editingUser && !form.password) errs.password = "Password is required";
    else if (form.password && form.password.length < 4) errs.password = "At least 4 characters";
    if (!form.name.trim()) errs.name = "Full name is required";
    if (!form.role) errs.role = "Role is required";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  // ─── SEED DEFAULT USERS ────────────────────────────────────────────────

  async function handleSeed() {
    setSeeding(true);
    let seeded = 0;
    let failed = 0;

    for (const u of DEFAULT_USERS) {
      try {
        // Check if username already exists
        const existing = users.find(
          (x) => x.username.toLowerCase() === u.username.toLowerCase()
        );
        if (existing) continue;

        const hashedPassword = await hash(u.password, 10);
        const id = u.username.toLowerCase();
        await setDoc(doc(db, "aroma-pulse/production/users", id), {
          username: u.username.toLowerCase(),
          name: u.name,
          password: hashedPassword,
          role: u.role,
          createdAt: new Date().toISOString(),
        });
        seeded++;
      } catch {
        failed++;
      }
    }

    setSeeding(false);
    if (seeded > 0) {
      setNotification({ message: `✅ ${seeded} users created successfully!`, type: "success" });
    } else if (failed > 0) {
      setNotification({ message: `⚠️ ${failed} users failed to create`, type: "error" });
    } else {
      setNotification({ message: "ℹ️ All default users already exist", type: "success" });
    }
  }

  // ─── SAVE USER ─────────────────────────────────────────────────────────

  async function handleSave() {
    if (!validateForm()) return;
    setSaving(true);
    setErrors({});

    try {
      const data: Partial<AppUser> = {
        username: form.username.toLowerCase().trim(),
        name: form.name.trim(),
        role: form.role,
      };

      if (form.password) {
        data.password = await hash(form.password, 10);
      }

      if (editingUser) {
        // Don't overwrite password if empty
        if (!form.password) {
          delete data.password;
        }
        await updateDoc(
          doc(db, "aroma-pulse/production/users", editingUser.id),
          data
        );
        setNotification({ message: `✅ "${form.name}" updated!`, type: "success" });
      } else {
        const id = form.username.toLowerCase().trim();
        const existing = users.find((u) => u.id === id);
        if (existing) {
          setErrors({ username: "Username already taken" });
          setSaving(false);
          return;
        }
        await setDoc(doc(db, "aroma-pulse/production/users", id), {
          ...data,
          password: data.password,
          createdAt: new Date().toISOString(),
        });
        setNotification({ message: `✅ "${form.name}" added!`, type: "success" });
      }

      setShowModal(false);
      resetForm();
    } catch (error) {
      console.error("Save error:", error);
      setNotification({ message: "❌ Failed to save. Check console.", type: "error" });
    } finally {
      setSaving(false);
    }
  }

  // ─── DELETE USER ───────────────────────────────────────────────────────

  async function handleDelete(user: AppUser) {
    if (!confirm(`Delete user "${user.name}" (@${user.username})?`)) return;
    try {
      await deleteDoc(doc(db, "aroma-pulse/production/users", user.id));
      setNotification({ message: `✅ "${user.name}" deleted`, type: "success" });
    } catch {
      setNotification({ message: "❌ Failed to delete user", type: "error" });
    }
  }

  // ─── OPEN MODAL ─────────────────────────────────────────────────────────

  function openAdd() {
    resetForm();
    setEditingUser(null);
    setShowModal(true);
  }

  function openEdit(user: AppUser) {
    setForm({ username: user.username, name: user.name, password: "", role: user.role });
    setEditingUser(user);
    setErrors({});
    setShowModal(true);
  }

  function resetForm() {
    setForm({ username: "", name: "", password: "", role: "creative" });
    setErrors({});
  }

  // ─── RENDER ─────────────────────────────────────────────────────────────

  const getRoleConfig = (role: Role) => ROLES.find((r) => r.value === role) || ROLES[3];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Notification */}
      {notification && (
        <div className={`fixed top-20 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-3 px-6 py-3 rounded-2xl border shadow-2xl animate-slide-up ${
          notification.type === "success"
            ? "bg-green-900/90 border-green-600 text-green-200"
            : "bg-red-900/90 border-red-600 text-red-200"
        }`}>
          {notification.type === "success" ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
          <span className="font-bold">{notification.message}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white font-ui">
            Team <span className="text-purple-400">Accounts</span>
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {users.length} account{users.length !== 1 ? "s" : ""} — only admins can manage
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleSeed}
            disabled={seeding || users.length > 0}
            className="flex items-center gap-2 px-4 py-2 bg-[#1e2330] border border-[#2a2f3e] rounded-xl text-sm font-semibold text-slate-400 hover:text-white hover:border-blue-500/40 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {seeding ? <Loader2 size={14} className="animate-spin" /> : <Shield size={14} />}
            {users.length === 0 ? "Seed Default Users" : "Users Created"}
          </button>
          <button
            onClick={openAdd}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 rounded-xl text-sm font-bold text-white transition-all shadow-lg shadow-purple-900/30"
          >
            <Plus size={16} />
            Add User
          </button>
        </div>
      </div>

      {/* Info Banner */}
      {users.length === 0 && !loading && (
        <div className="bg-[#161922] border border-[#2a2f3e] rounded-2xl p-8 text-center">
          <UserCog size={40} className="text-slate-700 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-white mb-2">No accounts yet</h3>
          <p className="text-sm text-slate-500 mb-5">
            Click <strong className="text-purple-400">&quot;Seed Default Users&quot;</strong> to create all default accounts at once,
            <br />or click <strong className="text-purple-400">&quot;Add User&quot;</strong> to create accounts manually.
          </p>
          <div className="bg-[#1e2330] rounded-xl p-4 text-left inline-block border border-[#2a2f3e]">
            <p className="text-xs text-slate-500 mb-2 font-bold">Default login credentials:</p>
            <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-xs font-mono">
              <span className="text-slate-400">admin / aroma2026</span>
              <span className="text-slate-400">producer / aroma2026</span>
              <span className="text-slate-400">creative / aroma2026</span>
              <span className="text-slate-400">username → password</span>
            </div>
          </div>
        </div>
      )}

      {/* Users Grid */}
      {users.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {users.map((user) => {
            const roleCfg = getRoleConfig(user.role);
            return (
              <div
                key={user.id}
                className="bg-[#161922] border border-[#2a2f3e] rounded-2xl p-5 hover:border-purple-500/30 transition-all group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-purple-700 to-purple-900 flex items-center justify-center text-sm font-bold text-white shadow-md">
                      {user.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="font-bold text-white text-sm">{user.name}</h4>
                      <p className="text-xs text-slate-500 font-mono">@{user.username}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => openEdit(user)}
                      className="p-1.5 rounded-lg text-slate-600 hover:text-blue-400 hover:bg-blue-900/20 transition-all"
                      title="Edit"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => handleDelete(user)}
                      className="p-1.5 rounded-lg text-slate-600 hover:text-red-400 hover:bg-red-900/20 transition-all"
                      title="Delete"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                <div className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-lg border ${roleCfg.color}`}>
                  <span>{roleCfg.icon}</span>
                  <span className="capitalize">{roleCfg.label}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={32} className="animate-spin text-purple-500" />
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          onClick={(e) => { if (e.target === e.currentTarget) { setShowModal(false); } }}
        >
          <div className="bg-[#161922] border border-[#2a2f3e] w-full max-w-md rounded-3xl p-6 shadow-2xl animate-slide-up">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-black text-white">
                {editingUser ? `Edit: ${editingUser.name}` : "Add New User"}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-500 hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              {/* Username */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Username</label>
                <input
                  type="text"
                  value={form.username}
                  onChange={(e) => setForm({ ...form, username: e.target.value })}
                  placeholder="e.g. amr, rana, safwat"
                  disabled={!!editingUser}
                  className={`w-full bg-[#0f1117] border rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:ring-2 focus:ring-purple-500/20 outline-none transition-all font-ui ${
                    errors.username ? "border-red-500" : "border-[#2a2f3e] focus:border-purple-500"
                  } ${editingUser ? "opacity-50 cursor-not-allowed" : ""}`}
                />
                {errors.username && <p className="text-xs text-red-400">{errors.username}</p>}
                <p className="text-[10px] text-slate-600">
                  {editingUser ? "Username cannot be changed" : "Letters, numbers, underscore. Min 3 chars."}
                </p>
              </div>

              {/* Full Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Full Name</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Amr Sabry"
                  className={`w-full bg-[#0f1117] border rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:ring-2 focus:ring-purple-500/20 outline-none transition-all font-ui ${
                    errors.name ? "border-red-500" : "border-[#2a2f3e] focus:border-purple-500"
                  }`}
                />
                {errors.name && <p className="text-xs text-red-400">{errors.name}</p>}
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  {editingUser ? "New Password (leave empty to keep)" : "Password"}
                </label>
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder={editingUser ? "••••••••" : "Min 4 characters"}
                  className={`w-full bg-[#0f1117] border rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:ring-2 focus:ring-purple-500/20 outline-none transition-all font-ui ${
                    errors.password ? "border-red-500" : "border-[#2a2f3e] focus:border-purple-500"
                  }`}
                />
                {errors.password && <p className="text-xs text-red-400">{errors.password}</p>}
              </div>

              {/* Role */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Role</label>
                <div className="grid grid-cols-2 gap-2">
                  {ROLES.map((r) => (
                    <button
                      key={r.value}
                      type="button"
                      onClick={() => setForm({ ...form, role: r.value })}
                      className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-semibold transition-all ${
                        form.role === r.value
                          ? `${r.color} border-current bg-current/10`
                          : "bg-[#0f1117] border-[#2a2f3e] text-slate-500 hover:text-slate-300"
                      }`}
                    >
                      <span>{r.icon}</span>
                      <span>{r.label}</span>
                    </button>
                  ))}
                </div>
                {errors.role && <p className="text-xs text-red-400">{errors.role}</p>}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 py-3 rounded-xl bg-[#1e2330] border border-[#2a2f3e] text-slate-400 font-bold hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {saving ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle size={16} />}
                {editingUser ? "Update User" : "Create User"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
