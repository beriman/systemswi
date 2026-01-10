// AI Document Generation system

export type DocumentType = "rab" | "proposal" | "laporan" | "kontrak" | "surat";

export interface DocumentTemplate {
    type: DocumentType;
    name: string;
    description: string;
    fields: string[];
}

// Document templates
export const DOCUMENT_TEMPLATES: DocumentTemplate[] = [
    {
        type: "rab",
        name: "RAB (Rencana Anggaran Biaya)",
        description: "Template untuk estimasi biaya event",
        fields: ["eventName", "eventDate", "venue", "participants", "budget"],
    },
    {
        type: "proposal",
        name: "Proposal Event",
        description: "Template proposal untuk pengajuan event",
        fields: ["eventName", "theme", "background", "objectives", "timeline", "budget"],
    },
    {
        type: "laporan",
        name: "Laporan Event",
        description: "Template laporan pasca-event",
        fields: ["eventName", "eventDate", "actualParticipants", "highlights", "financials"],
    },
    {
        type: "kontrak",
        name: "Kontrak Kerjasama",
        description: "Template kontrak dengan vendor/sponsor",
        fields: ["partyA", "partyB", "scope", "terms", "value"],
    },
    {
        type: "surat",
        name: "Surat Resmi",
        description: "Template surat formal",
        fields: ["recipient", "subject", "body", "closing"],
    },
];

// Generate document content (mock)
export function generateDocument(
    type: DocumentType,
    data: Record<string, string>
): string {
    const template = DOCUMENT_TEMPLATES.find((t) => t.type === type);
    if (!template) return "Template not found";

    switch (type) {
        case "rab":
            return `# RAB - ${data.eventName || "Event"}
        
Tanggal: ${data.eventDate || "-"}
Venue: ${data.venue || "-"}
Estimasi Peserta: ${data.participants || "-"}

## Rincian Anggaran
(Template akan di-generate berdasarkan data event)

Total Estimasi: Rp ${data.budget || "0"}`;

        case "proposal":
            return `# PROPOSAL EVENT
## ${data.eventName || "Event"}

### Tema
${data.theme || "-"}

### Latar Belakang
${data.background || "-"}

### Tujuan
${data.objectives || "-"}

### Timeline
${data.timeline || "-"}

### Estimasi Biaya
Rp ${data.budget || "0"}`;

        default:
            return `# ${template.name}\n\n(Content will be generated)`;
    }
}
