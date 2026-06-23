// GET /api/sukuk/schedule — Payment schedule
import { NextRequest, NextResponse } from "next/server";
import { readRange } from "@/lib/sheets/sheets-real";

// SukukSchedule: Sukuk_Payment_Schedule!A1:L25
const SCHEDULE_RANGE = "Sukuk_Payment_Schedule!A1:L25";

export async function GET() {
  try {
    const rows = await readRange(SCHEDULE_RANGE);
    if (!rows || rows.length <= 1) {
      return NextResponse.json({ schedule: [], source: "sheets" });
    }
    const schedule = [];
    for (let i = 1; i < rows.length; i++) {
      const r = rows[i];
      if (!r[0] && !r[1]) continue;
      schedule.push({
        id: r[0] || String(i),
        product_id: r[1] || "",
        product_name: r[2] || "",
        periode: r[3] || "",
        tanggal_jatuh_tempo: r[4] || "",
        jumlah_pokok: Number(r[5]) || 0,
        jumlah_bagi_hasil: Number(r[6]) || 0,
        total_bayar: Number(r[7]) || 0,
        status: r[8] || "scheduled",
        tanggal_bayar: r[9] || "",
        catatan: r[10] || "",
      });
    }
    return NextResponse.json({ schedule, source: "sheets" });
  } catch (error) {
    return NextResponse.json({ schedule: [], source: "error", error: String(error) });
  }
}
