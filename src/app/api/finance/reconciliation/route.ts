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

function sumCashRows(rows: string[][]) {
  return rows
    .slice(1)
    .filter((row) => row.some(Boolean) && (money(row[4]) > 0 || money(row[5]) > 0))
    .reduce(
      (acc, row) => {
        acc.totalDebit += money(row[4]);
        acc.totalKredit += money(row[5]);
        acc.totalRows += 1;
        return acc;
      },
      { totalDebit: 0, totalKredit: 0, totalRows: 0 }
    );
}

function sumBukuKasRows(rows: string[][]) {
  return rows
    .slice(1)
    .filter((row) => row.some(Boolean) && (money(row[4]) > 0 || money(row[5]) > 0))
    .reduce(
      (acc, row) => {
        acc.totalMasuk += money(row[4]);
        acc.totalKeluar += money(row[5]);
        acc.totalRows += 1;
        return acc;
      },
      { totalMasuk: 0, totalKeluar: 0, totalRows: 0 }
    );
}

function parseBankAccounts(rows: string[][]) {
  return rows
    .filter((row) => text(row[0]) && (money(row[3]) > 0 || money(row[4]) > 0))
    .map((row) => {
      const saldoAwal = money(row[3]);
      const saldoAkhir = money(row[4]);
      return {
        bank: text(row[0]),
        noRek: text(row[1]),
        nama: text(row[2]),
        saldoAwal,
        saldoAkhir,
        delta: saldoAkhir - saldoAwal,
      };
    });
}

export async function GET() {
  try {
    const [rekeningKoran, cashHarian, bukuKas] = await Promise.all([
      readSheet("RekeningKoran"),
      readRange("Cash_Harian!A1:I300"),
      readRange("Buku_Kas!A1:H300"),
    ]);

    const bankAccounts = parseBankAccounts(rekeningKoran);
    const bankDelta = bankAccounts.reduce((sum, account) => sum + account.delta, 0);
    const cash = sumCashRows(cashHarian);
    const buku = sumBukuKasRows(bukuKas);
    const cashNet = cash.totalDebit - cash.totalKredit;
    const bukuNet = buku.totalMasuk - buku.totalKeluar;
    const diffCashVsBank = cashNet - bankDelta;
    const diffCashVsBuku = cashNet - bukuNet;
    const tolerance = 1000;

    const issues = [
      Math.abs(diffCashVsBank) > tolerance ? "Selisih Cash_Harian vs perubahan saldo Rekening_Koran perlu dicek manual." : "Cash_Harian berada dalam toleransi terhadap perubahan saldo bank.",
      Math.abs(diffCashVsBuku) > tolerance ? "Selisih Cash_Harian vs Buku_Kas perlu rekonsiliasi." : "Cash_Harian dan Buku_Kas berada dalam toleransi.",
      cash.totalRows === 0 ? "Belum ada baris transaksi Cash_Harian yang terbaca untuk periode ini." : "",
    ].filter(Boolean);

    return NextResponse.json({
      source: "Google Sheets: Rekening_Koran + Cash_Harian + Buku_Kas",
      sourceStatus: "live",
      generatedAt: new Date().toISOString(),
      summary: {
        status: issues.some((issue) => issue.includes("Selisih") || issue.includes("Belum")) ? "needs_review" : "reconciled",
        tolerance,
        bankDelta,
        cashNet,
        bukuNet,
        diffCashVsBank,
        diffCashVsBuku,
        cashRows: cash.totalRows,
        bukuKasRows: buku.totalRows,
      },
      bankAccounts,
      issues,
      nextActions: [
        "Cocokkan selisih dengan PDF rekening koran terbaru sebelum menandai QA saldo kas = 0.",
        "Pastikan setiap mutasi bank punya referensi/proof URL di Cash_Harian.",
        "Jangan campur saldo bank dengan setoran modal saham; modal disetor tetap dibaca dari PemegangSaham.",
      ],
    });
  } catch (error) {
    if (isGoogleWorkspaceAuthError(error)) {
      return NextResponse.json({
        ...googleWorkspaceDegradedSource("Google Sheets finance reconciliation", error),
        summary: {
          status: "blocked",
          tolerance: 1000,
          bankDelta: 0,
          cashNet: 0,
          bukuNet: 0,
          diffCashVsBank: 0,
          diffCashVsBuku: 0,
          cashRows: 0,
          bukuKasRows: 0,
        },
        bankAccounts: [],
        issues: ["Google Workspace OAuth perlu re-auth sebelum rekonsiliasi live bisa dihitung."],
        nextActions: ["Refresh Google OAuth/env credentials, lalu jalankan ulang rekonsiliasi bank mingguan."],
      });
    }

    return NextResponse.json({ error: "Gagal menghitung rekonsiliasi finance", details: String(error) }, { status: 500 });
  }
}
