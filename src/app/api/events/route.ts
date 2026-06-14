// GET /api/events — List all events
// POST /api/events — Create new event
import { NextRequest, NextResponse } from "next/server";
import { readEventSheet, appendEventRows, writeEventSheet, ensureEventSheet, EVENT_SHEETS } from "@/lib/event/sheets";
import { googleWorkspaceDegradedSource, isGoogleWorkspaceAuthError } from "@/lib/api/google-workspace-error";
import { appendSwiMemoryLog } from "@/lib/google/audit-log";

const EVENTS_SOURCE = "Google Sheets: Events";

export async function GET() {
  try {
    await ensureEventSheet(EVENT_SHEETS.Events, [
      "ID", "Name", "Slug", "Type", "Status", "Description", "PIC", "Instagram",
      "Start Date", "End Date", "Location", "Venue", "Budget", "Actual Cost", "Revenue",
      "Tenant Count", "Sponsor Count", "Attendee Target", "Attendee Actual", "Notes", "Created", "Updated"
    ]);

    const rows = await readEventSheet(EVENT_SHEETS.Events);
    if (rows.length <= 1) {
      return NextResponse.json({ events: [] });
    }

    const headers = rows[0];
    const events = rows.slice(1).map((row) => ({
      id: row[0] || "",
      name: row[1] || "",
      slug: row[2] || "",
      type: row[3] || "other",
      status: row[4] || "planning",
      description: row[5] || "",
      pic: row[6] || "Wapiq Rizya Zaelan",
      instagram: row[7] || "@fragrantions",
      startDate: row[8] || "",
      endDate: row[9] || "",
      location: row[10] || "",
      venue: row[11] || "",
      budget: parseFloat(row[12] || "0") || 0,
      actualCost: parseFloat(row[13] || "0") || 0,
      revenue: parseFloat(row[14] || "0") || 0,
      tenantCount: parseInt(row[15] || "0") || 0,
      sponsorCount: parseInt(row[16] || "0") || 0,
      attendeeTarget: parseInt(row[17] || "0") || 0,
      attendeeActual: parseInt(row[18] || "0") || 0,
      notes: row[19] || "",
      created: row[20] || "",
      updated: row[21] || "",
    }));

    return NextResponse.json({ source: EVENTS_SOURCE, sourceStatus: "live", events });
  } catch (error) {
    if (isGoogleWorkspaceAuthError(error)) {
      return NextResponse.json({
        ...googleWorkspaceDegradedSource(EVENTS_SOURCE, error),
        events: [],
      });
    }
    return NextResponse.json({ error: "Failed to fetch events", details: String(error) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const now = new Date().toISOString().split("T")[0];

    const eventId = `evt-${Date.now()}`;
    const row = [
      eventId,
      body.name || "",
      body.slug || "",
      body.type || "other",
      body.status || "planning",
      body.description || "",
      body.pic || "Wapiq Rizya Zaelan",
      body.instagram || "@fragrantions",
      body.startDate || "",
      body.endDate || "",
      body.location || "",
      body.venue || "",
      body.budget || 0,
      body.actualCost || 0,
      body.revenue || 0,
      body.tenantCount || 0,
      body.sponsorCount || 0,
      body.attendeeTarget || 0,
      body.attendeeActual || 0,
      body.notes || "",
      now,
      now,
    ];

    await appendEventRows(EVENT_SHEETS.Events, [row]);
    let auditStatus = "ok";
    try {
      await appendSwiMemoryLog({
        action: "Event Created",
        target: `Events:${eventId}`,
        summary: `Created event ${body.name || "TBA"} with status ${body.status || "planning"}`,
      });
    } catch (auditError) {
      auditStatus = isGoogleWorkspaceAuthError(auditError) ? "blocked" : `warning:${String(auditError).slice(0, 160)}`;
    }
    return NextResponse.json({ success: true, eventId, auditStatus }, { status: 201 });
  } catch (error) {
    if (isGoogleWorkspaceAuthError(error)) {
      return NextResponse.json({
        sourceStatus: "blocked",
        source: EVENTS_SOURCE,
        error: "Google Workspace OAuth perlu re-auth sebelum bisa membuat event",
        details: String(error),
      }, { status: 503 });
    }
    return NextResponse.json({ error: "Failed to create event", details: String(error) }, { status: 500 });
  }
}
