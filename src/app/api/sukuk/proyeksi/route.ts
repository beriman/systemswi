// GET /api/sukuk/proyeksi — List projections from SukukStore!A29:O44
import { NextRequest, NextResponse } from "next/server";
import { readRange } from "@/lib/sheets/sheets-real";

export async function GET() {
  try {
    const rows = await readRange("SukukStore!A29:O44");
    if (!rows || rows.length === 0) {
      return NextResponse.json({ proyeksi: [], source: "sheets" });
    }
    const dataRows = rows[0]?.[0] === "ID" ? rows.slice(1) : rows;
    const proyeksi = dataRows
      .filter((r) => r && r[0])
      .map((r) => ({
        id: r[0] || "",
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
        status: r[12] || "",
        catatan: r[13] || "",
      }));
    return NextResponse.json({ proyeksi, source: "sheets" });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch proyeksi", details: String(error) },
      { status: 500 }
    );
  }
}
