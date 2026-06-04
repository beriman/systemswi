// Sheets module exports
// Client-safe exports (no googleapis dependency)
export type { SpreadsheetInfo, SheetInfo, SheetData, SheetRow, SheetName } from "./types";
export { SHEET_LIMITS, calculateUsage, isNearingLimit, SHEET_NAMES } from "./types";
export { getSpreadsheets, fetchSpreadsheets, fetchSheetData } from "./sheets-client";

// Server-only functions — import directly from sheets-real in API routes
// export { readSheet, readRange, writeRange, appendRows, updateRow, deleteRow, invalidateAuth } from "./sheets-real";
