// GET /api/buku-kas — List buku kas entries with filters
// POST /api/buku-kas — Create new entry
import { NextRequest, NextResponse } from "next/server";
import { readSheet, appendRows, SHEETS } from "@/lib/sheets/sheets-real";
import { googleWorkspaceWriteBlockedSource } from "@/lib/api/google-workspace-error";

export const runtime = "nodejs";

const SHEET_NAME = "BukuKas";

// Columns: EntryId | Date | Type | Category | Description | Debit | Credit | Saldo
function rowToEntry(row: string[], rowNumber: number) {
  const rawType = row[2] || "Debit";
  const type = rawType === "K" || rawType === "Kredit" ? "K" : "D";
  return {
    entryId: row[0] || "",
    date: row[1] || "",
    type: type as "D" | "K",
    category: row[3] || "",
    description: row[4] || "",
    debit: Number(row[5]) || 0,
    credit: Number(row[6]) || 0,
    saldo: Number(row[7]) || 0,
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
    const category = searchParams.get("category") || "";
    const type = searchParams.get("type") || "";

    const raw = await readSheet(SHEET_NAME);
    // Data starts at row 6 (header at row 5 per range A5:H100)
    const dataRows = raw.slice(1); // skip header row

    let entries = dataRows
      .filter((row) => row && row[0])
      .map((row, i) => rowToEntry(row, i + 6));

    // Filters
    if (startDate) entries = entries.filter((e) => e.date >= startDate);
    if (endDate) entries = entries.filter((e) => e.date <= endDate);
    if (category) entries = entries.filter((e) => e.category === category);
    if (type) entries = entries.filter((e) => e.type === type);

    // Sort by date ascending, then by entryId
    entries.sort((a, b) => {
      const dateCmp = a.date.localeCompare(b.date);
      return dateCmp !== 0 ? dateCmp : a.entryId.localeCompare(b.entryId);
    });

    return NextResponse.json({
      source: `Google Sheets: ${SHEET_NAME}`,
      sourceStatus: "live",
      generatedAt: new Date().toISOString(),
      count: entries.length,
      entries,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch buku kas entries", details: String(error) },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { date, type, category, description, amount, reference } = body;

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

    // Normalize type: accept "D"/"Debit" and "K"/"Kredit"
    const normalizedType = (type === "K" || type === "Kredit") ? "K" : "D";

    // Generate entry ID
    const entryId = `BK-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

    // Calculate saldo: read last entry's saldo
    const raw = await readSheet(SHEET_NAME);
    const dataRows = raw.slice(1).filter((row) => row && row[0]);
    let lastSaldo = 0;
    if (dataRows.length > 0) {
      const lastRow = dataRows[dataRows.length - 1];
      lastSaldo = Number(lastRow[7]) || 0;
    }

    const debit = normalizedType === "D" ? parsedAmount : 0;
    const credit = normalizedType === "K" ? parsedAmount : 0;
    const newSaldo = lastSaldo + debit - credit;

    const newRow = [
      entryId,
      date,
      normalizedType,
      category,
      description || reference || "",
      debit,
      credit,
      newSaldo,
    ];

    await appendRows(SHEET_NAME, [newRow]);

    const createdEntry = rowToEntry(newRow, 0);
    return NextResponse.json({
      source: `Google Sheets: ${SHEET_NAME}`,
      sourceStatus: "live",
      message: "Entry created successfully",
      data: createdEntry,
      entry: createdEntry,
    }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      googleWorkspaceWriteBlockedSource(SHEET_NAME, error),
      { status: 500 }
    );
  }
}
