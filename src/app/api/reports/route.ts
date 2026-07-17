import { NextRequest, NextResponse } from "next/server";
import { googleWorkspaceDegradedSource, isGoogleWorkspaceAuthError } from "@/lib/api/google-workspace-error";
import { readRange, readSheet } from "@/lib/sheets/sheets-real";
import { EVENT_SHEETS, readEventSheet } from "@/lib/event/sheets";
import { logGovernanceActionSafe } from "@/lib/governance/audit";
import { appendMonthlyGcgReportSnapshot } from "@/lib/governance/monthly-gcg-report";

export const runtime = "nodejs";

type ReportType = "weekly_dashboard" | "monthly_financial" | "monthly_gcg" | "quarterly_investor" | "annual_report";
type SourceStatus = "live" | "degraded";

type ReportTemplate = {
  type: ReportType;
  name: string;
  cadence: string;
  description: string;
  requiredFields: string[];
};

const REPORT_TYPES: ReportType[] = ["weekly_dashboard", "monthly_financial", "monthly_gcg", "quarterly_investor", "annual_report"];

type ReportContext = {
  sourceStatus: SourceStatus;
  warning?: string;
  details?: string;
  financeRows: number;
  bankBalance: number;
  paidInCapital: number;
  outstandingCapital: number;
  eventCount: number;
  eventBudgetRows: number;
  eventOverBudgetRows: number;
  eventOverBudgetWithoutNotes: number;
  tenantOutstanding: number;
  sponsorPipelineValue: number;
  lowStockCount: number;
  openPoCount: number;
  complianceReviewCount: number;
  expensePendingCount: number;
  expensePendingAmount: number;
  expenseNeedsProofCount: number;
  expenseWithoutDivisionCount: number;
  personalPaidExpenseAmount: number;
  shareholderDebtOutstanding: number;
  complianceOpenCount: number;
  complianceOverdueCount: number;
  complianceCompletedWithoutProofCount: number;
  vendorExceptionCount: number;
  vendorRelatedPartyCount: number;
  governanceAuditRows: number;
  generatedAt: string;
};

const REPORT_TEMPLATES: ReportTemplate[] = [
  {
    type: "weekly_dashboard",
    name: "Weekly Dashboard",
    cadence: "Mingguan",
    description: "Ringkasan eksekutif mingguan lintas finance, event, inventory, procurement, dan compliance.",
    requiredFields: ["period"],
  },
  {
    type: "monthly_financial",
    name: "Monthly Financial Report",
    cadence: "Bulanan",
    description: "Draft laporan bulanan untuk direksi dengan KPI kas, modal disetor, pipeline event, dan risiko operasional.",
    requiredFields: ["period"],
  },
  {
    type: "monthly_gcg",
    name: "Monthly GCG Report",
    cadence: "Bulanan",
    description: "Ringkasan TARIF/GCG: expense approval, audit trail, shareholder debt, compliance, vendor independency, dan exceptions berbasis Google Sheets.",
    requiredFields: ["period"],
  },
  {
    type: "quarterly_investor",
    name: "Quarterly Investor Update",
    cadence: "Kuartalan",
    description: "Update investor kuartalan konservatif: progress modal, event, brand/operasi, risiko, dan next action.",
    requiredFields: ["period"],
  },
  {
    type: "annual_report",
    name: "Annual Report Draft",
    cadence: "Tahunan",
    description: "Kerangka annual report berbasis Google Sheets; angka TBA/0 perlu verifikasi sebelum publikasi.",
    requiredFields: ["year"],
  },
];

const text = (value: unknown) => String(value ?? "").trim();
const amount = (value: unknown) => {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  if (typeof value !== "string") return 0;
  const parsed = Number(value.replace(/[^\d.-]/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
};
const rupiah = (value: number) => `Rp ${Math.round(value).toLocaleString("id-ID")}`;

function isReportType(value: string): value is ReportType {
  return REPORT_TEMPLATES.some((template) => template.type === value);
}

function defaultPeriodFor(type: ReportType, fallback: string) {
  if (fallback) return fallback;
  const now = new Date();
  if (type === "annual_report") return String(now.getFullYear());
  return now.toLocaleDateString("id-ID", { month: "long", year: "numeric" });
}

function isShareholderRow(row: string[]) {
  return /^\d+$/.test(text(row[0])) && Boolean(text(row[1]));
}

function parseRekeningKoranBalance(rows: string[][]): number {
  let explicitTotal = 0;
  const accountBalances: number[] = [];

  for (const row of rows) {
    const first = text(row[0]).toLowerCase();
    const second = text(row[1]);
    const third = text(row[2]).toLowerCase();
    const saldoAwal = amount(row[3]);
    const saldoAkhir = amount(row[4]);

    // Rekening_Koran contains a summary row where column C is "Total" and
    // column E is total ending balance. Prefer it when present so the report
    // does not depend on a fixed row count.
    if ((!first || first === "total") && third === "total" && saldoAkhir) {
      explicitTotal = saldoAkhir;
      continue;
    }

    const isHeader = ["nama bank", "tanggal", "rekening koran", "mutasi rekening"].includes(first) || first.startsWith("per ");
    const looksLikeAccountRow = row.length >= 5 && Boolean(row[0]) && !isHeader && !second.startsWith("SA") && (saldoAwal || saldoAkhir || text(row[2]));
    if (looksLikeAccountRow && saldoAkhir) accountBalances.push(saldoAkhir);
  }

  return explicitTotal || accountBalances.reduce((sum, value) => sum + value, 0);
}

async function readContext(): Promise<ReportContext> {
  let googleAuthError: unknown = null;
  const emptyOnAuthError = (error: unknown): string[][] => {
    if (isGoogleWorkspaceAuthError(error)) googleAuthError ||= error;
    return [];
  };

  const [
    rekeningKoran,
    pemegangSaham,
    laporanBulanan,
    events,
    eventBudget,
    tenants,
    sponsors,
    inventory,
    purchaseOrders,
    complianceChecks,
    productBatches,
    qcChecklist,
    expenseSubmissions,
    shareholderLedger,
    complianceRegister,
    vendorRegister,
    governanceAuditLog,
  ] = await Promise.all([
    readSheet("RekeningKoran").catch(emptyOnAuthError),
    readSheet("PemegangSaham").catch(emptyOnAuthError),
    readSheet("LaporanBulanan").catch(emptyOnAuthError),
    readEventSheet(EVENT_SHEETS.Events).catch(emptyOnAuthError),
    readRange("Event_Budget!A1:H1000").catch(emptyOnAuthError),
    readEventSheet(EVENT_SHEETS.Tenants).catch(emptyOnAuthError),
    readEventSheet(EVENT_SHEETS.Sponsors).catch(emptyOnAuthError),
    readRange("Inventory_Master!A1:O1000").catch(emptyOnAuthError),
    readRange("Purchase_Orders!A1:N1000").catch(emptyOnAuthError),
    readRange("Compliance_Checks!A1:L1000").catch(emptyOnAuthError),
    readRange("Product_Batches!A1:M1000").catch(emptyOnAuthError),
    readRange("QC_Checklist!A1:I1000").catch(emptyOnAuthError),
    readSheet("ExpenseSubmissions").catch(emptyOnAuthError),
    readSheet("ShareholderLedger").catch(emptyOnAuthError),
    readSheet("ComplianceRegister").catch(emptyOnAuthError),
    readSheet("VendorRegister").catch(emptyOnAuthError),
    readSheet("GovernanceAuditLog").catch(emptyOnAuthError),
  ]);

  const bankBalance = parseRekeningKoranBalance(rekeningKoran);
  const shareholders = pemegangSaham.filter(isShareholderRow);
  const paidInCapital = shareholders.reduce((sum, row) => sum + amount(row[6]), 0);
  const outstandingCapital = shareholders.reduce((sum, row) => {
    const obligation = amount(row[5] || row[3]);
    const paid = amount(row[6]);
    return sum + (amount(row[7]) || Math.max(obligation - paid, 0));
  }, 0);

  const tenantOutstanding = tenants.slice(1).reduce((sum, row) => {
    const status = text(row[10]).toLowerCase();
    if (["paid", "cancelled"].includes(status)) return sum;
    return sum + Math.max(amount(row[9]) - amount(row[11]), 0);
  }, 0);

  const sponsorPipelineValue = sponsors.slice(1).reduce((sum, row) => {
    const status = text(row[11]).toLowerCase();
    if (["paid", "cancelled", "rejected"].includes(status)) return sum;
    return sum + amount(row[7]);
  }, 0);

  const eventRows = events.slice(1).filter((row) => text(row[0]));
  const eventBudgetRows = eventBudget.slice(1).filter((row) => text(row[0]));
  const eventBudgetOverActual = eventBudgetRows.filter((row) => amount(row[5]) > amount(row[4]) && amount(row[4]) > 0);
  const eventBudgetOverActualWithoutNotes = eventBudgetOverActual.filter((row) => !text(row[6]));
  const eventsOverBudget = eventRows.filter((row) => amount(row[13]) > amount(row[12]) && amount(row[12]) > 0);
  const eventsOverBudgetWithoutNotes = eventsOverBudget.filter((row) => !text(row[19]));

  const lowStockCount = inventory.slice(1).filter((row) => {
    const qty = amount(row[5]);
    const min = amount(row[6]);
    return text(row[0]) && min > 0 && qty <= min;
  }).length;

  const openPoCount = purchaseOrders.slice(1).filter((row) => {
    const status = text(row[10]).toLowerCase();
    return text(row[0]) && !["received", "cancelled", "closed"].includes(status);
  }).length;

  const complianceReviewCount = [
    ...complianceChecks.slice(1).filter((row) => text(row[1]) && text(row[5]).toLowerCase() !== "passed"),
    ...productBatches.slice(1).filter((row) => {
      const qc = text(row[7]).toLowerCase();
      const trace = text(row[8]).toLowerCase();
      return text(row[1]) && !(qc === "passed" && ["complete", "completed", "done"].includes(trace));
    }),
    ...qcChecklist.slice(1).filter((row) => {
      const result = text(row[5]).toLowerCase();
      return text(row[2]) && ["failed", "pending", "needs_review", "review"].includes(result);
    }),
  ].length;

  const expenseRows = expenseSubmissions.slice(1).filter((row) => text(row[0]));
  const expensePending = expenseRows.filter((row) => text(row[8]).toLowerCase() === "pending");
  const expenseNeedsProof = expenseRows.filter((row) => text(row[8]).toLowerCase() === "needs proof" || (amount(row[6]) > 0 && !text(row[7])));
  const expenseWithoutDivision = expenseRows.filter((row) => !text(row[12]));
  const personalPaidExpenses = expenseRows.filter((row) => text(row[14]).toLowerCase() === "personal paid" || ["yes", "true", "1"].includes(text(row[17]).toLowerCase()));

  const shareholderDebtOutstanding = shareholderLedger.slice(1).reduce((sum, row) => {
    const status = text(row[9]).toLowerCase();
    if (status && ["rejected", "cancelled"].includes(status)) return sum;
    return sum + amount(row[6]) - amount(row[7]);
  }, 0);

  const complianceOpen = complianceRegister.slice(1).filter((row) => {
    const status = text(row[5]).toLowerCase();
    return text(row[0]) && !["submitted", "paid", "complete", "completed"].includes(status);
  });
  const complianceCompletedWithoutProof = complianceRegister.slice(1).filter((row) => {
    const status = text(row[5]).toLowerCase();
    return text(row[0]) && ["submitted", "paid", "complete", "completed"].includes(status) && !text(row[7]);
  });
  const today = new Date(`${new Date().toISOString().slice(0, 10)}T00:00:00Z`).getTime();
  const complianceOverdueCount = complianceOpen.filter((row) => {
    const due = text(row[4]);
    if (!due) return false;
    const dueTime = new Date(`${due}T00:00:00Z`).getTime();
    return Number.isFinite(dueTime) && dueTime < today;
  }).length;

  const vendorRows = vendorRegister.slice(1).filter((row) => text(row[0]));
  const vendorRelatedParty = vendorRows.filter((row) => ["yes", "ya", "true", "1"].includes(text(row[4]).toLowerCase()));
  const vendorExceptionCount = vendorRows.filter((row) => {
    const related = ["yes", "ya", "true", "1"].includes(text(row[4]).toLowerCase());
    const missingBenchmark = !text(row[6]) || !text(row[7]) || !text(row[8]);
    const missingPaymentTerm = !text(row[9]) || ["tba", "belum dicatat", "belum tersedia"].some((marker) => text(row[9]).toLowerCase().includes(marker));
    return related || missingBenchmark || missingPaymentTerm;
  }).length;

  const degraded = googleAuthError ? googleWorkspaceDegradedSource("Google Sheets report context", googleAuthError) : null;

  return {
    sourceStatus: degraded ? "degraded" : "live",
    warning: degraded?.warning,
    details: degraded?.details,
    financeRows: Math.max(laporanBulanan.length - 1, 0),
    bankBalance,
    paidInCapital,
    outstandingCapital,
    eventCount: eventRows.length,
    eventBudgetRows: eventBudgetRows.length,
    eventOverBudgetRows: eventBudgetOverActual.length + eventsOverBudget.length,
    eventOverBudgetWithoutNotes: eventBudgetOverActualWithoutNotes.length + eventsOverBudgetWithoutNotes.length,
    tenantOutstanding,
    sponsorPipelineValue,
    lowStockCount,
    openPoCount,
    complianceReviewCount,
    expensePendingCount: expensePending.length,
    expensePendingAmount: expensePending.reduce((sum, row) => sum + amount(row[6]), 0),
    expenseNeedsProofCount: expenseNeedsProof.length,
    expenseWithoutDivisionCount: expenseWithoutDivision.length,
    personalPaidExpenseAmount: personalPaidExpenses.reduce((sum, row) => sum + amount(row[6]), 0),
    shareholderDebtOutstanding,
    complianceOpenCount: complianceOpen.length,
    complianceOverdueCount,
    complianceCompletedWithoutProofCount: complianceCompletedWithoutProof.length,
    vendorExceptionCount,
    vendorRelatedPartyCount: vendorRelatedParty.length,
    governanceAuditRows: Math.max(governanceAuditLog.length - 1, 0),
    generatedAt: new Date().toISOString(),
  };
}

function generateReport(type: ReportType, period: string, context: ReportContext, notes: string) {
  const title = REPORT_TEMPLATES.find((template) => template.type === type)?.name || type;
  const verification = context.sourceStatus === "degraded"
    ? `\n> ⚠️ Source degraded: ${context.warning}\n`
    : "\n> Source: Google Sheets live via systemswi API.\n";

  const quarterlySection = type === "quarterly_investor"
    ? `\n## Quarterly Investor Update\n### Progress Kuartal\n- Finance: saldo bank dan modal disetor disajikan terpisah agar investor tidak salah membaca kas operasional sebagai modal.\n- Event/Fragrantions: tenant outstanding dan sponsor pipeline masih diklasifikasi sebagai piutang/pipeline sampai status paid.\n- Operasional: low-stock, open PO, dan compliance/QC review menjadi indikator risiko eksekusi kuartal ini.\n\n### Investor Readiness Checklist\n- [ ] Direksi mengonfirmasi angka modal disetor dan sisa kewajiban.\n- [ ] Finance mengonfirmasi saldo bank terhadap rekening koran.\n- [ ] PIC Event mengonfirmasi tenant/sponsor paid vs outstanding.\n- [ ] Operasional mengonfirmasi status inventory, PO, dan QC.\n- [ ] Legal/finance review sebelum dibagikan ke pihak eksternal.\n` : "";

  const monthlyGcgSection = type === "monthly_gcg"
    ? `\n## Monthly GCG / TARIF Summary\n### Transparency\n- Expense pending: **${context.expensePendingCount}** item / **${rupiah(context.expensePendingAmount)}**.\n- Expense needs proof / tanpa bukti lengkap: **${context.expenseNeedsProofCount}** item.\n- Expense tanpa division: **${context.expenseWithoutDivisionCount}** item.\n\n### Accountability\n- Governance audit trail tercatat: **${context.governanceAuditRows}** baris.\n- Approval/reject manusia harus tercatat di Governance_Audit_Log; jika 0, treat sebagai gap audit, bukan berarti aman.\n\n### Responsibility\n- Compliance open: **${context.complianceOpenCount}** item.\n- Compliance overdue: **${context.complianceOverdueCount}** item.\n- Compliance selesai tanpa Source Proof: **${context.complianceCompletedWithoutProofCount}** item.\n\n### Independency\n- Vendor exception/benchmark/COI perlu review: **${context.vendorExceptionCount}** vendor.\n- Related-party vendor tercatat: **${context.vendorRelatedPartyCount}** vendor.\n\n### Fairness & Etika Keuangan\n- Hutang pemegang saham outstanding: **${rupiah(context.shareholderDebtOutstanding)}**.\n- Personal-paid expense terdeteksi: **${rupiah(context.personalPaidExpenseAmount)}**.\n- Angka personal-paid harus direkonsiliasi ke Shareholder_Ledger setelah approved; jangan dianggap lunas tanpa proof/payment record.\n\n### Event Closeout Control\n- Event tercatat: **${context.eventCount}**; baris Event_Budget: **${context.eventBudgetRows}**.\n- Event/budget row over-budget: **${context.eventOverBudgetRows}**.\n- Over-budget tanpa catatan closeout/notes: **${context.eventOverBudgetWithoutNotes}**.\n- Angka event memakai Event_Budget + Events; receivable/payable tetap perlu validasi invoice/proof sebelum final.\n\n### TARIF Exceptions untuk Follow-up\n- [ ] Review expense pending dan needs-proof.\n- [ ] Lengkapi division/COA untuk semua expense material.\n- [ ] Cocokkan personal-paid expense dengan Shareholder_Ledger.\n- [ ] Follow-up compliance overdue/due soon.\n- [ ] Upload Source Proof untuk compliance yang sudah Submitted/Paid/Complete.\n- [ ] Lengkapi benchmark vendor dan deklarasi conflict-of-interest.\n- [ ] Lengkapi closeout notes untuk event over-budget.\n` : "";

  const investorSection = type === "quarterly_investor" || type === "annual_report"
    ? `\n## Investor / Governance Notes\n- Modal disetor: **${rupiah(context.paidInCapital)}**.\n- Sisa kewajiban modal: **${rupiah(context.outstandingCapital)}**.\n- Angka proyeksi/yield tetap draft dan perlu review direksi/konsultan sebelum dibagikan eksternal.\n`
    : "";

  const annualSection = type === "annual_report"
    ? `\n## Annual Report Template\n### 1. Profil Perusahaan & Governance\n- Profil PT Sensasi Wangi Indonesia, struktur holding, brand, event, dan unit operasional.\n- Struktur pemegang saham, modal ditempatkan, modal disetor, dan sisa kewajiban modal.\n\n### 2. Ringkasan Kinerja Finansial\n- Saldo bank: **${rupiah(context.bankBalance)}** (bukan setoran modal).\n- Modal disetor: **${rupiah(context.paidInCapital)}**; outstanding modal: **${rupiah(context.outstandingCapital)}**.\n- Data revenue/expense final harus ditarik dari Laporan_Bulanan dan divalidasi finance.\n\n### 3. Kinerja Event & Commercial Pipeline\n- Event tercatat: **${context.eventCount}**.\n- Tenant outstanding: **${rupiah(context.tenantOutstanding)}**.\n- Sponsor pipeline aktif: **${rupiah(context.sponsorPipelineValue)}**.\n- Pipeline bukan revenue final sampai invoice paid dan bukti pembayaran tersedia.\n\n### 4. Operasi, Inventory, Procurement, Compliance\n- Low-stock item: **${context.lowStockCount}**.\n- Open PO: **${context.openPoCount}**.\n- Compliance/QC perlu review: **${context.complianceReviewCount}**.\n\n### 5. Risiko, Mitigasi, dan Prioritas Tahun Berikutnya\n- Risiko kas/modal: validasi bank mingguan dan follow-up sisa kewajiban modal.\n- Risiko event: percepat collection tenant/sponsor dan booth assignment.\n- Risiko supply chain: tutup PO terbuka dan update receiving/QC.\n- Risiko compliance: semua formula/batch harus melalui SDS/COA/BPOM/IFRA review sebelum klaim eksternal.\n\n### Annual Report Readiness Checklist\n- [ ] Finance close tahunan selesai.\n- [ ] Rekening koran cocok dengan dashboard.\n- [ ] Pipeline event dipisahkan antara paid, outstanding, dan draft.\n- [ ] Inventory/procurement opname diverifikasi operator.\n- [ ] Compliance/QC register selesai direview.\n- [ ] Direksi menyetujui versi final sebelum publikasi.\n`
    : "";

  return `# ${title}\nPeriode: **${period || "TBA"}**\nGenerated: ${context.generatedAt}\n${verification}\n## Executive Snapshot\n- Saldo bank terpantau: **${rupiah(context.bankBalance)}**.\n- Modal disetor: **${rupiah(context.paidInCapital)}**; sisa kewajiban modal: **${rupiah(context.outstandingCapital)}**.\n- Event tercatat: **${context.eventCount}**; outstanding tenant: **${rupiah(context.tenantOutstanding)}**; pipeline sponsor aktif: **${rupiah(context.sponsorPipelineValue)}**.\n- Risiko operasional: **${context.lowStockCount}** low-stock item, **${context.openPoCount}** open PO, **${context.complianceReviewCount}** compliance/QC item perlu review.\n\n## Finance\n- Data finance dibaca dari Laporan_Bulanan (${context.financeRows} rows) + Rekening_Koran + PemegangSaham.\n- Jangan samakan saldo bank dengan setoran modal; keduanya ditampilkan terpisah untuk mencegah salah tafsir.\n\n## Event Commercial\n- Tenant outstanding perlu follow-up sebelum jatuh tempo invoice.\n- Sponsor pipeline bernilai uang hanya komitmen/pipeline, bukan revenue final sampai status paid.\n\n## Operations\n- Low stock dan open PO perlu ditutup lewat Inventory/Procurement.\n- Item compliance/QC perlu validasi SDS/COA/BPOM/IFRA sebelum produksi/penjualan.\n${quarterlySection}${monthlyGcgSection}${investorSection}${annualSection}\n## Catatan Operator\n${notes || "TBA — tambahkan insight manual dari rapat mingguan/bulanan sebelum dikirim."}\n\n---\nDokumen ini adalah draft internal systemswi. Semua angka final harus diverifikasi ke Google Sheets dan approval PIC terkait sebelum publikasi.\n`;
}

export async function GET() {
  return NextResponse.json({
    status: "ok",
    source: "Google Sheets context + systemswi reports generator",
    generatedAt: new Date().toISOString(),
    message: "Endpoint ready. Use POST to generate reports or record a Monthly GCG snapshot.",
    supportedTypes: REPORT_TEMPLATES,
    actions: {
      generateOne: {
        method: "POST",
        body: { type: "monthly_gcg", period: "Juli 2026", notes: "optional human notes" },
        note: "Returns a draft report from live Google Sheets context; does not write to Sheets.",
      },
      generateAll: {
        method: "POST",
        body: { action: "generate_all", period: "Juli 2026", notes: "optional human notes" },
        note: "Returns all report drafts in one response; does not write to Sheets.",
      },
      recordMonthlyGcg: {
        method: "POST",
        body: { action: "record_monthly_gcg", period: "Juli 2026", actor: "Beriman Juliano", role: "Direktur", notes: "review manusia wajib sebelum distribusi" },
        note: "Writes a Monthly_GCG_Report row and Governance_Audit_Log entry only when Google Sheets sourceStatus is live.",
      },
    },
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const action = text(body.action);
    const type = text(body.type);
    const period = text(body.period || body.year);
    const notes = text(body.notes);

    if (action === "generate_all") {
      const context = await readContext();
      const reports = REPORT_TYPES.map((reportType) => {
        const reportPeriod = defaultPeriodFor(reportType, period);
        return {
          id: `report-${reportType}-${Date.now()}`,
          type: reportType,
          title: REPORT_TEMPLATES.find((template) => template.type === reportType)?.name || reportType,
          period: reportPeriod,
          content: generateReport(reportType, reportPeriod, context, notes),
          createdAt: new Date().toISOString(),
          createdBy: "systemswi",
        };
      });

      return NextResponse.json({
        success: true,
        source: "Google Sheets context + systemswi reports generator",
        sourceStatus: context.sourceStatus,
        warning: context.warning,
        generatedAt: new Date().toISOString(),
        reports,
        summary: {
          totalReports: reports.length,
          types: reports.map((report) => report.type),
          markers: ["Executive Snapshot", "Investor Readiness Checklist", "Annual Report Template"],
        },
        context,
      }, { status: 201 });
    }

    if (action === "record_monthly_gcg") {
      const reportPeriod = defaultPeriodFor("monthly_gcg", period);
      const context = await readContext();
      if (context.sourceStatus !== "live") {
        return NextResponse.json({
          success: false,
          sourceStatus: "blocked",
          warning: context.warning || "Google Sheets source degraded; Monthly_GCG_Report tidak ditulis agar tidak mencatat snapshot kosong/TBA sebagai laporan resmi.",
          details: context.details,
        }, { status: 200 });
      }

      const row = await appendMonthlyGcgReportSnapshot({
        period: reportPeriod,
        generatedAt: context.generatedAt,
        createdBy: text(body.createdBy || body.actor || "systemswi"),
        status: text(body.status || "Draft - Needs Human Review"),
        expensePendingCount: context.expensePendingCount,
        expenseNeedsProofCount: context.expenseNeedsProofCount,
        shareholderDebtOutstanding: context.shareholderDebtOutstanding,
        complianceOverdueCount: context.complianceOverdueCount,
        vendorExceptionCount: context.vendorExceptionCount,
        governanceAuditRows: context.governanceAuditRows,
        notes: notes || `Snapshot Monthly GCG/TARIF dibuat dari Google Sheets live context; review manusia wajib sebelum distribusi ke pemegang saham. Compliance selesai tanpa Source Proof: ${context.complianceCompletedWithoutProofCount}.`,
        sourceModule: "/api/reports",
      });

      await logGovernanceActionSafe({
        actor: text(body.actor || body.createdBy || "systemswi"),
        role: text(body.role || "Governance Reporter"),
        action: "RECORD_MONTHLY_GCG_REPORT",
        entityType: "Monthly GCG Report",
        entityId: String(row[0] || reportPeriod),
        amount: context.shareholderDebtOutstanding,
        division: "Holding",
        before: "Not recorded",
        after: String(row[4] || "Draft - Needs Human Review"),
        reason: notes || `Monthly GCG snapshot ${reportPeriod}`,
        proofUrl: "",
        sourceModule: "/api/reports",
      });

      return NextResponse.json({
        success: true,
        source: "Google Sheets: Monthly_GCG_Report",
        sourceStatus: "live",
        generatedAt: new Date().toISOString(),
        reportLog: {
          id: row[0],
          period: row[1],
          status: row[4],
          row,
        },
        context,
      }, { status: 201 });
    }

    if (!isReportType(type)) {
      return NextResponse.json({ error: "type tidak valid", supportedTypes: REPORT_TEMPLATES.map((template) => template.type) }, { status: 400 });
    }
    if (!period) {
      return NextResponse.json({ error: "period/year wajib diisi" }, { status: 400 });
    }

    const context = await readContext();
    const content = generateReport(type, period, context, notes);
    return NextResponse.json({
      success: true,
      source: "Google Sheets context + systemswi reports generator",
      sourceStatus: context.sourceStatus,
      warning: context.warning,
      generatedAt: new Date().toISOString(),
      report: {
        id: `report-${type}-${Date.now()}`,
        type,
        title: REPORT_TEMPLATES.find((template) => template.type === type)?.name || type,
        period,
        content,
        createdAt: new Date().toISOString(),
        createdBy: "systemswi",
      },
      context,
    }, { status: 201 });
  } catch (error) {
    if (isGoogleWorkspaceAuthError(error)) {
      const degraded = googleWorkspaceDegradedSource("Google Sheets report context", error);
      return NextResponse.json({
        success: false,
        sourceStatus: "blocked",
        warning: degraded.warning,
        details: degraded.details,
        report: null,
        reports: [],
      }, { status: 200 });
    }
    return NextResponse.json({ error: "Gagal generate report", details: String(error) }, { status: 500 });
  }
}
