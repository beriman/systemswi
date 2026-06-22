// GET /api/tasks — List all tasks (filter: status, assignee, priority, search)
// POST /api/tasks — Create new task
import { NextRequest, NextResponse } from "next/server";
import {
  readTaskSheet,
  appendTaskRows,
  initializeTaskSheets,
  seedTaskData,
  TASK_SHEETS,
} from "@/lib/tasks/sheets";
import { googleWorkspaceDegradedSource, isGoogleWorkspaceAuthError } from "@/lib/api/google-workspace-error";

const TASKS_SOURCE = "Google Sheets: Tasks";

function s(row: string[], idx: number): string {
  return row[idx] || "";
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

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

function parseTaskRows(rows: string[][]): Task[] {
  if (rows.length <= 1) return [];
  return rows.slice(1).filter((row) => s(row, 0)).map((row) => ({
    id: s(row, 0),
    title: s(row, 1),
    description: s(row, 2),
    assignee: s(row, 3),
    picName: s(row, 4),
    dueDate: s(row, 5),
    priority: s(row, 6),
    status: s(row, 7),
    relatedEvent: s(row, 8),
    createdBy: s(row, 9),
    createdDate: s(row, 10),
    completedDate: s(row, 11),
    notes: s(row, 12),
  }));
}

export async function GET(req: NextRequest) {
  try {
    await initializeTaskSheets();

    const url = new URL(req.url);
    const statusFilter = url.searchParams.get("status");
    const assigneeFilter = url.searchParams.get("assignee");
    const priorityFilter = url.searchParams.get("priority");
    const search = url.searchParams.get("search");
    const seed = url.searchParams.get("seed");

    // Seed endpoint: /api/tasks?seed=1
    if (seed === "1") {
      const result = await seedTaskData();
      return NextResponse.json({ success: true, ...result });
    }

    const rows = await readTaskSheet(TASK_SHEETS.Tasks);
    let tasks = parseTaskRows(rows);

    if (statusFilter) {
      tasks = tasks.filter((t) => t.status.toLowerCase() === statusFilter.toLowerCase());
    }
    if (assigneeFilter) {
      tasks = tasks.filter((t) => t.assignee.toLowerCase().includes(assigneeFilter.toLowerCase()));
    }
    if (priorityFilter) {
      tasks = tasks.filter((t) => t.priority.toLowerCase() === priorityFilter.toLowerCase());
    }
    if (search) {
      const q = search.toLowerCase();
      tasks = tasks.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          t.description.toLowerCase().includes(q) ||
          t.assignee.toLowerCase().includes(q) ||
          t.relatedEvent.toLowerCase().includes(q)
      );
    }

    // Dashboard stats — match UI field names
    const byStatus: Record<string, number> = {};
    for (const t of tasks) {
      byStatus[t.status] = (byStatus[t.status] || 0) + 1;
    }
    const todoCount = byStatus["Todo"] || byStatus["To Do"] || 0;
    const inProgressCount = byStatus["In Progress"] || 0;
    const reviewCount = byStatus["Review"] || 0;
    const doneCount = byStatus["Done"] || 0;
    const overdueTasks = tasks.filter(
      (t) => t.dueDate && t.dueDate < today() && t.status !== "Done"
    );
    const todayTasks = tasks.filter((t) => t.dueDate === today());

    return NextResponse.json({
      source: TASKS_SOURCE,
      sourceStatus: "live",
      tasks,
      stats: {
        total: tasks.length,
        byStatus,
        todoCount,
        inProgressCount,
        reviewCount,
        doneCount,
        overdueCount: overdueTasks.length,
        todayCount: todayTasks.length,
      },
    });
  } catch (error) {
    if (isGoogleWorkspaceAuthError(error)) {
      return NextResponse.json({
        ...googleWorkspaceDegradedSource(TASKS_SOURCE, error),
        tasks: [],
        stats: { total: 0, byStatus: {}, overdueCount: 0, todayCount: 0 },
      });
    }
    return NextResponse.json({ error: "Failed to fetch tasks", details: String(error) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await initializeTaskSheets();

    const body = await req.json();
    const now = today();
    const taskId = `TSK-${Date.now()}`;

    const validStatuses = ["To Do", "In Progress", "Review", "Done", "Overdue"];
    const validPriorities = ["High", "Medium", "Low"];

    const status = body.status || "To Do";
    const finalStatus = validStatuses.includes(status) ? status : "To Do";
    const priority = body.priority || "Medium";
    const finalPriority = validPriorities.includes(priority) ? priority : "Medium";

    const row = [
      taskId,
      body.title || "Untitled Task",
      body.description || "",
      body.assignee || "",
      body.picName || body.assignee || "",
      body.dueDate || "",
      finalPriority,
      finalStatus,
      body.relatedEvent || "",
      body.createdBy || "System",
      now,
      "",
      body.notes || "",
    ];

    await appendTaskRows(TASK_SHEETS.Tasks, [row]);

    return NextResponse.json({
      success: true,
      taskId,
      message: "Task created successfully.",
    }, { status: 201 });
  } catch (error) {
    if (isGoogleWorkspaceAuthError(error)) {
      return NextResponse.json({
        sourceStatus: "blocked",
        source: TASKS_SOURCE,
        error: "Google Workspace OAuth perlu re-auth sebelum bisa membuat task",
        details: String(error),
      }, { status: 503 });
    }
    return NextResponse.json({ error: "Failed to create task", details: String(error) }, { status: 500 });
  }
}
