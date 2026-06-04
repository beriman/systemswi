// Google Sheets client-safe exports
// This file is safe to import in client components (no googleapis dependency)

export type { SpreadsheetInfo, SheetInfo, SheetData, SheetRow, SheetName } from "./types";
export { SHEET_LIMITS, calculateUsage, isNearingLimit, SHEET_NAMES } from "./types";

import type { SpreadsheetInfo, SheetData } from "./types";

const SPREADSHEET_ID = process.env.GOOGLE_SHEETS_ID || "";

export function getSpreadsheets(): SpreadsheetInfo[] {
  return [
    {
      id: "main",
      name: "📊 Master Data SWI",
      url: `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}`,
      lastModified: new Date().toISOString(),
      sheets: [
        { id: "sheet-0", name: "Dashboard", description: "Ringkasan keuangan", lastModified: new Date().toISOString(), rowCount: 0, columnCount: 0, spreadsheetId: SPREADSHEET_ID },
        { id: "sheet-1", name: "RekapRekening", description: "Rekap rekening 8 bulan", lastModified: new Date().toISOString(), rowCount: 0, columnCount: 0, spreadsheetId: SPREADSHEET_ID },
        { id: "sheet-2", name: "CashHarian", description: "Cash harian", lastModified: new Date().toISOString(), rowCount: 0, columnCount: 0, spreadsheetId: SPREADSHEET_ID },
        { id: "sheet-3", name: "PemegangSaham", description: "Data pemegang saham", lastModified: new Date().toISOString(), rowCount: 0, columnCount: 0, spreadsheetId: SPREADSHEET_ID },
        { id: "sheet-4", name: "SukukStore", description: "Data sukuk", lastModified: new Date().toISOString(), rowCount: 0, columnCount: 0, spreadsheetId: SPREADSHEET_ID },
        { id: "sheet-5", name: "COA", description: "Chart of accounts", lastModified: new Date().toISOString(), rowCount: 0, columnCount: 0, spreadsheetId: SPREADSHEET_ID },
      ],
    },
  ];
}

export async function fetchSpreadsheets(): Promise<SpreadsheetInfo[]> {
  return getSpreadsheets();
}

export async function fetchSheetData(sheetId: string): Promise<SheetData | null> {
  const sheets = getSpreadsheets();
  const spreadsheet = sheets[0];
  const sheetIdx = parseInt(sheetId.replace("sheet-", ""), 10);
  const sheet = spreadsheet.sheets[sheetIdx];
  if (!sheet) return null;

  // Fetch from API route (server-side)
  try {
    const res = await fetch(`/api/sheets/${encodeURIComponent(sheet.name)}`);
    if (!res.ok) return null;
    const json = await res.json();
    const data: string[][] = json.data;
    if (!data || data.length === 0) return null;

    const headers = data[0];
    const rows = data.slice(1).map((row, i) => ({
      rowIndex: i + 1,
      values: Object.fromEntries(headers.map((h, j) => [h, row[j] || ""])),
    }));

    return {
      sheetId,
      sheetName: sheet.name,
      headers,
      rows,
      totalRows: rows.length,
    };
  } catch {
    return null;
  }
}
