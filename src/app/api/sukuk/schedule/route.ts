// GET /api/sukuk/schedule — List payment schedule from Sukuk_Payment_Schedule!A1:L25
import { NextRequest, NextResponse } from "next/server";
import { readRange } from "@/lib/sheets/sheets-real";

export async function GET() {
  try {
    const rows = await readRange("Sukuk_Payment_Schedule!A1:L25");
    if (!rows || rows.length === 0) {
      return NextResponse.json({ schedule: [], source: "sheets" });
    }
    const dataRows = rows[0]?.[0] === "ID" ? rows.slice(1) : rows;
    const schedule = dataRows
      .filter((r) => r && r[0])
      .map((r) => ({
        id: r[0] || "",
        product_id: r[1] || "",
        product_name: r[2] || "",
        periode: r[3] || "",
        tanggal_jatuh_tempo: r[4] || "",
        jumlah_pokok: Number(r[5]) || 0,
        jumlah_bagi_hasil: Number(r[6]) || 0,
        total_bayar: Number(r[7]) || 0,
        status: r[8] || "",
        tanggal_bayar: r[9] || "",
        catatan: r[10] || "",
      }));
    return NextResponse.json({ schedule, source: "sheets" });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch schedule", details: String(error) },
      { status: 500 }
    );
  }
}
