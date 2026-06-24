// GET /api/buku-kas — List buku kas entries (filter: type, category, startDate, endDate)
// POST /api/buku-kas — Create new entry
import { NextRequest, NextResponse } from "next/server";
import { readSheet, appendRows } from "@/lib/sheets/sheets-real";
import { googleWorkspaceWriteBlockedSource, googleWorkspaceDegradedSource, isGoogleWorkspaceAuthError } from "@/lib/api/google-workspace-error";

export const runtime = "nodejs";

const SHEET_NAME = "BukuKas";

// Column order:
// A: EntryId, B: Date, C: Type (Debit/Kredit), D: Category, E: Description,
// F: Debit, G: Credit, H: Saldo
const HEADERS = [
  "EntryId", "Date", "Type", "Category", "Description",
  "Debit", "Credit", "Saldo",
];

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

async function ensureHeader() {
  const raw = await readSheet(SHEET_NAME);
  if (raw.length === 0 || raw[0][0] !== "EntryId") {
    await appendRows(SHEET_NAME, [HEADERS]);
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") || "";
    const category = searchParams.get("category") || "";
    const startDate = searchParams.get("startDate") || "";
    const endDate = searchParams.get("endDate") || "";
    const limit = searchParams.get("limit") || "";

    const raw = await readSheet(SHEET_NAME);
    const hasHeader = raw.length > 0 && raw[0][0] === "EntryId";
    const dataRows = hasHeader ? raw.slice(1) : raw;

    let results = dataRows
      .filter((row) => row && row[0])
      .map((row, i) => rowToEntry(row, i + (hasHeader ? 2 : 1)));

    if (type) {
      results = results.filter((r) => r.type.toLowerCase() === type.toLowerCase());
    }
    if (category) {
      results = results.filter((r) =>
        r.category.toLowerCase().includes(category.toLowerCase())
      );
    }
    if (startDate) {
      results = results.filter((r) => r.date >= startDate);
    }
    if (endDate) {
      results = results.filter((r) => r.date <= endDate);
    }

    // Sort by date ascending, then by entryId ascending
    results.sort((a, b) => {
      const dateCmp = a.date.localeCompare(b.date);
      if (dateCmp !== 0) return dateCmp;
      return a.entryId.localeCompare(b.entryId);
    });

    if (limit) {
      const n = parseInt(limit, 10);
      if (n > 0) results = results.slice(-n);
    }

    const totalDebit = results.reduce((s, r) => s + r.debit, 0);
    const totalCredit = results.reduce((s, r) => s + r.credit, 0);
    const saldoAkhir = results.length > 0 ? results[results.length - 1].saldo : 0;

    return NextResponse.json({
      source: `Google Sheets: ${SHEET_NAME}`,
      sourceStatus: "live",
      generatedAt: new Date().toISOString(),
      summary: { totalDebit, totalCredit, saldoAkhir, count: results.length },
      count: results.length,
      data: results,
    });
  } catch (error) {
    if (isGoogleWorkspaceAuthError(error)) {
      return NextResponse.json(googleWorkspaceDegradedSource(SHEET_NAME, error), { status: 200 });
    }
    return NextResponse.json(
      { error: "Failed to fetch buku kas", details: String(error) },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { date, type, category, description, amount, reference } = body;

    if (!date || !type || amount === undefined) {
      return NextResponse.json(
        { error: "Missing required fields: date, type, amount are required" },
        { status: 400 }
      );
    }

    if (!["Debit", "Kredit"].includes(type)) {
      return NextResponse.json(
        { error: "Type must be 'Debit' or 'Kredit'" },
        { status: 400 }
      );
    }

    const amt = Number(amount);
    if (amt < 0) {
      return NextResponse.json(
        { error: "Amount must be non-negative" },
        { status: 400 }
      );
    }

    await ensureHeader();

    // Read existing to compute running saldo
    const raw = await readSheet(SHEET_NAME);
    const hasHeader = raw.length > 0 && raw[0][0] === "EntryId";
    const dataRows = hasHeader ? raw.slice(1) : raw;
    const existing = dataRows.filter((row) => row && row[0]).map(rowToEntry);
    const lastSaldo = existing.length > 0 ? existing[existing.length - 1].saldo : 0;

    const debit = type === "Debit" ? amt : 0;
    const credit = type === "Kredit" ? amt : 0;
    const newSaldo = lastSaldo + debit - credit;

    const entryId = `BK-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
    const row: string[] = [
      entryId, date, type, category || "Lain-lain",
      description || reference || "", String(debit), String(credit), String(newSaldo),
    ];

    await appendRows(SHEET_NAME, [row]);

    return NextResponse.json(
      {
        source: `Google Sheets: ${SHEET_NAME}`,
        sourceStatus: "live",
        message: "Buku kas entry created successfully",
        data: rowToEntry(row, 0),
      },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      googleWorkspaceWriteBlockedSource(SHEET_NAME, error),
      { status: 500 }
    );
  }
}
