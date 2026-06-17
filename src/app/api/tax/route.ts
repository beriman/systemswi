// Tax & Regulatory Compliance API
// GET /api/tax?type=calendar|documents|oss|pajak
// POST /api/tax — Add items (type + action)
import { NextRequest, NextResponse } from "next/server";
import { readRanges, appendRows } from "@/lib/sheets/sheets-real";
import { isGoogleWorkspaceAuthError } from "@/lib/api/google-workspace-error";

const TAX_SHEETS = {
  Calendar: "Tax_Calendar",
  Documents: "Tax_Documents",
  OSS: "OSS_Status",
  Pajak: "Pajak_Tracking",
};

const CALENDAR_HEADERS = ["ID", "Tax Type", "Period", "Due Date", "Status", "Amount", "Notes", "Created"];
const DOC_HEADERS = ["ID", "Doc Type", "Doc Number", "Issue Date", "Expiry Date", "Status", "PIC", "Notes", "Proof URL", "Created"];
const OSS_HEADERS = ["ID", "Permit Type", "Number", "Issue Date", "Expiry Date", "Status", "OSS Link", "Notes", "Created"];
// Pajak_Tracking sheet columns: Jenis Pajak, Keterangan, Nominal, Jatuh Tempo, Status, Bukti Bayar, Deadline, Keterangan
const PAJAK_HEADERS = ["Jenis Pajak", "Keterangan", "Nominal", "Jatuh Tempo", "Status", "Bukti Bayar", "Deadline", "Notes"];

function parseRows(rows: string[][], headers: string[]) {
  if (rows.length <= 1) return [];
  return rows.slice(1).filter((row) => row.some((cell) => String(cell).trim())).map((row) => {
    const obj: Record<string, string> = {};
    headers.forEach((h, i) => { obj[h] = row[i] || ""; });
    return obj;
  });
}

function parsePajakRows(rows: string[][]) {
  // Pajak_Tracking has no ID column; generate index-based IDs
  if (rows.length <= 1) return [];
  return rows.slice(1).filter((row) => row.some((cell) => String(cell).trim())).map((row, idx) => {
    const obj: Record<string, string> = { ID: `PAJAK-${idx + 1}` };
    PAJAK_HEADERS.forEach((h, i) => { obj[h] = row[i] || ""; });
    return obj;
  });
}

// GET /api/tax?type=calendar|documents|oss|pajak
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const type = url.searchParams.get("type") || "calendar";

    if (type === "pajak") {
      return await getPajakTracking();
    }

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

    const summary: Record<string, number> = {};
    for (const item of items) {
      const status = item.Status || "unknown";
      summary[status] = (summary[status] || 0) + 1;
    }

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
      }, { status: 200 });
    }
    return NextResponse.json({ error: "Failed to fetch tax data", details: String(error) }, { status: 500 });
  }
}

async function getPajakTracking() {
  const sheetName = TAX_SHEETS.Pajak;
  const data = await readRanges([`${sheetName}!A1:H500`]);
  const rows = data[`${sheetName}!A1:H500`] || [];
  const items = parsePajakRows(rows);

  const summary: Record<string, number> = {};
  for (const item of items) {
    const status = item.Status || "unknown";
    summary[status] = (summary[status] || 0) + 1;
  }

  // Upcoming deadlines (within 30 days)
  const now = new Date();
  const in30 = new Date();
  in30.setDate(in30.getDate() + 30);
  const upcomingDeadline = items.filter((item) => {
    const deadline = item.Deadline;
    if (!deadline || deadline === "Bertahap" || deadline === "Sesuai event" || deadline === "Sesuai periode") return false;
    try {
      const d = new Date(deadline);
      return d >= now && d <= in30;
    } catch {
      return false;
    }
  });

  return NextResponse.json({
    items,
    summary,
    total: items.length,
    upcomingDeadline,
    source: `Google Sheets: ${sheetName}`,
    sourceStatus: "live",
  });
}

// POST /api/tax — add items
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const type = body.type || "calendar";
    const action = body.action || "add";

    let sheetName: string;

    switch (type) {
      case "documents":
        sheetName = TAX_SHEETS.Documents;
        break;
      case "oss":
        sheetName = TAX_SHEETS.OSS;
        break;
      case "pajak":
        sheetName = TAX_SHEETS.Pajak;
        break;
      default:
        sheetName = TAX_SHEETS.Calendar;
    }

    if (action === "add") {
      const now = new Date().toISOString().split("T")[0];
      let row: string[];

      switch (type) {
        case "documents": {
          const id = body.id || `DOC-${Date.now()}`;
          row = [id, body.docType || "", body.docNumber || "", body.issueDate || "", body.expiryDate || "", body.status || "pending", body.pic || "", body.notes || "", body.proofUrl || "", now];
          break;
        }
        case "oss": {
          const id = body.id || `OSS-${Date.now()}`;
          row = [id, body.permitType || "", body.number || "", body.issueDate || "", body.expiryDate || "", body.status || "pending", body.ossLink || "", body.notes || "", now];
          break;
        }
        case "pajak": {
          // Pajak_Tracking: Jenis Pajak, Keterangan, Nominal, Jatuh Tempo, Status, Bukti Bayar, Deadline, Notes
          row = [
            body.jenisPajak || "",
            body.keterangan || "",
            String(body.nominal || 0),
            body.jatuhTempo || "",
            body.status || "⏳ Pending",
            body.buktiBayar || "",
            body.deadline || "",
            body.notes || "",
          ];
          break;
        }
        default: {
          const id = body.id || `TAX-${Date.now()}`;
          row = [id, body.taxType || "", body.period || "", body.dueDate || "", body.status || "pending", String(body.amount || 0), body.notes || "", now];
        }
      }

      await appendRows(sheetName, [row]);
      return NextResponse.json({ success: true, action: "added" }, { status: 201 });
    }

    return NextResponse.json({ error: "Unknown action", available: ["add"] }, { status: 400 });
  } catch (error) {
    if (isGoogleWorkspaceAuthError(error)) {
      return NextResponse.json({ error: "Google OAuth token tidak valid", sourceStatus: "blocked" }, { status: 503 });
    }
    return NextResponse.json({ error: "Failed to save tax data", details: String(error) }, { status: 500 });
  }
}
