// Google Drive types for file browser

export interface DriveFile {
    id: string;
    name: string;
    mimeType: string;
    size?: number;
    modifiedTime: string;
    createdTime: string;
    parents?: string[];
    webViewLink?: string;
    iconLink?: string;
    thumbnailLink?: string;
}

export interface DriveFolder extends DriveFile {
    mimeType: "application/vnd.google-apps.folder";
}

export type DriveItem = DriveFile | DriveFolder;

// Common MIME types
export const MIME_TYPES = {
    FOLDER: "application/vnd.google-apps.folder",
    DOCUMENT: "application/vnd.google-apps.document",
    SPREADSHEET: "application/vnd.google-apps.spreadsheet",
    PRESENTATION: "application/vnd.google-apps.presentation",
    PDF: "application/pdf",
    IMAGE: "image/",
    VIDEO: "video/",
} as const;

// Check if item is folder
export function isFolder(item: DriveItem): item is DriveFolder {
    return item.mimeType === MIME_TYPES.FOLDER;
}

// Get file icon based on MIME type
export function getFileIcon(mimeType: string): string {
    if (mimeType === MIME_TYPES.FOLDER) return "📁";
    if (mimeType === MIME_TYPES.DOCUMENT) return "📄";
    if (mimeType === MIME_TYPES.SPREADSHEET) return "📊";
    if (mimeType === MIME_TYPES.PRESENTATION) return "📽️";
    if (mimeType === MIME_TYPES.PDF) return "📕";
    if (mimeType.startsWith("image/")) return "🖼️";
    if (mimeType.startsWith("video/")) return "🎬";
    return "📎";
}

// Format file size
export function formatFileSize(bytes?: number): string {
    if (!bytes) return "-";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}
