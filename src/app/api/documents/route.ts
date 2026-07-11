import { NextRequest, NextResponse } from "next/server";
import { generateDocumentContent, getTemplateByType, getAllTemplates, type RabContext } from "@/lib/document";
import type { DocumentType } from "@/lib/document";
import { readRange } from "@/lib/sheets/sheets-real";
import { EVENT_SHEETS, readEventSheet } from "@/lib/event/sheets";
import { googleWorkspaceDegradedSource, isGoogleWorkspaceAuthError } from "@/lib/api/google-workspace-error";

export const runtime = "nodejs";

type SheetContext = {
  financeRows: number;
  tenantRows: number;
  sponsorRows: number;
  inventoryRows: number;
  notes: string[];
  sourceStatus: "live" | "degraded";
  warning?: string;
  details?: string;
  budgetByCategory?: Record<string, number>;
  totalBudget?: number;
  totalActual?: number;
  eventBudgetSummary?: Array<{ name: string; budget: number; actual: number; remaining: number; status: string }>;
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
};

const text = (value: unknown) => String(value ?? "").trim();
const amount = (value: unknown) => {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  if (typeof value !== "string") return 0;
  const parsed = Number(value.replace(/[^\d.-]/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
};

function isDocumentType(value: string): value is DocumentType {
  return Boolean(getTemplateByType(value as DocumentType));
}

function validateRequired(type: DocumentType, data: Record<string, string>) {
  const template = getTemplateByType(type);
  if (!template) return ["Template not found"];
  return template.fields
    .filter((field) => field.required && !text(data[field.id]))
    .map((field) => `${field.label} wajib diisi`);
}

async function readContext(): Promise<SheetContext> {
  let googleAuthError: unknown = null;
  const emptyOnAuthError = (error: unknown): string[][] => {
    if (isGoogleWorkspaceAuthError(error)) {
      googleAuthError ||= error;
    }
    return [];
  };

  const [
    finance,
    tenants,
    sponsors,
    inventory,
    budgetCategories,
    eventBudget,
    expenseSubmissions,
    shareholderLedger,
    complianceRegister,
    vendorRegister,
    governanceAuditLog,
  ] = await Promise.all([
    readRange("Laporan_Bulanan!A1:P16").catch(emptyOnAuthError),
    readEventSheet(EVENT_SHEETS.Tenants).catch(emptyOnAuthError),
    readEventSheet(EVENT_SHEETS.Sponsors).catch(emptyOnAuthError),
    readRange("Inventory_Master!A1:O1000").catch(emptyOnAuthError),
    readRange("Budget_Categories!A1:D50").catch(emptyOnAuthError),
    readRange("Event_Budget!A1:H1000").catch(emptyOnAuthError),
    readRange("Expense_Submissions!A1:R1000").catch(emptyOnAuthError),
    readRange("Shareholder_Ledger!A1:M1000").catch(emptyOnAuthError),
    readRange("Compliance_Register!A1:J1000").catch(emptyOnAuthError),
    readRange("Vendor_Register!A1:L1000").catch(emptyOnAuthError),
    readRange("Governance_Audit_Log!A1:N1000").catch(emptyOnAuthError),
  ]);

  const unpaidTenants = tenants.slice(1).filter((row) => {
    const fee = amount(row[9]);
    const paid = amount(row[11]);
    return text(row[10]) !== "paid" && Math.max(fee - paid, 0) > 0;
  }).length;

  const followUpSponsors = sponsors.slice(1).filter((row) => {
    const status = text(row[11]) || "prospect";
    return !["paid", "cancelled"].includes(status) && amount(row[7]) > 0;
  }).length;

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

  const lowStock = inventory.slice(1).filter((row) => {
    const qty = amount(row[5]);
    const min = amount(row[6]);
    return text(row[0]) && min > 0 && qty <= min;
  }).length;

  // Aggregate budget data for RAB enrichment
  const budgetByCategory: Record<string, number> = {};
  let totalBudget = 0;
  let totalActual = 0;
  const eventBudgetSummary: Array<{ name: string; budget: number; actual: number; remaining: number; status: string }> = [];

  if (eventBudget.length > 1) {
    for (const row of eventBudget.slice(1)) {
      if (!row[0]) continue;
      const evtBudget = amount(row[3]);
      const evtActual = amount(row[4]);
      const evtRemaining = amount(row[5]);
      const evtStatus = text(row[6]) || "ok";
      totalBudget += evtBudget;
      totalActual += evtActual;
      eventBudgetSummary.push({
        name: text(row[1]) || text(row[0]),
        budget: evtBudget,
        actual: evtActual,
        remaining: evtRemaining,
        status: evtStatus,
      });
    }
  }

  if (budgetCategories.length > 1) {
    for (const row of budgetCategories.slice(1)) {
      if (!row[0] || !row[1]) continue;
      const catBudget = amount(row[2]);
      budgetByCategory[text(row[0])] = (budgetByCategory[text(row[0])] || 0) + catBudget;
    }
  }

  const expenseRows = expenseSubmissions.slice(1).filter((row) => text(row[0]));
  const expensePending = expenseRows.filter((row) => text(row[8]).toLowerCase() === "pending");
  const expenseNeedsProof = expenseRows.filter((row) => text(row[8]).toLowerCase() === "needs proof" || (amount(row[6]) > 0 && !text(row[7])));
  const expenseWithoutDivision = expenseRows.filter((row) => !text(row[12]));
  const personalPaidExpenses = expenseRows.filter((row) => text(row[14]).toLowerCase() === "personal paid" || ["yes", "true", "1"].includes(text(row[17]).toLowerCase()));

  const shareholderDebtOutstanding = shareholderLedger.slice(1).reduce((sum, row) => {
    const status = text(row[9]).toLowerCase();
    if (["rejected", "cancelled"].includes(status)) return sum;
    return sum + amount(row[6]) - amount(row[7]);
  }, 0);

  const complianceOpen = complianceRegister.slice(1).filter((row) => {
    const status = text(row[5]).toLowerCase();
    return text(row[0]) && !["submitted", "paid", "complete", "completed"].includes(status);
  });
  const today = new Date(`${new Date().toISOString().slice(0, 10)}T00:00:00Z`).getTime();
  const complianceOverdue = complianceOpen.filter((row) => {
    const due = text(row[4]);
    const dueTime = due ? new Date(`${due}T00:00:00Z`).getTime() : NaN;
    return Number.isFinite(dueTime) && dueTime < today;
  });

  const isRelated = (value: string) => ["yes", "ya", "true", "1"].includes(value.toLowerCase());
  const vendorRows = vendorRegister.slice(1).filter((row) => text(row[0]));
  const vendorRelatedParty = vendorRows.filter((row) => isRelated(text(row[4])));
  const vendorException = vendorRows.filter((row) => isRelated(text(row[4])) || !text(row[6]) || !text(row[7]) || !text(row[8]));

  const degraded = googleAuthError
    ? googleWorkspaceDegradedSource("Google Sheets context for Document Generator", googleAuthError)
    : null;

  return {
    financeRows: Math.max(finance.length - 1, 0),
    tenantRows: Math.max(tenants.length - 1, 0),
    sponsorRows: Math.max(sponsors.length - 1, 0),
    inventoryRows: Math.max(inventory.length - 1, 0),
    sourceStatus: degraded ? "degraded" : "live",
    warning: degraded?.warning,
    details: degraded?.details,
    budgetByCategory,
    totalBudget,
    totalActual,
    eventBudgetSummary,
    tenantOutstanding,
    sponsorPipelineValue,
    expensePendingCount: expensePending.length,
    expensePendingAmount: expensePending.reduce((sum, row) => sum + amount(row[6]), 0),
    expenseNeedsProofCount: expenseNeedsProof.length,
    expenseWithoutDivisionCount: expenseWithoutDivision.length,
    personalPaidExpenseAmount: personalPaidExpenses.reduce((sum, row) => sum + amount(row[6]), 0),
    shareholderDebtOutstanding,
    complianceOpenCount: complianceOpen.length,
    complianceOverdueCount: complianceOverdue.length,
    vendorExceptionCount: vendorException.length,
    vendorRelatedPartyCount: vendorRelatedParty.length,
    governanceAuditRows: Math.max(governanceAuditLog.length - 1, 0),
    notes: [
      `Finance source: Laporan_Bulanan (${Math.max(finance.length - 1, 0)} data rows).`,
      `Commercial source: Event_Tenants ${Math.max(tenants.length - 1, 0)} rows; ${unpaidTenants} tenant belum lunas.`,
      `Sponsor source: Event_Sponsors ${Math.max(sponsors.length - 1, 0)} rows; ${followUpSponsors} sponsor perlu follow-up.`,
      `Inventory source: Inventory_Master ${Math.max(inventory.length - 1, 0)} rows; ${lowStock} item low/critical.`,
      `Budget source: ${eventBudgetSummary.length} event budgets, total budget ${totalBudget.toLocaleString("id-ID")}.`,
      `GCG source: ${expenseRows.length} expenses, ${Math.max(governanceAuditLog.length - 1, 0)} governance audit rows, ${complianceOpen.length} open compliance items.`,
      ...(degraded ? [degraded.warning] : []),
    ],
  };
}

function appendContext(content: string, context: SheetContext) {
  return `${content.trim()}\n\n---\n\n## SYSTEMSWI DATA CONTEXT\n${context.notes.map((note) => `- ${note}`).join("\n")}\n\nSumber angka tetap Google Sheets; angka TBA/0 harus diverifikasi PIC sebelum dokumen dikirim eksternal.\n`;
}

export async function GET() {
  return NextResponse.json({
    source: "systemswi document generator",
    generatedAt: new Date().toISOString(),
    templates: getAllTemplates(),
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const rawType = text(body.type);
    const data = (body.data || {}) as Record<string, string>;

    if (!rawType || !isDocumentType(rawType)) {
      return NextResponse.json({ error: "type tidak valid", supportedTypes: getAllTemplates().map((t) => t.type) }, { status: 400 });
    }

    const missing = validateRequired(rawType, data);
    if (missing.length) {
      return NextResponse.json({ error: "Data belum lengkap", missing }, { status: 400 });
    }

    const context = await readContext();
    const rabContext: RabContext = {
      budgetByCategory: context.budgetByCategory,
      totalBudget: context.totalBudget,
      totalActual: context.totalActual,
      eventBudgetSummary: context.eventBudgetSummary,
      financeRows: context.financeRows,
      tenantRows: context.tenantRows,
      sponsorRows: context.sponsorRows,
      inventoryRows: context.inventoryRows,
      tenantOutstanding: context.tenantOutstanding,
      sponsorPipelineValue: context.sponsorPipelineValue,
      expensePendingCount: context.expensePendingCount,
      expensePendingAmount: context.expensePendingAmount,
      expenseNeedsProofCount: context.expenseNeedsProofCount,
      expenseWithoutDivisionCount: context.expenseWithoutDivisionCount,
      personalPaidExpenseAmount: context.personalPaidExpenseAmount,
      shareholderDebtOutstanding: context.shareholderDebtOutstanding,
      complianceOpenCount: context.complianceOpenCount,
      complianceOverdueCount: context.complianceOverdueCount,
      vendorExceptionCount: context.vendorExceptionCount,
      vendorRelatedPartyCount: context.vendorRelatedPartyCount,
      governanceAuditRows: context.governanceAuditRows,
    };
    const content = appendContext(generateDocumentContent(rawType, data, text(body.letterNumber), rabContext), context);
    const template = getTemplateByType(rawType);

    return NextResponse.json({
      success: true,
      source: "Google Sheets context + systemswi template",
      sourceStatus: context.sourceStatus,
      warning: context.warning,
      generatedAt: new Date().toISOString(),
      document: {
        id: `doc-${Date.now()}`,
        type: rawType,
        title: template?.name || rawType,
        content,
        letterNumber: text(body.letterNumber),
        createdAt: new Date().toISOString(),
        createdBy: "systemswi",
      },
      context,
    });
  } catch (error) {
    return NextResponse.json({ error: "Gagal generate dokumen", details: String(error) }, { status: 500 });
  }
}
