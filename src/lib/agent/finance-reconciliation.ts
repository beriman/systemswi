// Finance Reconciliation — Phase 2.3
// Daily: Compare Cash_Harian vs Rekening_Koran → Flag discrepancies → Suggest corrections
//
// Compliance: Agent flags discrepancies only — human must approve corrections.
// This module is READ-ANALYZE-SUGGEST (no direct sheet writes).

import { readRange } from "@/lib/sheets/sheets-real";

// ── Types ──────────────────────────────────────────────────────────

export interface CashHarianEntry {
  date: string;
  description: string;
  debit: number;
  credit: number;
  balance: number;
  source: string;
}

export interface RekeningMutasiEntry {
  date: string;
  description: string;
  debit: number;
  credit: number;
  balance: number;
  reference: string;
}

export interface Discrepancy {
  date: string;
  type: "missing_in_cash" | "missing_in_rekening" | "amount_mismatch" | "duplicate";
  description: string;
  cashAmount?: number;
  rekeningAmount?: number;
  difference: number;
  suggestion: string;
  severity: "high" | "medium" | "low";
}

export interface ReconciliationReport {
  timestamp: string;
  cashEntries: CashHarianEntry[];
  rekeningEntries: RekeningMutasiEntry[];
  discrepancies: Discrepancy[];
  cashTotalDebit: number;
  cashTotalCredit: number;
  rekeningTotalDebit: number;
  rekeningTotalCredit: number;
  netDifference: number;
  status: "matched" | "minor_discrepancies" | "major_discrepancies";
}

// ── Helpers ────────────────────────────────────────────────────────

const text = (v: unknown) => String(v ?? "").trim();
const num = (v: unknown) => {
  if (typeof v === "number") return Number.isFinite(v) ? v : 0;
  if (typeof v !== "string") return 0;
  const p = Number(v.replace(/[^\d.-]/g, ""));
  return Number.isFinite(p) ? p : 0;
};

// ── Read Cash Harian ───────────────────────────────────────────────

async function readCashHarian(): Promise<CashHarianEntry[]> {
  const rows = await readRange("Cash_Harian!A5:I100");
  const entries: CashHarianEntry[] = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    if (!row.some((c) => c && c.trim())) continue;

    const date = text(row[0]);
    const desc = text(row[1]);
    if (!date && !desc) continue;

    entries.push({
      date,
      description: desc,
      debit: num(row[2]),
      credit: num(row[3]),
      balance: num(row[4]),
      source: text(row[5]) || "bank",
    });
  }

  return entries;
}

// ── Read Rekening Mutasi ───────────────────────────────────────────

async function readRekeningMutasi(): Promise<RekeningMutasiEntry[]> {
  const rows = await readRange("Rekening_Koran!A10:L28");
  const entries: RekeningMutasiEntry[] = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    if (!row.some((c) => c && c.trim())) continue;

    const date = text(row[0]);
    const desc = text(row[1]);
    if (!date && !desc) continue;

    entries.push({
      date,
      description: desc,
      debit: num(row[2]),
      credit: num(row[3]),
      balance: num(row[4]),
      reference: text(row[5]) || "",
    });
  }

  return entries;
}

// ── Reconcile ──────────────────────────────────────────────────────

export async function runReconciliation(): Promise<ReconciliationReport> {
  const [cashEntries, rekeningEntries] = await Promise.all([
    readCashHarian(),
    readRekeningMutasi(),
  ]);

  const discrepancies: Discrepancy[] = [];
  const rekeningByDate = new Map<string, RekeningMutasiEntry[]>();
  const cashByDate = new Map<string, CashHarianEntry[]>();

  // Index by date
  for (const entry of rekeningEntries) {
    const list = rekeningByDate.get(entry.date) || [];
    list.push(entry);
    rekeningByDate.set(entry.date, list);
  }
  for (const entry of cashEntries) {
    const list = cashByDate.get(entry.date) || [];
    list.push(entry);
    cashByDate.set(entry.date, list);
  }

  // Check for entries in rekening but missing from cash
  for (const [date, rekeningList] of Array.from(rekeningByDate.entries())) {
    const cashList = cashByDate.get(date) || [];
    for (const rekening of rekeningList) {
      const matchingCash = cashList.find(
        (c) =>
          Math.abs(c.debit - rekening.debit) < 1000 &&
          Math.abs(c.credit - rekening.credit) < 1000
      );
      if (!matchingCash) {
        discrepancies.push({
          date,
          type: "missing_in_cash",
          description: rekening.description,
          rekeningAmount: rekening.debit || rekening.credit,
          difference: rekening.debit || rekening.credit,
          suggestion: `Tambahkan entri di Cash_Harian: ${rekening.description} — Rp ${(rekening.debit || rekening.credit).toLocaleString("id-ID")}`,
          severity: (rekening.debit || rekening.credit) > 10_000_000 ? "high" : "medium",
        });
      }
    }
  }

  // Check for entries in cash but missing from rekening
  for (const [date, cashList] of Array.from(cashByDate.entries())) {
    const rekeningList = rekeningByDate.get(date) || [];
    for (const cash of cashList) {
      const matchingRekening = rekeningList.find(
        (r) =>
          Math.abs(r.debit - cash.debit) < 1000 &&
          Math.abs(r.credit - cash.credit) < 1000
      );
      if (!matchingRekening) {
        discrepancies.push({
          date,
          type: "missing_in_rekening",
          description: cash.description,
          cashAmount: cash.debit || cash.credit,
          difference: cash.debit || cash.credit,
          suggestion: `Cek mutasi bank: ${cash.description} — Rp ${(cash.debit || cash.credit).toLocaleString("id-ID")} belum muncul di rekening koran`,
          severity: (cash.debit || cash.credit) > 10_000_000 ? "high" : "low",
        });
      }
    }
  }

  // Check for amount mismatches (same description, different amounts)
  for (const cash of cashEntries) {
    const matchingRekening = rekeningEntries.find(
      (r) =>
        r.description.toLowerCase().includes(cash.description.toLowerCase().slice(0, 10)) &&
        r.date === cash.date &&
        (Math.abs(r.debit - cash.debit) > 1000 || Math.abs(r.credit - cash.credit) > 1000)
    );
    if (matchingRekening) {
      const diff = Math.abs(
        (matchingRekening.debit || matchingRekening.credit) - (cash.debit || cash.credit)
      );
      discrepancies.push({
        date: cash.date,
        type: "amount_mismatch",
        description: cash.description,
        cashAmount: cash.debit || cash.credit,
        rekeningAmount: matchingRekening.debit || matchingRekening.credit,
        difference: diff,
        suggestion: `Cek ulang jumlah: "${cash.description}" — Cash: Rp ${(cash.debit || cash.credit).toLocaleString("id-ID")}, Rekening: Rp ${(matchingRekening.debit || matchingRekening.credit).toLocaleString("id-ID")}`,
        severity: diff > 5_000_000 ? "high" : "medium",
      });
    }
  }

  const cashTotalDebit = cashEntries.reduce((s, e) => s + e.debit, 0);
  const cashTotalCredit = cashEntries.reduce((s, e) => s + e.credit, 0);
  const rekeningTotalDebit = rekeningEntries.reduce((s, e) => s + e.debit, 0);
  const rekeningTotalCredit = rekeningEntries.reduce((s, e) => s + e.credit, 0);
  const netDifference = Math.abs(
    cashTotalDebit - cashTotalCredit - (rekeningTotalDebit - rekeningTotalCredit)
  );

  const highSeverity = discrepancies.filter((d) => d.severity === "high").length;
  const status =
    discrepancies.length === 0
      ? "matched"
      : highSeverity > 0
        ? "major_discrepancies"
        : "minor_discrepancies";

  return {
    timestamp: new Date().toISOString(),
    cashEntries,
    rekeningEntries,
    discrepancies,
    cashTotalDebit,
    cashTotalCredit,
    rekeningTotalDebit,
    rekeningTotalCredit,
    netDifference,
    status,
  };
}

// ── Format for Telegram ────────────────────────────────────────────

export function formatReconciliationForTelegram(report: ReconciliationReport): string {
  const statusEmoji = {
    matched: "✅",
    minor_discrepancies: "🟡",
    major_discrepancies: "🔴",
  }[report.status];

  let text = `${statusEmoji} <b>REKONSILIASI KEUANGAN</b>\n📅 ${new Date(report.timestamp).toLocaleString("id-ID")}\n\n`;

  text += `📊 <b>Summary:</b>\n`;
  text += `   Cash Harian: Debit Rp ${report.cashTotalDebit.toLocaleString("id-ID")} | Kredit Rp ${report.cashTotalCredit.toLocaleString("id-ID")}\n`;
  text += `   Rekening: Debit Rp ${report.rekeningTotalDebit.toLocaleString("id-ID")} | Kredit Rp ${report.rekeningTotalCredit.toLocaleString("id-ID")}\n`;
  text += `   Selisih: Rp ${report.netDifference.toLocaleString("id-ID")}\n\n`;

  if (report.discrepancies.length === 0) {
    text += `✅ Semua cocok! Tidak ada selisih.\n`;
  } else {
    text += `⚠️ <b>${report.discrepancies.length} selisih ditemukan:</b>\n\n`;
    for (const d of report.discrepancies.slice(0, 8)) {
      const emoji = d.severity === "high" ? "🔴" : d.severity === "medium" ? "🟠" : "🟡";
      text += `${emoji} <b>${d.type.replace(/_/g, " ").toUpperCase()}</b>\n`;
      text += `   📅 ${d.date} — ${d.description}\n`;
      text += `   💰 Selisih: Rp ${d.difference.toLocaleString("id-ID")}\n`;
      text += `   💡 ${d.suggestion}\n\n`;
    }
    if (report.discrepancies.length > 8) {
      text += `...dan ${report.discrepancies.length - 8} selisih lainnya\n`;
    }
  }

  text += `\n⚠️ <i>Agent hanya flag — manusia harus approve koreksi</i>`;
  return text;
}
