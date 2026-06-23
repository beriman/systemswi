// GET /api/sukuk/store — List store performance from SukukStore!A4:O9
import { NextRequest, NextResponse } from "next/server";
import { readRange } from "@/lib/sheets/sheets-real";

export async function GET() {
  try {
    const rows = await readRange("SukukStore!A4:O9");
    if (!rows || rows.length === 0) {
      return NextResponse.json({ store: [], source: "sheets" });
    }
    const dataRows = rows[0]?.[0] === "ID" ? rows.slice(1) : rows;
    const store = dataRows
      .filter((r) => r && r[0])
      .map((r) => ({
        id: r[0] || "",
        brand: r[1] || "",
        kategori: r[2] || "",
        lokasi: r[3] || "",
        revenue_bulanan: Number(r[4]) || 0,
        unit_terjual: Number(r[5]) || 0,
        avg_ticket: Number(r[6]) || 0,
        pelanggan_aktif: Number(r[7]) || 0,
        conversion_rate: Number(r[8]) || 0,
        nps: Number(r[9]) || 0,
        status: r[10] || "",
        catatan: r[11] || "",
      }));
    return NextResponse.json({ store, source: "sheets" });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch store", details: String(error) },
      { status: 500 }
    );
  }
}
