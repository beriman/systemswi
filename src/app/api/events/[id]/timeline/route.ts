// POST /api/events/[id]/timeline — Add timeline milestone
// PATCH /api/events/[id]/timeline — Toggle milestone completion
import { NextRequest, NextResponse } from "next/server";
import { appendEventRows, ensureEventSheet, EVENT_SHEETS, readEventSheet } from "@/lib/event/sheets";
import { googleWorkspaceDegradedSource, isGoogleWorkspaceAuthError } from "@/lib/api/google-workspace-error";
import { appendSwiMemoryLog } from "@/lib/google/audit-log";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: eventId } = await params;
    const body = await req.json();
    const now = new Date().toISOString().split("T")[0];
    const timelineId = `tl-${Date.now()}`;

    const row = [
      timelineId,
      eventId,
      body.phase || "",
      body.milestone || "",
      body.dueDate || "",
      "false",
      "",
      body.notes || "",
      now,
    ];

    await ensureEventSheet(EVENT_SHEETS.Timeline, [
      "ID", "Event ID", "Phase", "Milestone", "Due Date", "Completed", "Completed Date", "Notes", "Created"
    ]);
    await appendEventRows(EVENT_SHEETS.Timeline, [row]);

    let auditStatus = "ok";
    try {
      await appendSwiMemoryLog({
        action: "Timeline Added",
        target: `Event:${eventId}`,
        summary: `Added milestone "${body.milestone}" in phase "${body.phase}"`,
      });
    } catch (auditError) {
      auditStatus = isGoogleWorkspaceAuthError(auditError) ? "blocked" : `warning:${String(auditError).slice(0, 160)}`;
    }

    return NextResponse.json({ success: true, timelineId, auditStatus }, { status: 201 });
  } catch (error) {
    if (isGoogleWorkspaceAuthError(error)) {
      return NextResponse.json({
        ...googleWorkspaceDegradedSource("Google Sheets: Event_Timeline", error),
        error: "Google Workspace OAuth perlu re-auth",
        details: String(error),
      }, { status: 503 });
    }
    return NextResponse.json({ error: "Failed to add timeline", details: String(error) }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: eventId } = await params;
    const body = await req.json();
    const { id: timelineId, completed } = body;

    if (!timelineId) {
      return NextResponse.json({ error: "timelineId required" }, { status: 400 });
    }

    // Read all timeline rows
    const rows = await readEventSheet(EVENT_SHEETS.Timeline);
    if (rows.length <= 1) {
      return NextResponse.json({ error: "No timeline found" }, { status: 404 });
    }

    // Find the row to update
    const rowIndex = rows.findIndex((r) => r[0] === timelineId && r[1] === eventId);
    if (rowIndex === -1) {
      return NextResponse.json({ error: "Timeline not found" }, { status: 404 });
    }

    const now = new Date().toISOString().split("T")[0];
    rows[rowIndex][5] = String(!!completed); // Completed
    rows[rowIndex][6] = completed ? now : ""; // Completed Date

    // Write back (inefficient but simple for small datasets)
    const { writeEventSheet } = await import("@/lib/event/sheets");
    await writeEventSheet(EVENT_SHEETS.Timeline, rows);

    let auditStatus = "ok";
    try {
      await appendSwiMemoryLog({
        action: completed ? "Milestone Completed" : "Milestone Reopened",
        target: `Event:${eventId}`,
        summary: `Milestone ${timelineId} marked ${completed ? "completed" : "reopened"}`,
      });
    } catch (auditError) {
      auditStatus = isGoogleWorkspaceAuthError(auditError) ? "blocked" : `warning:${String(auditError).slice(0, 160)}`;
    }

    return NextResponse.json({ success: true, completed: !!completed, auditStatus });
  } catch (error) {
    if (isGoogleWorkspaceAuthError(error)) {
      return NextResponse.json({
        ...googleWorkspaceDegradedSource("Google Sheets: Event_Timeline", error),
        error: "Google Workspace OAuth perlu re-auth",
        details: String(error),
      }, { status: 503 });
    }
    return NextResponse.json({ error: "Failed to update timeline", details: String(error) }, { status: 500 });
  }
}
