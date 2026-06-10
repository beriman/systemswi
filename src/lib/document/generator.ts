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
        case "invoice":
            return generateInvoice(data, letterNumber, now);
        case "sponsor_proposal":
            return generateSponsorProposal(data, letterNumber, now);
        case "tenant_agreement":
            return generateTenantAgreement(data, letterNumber, now);
        case "proposal":
            return generateProposal(data, letterNumber, now);
        case "rab":
            return generateRAB(data, letterNumber, now);
        case "laporan_keuangan":
            return generateLaporanKeuangan(data, letterNumber, now);
        case "monthly_report":
            return generateMonthlyReport(data, letterNumber, now);
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

function parseAmount(value: string | undefined): number {
    const parsed = Number(String(value || "").replace(/[^\d.-]/g, ""));
    return Number.isFinite(parsed) ? parsed : 0;
}

function rupiah(value: string | number | undefined): string {
    const parsed = typeof value === "number" ? value : parseAmount(value);
    return `Rp ${parsed.toLocaleString("id-ID")}`;
}

function autoDocNumber(prefix: string): string {
    const now = new Date();
    const stamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;
    return `${prefix}-${stamp}-${String(now.getTime()).slice(-5)}`;
}

function generateInvoice(data: Record<string, string>, letterNumber: string = "", date: string): string {
    const invoiceNumber = data.invoice_number || letterNumber || autoDocNumber("INV-SWI");
    const amount = parseAmount(data.amount);
    const paid = parseAmount(data.paid_amount);
    const remaining = Math.max(amount - paid, 0);
    return `
# INVOICE
**PT Sensasi Wangi Indonesia**

---

**No. Invoice**: ${invoiceNumber}
**Tanggal Terbit**: ${date}
**Jatuh Tempo**: ${data.due_date || "TBA"}
**Ditagihkan Kepada**: ${data.bill_to || "TBA"}
**Event**: ${data.event_name || "TBA"}

## RINCIAN TAGIHAN

| Deskripsi | Nilai |
|---|---:|
| ${data.description || "Tagihan event"} | ${rupiah(amount)} |
| Sudah Dibayar | ${rupiah(paid)} |
| **Sisa Tagihan** | **${rupiah(remaining)}** |

## TERMIN PEMBAYARAN
${data.payment_terms || "Pembayaran dilakukan sesuai termin yang disepakati dan dikonfirmasi melalui bukti transfer/proof URL."}

## CATATAN / PROOF
${data.notes || "TBA"}

---
Dokumen ini dibuat otomatis oleh systemswi. Verifikasi final tetap dilakukan oleh Finance PT SWI.
`;
}

function generateSponsorProposal(data: Record<string, string>, letterNumber: string = "", date: string): string {
    return `
# PROPOSAL SPONSORSHIP
**${data.event_name || "Fragrantions"} x ${data.sponsor_name || "Calon Sponsor"}**

---

**Nomor**: ${letterNumber || autoDocNumber("SPONSOR-SWI")}
**Tanggal**: ${date}
**Tier Usulan**: ${(data.tier || "TBA").toUpperCase()}
**Nilai Sponsorship**: ${rupiah(data.sponsorship_amount)}

## 1. LATAR BELAKANG
Fragrantions adalah platform event parfum dan lifestyle yang mempertemukan brand, komunitas, tenant, sponsor, dan audiens pecinta fragrance. Proposal ini menyusun ruang kolaborasi yang transparan dan terukur.

## 2. TUJUAN KERJA SAMA
${data.objective || "Meningkatkan brand exposure, engagement komunitas, dan peluang transaksi selama rangkaian event."}

## 3. BENEFIT & DELIVERABLES
${data.deliverables || "Logo placement, publikasi media sosial, mention panggung, booth/activation space, dan laporan pasca-event. Detail final menunggu konfirmasi paket."}

## 4. KONTAK
PIC Sponsor: ${data.contact_person || "TBA"}

---
Draft ini belum menjadi kontrak final sampai disetujui kedua pihak.
`;
}

function generateTenantAgreement(data: Record<string, string>, letterNumber: string = "", date: string): string {
    return `
# TENANT AGREEMENT
**${data.event_name || "Fragrantions"}**

---

**Nomor**: ${letterNumber || autoDocNumber("TENANT-SWI")}
**Tanggal**: ${date}

## PIHAK
Tenant/Brand: **${data.tenant_name || "TBA"}**
Penyelenggara: **PT Sensasi Wangi Indonesia**

## DETAIL BOOTH
- Booth: ${data.booth_number || "TBA"}
- Paket: ${data.package_type || "TBA"}
- Biaya: ${rupiah(data.fee)}
- Status Pembayaran: ${data.payment_status || "prospect"}

## ATURAN OPERASIONAL
${data.operational_rules || "Tenant wajib mengikuti jadwal loading/unloading, menjaga kebersihan booth, memastikan display aman, dan mematuhi aturan venue. Detail final dapat ditambahkan oleh panitia."}

## CATATAN
${data.notes || "TBA"}

---
Draft agreement ini perlu review final oleh Event Commercial/Legal sebelum ditandatangani.
`;
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

function generateMonthlyReport(data: Record<string, string>, letterNumber: string = "", date: string): string {
    return `
# MONTHLY REPORT
**Periode: ${data.period || "TBA"}**

---

**Nomor**: ${letterNumber || autoDocNumber("REPORT-SWI")}
**Tanggal Laporan**: ${date}

## EXECUTIVE SUMMARY
${data.executive_summary || "Ringkasan eksekutif belum diisi. Gunakan data Sheets terbaru untuk memvalidasi angka sebelum distribusi eksternal."}

## FINANCE
${data.finance_notes || "TBA — cek Cash_Harian, Buku_Kas, Laporan_Bulanan, dan setoran saham outstanding."}

## EVENT / FRAGRANTIONS
${data.event_notes || "TBA — cek tenant, sponsor, invoice/payment status, booth assignment, dan deadline timeline."}

## INVENTORY & PROCUREMENT
${data.inventory_notes || "TBA — cek stock minimum, PO terbuka, receiving goods, dan QC."}

## NEXT ACTIONS
${data.next_actions || "1. Validasi angka final dengan PIC terkait.\n2. Lampirkan proof URL untuk transaksi material.\n3. Update status follow-up di systemswi."}

---
Draft internal systemswi — jangan kirim eksternal sebelum review Direksi/Finance.
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
