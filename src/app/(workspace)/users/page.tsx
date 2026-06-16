"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { RoleGate } from "@/components/auth/role-gate";
import { usePermissions } from "@/hooks/use-permissions";
import type { UserRole } from "@/lib/auth/types";
import { getAllRoles, getRoleLabel } from "@/lib/auth/permissions";

type SystemUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  lastLogin: string;
  createdAt: string;
};

// Default users based on SWI structure
const DEFAULT_USERS: SystemUser[] = [
  { id: "dev-beriman", name: "Beriman Juliano", email: "beriman.juliano@gmail.com", role: "ceo", isActive: true, lastLogin: new Date().toISOString(), createdAt: "2026-01-01T00:00:00.000Z" },
  { id: "dev-coo", name: "COO SWI", email: "coo@swi.id", role: "coo", isActive: true, lastLogin: "2026-06-15T10:00:00.000Z", createdAt: "2026-01-15T00:00:00.000Z" },
  { id: "dev-komisaris", name: "Komisaris SWI", email: "komisaris@swi.id", role: "komisaris", isActive: true, lastLogin: "2026-06-10T14:00:00.000Z", createdAt: "2026-01-15T00:00:00.000Z" },
  { id: "dev-panitia", name: "Panitia Event", email: "panitia@swi.id", role: "panitia", isActive: true, lastLogin: "2026-06-16T08:00:00.000Z", createdAt: "2026-02-01T00:00:00.000Z" },
  { id: "dev-freelancer", name: "Freelancer", email: "freelancer@swi.id", role: "freelancer", isActive: false, lastLogin: "2026-05-20T16:00:00.000Z", createdAt: "2026-03-01T00:00:00.000Z" },
];

function formatDate(dateStr: string): string {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function getRoleBadgeVariant(role: UserRole): string {
  const variants: Record<UserRole, string> = {
    ceo: "bg-purple-100 text-purple-700 border-purple-200",
    coo: "bg-blue-100 text-blue-700 border-blue-200",
    komisaris: "bg-amber-100 text-amber-700 border-amber-200",
    panitia: "bg-green-100 text-green-700 border-green-200",
    freelancer: "bg-gray-100 text-gray-700 border-gray-200",
  };
  return variants[role] || "bg-gray-100 text-gray-700";
}

export default function UsersPage() {
  const { hasAccess } = usePermissions();
  const [users, setUsers] = useState<SystemUser[]>(DEFAULT_USERS);
  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState<UserRole | "all">("all");
  const [showAddForm, setShowAddForm] = useState(false);
  const [newUser, setNewUser] = useState({ name: "", email: "", role: "panitia" as UserRole });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editRole, setEditRole] = useState<UserRole>("panitia");

  const canManage = hasAccess("user-management");

  const filteredUsers = users.filter((u) => {
    const matchesSearch = u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase());
    const matchesRole = filterRole === "all" || u.role === filterRole;
    return matchesSearch && matchesRole;
  });

  const roleCounts = users.reduce((acc, u) => {
    acc[u.role] = (acc[u.role] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const activeCount = users.filter((u) => u.isActive).length;

  const handleAddUser = () => {
    if (!newUser.name || !newUser.email) return;
    const user: SystemUser = {
      id: `user-${Date.now()}`,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      isActive: true,
      lastLogin: "-",
      createdAt: new Date().toISOString(),
    };
    setUsers((prev) => [...prev, user]);
    setNewUser({ name: "", email: "", role: "panitia" });
    setShowAddForm(false);
  };

  const handleRoleChange = (userId: string, newRole: UserRole) => {
    setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u)));
    setEditingId(null);
  };

  const handleToggleActive = (userId: string) => {
    setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, isActive: !u.isActive } : u)));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">👥 User Management</h2>
          <p className="text-muted-foreground">
            Kelola akun pengguna dan hak akses systemswi.
          </p>
        </div>
        {canManage && (
          <Button onClick={() => setShowAddForm(!showAddForm)}>
            {showAddForm ? "Batal" : "➕ Tambah User"}
          </Button>
        )}
      </div>

      <RoleGate feature="user-management">
        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Total User</CardTitle></CardHeader>
            <CardContent><div className="text-2xl font-bold">{users.length}</div></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Aktif</CardTitle></CardHeader>
            <CardContent><div className="text-2xl font-bold text-green-600">{activeCount}</div></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Role</CardTitle></CardHeader>
            <CardContent><div className="text-2xl font-bold">{Object.keys(roleCounts).length}</div></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Nonaktif</CardTitle></CardHeader>
            <CardContent><div className="text-2xl font-bold text-red-600">{users.length - activeCount}</div></CardContent>
          </Card>
        </div>

        {/* Add User Form */}
        {showAddForm && (
          <Card className="border-primary/30 bg-primary/5">
            <CardHeader>
              <CardTitle className="text-base">Tambah User Baru</CardTitle>
              <CardDescription>User baru akan mendapat akses sesuai role yang dipilih.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Nama</label>
                  <Input value={newUser.name} onChange={(e) => setNewUser((p) => ({ ...p, name: e.target.value }))} placeholder="Nama lengkap" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Email</label>
                  <Input value={newUser.email} onChange={(e) => setNewUser((p) => ({ ...p, email: e.target.value }))} placeholder="email@swi.id" type="email" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Role</label>
                  <select
                    value={newUser.role}
                    onChange={(e) => setNewUser((p) => ({ ...p, role: e.target.value as UserRole }))}
                    className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                  >
                    {getAllRoles().map((role) => (
                      <option key={role} value={role}>{getRoleLabel(role)}</option>
                    ))}
                  </select>
                </div>
                <div className="flex items-end">
                  <Button onClick={handleAddUser} disabled={!newUser.name || !newUser.email} className="w-full">
                    Simpan
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Filters */}
        <div className="flex gap-3 flex-wrap">
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama atau email..."
            className="max-w-xs"
          />
          <div className="flex gap-1 flex-wrap">
            <button
              onClick={() => setFilterRole("all")}
              className={`text-xs rounded-full border px-3 py-1 transition-colors ${filterRole === "all" ? "bg-primary text-primary-foreground border-primary" : "bg-background hover:border-primary/50"}`}
            >
              Semua ({users.length})
            </button>
            {getAllRoles().map((role) => (
              <button
                key={role}
                onClick={() => setFilterRole(role)}
                className={`text-xs rounded-full border px-3 py-1 transition-colors ${filterRole === role ? "bg-primary text-primary-foreground border-primary" : "bg-background hover:border-primary/50"}`}
              >
                {getRoleLabel(role)} ({roleCounts[role] || 0})
              </button>
            ))}
          </div>
        </div>

        {/* Users Table */}
        <Card>
          <CardContent className="p-0">
            <div className="overflow-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left px-4 py-3 font-medium">User</th>
                    <th className="text-left px-4 py-3 font-medium">Role</th>
                    <th className="text-left px-4 py-3 font-medium">Status</th>
                    <th className="text-left px-4 py-3 font-medium">Last Login</th>
                    <th className="text-left px-4 py-3 font-medium">Created</th>
                    {canManage && <th className="text-right px-4 py-3 font-medium">Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="border-b last:border-0 hover:bg-muted/30">
                      <td className="px-4 py-3">
                        <div className="font-medium">{user.name}</div>
                        <div className="text-xs text-muted-foreground">{user.email}</div>
                      </td>
                      <td className="px-4 py-3">
                        {editingId === user.id ? (
                          <select
                            value={editRole}
                            onChange={(e) => setEditRole(e.target.value as UserRole)}
                            onBlur={() => { handleRoleChange(user.id, editRole); }}
                            onKeyDown={(e) => { if (e.key === "Enter") handleRoleChange(user.id, editRole); }}
                            className="rounded-md border bg-background px-2 py-1 text-xs"
                            autoFocus
                          >
                            {getAllRoles().map((role) => (
                              <option key={role} value={role}>{getRoleLabel(role)}</option>
                            ))}
                          </select>
                        ) : (
                          <span className={`text-xs px-2 py-1 rounded-full border ${getRoleBadgeVariant(user.role)}`}>
                            {getRoleLabel(user.role)}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-1 rounded-full ${user.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                          {user.isActive ? "Aktif" : "Nonaktif"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{formatDate(user.lastLogin)}</td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{formatDate(user.createdAt)}</td>
                      {canManage && (
                        <td className="px-4 py-3 text-right">
                          <div className="flex justify-end gap-1">
                            <button
                              onClick={() => { setEditingId(user.id); setEditRole(user.role); }}
                              className="text-xs px-2 py-1 rounded border hover:bg-muted"
                              title="Ubah role"
                            >
                              ✏️
                            </button>
                            <button
                              onClick={() => handleToggleActive(user.id)}
                              className="text-xs px-2 py-1 rounded border hover:bg-muted"
                              title={user.isActive ? "Nonaktifkan" : "Aktifkan"}
                            >
                              {user.isActive ? "🔴" : "🟢"}
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                  {filteredUsers.length === 0 && (
                    <tr>
                      <td colSpan={canManage ? 6 : 5} className="px-4 py-8 text-center text-muted-foreground">
                        Tidak ada user yang cocok dengan filter.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Role Permissions Reference */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">📋 Role Permissions Reference</CardTitle>
            <CardDescription>Ringkasan akses per role di systemswi.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left px-3 py-2 font-medium">Feature</th>
                    {getAllRoles().map((role) => (
                      <th key={role} className="text-center px-3 py-2 font-medium">{getRoleLabel(role)}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {["dashboard", "dashboard:overview", "event-cde", "documents", "automation", "reports", "drive", "ai-features", "user-management", "settings"].map((feature) => (
                    <tr key={feature} className="border-b last:border-0">
                      <td className="px-3 py-2 font-mono text-xs">{feature}</td>
                      {getAllRoles().map((role) => {
                        const level = role === "ceo" || role === "coo" ? "admin" : role === "komisaris" ? (["ai-features", "user-management", "settings"].includes(feature) ? "none" : "view") : role === "panitia" ? (["event-cde", "events"].includes(feature) ? "edit" : ["documents"].includes(feature) ? "view" : "none") : (["reports", "drive"].includes(feature) ? "view" : "none");
                        return (
                          <td key={role} className="text-center px-3 py-2">
                            <span className={`px-1.5 py-0.5 rounded text-[10px] ${level === "admin" ? "bg-purple-100 text-purple-700" : level === "edit" ? "bg-blue-100 text-blue-700" : level === "view" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-400"}`}>
                              {level === "admin" ? "✏️" : level === "edit" ? "📝" : level === "view" ? "👁️" : "—"}
                            </span>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </RoleGate>
    </div>
  );
}
