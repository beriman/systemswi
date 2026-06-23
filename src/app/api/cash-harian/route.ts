// GET /api/cash-harian — List cash harian entries with date filter
// POST /api/cash-harian — Create new entry
import { NextRequest, NextResponse } from "next/server";
import { readSheet, appendRows, SHEETS } from "@/lib/sheets/sheets-real";
import { googleWorkspaceWriteBlockedSource } from "@/lib/api/google-workspace-error";

export const runtime = "nodejs";

const SHEET_NAME = "CashHarian";

// Column order: EntryId | Date | Type | Category | Description | Amount | Saldo | InputBy | InputDate
function rowToEntry(row: string[], rowNumber: number) {
  return {
    entryId: row[0] || "",
    date: row[1] || "",
    type: (row[2] || "Masuk") as "Masuk" | "Keluar",
    category: row[3] || "",
    description: row[4] || "",
    amount: Number(row[5]) || 0,
    saldo: Number(row[6]) || 0,
    inputBy: row[7] || "",
    inputDate: row[8] || "",
    rowNumber,
  };
}

function parseAmount(value: unknown): number {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  if (typeof value !== "string") return 0;
  const normalized = value.replace(/[^\d.-]/g, "");
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("startDate") || "";
    const endDate = searchParams.get("endDate") || "";

    const raw = await readSheet(SHEET_NAME);
    // Data starts at row 6 (header at row 5 per range A5:I100)
    const dataRows = raw.slice(1); // skip header row

    let entries = dataRows
      .filter((row) => row && row[0])
      .map((row, i) => rowToEntry(row, i + 6));

    // Filter by date range
    if (startDate) {
      entries = entries.filter((e) => e.date >= startDate);
    }
    if (endDate) {
      entries = entries.filter((e) => e.date <= endDate);
    }

    // Sort by date ascending
    entries.sort((a, b) => a.date.localeCompare(b.date));

    return NextResponse.json({
      source: `Google Sheets: ${SHEET_NAME}`,
      sourceStatus: "live",
      generatedAt: new Date().toISOString(),
      count: entries.length,
      data: entries,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch cash harian entries", details: String(error) },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { date, type, category, description, amount, inputBy } = body;

    if (!date || !type || !category || !amount) {
      return NextResponse.json(
        { error: "Missing required fields: date, type, category, amount" },
        { status: 400 }
      );
    }

    const parsedAmount = parseAmount(amount);
    if (parsedAmount <= 0) {
      return NextResponse.json(
        { error: "Amount must be greater than 0" },
        { status: 400 }
      );
    }

    // Generate entry ID
    const entryId = `CH-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
    const entryDate = new Date().toISOString().slice(0, 10);

    // Calculate saldo: read last entry's saldo
    const raw = await readSheet(SHEET_NAME);
    const dataRows = raw.slice(1).filter((row) => row && row[0]);
    let lastSaldo = 0;
    if (dataRows.length > 0) {
      const lastRow = dataRows[dataRows.length - 1];
      lastSaldo = Number(lastRow[6]) || 0;
    }

    const saldoChange = type === "Masuk" ? parsedAmount : -parsedAmount;
    const newSaldo = lastSaldo + saldoChange;

    const newRow = [
      entryId,
      date,
      type,
      category,
      description || "",
      parsedAmount,
      newSaldo,
      inputBy || "system",
      entryDate,
    ];

    await appendRows(SHEET_NAME, [newRow]);

    return NextResponse.json({
      source: `Google Sheets: ${SHEET_NAME}`,
      sourceStatus: "live",
      message: "Entry created successfully",
      data: rowToEntry(newRow, 0),
    }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      googleWorkspaceWriteBlockedSource(SHEET_NAME, error),
      { status: 500 }
    );
  }
}
