// PUT /api/cash-harian/[id] — Update an existing entry
import { NextRequest, NextResponse } from "next/server";
import { readSheet, updateRow } from "@/lib/sheets/sheets-real";
import { googleWorkspaceWriteBlockedSource } from "@/lib/api/google-workspace-error";

export const runtime = "nodejs";

const SHEET_NAME = "CashHarian";

function parseAmount(value: unknown): number {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  if (typeof value !== "string") return 0;
  const normalized = value.replace(/[^\d.-]/g, "");
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    if (!id) {
      return NextResponse.json({ error: "Entry ID is required" }, { status: 400 });
    }

    const body = await request.json();
    const { date, type, category, description, amount } = body;

    // Read all rows to find the entry
    const raw = await readSheet(SHEET_NAME);
    const headerRow = raw[0]; // row 5
    const dataRows = raw.slice(1); // row 6+

    const rowIndex = dataRows.findIndex((row) => row[0] === id);
    if (rowIndex === -1) {
      return NextResponse.json({ error: `Entry with ID "${id}" not found` }, { status: 404 });
    }

    const rowNumber = rowIndex + 6; // +1 for header, +1 for 1-indexed
    const existingRow = dataRows[rowIndex];

    // Build updated row (keep existing values for unchanged fields)
    const updatedRow = [
      existingRow[0], // entryId
      date || existingRow[1], // date
      type || existingRow[2], // type
      category || existingRow[3], // category
      description !== undefined ? description : existingRow[4], // description
      amount ? parseAmount(amount) : parseAmount(existingRow[5]), // amount
      existingRow[6], // saldo (recalculated by sheet formula or separate logic)
      existingRow[7], // inputBy
      existingRow[8], // inputDate
    ];

    await updateRow(SHEET_NAME, rowNumber, updatedRow);

    return NextResponse.json({
      source: `Google Sheets: ${SHEET_NAME}`,
      sourceStatus: "live",
      message: "Entry updated successfully",
      data: {
        entryId: updatedRow[0],
        date: updatedRow[1],
        type: updatedRow[2],
        category: updatedRow[3],
        description: updatedRow[4],
        amount: parseAmount(updatedRow[5]),
        saldo: parseAmount(updatedRow[6]),
        rowNumber,
      },
    });
  } catch (error) {
    return NextResponse.json(
      googleWorkspaceWriteBlockedSource(SHEET_NAME, error),
      { status: 500 }
    );
  }
}
