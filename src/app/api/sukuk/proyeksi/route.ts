// GET /api/sukuk/proyeksi — Return projections
import { NextRequest, NextResponse } from "next/server";
import { readRange } from "@/lib/sheets/sheets-real";

// SukukProyeksi: SukukStore!A29:O44
const PROYEKSI_RANGE = "SukukStore!A29:O44";

export async function GET() {
  try {
    const rows = await readRange(PROYEKSI_RANGE);
    if (!rows || rows.length <= 1) {
      return NextResponse.json({ proyeksi: [], source: "sheets" });
    }
    const proyeksi = [];
    for (let i = 1; i < rows.length; i++) {
      const r = rows[i];
      if (!r[0] && !r[1]) continue;
      proyeksi.push({
        id: r[0] || String(i),
        brand: r[1] || "",
        product_id: r[2] || "",
        product_name: r[3] || "",
        investasi: Number(r[4]) || 0,
        bagi_hasil_bulanan: Number(r[5]) || 0,
        return_6bulan: Number(r[6]) || 0,
        return_12bulan: Number(r[7]) || 0,
        roi_persen: Number(r[8]) || 0,
        payback_bulan: Number(r[9]) || 0,
        npv: Number(r[10]) || 0,
        irr: Number(r[11]) || 0,
        status: r[12] || "aktif",
        catatan: r[13] || "",
      });
    }
    return NextResponse.json({ proyeksi, source: "sheets" });
  } catch (error) {
    return NextResponse.json({ proyeksi: [], source: "error", error: String(error) });
  }
}
