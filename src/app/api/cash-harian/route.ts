// GET /api/cash-harian — List cash entries (filter: date, type, category, startDate, endDate)
// POST /api/cash-harian — Create new entry
import { NextRequest, NextResponse } from "next/server";
import { readSheet, appendRows } from "@/lib/sheets/sheets-real";
import { googleWorkspaceWriteBlockedSource } from "@/lib/api/google-workspace-error";

export const runtime = "nodejs";

const SHEET_NAME = "CashHarian";

// Column order:
// A: EntryId, B: Date, C: Type (Masuk/Keluar), D: Category, E: Description
// F: Amount, G: Saldo, H: InputBy, I: InputDate
const HEADERS = [
  "EntryId", "Date", "Type", "Category", "Description",
  "Amount", "Saldo", "InputBy", "InputDate",
];

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

async function ensureHeader() {
  const raw = await readSheet(SHEET_NAME);
  if (raw.length === 0 || raw[0][0] !== "EntryId") {
    await appendRows(SHEET_NAME, [HEADERS]);
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date") || "";
    const type = searchParams.get("type") || "";
    const category = searchParams.get("category") || "";
    const startDate = searchParams.get("startDate") || "";
    const endDate = searchParams.get("endDate") || "";

    const raw = await readSheet(SHEET_NAME);
    const hasHeader = raw.length > 0 && raw[0][0] === "EntryId";
    const dataRows = hasHeader ? raw.slice(1) : raw;

    let results = dataRows
      .filter((row) => row && row[0])
      .map((row, i) => rowToEntry(row, i + (hasHeader ? 2 : 1)));

    if (date) {
      results = results.filter((r) => r.date === date);
    }
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

    // Sort by date ascending
    results.sort((a, b) => a.date.localeCompare(b.date));

    const totalMasuk = results
      .filter((r) => r.type === "Masuk")
      .reduce((s, r) => s + r.amount, 0);
    const totalKeluar = results
      .filter((r) => r.type === "Keluar")
      .reduce((s, r) => s + r.amount, 0);
    const saldoAkhir = results.length > 0 ? results[results.length - 1].saldo : 0;

    return NextResponse.json({
      source: `Google Sheets: ${SHEET_NAME}`,
      sourceStatus: "live",
      generatedAt: new Date().toISOString(),
      summary: { totalMasuk, totalKeluar, saldoAkhir, count: results.length },
      count: results.length,
      data: results,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch cash harian", details: String(error) },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { date, type, category, description, amount, inputBy } = body;

    if (!date || !type || !amount) {
      return NextResponse.json(
        { error: "Missing required fields: date, type, amount are required" },
        { status: 400 }
      );
    }

    if (!["Masuk", "Keluar"].includes(type)) {
      return NextResponse.json(
        { error: "Type must be 'Masuk' or 'Keluar'" },
        { status: 400 }
      );
    }

    const amt = Number(amount);
    if (amt <= 0) {
      return NextResponse.json(
        { error: "Amount must be positive" },
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
    const newSaldo = type === "Masuk" ? lastSaldo + amt : lastSaldo - amt;

    const entryId = `CH-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
    const now = new Date().toISOString().slice(0, 19).replace("T", " ");
    const row: (string | number)[] = [
      entryId, date, type, category || "Lain-lain", description || "",
      amt, newSaldo, inputBy || "system", now,
    ];

    await appendRows(SHEET_NAME, [row]);

    return NextResponse.json(
      {
        source: `Google Sheets: ${SHEET_NAME}`,
        sourceStatus: "live",
        message: "Cash entry created successfully",
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
