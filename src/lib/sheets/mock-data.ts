// Mock Sheets data for MVP
import type { SpreadsheetInfo, SheetData, SheetRow } from "./types";

// Mock spreadsheets connected to the system
export const mockSpreadsheets: SpreadsheetInfo[] = [
    {
        id: "spreadsheet-1",
        name: "📊 Master Data SWI",
        url: "https://docs.google.com/spreadsheets/d/abc123",
        lastModified: "2026-01-09T10:30:00Z",
        sheets: [
            {
                id: "sheet-1-1",
                name: "Events",
                lastModified: "2026-01-09T10:30:00Z",
                rowCount: 156,
                columnCount: 12,
                spreadsheetId: "spreadsheet-1",
            },
            {
                id: "sheet-1-2",
                name: "Panitia",
                lastModified: "2026-01-08T15:00:00Z",
                rowCount: 89,
                columnCount: 8,
                spreadsheetId: "spreadsheet-1",
            },
            {
                id: "sheet-1-3",
                name: "Finance",
                lastModified: "2026-01-09T09:00:00Z",
                rowCount: 1234,
                columnCount: 15,
                spreadsheetId: "spreadsheet-1",
            },
        ],
    },
    {
        id: "spreadsheet-2",
        name: "📋 RAB Template",
        url: "https://docs.google.com/spreadsheets/d/def456",
        lastModified: "2026-01-05T14:00:00Z",
        sheets: [
            {
                id: "sheet-2-1",
                name: "Template",
                lastModified: "2026-01-05T14:00:00Z",
                rowCount: 50,
                columnCount: 10,
                spreadsheetId: "spreadsheet-2",
            },
        ],
    },
];

// Mock sheet data
export const mockSheetData: Record<string, SheetData> = {
    "sheet-1-1": {
        sheetId: "sheet-1-1",
        sheetName: "Events",
        headers: ["ID", "Name", "Date", "Status", "Budget", "Location"],
        rows: [
            { rowIndex: 1, values: { ID: "E001", Name: "Wedding Expo 2026", Date: "2026-03-15", Status: "Planning", Budget: 50000000, Location: "Jakarta" } },
            { rowIndex: 2, values: { ID: "E002", Name: "Corporate Gathering", Date: "2026-04-20", Status: "Draft", Budget: 25000000, Location: "Bandung" } },
            { rowIndex: 3, values: { ID: "E003", Name: "Music Festival", Date: "2026-05-10", Status: "Approved", Budget: 100000000, Location: "Bali" } },
        ],
        totalRows: 156,
    },
};

// Get all spreadsheets
export function getSpreadsheets(): SpreadsheetInfo[] {
    return mockSpreadsheets;
}

// Get spreadsheet by ID
export function getSpreadsheetById(id: string): SpreadsheetInfo | undefined {
    return mockSpreadsheets.find((s) => s.id === id);
}

// Get sheet data by sheet ID
export function getSheetData(sheetId: string): SheetData | undefined {
    return mockSheetData[sheetId];
}

// Simulate fetch with delay
export async function fetchSpreadsheets(): Promise<SpreadsheetInfo[]> {
    await new Promise((resolve) => setTimeout(resolve, 500));
    return mockSpreadsheets;
}

export async function fetchSheetData(sheetId: string): Promise<SheetData | null> {
    await new Promise((resolve) => setTimeout(resolve, 300));
    return mockSheetData[sheetId] || null;
}
