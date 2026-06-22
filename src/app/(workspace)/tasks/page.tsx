"use client";

import { useState, useEffect, type FormEvent } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// ── Types ──
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

interface TaskApiResponse {
  sourceStatus?: string;
  tasks?: Task[];
  stats?: TaskStats;
  error?: string;
}

interface MyTasksResponse {
  sourceStatus?: string;
  assignee?: string;
  tasks?: Task[];
  stats?: TaskStats;
  error?: string;
}

interface OverdueResponse {
  sourceStatus?: string;
  today?: string;
  overdueTasks?: Task[];
  count?: number;
  error?: string;
}

// ── Helpers ──
function formatDate(dateStr: string): string {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
}

function isOverdue(dueDate: string, status: string): boolean {
  if (!dueDate || status === "Done" || status === "Cancelled") return false;
  return dueDate < new Date().toISOString().slice(0, 10);
}

function getPriorityBadge(priority: string) {
  const p = (priority || "Medium").toLowerCase();
  if (p === "high") return "bg-red-100 text-red-700 border-red-200";
  if (p === "medium") return "bg-yellow-100 text-yellow-700 border-yellow-200";
  return "bg-blue-100 text-blue-700 border-blue-200";
}

function getStatusBadge(status: string) {
  const s = (status || "Todo").toLowerCase();
  if (s === "done") return "bg-green-100 text-green-700";
  if (s === "in progress") return "bg-blue-100 text-blue-700";
  if (s === "review") return "bg-purple-100 text-purple-700";
  if (s === "cancelled") return "bg-gray-100 text-gray-500";
  return "bg-gray-100 text-gray-700";
}

const ASSIGNEES = ["Beriman", "Siti Aminah", "Ahmad Rizki", "Dewi Lestari", "Rudi Hartono"];
const STATUSES = ["Todo", "In Progress", "Review", "Done", "Cancelled"];
const PRIORITIES = ["High", "Medium", "Low"];

// ── Stat Card ──
function StatCard({ label, value, color, icon }: { label: string; value: number; color: string; icon: string }) {
  return (
    <Card className={`${color} border`}>
      <CardContent className="p-4 flex items-center justify-between">
        <div>
          <p className="text-sm font-medium opacity-80">{label}</p>
          <p className="text-3xl font-bold">{value}</p>
        </div>
        <span className="text-3xl">{icon}</span>
      </CardContent>
    </Card>
  );
}

// ── Task Card (Kanban) ──
function TaskCard({ task, onStatusChange }: { task: Task; onStatusChange?: (id: string, status: string) => void }) {
  const overdue = isOverdue(task.dueDate, task.status);
  return (
    <Card className={`mb-3 ${overdue ? "border-red-300" : ""}`}>
      <CardContent className="p-3">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h4 className="font-medium text-sm leading-tight">{task.title}</h4>
          <Badge className={`text-xs shrink-0 ${getPriorityBadge(task.priority)}`}>{task.priority}</Badge>
        </div>
        {task.description && <p className="text-xs text-muted-foreground mb-2 line-clamp-2">{task.description}</p>}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span className="flex items-center gap-1">👤 {task.assignee}</span>
          <span className={overdue ? "text-red-600 font-semibold" : ""}>📅 {formatDate(task.dueDate)}</span>
        </div>
        {task.relatedEvent && <p className="text-xs text-muted-foreground mt-1">🔗 {task.relatedEvent}</p>}
        {onStatusChange && task.status !== "Done" && (
          <select
            className="mt-2 text-xs border rounded px-2 py-1 w-full"
            value={task.status}
            onChange={(e) => onStatusChange(task.id, e.target.value)}
          >
            {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        )}
      </CardContent>
    </Card>
  );
}

// ── Create Task Modal ──
function CreateTaskModal({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState({ title: "", description: "", assignee: "Beriman", dueDate: "", priority: "Medium", relatedEvent: "" });
  const [submitting, setSubmitting] = useState(false);

  if (!open) return null;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, createdBy: "System" }),
      });
      if (res.ok) {
        setForm({ title: "", description: "", assignee: "Beriman", dueDate: "", priority: "Medium", relatedEvent: "" });
        onCreated();
        onClose();
      }
    } catch { /* ignore */ }
    setSubmitting(false);
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-card rounded-lg shadow-lg max-w-lg w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="p-6">
          <h2 className="text-xl font-bold mb-4">➕ Buat Task Baru</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Title *</Label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required placeholder="Judul task..." />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Deskripsi task..." rows={3} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Assignee</Label>
                <select className="w-full border rounded-md px-3 py-2 text-sm" value={form.assignee} onChange={(e) => setForm({ ...form, assignee: e.target.value })}>
                  {ASSIGNEES.map((a) => <option key={a} value={a}>{a}</option>)}
                </select>
              </div>
              <div>
                <Label>Due Date</Label>
                <Input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Priority</Label>
                <select className="w-full border rounded-md px-3 py-2 text-sm" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
                  {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <Label>Related Event/Project</Label>
                <Input value={form.relatedEvent} onChange={(e) => setForm({ ...form, relatedEvent: e.target.value })} placeholder="Nama event/proyek..." />
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <Button type="submit" disabled={submitting} className="flex-1">
                {submitting ? "⏳ Menyimpan..." : "✅ Buat Task"}
              </Button>
              <Button type="button" variant="outline" onClick={onClose}>Batal</Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ──
export default function TasksPage() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [tasks, setTasks] = useState<Task[]>([]);
  const [stats, setStats] = useState<TaskStats | null>(null);
  const [myTasks, setMyTasks] = useState<Task[]>([]);
  const [myStats, setMyStats] = useState<TaskStats | null>(null);
  const [overdueTasks, setOverdueTasks] = useState<Task[]>([]);
  const [overdueCount, setOverdueCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [statusFilter, setStatusFilter] = useState("");
  const [assigneeFilter, setAssigneeFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");

  async function fetchAll() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.set("status", statusFilter);
      if (assigneeFilter) params.set("assignee", assigneeFilter);
      if (priorityFilter) params.set("priority", priorityFilter);

      const [allRes, myRes, overdueRes] = await Promise.all([
        fetch(`/api/tasks?${params}`),
        fetch("/api/tasks/my?assignee=Siti Aminah"),
        fetch("/api/tasks/overdue"),
      ]);

      const allData: TaskApiResponse = await allRes.json();
      const myData: MyTasksResponse = await myRes.json();
      const overdueData: OverdueResponse = await overdueRes.json();

      setTasks(allData.tasks || []);
      setStats(allData.stats || null);
      setMyTasks(myData.tasks || []);
      setMyStats(myData.stats || null);
      setOverdueTasks(overdueData.overdueTasks || []);
      setOverdueCount(overdueData.count || 0);
    } catch (err) {
      console.error("Failed to fetch tasks:", err);
    }
    setLoading(false);
  }

  useEffect(() => { fetchAll(); }, [statusFilter, assigneeFilter, priorityFilter]);

  async function handleStatusChange(id: string, newStatus: string) {
    try {
      await fetch(`/api/tasks/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      fetchAll();
    } catch { /* ignore */ }
  }

  // ── Dashboard Tab ──
  function DashboardTab() {
    if (loading) return <div className="grid grid-cols-2 md:grid-cols-4 gap-4">{[1,2,3,4].map((i) => <Skeleton key={i} className="h-24" />)}</div>;

    const s = stats || { total: 0, todoCount: 0, inProgressCount: 0, reviewCount: 0, doneCount: 0, overdueCount: 0 };
    const today = new Date().toISOString().slice(0, 10);
    const todayTasks = tasks.filter((t) => t.dueDate === today);
    const upcoming = tasks.filter((t) => t.dueDate > today && t.dueDate <= "2099-12-31" && t.status !== "Done").sort((a, b) => (a.dueDate || "").localeCompare(b.dueDate || "")).slice(0, 5);

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="To Do" value={s.todoCount} color="bg-gray-50" icon="📋" />
          <StatCard label="In Progress" value={s.inProgressCount} color="bg-blue-50" icon="🔄" />
          <StatCard label="Review" value={s.reviewCount} color="bg-purple-50" icon="👀" />
          <StatCard label="Done" value={s.doneCount} color="bg-green-50" icon="✅" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="border-red-200">
            <CardHeader><CardTitle className="text-lg flex items-center gap-2">⚠️ Overdue Tasks</CardTitle></CardHeader>
            <CardContent>
              {overdueCount > 0 ? (
                <div className="space-y-2">
                  <p className="text-3xl font-bold text-red-600">{overdueCount} task(s)</p>
                  {overdueTasks.slice(0, 3).map((t) => (
                    <div key={t.id} className="text-sm flex justify-between">
                      <span className="font-medium">{t.title}</span>
                      <span className="text-red-600">{formatDate(t.dueDate)}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">Tidak ada task overdue 🎉</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-lg flex items-center gap-2">📅 Hari Ini</CardTitle></CardHeader>
            <CardContent>
              {todayTasks.length > 0 ? (
                <div className="space-y-2">
                  {todayTasks.map((t) => (
                    <div key={t.id} className="text-sm flex justify-between items-center">
                      <span>{t.title}</span>
                      <Badge className={getStatusBadge(t.status)}>{t.status}</Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">Tidak ada task jatuh tempo hari ini</p>
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader><CardTitle className="text-lg">📆 Upcoming Deadlines</CardTitle></CardHeader>
          <CardContent>
            {upcoming.length > 0 ? (
              <div className="space-y-2">
                {upcoming.map((t) => (
                  <div key={t.id} className="flex items-center justify-between text-sm border-b pb-2">
                    <div>
                      <span className="font-medium">{t.title}</span>
                      <span className="text-muted-foreground ml-2">({t.assignee})</span>
                    </div>
                    <span className="text-muted-foreground">{formatDate(t.dueDate)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">Tidak ada upcoming deadlines</p>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // ── My Tasks Tab ──
  function MyTasksTab() {
    if (loading) return <Skeleton className="h-64" />;
    const ms = myStats || { total: 0, todoCount: 0, inProgressCount: 0, reviewCount: 0, doneCount: 0, overdueCount: 0 };
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-4 flex-wrap">
          <Badge className="bg-gray-100 text-gray-700">📋 Todo: {ms.todoCount}</Badge>
          <Badge className="bg-blue-100 text-blue-700">🔄 In Progress: {ms.inProgressCount}</Badge>
          <Badge className="bg-purple-100 text-purple-700">👀 Review: {ms.reviewCount}</Badge>
          <Badge className="bg-green-100 text-green-700">✅ Done: {ms.doneCount}</Badge>
          {ms.overdueCount > 0 && <Badge className="bg-red-100 text-red-700">⚠️ Overdue: {ms.overdueCount}</Badge>}
        </div>
        <div className="space-y-3">
          {myTasks.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">Tidak ada task untuk Anda</p>
          ) : (
            myTasks.map((task) => (
              <Card key={task.id} className={isOverdue(task.dueDate, task.status) ? "border-red-300" : ""}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <h4 className="font-medium">{task.title}</h4>
                      {task.description && <p className="text-sm text-muted-foreground mt-1">{task.description}</p>}
                      <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                        <span>📅 {formatDate(task.dueDate)}</span>
                        <Badge className={`text-xs ${getPriorityBadge(task.priority)}`}>{task.priority}</Badge>
                        {task.relatedEvent && <span>🔗 {task.relatedEvent}</span>}
                      </div>
                    </div>
                    <select
                      className="text-sm border rounded px-2 py-1"
                      value={task.status}
                      onChange={(e) => handleStatusChange(task.id, e.target.value)}
                    >
                      {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    );
  }

  // ── All Tasks Tab ──
  function AllTasksTab() {
    if (loading) return <Skeleton className="h-64" />;
    return (
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <Button onClick={() => setShowCreate(true)} size="sm">➕ Buat Task</Button>
          <select className="border rounded-md px-3 py-1.5 text-sm" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">All Status</option>
            {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <select className="border rounded-md px-3 py-1.5 text-sm" value={assigneeFilter} onChange={(e) => setAssigneeFilter(e.target.value)}>
            <option value="">All Assignee</option>
            {ASSIGNEES.map((a) => <option key={a} value={a}>{a}</option>)}
          </select>
          <select className="border rounded-md px-3 py-1.5 text-sm" value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)}>
            <option value="">All Priority</option>
            {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
          <span className="text-sm text-muted-foreground">{tasks.length} task(s)</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left p-2">Title</th>
                <th className="text-left p-2">Assignee</th>
                <th className="text-left p-2">Due Date</th>
                <th className="text-left p-2">Priority</th>
                <th className="text-left p-2">Status</th>
                <th className="text-left p-2">Event</th>
              </tr>
            </thead>
            <tbody>
              {tasks.map((task) => (
                <tr key={task.id} className={`border-b hover:bg-muted/50 ${isOverdue(task.dueDate, task.status) ? "bg-red-50" : ""}`}>
                  <td className="p-2">
                    <div className="font-medium">{task.title}</div>
                    {task.description && <div className="text-xs text-muted-foreground truncate max-w-xs">{task.description}</div>}
                  </td>
                  <td className="p-2">{task.assignee}</td>
                  <td className={`p-2 ${isOverdue(task.dueDate, task.status) ? "text-red-600 font-semibold" : ""}`}>{formatDate(task.dueDate)}</td>
                  <td className="p-2"><Badge className={`text-xs ${getPriorityBadge(task.priority)}`}>{task.priority}</Badge></td>
                  <td className="p-2">
                    <select className="text-xs border rounded px-1 py-0.5" value={task.status} onChange={(e) => handleStatusChange(task.id, e.target.value)}>
                      {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </td>
                  <td className="p-2 text-xs text-muted-foreground">{task.relatedEvent || "-"}</td>
                </tr>
              ))}
              {tasks.length === 0 && (
                <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">Tidak ada task ditemukan</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // ── Kanban Tab ──
  function KanbanTab() {
    if (loading) return <Skeleton className="h-64" />;
    const columns = [
      { title: "To Do", status: "Todo", color: "bg-gray-100 border-gray-300" },
      { title: "In Progress", status: "In Progress", color: "bg-blue-100 border-blue-300" },
      { title: "Review", status: "Review", color: "bg-purple-100 border-purple-300" },
      { title: "Done", status: "Done", color: "bg-green-100 border-green-300" },
    ];

    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {columns.map((col) => {
          const colTasks = tasks.filter((t) => t.status === col.status);
          return (
            <div key={col.status} className={`rounded-lg border-2 p-3 min-h-[200px] ${col.color}`}>
              <h3 className="font-bold text-sm mb-3 flex items-center justify-between">
                {col.title}
                <Badge className="text-xs">{colTasks.length}</Badge>
              </h3>
              <div>
                {colTasks.map((task) => (
                  <TaskCard key={task.id} task={task} onStatusChange={handleStatusChange} />
                ))}
                {colTasks.length === 0 && <p className="text-xs text-muted-foreground text-center py-4">Kosong</p>}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">✅ Task Management</h1>
          <p className="text-muted-foreground">Sistem task tracking untuk tim SWI</p>
        </div>
        <Button onClick={() => setShowCreate(true)}>➕ Buat Task</Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="dashboard">📊 Dashboard</TabsTrigger>
          <TabsTrigger value="my-tasks">👤 My Tasks</TabsTrigger>
          <TabsTrigger value="all-tasks">📋 All Tasks</TabsTrigger>
          <TabsTrigger value="kanban">🗂️ Kanban</TabsTrigger>
        </TabsList>
        <TabsContent value="dashboard"><DashboardTab /></TabsContent>
        <TabsContent value="my-tasks"><MyTasksTab /></TabsContent>
        <TabsContent value="all-tasks"><AllTasksTab /></TabsContent>
        <TabsContent value="kanban"><KanbanTab /></TabsContent>
      </Tabs>

      <CreateTaskModal open={showCreate} onClose={() => setShowCreate(false)} onCreated={fetchAll} />
    </div>
  );
}
