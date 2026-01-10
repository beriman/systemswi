// Workflow types for automation

export type WorkflowType =
    | "instagram_post"
    | "youtube_upload"
    | "telegram_broadcast"
    | "email_campaign"
    | "document_generation";

export type WorkflowStatus =
    | "draft"
    | "pending_approval"
    | "approved"
    | "rejected"
    | "processing"
    | "completed"
    | "failed";

export type ApprovalLevel = "manager" | "director" | "ceo";

export interface WorkflowRequest {
    id: string;
    type: WorkflowType;
    title: string;
    description: string;
    createdBy: string;
    createdAt: string;
    status: WorkflowStatus;
    approvalLevel: ApprovalLevel;
    approvedBy?: string;
    approvedAt?: string;
    rejectionReason?: string;
    metadata: Record<string, unknown>;
    telegramPreviewSent?: boolean;
    n8nWorkflowId?: string;
    n8nExecutionId?: string;
}

// Instagram post request
export interface InstagramPostRequest extends WorkflowRequest {
    type: "instagram_post";
    metadata: {
        caption: string;
        imageUrl: string;
        scheduledTime?: string;
        hashtags?: string[];
    };
}

// YouTube upload request
export interface YouTubeUploadRequest extends WorkflowRequest {
    type: "youtube_upload";
    metadata: {
        title: string;
        description: string;
        videoUrl: string;
        thumbnail?: string;
        tags?: string[];
        visibility: "public" | "private" | "unlisted";
    };
}

// Telegram message
export interface TelegramMessage {
    id: string;
    workflowRequestId: string;
    content: string;
    sentAt: string;
    chatId: string;
    messageType: "preview" | "approval_request" | "notification";
}

// Approval action
export interface ApprovalAction {
    workflowId: string;
    action: "approve" | "reject";
    approverUserId: string;
    reason?: string;
    timestamp: string;
}

// Type labels
export const WORKFLOW_TYPE_LABELS: Record<WorkflowType, string> = {
    instagram_post: "Instagram Post",
    youtube_upload: "YouTube Upload",
    telegram_broadcast: "Telegram Broadcast",
    email_campaign: "Email Campaign",
    document_generation: "Document Generation",
};

export const WORKFLOW_STATUS_LABELS: Record<WorkflowStatus, string> = {
    draft: "Draft",
    pending_approval: "Pending Approval",
    approved: "Approved",
    rejected: "Rejected",
    processing: "Processing",
    completed: "Completed",
    failed: "Failed",
};

export const STATUS_COLORS: Record<WorkflowStatus, string> = {
    draft: "gray",
    pending_approval: "yellow",
    approved: "green",
    rejected: "red",
    processing: "blue",
    completed: "green",
    failed: "red",
};
