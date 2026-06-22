// GET /api/tasks/overdue — Overdue tasks
import { NextRequest, NextResponse } from "next/server";
import {
  readTaskSheet,
  initializeTaskSheets,
  TASK_SHEETS,
} from "@/lib/tasks/sheets";
import { googleWorkspaceDegradedSource, isGoogleWorkspaceAuthError } from "@/lib/api/google-workspace-error";

const SOURCE = "Google Sheets: Tasks";

function s(row: string[], idx: number): string {
  return row[idx] || "";
}

export async function GET() {
  try {
    await initializeTaskSheets();
    const rows = await readTaskSheet(TASK_SHEETS.Tasks);
    if (rows.length <= 1) {
      return NextResponse.json({ source: SOURCE, sourceStatus: "live", overdueTasks: [], count: 0 });
    }

    const today = new Date().toISOString().slice(0, 10);
    const allTasks = rows.slice(1).filter((row) => s(row, 0)).map((row) => ({
      id: s(row, 0), title: s(row, 1), description: s(row, 2),
      assignee: s(row, 3), picName: s(row, 4), dueDate: s(row, 5),
      priority: s(row, 6), status: s(row, 7) || "Todo",
      relatedEvent: s(row, 8), createdBy: s(row, 9),
      createdDate: s(row, 10), completedDate: s(row, 11), notes: s(row, 12),
    }));

    const overdueTasks = allTasks.filter(
      (t) => t.dueDate && t.dueDate < today && t.status !== "Done" && t.status !== "Cancelled"
    );

    // Sort by due date ascending (most overdue first)
    overdueTasks.sort((a, b) => (a.dueDate || "").localeCompare(b.dueDate || ""));

    return NextResponse.json({
      source: SOURCE,
      sourceStatus: "live",
      today,
      overdueTasks,
      count: overdueTasks.length,
    });
  } catch (error) {
    if (isGoogleWorkspaceAuthError(error)) {
      return NextResponse.json({ ...googleWorkspaceDegradedSource(SOURCE, error), overdueTasks: [], count: 0 });
    }
    return NextResponse.json({ error: "Failed to fetch overdue tasks", details: String(error) }, { status: 500 });
  }
}
