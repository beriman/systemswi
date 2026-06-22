// GET /api/tasks/my — My tasks (filtered by assignee)
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

export async function GET(req: NextRequest) {
  try {
    await initializeTaskSheets();
    const url = new URL(req.url);
    const assignee = url.searchParams.get("assignee") || "Siti Aminah";

    const rows = await readTaskSheet(TASK_SHEETS.Tasks);
    if (rows.length <= 1) {
      return NextResponse.json({ source: SOURCE, sourceStatus: "live", assignee, tasks: [], stats: { total: 0, todoCount: 0, inProgressCount: 0, reviewCount: 0, doneCount: 0, overdueCount: 0 } });
    }

    const allTasks = rows.slice(1).filter((row) => s(row, 0)).map((row) => ({
      id: s(row, 0), title: s(row, 1), description: s(row, 2),
      assignee: s(row, 3), picName: s(row, 4), dueDate: s(row, 5),
      priority: s(row, 6), status: s(row, 7) || "Todo",
      relatedEvent: s(row, 8), createdBy: s(row, 9),
      createdDate: s(row, 10), completedDate: s(row, 11), notes: s(row, 12),
    }));

    const myTasks = allTasks.filter((t) =>
      t.assignee.toLowerCase().includes(assignee.toLowerCase())
    );

    const today = new Date().toISOString().slice(0, 10);
    const stats = {
      total: myTasks.length,
      todoCount: myTasks.filter((t) => t.status === "Todo").length,
      inProgressCount: myTasks.filter((t) => t.status === "In Progress").length,
      reviewCount: myTasks.filter((t) => t.status === "Review").length,
      doneCount: myTasks.filter((t) => t.status === "Done").length,
      overdueCount: myTasks.filter((t) => t.dueDate && t.dueDate < today && t.status !== "Done" && t.status !== "Cancelled").length,
    };

    return NextResponse.json({
      source: SOURCE,
      sourceStatus: "live",
      assignee,
      tasks: myTasks,
      stats,
    });
  } catch (error) {
    if (isGoogleWorkspaceAuthError(error)) {
      return NextResponse.json({ ...googleWorkspaceDegradedSource(SOURCE, error), tasks: [], stats: { total: 0, todoCount: 0, inProgressCount: 0, reviewCount: 0, doneCount: 0, overdueCount: 0 } });
    }
    return NextResponse.json({ error: "Failed to fetch my tasks", details: String(error) }, { status: 500 });
  }
}
