// GET /api/sukuk/schedule — List payment schedule
import { NextRequest, NextResponse } from "next/server";
import { readRange } from "@/lib/sheets/sheets-real";
import { getLocalSchedule } from "@/lib/sheets/sukuk-local-data";

async function getScheduleFromSheets() {
  const rows = await readRange("Sukuk_Payment_Schedule!A1:L25");
  if (!rows || rows.length === 0) return [];
  const dataRows = rows[0]?.[0] === "ID" ? rows.slice(1) : rows;
  return dataRows
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
}

export async function GET() {
  try {
    const sheetData = await getScheduleFromSheets();
    if (sheetData.length > 0) {
      return NextResponse.json({ schedule: sheetData, source: "sheets" });
    }
  } catch {}
  const localData = getLocalSchedule();
  return NextResponse.json({ schedule: localData, source: "local" });
}
