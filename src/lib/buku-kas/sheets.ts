// Buku Kas — Google Sheets helpers
// Buku_Kas sheet: A5:H100
// Cols: A=ID, B=Date, C=Type(D/K), D=Category, E=Amount, F=Description, G=Reference, H=Saldo
import { readRange, writeRange, appendRows } from "@/lib/sheets/sheets-real";

const SHEET_NAME = "Buku_Kas";
const HEADER_ROW = 5;
const DATA_START_ROW = 6;
const RANGE = `${SHEET_NAME}!A5:H100`;

export interface BukuKasEntry {
  id: string;
  date: string;        // YYYY-MM-DD
  type: "D" | "K";     // Debit / Kredit
  category: string;
  amount: number;
  description: string;
  reference: string;
  saldo: number;
  row: number;         // 1-indexed sheet row
}

export const CATEGORIES = ["Sales", "Purchase", "Operating", "Salary", "Transport"] as const;
export type BukuKasCategory = (typeof CATEGORIES)[number];

function s(row: string[], idx: number): string {
  return row[idx] || "";
}

function n(value: unknown): number {
  if (typeof value === "number") return value;
  if (!value) return 0;
  const cleaned = String(value).replace(/[^0-9.-]/g, "");
  return Number(cleaned) || 0;
}

export async function readBukuKasSheet(): Promise<string[][]> {
  return readRange(RANGE);
}

export function parseBukuKasRows(rows: string[][]): BukuKasEntry[] {
  // rows[0] is header row (row 5)
  // data starts from rows[1] (row 6)
  const dataRows = rows.slice(1);
  const entries: BukuKasEntry[] = [];

  for (let i = 0; i < dataRows.length; i++) {
    const row = dataRows[i];
    const id = s(row, 0);
    if (!id) continue;

    entries.push({
      id,
      date: s(row, 1),
      type: s(row, 2) === "K" ? "K" : "D",
      category: s(row, 3),
      amount: n(row[4]),
      description: s(row, 5),
      reference: s(row, 6),
      saldo: n(row[7]),
      row: HEADER_ROW + 1 + i, // actual sheet row number
    });
  }

  return entries;
}

export function calculateRunningBalance(entries: BukuKasEntry[]): BukuKasEntry[] {
  // Sort by date, then by original order
  const sorted = [...entries].sort((a, b) => {
    const dateCmp = a.date.localeCompare(b.date);
    if (dateCmp !== 0) return dateCmp;
    return a.row - b.row;
  });

  let balance = 0;
  for (const entry of sorted) {
    if (entry.type === "D") {
      balance += entry.amount;
    } else {
      balance -= entry.amount;
    }
    entry.saldo = balance;
  }

  return sorted;
}

export async function recalculateAndWriteSaldo(entries: BukuKasEntry[]): Promise<void> {
  const balanced = calculateRunningBalance(entries);
  // Write saldo column (H) for each entry
  for (const entry of balanced) {
    const rowNum = entry.row;
    await writeRange(`${SHEET_NAME}!H${rowNum}:H${rowNum}`, [[entry.saldo]]);
  }
}

export async function appendBukuKasRow(entry: Omit<BukuKasEntry, "row">): Promise<number> {
  const rows = await readBukuKasSheet();
  const dataRows = rows.slice(1).filter((r) => r[0]);
  const nextRow = DATA_START_ROW + dataRows.length;

  await appendRows(SHEET_NAME, [[
    entry.id,
    entry.date,
    entry.type,
    entry.category,
    entry.amount,
    entry.description,
    entry.reference,
    entry.saldo,
  ]]);

  return nextRow;
}

export async function updateBukuKasRow(row: number, entry: Omit<BukuKasEntry, "row">): Promise<void> {
  await writeRange(`${SHEET_NAME}!A${row}:H${row}`, [[
    entry.id,
    entry.date,
    entry.type,
    entry.category,
    entry.amount,
    entry.description,
    entry.reference,
    entry.saldo,
  ]]);
}

export function generateId(): string {
  return `BK-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
}
