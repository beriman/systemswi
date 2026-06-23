import { NextRequest, NextResponse } from "next/server";
import { googleWorkspaceDegradedSource, isGoogleWorkspaceAuthError } from "@/lib/api/google-workspace-error";
import { readRange } from "@/lib/sheets/sheets-real";

export const runtime = "nodejs";

const money = (value: unknown): number => {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  if (typeof value !== "string") return 0;
  const parsed = Number(value.replace(/[^\d.-]/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
};

// ── GET /api/buku-kas/rekap ──
// Returns period rekap: monthly/weekly summary, by category
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const period = url.searchParams.get("period") || "monthly"; // monthly | weekly | yearly
    const month = url.searchParams.get("month"); // YYYY-MM
    const year = url.searchParams.get("year"); // YYYY

    const rows = await readRange("Buku_Kas!A1:H1000");
    const dataRows = rows.slice(1).filter((row) => row.some(Boolean));

    // Filter by year/month if specified
    let filteredRows = dataRows;
    if (month) {
      filteredRows = filteredRows.filter((row) => (row[0] || "").startsWith(month));
    } else if (year) {
      filteredRows = filteredRows.filter((row) => (row[0] || "").startsWith(year));
    }

    // ── By Category ──
    const byCategory: Record<string, { debit: number; kredit: number; count: number }> = {};
    for (const row of filteredRows) {
      const kategori = row[2] || "Tanpa Kategori";
      if (!byCategory[kategori]) {
        byCategory[kategori] = { debit: 0, kredit: 0, count: 0 };
      }
      byCategory[kategori].debit += money(row[4]);
      byCategory[kategori].kredit += money(row[5]);
      byCategory[kategori].count += 1;
    }

    // ── By Month ──
    const byMonth: Record<string, { debit: number; kredit: number; count: number }> = {};
    for (const row of dataRows) {
      const tgl = row[0] || "";
      const ym = tgl.slice(0, 7); // YYYY-MM
      if (!ym) continue;
      if (!byMonth[ym]) {
        byMonth[ym] = { debit: 0, kredit: 0, count: 0 };
      }
      byMonth[ym].debit += money(row[4]);
      byMonth[ym].kredit += money(row[5]);
      byMonth[ym].count += 1;
    }

    // ── By Divisi ──
    const byDivisi: Record<string, { debit: number; kredit: number; count: number }> = {};
    for (const row of filteredRows) {
      const divisi = row[7] || "Tanpa Divisi";
      if (!byDivisi[divisi]) {
        byDivisi[divisi] = { debit: 0, kredit: 0, count: 0 };
      }
      byDivisi[divisi].debit += money(row[4]);
      byDivisi[divisi].kredit += money(row[5]);
      byDivisi[divisi].count += 1;
    }

    // Summary
    const totalDebit = filteredRows.reduce((s, r) => s + money(r[4]), 0);
    const totalKredit = filteredRows.reduce((s, r) => s + money(r[5]), 0);

    return NextResponse.json({
      source: "Google Sheets: Buku_Kas",
      sourceStatus: "live",
      period,
      filteredBy: { month, year },
      summary: {
        totalDebit,
        totalKredit,
        net: totalDebit - totalKredit,
        totalEntries: filteredRows.length,
      },
      byCategory,
      byMonth,
      byDivisi,
    });
  } catch (error) {
    if (isGoogleWorkspaceAuthError(error)) {
      return NextResponse.json({
        ...googleWorkspaceDegradedSource("Google Sheets: Buku_Kas", error),
        summary: { totalDebit: 0, totalKredit: 0, net: 0, totalEntries: 0 },
        byCategory: {},
        byMonth: {},
        byDivisi: {},
      });
    }
    return NextResponse.json(
      { error: "Gagal membaca rekap Buku Kas", details: String(error) },
      { status: 500 }
    );
  }
}
