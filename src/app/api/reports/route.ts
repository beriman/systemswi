import { NextRequest, NextResponse } from "next/server";
import { googleWorkspaceDegradedSource, isGoogleWorkspaceAuthError } from "@/lib/api/google-workspace-error";
import { readRange, readSheet } from "@/lib/sheets/sheets-real";
import { EVENT_SHEETS, readEventSheet } from "@/lib/event/sheets";

export const runtime = "nodejs";

type ReportType = "weekly_dashboard" | "monthly_financial" | "quarterly_investor" | "annual_report";
type SourceStatus = "live" | "degraded";

type ReportTemplate = {
  type: ReportType;
  name: string;
  cadence: string;
  description: string;
  requiredFields: string[];
};

const REPORT_TYPES: ReportType[] = ["weekly_dashboard", "monthly_financial", "quarterly_investor", "annual_report"];

type ReportContext = {
  sourceStatus: SourceStatus;
  warning?: string;
  details?: string;
  financeRows: number;
  bankBalance: number;
  paidInCapital: number;
  outstandingCapital: number;
  eventCount: number;
  tenantOutstanding: number;
  sponsorPipelineValue: number;
  lowStockCount: number;
  openPoCount: number;
  complianceReviewCount: number;
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
    tenants,
    sponsors,
    inventory,
    purchaseOrders,
    complianceChecks,
    productBatches,
    qcChecklist,
  ] = await Promise.all([
    readSheet("RekeningKoran").catch(emptyOnAuthError),
    readSheet("PemegangSaham").catch(emptyOnAuthError),
    readSheet("LaporanBulanan").catch(emptyOnAuthError),
    readEventSheet(EVENT_SHEETS.Events).catch(emptyOnAuthError),
    readEventSheet(EVENT_SHEETS.Tenants).catch(emptyOnAuthError),
    readEventSheet(EVENT_SHEETS.Sponsors).catch(emptyOnAuthError),
    readRange("Inventory_Master!A1:O1000").catch(emptyOnAuthError),
    readRange("Purchase_Orders!A1:N1000").catch(emptyOnAuthError),
    readRange("Compliance_Checks!A1:L1000").catch(emptyOnAuthError),
    readRange("Product_Batches!A1:M1000").catch(emptyOnAuthError),
    readRange("QC_Checklist!A1:I1000").catch(emptyOnAuthError),
  ]);

  const bankBalance = rekeningKoran.slice(0, 3).reduce((sum, row) => sum + amount(row[4]), 0);
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

  const degraded = googleAuthError ? googleWorkspaceDegradedSource("Google Sheets report context", googleAuthError) : null;

  return {
    sourceStatus: degraded ? "degraded" : "live",
    warning: degraded?.warning,
    details: degraded?.details,
    financeRows: Math.max(laporanBulanan.length - 1, 0),
    bankBalance,
    paidInCapital,
    outstandingCapital,
    eventCount: Math.max(events.length - 1, 0),
    tenantOutstanding,
    sponsorPipelineValue,
    lowStockCount,
    openPoCount,
    complianceReviewCount,
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

  const investorSection = type === "quarterly_investor" || type === "annual_report"
    ? `\n## Investor / Governance Notes\n- Modal disetor: **${rupiah(context.paidInCapital)}**.\n- Sisa kewajiban modal: **${rupiah(context.outstandingCapital)}**.\n- Angka proyeksi/yield tetap draft dan perlu review direksi/konsultan sebelum dibagikan eksternal.\n`
    : "";

  const annualSection = type === "annual_report"
    ? `\n## Annual Report Template\n### 1. Profil Perusahaan & Governance\n- Profil PT Sensasi Wangi Indonesia, struktur holding, brand, event, dan unit operasional.\n- Struktur pemegang saham, modal ditempatkan, modal disetor, dan sisa kewajiban modal.\n\n### 2. Ringkasan Kinerja Finansial\n- Saldo bank: **${rupiah(context.bankBalance)}** (bukan setoran modal).\n- Modal disetor: **${rupiah(context.paidInCapital)}**; outstanding modal: **${rupiah(context.outstandingCapital)}**.\n- Data revenue/expense final harus ditarik dari Laporan_Bulanan dan divalidasi finance.\n\n### 3. Kinerja Event & Commercial Pipeline\n- Event tercatat: **${context.eventCount}**.\n- Tenant outstanding: **${rupiah(context.tenantOutstanding)}**.\n- Sponsor pipeline aktif: **${rupiah(context.sponsorPipelineValue)}**.\n- Pipeline bukan revenue final sampai invoice paid dan bukti pembayaran tersedia.\n\n### 4. Operasi, Inventory, Procurement, Compliance\n- Low-stock item: **${context.lowStockCount}**.\n- Open PO: **${context.openPoCount}**.\n- Compliance/QC perlu review: **${context.complianceReviewCount}**.\n\n### 5. Risiko, Mitigasi, dan Prioritas Tahun Berikutnya\n- Risiko kas/modal: validasi bank mingguan dan follow-up sisa kewajiban modal.\n- Risiko event: percepat collection tenant/sponsor dan booth assignment.\n- Risiko supply chain: tutup PO terbuka dan update receiving/QC.\n- Risiko compliance: semua formula/batch harus melalui SDS/COA/BPOM/IFRA review sebelum klaim eksternal.\n\n### Annual Report Readiness Checklist\n- [ ] Finance close tahunan selesai.\n- [ ] Rekening koran cocok dengan dashboard.\n- [ ] Pipeline event dipisahkan antara paid, outstanding, dan draft.\n- [ ] Inventory/procurement opname diverifikasi operator.\n- [ ] Compliance/QC register selesai direview.\n- [ ] Direksi menyetujui versi final sebelum publikasi.\n`
    : "";

  return `# ${title}\nPeriode: **${period || "TBA"}**\nGenerated: ${context.generatedAt}\n${verification}\n## Executive Snapshot\n- Saldo bank terpantau: **${rupiah(context.bankBalance)}**.\n- Modal disetor: **${rupiah(context.paidInCapital)}**; sisa kewajiban modal: **${rupiah(context.outstandingCapital)}**.\n- Event tercatat: **${context.eventCount}**; outstanding tenant: **${rupiah(context.tenantOutstanding)}**; pipeline sponsor aktif: **${rupiah(context.sponsorPipelineValue)}**.\n- Risiko operasional: **${context.lowStockCount}** low-stock item, **${context.openPoCount}** open PO, **${context.complianceReviewCount}** compliance/QC item perlu review.\n\n## Finance\n- Data finance dibaca dari Laporan_Bulanan (${context.financeRows} rows) + Rekening_Koran + PemegangSaham.\n- Jangan samakan saldo bank dengan setoran modal; keduanya ditampilkan terpisah untuk mencegah salah tafsir.\n\n## Event Commercial\n- Tenant outstanding perlu follow-up sebelum jatuh tempo invoice.\n- Sponsor pipeline bernilai uang hanya komitmen/pipeline, bukan revenue final sampai status paid.\n\n## Operations\n- Low stock dan open PO perlu ditutup lewat Inventory/Procurement.\n- Item compliance/QC perlu validasi SDS/COA/BPOM/IFRA sebelum produksi/penjualan.\n${quarterlySection}${investorSection}${annualSection}\n## Catatan Operator\n${notes || "TBA — tambahkan insight manual dari rapat mingguan/bulanan sebelum dikirim."}\n\n---\nDokumen ini adalah draft internal systemswi. Semua angka final harus diverifikasi ke Google Sheets dan approval PIC terkait sebelum publikasi.\n`;
}

export async function GET() {
  return NextResponse.json({
    source: "systemswi reports generator",
    generatedAt: new Date().toISOString(),
    templates: REPORT_TEMPLATES,
    automation: {
      supportedAction: "generate_all",
      description: "Generate weekly, monthly, quarterly investor, dan annual draft dalam satu request tanpa menulis ke Google Drive/Docs.",
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
