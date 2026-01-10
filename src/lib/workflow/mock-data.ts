// Mock data for workflow module
import type { WorkflowRequest, TelegramMessage } from "./types";

// In-memory workflow store
let WORKFLOW_REQUESTS: WorkflowRequest[] = [
    {
        id: "wf-001",
        type: "instagram_post",
        title: "Promo Akhir Tahun 2025",
        description: "Post promosi diskon akhir tahun untuk event organizer",
        createdBy: "marketing@sensasiwangi.id",
        createdAt: "2025-12-20T10:00:00Z",
        status: "pending_approval",
        approvalLevel: "manager",
        telegramPreviewSent: true,
        metadata: {
            caption: "🎉 PROMO AKHIR TAHUN! Diskon 20% untuk semua layanan event organizer. Hubungi kami sekarang! #SensasiWangi #EventOrganizer",
            imageUrl: "https://picsum.photos/seed/promo1/1080/1080",
            hashtags: ["SensasiWangi", "EventOrganizer", "PromoAkhirTahun"],
        },
    },
    {
        id: "wf-002",
        type: "youtube_upload",
        title: "Highlight Event Wedding Andi & Rani",
        description: "Video highlight untuk dokumentasi event wedding",
        createdBy: "creative@sensasiwangi.id",
        createdAt: "2025-12-18T14:30:00Z",
        status: "approved",
        approvalLevel: "director",
        approvedBy: "director@sensasiwangi.id",
        approvedAt: "2025-12-19T09:00:00Z",
        n8nWorkflowId: "yt-upload-001",
        metadata: {
            title: "Wedding Highlight: Andi & Rani | Sensasi Wangi",
            description: "Highlight video dari pernikahan Andi & Rani di The Ritz Carlton Jakarta. Organized by Sensasi Wangi Indonesia.",
            videoUrl: "https://drive.google.com/file/wedding-highlight.mp4",
            thumbnail: "https://picsum.photos/seed/wedding1/1280/720",
            tags: ["wedding", "jakarta", "event", "highlight"],
            visibility: "public",
        },
    },
    {
        id: "wf-003",
        type: "instagram_post",
        title: "Team Photo Update",
        description: "Update foto team di Instagram",
        createdBy: "hr@sensasiwangi.id",
        createdAt: "2025-12-15T11:00:00Z",
        status: "rejected",
        approvalLevel: "manager",
        rejectionReason: "Photo resolution too low, please upload high-res version",
        metadata: {
            caption: "Meet our amazing team! 💪 #TeamSensasiWangi",
            imageUrl: "https://picsum.photos/seed/team1/1080/1080",
        },
    },
];

let TELEGRAM_MESSAGES: TelegramMessage[] = [
    {
        id: "tg-001",
        workflowRequestId: "wf-001",
        content: "📋 *New Approval Request*\n\nType: Instagram Post\nTitle: Promo Akhir Tahun 2025\n\nCaption: 🎉 PROMO AKHIR TAHUN! Diskon 20%...\n\n👍 Reply with /approve to approve\n👎 Reply with /reject [reason] to reject",
        sentAt: "2025-12-20T10:05:00Z",
        chatId: "-1001234567890",
        messageType: "approval_request",
    },
];

// Workflow CRUD operations
export function getWorkflowRequests(): WorkflowRequest[] {
    return WORKFLOW_REQUESTS;
}

export function getWorkflowById(id: string): WorkflowRequest | undefined {
    return WORKFLOW_REQUESTS.find((w) => w.id === id);
}

export function getWorkflowsByStatus(status: WorkflowRequest["status"]): WorkflowRequest[] {
    return WORKFLOW_REQUESTS.filter((w) => w.status === status);
}

export function getPendingApprovals(): WorkflowRequest[] {
    return WORKFLOW_REQUESTS.filter((w) => w.status === "pending_approval");
}

export function createWorkflowRequest(data: Omit<WorkflowRequest, "id" | "createdAt" | "status">): WorkflowRequest {
    const newRequest: WorkflowRequest = {
        ...data,
        id: `wf-${Date.now()}`,
        createdAt: new Date().toISOString(),
        status: "draft",
    };
    WORKFLOW_REQUESTS.push(newRequest);
    return newRequest;
}

export function updateWorkflowStatus(
    id: string,
    status: WorkflowRequest["status"],
    extra?: Partial<WorkflowRequest>
): WorkflowRequest | null {
    const index = WORKFLOW_REQUESTS.findIndex((w) => w.id === id);
    if (index === -1) return null;

    WORKFLOW_REQUESTS[index] = {
        ...WORKFLOW_REQUESTS[index],
        ...extra,
        status,
    };
    return WORKFLOW_REQUESTS[index];
}

export function approveWorkflow(id: string, approverUserId: string): WorkflowRequest | null {
    return updateWorkflowStatus(id, "approved", {
        approvedBy: approverUserId,
        approvedAt: new Date().toISOString(),
    });
}

export function rejectWorkflow(id: string, reason: string): WorkflowRequest | null {
    return updateWorkflowStatus(id, "rejected", {
        rejectionReason: reason,
    });
}

// Telegram message operations
export function getTelegramMessages(): TelegramMessage[] {
    return TELEGRAM_MESSAGES;
}

export function getMessagesByWorkflow(workflowId: string): TelegramMessage[] {
    return TELEGRAM_MESSAGES.filter((m) => m.workflowRequestId === workflowId);
}

// Mock n8n execution
export async function triggerN8nWorkflow(workflowType: string, data: Record<string, unknown>): Promise<{ executionId: string; success: boolean }> {
    // Simulate API call delay
    await new Promise((resolve) => setTimeout(resolve, 500));

    console.log(`[Mock] Triggering n8n workflow: ${workflowType}`, data);

    return {
        executionId: `exec-${Date.now()}`,
        success: true,
    };
}

// Mock Telegram send
export async function sendTelegramPreview(workflowId: string, chatId: string): Promise<{ success: boolean; messageId: string }> {
    await new Promise((resolve) => setTimeout(resolve, 300));

    const workflow = getWorkflowById(workflowId);
    if (!workflow) throw new Error("Workflow not found");

    const message: TelegramMessage = {
        id: `tg-${Date.now()}`,
        workflowRequestId: workflowId,
        content: `📋 Preview for: ${workflow.title}`,
        sentAt: new Date().toISOString(),
        chatId,
        messageType: "preview",
    };

    TELEGRAM_MESSAGES.push(message);

    // Update workflow
    updateWorkflowStatus(workflowId, workflow.status, { telegramPreviewSent: true });

    return {
        success: true,
        messageId: message.id,
    };
}
