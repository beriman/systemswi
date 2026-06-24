// GET /api/buku-kas/[id] — Get single entry detail
// PUT /api/buku-kas/[id] — Update entry
import { NextRequest, NextResponse } from "next/server";
import { readSheet, updateRow } from "@/lib/sheets/sheets-real";
import { googleWorkspaceWriteBlockedSource, googleWorkspaceDegradedSource, isGoogleWorkspaceAuthError } from "@/lib/api/google-workspace-error";

export const runtime = "nodejs";

const SHEET_NAME = "BukuKas";

function rowToEntry(row: string[], rowNumber: number) {
  return {
    entryId: row[0] || "",
    date: row[1] || "",
    type: row[2] || "",
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
  try {
    const { id } = await params;
    const raw = await readSheet(SHEET_NAME);
    const hasHeader = raw.length > 0 && raw[0][0] === "EntryId";
    const dataRows = hasHeader ? raw.slice(1) : raw;

    const idx = dataRows.findIndex((row) => row && row[0] === id);
    if (idx === -1) {
      return NextResponse.json(
        { error: `Buku kas entry not found: ${id}` },
        { status: 404 }
      );
    }

    const rowNum = idx + (hasHeader ? 2 : 1);
    return NextResponse.json({
      source: `Google Sheets: ${SHEET_NAME}`,
      sourceStatus: "live",
      data: rowToEntry(dataRows[idx], rowNum),
    });
  } catch (error) {
    if (isGoogleWorkspaceAuthError(error)) {
      return NextResponse.json(googleWorkspaceDegradedSource(SHEET_NAME, error), { status: 200 });
    }
    return NextResponse.json(
      { error: "Failed to fetch buku kas entry", details: String(error) },
      { status: 500 }
    );
  }
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
        { error: `Buku kas entry not found: ${id}` },
        { status: 404 }
      );
    }

    const rowNum = idx + (hasHeader ? 2 : 1);
    const existing = dataRows[idx];

    const debit = body.debit !== undefined ? Number(body.debit) : Number(existing[5]) || 0;
    const credit = body.credit !== undefined ? Number(body.credit) : Number(existing[6]) || 0;

    const updatedRow: string[] = [
      id,
      body.date ?? existing[1] ?? "",
      body.type ?? existing[2] ?? "",
      body.category ?? existing[3] ?? "",
      body.description ?? existing[4] ?? "",
      String(debit),
      String(credit),
      String(body.saldo !== undefined ? Number(body.saldo) : Number(existing[7]) || 0),
    ];

    await updateRow(SHEET_NAME, rowNum, updatedRow);

    return NextResponse.json({
      source: `Google Sheets: ${SHEET_NAME}`,
      sourceStatus: "live",
      message: "Buku kas entry updated successfully",
      data: rowToEntry(updatedRow, rowNum),
    });
  } catch (error) {
    return NextResponse.json(
      googleWorkspaceWriteBlockedSource(SHEET_NAME, error),
      { status: 500 }
    );
  }
}
