import { NextResponse } from "next/server";
import { googleWorkspaceDegradedSource, isGoogleWorkspaceAuthError } from "@/lib/api/google-workspace-error";
import { readRange } from "@/lib/sheets/sheets-real";

export const runtime = "nodejs";

const money = (value: unknown): number => {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  if (typeof value !== "string") return 0;
  const parsed = Number(value.replace(/[^\d.-]/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
};

// ── GET /api/buku-kas/saldo ──
// Returns current saldo (running balance) from Buku_Kas
export async function GET() {
  try {
    const rows = await readRange("Buku_Kas!A1:H1000");
    const dataRows = rows.slice(1).filter((row) => row.some(Boolean));

    let saldo = 0;
    let totalDebit = 0;
    let totalKredit = 0;

    for (const row of dataRows) {
      const debit = money(row[4]);
      const kredit = money(row[5]);
      saldo += debit - kredit;
      totalDebit += debit;
      totalKredit += kredit;
    }

    // Current month stats
    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
    let monthDebit = 0;
    let monthKredit = 0;
    for (const row of dataRows) {
      const tgl = row[0] || "";
      if (tgl.startsWith(currentMonth)) {
        monthDebit += money(row[4]);
        monthKredit += money(row[5]);
      }
    }

    return NextResponse.json({
      source: "Google Sheets: Buku_Kas",
      sourceStatus: "live",
      saldo,
      totalDebit,
      totalKredit,
      totalEntries: dataRows.length,
      currentMonth: {
        month: currentMonth,
        debit: monthDebit,
        kredit: monthKredit,
        net: monthDebit - monthKredit,
      },
    });
  } catch (error) {
    if (isGoogleWorkspaceAuthError(error)) {
      return NextResponse.json({
        ...googleWorkspaceDegradedSource("Google Sheets: Buku_Kas", error),
        saldo: 0,
        totalDebit: 0,
        totalKredit: 0,
        totalEntries: 0,
        currentMonth: { month: "", debit: 0, kredit: 0, net: 0 },
      });
    }
    return NextResponse.json(
      { error: "Gagal membaca saldo Buku Kas", details: String(error) },
      { status: 500 }
    );
  }
}
