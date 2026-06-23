// GET /api/sukuk/audit — List audit trail from Sukuk_Audit!A1:H50
import { NextRequest, NextResponse } from "next/server";
import { readRange } from "@/lib/sheets/sheets-real";

export async function GET() {
  try {
    const rows = await readRange("Sukuk_Audit!A1:H50");
    if (!rows || rows.length === 0) {
      return NextResponse.json({ audit: [], source: "sheets" });
    }
    const dataRows = rows[0]?.[0] === "ID" ? rows.slice(1) : rows;
    const audit = dataRows
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
    return NextResponse.json({ audit, source: "sheets" });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch audit", details: String(error) },
      { status: 500 }
    );
  }
}
