// Mock Drive data for MVP
import { DriveItem, MIME_TYPES } from "./types";

// Root folder ID
export const ROOT_FOLDER_ID = "root";

// Mock folder structure for SWI company
export const mockDriveData: DriveItem[] = [
    // Root folders
    {
        id: "folder-events",
        name: "📅 Events",
        mimeType: MIME_TYPES.FOLDER,
        modifiedTime: "2026-01-09T10:00:00Z",
        createdTime: "2025-06-01T08:00:00Z",
        parents: [ROOT_FOLDER_ID],
    },
    {
        id: "folder-finance",
        name: "💰 Keuangan",
        mimeType: MIME_TYPES.FOLDER,
        modifiedTime: "2026-01-08T15:00:00Z",
        createdTime: "2025-06-01T08:00:00Z",
        parents: [ROOT_FOLDER_ID],
    },
    {
        id: "folder-media",
        name: "🎨 Media",
        mimeType: MIME_TYPES.FOLDER,
        modifiedTime: "2026-01-07T12:00:00Z",
        createdTime: "2025-06-01T08:00:00Z",
        parents: [ROOT_FOLDER_ID],
    },
    {
        id: "folder-legal",
        name: "📜 Legal",
        mimeType: MIME_TYPES.FOLDER,
        modifiedTime: "2025-12-15T09:00:00Z",
        createdTime: "2025-06-01T08:00:00Z",
        parents: [ROOT_FOLDER_ID],
    },
    // Events subfolders
    {
        id: "folder-event-2026-001",
        name: "Event 2026-001 - Wedding Expo",
        mimeType: MIME_TYPES.FOLDER,
        modifiedTime: "2026-01-09T10:00:00Z",
        createdTime: "2026-01-02T08:00:00Z",
        parents: ["folder-events"],
    },
    {
        id: "folder-event-2025-004",
        name: "Event 2025-004 - Year End Party",
        mimeType: MIME_TYPES.FOLDER,
        modifiedTime: "2025-12-31T23:00:00Z",
        createdTime: "2025-11-01T08:00:00Z",
        parents: ["folder-events"],
    },
    // Event 2026-001 files
    {
        id: "doc-proposal-001",
        name: "Proposal Wedding Expo 2026",
        mimeType: MIME_TYPES.DOCUMENT,
        modifiedTime: "2026-01-05T14:00:00Z",
        createdTime: "2026-01-02T09:00:00Z",
        parents: ["folder-event-2026-001"],
    },
    {
        id: "sheet-rab-001",
        name: "RAB Wedding Expo 2026",
        mimeType: MIME_TYPES.SPREADSHEET,
        modifiedTime: "2026-01-08T16:00:00Z",
        createdTime: "2026-01-03T10:00:00Z",
        parents: ["folder-event-2026-001"],
    },
    // Finance files
    {
        id: "sheet-cash-flow",
        name: "Cash Flow 2026",
        mimeType: MIME_TYPES.SPREADSHEET,
        modifiedTime: "2026-01-08T11:00:00Z",
        createdTime: "2026-01-01T08:00:00Z",
        parents: ["folder-finance"],
    },
    {
        id: "pdf-tax-report",
        name: "Laporan Pajak Q4 2025.pdf",
        mimeType: MIME_TYPES.PDF,
        size: 1254000,
        modifiedTime: "2026-01-05T09:00:00Z",
        createdTime: "2026-01-05T09:00:00Z",
        parents: ["folder-finance"],
    },
    // Media files
    {
        id: "img-logo",
        name: "Logo SWI.png",
        mimeType: "image/png",
        size: 45000,
        modifiedTime: "2025-06-01T10:00:00Z",
        createdTime: "2025-06-01T10:00:00Z",
        parents: ["folder-media"],
    },
];

// Get items by parent folder
export function getItemsByParent(parentId: string): DriveItem[] {
    return mockDriveData.filter((item) => item.parents?.includes(parentId));
}

// Get item by ID
export function getItemById(id: string): DriveItem | undefined {
    return mockDriveData.find((item) => item.id === id);
}

// Get folder path (breadcrumb)
export function getFolderPath(folderId: string): DriveItem[] {
    const path: DriveItem[] = [];
    let currentId = folderId;

    while (currentId && currentId !== ROOT_FOLDER_ID) {
        const item = getItemById(currentId);
        if (item) {
            path.unshift(item);
            currentId = item.parents?.[0] || "";
        } else {
            break;
        }
    }

    return path;
}

// Search items by name (case-insensitive)
export function searchItems(query: string): DriveItem[] {
    if (!query.trim()) return [];
    const lowerQuery = query.toLowerCase();
    return mockDriveData.filter((item) =>
        item.name.toLowerCase().includes(lowerQuery)
    );
}
