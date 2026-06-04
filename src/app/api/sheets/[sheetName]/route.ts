// GET /api/sheets/[sheetName] — Read data from Google Sheets
import { NextRequest, NextResponse } from "next/server";
import { readSheet } from "@/lib/sheets/sheets-real";
import { SHEET_NAMES } from "@/lib/sheets/types";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sheetName: string }> }
) {
  try {
    const { sheetName } = await params;

    // Validate sheet name
    if (!SHEET_NAMES.includes(sheetName as any)) {
      return NextResponse.json(
        { error: `Unknown sheet: ${sheetName}`, available: SHEET_NAMES },
        { status: 404 }
      );
    }

    const data = await readSheet(sheetName);
    return NextResponse.json({ sheet: sheetName, data });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to read sheet", details: String(error) },
      { status: 500 }
    );
  }
}
