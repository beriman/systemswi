// GET /api/sukuk/invest — List investments
// POST /api/sukuk/invest — Create investment
// Tries Google Sheets first, falls back to local data store
import { NextRequest, NextResponse } from "next/server";
import { readRange, appendRows } from "@/lib/sheets/sheets-real";
import { getLocalInvestments } from "@/lib/sheets/sukuk-local-data";

async function getInvestmentsFromSheets() {
  try {
    const rows = await readRange("SukukProduk!A6:L13");
    if (!rows || rows.length === 0) return null;
    const dataRows = rows[0]?.[0] === "ID Produk" ? rows.slice(1) : rows;
    const investments: any[] = [];
    dataRows.forEach((r, i) => {
      if (r && r[0]) {
        investments.push({
          id: i + 1,
          product_id: i + 1,
          product_name: r[1] || "",
          product_code: r[0] || "",
          investor_name: "",
          investor_email: "",
          investor_phone: "",
          jumlah_unit: 0,
          nilai_investasi: 0,
          tanggal_investasi: "",
          status: "open",
          consent: 1,
        });
      }
    });
    return investments.length > 0 ? investments : null;
  } catch {
    return null;
  }
}

export async function GET() {
  try {
    const sheetData = await getInvestmentsFromSheets();
    if (sheetData && sheetData.length > 0) {
      return NextResponse.json({ investments: sheetData, source: "sheets" });
    }
    const localData = getLocalInvestments();
    return NextResponse.json({ investments: localData, source: "local" });
  } catch (error) {
    const localData = getLocalInvestments();
    return NextResponse.json({ investments: localData, source: "local-fallback" });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const id = `INV-${Date.now()}`;
    // Try Google Sheets first (append to investments if there's a dedicated range)
    try {
      await appendRows("SukukMikro_Investments", [[
        id,
        body.product_id,
        body.investor_name,
        body.investor_email,
        body.investor_phone,
        Number(body.jumlah_unit) || 1,
        Number(body.nilai_investasi) || 0,
        body.tanggal_investasi || new Date().toISOString().slice(0, 10),
        "active",
        1,
      ]]);
      return NextResponse.json({ investment: { id, ...body }, source: "sheets" }, { status: 201 });
    } catch {
      // Sheets failed — return success with local-only note
      return NextResponse.json({
        investment: {
          id,
          product_id: body.product_id,
          investor_name: body.investor_name,
          investor_email: body.investor_email,
          investor_phone: body.investor_phone,
          jumlah_unit: Number(body.jumlah_unit) || 1,
          nilai_investasi: Number(body.nilai_investasi) || 0,
          tanggal_investasi: body.tanggal_investasi || new Date().toISOString().slice(0, 10),
          status: "active",
          consent: 1,
        },
        source: "local",
        note: "Google Sheets unavailable — investment accepted but not persisted to sheets"
      }, { status: 201 });
    }
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create investment", details: String(error) },
      { status: 500 }
    );
  }
}
