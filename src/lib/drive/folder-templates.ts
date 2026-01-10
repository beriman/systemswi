// Folder templates for auto-creation

export interface FolderTemplate {
    name: string;
    children?: FolderTemplate[];
}

// Default event folder structure
export const EVENT_FOLDER_TEMPLATE: FolderTemplate = {
    name: "Event [EVENT_CODE] - [EVENT_NAME]",
    children: [
        { name: "01 - Proposal" },
        { name: "02 - RAB" },
        { name: "03 - Kontrak" },
        {
            name: "04 - Media Assets", children: [
                { name: "Foto" },
                { name: "Video" },
                { name: "Design" },
            ]
        },
        { name: "05 - KTP Panitia" },
        { name: "06 - Laporan" },
        { name: "07 - Dokumentasi" },
    ],
};

// Generate folder structure for new event
export function generateEventFolderStructure(
    eventCode: string,
    eventName: string
): FolderTemplate {
    const replaceVars = (name: string) =>
        name
            .replace("[EVENT_CODE]", eventCode)
            .replace("[EVENT_NAME]", eventName);

    const processTemplate = (template: FolderTemplate): FolderTemplate => ({
        name: replaceVars(template.name),
        children: template.children?.map(processTemplate),
    });

    return processTemplate(EVENT_FOLDER_TEMPLATE);
}

// Note: Actual folder creation will use Google Drive API
// For MVP, this is a placeholder that logs the structure
export async function createEventFolders(
    eventCode: string,
    eventName: string,
    parentFolderId: string
): Promise<{ success: boolean; message: string }> {
    const structure = generateEventFolderStructure(eventCode, eventName);

    console.log("Creating folder structure:", JSON.stringify(structure, null, 2));
    console.log("Parent folder:", parentFolderId);

    // MVP: Return success (actual creation will be done via Google Drive API)
    return {
        success: true,
        message: `Folder structure for "${eventCode} - ${eventName}" would be created`,
    };
}
