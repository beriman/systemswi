// POST /api/tasks/[id]/comments — Add comment to a task
import { NextRequest, NextResponse } from "next/server";
import {
  readTaskSheet,
  appendTaskRows,
  initializeTaskSheets,
  TASK_SHEETS,
} from "@/lib/tasks/sheets";
import { googleWorkspaceDegradedSource, isGoogleWorkspaceAuthError } from "@/lib/api/google-workspace-error";

const TASKS_SOURCE = "Google Sheets: Task_Comments";

function s(row: string[], idx: number): string {
  return row[idx] || "";
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await initializeTaskSheets();
    const { id } = await params;
    const body = await req.json();

    // Verify task exists
    const taskRows = await readTaskSheet(TASK_SHEETS.Tasks);
    const taskExists = taskRows.some((row, i) => i > 0 && s(row, 0) === id);
    if (!taskExists) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    const commentId = `CMT-${Date.now()}`;
    const now = today();

    const row = [
      commentId,
      id,
      body.author || "System",
      now,
      body.comment || "",
    ];

    await appendTaskRows(TASK_SHEETS.TaskComments, [row]);

    return NextResponse.json({
      success: true,
      commentId,
      message: "Comment added successfully.",
    }, { status: 201 });
  } catch (error) {
    if (isGoogleWorkspaceAuthError(error)) {
      return NextResponse.json({
        sourceStatus: "blocked",
        source: TASKS_SOURCE,
        error: "Google Workspace OAuth perlu re-auth sebelum bisa menambah comment",
        details: String(error),
      }, { status: 503 });
    }
    return NextResponse.json({ error: "Failed to add comment", details: String(error) }, { status: 500 });
  }
}
