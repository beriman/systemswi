// GET /api/tasks/my — Get tasks assigned to current user
import { NextRequest, NextResponse } from "next/server";
import {
  readTaskSheet,
  initializeTaskSheets,
  TASK_SHEETS,
} from "@/lib/tasks/sheets";
import { googleWorkspaceDegradedSource, isGoogleWorkspaceAuthError } from "@/lib/api/google-workspace-error";

const TASKS_SOURCE = "Google Sheets: Tasks";

function s(row: string[], idx: number): string {
  return row[idx] || "";
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
    const assignee = url.searchParams.get("assignee") || "Me";

    const rows = await readTaskSheet(TASK_SHEETS.Tasks);
    let tasks = parseTaskRows(rows);

    // Filter by assignee
    tasks = tasks.filter(
      (t) => t.assignee.toLowerCase().includes(assignee.toLowerCase()) ||
             t.picName.toLowerCase().includes(assignee.toLowerCase())
    );

    // Sort by priority then due date
    const priorityOrder: Record<string, number> = { High: 0, Medium: 1, Low: 2 };
    tasks.sort((a, b) => {
      const pa = priorityOrder[a.priority] ?? 1;
      const pb = priorityOrder[b.priority] ?? 1;
      if (pa !== pb) return pa - pb;
      return (a.dueDate || "").localeCompare(b.dueDate || "");
    });

    return NextResponse.json({
      source: TASKS_SOURCE,
      sourceStatus: "live",
      assignee,
      tasks,
      count: tasks.length,
    });
  } catch (error) {
    if (isGoogleWorkspaceAuthError(error)) {
      return NextResponse.json({
        ...googleWorkspaceDegradedSource(TASKS_SOURCE, error),
        tasks: [],
        count: 0,
      });
    }
    return NextResponse.json({ error: "Failed to fetch my tasks", details: String(error) }, { status: 500 });
  }
}
