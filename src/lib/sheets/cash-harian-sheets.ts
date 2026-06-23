// Cash Harian — Google Sheets data layer
// Uses Cash_Harian sheet (A5:I100)
//
// Expected columns (A–I, header row 4):
//   A: Entry ID
//   B: Date (YYYY-MM-DD)
//   C: Type (Masuk / Keluar)
//   D: Category
//   E: Description
//   F: Amount
//   G: Saldo (running balance — auto-calculated on write)
//   H: Input By
//   I: Input Date

import { readRange, writeRange, appendRows } from "./sheets-real";

// ── Types ──────────────────────────────────────────────────────────

export interface CashHarianEntry {
  entryId: string;
  date: string;        // YYYY-MM-DD
  type: "Masuk" | "Keluar";
  category: string;
  description: string;
  amount: number;
  saldo: number;
  inputBy: string;
  inputDate: string;
  rowNumber?: number;  // actual sheet row (1-based, for updates)
}

export interface TodayPosition {
  date: string;
  saldoAwal: number;
  totalMasuk: number;
  totalKeluar: number;
  saldoAkhir: number;
  entries: CashHarianEntry[];
  vsForecast: number | null;   // difference from forecast
}

export interface PeriodSummary {
  startDate: string;
  endDate: string;
  openingBalance: number;
  totalMasuk: number;
  totalKeluar: number;
  closingBalance: number;
  entriesByDate: Record<string, {
    masuk: number;
    keluar: number;
    saldo: number;
    entries: CashHarianEntry[];
  }>;
}

// ── Helpers ─────────────────────────────────────────────────────────

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

function n(value: unknown): number {
  if (typeof value === "number") return value;
  if (!value) return 0;
  return Number(String(value).replace(/[^0-9.-]/g, "")) || 0;
}

const CASH_HEADERS = [
  "Entry ID", "Date", "Type", "Category", "Description",
  "Amount", "Saldo", "Input By", "Input Date"
];

// ── Ensure sheet has headers ────────────────────────────────────────

export async function ensureCashHarianInitialized(): Promise<void> {
  try {
    const rows = await readRange("Cash_Harian!A4:I4");
    if (!rows || rows.length === 0 || !rows[0]?.[0]) {
      await writeRange("Cash_Harian!A4:I4", [CASH_HEADERS]);
    }
  } catch {
    await writeRange("Cash_Harian!A4:I4", [CASH_HEADERS]);
  }
}

// ── Read all entries ────────────────────────────────────────────────

export async function readAllEntries(): Promise<CashHarianEntry[]> {
  try {
    const rows = await readRange("Cash_Harian!A5:I1000");
    if (!rows || rows.length === 0) return [];

    return rows
      .filter((r) => r.some(Boolean))
      .map((row, idx) => ({
        entryId: row[0] || `CH-${Date.now()}-${idx}`,
        date: row[1] || "",
        type: (row[2] === "Keluar" ? "Keluar" : "Masuk") as "Masuk" | "Keluar",
        category: row[3] || "",
        description: row[4] || "",
        amount: n(row[5]),
        saldo: n(row[6]),
        inputBy: row[7] || "",
        inputDate: row[8] || "",
        rowNumber: idx + 5, // row 5 is first data row
      }))
      .sort((a, b) => (a.date || "").localeCompare(b.date || ""));
  } catch {
    return [];
  }
}

// ── Get entries by date range ───────────────────────────────────────

export async function getEntriesByDateRange(
  startDate: string, endDate: string
): Promise<CashHarianEntry[]> {
  const all = await readAllEntries();
  return all.filter((e) => {
    if (startDate && e.date < startDate) return false;
    if (endDate && e.date > endDate) return false;
    return true;
  });
}

// ── Get today's position ────────────────────────────────────────────

export async function getTodayPosition(): Promise<TodayPosition> {
  const today = todayStr();
  const all = await readAllEntries();

  const todayEntries = all.filter((e) => e.date === today);
  const totalMasuk = todayEntries
    .filter((e) => e.type === "Masuk")
    .reduce((s, e) => s + e.amount, 0);
  const totalKeluar = todayEntries
    .filter((e) => e.type === "Keluar")
    .reduce((s, e) => s + e.amount, 0);

  // Saldo akhir = last entry's saldo before today + today's net
  // Or use the last known saldo before today
  const entriesBefore = all.filter((e) => e.date < today);
  const lastSaldoBefore = entriesBefore.length > 0
    ? entriesBefore[entriesBefore.length - 1].saldo
    : 0;

  // If entries already have saldo computed, use the last today entry's saldo
  const lastTodaySaldo = todayEntries.length > 0
    ? todayEntries[todayEntries.length - 1].saldo
    : null;

  const saldoAwal = lastSaldoBefore;
  const saldoAkhir = lastTodaySaldo !== null
    ? lastTodaySaldo
    : saldoAwal + totalMasuk - totalKeluar;

  return {
    date: today,
    saldoAwal,
    totalMasuk,
    totalKeluar,
    saldoAkhir,
    entries: todayEntries,
    vsForecast: null,
  };
}

// ── Get period summary ──────────────────────────────────────────────

export async function getPeriodSummary(
  startDate: string, endDate: string
): Promise<PeriodSummary> {
  const all = await readAllEntries();
  const filtered = all.filter((e) => {
    if (startDate && e.date < startDate) return false;
    if (endDate && e.date > endDate) return false;
    return true;
  });

  const entriesBefore = all.filter((e) => e.date < startDate);
  const openingBalance = entriesBefore.length > 0
    ? entriesBefore[entriesBefore.length - 1].saldo
    : 0;

  let runningBalance = openingBalance;
  const entriesByDate: PeriodSummary["entriesByDate"] = {};
  let totalMasuk = 0;
  let totalKeluar = 0;

  for (const entry of filtered) {
    if (entry.type === "Masuk") {
      runningBalance += entry.amount;
      totalMasuk += entry.amount;
    } else {
      runningBalance -= entry.amount;
      totalKeluar += entry.amount;
    }

    if (!entriesByDate[entry.date]) {
      entriesByDate[entry.date] = { masuk: 0, keluar: 0, saldo: 0, entries: [] };
    }
    const d = entriesByDate[entry.date];
    if (entry.type === "Masuk") {
      d.masuk += entry.amount;
    } else {
      d.keluar += entry.amount;
    }
    d.entries.push(entry);
    d.saldo = runningBalance;
    // Update the entry's saldo to running balance
    entry.saldo = runningBalance;
  }

  return {
    startDate,
    endDate,
    openingBalance,
    totalMasuk,
    totalKeluar,
    closingBalance: openingBalance + totalMasuk - totalKeluar,
    entriesByDate,
  };
}

// ── Create entry ────────────────────────────────────────────────────

export async function createEntry(data: {
  date: string;
  type: "Masuk" | "Keluar";
  category: string;
  description: string;
  amount: number;
  inputBy?: string;
}): Promise<CashHarianEntry> {
  await ensureCashHarianInitialized();

  const all = await readAllEntries();
  const entryId = `CH-${Date.now()}`;
  const inputDate = todayStr();

  // Find the last saldo before or on this date
  const entriesUpTo = all.filter(
    (e) => e.date <= data.date
  );
  const lastSaldo = entriesUpTo.length > 0
    ? entriesUpTo[entriesUpTo.length - 1].saldo
    : 0;

  const newSaldo = data.type === "Masuk"
    ? lastSaldo + data.amount
    : lastSaldo - data.amount;

  // Append the new row
  // Note: We write saldo as computed locally. A full recalc would recompute
  // all subsequent rows, but for now we use the Append-then-recalc approach.
  await appendRows("CashHarian", [[
    entryId,
    data.date,
    data.type,
    data.category,
    data.description,
    data.amount,
    newSaldo,
    data.inputBy || "",
    inputDate,
  ]]);

  // Recalculate all saldo values for entries on/after this date
  await recalculateSaldo(data.date);

  const result: CashHarianEntry = {
    entryId,
    date: data.date,
    type: data.type,
    category: data.category,
    description: data.description,
    amount: data.amount,
    saldo: newSaldo,
    inputBy: data.inputBy || "",
    inputDate,
  };

  return result;
}

// ── Update entry ────────────────────────────────────────────────────

export async function updateEntry(
  entryId: string,
  data: Partial<{
    date: string;
    type: "Masuk" | "Keluar";
    category: string;
    description: string;
    amount: number;
    inputBy: string;
  }>
): Promise<CashHarianEntry | null> {
  const all = await readAllEntries();
  const idx = all.findIndex((e) => e.entryId === entryId);
  if (idx < 0) return null;

  const entry = all[idx];
  const updated = {
    ...entry,
    ...data,
    amount: data.amount !== undefined ? data.amount : entry.amount,
    type: data.type || entry.type,
    date: data.date || entry.date,
    category: data.category !== undefined ? data.category : entry.category,
    description: data.description !== undefined ? data.description : entry.description,
    inputBy: data.inputBy !== undefined ? data.inputBy : entry.inputBy,
  };

  // Write the updated row
  const rowNumber = entry.rowNumber || idx + 5;
  await writeRange(`Cash_Harian!A${rowNumber}:I${rowNumber}`, [[
    updated.entryId,
    updated.date,
    updated.type,
    updated.category,
    updated.description,
    updated.amount,
    updated.saldo,
    updated.inputBy,
    updated.inputDate,
  ]]);

  // Recalculate saldo from the earlier of old/new date
  const recalculateFrom = entry.date < updated.date ? entry.date : updated.date;
  await recalculateSaldo(recalculateFrom);

  // Return updated entry with recalculated saldo
  const refreshed = await readAllEntries();
  return refreshed.find((e) => e.entryId === entryId) || null;
}

// ── Recalculate running saldo from a given date ─────────────────────

async function recalculateSaldo(fromDate: string): Promise<void> {
  const all = await readAllEntries();
  if (all.length === 0) return;

  // Get the last saldo before fromDate
  const entriesBefore = all.filter((e) => e.date < fromDate);
  let runningBalance = entriesBefore.length > 0
    ? entriesBefore[entriesBefore.length - 1].saldo
    : 0;

  // Recompute saldo for all entries on/after fromDate, in date order
  const entriesFrom = all
    .filter((e) => e.date >= fromDate)
    .sort((a, b) => a.date.localeCompare(b.date));

  for (const entry of entriesFrom) {
    if (entry.type === "Masuk") {
      runningBalance += entry.amount;
    } else {
      runningBalance -= entry.amount;
    }
    entry.saldo = runningBalance;
  }

  // Write back all changed rows
  // Build the full data array and write in batch
  const dataRows: (string | number)[][] = [];
  const allSorted = all.sort((a, b) => a.date.localeCompare(b.date));
  for (let i = 0; i < allSorted.length; i++) {
    const e = allSorted[i];
    dataRows.push([
      e.entryId,
      e.date,
      e.type,
      e.category,
      e.description,
      e.amount,
      e.saldo,
      e.inputBy,
      e.inputDate,
    ]);
  }

  if (dataRows.length > 0) {
    const endRow = 5 + dataRows.length - 1;
    await writeRange(`Cash_Harian!A5:I${endRow}`, dataRows);
  }
}
