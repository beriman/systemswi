// Document templates
import type { DocumentTemplate, DocumentType } from "./types";

export const DOCUMENT_TEMPLATES: DocumentTemplate[] = [
    {
        id: "tpl-proposal",
        type: "proposal",
        name: "Proposal Event",
        description: "Template proposal untuk pengajuan event",
        icon: "📝",
        fields: [
            { id: "event_name", label: "Nama Event", type: "text", required: true },
            { id: "event_date", label: "Tanggal Event", type: "date", required: true },
            { id: "location", label: "Lokasi", type: "text", required: true },
            { id: "background", label: "Latar Belakang", type: "textarea", required: true },
            { id: "objectives", label: "Tujuan Event", type: "textarea", required: true },
            { id: "target_audience", label: "Target Audience", type: "text" },
            { id: "estimated_budget", label: "Estimasi Budget (Rp)", type: "number" },
        ],
    },
    {
        id: "tpl-rab",
        type: "rab",
        name: "Rencana Anggaran Biaya",
        description: "Template RAB untuk perencanaan budget event",
        icon: "💰",
        fields: [
            { id: "event", label: "Pilih Event", type: "event", required: true },
            { id: "period", label: "Periode", type: "text" },
            { id: "notes", label: "Catatan", type: "textarea" },
        ],
    },
    {
        id: "tpl-lapkeu",
        type: "laporan_keuangan",
        name: "Laporan Keuangan",
        description: "Template laporan keuangan event",
        icon: "📊",
        fields: [
            { id: "event", label: "Pilih Event", type: "event", required: true },
            { id: "period_start", label: "Periode Mulai", type: "date", required: true },
            { id: "period_end", label: "Periode Akhir", type: "date", required: true },
            { id: "summary", label: "Ringkasan", type: "textarea" },
        ],
    },
    {
        id: "tpl-progress",
        type: "laporan_progress",
        name: "Laporan Progress",
        description: "Template laporan progress event",
        icon: "📈",
        fields: [
            { id: "event", label: "Pilih Event", type: "event", required: true },
            { id: "report_date", label: "Tanggal Laporan", type: "date", required: true },
            { id: "achievements", label: "Pencapaian", type: "textarea" },
            { id: "challenges", label: "Kendala", type: "textarea" },
            { id: "next_steps", label: "Rencana Selanjutnya", type: "textarea" },
        ],
    },
    {
        id: "tpl-undangan",
        type: "surat_undangan",
        name: "Surat Undangan",
        description: "Template surat undangan resmi",
        icon: "✉️",
        fields: [
            { id: "recipient_name", label: "Nama Penerima", type: "text", required: true },
            { id: "recipient_title", label: "Jabatan Penerima", type: "text" },
            { id: "event_name", label: "Nama Event", type: "text", required: true },
            { id: "event_date", label: "Tanggal Event", type: "date", required: true },
            { id: "event_time", label: "Waktu", type: "text" },
            { id: "location", label: "Lokasi", type: "text", required: true },
            { id: "dress_code", label: "Dress Code", type: "text" },
        ],
    },
    {
        id: "tpl-kontrak",
        type: "kontrak",
        name: "Kontrak Kerjasama",
        description: "Template kontrak kerjasama dengan vendor",
        icon: "📄",
        fields: [
            { id: "party_1", label: "Pihak Pertama", type: "text", required: true },
            { id: "party_2", label: "Pihak Kedua", type: "text", required: true },
            { id: "scope", label: "Ruang Lingkup Kerjasama", type: "textarea", required: true },
            { id: "value", label: "Nilai Kontrak (Rp)", type: "number", required: true },
            { id: "start_date", label: "Tanggal Mulai", type: "date", required: true },
            { id: "end_date", label: "Tanggal Berakhir", type: "date", required: true },
            { id: "terms", label: "Syarat & Ketentuan", type: "textarea" },
        ],
    },
    {
        id: "tpl-tugas",
        type: "surat_tugas",
        name: "Surat Tugas",
        description: "Template surat tugas untuk panitia",
        icon: "📋",
        fields: [
            { id: "employee_name", label: "Nama Karyawan", type: "text", required: true },
            { id: "employee_role", label: "Jabatan", type: "text", required: true },
            { id: "assignment", label: "Penugasan", type: "textarea", required: true },
            { id: "start_date", label: "Tanggal Mulai", type: "date", required: true },
            { id: "end_date", label: "Tanggal Selesai", type: "date" },
            { id: "location", label: "Lokasi Tugas", type: "text" },
        ],
    },
    {
        id: "tpl-notulen",
        type: "notulen",
        name: "Notulen Rapat",
        description: "Template notulen rapat",
        icon: "📝",
        fields: [
            { id: "meeting_title", label: "Judul Rapat", type: "text", required: true },
            { id: "meeting_date", label: "Tanggal Rapat", type: "date", required: true },
            { id: "attendees", label: "Peserta Rapat", type: "textarea", required: true },
            { id: "agenda", label: "Agenda", type: "textarea", required: true },
            { id: "discussion", label: "Pembahasan", type: "textarea", required: true },
            { id: "decisions", label: "Keputusan", type: "textarea" },
            { id: "action_items", label: "Tindak Lanjut", type: "textarea" },
        ],
    },
];

// Get template by type
export function getTemplateByType(type: DocumentType): DocumentTemplate | undefined {
    return DOCUMENT_TEMPLATES.find((t) => t.type === type);
}

// Get all templates
export function getAllTemplates(): DocumentTemplate[] {
    return DOCUMENT_TEMPLATES;
}
