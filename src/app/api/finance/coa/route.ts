// GET /api/finance/coa — Chart of Accounts options from Google Sheets COA
import { NextResponse } from "next/server";
import { googleWorkspaceDegradedSource, isGoogleWorkspaceAuthError } from "@/lib/api/google-workspace-error";
import { readSheet } from "@/lib/sheets/sheets-real";

export const runtime = "nodejs";

const SOURCE = "Google Sheets: COA";

function text(value: unknown): string {
  return String(value ?? "").trim();
}

function parseCoaRows(rows: string[][]) {
  return rows
    .filter((row) => row.some((cell) => text(cell)))
    .map((row) => {
      const code = text(row[0]);
      const name = text(row[1]);
      const category = text(row[2]);
      const normalBalance = text(row[3]);
      const notes = text(row[4]);
      const label = [code, name].filter(Boolean).join(" — ") || category || "Belum dicatat";
      return { code, name, category, normalBalance, notes, label };
    })
    .filter((entry) => entry.code || entry.name || entry.category);
}

export async function GET() {
  try {
    const rows = await readSheet("COA");
    const header = rows[0] || [];
    const entries = parseCoaRows(rows.slice(1));
    return NextResponse.json({
      source: SOURCE,
      sourceStatus: "live",
      header,
      entries,
      summary: {
        total: entries.length,
        categories: Array.from(new Set(entries.map((entry) => entry.category).filter(Boolean))).sort(),
      },
      policy: {
        expenseApproval: "Expense tidak boleh di-approve tanpa COA Category yang terlacak dari sheet COA atau ditulis eksplisit jika COA belum tersedia.",
        noFabrication: "Jika COA kosong/tidak tersedia, tampilkan TBA/Belum dicatat dan jangan membuat kode akun fiktif.",
      },
    });
  } catch (error) {
    if (isGoogleWorkspaceAuthError(error)) {
      return NextResponse.json({
        ...googleWorkspaceDegradedSource(SOURCE, error),
        header: [],
        entries: [],
        summary: { total: 0, categories: [] },
      });
    }
    return NextResponse.json({ error: "Failed to fetch COA", details: String(error) }, { status: 500 });
  }
}
