// GET /api/sukuk/rab — List RAB entries
// Tries Google Sheets first, falls back to local data store
import { NextRequest, NextResponse } from "next/server";
import { readRange } from "@/lib/sheets/sheets-real";
import { getLocalRAB } from "@/lib/sheets/sukuk-local-data";

async function getRABFromSheets() {
  try {
    const rows = await readRange("Sukuk_RAB!A1:Z30");
    if (!rows || rows.length === 0) return null;
    const dataRows = rows[0]?.[0] === "ID" ? rows.slice(1) : rows;
    return dataRows
      .filter((r) => r && r[0])
      .map((r) => ({
        id: r[0] || "",
        kategori: r[1] || "",
        deskripsi: r[2] || "",
        volume: Number(r[3]) || 0,
        satuan: r[4] || "",
        harga_satuan: Number(r[5]) || 0,
        jumlah: Number(r[6]) || 0,
        realisasi: Number(r[7]) || 0,
        variance: Number(r[8]) || 0,
        status: r[9] || "",
        catatan: r[10] || "",
      }));
  } catch {
    return null;
  }
}

export async function GET() {
  try {
    const sheetData = await getRABFromSheets();
    if (sheetData && sheetData.length > 0) {
      return NextResponse.json({ rab: sheetData, source: "sheets" });
    }
    const localData = getLocalRAB();
    return NextResponse.json({ rab: localData, source: "local" });
  } catch (error) {
    const localData = getLocalRAB();
    return NextResponse.json({ rab: localData, source: "local-fallback" });
  }
}
