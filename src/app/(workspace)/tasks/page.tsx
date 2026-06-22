"use client";

import { useState, useEffect, type FormEvent } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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

const STATUSES = ["To Do", "In Progress", "Review", "Done"];
const PRIORITIES = ["High", "Medium", "Low"];
const ASSIGNEES = ["Beriman", "Siti Aminah", "Ahmad Rizki", "Dewi Lestari", "Rudi Hartono"];

function formatDate(dateStr: string): string {
  if (!dateStr) return "-";
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
}

function isOverdue(task: Task): boolean {
  if (!task.dueDate || task.status === "Done") return false;
  return task.dueDate < new Date().toISOString().split("T")[0];
}

function getPriorityColor(priority: string) {
  const styles: Record<string, string> = {
    High: "bg-red-100 text-red-700",
    Medium: "bg-yellow-100 text-yellow-700",
    Low: "bg-green-100 text-green-700",
  };
  return styles[priority] || "bg-gray-100 text-gray-700";
}

function getStatusColor(status: string) {
  const styles: Record<string, string> = {
    "To Do": "bg-gray-100 text-gray-700",
    "In Progress": "bg-blue-100 text-blue-700",
    Review: "bg-purple-100 text-purple-700",
    Done: "bg-green-100 text-green-700",
  };
  return styles[status] || "bg-gray-100 text-gray-700";
}

export default function TasksPage() {
  const [currentTab, setCurrentTab] = useState<"dashboard" | "my-tasks" | "all-tasks" | "kanban">("dashboard");
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createMessage, setCreateMessage] = useState<string | null>(null);

  // Filter states
  const [filterStatus, setFilterStatus] = useState("");
  const [filterAssignee, setFilterAssignee] = useState("");
  const [filterPriority, setFilterPriority] = useState("");

  // Create form
  const [formTitle, setFormTitle] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formAssignee, setFormAssignee] = useState("");
  const [formDueDate, setFormDueDate] = useState("");
  const [formPriority, setFormPriority] = useState("Medium");
  const [formRelated, setFormRelated] = useState("");

  useEffect(() => {
    async function fetchTasks() {
      try {
        setLoading(true);
        const res = await fetch("/api/tasks");
        const json = await res.json();
        if (json.tasks) {
          setTasks(json.tasks);
        }
      } catch {
        setError("Gagal memuat tasks");
      } finally {
        setLoading(false);
      }
    }
    fetchTasks();
  }, []);

  // Auto-dismiss message
  useEffect(() => {
    if (createMessage?.startsWith("✅")) {
      const timer = setTimeout(() => setCreateMessage(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [createMessage]);

  async function handleCreateTask(e: FormEvent) {
    e.preventDefault();
    setCreating(true);
    setCreateMessage(null);
    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formTitle,
          description: formDesc,
          assignee: formAssignee,
          dueDate: formDueDate,
          priority: formPriority,
          relatedEvent: formRelated,
        }),
      });
      const json = await res.json();
      if (res.ok) {
        setCreateMessage(`✅ Task "${formTitle}" berhasil dibuat!`);
        setShowCreateModal(false);
        setFormTitle("");
        setFormDesc("");
        setFormAssignee("");
        setFormDueDate("");
        setFormPriority("Medium");
        setFormRelated("");
        // Refresh
        const listRes = await fetch("/api/tasks");
        const listJson = await listRes.json();
        if (listJson.tasks) setTasks(listJson.tasks);
      } else {
        setCreateMessage(`❌ Gagal: ${json.error || "Unknown error"}`);
      }
    } catch {
      setCreateMessage("❌ Network error");
    } finally {
      setCreating(false);
    }
  }

  async function handleStatusChange(taskId: string, newStatus: string) {
    try {
      await fetch(`/api/tasks/${taskId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t))
      );
    } catch {
      // silent
    }
  }

  // Filtered tasks
  let filteredTasks = tasks;
  if (filterStatus) filteredTasks = filteredTasks.filter((t) => t.status === filterStatus);
  if (filterAssignee) filteredTasks = filteredTasks.filter((t) => t.assignee === filterAssignee);
  if (filterPriority) filteredTasks = filteredTasks.filter((t) => t.priority === filterPriority);

  // Dashboard stats
  const totalTasks = tasks.length;
  const todoCount = tasks.filter((t) => t.status === "To Do").length;
  const inProgressCount = tasks.filter((t) => t.status === "In Progress").length;
  const reviewCount = tasks.filter((t) => t.status === "Review").length;
  const doneCount = tasks.filter((t) => t.status === "Done").length;
  const overdueCount = tasks.filter((t) => isOverdue(t)).length;
  const todayStr = new Date().toISOString().split("T")[0];
  const todayTasks = tasks.filter((t) => t.dueDate === todayStr && t.status !== "Done");
  const upcomingTasks = tasks.filter(
    (t) => t.dueDate > todayStr && t.dueDate <= new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0] && t.status !== "Done"
  );

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">✅ Task Management</h1>
          <p className="text-muted-foreground">Sistem tracking task untuk tim SWI</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>+ New Task</Button>
      </div>

      {/* Create message */}
      {createMessage && (
        <div className={`p-3 rounded-md text-sm font-medium ${createMessage.startsWith("✅") ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
          {createMessage}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 border-b">
        {(["dashboard", "my-tasks", "all-tasks", "kanban"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setCurrentTab(tab)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              currentTab === tab
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab === "dashboard" && "📊 Dashboard"}
            {tab === "my-tasks" && "👤 My Tasks"}
            {tab === "all-tasks" && "📋 All Tasks"}
            {tab === "kanban" && "🗂️ Kanban Board"}
          </button>
        ))}
      </div>

      {/* Loading / Error */}
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-2/3" />
                  <div className="h-8 bg-gray-200 rounded w-1/2" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {error && <div className="p-4 bg-red-50 text-red-700 rounded-md">{error}</div>}

      {/* ═══ DASHBOARD TAB ═══ */}
      {currentTab === "dashboard" && !loading && (
        <div className="space-y-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-xs text-muted-foreground">Total</p>
                <p className="text-2xl font-bold">{totalTasks}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-xs text-muted-foreground">To Do</p>
                <p className="text-2xl font-bold text-gray-600">{todoCount}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-xs text-muted-foreground">In Progress</p>
                <p className="text-2xl font-bold text-blue-600">{inProgressCount}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-xs text-muted-foreground">Review</p>
                <p className="text-2xl font-bold text-purple-600">{reviewCount}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-xs text-muted-foreground">Done</p>
                <p className="text-2xl font-bold text-green-600">{doneCount}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-xs text-muted-foreground">Overdue</p>
                <p className="text-2xl font-bold text-red-600">{overdueCount}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-xs text-muted-foreground">Today</p>
                <p className="text-2xl font-bold text-orange-600">{todayTasks.length}</p>
              </CardContent>
            </Card>
          </div>

          {/* Today & Upcoming */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">📌 Tasks Hari Ini</CardTitle>
                <CardDescription>Task yang jatuh tempo hari ini</CardDescription>
              </CardHeader>
              <CardContent>
                {todayTasks.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Tidak ada task hari ini</p>
                ) : (
                  <div className="space-y-2">
                    {todayTasks.map((t) => (
                      <div key={t.id} className="flex items-center justify-between p-2 rounded bg-orange-50">
                        <div>
                          <p className="text-sm font-medium">{t.title}</p>
                          <p className="text-xs text-muted-foreground">{t.assignee}</p>
                        </div>
                        <Badge className={getPriorityColor(t.priority)}>{t.priority}</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">⏰ Upcoming (7 hari)</CardTitle>
                <CardDescription>Task yang akan jatuh tempo dalam 7 hari</CardDescription>
              </CardHeader>
              <CardContent>
                {upcomingTasks.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Tidak ada upcoming task</p>
                ) : (
                  <div className="space-y-2">
                    {upcomingTasks.map((t) => (
                      <div key={t.id} className="flex items-center justify-between p-2 rounded bg-blue-50">
                        <div>
                          <p className="text-sm font-medium">{t.title}</p>
                          <p className="text-xs text-muted-foreground">{t.assignee} · {formatDate(t.dueDate)}</p>
                        </div>
                        <Badge className={getStatusColor(t.status)}>{t.status}</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Overdue Alert */}
          {overdueCount > 0 && (
            <Card className="border-red-200 bg-red-50">
              <CardHeader>
                <CardTitle className="text-base text-red-700">🚨 Overdue Tasks</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {tasks.filter((t) => isOverdue(t)).map((t) => (
                    <div key={t.id} className="flex items-center justify-between p-2 rounded bg-white">
                      <div>
                        <p className="text-sm font-medium">{t.title}</p>
                        <p className="text-xs text-red-600">Due: {formatDate(t.dueDate)} · {t.assignee}</p>
                      </div>
                      <Badge className={getPriorityColor(t.priority)}>{t.priority}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* ═══ MY TASKS TAB ═══ */}
      {currentTab === "my-tasks" && !loading && (
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div>
              <Label>Filter Assignee</Label>
              <Select value={filterAssignee} onValueChange={setFilterAssignee}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Pilih assignee" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">Semua</SelectItem>
                  {ASSIGNEES.map((a) => (
                    <SelectItem key={a} value={a}>{a}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Status</Label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Semua status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">Semua</SelectItem>
                  {STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="text-left p-3">Task</th>
                      <th className="text-left p-3">Due Date</th>
                      <th className="text-left p-3">Priority</th>
                      <th className="text-left p-3">Status</th>
                      <th className="text-left p-3">Event</th>
                      <th className="text-left p-3">Quick Update</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(filterAssignee && filterAssignee !== "__all__"
                      ? tasks.filter((t) => t.assignee === filterAssignee)
                      : tasks
                    ).map((t) => (
                      <tr key={t.id} className="border-t hover:bg-muted/25">
                        <td className="p-3">
                          <p className="font-medium">{t.title}</p>
                          <p className="text-xs text-muted-foreground">{t.description?.slice(0, 60)}</p>
                        </td>
                        <td className="p-3">
                          <span className={isOverdue(t) ? "text-red-600 font-medium" : ""}>
                            {formatDate(t.dueDate)}
                          </span>
                        </td>
                        <td className="p-3">
                          <Badge className={getPriorityColor(t.priority)}>{t.priority}</Badge>
                        </td>
                        <td className="p-3">
                          <Badge className={getStatusColor(t.status)}>{t.status}</Badge>
                        </td>
                        <td className="p-3 text-muted-foreground">{t.relatedEvent || "-"}</td>
                        <td className="p-3">
                          <Select value={t.status} onValueChange={(v) => handleStatusChange(t.id, v)}>
                            <SelectTrigger className="w-32 h-8 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {STATUSES.map((s) => (
                                <SelectItem key={s} value={s}>{s}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ═══ ALL TASKS TAB ═══ */}
      {currentTab === "all-tasks" && !loading && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex flex-wrap items-end gap-4">
            <div>
              <Label>Status</Label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-36">
                  <SelectValue placeholder="Semua" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">Semua</SelectItem>
                  {STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Assignee</Label>
              <Select value={filterAssignee} onValueChange={setFilterAssignee}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Semua" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">Semua</SelectItem>
                  {ASSIGNEES.map((a) => (
                    <SelectItem key={a} value={a}>{a}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Priority</Label>
              <Select value={filterPriority} onValueChange={setFilterPriority}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Semua" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">Semua</SelectItem>
                  {PRIORITIES.map((p) => (
                    <SelectItem key={p} value={p}>{p}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button variant="outline" onClick={() => { setFilterStatus(""); setFilterAssignee(""); setFilterPriority(""); }}>
              Clear Filters
            </Button>
            <Button onClick={() => setShowCreateModal(true)}>+ New Task</Button>
          </div>

          {/* Table */}
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="text-left p-3">ID</th>
                      <th className="text-left p-3">Title</th>
                      <th className="text-left p-3">Assignee</th>
                      <th className="text-left p-3">Due Date</th>
                      <th className="text-left p-3">Priority</th>
                      <th className="text-left p-3">Status</th>
                      <th className="text-left p-3">Event</th>
                      <th className="text-left p-3">Created</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTasks.map((t) => (
                      <tr key={t.id} className="border-t hover:bg-muted/25">
                        <td className="p-3 font-mono text-xs">{t.id}</td>
                        <td className="p-3">
                          <p className="font-medium">{t.title}</p>
                          <p className="text-xs text-muted-foreground">{t.description?.slice(0, 50)}</p>
                        </td>
                        <td className="p-3">{t.assignee}</td>
                        <td className="p-3">
                          <span className={isOverdue(t) ? "text-red-600 font-medium" : ""}>
                            {formatDate(t.dueDate)}
                          </span>
                        </td>
                        <td className="p-3">
                          <Badge className={getPriorityColor(t.priority)}>{t.priority}</Badge>
                        </td>
                        <td className="p-3">
                          <Badge className={getStatusColor(t.status)}>{t.status}</Badge>
                        </td>
                        <td className="p-3 text-muted-foreground">{t.relatedEvent || "-"}</td>
                        <td className="p-3 text-muted-foreground">{formatDate(t.createdDate)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {filteredTasks.length === 0 && (
                  <div className="p-8 text-center text-muted-foreground">
                    Tidak ada task yang cocok dengan filter
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ═══ KANBAN TAB ═══ */}
      {currentTab === "kanban" && !loading && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {STATUSES.map((status) => {
            const columnTasks = tasks.filter((t) => t.status === status);
            const columnColor =
              status === "To Do" ? "border-gray-300" :
              status === "In Progress" ? "border-blue-300" :
              status === "Review" ? "border-purple-300" :
              "border-green-300";
            const headerBg =
              status === "To Do" ? "bg-gray-100" :
              status === "In Progress" ? "bg-blue-100" :
              status === "Review" ? "bg-purple-100" :
              "bg-green-100";

            return (
              <div key={status} className={`border-2 rounded-lg ${columnColor}`}>
                <div className={`p-3 rounded-t-lg ${headerBg} font-semibold text-sm flex items-center justify-between`}>
                  <span>{status}</span>
                  <span className="bg-white px-2 py-0.5 rounded-full text-xs">{columnTasks.length}</span>
                </div>
                <div className="p-2 space-y-2 min-h-[200px]">
                  {columnTasks.map((t) => (
                    <Card key={t.id} className="shadow-sm">
                      <CardContent className="p-3">
                        <p className="text-sm font-medium mb-1">{t.title}</p>
                        <p className="text-xs text-muted-foreground mb-2 line-clamp-2">{t.description}</p>
                        <div className="flex items-center justify-between">
                          <Badge className={`${getPriorityColor(t.priority)} text-xs`}>{t.priority}</Badge>
                          <span className="text-xs text-muted-foreground">{t.assignee}</span>
                        </div>
                        {t.dueDate && (
                          <p className={`text-xs mt-1 ${isOverdue(t) ? "text-red-600 font-medium" : "text-muted-foreground"}`}>
                            📅 {formatDate(t.dueDate)}
                          </p>
                        )}
                        {/* Quick status change */}
                        <div className="mt-2">
                          <Select value={t.status} onValueChange={(v) => handleStatusChange(t.id, v)}>
                            <SelectTrigger className="w-full h-7 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {STATUSES.map((s) => (
                                <SelectItem key={s} value={s}>{s}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  {columnTasks.length === 0 && (
                    <p className="text-xs text-muted-foreground text-center py-4">No tasks</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ═══ CREATE TASK MODAL ═══ */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>Create New Task</CardTitle>
              <CardDescription>Isi detail task yang ingin dibuat</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateTask} className="space-y-4">
                <div>
                  <Label>Title *</Label>
                  <Input
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    placeholder="Task title"
                    required
                  />
                </div>
                <div>
                  <Label>Description</Label>
                  <Textarea
                    value={formDesc}
                    onChange={(e) => setFormDesc(e.target.value)}
                    placeholder="Task description"
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Assignee *</Label>
                    <Select value={formAssignee} onValueChange={setFormAssignee} required>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih assignee" />
                      </SelectTrigger>
                      <SelectContent>
                        {ASSIGNEES.map((a) => (
                          <SelectItem key={a} value={a}>{a}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Due Date</Label>
                    <Input
                      type="date"
                      value={formDueDate}
                      onChange={(e) => setFormDueDate(e.target.value)}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Priority</Label>
                    <Select value={formPriority} onValueChange={setFormPriority}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {PRIORITIES.map((p) => (
                          <SelectItem key={p} value={p}>{p}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Related Event/Project</Label>
                    <Input
                      value={formRelated}
                      onChange={(e) => setFormRelated(e.target.value)}
                      placeholder="Event atau project"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <Button type="button" variant="outline" onClick={() => setShowCreateModal(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={creating}>
                    {creating ? "Creating..." : "Create Task"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
