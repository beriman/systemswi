// GET /api/buku-kas/[id] — Get entry detail
// PUT /api/buku-kas/[id] — Update an existing entry
import { NextRequest, NextResponse } from "next/server";
import { readSheet, updateRow } from "@/lib/sheets/sheets-real";
import { googleWorkspaceWriteBlockedSource } from "@/lib/api/google-workspace-error";

export const runtime = "nodejs";

const SHEET_NAME = "BukuKas";

function parseAmount(value: unknown): number {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  if (typeof value !== "string") return 0;
  const normalized = value.replace(/[^\d.-]/g, "");
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    if (!id) {
      return NextResponse.json({ error: "Entry ID is required" }, { status: 400 });
    }

    const raw = await readSheet(SHEET_NAME);
    const dataRows = raw.slice(1).filter((row) => row && row[0]);
    const rowIndex = dataRows.findIndex((row) => row[0] === id);

    if (rowIndex === -1) {
      return NextResponse.json({ error: `Entry with ID "${id}" not found` }, { status: 404 });
    }

    return NextResponse.json({
      source: `Google Sheets: ${SHEET_NAME}`,
      sourceStatus: "live",
      data: rowToEntry(dataRows[rowIndex], rowIndex + 6),
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch entry", details: String(error) },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    if (!id) {
      return NextResponse.json({ error: "Entry ID is required" }, { status: 400 });
    }

    const body = await request.json();
    const { date, type, category, description, amount } = body;

    // Read all rows to find the entry
    const raw = await readSheet(SHEET_NAME);
    const dataRows = raw.slice(1).filter((row) => row && row[0]);

    const rowIndex = dataRows.findIndex((row) => row[0] === id);
    if (rowIndex === -1) {
      return NextResponse.json({ error: `Entry with ID "${id}" not found` }, { status: 404 });
    }

    const rowNumber = rowIndex + 6; // +1 for header, +1 for 1-indexed
    const existingRow = dataRows[rowIndex];

    // Normalize type
    const normalizedType = (type === "K" || type === "Kredit") ? "K" : (type === "D" || type === "Debit") ? "D" : existingRow[2];
    const newAmount = amount ? parseAmount(amount) : parseAmount(normalizedType === "K" ? existingRow[6] : existingRow[5]);
    const debit = normalizedType === "K" ? 0 : newAmount;
    const credit = normalizedType === "K" ? newAmount : 0;

    // Build updated row (keep existing values for unchanged fields)
    const updatedRow = [
      existingRow[0], // entryId
      date || existingRow[1], // date
      normalizedType, // type
      category || existingRow[3], // category
      description !== undefined ? description : existingRow[4], // description
      debit,
      credit,
      existingRow[7], // saldo (recalculated below)
    ];

    // Recalculate saldo properly
    // Get previous entry's saldo
    let prevSaldo = 0;
    if (rowIndex > 0) {
      prevSaldo = Number(dataRows[rowIndex - 1][7]) || 0;
    }
    updatedRow[7] = String(prevSaldo + debit - credit);

    await updateRow(SHEET_NAME, rowNumber, updatedRow);

    return NextResponse.json({
      source: `Google Sheets: ${SHEET_NAME}`,
      sourceStatus: "live",
      message: "Entry updated successfully",
      data: rowToEntry(updatedRow, rowNumber),
    });
  } catch (error) {
    return NextResponse.json(
      googleWorkspaceWriteBlockedSource(SHEET_NAME, error),
      { status: 500 }
    );
  }
}
