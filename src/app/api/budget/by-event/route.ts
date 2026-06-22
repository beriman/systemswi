// GET /api/budget/by-event — Breakdown per event
import { NextResponse } from "next/server";
import { readRange } from "@/lib/sheets/sheets-real";
import { googleWorkspaceDegradedSource, isGoogleWorkspaceAuthError } from "@/lib/api/google-workspace-error";

export const runtime = "nodejs";

const money = (value: unknown): number => {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  if (typeof value !== "string") return 0;
  const parsed = Number(value.replace(/[^\d.-]/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
};

export async function GET() {
  try {
    // Read from Event_Budget sheet
    const rawRows = await readRange("Event_Budget!A1:H1000");

    if (rawRows.length <= 1) {
      return NextResponse.json({
        source: "Google Sheets: Event_Budget",
        sourceStatus: "live",
        generatedAt: new Date().toISOString(),
        events: [],
      });
    }

    const headers = rawRows[0].map((h) => h.toLowerCase());
    const getColIndex = (names: string[]): number => {
      for (const name of names) {
        const i = headers.indexOf(name);
        if (i >= 0) return i;
      }
      return -1;
    };

    const eventIdIdx = getColIndex(["event id"]);
    const categoryIdx = getColIndex(["category"]);
    const plannedIdx = getColIndex(["planned amount", "planned", "budget"]);
    const actualIdx = getColIndex(["actual amount", "actual", "cost"]);

    // Also read Events sheet for event names
    let eventNames = new Map<string, string>();
    try {
      const eventsRows = await readRange("Events!A1:Z200");
      if (eventsRows.length > 1) {
        const evtHeaders = eventsRows[0].map((h) => h.toLowerCase());
        const evtIdIdx = evtHeaders.indexOf("id");
        const evtNameIdx = evtHeaders.indexOf("name");
        if (evtIdIdx >= 0 && evtNameIdx >= 0) {
          for (let i = 1; i < eventsRows.length; i++) {
            const row = eventsRows[i];
            if (row[evtIdIdx]) {
              eventNames.set(String(row[evtIdIdx]), String(row[evtNameIdx] || ""));
            }
          }
        }
      }
    } catch {
      // Events sheet may not exist, continue without names
    }

    const eventMap = new Map<string, {
      eventId: string;
      eventName: string;
      totalBudget: number;
      totalActual: number;
      itemCount: number;
    }>();

    for (let i = 1; i < rawRows.length; i++) {
      const row = rawRows[i];
      if (!row.some((cell) => String(cell).trim() !== "")) continue;

      const eventId = eventIdIdx >= 0 ? String(row[eventIdIdx] || "").trim() : "";
      const category = categoryIdx >= 0 ? String(row[categoryIdx] || "").trim() : "";
      const planned = plannedIdx >= 0 ? money(row[plannedIdx]) : 0;
      const actual = actualIdx >= 0 ? money(row[actualIdx]) : 0;

      if (!eventId) continue;

      const existing = eventMap.get(eventId) || {
        eventId,
        eventName: eventNames.get(eventId) || eventId,
        totalBudget: 0,
        totalActual: 0,
        itemCount: 0,
      };
      existing.totalBudget += planned;
      existing.totalActual += actual;
      existing.itemCount += 1;
      eventMap.set(eventId, existing);
    }

    const events = Array.from(eventMap.values())
      .map((evt) => ({
        ...evt,
        remaining: evt.totalBudget - evt.totalActual,
        percentUsed: evt.totalBudget > 0 ? Math.round((evt.totalActual / evt.totalBudget) * 100) : 0,
        status: evt.totalActual > evt.totalBudget ? "over" :
          evt.totalActual / evt.totalBudget >= 0.95 ? "danger" :
          evt.totalActual / evt.totalBudget >= 0.80 ? "warning" : "ok",
      }))
      .sort((a, b) => b.percentUsed - a.percentUsed);

    return NextResponse.json({
      source: "Google Sheets: Event_Budget",
      sourceStatus: "live",
      generatedAt: new Date().toISOString(),
      events,
    });
  } catch (error) {
    if (isGoogleWorkspaceAuthError(error)) {
      return NextResponse.json({
        ...googleWorkspaceDegradedSource("Google Sheets: Event_Budget", error),
        events: [],
      });
    }
    return NextResponse.json({ error: "Failed to fetch event breakdown", details: String(error) }, { status: 500 });
  }
}
