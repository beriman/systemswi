// AI Drive Context - Integration with Drive files
import { getItemsByParent, ROOT_FOLDER_ID } from "@/lib/drive";
import { getSpreadsheets } from "@/lib/sheets";

export interface DriveContext {
    recentFiles: { name: string; type: string }[];
    spreadsheets: { name: string; sheetCount: number }[];
    summary: string;
}

// Get Drive context for AI
export function getDriveContext(): DriveContext {
    const driveItems = getItemsByParent(ROOT_FOLDER_ID);
    const spreadsheets = getSpreadsheets();

    const recentFiles = driveItems.slice(0, 5).map((item) => ({
        name: item.name,
        type: item.mimeType.split("/").pop() || "unknown",
    }));

    const sheetsInfo = spreadsheets.map((s) => ({
        name: s.name,
        sheetCount: s.sheets.length,
    }));

    return {
        recentFiles,
        spreadsheets: sheetsInfo,
        summary: `${driveItems.length} files in root, ${spreadsheets.length} spreadsheets connected`,
    };
}

// Format context for AI prompt
export function formatDriveContextForAI(): string {
    const context = getDriveContext();

    return `
Drive Context:
- Recent Files: ${context.recentFiles.map((f) => f.name).join(", ")}
- Connected Sheets: ${context.spreadsheets.map((s) => s.name).join(", ")}
- Summary: ${context.summary}
`.trim();
}
