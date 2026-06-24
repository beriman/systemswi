// GET /api/sukuk/store — List store performance
// Tries Google Sheets first, falls back to local data store
import { NextRequest, NextResponse } from "next/server";
import { readRange } from "@/lib/sheets/sheets-real";
import { getLocalStore } from "@/lib/sheets/sukuk-local-data";

async function getStoreFromSheets() {
  try {
    const rows = await readRange("SukukStore!A4:O9");
    if (!rows || rows.length === 0) return null;
    const dataRows = rows[0]?.[0] === "ID" ? rows.slice(1) : rows;
    return dataRows
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
  } catch {
    return null;
  }
}

export async function GET() {
  try {
    const sheetData = await getStoreFromSheets();
    if (sheetData && sheetData.length > 0) {
      return NextResponse.json({ store: sheetData, source: "sheets" });
    }
    const localData = getLocalStore();
    return NextResponse.json({ store: localData, source: "local" });
  } catch (error) {
    const localData = getLocalStore();
    return NextResponse.json({ store: localData, source: "local-fallback" });
  }
}
