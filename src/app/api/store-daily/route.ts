// GET /api/store-daily — Read daily sales from Store_Daily_Log + Store_Daily sheets
// POST /api/store-daily — Create new daily entry
import { NextRequest, NextResponse } from "next/server";
import { readRange, appendRows, updateRow, deleteRow } from "@/lib/sheets/sheets-real";

export const runtime = "nodejs";

type DailyEntry = {
  id: string;
  date: string;
  day: string;
  openTime: string;
  closeTime: string;
  traffic: number;
  transactions: number;
  omzet: number;
  topProduct: string;
  notes: string;
  rowNumber: number;
};

const DAY_NAMES = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];

function parseDailyEntries(rows: string[][]): DailyEntry[] {
  return rows
    .slice(1)
    .filter((row) => row.some(Boolean))
    .map((row, index) => ({
      id: String(row[0] || `daily-${index + 2}`),
      date: String(row[1] || ""),
      day: String(row[2] || ""),
      openTime: String(row[3] || ""),
      closeTime: String(row[4] || ""),
      traffic: Number(row[5]) || 0,
      transactions: Number(row[6]) || 0,
      omzet: Number(row[7]) || 0,
      topProduct: String(row[8] || ""),
      notes: String(row[9] || ""),
      rowNumber: index + 2,
    }))
    .filter((e) => e.date);
}

function formatShortDate(dateStr: string): string {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("id-ID", { day: "numeric", month: "short" });
}

function getDayName(dateStr: string): string {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "-";
  return DAY_NAMES[d.getDay()];
}

export async function GET() {
  try {
    // Try Store_Daily first (structured daily log), fall back to Store_Daily_Log
    let rows: string[][] = [];
    let sourceSheet = "Store_Daily";

    try {
      rows = await readRange("Store_Daily!A1:J1000");
    } catch {
      // Fall back to Store_Daily_Log
      try {
        rows = await readRange("Store_Daily_Log!A1:J1000");
        sourceSheet = "Store_Daily_Log";
      } catch {
        return NextResponse.json({
          source: "empty",
          sourceStatus: "empty",
          message: "Tidak ada data daily sales",
          entries: [],
          analytics: null,
        });
      }
    }

    const entries = parseDailyEntries(rows);

    if (entries.length === 0) {
      return NextResponse.json({
        source: sourceSheet,
        sourceStatus: "empty",
        message: "Sheet ada tapi baris data kosong",
        entries: [],
        analytics: null,
      });
    }

    // Calculate analytics
    const last7 = entries.slice(0, 7);
    const totalTraffic = last7.reduce((s, e) => s + e.traffic, 0);
    const totalTransactions = last7.reduce((s, e) => s + e.transactions, 0);
    const totalOmzet = last7.reduce((s, e) => s + e.omzet, 0);
    const avgConversion = totalTraffic > 0 ? ((totalTransactions / totalTraffic) * 100).toFixed(1) : "0";

    return NextResponse.json({
      source: sourceSheet,
      sourceStatus: "live",
      entries: entries.slice(0, 60),
      analytics: {
        last7Days: {
          traffic: totalTraffic,
          transactions: totalTransactions,
          omzet: totalOmzet,
          conversion: `${avgConversion}%`,
        },
        thisMonth: {
          traffic: entries.reduce((s, e) => s + e.traffic, 0),
          transactions: entries.reduce((s, e) => s + e.transactions, 0),
          omzet: entries.reduce((s, e) => s + e.omzet, 0),
        },
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Gagal membaca store daily", details: String(error) },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const action = String(body.action || "create");

    if (action === "create") {
      const date = body.date || new Date().toISOString().slice(0, 10);
      const day = getDayName(date);
      const openTime = body.openTime || "10:00";
      const closeTime = body.closeTime || "21:00";
      const traffic = Number(body.traffic) || 0;
      const transactions = Number(body.transactions) || 0;
      const omzet = Number(body.omzet) || 0;
      const topProduct = body.topProduct || "";
      const notes = body.notes || "";

      if (!date) {
        return NextResponse.json({ error: "date wajib diisi" }, { status: 400 });
      }

      // Write to Store_Daily sheet
      const row = [
        `daily-${date}`,
        date,
        day,
        openTime,
        closeTime,
        traffic,
        transactions,
        omzet,
        topProduct,
        notes,
      ];

      await appendRows("Store_Daily", [row]);

      return NextResponse.json(
        {
          success: true,
          action,
          entry: { id: `daily-${date}`, date, day, traffic, transactions, omzet },
          syncedSheets: ["Store_Daily"],
        },
        { status: 201 }
      );
    }

    if (action === "update") {
      const id = String(body.id || "");
      if (!id) return NextResponse.json({ error: "id wajib diisi" }, { status: 400 });

      const rows = await readRange("Store_Daily!A1:J1000");
      const entries = parseDailyEntries(rows);
      const entry = entries.find((e) => e.id === id);
      if (!entry) return NextResponse.json({ error: "entry tidak ditemukan" }, { status: 404 });

      const row = [
        entry.id,
        body.date || entry.date,
        body.day || getDayName(body.date || entry.date),
        body.openTime || entry.openTime,
        body.closeTime || entry.closeTime,
        Number(body.traffic) || entry.traffic,
        Number(body.transactions) || entry.transactions,
        Number(body.omzet) || entry.omzet,
        body.topProduct || entry.topProduct,
        body.notes || entry.notes,
      ];

      await updateRow("Store_Daily", entry.rowNumber, row);
      return NextResponse.json({ success: true, action, syncedSheets: ["Store_Daily"] });
    }

    if (action === "delete") {
      const id = String(body.id || "");
      if (!id) return NextResponse.json({ error: "id wajib diisi" }, { status: 400 });

      const rows = await readRange("Store_Daily!A1:J1000");
      const entries = parseDailyEntries(rows);
      const entry = entries.find((e) => e.id === id);
      if (!entry) return NextResponse.json({ error: "entry tidak ditemukan" }, { status: 404 });

      await deleteRow("Store_Daily", entry.rowNumber);
      return NextResponse.json({ success: true, action, deleted: id, syncedSheets: ["Store_Daily"] });
    }

    return NextResponse.json(
      { error: "action tidak valid. Pilih: create, update, delete" },
      { status: 400 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: "Gagal menyimpan store daily", details: String(error) },
      { status: 500 }
    );
  }
}
