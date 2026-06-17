// Tax & Regulatory Compliance API
// GET /api/tax/calendar — List tax calendar
// GET /api/tax/documents — List tax documents
// GET /api/tax/oss — List OSS status
// POST /api/tax/calendar — Add/update tax item
// POST /api/tax/documents — Add/update document
import { NextRequest, NextResponse } from "next/server";
import { readRanges, appendRows } from "@/lib/sheets/sheets-real";
import { googleWorkspaceDegradedSource, isGoogleWorkspaceAuthError } from "@/lib/api/google-workspace-error";

const TAX_SHEETS = {
  Calendar: "Tax_Calendar",
  Documents: "Tax_Documents",
  OSS: "OSS_Status",
};

const CALENDAR_HEADERS = ["ID", "Tax Type", "Period", "Due Date", "Status", "Amount", "Notes", "Created"];
const DOC_HEADERS = ["ID", "Doc Type", "Doc Number", "Issue Date", "Expiry Date", "Status", "PIC", "Notes", "Proof URL", "Created"];
const OSS_HEADERS = ["ID", "Permit Type", "Number", "Issue Date", "Expiry Date", "Status", "OSS Link", "Notes", "Created"];

function isSheetsError(err: unknown): boolean {
  const msg = String(err);
  return msg.includes("invalid_grant") || msg.includes("Unauthorized") || msg.includes("401") || msg.includes("403");
}

function parseRows(rows: string[][], headers: string[]) {
  if (rows.length <= 1) return [];
  return rows.slice(1).filter((row) => row.some((cell) => String(cell).trim())).map((row) => {
    const obj: Record<string, string> = {};
    headers.forEach((h, i) => { obj[h] = row[i] || ""; });
    return obj;
  });
}

// GET /api/tax/calendar
// GET /api/tax/documents
// GET /api/tax/oss
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const type = url.searchParams.get("type") || "calendar";

    let sheetName: string;
    let headers: string[];

    switch (type) {
      case "documents":
        sheetName = TAX_SHEETS.Documents;
        headers = DOC_HEADERS;
        break;
      case "oss":
        sheetName = TAX_SHEETS.OSS;
        headers = OSS_HEADERS;
        break;
      default:
        sheetName = TAX_SHEETS.Calendar;
        headers = CALENDAR_HEADERS;
    }

    const data = await readRanges([`${sheetName}!A1:Z1000`]);
    const rows = data[`${sheetName}!A1:Z1000`] || [];
    const items = parseRows(rows, headers);

    // Calculate summary
    const summary: Record<string, number> = {};
    for (const item of items) {
      const status = item.Status || "unknown";
      summary[status] = (summary[status] || 0) + 1;
    }

    // Expiry alerts for OSS
    let expiryAlerts: Record<string, string>[] = [];
    if (type === "oss") {
      const now = new Date();
      expiryAlerts = items.filter((item) => {
        if (!item["Expiry Date"] || item.Status === "pending") return false;
        const exp = new Date(item["Expiry Date"]);
        const diff = (exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
        return diff > 0 && diff <= 90;
      });
    }

    // Upcoming due dates for calendar
    let upcomingDue: Record<string, string>[] = [];
    if (type === "calendar") {
      const now = new Date();
      const inDays = new Date();
      inDays.setDate(inDays.getDate() + 14);
      upcomingDue = items.filter((item) => {
        if (!item["Due Date"] || item.Status === "completed") return false;
        const due = new Date(item["Due Date"]);
        return due >= now && due <= inDays;
      });
    }

    return NextResponse.json({
      items,
      summary,
      total: items.length,
      expiryAlerts,
      upcomingDue,
      source: `Google Sheets: ${sheetName}`,
      sourceStatus: "live",
    });
  } catch (error) {
    if (isGoogleWorkspaceAuthError(error)) {
      return NextResponse.json({
        items: [],
        summary: {},
        total: 0,
        source: "Google Sheets",
        sourceStatus: "blocked",
        error: "Google OAuth token perlu re-auth",
      }, { status: 503 });
    }
    return NextResponse.json({ error: "Failed to fetch tax data", details: String(error) }, { status: 500 });
  }
}

// POST /api/tax/calendar — add or update
// POST /api/tax/documents
// POST /api/tax/oss
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const type = body.type || "calendar";
    const action = body.action || "add";

    let sheetName: string;
    let headers: string[];

    switch (type) {
      case "documents":
        sheetName = TAX_SHEETS.Documents;
        headers = DOC_HEADERS;
        break;
      case "oss":
        sheetName = TAX_SHEETS.OSS;
        headers = OSS_HEADERS;
        break;
      default:
        sheetName = TAX_SHEETS.Calendar;
        headers = CALENDAR_HEADERS;
    }

    if (action === "add") {
      const id = body.id || `${type.toUpperCase()}-${Date.now()}`;
      const now = new Date().toISOString().split("T")[0];
      let row: string[];

      switch (type) {
        case "documents":
          row = [id, body.docType || "", body.docNumber || "", body.issueDate || "", body.expiryDate || "", body.status || "pending", body.pic || "", body.notes || "", body.proofUrl || "", now];
          break;
        case "oss":
          row = [id, body.permitType || "", body.number || "", body.issueDate || "", body.expiryDate || "", body.status || "pending", body.ossLink || "", body.notes || "", now];
          break;
        default:
          row = [id, body.taxType || "", body.period || "", body.dueDate || "", body.status || "pending", String(body.amount || 0), body.notes || "", now];
      }

      await appendRows(sheetName, [row]);
      return NextResponse.json({ success: true, id, action: "added" }, { status: 201 });
    }

    return NextResponse.json({ error: "Unknown action", available: ["add"] }, { status: 400 });
  } catch (error) {
    if (isGoogleWorkspaceAuthError(error)) {
      return NextResponse.json({ error: "Google OAuth token tidak valid", sourceStatus: "blocked" }, { status: 503 });
    }
    return NextResponse.json({ error: "Failed to save tax data", details: String(error) }, { status: 500 });
  }
}
