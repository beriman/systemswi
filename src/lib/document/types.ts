// Document Generator types

export type DocumentType =
    | "proposal"
    | "rab"
    | "laporan_keuangan"
    | "laporan_progress"
    | "surat_undangan"
    | "kontrak"
    | "surat_tugas"
    | "notulen";

export interface DocumentTemplate {
    id: string;
    type: DocumentType;
    name: string;
    description: string;
    icon: string;
    fields: TemplateField[];
}

export interface TemplateField {
    id: string;
    label: string;
    type: "text" | "textarea" | "number" | "date" | "select" | "event";
    placeholder?: string;
    required?: boolean;
    options?: { value: string; label: string }[];
}

export interface GeneratedDocument {
    id: string;
    type: DocumentType;
    title: string;
    content: string;
    letterNumber?: string;
    createdAt: string;
    createdBy: string;
    eventId?: string;
    driveFileId?: string;
}

// Letter numbering format: 001/SWI/I/2026
export interface LetterNumber {
    sequence: number;
    prefix: string;
    month: string;  // Roman numeral
    year: number;
}

// Document status
export type DocumentStatus = "draft" | "pending" | "approved" | "sent";

// Template labels
export const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
    proposal: "Proposal Event",
    rab: "Rencana Anggaran Biaya",
    laporan_keuangan: "Laporan Keuangan",
    laporan_progress: "Laporan Progress",
    surat_undangan: "Surat Undangan",
    kontrak: "Kontrak Kerjasama",
    surat_tugas: "Surat Tugas",
    notulen: "Notulen Rapat",
};

// Roman numerals for months
export const ROMAN_MONTHS = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII"];
