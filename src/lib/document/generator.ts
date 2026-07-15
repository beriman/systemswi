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

// Budget context from Google Sheets (optional)
export type RabContext = {
  budgetByCategory?: Record<string, number>;
  totalBudget?: number;
  totalActual?: number;
  eventBudgetSummary?: Array<{ name: string; budget: number; actual: number; remaining: number; status: string }>;
  financeRows?: number;
  tenantRows?: number;
  sponsorRows?: number;
  inventoryRows?: number;
  tenantOutstanding?: number;
  sponsorPipelineValue?: number;
  expensePendingCount?: number;
  expensePendingAmount?: number;
  expenseNeedsProofCount?: number;
  expenseWithoutDivisionCount?: number;
  personalPaidExpenseAmount?: number;
  shareholderDebtOutstanding?: number;
  complianceOpenCount?: number;
  complianceOverdueCount?: number;
  vendorExceptionCount?: number;
  vendorRelatedPartyCount?: number;
  governanceAuditRows?: number;
  eventMediaRows?: number;
  closeoutCandidateEvents?: number;
  eventMissingMediaCount?: number;
  eventCloseoutSummary?: Array<{
    id: string;
    name: string;
    actualExpense: number;
    payable: number;
    tenantExpected: number;
    tenantPaid: number;
    sponsorExpected: number;
    sponsorPaid: number;
    receivable: number;
    mediaRows: number;
  }>;
};

// Generate document content based on type and data
export function generateDocumentContent(
    type: DocumentType,
    data: Record<string, string>,
    letterNumber?: string,
    context?: RabContext
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
            return generateRAB(data, letterNumber, now, context);
        case "event_closeout_report":
            return generateEventCloseoutReport(data, letterNumber, now, context);
        case "laporan_keuangan":
            return generateLaporanKeuangan(data, letterNumber, now);
        case "monthly_gcg_report":
            return generateMonthlyGcgReport(data, letterNumber, now, context);
        case "monthly_report":
            return generateMonthlyReport(data, letterNumber, now, context);
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

function normalize(value: string | undefined): string {
    return String(value || "").trim().toLowerCase();
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

function generateRAB(data: Record<string, string>, letterNumber: string = "", date: string, context?: RabContext): string {
    // Build budget line items from real Google Sheets data
    const budgetItems: Array<{ category: string; item: string; qty: number; unitPrice: number; total: number }> = [];
    const budgetByCategory = context?.budgetByCategory || {};

    const defaultCategories = [
        { cat: "Bahan Baku", items: ["Essential Oil", "Alkohol", "Botol Parfum", "Cap & Label"] },
        { cat: "Venue", items: ["Sewa Booth", "Listrik", "Area Setup"] },
        { cat: "Marketing", items: [" Instagram Ads", "Poster & Banner", "MC / Host"] },
        { cat: "Operasional", items: ["Transport Akomodasi", "Konsumsi Panitia", "Dokumentasi"] },
        { cat: "Sound & Tech", items: ["Sound System", "Lighting", "Visual"] },
    ];

    let grandTotal = 0;

    if (Object.keys(budgetByCategory).length > 0) {
        // Use real budget data from Sheets
        const categoryMapping: Record<string, string[]> = {
            "Venue": ["Venue"],
            "Catering": ["Operasional"],
            "Marketing": ["Marketing"],
            "Sound": ["Sound & Tech"],
            "Bahan Baku": ["Bahan Baku"],
            "Dekorasi": ["Venue"],
            "Packaging": ["Bahan Baku"],
            "Operasional": ["Operasional"],
        };
        for (const [sheetCat, budget] of Object.entries(budgetByCategory)) {
            const mapped = categoryMapping[sheetCat] || [sheetCat];
            for (const mappedCat of mapped) {
                const existing = budgetItems.find(b => b.category === mappedCat);
                if (existing) {
                    existing.total += budget;
                } else {
                    budgetItems.push({ category: mappedCat, item: sheetCat, qty: 1, unitPrice: budget, total: budget });
                }
                grandTotal += budget;
            }
        }
    } else {
        // Fallback: use user-provided data or defaults
        for (const group of defaultCategories) {
            for (const item of group.items) {
                budgetItems.push({ category: group.cat, item, qty: 0, unitPrice: 0, total: 0 });
            }
        }
    }

    const categorySubtotals: Record<string, number> = {};
    for (const item of budgetItems) {
        categorySubtotals[item.category] = (categorySubtotals[item.category] || 0) + item.total;
    }

    const tableRows = budgetItems
        .filter(b => b.total > 0 || Object.keys(budgetByCategory).length === 0)
        .map((b, i) => `| ${i + 1} | ${b.category} | ${b.item} | ${b.qty || "-"} | ${rupiah(b.unitPrice)} | ${rupiah(b.total)} |`)
        .join("\n");

    const totalLine = grandTotal > 0 ? `**TOTAL ANGGARAN**: ${rupiah(grandTotal)}` : `**TOTAL ANGGARAN**: Rp -`;

    const eventSummary = context?.eventBudgetSummary && context.eventBudgetSummary.length > 0
        ? `\n## EVENT BUDGET SUMMARY (Google Sheets Live Data)\n\n| Event | Budget | Actual | Remaining | Status |\n|-------|--------|--------|-----------|--------|\n${context.eventBudgetSummary.map(e => `| ${e.name} | ${rupiah(e.budget)} | ${rupiah(e.actual)} | ${rupiah(e.remaining)} | ${e.status} |`).join("\n")}\n`
        : "";

    return `
# RENCANA ANGGARAN BIAYA
**Event: ${data.event || "Nama Event"}**

---

**Nomor**: ${letterNumber}
**Tanggal**: ${date}
**Periode**: ${data.period || "-"}

## RINCIAN ANGGARAN
${tableRows}

${totalLine}${eventSummary}

## CATATAN
${data.notes || "-"}

---
Dibuat oleh: Finance Team — Angka bersumber dari Google Sheets Budget_Categories & Event_Budget (${context?.eventBudgetSummary?.length || 0} event budgets).
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

function generateEventCloseoutReport(data: Record<string, string>, letterNumber: string = "", date: string, context?: RabContext): string {
    const selectedEvent = normalize(data.event);
    const eventRows = (context?.eventBudgetSummary || []).filter((event) => !selectedEvent || normalize(event.name).includes(selectedEvent) || selectedEvent.includes(normalize(event.name)));
    const rows = eventRows.length ? eventRows : (context?.eventBudgetSummary || []);
    const eventCommercial = (context?.eventCloseoutSummary || []).find((event) => {
        const name = normalize(event.name);
        const id = normalize(event.id);
        return selectedEvent && (name.includes(selectedEvent) || selectedEvent.includes(name) || id === selectedEvent);
    });
    const budget = rows.reduce((sum, event) => sum + event.budget, 0);
    const actual = rows.reduce((sum, event) => sum + event.actual, 0);
    const remaining = budget - actual;
    const tenantExpected = eventCommercial?.tenantExpected ?? 0;
    const tenantPaid = eventCommercial?.tenantPaid ?? 0;
    const sponsorExpected = eventCommercial?.sponsorExpected ?? 0;
    const sponsorPaid = eventCommercial?.sponsorPaid ?? 0;
    const revenuePaid = tenantPaid + sponsorPaid;
    const revenueExpected = tenantExpected + sponsorExpected;
    const receivable = eventCommercial?.receivable ?? (context?.tenantOutstanding || 0) + (context?.sponsorPipelineValue || 0);
    const payable = eventCommercial?.payable ?? 0;
    const mediaRows = eventCommercial?.mediaRows ?? context?.eventMediaRows ?? 0;
    const eventTable = rows.length
        ? `| Event | Budget | Actual | Remaining | Status |\n|---|---:|---:|---:|---|\n${rows.map((event) => `| ${event.name || "TBA"} | ${rupiah(event.budget)} | ${rupiah(event.actual)} | ${rupiah(event.remaining)} | ${event.status || "TBA"} |`).join("\n")}`
        : "Belum ada data Event_Budget yang cocok. Isi TBA/0 sampai Sheets dilengkapi.";

    return `
# EVENT CLOSEOUT REPORT
**Event: ${data.event || "TBA"}**

---

**Nomor**: ${letterNumber || autoDocNumber("CLOSEOUT-SWI")}
**Tanggal Laporan**: ${date}
**Periode**: ${data.period || "TBA"}

## 1. Budget vs Actual
${eventTable}

- Total budget terbaca: **${rupiah(budget)}**
- Total actual terbaca: **${rupiah(actual)}**
- Actual expense dari Expense_Submissions: **${rupiah(eventCommercial?.actualExpense ?? 0)}**${eventCommercial ? "" : " (pilih event yang cocok untuk angka per-event)"}
- Remaining / variance: **${rupiah(remaining)}**

## 2. Revenue, Receivable, Payable
- Tenant revenue paid / expected: **${rupiah(tenantPaid)} / ${rupiah(tenantExpected)}**
- Sponsor revenue paid / expected: **${rupiah(sponsorPaid)} / ${rupiah(sponsorExpected)}**
- Total revenue paid / expected: **${rupiah(revenuePaid)} / ${rupiah(revenueExpected)}**
- Receivable event: **${rupiah(receivable)}**${eventCommercial ? "" : " (fallback global tenant/sponsor outstanding; pilih event yang cocok untuk angka per-event)"}
- Payable event dari Expense_Submissions + Purchase_Orders: **${rupiah(payable)}**${eventCommercial ? "" : " (0/TBA karena event belum cocok ke data closeout)"}

## 3. Dokumentasi Media
- Media rows tercatat di Event_Media: **${mediaRows}**.
- Event selesai/closeout candidate tanpa media: **${context?.eventMissingMediaCount || 0}** dari **${context?.closeoutCandidateEvents || 0}** event kandidat.
- Link dokumentasi manual: ${data.documentation_url || "TBA — tambahkan Drive/Instagram/media link setelah diverifikasi."}

Jika media rows masih 0/TBA, closeout belum boleh dianggap lengkap untuk pemegang saham.

## 4. Lessons Learned
${data.lessons_learned || "TBA — isi setelah post-event review bersama PIC."}

## 5. Next Actions
${data.next_actions || "1. Validasi tenant/sponsor paid vs outstanding.\n2. Lengkapi proof expense dan invoice.\n3. Rekonsiliasi payable/receivable sebelum event ditutup."}

---
Draft internal systemswi — semua angka berasal dari Google Sheets context dan harus diverifikasi PIC Event/Finance sebelum dibagikan.
`;
}

function generateMonthlyGcgReport(data: Record<string, string>, letterNumber: string = "", date: string, context?: RabContext): string {
    return `
# MONTHLY GCG / TARIF REPORT
**Periode: ${data.period || "TBA"}**

---

**Nomor**: ${letterNumber || autoDocNumber("GCG-SWI")}
**Tanggal Laporan**: ${date}

## Executive Summary TARIF
Dokumen ini memakai Google Sheets sebagai source of truth. Jika angka belum tersedia, tampil **0/TBA** dan tidak boleh diganti dengan estimasi tanpa bukti.

## Transparency
- Expense pending: **${context?.expensePendingCount || 0}** item / **${rupiah(context?.expensePendingAmount || 0)}**.
- Expense needs proof / tanpa bukti lengkap: **${context?.expenseNeedsProofCount || 0}** item.
- Expense tanpa division/COA: **${context?.expenseWithoutDivisionCount || 0}** item.

## Accountability
- Governance_Audit_Log rows: **${context?.governanceAuditRows || 0}**.
- Approval/reject wajib punya actor, before/after status, notes, amount, division, dan proof URL jika ada.

## Responsibility
- Compliance open: **${context?.complianceOpenCount || 0}** item.
- Compliance overdue: **${context?.complianceOverdueCount || 0}** item.

## Independency
- Vendor exception/benchmark/COI perlu review: **${context?.vendorExceptionCount || 0}** vendor.
- Related-party vendor tercatat: **${context?.vendorRelatedPartyCount || 0}** vendor.

## Fairness & Etika Keuangan
- Hutang pemegang saham outstanding: **${rupiah(context?.shareholderDebtOutstanding || 0)}**.
- Personal-paid expense terdeteksi: **${rupiah(context?.personalPaidExpenseAmount || 0)}**.
- Personal-paid yang approved harus direkonsiliasi ke Shareholder_Ledger; jangan dianggap lunas tanpa bukti pembayaran.

## Catatan Direksi
${data.director_notes || "TBA"}

## Follow-up / Keputusan
${data.follow_up || "1. Review expense pending dan needs-proof.\n2. Lengkapi division/COA untuk expense material.\n3. Follow-up compliance overdue.\n4. Lengkapi vendor benchmark dan deklarasi conflict-of-interest."}

---
Draft internal systemswi — review Direksi/Finance sebelum dibagikan ke pemegang saham.
`;
}

function generateMonthlyReport(data: Record<string, string>, letterNumber: string = "", date: string, context?: RabContext): string {
    const financeInfo = context?.financeRows ? `Data keuangan: ${context.financeRows} baris Laporan_Bulanan.` : "Data keuangan: belum tersedia.";
    const commercialInfo = context?.tenantRows ? `Tenant: ${context.tenantRows} brands | Sponsor: ${context.sponsorRows || 0} companies` : "Data komersial: belum tersedia.";
    const budgetInfo = context?.totalBudget ? `\n**Total Budget (event)**: ${rupiah(context.totalBudget)}\n**Total Actual**: ${rupiah(context.totalActual || 0)}\n**Remaining**: ${rupiah(Math.max((context.totalBudget || 0) - (context.totalActual || 0), 0))}` : "";
    const eventTable = context?.eventBudgetSummary && context.eventBudgetSummary.length > 0
        ? `\n| Event | Budget | Actual | Remaining | Status |\n|-------|--------|--------|-----------|--------|\n${context.eventBudgetSummary.map(e => `| ${e.name} | ${rupiah(e.budget)} | ${rupiah(e.actual)} | ${rupiah(e.remaining)} | ${e.status} |`).join("\n")}\n`
        : "";
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
${budgetInfo}

## EVENT / FRAGRANTIONS
${data.event_notes || "TBA — cek tenant, sponsor, invoice/payment status, booth assignment, dan deadline timeline."}
${eventTable || ""}

## INVENTORY & PROCUREMENT
${data.inventory_notes || "TBA — cek stock minimum, PO terbuka, receiving goods, dan QC."}
${context?.inventoryRows ? `\nInventory: ${context.inventoryRows} items tracked.` : ""}

## DATA SOURCE
${financeInfo}
${commercialInfo}

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
