// Document content generator
import type { DocumentType, LetterNumber } from "./types";
import { ROMAN_MONTHS } from "./types";
import { incrementLetterCounter } from "./persistence";

// Generate letter number with persistent counter
export function generateLetterNumber(prefix: string = "SWI"): LetterNumber {
    const now = new Date();
    const sequence = incrementLetterCounter();

    return {
        sequence,
        prefix,
        month: ROMAN_MONTHS[now.getMonth()],
        year: now.getFullYear(),
    };
}

// Format letter number to string
export function formatLetterNumber(ln: LetterNumber): string {
    const seq = String(ln.sequence).padStart(3, "0");
    return `${seq}/${ln.prefix}/${ln.month}/${ln.year}`;
}

// Generate document content based on type and data
export function generateDocumentContent(
    type: DocumentType,
    data: Record<string, string>,
    letterNumber?: string
): string {
    const now = new Date().toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
    });

    switch (type) {
        case "proposal":
            return generateProposal(data, letterNumber, now);
        case "rab":
            return generateRAB(data, letterNumber, now);
        case "laporan_keuangan":
            return generateLaporanKeuangan(data, letterNumber, now);
        case "laporan_progress":
            return generateLaporanProgress(data, letterNumber, now);
        case "surat_undangan":
            return generateSuratUndangan(data, letterNumber, now);
        case "kontrak":
            return generateKontrak(data, letterNumber, now);
        case "surat_tugas":
            return generateSuratTugas(data, letterNumber, now);
        case "notulen":
            return generateNotulen(data, now);
        default:
            return "Document type not supported";
    }
}

function generateProposal(data: Record<string, string>, letterNumber: string = "", date: string): string {
    return `
# PROPOSAL EVENT
**${data.event_name || "Nama Event"}**

---

**Nomor**: ${letterNumber}
**Tanggal**: ${date}

## I. LATAR BELAKANG
${data.background || "-"}

## II. TUJUAN
${data.objectives || "-"}

## III. DETAIL EVENT
- **Tanggal**: ${data.event_date || "-"}
- **Lokasi**: ${data.location || "-"}
- **Target Audience**: ${data.target_audience || "-"}

## IV. ESTIMASI ANGGARAN
Rp ${Number(data.estimated_budget || 0).toLocaleString("id-ID")}

## V. PENUTUP
Demikian proposal ini kami ajukan. Atas perhatian dan kerjasamanya, kami ucapkan terima kasih.

---
**PT. SENSASI WANGI INDONESIA**
`;
}

function generateRAB(data: Record<string, string>, letterNumber: string = "", date: string): string {
    return `
# RENCANA ANGGARAN BIAYA
**Event: ${data.event || "Nama Event"}**

---

**Nomor**: ${letterNumber}
**Tanggal**: ${date}
**Periode**: ${data.period || "-"}

## RINCIAN ANGGARAN

| No | Kategori | Item | Qty | Harga Satuan | Total |
|----|----------|------|-----|--------------|-------|
| 1  | Venue    | -    | -   | -            | -     |
| 2  | Catering | -    | -   | -            | -     |
| 3  | Dekorasi | -    | -   | -            | -     |
| 4  | Sound    | -    | -   | -            | -     |

**TOTAL ANGGARAN**: Rp -

## CATATAN
${data.notes || "-"}

---
Dibuat oleh: Finance Team
`;
}

function generateLaporanKeuangan(data: Record<string, string>, letterNumber: string = "", date: string): string {
    return `
# LAPORAN KEUANGAN
**Event: ${data.event || "Nama Event"}**

---

**Nomor**: ${letterNumber}
**Tanggal Laporan**: ${date}
**Periode**: ${data.period_start || "-"} s/d ${data.period_end || "-"}

## RINGKASAN KEUANGAN

| Keterangan | Jumlah |
|------------|--------|
| Total Anggaran | Rp - |
| Total Pengeluaran | Rp - |
| Sisa Anggaran | Rp - |

## DETAIL PENGELUARAN
(Terlampir)

## RINGKASAN
${data.summary || "-"}

---
Dibuat oleh: Finance Team
`;
}

function generateLaporanProgress(data: Record<string, string>, letterNumber: string = "", date: string): string {
    return `
# LAPORAN PROGRESS EVENT
**Event: ${data.event || "Nama Event"}**

---

**Nomor**: ${letterNumber}
**Tanggal**: ${data.report_date || date}

## PENCAPAIAN
${data.achievements || "-"}

## KENDALA
${data.challenges || "-"}

## RENCANA SELANJUTNYA
${data.next_steps || "-"}

---
Dibuat oleh: Project Manager
`;
}

function generateSuratUndangan(data: Record<string, string>, letterNumber: string = "", date: string): string {
    return `
# SURAT UNDANGAN
**Nomor: ${letterNumber}**

---

Kepada Yth.
**${data.recipient_name || "-"}**
${data.recipient_title || ""}

di Tempat

Dengan hormat,

Bersama ini kami mengundang Bapak/Ibu untuk menghadiri acara:

**${data.event_name || "Nama Event"}**

📅 Hari/Tanggal: ${data.event_date || "-"}
⏰ Waktu: ${data.event_time || "-"}
📍 Tempat: ${data.location || "-"}
👔 Dress Code: ${data.dress_code || "Formal"}

Kehadiran Bapak/Ibu sangat kami harapkan.

Jakarta, ${date}
Hormat kami,

**PT. SENSASI WANGI INDONESIA**
`;
}

function generateKontrak(data: Record<string, string>, letterNumber: string = "", date: string): string {
    return `
# KONTRAK KERJASAMA
**Nomor: ${letterNumber}**

---

Pada hari ini, ${date}, telah disepakati kerjasama antara:

**PIHAK PERTAMA**
${data.party_1 || "-"}

**PIHAK KEDUA**
${data.party_2 || "-"}

## PASAL 1: RUANG LINGKUP
${data.scope || "-"}

## PASAL 2: NILAI KONTRAK
Rp ${Number(data.value || 0).toLocaleString("id-ID")}

## PASAL 3: JANGKA WAKTU
Mulai: ${data.start_date || "-"}
Berakhir: ${data.end_date || "-"}

## PASAL 4: SYARAT & KETENTUAN
${data.terms || "-"}

---

**PIHAK PERTAMA**                    **PIHAK KEDUA**

_________________                    _________________
`;
}

function generateSuratTugas(data: Record<string, string>, letterNumber: string = "", date: string): string {
    return `
# SURAT TUGAS
**Nomor: ${letterNumber}**

---

Yang bertanda tangan di bawah ini memberikan tugas kepada:

**Nama**: ${data.employee_name || "-"}
**Jabatan**: ${data.employee_role || "-"}

Untuk melaksanakan tugas:
${data.assignment || "-"}

**Waktu Pelaksanaan**:
- Mulai: ${data.start_date || "-"}
- Selesai: ${data.end_date || "-"}
- Lokasi: ${data.location || "-"}

Demikian surat tugas ini dibuat untuk dilaksanakan sebagaimana mestinya.

Jakarta, ${date}

**PT. SENSASI WANGI INDONESIA**
`;
}

function generateNotulen(data: Record<string, string>, date: string): string {
    return `
# NOTULEN RAPAT
**${data.meeting_title || "Rapat"}**

---

**Tanggal**: ${data.meeting_date || date}

## PESERTA RAPAT
${data.attendees || "-"}

## AGENDA
${data.agenda || "-"}

## PEMBAHASAN
${data.discussion || "-"}

## KEPUTUSAN
${data.decisions || "-"}

## TINDAK LANJUT
${data.action_items || "-"}

---
Notulis: _______________
`;
}
