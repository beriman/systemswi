// GET /api/tasks/[id] — Get task detail
// PUT /api/tasks/[id] — Update task status/assignee/due date
import { NextRequest, NextResponse } from "next/server";
import {
  readTaskSheet,
  updateTaskRow,
  initializeTaskSheets,
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

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await initializeTaskSheets();
    const { id } = await params;
    const rows = await readTaskSheet(TASK_SHEETS.Tasks);

    const rowIndex = rows.findIndex((row, i) => i > 0 && s(row, 0) === id);
    if (rowIndex === -1) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    const row = rows[rowIndex];
    const task = {
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
    };

    return NextResponse.json({ source: TASKS_SOURCE, sourceStatus: "live", task });
  } catch (error) {
    if (isGoogleWorkspaceAuthError(error)) {
      return NextResponse.json({
        ...googleWorkspaceDegradedSource(TASKS_SOURCE, error),
        task: null,
      });
    }
    return NextResponse.json({ error: "Failed to fetch task detail", details: String(error) }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await initializeTaskSheets();
    const { id } = await params;
    const body = await req.json();
    const { status, assignee, dueDate, priority, notes, title, description, relatedEvent, picName } = body;

    const rows = await readTaskSheet(TASK_SHEETS.Tasks);
    const rowIndex = rows.findIndex((row, i) => i > 0 && s(row, 0) === id);
    if (rowIndex === -1) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    const rowNum = rowIndex + 1; // 1-indexed
    const existing = rows[rowIndex];
    const now = today();

    const validStatuses = ["To Do", "In Progress", "Review", "Done", "Overdue"];
    const validPriorities = ["High", "Medium", "Low"];

    const newStatus = status && validStatuses.includes(status) ? status : s(existing, 7);
    const completedDate = newStatus === "Done"
      ? (s(existing, 11) || now)
      : (s(existing, 11) || "");

    const updatedRow = [
      s(existing, 0),                              // Task ID
      title || s(existing, 1),                     // Title
      description || s(existing, 2),               // Description
      assignee || s(existing, 3),                  // Assignee
      picName || assignee || s(existing, 4),       // PIC Name
      dueDate || s(existing, 5),                   // Due Date
      priority && validPriorities.includes(priority) ? priority : s(existing, 6), // Priority
      newStatus,                                   // Status
      relatedEvent || s(existing, 8),              // Related Event/Project
      s(existing, 9),                              // Created By
      s(existing, 10),                             // Created Date
      completedDate,                               // Completed Date
      notes !== undefined ? notes : s(existing, 12), // Notes
    ];

    await updateTaskRow(TASK_SHEETS.Tasks, rowNum, updatedRow);

    return NextResponse.json({
      success: true,
      id,
      status: newStatus,
      message: "Task updated successfully.",
    });
  } catch (error) {
    if (isGoogleWorkspaceAuthError(error)) {
      return NextResponse.json({
        sourceStatus: "blocked",
        source: TASKS_SOURCE,
        error: "Google Workspace OAuth perlu re-auth sebelum bisa update task",
        details: String(error),
      }, { status: 503 });
    }
    return NextResponse.json({ error: "Failed to update task", details: String(error) }, { status: 500 });
  }
}
