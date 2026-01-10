// AI Actions - Wired up action handlers
import type { AIAction } from "./types";
import { generateDocument, DocumentType } from "./document-gen";
import { triggerWorkflow, WorkflowType } from "./workflow-trigger";

export interface ActionResult {
    success: boolean;
    message: string;
    data?: unknown;
}

// Execute an action
export async function executeAction(action: AIAction): Promise<ActionResult> {
    console.log("Executing action:", action);

    switch (action.type) {
        case "generate_document":
            return await handleGenerateDocument(action);

        case "trigger_workflow":
            return await handleTriggerWorkflow(action);

        case "open_drive":
            return handleOpenDrive(action);

        case "update_sheet":
            return handleUpdateSheet(action);

        default:
            return { success: false, message: "Unknown action type" };
    }
}

// Handle document generation
async function handleGenerateDocument(action: AIAction): Promise<ActionResult> {
    try {
        const docType = (action.data?.type as DocumentType) || "rab";
        const docData = (action.data?.fields as Record<string, string>) || {};

        const content = generateDocument(docType, docData);

        return {
            success: true,
            message: `Document generated successfully`,
            data: { content, type: docType },
        };
    } catch (error) {
        return { success: false, message: `Failed to generate document: ${error}` };
    }
}

// Handle workflow trigger
async function handleTriggerWorkflow(action: AIAction): Promise<ActionResult> {
    try {
        const workflowId = action.data?.workflowId as WorkflowType;
        const params = (action.data?.params as Record<string, unknown>) || {};

        const result = await triggerWorkflow(workflowId, params);

        return {
            success: result.success,
            message: result.message,
        };
    } catch (error) {
        return { success: false, message: `Failed to trigger workflow: ${error}` };
    }
}

// Handle open drive
function handleOpenDrive(action: AIAction): ActionResult {
    const folderId = action.data?.folderId as string;

    // In a real app, this would navigate to the folder
    console.log("Opening Drive folder:", folderId);

    return {
        success: true,
        message: "Opening folder in Drive...",
        data: { folderId },
    };
}

// Handle update sheet
function handleUpdateSheet(action: AIAction): ActionResult {
    const sheetId = action.data?.sheetId as string;
    const updates = action.data?.updates;

    // In a real app, this would update the sheet
    console.log("Updating sheet:", sheetId, updates);

    return {
        success: true,
        message: "Sheet updated",
        data: { sheetId },
    };
}
