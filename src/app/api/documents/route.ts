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
  complianceCompletedWithoutProofCount?: number;
  vendorExceptionCount?: number;
  vendorRelatedPartyCount?: number;
  governanceAuditRows?: number;
  eventMediaRows?: number;
  closeoutCandidateEvents?: number;
  eventMissingMediaCount?: number;
  eventOverBudgetRows?: number;
  eventOverBudgetWithoutNotes?: number;
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
    expensesWithoutProof: number;
    expensesNeedsProof: number;
    personalPaidExpenses: number;
  }>;
};

const text = (value: unknown) => String(value ?? "").trim();
const amount = (value: unknown) => {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  if (typeof value !== "string") return 0;
  const parsed = Number(value.replace(/[^\d.-]/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
};

function columnIndex(headers: string[], names: string[], fallback: number): number {
  for (const name of names) {
    const index = headers.findIndex((header) => header === name);
    if (index >= 0) return index;
  }
  return fallback;
}

function isPersonalPaidPaymentMethod(value: unknown): boolean {
  return ["personal paid", "dibayar pribadi", "pribadi", "shareholder paid"].includes(text(value).toLowerCase());
}

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
    events,
    expenseSubmissions,
    shareholderLedger,
    complianceRegister,
    vendorRegister,
    governanceAuditLog,
    eventMedia,
    purchaseOrders,
  ] = await Promise.all([
    readRange("Laporan_Bulanan!A1:P16").catch(emptyOnAuthError),
    readEventSheet(EVENT_SHEETS.Tenants).catch(emptyOnAuthError),
    readEventSheet(EVENT_SHEETS.Sponsors).catch(emptyOnAuthError),
    readRange("Inventory_Master!A1:O1000").catch(emptyOnAuthError),
    readRange("Budget_Categories!A1:D50").catch(emptyOnAuthError),
    readRange("Event_Budget!A1:H1000").catch(emptyOnAuthError),
    readRange("Events!A1:V1000").catch(emptyOnAuthError),
    readRange("Expense_Submissions!A1:V1000").catch(emptyOnAuthError),
    readRange("Shareholder_Ledger!A1:M1000").catch(emptyOnAuthError),
    readRange("Compliance_Register!A1:J1000").catch(emptyOnAuthError),
    readRange("Vendor_Register!A1:L1000").catch(emptyOnAuthError),
    readRange("Governance_Audit_Log!A1:N1000").catch(emptyOnAuthError),
    readRange("Event_Media!A1:K1000").catch(emptyOnAuthError),
    readRange("Purchase_Orders!A1:N1000").catch(emptyOnAuthError),
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

  // Aggregate budget data for RAB/event closeout enrichment.
  // Event_Budget schema is: ID, Event ID, Category, Item Name, Planned Amount, Actual Amount, Notes, Created.
  // Use header-based lookup so generated docs do not silently swap item names into money fields.
  const budgetByCategory: Record<string, number> = {};
  let totalBudget = 0;
  let totalActual = 0;
  let eventOverBudgetRows = 0;
  let eventOverBudgetWithoutNotes = 0;
  const eventBudgetSummary: Array<{ name: string; budget: number; actual: number; remaining: number; status: string }> = [];

  const eventNames = new Map<string, string>();
  if (events.length > 1) {
    const eventHeaders = events[0].map((header) => text(header).toLowerCase());
    const idIdx = columnIndex(eventHeaders, ["id", "event id"], 0);
    const nameIdx = columnIndex(eventHeaders, ["name", "event name"], 1);
    for (const row of events.slice(1)) {
      const id = text(row[idIdx]);
      if (id) eventNames.set(id, text(row[nameIdx]) || id);
    }
  }

  if (eventBudget.length > 1) {
    const headers = eventBudget[0].map((header) => text(header).toLowerCase());
    const eventIdIdx = columnIndex(headers, ["event id", "event", "event name"], 1);
    const plannedIdx = columnIndex(headers, ["planned amount", "planned", "budget", "budget amount"], 4);
    const actualIdx = columnIndex(headers, ["actual amount", "actual", "actual cost", "cost"], 5);
    const notesIdx = columnIndex(headers, ["notes", "status", "catatan"], 6);
    const byEvent = new Map<string, { name: string; budget: number; actual: number; notes: string[] }>();

    for (const row of eventBudget.slice(1)) {
      if (!row[0]) continue;
      const eventId = text(row[eventIdIdx]) || text(row[0]);
      const evtBudget = amount(row[plannedIdx]);
      const evtActual = amount(row[actualIdx]);
      totalBudget += evtBudget;
      totalActual += evtActual;
      const existing = byEvent.get(eventId) || { name: eventNames.get(eventId) || eventId, budget: 0, actual: 0, notes: [] };
      existing.budget += evtBudget;
      existing.actual += evtActual;
      const note = text(row[notesIdx]);
      if (evtBudget > 0 && evtActual > evtBudget) {
        eventOverBudgetRows += 1;
        if (!note) eventOverBudgetWithoutNotes += 1;
      }
      if (note) existing.notes.push(note);
      byEvent.set(eventId, existing);
    }

    for (const event of Array.from(byEvent.values())) {
      const remaining = event.budget - event.actual;
      const ratio = event.budget > 0 ? event.actual / event.budget : 0;
      const status = event.actual > event.budget && event.budget > 0 ? "over" : ratio >= 0.95 ? "danger" : ratio >= 0.8 ? "warning" : "ok";
      eventBudgetSummary.push({ name: event.name, budget: event.budget, actual: event.actual, remaining, status: event.notes.join("; ") || status });
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
  const personalPaidExpenses = expenseRows.filter((row) => isPersonalPaidPaymentMethod(row[14]) || ["yes", "ya", "true", "1"].includes(text(row[17]).toLowerCase()));

  const shareholderDebtOutstanding = shareholderLedger.slice(1).reduce((sum, row) => {
    const status = text(row[9]).toLowerCase();
    if (["rejected", "cancelled"].includes(status)) return sum;
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
  const complianceOverdue = complianceOpen.filter((row) => {
    const due = text(row[4]);
    const dueTime = due ? new Date(`${due}T00:00:00Z`).getTime() : NaN;
    return Number.isFinite(dueTime) && dueTime < today;
  });

  const isRelated = (value: string) => ["yes", "ya", "true", "1"].includes(value.toLowerCase());
  const vendorRows = vendorRegister.slice(1).filter((row) => text(row[0]));
  const vendorRelatedParty = vendorRows.filter((row) => isRelated(text(row[4])));
  const vendorException = vendorRows.filter((row) => isRelated(text(row[4])) || !text(row[6]) || !text(row[7]) || !text(row[8]));

  const mediaEventIds = new Set(eventMedia.slice(1).map((row) => text(row[1])).filter(Boolean));
  const mediaRowsByEvent = eventMedia.slice(1).reduce<Record<string, number>>((acc, row) => {
    const eventId = text(row[1]);
    if (eventId) acc[eventId] = (acc[eventId] || 0) + 1;
    return acc;
  }, {});
  const todayIso = new Date().toISOString().slice(0, 10);
  const closeoutCandidateRows = events.slice(1).filter((row) => {
    const eventId = text(row[0]);
    if (!eventId) return false;
    const status = text(row[4]).toLowerCase();
    const endDate = text(row[9]).slice(0, 10);
    return ["completed", "complete", "closed", "done", "selesai"].includes(status)
      || (Boolean(endDate) && endDate < todayIso && !["draft", "cancelled", "canceled"].includes(status));
  });
  const eventMissingMediaCount = closeoutCandidateRows.filter((row) => !mediaEventIds.has(text(row[0]))).length;
  const eventCloseoutSummary = events.slice(1).filter((row) => text(row[0])).map((row) => {
    const eventId = text(row[0]);
    const eventName = text(row[1]) || eventId;
    const eventSlug = text(row[2]);
    const tenantRowsForEvent = tenants.slice(1).filter((tenant) => text(tenant[1]) === eventId || text(tenant[1]) === eventName);
    const sponsorRowsForEvent = sponsors.slice(1).filter((sponsor) => text(sponsor[1]) === eventId || text(sponsor[1]) === eventName);
    const expenseRowsForEvent = expenseSubmissions.slice(1).filter((expense) => text(expense[3]) === eventId || text(expense[3]) === eventName);
    const expensesWithoutProof = expenseRowsForEvent.filter((expense) => amount(expense[6]) > 0 && !text(expense[7])).length;
    const expensesNeedsProof = expenseRowsForEvent.filter((expense) => ["needs proof", "butuh bukti"].includes(text(expense[8]).toLowerCase())).length;
    const personalPaidExpenses = expenseRowsForEvent.filter((expense) => isPersonalPaidPaymentMethod(expense[14]) || ["yes", "ya", "true", "1"].includes(text(expense[17]).toLowerCase())).length;
    const actualExpense = expenseRowsForEvent
      .filter((expense) => ["approved", "paid", "lunas", "settled", "completed", "submitted"].includes(text(expense[8]).toLowerCase()))
      .reduce((sum, expense) => sum + amount(expense[6]), 0);
    const payableFromExpenses = expenseRowsForEvent
      .filter((expense) => ["pending", "needs proof", "butuh bukti", "approved"].includes(text(expense[8]).toLowerCase()) && !isPersonalPaidPaymentMethod(expense[14]))
      .reduce((sum, expense) => sum + amount(expense[6]), 0);
    const matchTokens = [eventId, eventName, eventSlug].map((value) => value.toLowerCase()).filter(Boolean);
    const payableFromPurchaseOrders = purchaseOrders.slice(1)
      .filter((po) => {
        const status = text(po[10]).toLowerCase();
        if (!["draft", "ordered", "partial"].includes(status)) return false;
        const haystack = [po[0], po[3], po[4], po[5], po[13]].map((value) => text(value).toLowerCase()).join(" ");
        return matchTokens.some((token) => haystack.includes(token));
      })
      .reduce((sum, po) => sum + amount(po[9]), 0);
    const tenantExpected = tenantRowsForEvent.reduce((sum, tenant) => sum + amount(tenant[9]), 0);
    const tenantPaid = tenantRowsForEvent.reduce((sum, tenant) => sum + amount(tenant[11]), 0);
    const sponsorExpected = sponsorRowsForEvent.reduce((sum, sponsor) => sum + amount(sponsor[7]) + amount(sponsor[10]), 0);
    const sponsorPaid = sponsorRowsForEvent.reduce((sum, sponsor) => {
      const status = text(sponsor[11]).toLowerCase();
      return sum + (["paid", "lunas", "settled", "received"].includes(status) ? amount(sponsor[7]) + amount(sponsor[10]) : 0);
    }, 0);
    return {
      id: eventId,
      name: eventName,
      actualExpense,
      payable: payableFromExpenses + payableFromPurchaseOrders,
      tenantExpected,
      tenantPaid,
      sponsorExpected,
      sponsorPaid,
      receivable: Math.max(tenantExpected - tenantPaid, 0) + Math.max(sponsorExpected - sponsorPaid, 0),
      mediaRows: mediaRowsByEvent[eventId] || 0,
      expensesWithoutProof,
      expensesNeedsProof,
      personalPaidExpenses,
    };
  });

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
    complianceCompletedWithoutProofCount: complianceCompletedWithoutProof.length,
    vendorExceptionCount: vendorException.length,
    vendorRelatedPartyCount: vendorRelatedParty.length,
    governanceAuditRows: Math.max(governanceAuditLog.length - 1, 0),
    eventMediaRows: Math.max(eventMedia.length - 1, 0),
    closeoutCandidateEvents: closeoutCandidateRows.length,
    eventMissingMediaCount,
    eventOverBudgetRows,
    eventOverBudgetWithoutNotes,
    eventCloseoutSummary,
    notes: [
      `Finance source: Laporan_Bulanan (${Math.max(finance.length - 1, 0)} data rows).`,
      `Commercial source: Event_Tenants ${Math.max(tenants.length - 1, 0)} rows; ${unpaidTenants} tenant belum lunas.`,
      `Sponsor source: Event_Sponsors ${Math.max(sponsors.length - 1, 0)} rows; ${followUpSponsors} sponsor perlu follow-up.`,
      `Inventory source: Inventory_Master ${Math.max(inventory.length - 1, 0)} rows; ${lowStock} item low/critical.`,
      `Budget source: ${eventBudgetSummary.length} event budgets, total budget ${totalBudget.toLocaleString("id-ID")}.`,
      `GCG source: ${expenseRows.length} expenses, ${Math.max(governanceAuditLog.length - 1, 0)} governance audit rows, ${complianceOpen.length} open compliance items.`,
      `GCG compliance proof source: ${complianceCompletedWithoutProof.length} completed compliance items belum punya Source Proof.`,
      `Event closeout source: Event_Media ${Math.max(eventMedia.length - 1, 0)} rows; ${eventMissingMediaCount}/${closeoutCandidateRows.length} closeout candidate events belum punya media.`,
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
      complianceCompletedWithoutProofCount: context.complianceCompletedWithoutProofCount,
      vendorExceptionCount: context.vendorExceptionCount,
      vendorRelatedPartyCount: context.vendorRelatedPartyCount,
      governanceAuditRows: context.governanceAuditRows,
      eventMediaRows: context.eventMediaRows,
      closeoutCandidateEvents: context.closeoutCandidateEvents,
      eventMissingMediaCount: context.eventMissingMediaCount,
      eventOverBudgetRows: context.eventOverBudgetRows,
      eventOverBudgetWithoutNotes: context.eventOverBudgetWithoutNotes,
      eventCloseoutSummary: context.eventCloseoutSummary,
      sourceStatus: context.sourceStatus,
      warning: context.warning,
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
