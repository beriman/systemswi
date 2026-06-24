// GET /api/sukuk/audit — List audit trail
// Tries Google Sheets first, falls back to local data store
import { NextRequest, NextResponse } from "next/server";
import { readRange } from "@/lib/sheets/sheets-real";
import { getLocalAudit } from "@/lib/sheets/sukuk-local-data";

async function getAuditFromSheets() {
  try {
    const rows = await readRange("Sukuk_Audit!A1:H50");
    if (!rows || rows.length === 0) return null;
    const dataRows = rows[0]?.[0] === "ID" ? rows.slice(1) : rows;
    return dataRows
      .filter((r) => r && r[0])
      .map((r) => ({
        id: r[0] || "",
        timestamp: r[1] || "",
        user: r[2] || "",
        action: r[3] || "",
        entity: r[4] || "",
        entity_id: r[5] || "",
        details: r[6] || "",
        ip_address: r[7] || "",
      }));
  } catch {
    return null;
  }
}

export async function GET() {
  try {
    const sheetData = await getAuditFromSheets();
    if (sheetData && sheetData.length > 0) {
      return NextResponse.json({ audit: sheetData, source: "sheets" });
    }
    // Fallback to local data
    const localData = getLocalAudit();
    return NextResponse.json({ audit: localData, source: "local" });
  } catch (error) {
    const localData = getLocalAudit();
    return NextResponse.json({ audit: localData, source: "local-fallback" });
  }
}
