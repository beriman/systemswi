// PUT /api/cash-harian/[id] — Update cash entry
import { NextRequest, NextResponse } from "next/server";
import { readSheet, updateRow } from "@/lib/sheets/sheets-real";
import { googleWorkspaceWriteBlockedSource } from "@/lib/api/google-workspace-error";

export const runtime = "nodejs";

const SHEET_NAME = "Cash_Harian";

function rowToEntry(row: string[], rowNumber: number) {
  return {
    entryId: row[0] || "",
    date: row[1] || "",
    type: row[2] || "",
    category: row[3] || "",
    description: row[4] || "",
    amount: Number(row[5]) || 0,
    saldo: Number(row[6]) || 0,
    inputBy: row[7] || "",
    inputDate: row[8] || "",
    rowNumber,
  };
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const raw = await readSheet(SHEET_NAME);
    const hasHeader = raw.length > 0 && raw[0][0] === "EntryId";
    const dataRows = hasHeader ? raw.slice(1) : raw;

    const idx = dataRows.findIndex((row) => row && row[0] === id);
    if (idx === -1) {
      return NextResponse.json(
        { error: `Cash entry not found: ${id}` },
        { status: 404 }
      );
    }

    const rowNum = idx + (hasHeader ? 2 : 1);
    const existing = dataRows[idx];

    const updatedRow = [
      id,
      body.date ?? existing[1] ?? "",
      body.type ?? existing[2] ?? "",
      body.category ?? existing[3] ?? "",
      body.description ?? existing[4] ?? "",
      body.amount !== undefined ? Number(body.amount) : Number(existing[5]) || 0,
      body.saldo !== undefined ? Number(body.saldo) : Number(existing[6]) || 0,
      body.inputBy ?? existing[7] ?? "",
      new Date().toISOString().slice(0, 19).replace("T", " "),
    ];

    await updateRow(SHEET_NAME, rowNum, updatedRow);

    return NextResponse.json({
      source: `Google Sheets: ${SHEET_NAME}`,
      sourceStatus: "live",
      message: "Cash entry updated successfully",
      data: rowToEntry(updatedRow, rowNum),
    });
  } catch (error) {
    return NextResponse.json(
      googleWorkspaceWriteBlockedSource(SHEET_NAME, error),
      { status: 500 }
    );
  }
}
