// AI Multimodal Input handling
import type { Attachment } from "./types";

export type InputType = "text" | "image" | "file" | "voice";

export interface MultimodalInput {
    type: InputType;
    content: string;
    attachments?: Attachment[];
}

// Supported file types for AI processing
export const SUPPORTED_FILE_TYPES = {
    image: ["image/jpeg", "image/png", "image/gif", "image/webp"],
    document: ["application/pdf", "application/msword", "text/plain"],
    spreadsheet: ["application/vnd.ms-excel", "text/csv"],
} as const;

// Check if file type is supported
export function isFileSupportedForAI(mimeType: string): boolean {
    const allTypes = [
        ...SUPPORTED_FILE_TYPES.image,
        ...SUPPORTED_FILE_TYPES.document,
        ...SUPPORTED_FILE_TYPES.spreadsheet,
    ];
    return allTypes.includes(mimeType as typeof allTypes[number]);
}

// Process image attachment (mock - would call vision API)
export async function processImageAttachment(
    attachment: Attachment
): Promise<string> {
    console.log("Processing image:", attachment.name);

    // Mock delay
    await new Promise((resolve) => setTimeout(resolve, 500));

    return `[Analyzed image: ${attachment.name}]`;
}

// Process file attachment (mock - would extract text)
export async function processFileAttachment(
    attachment: Attachment
): Promise<string> {
    console.log("Processing file:", attachment.name);

    // Mock delay
    await new Promise((resolve) => setTimeout(resolve, 500));

    return `[Processed file: ${attachment.name}]`;
}

// Format multimodal input for AI
export function formatMultimodalInput(input: MultimodalInput): string {
    let formatted = input.content;

    if (input.attachments && input.attachments.length > 0) {
        const attachmentList = input.attachments
            .map((a) => `- ${a.type}: ${a.name}`)
            .join("\n");

        formatted += `\n\nAttachments:\n${attachmentList}`;
    }

    return formatted;
}
