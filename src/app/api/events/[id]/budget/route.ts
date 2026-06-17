// POST /api/events/[id]/budget — Add budget item
import { NextRequest, NextResponse } from "next/server";
import { appendEventRows, ensureEventSheet, EVENT_SHEETS } from "@/lib/event/sheets";
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
    const budgetId = `budget-${Date.now()}`;

    const row = [
      budgetId,
      eventId,
      body.category || "",
      body.itemName || "",
      body.plannedAmount || 0,
      body.actualAmount || 0,
      body.notes || "",
      now,
    ];

    await ensureEventSheet(EVENT_SHEETS.Budget, [
      "ID", "Event ID", "Category", "Item Name", "Planned Amount", "Actual Amount", "Notes", "Created"
    ]);
    await appendEventRows(EVENT_SHEETS.Budget, [row]);

    let auditStatus = "ok";
    try {
      await appendSwiMemoryLog({
        action: "Budget Item Added",
        target: `Event:${eventId}`,
        summary: `Added budget item "${body.itemName}" (${body.category}) — planned: ${body.plannedAmount || 0}`,
      });
    } catch (auditError) {
      auditStatus = isGoogleWorkspaceAuthError(auditError) ? "blocked" : `warning:${String(auditError).slice(0, 160)}`;
    }

    return NextResponse.json({ success: true, budgetId, auditStatus }, { status: 201 });
  } catch (error) {
    if (isGoogleWorkspaceAuthError(error)) {
      return NextResponse.json({
        ...googleWorkspaceDegradedSource("Google Sheets: Event_Budget", error),
        error: "Google Workspace OAuth perlu re-auth",
        details: String(error),
      }, { status: 503 });
    }
    return NextResponse.json({ error: "Failed to add budget item", details: String(error) }, { status: 500 });
  }
}
