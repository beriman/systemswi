// GET /api/agent/audit — Read recent audit log entries
// POST /api/agent/audit — Log a new audit entry
import { NextRequest, NextResponse } from "next/server";
import { readRange, appendRows } from "@/lib/sheets/sheets-real";
import type { AuditEntry } from "@/lib/agent/audit";

export const runtime = "nodejs";

export async function GET() {
  try {
    const rows = await readRange("Agent_Audit_Log!A1:H100");
    if (rows.length === 0) {
      return NextResponse.json({ entries: [], headers: [] });
    }

    const headers = rows[0];
    const entries = rows.slice(1)
      .filter((row) => row.some((cell) => cell && cell.trim()))
      .map((row) => ({
        timestamp: row[0] || "",
        agent: row[1] || "",
        action: row[2] || "",
        target: row[3] || "",
        status: row[4] || "",
        humanApproved: row[5] || "",
        notes: row[6] || "",
        approvalId: row[7] || "",
      }))
      .slice(-50); // Last 50 entries

    return NextResponse.json({ entries, headers, source: "Google Sheets: Agent_Audit_Log" });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to read audit log", details: String(error) },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const entry: AuditEntry = await request.json();

    // Validate required fields
    if (!entry.action || !entry.target) {
      return NextResponse.json(
        { error: "action and target are required" },
        { status: 400 }
      );
    }

    const row = [
      entry.timestamp || new Date().toISOString(),
      entry.agent || "HemuHemu/OWL",
      entry.action,
      entry.target,
      entry.status || "success",
      entry.humanApproved || "n/a",
      entry.notes || "",
      entry.approvalId || "",
    ];

    await appendRows("AgentAuditLog", [row]);

    return NextResponse.json({ success: true, entry: row }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to write audit log", details: String(error) },
      { status: 500 }
    );
  }
}
