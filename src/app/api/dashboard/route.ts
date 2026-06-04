// GET /api/dashboard — Aggregate data from multiple sources
import { NextResponse } from "next/server";
import { readSheet } from "@/lib/sheets/sheets-real";

export async function GET() {
  try {
    let investors = 3; // Default from seed data
    let sukuk = 1;
    let pemasukan = 0;
    let pengeluaran = 0;

    // Try SQLite first (local dev)
    try {
      const { getDb } = await import("@/lib/db");
      const db = getDb();
      const inv = db.prepare("SELECT COUNT(*) as count FROM investors WHERE status = 'aktif'").get();
      const sk = db.prepare("SELECT COUNT(*) as count FROM sukuk WHERE status = 'aktif'").get();
      const tx = db.prepare(`
        SELECT
          COALESCE(SUM(CASE WHEN jenis = 'pemasukan' THEN jumlah ELSE 0 END), 0) as pemasukan,
          COALESCE(SUM(CASE WHEN jenis = 'pengeluaran' THEN jumlah ELSE 0 END), 0) as pengeluaran
        FROM transactions
      `).get();
      investors = (inv as any)?.count || 0;
      sukuk = (sk as any)?.count || 0;
      pemasukan = (tx as any)?.pemasukan || 0;
      pengeluaran = (tx as any)?.pengeluaran || 0;
    } catch {
      // SQLite not available (Vercel), use Sheets data
    }

    // From Google Sheets (bank data)
    let bankData = null;
    try {
      const rekapData = await readSheet("RekapRekening");
      if (rekapData && rekapData.length > 1) {
        bankData = {
          headers: rekapData[0],
          lastRow: rekapData[rekapData.length - 1],
          totalMonths: rekapData.length - 1,
        };
      }
    } catch {
      // Sheets not available
    }

    return NextResponse.json({
      investors,
      sukuk,
      pemasukan,
      pengeluaran,
      netCashflow: pemasukan - pengeluaran,
      bankData,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch dashboard data", details: String(error) },
      { status: 500 }
    );
  }
}
