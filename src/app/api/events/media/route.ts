// GET /api/events/media — List media for an event (or all media)
// POST /api/events/media — Add media to an event
// DELETE /api/events/media — Remove media
import { NextRequest, NextResponse } from "next/server";
import { readEventSheet, appendEventRows, ensureEventSheet, EVENT_SHEETS } from "@/lib/event/sheets";
import { googleWorkspaceDegradedSource, isGoogleWorkspaceAuthError } from "@/lib/api/google-workspace-error";
import { appendSwiMemoryLog } from "@/lib/google/audit-log";

const MEDIA_SOURCE = "Google Sheets: Event_Media";

export const runtime = "nodejs";

type MediaRow = {
  id: string;
  eventId: string;
  type: string;
  title: string;
  url: string;
  caption: string;
  source: string;
  featured: string;
  sortOrder: string;
  created: string;
  updated: string;
};

function parseMediaRow(row: string[]): MediaRow {
  return {
    id: row[0] || "",
    eventId: row[1] || "",
    type: row[2] || "image",
    title: row[3] || "",
    url: row[4] || "",
    caption: row[5] || "",
    source: row[6] || "",
    featured: row[7] || "false",
    sortOrder: row[8] || "0",
    created: row[9] || "",
    updated: row[10] || "",
  };
}

function rowToValues(m: Partial<MediaRow> & { eventId: string }): string[] {
  const now = new Date().toISOString().split("T")[0];
  return [
    m.id || `media-${Date.now()}`,
    m.eventId,
    m.type || "image",
    m.title || "",
    m.url || "",
    m.caption || "",
    m.source || "",
    m.featured || "false",
    m.sortOrder || "0",
    m.created || now,
    m.updated || now,
  ];
}

// ── GET ──
export async function GET(req: NextRequest) {
  try {
    await ensureEventSheet(EVENT_SHEETS.Media, [
      "ID", "Event ID", "Type", "Title", "URL", "Caption", "Source",
      "Featured", "Sort Order", "Created", "Updated",
    ]);

    const rows = await readEventSheet(EVENT_SHEETS.Media);
    if (rows.length <= 1) {
      return NextResponse.json({ media: [], source: MEDIA_SOURCE, sourceStatus: "ok" });
    }

    const allMedia = rows.slice(1).map(parseMediaRow).filter((m) => m.id && m.eventId);

    // Filter by eventId if provided
    const { searchParams } = new URL(req.url);
    const eventId = searchParams.get("eventId");
    const filtered = eventId ? allMedia.filter((m) => m.eventId === eventId) : allMedia;

    // Sort by sortOrder
    filtered.sort((a, b) => parseInt(a.sortOrder || "0") - parseInt(b.sortOrder || "0"));

    return NextResponse.json({
      success: true,
      source: MEDIA_SOURCE,
      sourceStatus: "ok",
      media: filtered,
      total: filtered.length,
    });
  } catch (error) {
    if (isGoogleWorkspaceAuthError(error)) {
      return NextResponse.json({
        ...googleWorkspaceDegradedSource(MEDIA_SOURCE, error),
        media: [],
      });
    }
    return NextResponse.json(
      { success: false, error: "Failed to fetch media", details: String(error), media: [] },
      { status: 500 }
    );
  }
}

// ── POST ──
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { eventId, type, title, url, caption, source, featured, sortOrder } = body;

    if (!eventId) {
      return NextResponse.json({ error: "eventId wajib diisi" }, { status: 400 });
    }
    if (!url && !title) {
      return NextResponse.json({ error: "url atau title wajib diisi" }, { status: 400 });
    }

    await ensureEventSheet(EVENT_SHEETS.Media, [
      "ID", "Event ID", "Type", "Title", "URL", "Caption", "Source",
      "Featured", "Sort Order", "Created", "Updated",
    ]);

    const row = rowToValues({
      eventId,
      type: type || "image",
      title: title || "",
      url: url || "",
      caption: caption || "",
      source: source || "manual",
      featured: featured ? "true" : "false",
      sortOrder: String(sortOrder || 0),
    });

    await appendEventRows(EVENT_SHEETS.Media, [row]);

    try {
      await appendSwiMemoryLog({
        action: "Event Media Added",
        target: `Event_Media:${eventId}`,
        summary: `Added ${type || "image"} media "${title || url}" for event ${eventId}`,
      });
    } catch {
      /* non-blocking */
    }

    return NextResponse.json(
      {
        success: true,
        source: MEDIA_SOURCE,
        media: parseMediaRow(row),
        auditStatus: "ok",
      },
      { status: 201 }
    );
  } catch (error) {
    if (isGoogleWorkspaceAuthError(error)) {
      return NextResponse.json(
        {
          error: "Google Workspace perlu re-auth sebelum bisa menambah media",
          sourceStatus: "blocked",
          source: MEDIA_SOURCE,
          details: String(error),
        },
        { status: 503 }
      );
    }
    return NextResponse.json(
      { error: "Failed to add media", details: String(error) },
      { status: 500 }
    );
  }
}
