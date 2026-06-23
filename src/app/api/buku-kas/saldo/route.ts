// GET /api/buku-kas/saldo — Current saldo
import { NextRequest, NextResponse } from "next/server";
import {
  readBukuKasSheet,
  parseBukuKasRows,
  calculateRunningBalance,
} from "@/lib/buku-kas/sheets";
import { googleWorkspaceDegradedSource, isGoogleWorkspaceAuthError } from "@/lib/api/google-workspace-error";

const SOURCE = "Google Sheets: Buku_Kas";

export async function GET(req: NextRequest) {
  try {
    const rows = await readBukuKasSheet();
    const entries = parseBukuKasRows(rows);
    const balanced = calculateRunningBalance(entries);

    const saldo = balanced.length > 0 ? balanced[balanced.length - 1].saldo : 0;

    // Current month totals
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const monthEntries = balanced.filter((e) => e.date.startsWith(currentMonth));
    const totalDebit = monthEntries.filter((e) => e.type === "D").reduce((s, e) => s + e.amount, 0);
    const totalKredit = monthEntries.filter((e) => e.type === "K").reduce((s, e) => s + e.amount, 0);

    return NextResponse.json({
      source: SOURCE,
      sourceStatus: "live",
      saldo,
      currentMonth,
      totalDebit,
      totalKredit,
      entryCount: balanced.length,
    });
  } catch (error) {
    if (isGoogleWorkspaceAuthError(error)) {
      return NextResponse.json({
        ...googleWorkspaceDegradedSource(SOURCE, error),
        saldo: 0,
        currentMonth: "",
        totalDebit: 0,
        totalKredit: 0,
        entryCount: 0,
      });
    }
    return NextResponse.json({ error: "Failed to fetch saldo", details: String(error) }, { status: 500 });
  }
}
