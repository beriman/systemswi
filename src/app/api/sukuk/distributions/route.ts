// GET /api/sukuk/distributions — List profit distributions
// Tries Google Sheets first, falls back to local data store
import { NextRequest, NextResponse } from "next/server";
import { readRange } from "@/lib/sheets/sheets-real";
import { getLocalDistributions } from "@/lib/sheets/sukuk-local-data";

async function getDistributionsFromSheets() {
  try {
    const rows = await readRange("Sukuk_Payment_Schedule!A1:L25");
    if (!rows || rows.length === 0) return null;
    const dataRows = rows[0]?.[0] === "ID" ? rows.slice(1) : rows;
    const paidRows = dataRows.filter((r) => r && r[0] && r[8] === "paid");
    if (paidRows.length === 0) return null;
    return paidRows.map((r, i) => ({
      id: i + 1,
      product_id: 1,
      product_name: r[2] || "",
      product_code: r[1] || "",
      periode: r[3] || "",
      total_revenue: (Number(r[5]) || 0) + (Number(r[6]) || 0),
      total_cogs: 0,
      total_profit: Number(r[6]) || 0,
      nisbah_investor: 60,
      nisbah_pengelola: 40,
      jumlah_dibagikan: Number(r[6]) || 0,
      jumlah_per_unit: 0,
      status: "paid",
    }));
  } catch {
    return null;
  }
}

export async function GET() {
  try {
    const sheetData = await getDistributionsFromSheets();
    if (sheetData && sheetData.length > 0) {
      return NextResponse.json({ distributions: sheetData, source: "sheets" });
    }
    const localData = getLocalDistributions();
    return NextResponse.json({ distributions: localData, source: "local" });
  } catch (error) {
    const localData = getLocalDistributions();
    return NextResponse.json({ distributions: localData, source: "local-fallback" });
  }
}
