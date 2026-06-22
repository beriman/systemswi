// GET /api/tasks — List tasks (filter: assignee, status, event, priority)
// POST /api/tasks — Create new task
import { NextRequest, NextResponse } from "next/server";
import {
  readTaskSheet,
  appendTaskRows,
  initializeTaskSheets,
  TASK_SHEETS,
  SPREADSHEET_ID,
} from "@/lib/tasks/sheets";
import { googleWorkspaceDegradedSource, isGoogleWorkspaceAuthError } from "@/lib/api/google-workspace-error";

const SOURCE = "Google Sheets: Tasks";

function s(row: string[], idx: number): string {
  return row[idx] || "";
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

interface TaskRow {
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

function parseTaskRows(rows: string[][]): TaskRow[] {
  if (rows.length <= 1) return [];
  return rows.slice(1).filter((row) => s(row, 0)).map((row) => ({
    id: s(row, 0),
    title: s(row, 1),
    description: s(row, 2),
    assignee: s(row, 3),
    picName: s(row, 4),
    dueDate: s(row, 5),
    priority: s(row, 6),
    status: s(row, 7) || "Todo",
    relatedEvent: s(row, 8),
    createdBy: s(row, 9),
    createdDate: s(row, 10),
    completedDate: s(row, 11),
    notes: s(row, 12),
  }));
}

function taskToRow(t: TaskRow): (string | number)[] {
  return [
    t.id, t.title, t.description, t.assignee, t.picName,
    t.dueDate, t.priority, t.status, t.relatedEvent,
    t.createdBy, t.createdDate, t.completedDate, t.notes,
  ];
}

export async function GET(req: NextRequest) {
  try {
    await initializeTaskSheets();
    const url = new URL(req.url);
    const assignee = url.searchParams.get("assignee");
    const status = url.searchParams.get("status");
    const event = url.searchParams.get("event");
    const priority = url.searchParams.get("priority");

    const rows = await readTaskSheet(TASK_SHEETS.Tasks);
    let tasks = parseTaskRows(rows);

    if (assignee) tasks = tasks.filter((t) => t.assignee.toLowerCase().includes(assignee.toLowerCase()));
    if (status) tasks = tasks.filter((t) => t.status.toLowerCase() === status.toLowerCase());
    if (event) tasks = tasks.filter((t) => t.relatedEvent.toLowerCase().includes(event.toLowerCase()));
    if (priority) tasks = tasks.filter((t) => t.priority.toLowerCase() === priority.toLowerCase());

    // Stats
    const todoCount = tasks.filter((t) => t.status === "Todo").length;
    const inProgressCount = tasks.filter((t) => t.status === "In Progress").length;
    const reviewCount = tasks.filter((t) => t.status === "Review").length;
    const doneCount = tasks.filter((t) => t.status === "Done").length;
    const overdueCount = tasks.filter((t) => t.dueDate && t.dueDate < today() && t.status !== "Done" && t.status !== "Cancelled").length;

    return NextResponse.json({
      source: SOURCE,
      sourceStatus: "live",
      spreadsheetId: SPREADSHEET_ID,
      tasks,
      stats: { total: tasks.length, todoCount, inProgressCount, reviewCount, doneCount, overdueCount },
    });
  } catch (error) {
    if (isGoogleWorkspaceAuthError(error)) {
      return NextResponse.json({ ...googleWorkspaceDegradedSource(SOURCE, error), tasks: [], stats: { total: 0, todoCount: 0, inProgressCount: 0, reviewCount: 0, doneCount: 0, overdueCount: 0 } });
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

    const newTask: TaskRow = {
      id: taskId,
      title: body.title || "Untitled Task",
      description: body.description || "",
      assignee: body.assignee || "",
      picName: body.picName || body.assignee || "",
      dueDate: body.dueDate || "",
      priority: body.priority || "Medium",
      status: "Todo",
      relatedEvent: body.relatedEvent || "",
      createdBy: body.createdBy || "System",
      createdDate: now,
      completedDate: "",
      notes: body.notes || "",
    };

    await appendTaskRows(TASK_SHEETS.Tasks, [taskToRow(newTask)]);

    return NextResponse.json({
      success: true,
      taskId,
      message: "Task created successfully",
      task: newTask,
    }, { status: 201 });
  } catch (error) {
    if (isGoogleWorkspaceAuthError(error)) {
      return NextResponse.json({ sourceStatus: "blocked", source: SOURCE, error: "Google Workspace OAuth perlu re-auth", details: String(error) }, { status: 503 });
    }
    return NextResponse.json({ error: "Failed to create task", details: String(error) }, { status: 500 });
  }
}
