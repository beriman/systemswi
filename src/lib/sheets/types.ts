// Google Sheets types

export interface SheetInfo {
    id: string;
    name: string;
    description?: string;
    lastModified: string;
    rowCount: number;
    columnCount: number;
    spreadsheetId: string;
}

export interface SpreadsheetInfo {
    id: string;
    name: string;
    url?: string;
    sheets: SheetInfo[];
    lastModified: string;
}

export interface SheetRow {
    rowIndex: number;
    values: Record<string, string | number | boolean | null>;
}

export interface SheetData {
    sheetId: string;
    sheetName: string;
    headers: string[];
    rows: SheetRow[];
    totalRows: number;
}

// Sheet names available in the spreadsheet
export const SHEET_NAMES = [
    "Dashboard",
    "DashboardSetoran",
    "RekapSetoran",
    "Holding",
    "PemegangSaham",
    "DivisiShareholders",
    "SukukStore",
    "SukukInvestor",
    "SukukProyeksi",
    "SukukProduk",
    "SukukProdukProj",
    "SukukPanduan",
    "SukukTermSheet",
    "SukukCreditor",
    "SukukRAB",
    "SukukSchedule",
    "SukukNotification",
    "SukukAudit",
    "RekeningKoran",
    "RekeningMutasi",
    "RekapRekening",
    "COA",
    "CashHarian",
    "BukuKas",
    "LaporanBulanan",
    "BudgetVsActual",
    "PajakTracking",
    "LegalCompliance",
    "CashflowForecast",
    "CashflowAktual",
    "BreakEven",
    "Proyeksi12Bulan",
    "Produksi",
] as const;

export type SheetName = (typeof SHEET_NAMES)[number];

// Sheet limit constants (Google Sheets limits)
export const SHEET_LIMITS = {
    MAX_CELLS: 10_000_000,
    MAX_COLUMNS: 18_278,
    MAX_ROWS: 10_000_000,
    WARNING_THRESHOLD: 0.8,
} as const;

export function calculateUsage(
    currentCells: number,
    maxCells: number = SHEET_LIMITS.MAX_CELLS
): number {
    return Math.round((currentCells / maxCells) * 100);
}

export function isNearingLimit(usagePercent: number): boolean {
    return usagePercent >= SHEET_LIMITS.WARNING_THRESHOLD * 100;
}
