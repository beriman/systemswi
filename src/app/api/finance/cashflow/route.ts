import { NextResponse } from "next/server";
import { googleWorkspaceDegradedSource, isGoogleWorkspaceAuthError } from "@/lib/api/google-workspace-error";
import { readRange, readSheet } from "@/lib/sheets/sheets-real";

export const runtime = "nodejs";

const money = (value: unknown) => {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  if (typeof value !== "string") return 0;
  const parsed = Number(value.replace(/[^\d.-]/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
};

const text = (value: unknown) => String(value ?? "").trim();

function parseDate(value: unknown): Date | null {
  const raw = text(value);
  if (!raw) return null;
  const iso = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return new Date(`${iso[1]}-${iso[2]}-${iso[3]}T00:00:00.000Z`);

  const slash = raw.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})$/);
  if (slash) {
    const year = slash[3].length === 2 ? `20${slash[3]}` : slash[3];
    return new Date(`${year}-${slash[2].padStart(2, "0")}-${slash[1].padStart(2, "0")}T00:00:00.000Z`);
  }

  const parsed = new Date(raw);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function monthKey(date: Date) {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

function monthLabel(key: string) {
  const [year, month] = key.split("-").map(Number);
  return new Intl.DateTimeFormat("id-ID", { month: "long", year: "numeric", timeZone: "UTC" }).format(
    new Date(Date.UTC(year, month - 1, 1))
  );
}

function nextMonthKeys(count: number) {
  const today = new Date();
  const keys: string[] = [];
  for (let index = 1; index <= count; index += 1) {
    const date = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() + index, 1));
    keys.push(monthKey(date));
  }
  return keys;
}

function parseTransactions(rows: string[][]) {
  return rows
    .slice(1)
    .map((row) => {
      const date = parseDate(row[0]);
      const debit = money(row[4]);
      const kredit = money(row[5]);
      return {
        date,
        debit,
        kredit,
        net: debit - kredit,
        divisi: text(row[7]) || "TBA",
        deskripsi: text(row[3]),
      };
    })
    .filter((tx) => tx.date && (tx.debit > 0 || tx.kredit > 0));
}

function parseBankBalance(rows: string[][]) {
  return rows
    .filter((row) => text(row[0]) && (money(row[3]) > 0 || money(row[4]) > 0))
    .reduce((sum, row) => sum + money(row[4]), 0);
}

export async function GET() {
  try {
    const [cashRows, bankRows] = await Promise.all([
      readRange("Cash_Harian!A1:I500"),
      readSheet("RekeningKoran"),
    ]);

    const transactions = parseTransactions(cashRows);
    const openingCash = parseBankBalance(bankRows);
    const buckets = new Map<string, { pemasukan: number; pengeluaran: number; net: number; transaksi: number }>();

    for (const tx of transactions) {
      if (!tx.date) continue;
      const key = monthKey(tx.date);
      const bucket = buckets.get(key) || { pemasukan: 0, pengeluaran: 0, net: 0, transaksi: 0 };
      bucket.pemasukan += tx.debit;
      bucket.pengeluaran += tx.kredit;
      bucket.net += tx.net;
      bucket.transaksi += 1;
      buckets.set(key, bucket);
    }

    const actualMonths = Array.from(buckets.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-6)
      .map(([key, value]) => ({ month: key, label: monthLabel(key), ...value }));

    const sampledMonths = actualMonths.filter((month) => month.transaksi > 0).slice(-3);
    const divisor = Math.max(sampledMonths.length, 1);
    const averageInflow = Math.round(sampledMonths.reduce((sum, month) => sum + month.pemasukan, 0) / divisor);
    const averageOutflow = Math.round(sampledMonths.reduce((sum, month) => sum + month.pengeluaran, 0) / divisor);
    const averageNet = averageInflow - averageOutflow;

    let runningBalance = openingCash;
    const projection = nextMonthKeys(3).map((key) => {
      runningBalance += averageNet;
      return {
        month: key,
        label: monthLabel(key),
        projectedInflow: averageInflow,
        projectedOutflow: averageOutflow,
        projectedNet: averageNet,
        projectedClosingCash: runningBalance,
        confidence: sampledMonths.length >= 3 ? "medium" : sampledMonths.length > 0 ? "low" : "blocked",
        note:
          sampledMonths.length >= 3
            ? "Proyeksi berbasis rata-rata 3 bulan transaksi Cash_Harian terakhir. Wajib review manual sebelum dipakai untuk keputusan kas."
            : "Data historis kurang dari 3 bulan; angka hanya draft konservatif dan perlu verifikasi operator.",
      };
    });

    const runwayMonths = averageOutflow > 0 ? Number((openingCash / averageOutflow).toFixed(1)) : null;
    const issues = [
      sampledMonths.length < 3 ? "Histori transaksi terbaca kurang dari 3 bulan; proyeksi perlu validasi manual." : "",
      averageNet < 0 ? "Rata-rata cashflow bulanan negatif; perlu cek pengeluaran/pendapatan prioritas." : "",
      openingCash <= 0 ? "Saldo bank awal tidak terbaca dari Rekening_Koran; jangan gunakan angka runway sebagai final." : "",
    ].filter(Boolean);

    return NextResponse.json({
      source: "Google Sheets: Cash_Harian + Rekening_Koran",
      sourceStatus: "live",
      generatedAt: new Date().toISOString(),
      summary: {
        openingCash,
        averageMonthlyInflow: averageInflow,
        averageMonthlyOutflow: averageOutflow,
        averageMonthlyNet: averageNet,
        projectedClosingCash3Months: projection.at(-1)?.projectedClosingCash || openingCash,
        runwayMonths,
        historicalMonths: sampledMonths.length,
      },
      actualMonths,
      projection,
      issues,
      nextActions: [
        "Review proyeksi dengan mutasi bank/PDF terbaru sebelum QA cashflow final.",
        "Pisahkan saldo bank operasional dari setoran modal saham saat mengambil keputusan kas.",
        "Update transaksi Cash_Harian dengan referensi/proof URL agar proyeksi bulan berikutnya makin akurat.",
      ],
    });
  } catch (error) {
    if (isGoogleWorkspaceAuthError(error)) {
      return NextResponse.json({
        ...googleWorkspaceDegradedSource("Google Sheets finance cashflow projection", error),
        summary: {
          openingCash: 0,
          averageMonthlyInflow: 0,
          averageMonthlyOutflow: 0,
          averageMonthlyNet: 0,
          projectedClosingCash3Months: 0,
          runwayMonths: null,
          historicalMonths: 0,
        },
        actualMonths: [],
        projection: [],
        issues: ["Google Workspace OAuth perlu re-auth sebelum proyeksi cashflow live bisa dihitung."],
        nextActions: ["Refresh Google OAuth/env credentials, lalu generate ulang proyeksi cashflow 3 bulan."],
      });
    }

    return NextResponse.json({ error: "Gagal menghitung proyeksi cashflow", details: String(error) }, { status: 500 });
  }
}
