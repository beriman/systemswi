// GET /api/buku-kas — List entries (filter: dateFrom, dateTo, category)
// POST /api/buku-kas — Create entry
import { NextRequest, NextResponse } from "next/server";
import {
  readBukuKasSheet,
  parseBukuKasRows,
  calculateRunningBalance,
  appendBukuKasRow,
  recalculateAndWriteSaldo,
  generateId,
  CATEGORIES,
  type BukuKasEntry,
} from "@/lib/buku-kas/sheets";
import { googleWorkspaceDegradedSource, isGoogleWorkspaceAuthError } from "@/lib/api/google-workspace-error";

const SOURCE = "Google Sheets: Buku_Kas";

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const dateFrom = url.searchParams.get("dateFrom") || "";
    const dateTo = url.searchParams.get("dateTo") || "";
    const category = url.searchParams.get("category") || "";

    const rows = await readBukuKasSheet();
    let entries = parseBukuKasRows(rows);
    entries = calculateRunningBalance(entries);

    // Apply filters
    if (dateFrom) {
      entries = entries.filter((e) => e.date >= dateFrom);
    }
    if (dateTo) {
      entries = entries.filter((e) => e.date <= dateTo);
    }
    if (category) {
      entries = entries.filter((e) => e.category.toLowerCase() === category.toLowerCase());
    }

    // Compute saldo
    const saldo = entries.length > 0 ? entries[entries.length - 1].saldo : 0;

    return NextResponse.json({
      source: SOURCE,
      sourceStatus: "live",
      entries,
      saldo,
      total: entries.length,
    });
  } catch (error) {
    if (isGoogleWorkspaceAuthError(error)) {
      return NextResponse.json({
        ...googleWorkspaceDegradedSource(SOURCE, error),
        entries: [],
        saldo: 0,
        total: 0,
      });
    }
    return NextResponse.json({ error: "Failed to fetch buku kas", details: String(error) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const id = generateId();
    const date = body.date || today();
    const type: "D" | "K" = body.type === "K" ? "K" : "D";
    const category = body.category || "Operating";
    const validCategory = CATEGORIES.includes(category as typeof CATEGORIES[number]) ? category : "Operating";
    const amount = Number(body.amount) || 0;
    const description = body.description || "";
    const reference = body.reference || "";

    // Read existing to calculate saldo
    const rows = await readBukuKasSheet();
    const existing = parseBukuKasRows(rows);
    const balanced = calculateRunningBalance(existing);

    let saldo = balanced.length > 0 ? balanced[balanced.length - 1].saldo : 0;
    saldo += type === "D" ? amount : -amount;

    const entry: Omit<BukuKasEntry, "row"> = {
      id,
      date,
      type,
      category: validCategory,
      amount,
      description,
      reference,
      saldo,
    };

    const rowNum = await appendBukuKasRow(entry);

    // Recalculate all saldo after insert
    const updatedRows = await readBukuKasSheet();
    const updatedEntries = parseBukuKasRows(updatedRows);
    await recalculateAndWriteSaldo(updatedEntries);

    return NextResponse.json({
      success: true,
      entry: { ...entry, row: rowNum },
      message: "Entry created successfully.",
    }, { status: 201 });
  } catch (error) {
    if (isGoogleWorkspaceAuthError(error)) {
      return NextResponse.json({
        sourceStatus: "blocked",
        source: SOURCE,
        error: "Google Workspace OAuth perlu re-auth sebelum bisa membuat entry buku kas",
        details: String(error),
      }, { status: 503 });
    }
    return NextResponse.json({ error: "Failed to create entry", details: String(error) }, { status: 500 });
  }
}
