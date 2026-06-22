"use client";

import { useState, useEffect, useCallback, type FormEvent } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// ── Types ──────────────────────────────────────────────────────────
interface Task {
  id: string;
  title: string;
  description: string;
  assignee: string;
  picName: string;
  dueDate: string;
  priority: string;
  status: string;
  relatedEvent: string;
  createdBy: string;
  createdDate: string;
  completedDate: string;
  notes: string;
}

interface TaskStats {
  total: number;
  todoCount: number;
  inProgressCount: number;
  reviewCount: number;
  doneCount: number;
  overdueCount: number;
}

interface TasksResponse {
  source: string;
  sourceStatus: string;
  tasks: Task[];
  stats: TaskStats;
}

interface MyTasksResponse {
  source: string;
  sourceStatus: string;
  assignee: string;
  tasks: Task[];
  stats: TaskStats;
}

interface OverdueResponse {
  source: string;
  sourceStatus: string;
  today: string;
  overdueTasks: Task[];
  count: number;
}

// ── Helpers ────────────────────────────────────────────────────────
const PRIORITY_COLORS: Record<string, string> = {
  High: "bg-red-500/15 text-red-300 ring-red-400/30",
  Medium: "bg-amber-500/15 text-amber-200 ring-amber-400/30",
  Low: "bg-emerald-500/15 text-emerald-200 ring-emerald-400/30",
};

const STATUS_COLORS: Record<string, string> = {
  Todo: "bg-slate-500/15 text-slate-300 ring-slate-400/30",
  "In Progress": "bg-blue-500/15 text-blue-300 ring-blue-400/30",
  Review: "bg-purple-500/15 text-purple-300 ring-purple-400/30",
  Done: "bg-green-500/15 text-green-300 ring-green-400/30",
  Cancelled: "bg-gray-500/15 text-gray-400 ring-gray-400/30",
};

const KANBAN_COLUMNS = ["Todo", "In Progress", "Review", "Done"];

const ASSIGNEES = ["Beriman", "Siti Aminah", "Ahmad Rizki", "Dewi Lestari", "Rudi Hartono"];

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

function isOverdue(task: Task): boolean {
  return !!task.dueDate && task.dueDate < todayStr() && task.status !== "Done" && task.status !== "Cancelled";
}

function isDueToday(task: Task): boolean {
  return task.dueDate === todayStr();
}

function isUpcoming(task: Task): boolean {
  if (!task.dueDate) return false;
  const today = todayStr();
  const due = task.dueDate;
  return due > today && due <= today;
}

function formatDate(d: string): string {
  if (!d) return "—";
  try {
    return new Date(d + "T00:00:00").toLocaleDateString("id-ID", {
      day: "numeric", month: "short", year: "numeric",
    });
  } catch {
    return d;
  }
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className={`rounded-2xl p-5 ring-1 ${color}`}>
      <p className="text-sm opacity-70">{label}</p>
      <p className="mt-2 text-3xl font-bold">{value}</p>
    </div>
  );
}

function PriorityBadge({ priority }: { priority: string }) {
  const cls = PRIORITY_COLORS[priority] || "bg-slate-500/15 text-slate-300 ring-slate-400/30";
  return <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ${cls}`}>{priority}</span>;
}

function StatusBadge({ status }: { status: string }) {
  const cls = STATUS_COLORS[status] || "bg-slate-500/15 text-slate-300 ring-slate-400/30";
  return <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ${cls}`}>{status}</span>;
}

function TaskRow({ task, onStatusChange }: { task: Task; onStatusChange?: (id: string, status: string) => void }) {
  const overdue = isOverdue(task);
  return (
    <div className={`rounded-xl bg-white/[0.03] p-4 ring-1 ${overdue ? "ring-red-400/40" : "ring-white/[0.06]"} transition hover:bg-white/[0.05]`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-white/30 font-mono">{task.id}</span>
            <PriorityBadge priority={task.priority} />
            <StatusBadge status={task.status} />
            {overdue && <span className="text-xs text-red-400 font-medium">⚠ Overdue</span>}
          </div>
          <h3 className="mt-1.5 text-sm font-semibold text-white truncate">{task.title}</h3>
          {task.description && <p className="mt-0.5 text-xs text-white/40 line-clamp-2">{task.description}</p>}
          <div className="mt-2 flex items-center gap-4 text-xs text-white/40">
            <span>👤 {task.assignee || "—"}</span>
            <span>📅 {formatDate(task.dueDate)}</span>
            {task.relatedEvent && <span>🔗 {task.relatedEvent}</span>}
          </div>
        </div>
        {onStatusChange && task.status !== "Done" && task.status !== "Cancelled" && (
          <select
            value={task.status}
            onChange={(e) => onStatusChange(task.id, e.target.value)}
            className="rounded-lg bg-white/[0.06] px-2 py-1 text-xs text-white/70 ring-1 ring-white/10 border-none outline-none cursor-pointer"
          >
            <option value="Todo" className="bg-gray-900">Todo</option>
            <option value="In Progress" className="bg-gray-900">In Progress</option>
            <option value="Review" className="bg-gray-900">Review</option>
            <option value="Done" className="bg-gray-900">Done</option>
          </select>
        )}
      </div>
    </div>
  );
}

function KanbanCard({ task }: { task: Task }) {
  const overdue = isOverdue(task);
  return (
    <div className={`rounded-lg bg-white/[0.04] p-3 ring-1 ${overdue ? "ring-red-400/40" : "ring-white/[0.08]"} transition hover:bg-white/[0.06]`}>
      <div className="flex items-center gap-1.5 mb-1.5">
        <PriorityBadge priority={task.priority} />
        {overdue && <span className="text-[10px] text-red-400">⚠</span>}
      </div>
      <h4 className="text-xs font-semibold text-white leading-snug">{task.title}</h4>
      <div className="mt-2 flex items-center justify-between text-[10px] text-white/35">
        <span>👤 {task.assignee || "—"}</span>
        <span>📅 {formatDate(task.dueDate)}</span>
      </div>
    </div>
  );
}

function CreateTaskForm({ onCreated }: { onCreated: () => void }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setMsg("");
    const form = e.currentTarget;
    const fd = new FormData(form);
    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: fd.get("title"),
          description: fd.get("description"),
          assignee: fd.get("assignee"),
          dueDate: fd.get("dueDate"),
          priority: fd.get("priority"),
          relatedEvent: fd.get("relatedEvent"),
          createdBy: "System",
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Gagal membuat task");
      setMsg("✅ Task berhasil dibuat!");
      form.reset();
      onCreated();
      setTimeout(() => { setOpen(false); setMsg(""); }, 1500);
    } catch (err) {
      setMsg(`❌ ${String(err)}`);
    } finally {
      setLoading(false);
    }
  }

  if (!open) {
    return (
      <Button onClick={() => setOpen(true)} className="bg-emerald-600 hover:bg-emerald-700 text-white">
        + Buat Task Baru
      </Button>
    );
  }

  return (
    <div className="rounded-2xl bg-white/[0.04] p-6 ring-1 ring-white/10">
      <h3 className="text-lg font-semibold text-white mb-4">Buat Task Baru</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label className="text-xs text-white/50">Title *</Label>
            <Input name="title" required placeholder="Judul task" className="bg-white/[0.06] border-white/10 text-white placeholder:text-white/25" />
          </div>
          <div>
            <Label className="text-xs text-white/50">Assignee</Label>
            <select name="assignee" className="w-full rounded-lg bg-white/[0.06] px-3 py-2 text-sm text-white/80 ring-1 ring-white/10 border-none outline-none">
              <option value="" className="bg-gray-900">— Pilih Assignee —</option>
              {ASSIGNEES.map((a) => <option key={a} value={a} className="bg-gray-900">{a}</option>)}
            </select>
          </div>
        </div>
        <div>
          <Label className="text-xs text-white/50">Description</Label>
          <Textarea name="description" placeholder="Deskripsi task..." rows={3} className="bg-white/[0.06] border-white/10 text-white placeholder:text-white/25 resize-none" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label className="text-xs text-white/50">Due Date</Label>
            <Input name="dueDate" type="date" className="bg-white/[0.06] border-white/10 text-white" />
          </div>
          <div>
            <Label className="text-xs text-white/50">Priority</Label>
            <select name="priority" defaultValue="Medium" className="w-full rounded-lg bg-white/[0.06] px-3 py-2 text-sm text-white/80 ring-1 ring-white/10 border-none outline-none">
              <option value="High" className="bg-gray-900">High</option>
              <option value="Medium" className="bg-gray-900">Medium</option>
              <option value="Low" className="bg-gray-900">Low</option>
            </select>
          </div>
          <div>
            <Label className="text-xs text-white/50">Related Event/Project</Label>
            <Input name="relatedEvent" placeholder="Nama event/proyek" className="bg-white/[0.06] border-white/10 text-white placeholder:text-white/25" />
          </div>
        </div>
        {msg && <p className="text-sm">{msg}</p>}
        <div className="flex gap-3">
          <Button type="submit" disabled={loading} className="bg-emerald-600 hover:bg-emerald-700 text-white">
            {loading ? "Membuat..." : "Buat Task"}
          </Button>
          <Button type="button" variant="ghost" onClick={() => { setOpen(false); setMsg(""); }} className="text-white/50 hover:text-white">
            Batal
          </Button>
        </div>
      </form>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────
export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [stats, setStats] = useState<TaskStats | null>(null);
  const [overdueTasks, setOverdueTasks] = useState<Task[]>([]);
  const [overdueCount, setOverdueCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [myAssignee, setMyAssignee] = useState("Siti Aminah");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterAssignee, setFilterAssignee] = useState("");
  const [filterPriority, setFilterPriority] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  const refresh = useCallback(() => setRefreshKey((k) => k + 1), []);

  async function loadTasks() {
    setLoading(true);
    setMessage("");
    try {
      const params = new URLSearchParams();
      if (filterStatus) params.set("status", filterStatus);
      if (filterAssignee) params.set("assignee", filterAssignee);
      if (filterPriority) params.set("priority", filterPriority);
      const qs = params.toString();
      const [tasksRes, overdueRes] = await Promise.all([
        fetch(`/api/tasks${qs ? "?" + qs : ""}`, { cache: "no-store" }),
        fetch("/api/tasks/overdue", { cache: "no-store" }),
      ]);
      const tasksJson: TasksResponse = await tasksRes.json();
      const overdueJson: OverdueResponse = await overdueRes.json();
      if (!tasksRes.ok) throw new Error((tasksJson as any).error || "Gagal memuat tasks");
      setTasks(tasksJson.tasks || []);
      setStats(tasksJson.stats || null);
      setOverdueTasks(overdueJson.overdueTasks || []);
      setOverdueCount(overdueJson.count || 0);
    } catch (error) {
      setMessage(`❌ ${String(error)}`);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadTasks(); }, [refreshKey, filterStatus, filterAssignee, filterPriority]);

  async function handleStatusChange(id: string, status: string) {
    try {
      const res = await fetch(`/api/tasks/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error || "Gagal update status");
      }
      refresh();
    } catch (error) {
      setMessage(`❌ ${String(error)}`);
    }
  }

  const myTasks = tasks.filter((t) => t.assignee.toLowerCase().includes(myAssignee.toLowerCase()));
  const today = todayStr();
  const myTasksToday = myTasks.filter((t) => t.dueDate === today);
  const upcomingTasks = tasks
    .filter((t) => t.dueDate && t.dueDate > today && t.status !== "Done" && t.status !== "Cancelled")
    .sort((a, b) => (a.dueDate || "").localeCompare(b.dueDate || ""))
    .slice(0, 5);

  function kanbanTasks(status: string) {
    return tasks.filter((t) => t.status === status);
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">✅ Task Management</h1>
          <p className="text-sm text-white/40 mt-1">Kelola task dan to-do list tim SWI</p>
        </div>
        <div className="text-xs text-white/30">
          {loading ? "Memuat..." : `${tasks.length} task${tasks.length !== 1 ? "s" : ""}`}
        </div>
      </div>

      {message && (
        <div className="rounded-xl bg-red-500/10 px-4 py-3 text-sm text-red-300 ring-1 ring-red-400/20">
          {message}
        </div>
      )}

      <Tabs defaultValue="dashboard" className="space-y-6">
        <TabsList className="bg-white/[0.04] ring-1 ring-white/10 rounded-xl p-1">
          <TabsTrigger value="dashboard" className="data-[state=active]:bg-white/10 data-[state=active]:text-white text-white/50">📊 Dashboard</TabsTrigger>
          <TabsTrigger value="mytasks" className="data-[state=active]:bg-white/10 data-[state=active]:text-white text-white/50">👤 My Tasks</TabsTrigger>
          <TabsTrigger value="all" className="data-[state=active]:bg-white/10 data-[state=active]:text-white text-white/50">📋 All Tasks</TabsTrigger>
          <TabsTrigger value="kanban" className="data-[state=active]:bg-white/10 data-[state=active]:text-white text-white/50">📌 Kanban</TabsTrigger>
        </TabsList>

        {/* ── Dashboard Tab ─────────────────────────────────────── */}
        <TabsContent value="dashboard" className="space-y-6">
          {/* Stats */}
          {stats && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <StatCard label="Total" value={stats.total} color="bg-white/[0.04] ring-white/10 text-white" />
              <StatCard label="Todo" value={stats.todoCount} color="bg-slate-500/10 ring-slate-400/20 text-slate-300" />
              <StatCard label="In Progress" value={stats.inProgressCount} color="bg-blue-500/10 ring-blue-400/20 text-blue-300" />
              <StatCard label="Review" value={stats.reviewCount} color="bg-purple-500/10 ring-purple-400/20 text-purple-300" />
              <StatCard label="Done" value={stats.doneCount} color="bg-green-500/10 ring-green-400/20 text-green-300" />
              <StatCard label="Overdue" value={stats.overdueCount} color="bg-red-500/10 ring-red-400/20 text-red-300" />
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* My Tasks Today */}
            <Card className="bg-white/[0.03] ring-1 ring-white/[0.08] border-0">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold text-white">👤 My Tasks Today</CardTitle>
                <CardDescription className="text-xs text-white/35">Task yang jatuh tempo hari ini</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {myTasksToday.length === 0 ? (
                  <p className="text-xs text-white/25 py-4 text-center">Tidak ada task hari ini 🎉</p>
                ) : (
                  myTasksToday.map((t) => (
                    <TaskRow key={t.id} task={t} onStatusChange={handleStatusChange} />
                  ))
                )}
              </CardContent>
            </Card>

            {/* Upcoming Deadlines */}
            <Card className="bg-white/[0.03] ring-1 ring-white/[0.08] border-0">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold text-white">📅 Upcoming Deadlines</CardTitle>
                <CardDescription className="text-xs text-white/35">Task dengan deadline terdekat</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {upcomingTasks.length === 0 ? (
                  <p className="text-xs text-white/25 py-4 text-center">Tidak ada upcoming deadline</p>
                ) : (
                  upcomingTasks.map((t) => (
                    <TaskRow key={t.id} task={t} onStatusChange={handleStatusChange} />
                  ))
                )}
              </CardContent>
            </Card>
          </div>

          {/* Overdue Alert */}
          {overdueCount > 0 && (
            <div className="rounded-2xl bg-red-500/8 p-5 ring-1 ring-red-400/20">
              <h3 className="text-sm font-semibold text-red-300 mb-3">⚠️ {overdueCount} Overdue Task{overdueCount !== 1 ? "s" : ""}</h3>
              <div className="space-y-2">
                {overdueTasks.slice(0, 5).map((t) => (
                  <TaskRow key={t.id} task={t} onStatusChange={handleStatusChange} />
                ))}
              </div>
            </div>
          )}
        </TabsContent>

        {/* ── My Tasks Tab ──────────────────────────────────────── */}
        <TabsContent value="mytasks" className="space-y-4">
          <div className="flex items-center gap-4 flex-wrap">
            <div>
              <Label className="text-xs text-white/40">Assignee</Label>
              <select
                value={myAssignee}
                onChange={(e) => setMyAssignee(e.target.value)}
                className="mt-1 rounded-lg bg-white/[0.06] px-3 py-2 text-sm text-white/80 ring-1 ring-white/10 border-none outline-none"
              >
                {ASSIGNEES.map((a) => <option key={a} value={a} className="bg-gray-900">{a}</option>)}
              </select>
            </div>
            {myTasks.length > 0 && (
              <div className="flex gap-3 ml-auto text-xs text-white/40 items-end pb-1">
                <span>Total: <strong className="text-white/70">{myTasks.length}</strong></span>
                <span>Todo: <strong className="text-slate-300">{myTasks.filter(t => t.status === "Todo").length}</strong></span>
                <span>In Progress: <strong className="text-blue-300">{myTasks.filter(t => t.status === "In Progress").length}</strong></span>
                <span>Done: <strong className="text-green-300">{myTasks.filter(t => t.status === "Done").length}</strong></span>
              </div>
            )}
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => <div key={i} className="h-24 rounded-xl bg-white/[0.03] animate-pulse" />)}
            </div>
          ) : myTasks.length === 0 ? (
            <div className="text-center py-12 text-white/25 text-sm">Tidak ada task untuk {myAssignee}</div>
          ) : (
            <div className="space-y-3">
              {myTasks.map((t) => (
                <TaskRow key={t.id} task={t} onStatusChange={handleStatusChange} />
              ))}
            </div>
          )}
        </TabsContent>

        {/* ── All Tasks Tab ─────────────────────────────────────── */}
        <TabsContent value="all" className="space-y-4">
          <div className="flex items-end gap-4 flex-wrap">
            <CreateTaskForm onCreated={refresh} />
            <div className="flex gap-3 ml-auto flex-wrap">
              <div>
                <Label className="text-xs text-white/40">Status</Label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="mt-1 rounded-lg bg-white/[0.06] px-3 py-2 text-sm text-white/80 ring-1 ring-white/10 border-none outline-none"
                >
                  <option value="" className="bg-gray-900">Semua Status</option>
                  <option value="Todo" className="bg-gray-900">Todo</option>
                  <option value="In Progress" className="bg-gray-900">In Progress</option>
                  <option value="Review" className="bg-gray-900">Review</option>
                  <option value="Done" className="bg-gray-900">Done</option>
                </select>
              </div>
              <div>
                <Label className="text-xs text-white/40">Assignee</Label>
                <select
                  value={filterAssignee}
                  onChange={(e) => setFilterAssignee(e.target.value)}
                  className="mt-1 rounded-lg bg-white/[0.06] px-3 py-2 text-sm text-white/80 ring-1 ring-white/10 border-none outline-none"
                >
                  <option value="" className="bg-gray-900">Semua Assignee</option>
                  {ASSIGNEES.map((a) => <option key={a} value={a} className="bg-gray-900">{a}</option>)}
                </select>
              </div>
              <div>
                <Label className="text-xs text-white/40">Priority</Label>
                <select
                  value={filterPriority}
                  onChange={(e) => setFilterPriority(e.target.value)}
                  className="mt-1 rounded-lg bg-white/[0.06] px-3 py-2 text-sm text-white/80 ring-1 ring-white/10 border-none outline-none"
                >
                  <option value="" className="bg-gray-900">Semua Priority</option>
                  <option value="High" className="bg-gray-900">High</option>
                  <option value="Medium" className="bg-gray-900">Medium</option>
                  <option value="Low" className="bg-gray-900">Low</option>
                </select>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => <div key={i} className="h-24 rounded-xl bg-white/[0.03] animate-pulse" />)}
            </div>
          ) : tasks.length === 0 ? (
            <div className="text-center py-12 text-white/25 text-sm">Belum ada task. Buat task pertama!</div>
          ) : (
            <div className="space-y-3">
              {tasks.map((t) => (
                <TaskRow key={t.id} task={t} onStatusChange={handleStatusChange} />
              ))}
            </div>
          )}
        </TabsContent>

        {/* ── Kanban Tab ────────────────────────────────────────── */}
        <TabsContent value="kanban">
          {loading ? (
            <div className="grid grid-cols-4 gap-4">
              {KANBAN_COLUMNS.map((col) => (
                <div key={col} className="space-y-3">
                  <div className="h-8 rounded-lg bg-white/[0.04] animate-pulse" />
                  {[1, 2].map((i) => <div key={i} className="h-20 rounded-lg bg-white/[0.03] animate-pulse" />)}
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
              {KANBAN_COLUMNS.map((col) => {
                const colTasks = kanbanTasks(col);
                const colColor: Record<string, string> = {
                  Todo: "ring-slate-400/20",
                  "In Progress": "ring-blue-400/20",
                  Review: "ring-purple-400/20",
                  Done: "ring-green-400/20",
                };
                return (
                  <div key={col} className={`rounded-2xl bg-white/[0.02] p-4 ring-1 ${colColor[col] || "ring-white/10"}`}>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-semibold text-white">{col}</h3>
                      <span className="text-xs text-white/30 bg-white/[0.06] rounded-full px-2 py-0.5">{colTasks.length}</span>
                    </div>
                    <div className="space-y-2.5">
                      {colTasks.length === 0 ? (
                        <p className="text-xs text-white/20 text-center py-6">Kosong</p>
                      ) : (
                        colTasks.map((t) => <KanbanCard key={t.id} task={t} />)
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
