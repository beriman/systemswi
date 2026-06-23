// GET /api/sukuk/store — Store performance data
import { NextRequest, NextResponse } from "next/server";
import { readRange } from "@/lib/sheets/sheets-real";

// SukukStore: SukukStore!A4:O9
const STORE_RANGE = "SukukStore!A4:O9";

export async function GET() {
  try {
    const rows = await readRange(STORE_RANGE);
    if (!rows || rows.length <= 1) {
      return NextResponse.json({ store: [], source: "sheets" });
    }
    const store = [];
    for (let i = 1; i < rows.length; i++) {
      const r = rows[i];
      if (!r[0] && !r[1]) continue;
      store.push({
        id: r[0] || String(i),
        brand: r[1] || "",
        kategori: r[2] || "",
        lokasi: r[3] || "",
        revenue_bulanan: Number(r[4]) || 0,
        unit_terjual: Number(r[5]) || 0,
        avg_ticket: Number(r[6]) || 0,
        pelanggan_aktif: Number(r[7]) || 0,
        conversion_rate: Number(r[8]) || 0,
        nps: Number(r[9]) || 0,
        status: r[10] || "aktif",
        catatan: r[11] || "",
      });
    }
    return NextResponse.json({ store, source: "sheets" });
  } catch (error) {
    return NextResponse.json({ store: [], source: "error", error: String(error) });
  }
}
