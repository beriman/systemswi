// AI Workflow Trigger system

export type WorkflowType =
    | "create_event"
    | "send_notification"
    | "generate_report"
    | "approve_rab"
    | "invite_panitia";

export interface Workflow {
    id: WorkflowType;
    name: string;
    description: string;
    triggers: string[];
}

// Available workflows
export const AVAILABLE_WORKFLOWS: Workflow[] = [
    {
        id: "create_event",
        name: "Create New Event",
        description: "Buat event baru dengan folder structure",
        triggers: ["buat event", "create event", "event baru"],
    },
    {
        id: "send_notification",
        name: "Send Notification",
        description: "Kirim notifikasi ke team",
        triggers: ["kirim notifikasi", "notify", "beritahu"],
    },
    {
        id: "generate_report",
        name: "Generate Report",
        description: "Generate laporan otomatis",
        triggers: ["generate report", "buat laporan", "report"],
    },
    {
        id: "approve_rab",
        name: "Approve RAB",
        description: "Proses approval RAB",
        triggers: ["approve rab", "setujui rab", "acc rab"],
    },
    {
        id: "invite_panitia",
        name: "Invite Panitia",
        description: "Undang panitia ke event",
        triggers: ["undang panitia", "invite panitia", "add panitia"],
    },
];

// Detect workflow from message
export function detectWorkflow(message: string): Workflow | null {
    const lowerMessage = message.toLowerCase();

    for (const workflow of AVAILABLE_WORKFLOWS) {
        if (workflow.triggers.some((trigger) => lowerMessage.includes(trigger))) {
            return workflow;
        }
    }

    return null;
}

// Trigger workflow (mock)
export async function triggerWorkflow(
    workflowId: WorkflowType,
    params: Record<string, unknown>
): Promise<{ success: boolean; message: string }> {
    console.log(`Triggering workflow: ${workflowId}`, params);

    // Simulate delay
    await new Promise((resolve) => setTimeout(resolve, 1000));

    return {
        success: true,
        message: `Workflow "${workflowId}" triggered successfully`,
    };
}
