// GET /api/buku-kas/[id] — Get entry detail
// PUT /api/buku-kas/[id] — Update entry
import { NextRequest, NextResponse } from "next/server";
import {
  readBukuKasSheet,
  parseBukuKasRows,
  updateBukuKasRow,
  recalculateAndWriteSaldo,
  CATEGORIES,
  type BukuKasEntry,
} from "@/lib/buku-kas/sheets";
import { googleWorkspaceDegradedSource, isGoogleWorkspaceAuthError } from "@/lib/api/google-workspace-error";

const SOURCE = "Google Sheets: Buku_Kas";

function s(row: string[], idx: number): string {
  return row[idx] || "";
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const rows = await readBukuKasSheet();
    const entries = parseBukuKasRows(rows);
    const entry = entries.find((e) => e.id === id);

    if (!entry) {
      return NextResponse.json({ error: "Entry not found" }, { status: 404 });
    }

    return NextResponse.json({ source: SOURCE, sourceStatus: "live", entry });
  } catch (error) {
    if (isGoogleWorkspaceAuthError(error)) {
      return NextResponse.json({
        ...googleWorkspaceDegradedSource(SOURCE, error),
        entry: null,
      });
    }
    return NextResponse.json({ error: "Failed to fetch entry detail", details: String(error) }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();

    const rows = await readBukuKasSheet();
    const entries = parseBukuKasRows(rows);
    const existing = entries.find((e) => e.id === id);

    if (!existing) {
      return NextResponse.json({ error: "Entry not found" }, { status: 404 });
    }

    const type: "D" | "K" = body.type === "K" ? "K" : (existing.type as "D" | "K");
    const category = body.category || existing.category;
    const validCategory = CATEGORIES.includes(category as typeof CATEGORIES[number]) ? category : existing.category;

    const updated: Omit<BukuKasEntry, "row"> = {
      id,
      date: body.date || existing.date,
      type,
      category: validCategory,
      amount: body.amount !== undefined ? Number(body.amount) : existing.amount,
      description: body.description !== undefined ? body.description : existing.description,
      reference: body.reference !== undefined ? body.reference : existing.reference,
      saldo: existing.saldo,
    };

    await updateBukuKasRow(existing.row, updated);

    // Recalculate all saldo
    const refreshedRows = await readBukuKasSheet();
    const refreshedEntries = parseBukuKasRows(refreshedRows);
    await recalculateAndWriteSaldo(refreshedEntries);

    return NextResponse.json({
      success: true,
      entry: { ...updated, row: existing.row },
      message: "Entry updated successfully.",
    });
  } catch (error) {
    if (isGoogleWorkspaceAuthError(error)) {
      return NextResponse.json({
        sourceStatus: "blocked",
        source: SOURCE,
        error: "Google Workspace OAuth perlu re-auth sebelum bisa update entry buku kas",
        details: String(error),
      }, { status: 503 });
    }
    return NextResponse.json({ error: "Failed to update entry", details: String(error) }, { status: 500 });
  }
}
