// AI Chat types

export interface ChatMessage {
    id: string;
    role: "user" | "assistant" | "system";
    content: string;
    timestamp: string;
    attachments?: Attachment[];
    actions?: AIAction[];
}

export interface Attachment {
    id: string;
    type: "image" | "file" | "drive" | "sheet";
    name: string;
    url?: string;
    mimeType?: string;
}

export interface AIAction {
    id: string;
    type: "generate_document" | "trigger_workflow" | "open_drive" | "update_sheet";
    label: string;
    status: "pending" | "running" | "completed" | "failed";
    data?: Record<string, unknown>;
}

export interface ChatSession {
    id: string;
    title: string;
    messages: ChatMessage[];
    createdAt: string;
    updatedAt: string;
}

// AI Priority levels for response
export type AIPriority = "urgent" | "high" | "normal" | "low";

// AI Capabilities
export const AI_CAPABILITIES = [
    "Document Generation (RAB, Proposal, Laporan)",
    "Drive File Search & Summarization",
    "Workflow Automation Triggers",
    "Data Analysis from Sheets",
    "Event Planning Assistance",
] as const;
