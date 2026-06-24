// GET /api/sukuk/proyeksi — List projections
// Tries Google Sheets first, falls back to local data store
import { NextRequest, NextResponse } from "next/server";
import { readRange } from "@/lib/sheets/sheets-real";
import { getLocalProyeksi } from "@/lib/sheets/sukuk-local-data";

async function getProyeksiFromSheets() {
  try {
    const rows = await readRange("SukukStore!A29:O44");
    if (!rows || rows.length === 0) return null;
    const dataRows = rows[0]?.[0] === "ID" ? rows.slice(1) : rows;
    return dataRows
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
  } catch {
    return null;
  }
}

export async function GET() {
  try {
    const sheetData = await getProyeksiFromSheets();
    if (sheetData && sheetData.length > 0) {
      return NextResponse.json({ proyeksi: sheetData, source: "sheets" });
    }
    const localData = getLocalProyeksi();
    return NextResponse.json({ proyeksi: localData, source: "local" });
  } catch (error) {
    const localData = getLocalProyeksi();
    return NextResponse.json({ proyeksi: localData, source: "local-fallback" });
  }
}
