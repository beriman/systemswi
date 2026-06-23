// GET /api/sukuk/audit — Audit trail
import { NextRequest, NextResponse } from "next/server";
import { readRange } from "@/lib/sheets/sheets-real";

// SukukAudit: Sukuk_Audit!A1:H50
const AUDIT_RANGE = "Sukuk_Audit!A1:H50";

export async function GET() {
  try {
    const rows = await readRange(AUDIT_RANGE);
    if (!rows || rows.length <= 1) {
      return NextResponse.json({ audit: [], source: "sheets" });
    }
    const audit = [];
    for (let i = 1; i < rows.length; i++) {
      const r = rows[i];
      if (!r[0] && !r[1]) continue;
      audit.push({
        id: r[0] || String(i),
        timestamp: r[1] || "",
        user: r[2] || "",
        action: r[3] || "",
        entity: r[4] || "",
        entity_id: r[5] || "",
        details: r[6] || "",
        ip_address: r[7] || "",
      });
    }
    return NextResponse.json({ audit, source: "sheets" });
  } catch (error) {
    return NextResponse.json({ audit: [], source: "error", error: String(error) });
  }
}
