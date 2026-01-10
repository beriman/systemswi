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

// Sheet limit constants (Google Sheets limits)
export const SHEET_LIMITS = {
    MAX_CELLS: 10_000_000, // 10 million cells per spreadsheet
    MAX_COLUMNS: 18_278, // Max columns (ZZZ)
    MAX_ROWS: 10_000_000, // Max rows
    WARNING_THRESHOLD: 0.8, // 80% usage warning
} as const;

// Calculate usage percentage
export function calculateUsage(
    currentCells: number,
    maxCells: number = SHEET_LIMITS.MAX_CELLS
): number {
    return Math.round((currentCells / maxCells) * 100);
}

// Check if nearing limit
export function isNearingLimit(usagePercent: number): boolean {
    return usagePercent >= SHEET_LIMITS.WARNING_THRESHOLD * 100;
}
