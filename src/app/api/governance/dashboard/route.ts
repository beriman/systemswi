import { NextRequest, NextResponse } from "next/server";
import { googleWorkspaceDegradedSource, isGoogleWorkspaceAuthError } from "@/lib/api/google-workspace-error";
import { readRange, readSheet } from "@/lib/sheets/sheets-real";

export const runtime = "nodejs";

const SOURCE = "Google Sheets: Expense_Submissions + Shareholder_Ledger + Compliance_Register + Vendor_Register + Governance_Audit_Log + Monthly_GCG_Report + Events + Event_Budget + Event_Tenants + Event_Sponsors + Event_Media + Purchase_Orders";

type SourceStatus = "live" | "degraded";
type ScoreKey = "transparency" | "accountability" | "responsibility" | "independency" | "fairness";

type GcgScore = {
  key: ScoreKey;
  label: string;
  score: number;
  status: "good" | "watch" | "risk";
  evidence: string;
};

const text = (value: unknown) => String(value ?? "").trim();

function amount(value: unknown): number {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  if (typeof value !== "string") return 0;
  const parsed = Number(value.replace(/[^\d.-]/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
}

function percent(part: number, total: number): number {
  if (total <= 0) return 100;
  return Math.max(0, Math.min(100, Math.round((part / total) * 100)));
}

function scoreStatus(score: number): GcgScore["status"] {
  if (score >= 80) return "good";
  if (score >= 60) return "watch";
  return "risk";
}

function makeScore(key: ScoreKey, label: string, score: number, evidence: string): GcgScore {
  return { key, label, score, status: scoreStatus(score), evidence };
}

function isApproved(status: string): boolean {
  return ["approved", "paid", "submitted", "complete", "completed"].includes(status.toLowerCase());
}

function isClosed(status: string): boolean {
  return ["approved", "rejected", "paid", "submitted", "complete", "completed", "cancelled"].includes(status.toLowerCase());
}

function isYes(value: string): boolean {
  return ["yes", "ya", "true", "1"].includes(value.toLowerCase());
}

function isPaidStatus(value: string): boolean {
  return ["paid", "lunas", "settled", "completed", "received"].includes(value.toLowerCase().trim());
}

function isCancelledStatus(value: string): boolean {
  return ["cancelled", "canceled", "rejected", "void"].includes(value.toLowerCase().trim());
}

function isMissingCoa(value: string): boolean {
  const normalized = value.toLowerCase();
  return !value || normalized.includes("tba") || normalized.includes("belum dicatat") || normalized.includes("belum tersedia");
}

function isAutomationActor(value: string): boolean {
  const normalized = value.toLowerCase();
  return ["agent", "system", "systemswi", "hermes", "hemuhemu", "automation", "cron"].some((marker) => normalized.includes(marker));
}

function isHumanOnlyApprovalContext(row: string[]): boolean {
  const haystack = [text(row[4]), text(row[5]), text(row[6]), text(row[8]), text(row[11]), text(row[13])].join(" ").toLowerCase();
  return ["pajak", "tax", "legal", "termination", "phk", "konflik", "conflict", "related-party", "related party"].some((marker) => haystack.includes(marker));
}

function isApprovalAction(value: string): boolean {
  const normalized = value.toLowerCase();
  return normalized.includes("approve") || normalized.includes("approval") || normalized.includes("submit") || normalized.includes("settle");
}

function isOverdue(dueDate: string): boolean {
  if (!dueDate) return false;
  const due = new Date(`${dueDate}T00:00:00Z`).getTime();
  const today = new Date(`${new Date().toISOString().slice(0, 10)}T00:00:00Z`).getTime();
  return Number.isFinite(due) && due < today;
}

function daysUntilDue(dueDate: string): number | null {
  if (!dueDate) return null;
  const due = new Date(`${dueDate}T00:00:00Z`).getTime();
  const today = new Date(`${new Date().toISOString().slice(0, 10)}T00:00:00Z`).getTime();
  if (!Number.isFinite(due)) return null;
  return Math.ceil((due - today) / 86400000);
}

function daysSince(dateValue: string): number | null {
  if (!dateValue) return null;
  const date = new Date(`${dateValue.slice(0, 10)}T00:00:00Z`).getTime();
  const today = new Date(`${new Date().toISOString().slice(0, 10)}T00:00:00Z`).getTime();
  if (!Number.isFinite(date)) return null;
  return Math.max(0, Math.floor((today - date) / 86400000));
}

function csvCell(value: unknown): string {
  const textValue = String(value ?? "");
  return /[",\n]/.test(textValue) ? `"${textValue.replace(/"/g, '""')}"` : textValue;
}

function toGovernanceCsv(payload: {
  generatedAt: string;
  sourceStatus: SourceStatus;
  overallScore: number;
  scores: GcgScore[];
  summary: Record<string, unknown>;
  exceptions: Array<{ type: string; severity: string; entityId: string; description: string; amount: number; owner: string }>;
  recentAuditTrail?: Array<{ timestamp: string; actor: string; action: string; entityType: string; entityId: string; amount: number; before: string; after: string; sourceModule: string }>;
  nextActions: string[];
}): string {
  const rows: unknown[][] = [
    ["Section", "Metric", "Value", "Notes"],
    ["Header", "Generated At", payload.generatedAt, payload.sourceStatus],
    ["Header", "Overall GCG Score", payload.overallScore, "Rata-rata Transparency, Accountability, Responsibility, Independency, Fairness"],
    ...payload.scores.map((score) => ["Score", score.label, score.score, `${score.status}: ${score.evidence}`]),
  ];

  Object.entries(payload.summary).forEach(([section, value]) => {
    if (value && typeof value === "object" && !Array.isArray(value)) {
      Object.entries(value as Record<string, unknown>).forEach(([metric, metricValue]) => rows.push([`Summary:${section}`, metric, metricValue, ""]));
    }
  });

  payload.exceptions.forEach((item) => rows.push(["Exception", item.type, item.amount, `${item.severity} | ${item.entityId || "TBA"} | ${item.owner || "Belum dicatat"} | ${item.description || "Belum dicatat"}`]));
  (payload.recentAuditTrail || []).forEach((item) => rows.push(["Recent Audit", item.action, item.amount, `${item.timestamp || "TBA"} | ${item.actor || "Belum dicatat"} | ${item.entityType || "TBA"}:${item.entityId || "TBA"} | ${item.before || ""} -> ${item.after || ""} | ${item.sourceModule || "TBA"}`]));
  payload.nextActions.forEach((action, index) => rows.push(["Next Action", index + 1, action, ""]));

  return rows.map((row) => row.map(csvCell).join(",")).join("\n");
}

async function readRows(): Promise<{ rows: Record<string, string[][]>; sourceStatus: SourceStatus; warning?: string; details?: string }> {
  let googleReadError: unknown = null;
  const emptyOnReadError = (error: unknown): string[][] => {
    googleReadError ||= error;
    return [];
  };

  const [expenses, shareholderLedger, complianceRegister, vendorRegister, governanceAuditLog, monthlyGcgReport, tasks, events, eventBudget, eventTenants, eventSponsors, eventMedia, purchaseOrders] = await Promise.all([
    readRange("Expense_Submissions!A1:V1000").catch(emptyOnReadError),
    readSheet("ShareholderLedger").catch(emptyOnReadError),
    readSheet("ComplianceRegister").catch(emptyOnReadError),
    readSheet("VendorRegister").catch(emptyOnReadError),
    readSheet("GovernanceAuditLog").catch(emptyOnReadError),
    readSheet("MonthlyGcgReport").catch(emptyOnReadError),
    readSheet("Tasks").catch(emptyOnReadError),
    readRange("Events!A1:V1000").catch(emptyOnReadError),
    readRange("Event_Budget!A1:H1000").catch(emptyOnReadError),
    readRange("Event_Tenants!A1:O1000").catch(emptyOnReadError),
    readRange("Event_Sponsors!A1:O1000").catch(emptyOnReadError),
    readRange("Event_Media!A1:K1000").catch(emptyOnReadError),
    readRange("Purchase_Orders!A1:N1000").catch(emptyOnReadError),
  ]);

  const degraded = googleReadError ? googleWorkspaceDegradedSource(SOURCE, googleReadError) : null;
  return {
    rows: { expenses, shareholderLedger, complianceRegister, vendorRegister, governanceAuditLog, monthlyGcgReport, tasks, events, eventBudget, eventTenants, eventSponsors, eventMedia, purchaseOrders },
    sourceStatus: degraded ? "degraded" : "live",
    warning: degraded?.warning,
    details: degraded?.details,
  };
}

export async function GET(req: NextRequest) {
  try {
    const { rows, sourceStatus, warning, details } = await readRows();

    if (sourceStatus === "degraded") {
      const generatedAt = new Date().toISOString();
      const scores = [
        makeScore("transparency", "Transparency", 0, "Google Sheets source degraded; score ditahan agar tidak membaca data kosong sebagai kondisi aman."),
        makeScore("accountability", "Accountability", 0, "Google Sheets source degraded; audit/approval rows tidak bisa diverifikasi."),
        makeScore("responsibility", "Responsibility", 0, "Google Sheets source degraded; compliance overdue/due soon tidak bisa diverifikasi."),
        makeScore("independency", "Independency", 0, "Google Sheets source degraded; Vendor_Register/benchmark tidak bisa diverifikasi."),
        makeScore("fairness", "Fairness", 0, "Google Sheets source degraded; Shareholder_Ledger dan personal-paid matching tidak bisa diverifikasi."),
      ];
      const payload = {
        source: SOURCE,
        sourceStatus,
        warning,
        details,
        generatedAt,
        overallScore: 0,
        scores,
        summary: {},
        exceptions: [{
          type: "GOOGLE_WORKSPACE_SOURCE_DEGRADED",
          severity: "high",
          entityId: "Google Sheets",
          description: warning || "Google Sheets source degraded; dashboard GCG tidak menghitung skor dari data kosong/TBA.",
          amount: 0,
          owner: "Direksi/Finance",
        }],
        recentAuditTrail: [],
        nextActions: [
          "Re-auth/repair Google Workspace credentials agar governance dashboard bisa membaca Sheets source of truth.",
          "Jangan gunakan skor GCG untuk keputusan sampai sourceStatus kembali live.",
        ],
      };

      if (req.nextUrl.searchParams.get("format") === "csv") {
        return new NextResponse(toGovernanceCsv(payload), {
          headers: {
            "Content-Type": "text/csv; charset=utf-8",
            "Content-Disposition": `attachment; filename="governance-dashboard-${new Date().toISOString().slice(0, 10)}.csv"`,
          },
        });
      }

      return NextResponse.json(payload);
    }

    const expenses = rows.expenses.slice(1).filter((row) => text(row[0]));
    const shareholderLedger = rows.shareholderLedger.slice(1).filter((row) => text(row[0]));
    const complianceRegister = rows.complianceRegister.slice(1).filter((row) => text(row[0]));
    const vendorRegister = rows.vendorRegister.slice(1).filter((row) => text(row[0]));
    const governanceAuditLog = rows.governanceAuditLog.slice(1).filter((row) => text(row[0]));
    const monthlyGcgReport = rows.monthlyGcgReport.slice(1).filter((row) => text(row[0]));
    const tasks = rows.tasks.slice(1).filter((row) => text(row[0]));
    const events = rows.events.slice(1).filter((row) => text(row[0]));
    const eventBudget = rows.eventBudget.slice(1).filter((row) => text(row[0]));
    const eventTenants = rows.eventTenants.slice(1).filter((row) => text(row[0]));
    const eventSponsors = rows.eventSponsors.slice(1).filter((row) => text(row[0]));
    const eventMedia = rows.eventMedia.slice(1).filter((row) => text(row[0]));
    const purchaseOrders = rows.purchaseOrders.slice(1).filter((row) => text(row[0]));

    const expenseWithProof = expenses.filter((row) => amount(row[6]) <= 0 || Boolean(text(row[7])));
    const expenseWithDivision = expenses.filter((row) => Boolean(text(row[12])) && !isMissingCoa(text(row[13] || row[4])));
    const expensePending = expenses.filter((row) => text(row[8]).toLowerCase() === "pending");
    const expenseNeedsProof = expenses.filter((row) => text(row[8]).toLowerCase() === "needs proof" || (amount(row[6]) > 0 && !text(row[7])));
    const expenseLargeWithoutApproval = expenses.filter((row) => amount(row[6]) > 500000 && !isClosed(text(row[8])));
    const approvedExpenses = expenses.filter((row) => text(row[8]).toLowerCase() === "approved");
    const approvedWithoutDivisionOrCoa = approvedExpenses.filter((row) => !text(row[12]) || isMissingCoa(text(row[13] || row[4])));
    const approvedWithReviewer = approvedExpenses.filter((row) => Boolean(text(row[9])));
    const personalPaidExpenses = expenses.filter((row) => text(row[14]).toLowerCase() === "personal paid" || isYes(text(row[17])));
    // Shareholder_Ledger is created only after human approval. Pending/Needs Proof personal-paid
    // submissions remain expense workflow items and should not be flagged as missing ledger yet.
    const approvedPersonalPaidExpenses = personalPaidExpenses.filter((row) => text(row[8]).toLowerCase() === "approved");
    const vendorRequiredCategories = new Set(["Bahan Baku", "Packaging", "Venue", "Dokumentasi", "Sewa Booth"]);
    const expenseVendorRequired = expenses.filter((row) => vendorRequiredCategories.has(text(row[4])));
    const expensesWithoutVendor = expenseVendorRequired.filter((row) => !text(row[18]) && !text(row[19]));
    const expenseRelatedPartyVendor = expenses.filter((row) => isYes(text(row[20])));

    const taskWithOwner = tasks.filter((row) => Boolean(text(row[3] || row[4] || row[5])));
    const completedCompliance = complianceRegister.filter((row) => isApproved(text(row[5])));
    const completedComplianceMissingProof = completedCompliance.filter((row) => !text(row[7]));
    const openCompliance = complianceRegister.filter((row) => !isApproved(text(row[5])));
    const overdueCompliance = openCompliance.filter((row) => isOverdue(text(row[4])) || text(row[5]).toLowerCase() === "overdue");
    const dueSoonCompliance = openCompliance.filter((row) => {
      const due = text(row[4]);
      if (!due || isOverdue(due)) return false;
      const days = daysUntilDue(due);
      return days !== null && days <= 7;
    });

    const vendorWithBenchmark = vendorRegister.filter((row) => Boolean(text(row[6])) && Boolean(text(row[7])) && Boolean(text(row[8])));
    const relatedPartyVendors = vendorRegister.filter((row) => isYes(text(row[4])));
    const vendorExceptions = vendorRegister.filter((row) => isYes(text(row[4])) || !text(row[6]) || !text(row[7]) || !text(row[8]));

    const shareholderDebtOutstanding = shareholderLedger.reduce((sum, row) => {
      const status = text(row[9]).toLowerCase();
      if (["rejected", "cancelled"].includes(status)) return sum;
      return sum + amount(row[6]) - amount(row[7]);
    }, 0);
    const shareholderOutstandingRows = shareholderLedger
      .map((row) => {
        const balance = amount(row[6]) - amount(row[7]);
        const ageDays = daysSince(text(row[1]));
        return {
          row,
          balance,
          ageDays,
          shareholder: text(row[2]) || "Belum dicatat",
          description: text(row[5]) || text(row[3]) || "Hutang pemegang saham",
        };
      })
      .filter((item) => item.balance > 0 && !["rejected", "cancelled"].includes(text(item.row[9]).toLowerCase()));
    const shareholderDebtOver30 = shareholderOutstandingRows.filter((item) => item.ageDays !== null && item.ageDays > 30);
    const shareholderDebtOver60 = shareholderOutstandingRows.filter((item) => item.ageDays !== null && item.ageDays > 60);
    const shareholderDebtUnaged = shareholderOutstandingRows.filter((item) => item.ageDays === null);
    const shareholderLedgerSourceKeys = new Set(shareholderLedger.map((row) => text(row[12]) + " " + text(row[5])));
    const personalPaidNotInLedger = approvedPersonalPaidExpenses.filter((expense) => {
      const id = text(expense[0]);
      if (!id) return false;
      return !Array.from(shareholderLedgerSourceKeys).some((value) => value.includes(id));
    });

    const eventBudgetOverActual = eventBudget.filter((row) => amount(row[5]) > amount(row[4]) && amount(row[4]) > 0);
    const eventBudgetOverActualWithoutNotes = eventBudgetOverActual.filter((row) => !text(row[6]));
    const eventsOverBudget = events.filter((row) => amount(row[13]) > amount(row[12]) && amount(row[12]) > 0);
    const eventsOverBudgetWithoutNotes = eventsOverBudget.filter((row) => !text(row[19]));
    const tenantReceivableRows = eventTenants.filter((row) => {
      if (isPaidStatus(text(row[10])) || isCancelledStatus(text(row[10]))) return false;
      return Math.max(amount(row[9]) - amount(row[11]), 0) > 0;
    });
    const sponsorReceivableRows = eventSponsors.filter((row) => {
      if (isPaidStatus(text(row[11])) || isCancelledStatus(text(row[11]))) return false;
      return amount(row[7]) + amount(row[10]) > 0;
    });
    const tenantReceivableAmount = tenantReceivableRows.reduce((sum, row) => sum + Math.max(amount(row[9]) - amount(row[11]), 0), 0);
    const sponsorReceivableAmount = sponsorReceivableRows.reduce((sum, row) => sum + amount(row[7]) + amount(row[10]), 0);
    const mediaEventIds = new Set(eventMedia.map((row) => text(row[1])).filter(Boolean));
    const todayIso = new Date().toISOString().slice(0, 10);
    const closeoutCandidateEvents = events.filter((row) => {
      const status = text(row[4]).toLowerCase();
      const endDate = text(row[9]).slice(0, 10);
      return ["completed", "complete", "closed", "done", "selesai"].includes(status)
        || (Boolean(endDate) && endDate < todayIso && !["draft", "cancelled", "canceled"].includes(status));
    });
    const eventsMissingMedia = closeoutCandidateEvents.filter((row) => !mediaEventIds.has(text(row[0])));
    const openPurchaseOrders = purchaseOrders.filter((row) => ["draft", "ordered", "partial"].includes(text(row[10]).toLowerCase()));
    const overduePurchaseOrders = openPurchaseOrders.filter((row) => isOverdue(text(row[11])));
    const highValueOverduePurchaseOrders = overduePurchaseOrders.filter((row) => amount(row[9]) > 2000000);

    const latestMonthlyGcg = monthlyGcgReport
      .map((row) => ({
        id: text(row[0]),
        period: text(row[1]) || "TBA",
        generatedAt: text(row[2]) || text(row[3]) || "TBA",
        status: text(row[4]) || text(row[5]) || "Belum dicatat",
      }))
      .sort((a, b) => b.generatedAt.localeCompare(a.generatedAt))[0] || null;
    const hasMonthlyGcgReport = monthlyGcgReport.length > 0;
    const humanOnlyAutomationApprovals = governanceAuditLog.filter((row) =>
      isAutomationActor(text(row[2])) && isApprovalAction(text(row[4])) && isHumanOnlyApprovalContext(row)
    );
    const recentAuditTrail = governanceAuditLog
      .map((row) => ({
        logId: text(row[0]),
        timestamp: text(row[1]) || "TBA",
        actor: text(row[2]) || "Belum dicatat",
        role: text(row[3]) || "TBA",
        action: text(row[4]) || "TBA",
        entityType: text(row[5]) || "TBA",
        entityId: text(row[6]) || "TBA",
        amount: amount(row[7]),
        division: text(row[8]) || "Belum dicatat",
        before: text(row[9]) || "",
        after: text(row[10]) || "",
        reason: text(row[11]) || "Belum dicatat",
        proofUrl: text(row[12]) || "",
        sourceModule: text(row[13]) || "TBA",
      }))
      .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
      .slice(0, 10);

    const transparencyScore = Math.round((percent(expenseWithProof.length, expenses.length) + percent(expenseWithDivision.length, expenses.length) + percent(hasMonthlyGcgReport ? 1 : 0, 1)) / 3);
    const accountabilityScore = Math.round((percent(approvedWithReviewer.length, approvedExpenses.length) + percent(taskWithOwner.length, tasks.length) + percent(governanceAuditLog.length > 0 ? 1 : 0, 1)) / 3);
    const complianceOnTimeScore = percent(complianceRegister.length - overdueCompliance.length, complianceRegister.length);
    const complianceProofScore = percent(completedCompliance.length - completedComplianceMissingProof.length, completedCompliance.length);
    const responsibilityScore = Math.round((complianceOnTimeScore + complianceProofScore) / 2);
    const independencyScore = Math.round((percent(vendorWithBenchmark.length, vendorRegister.length) + percent(expenseVendorRequired.length - expensesWithoutVendor.length, expenseVendorRequired.length)) / 2);
    const fairnessScore = Math.round((
      percent(approvedPersonalPaidExpenses.length - personalPaidNotInLedger.length, approvedPersonalPaidExpenses.length)
      + percent(openPurchaseOrders.length - overduePurchaseOrders.length, openPurchaseOrders.length)
    ) / 2);

    const scores = [
      makeScore("transparency", "Transparency", transparencyScore, `${expenseWithProof.length}/${expenses.length} expense punya bukti atau amount 0; ${expenseWithDivision.length}/${expenses.length} punya division/COA; Monthly_GCG_Report ${hasMonthlyGcgReport ? "tersedia" : "belum dicatat"}.`),
      makeScore("accountability", "Accountability", accountabilityScore, `${approvedWithReviewer.length}/${approvedExpenses.length} approved expense punya reviewer; ${governanceAuditLog.length} governance audit rows.`),
      makeScore("responsibility", "Responsibility", responsibilityScore, `${overdueCompliance.length} overdue dari ${complianceRegister.length} compliance item; ${completedComplianceMissingProof.length}/${completedCompliance.length} completed compliance belum punya proof URL.`),
      makeScore("independency", "Independency", independencyScore, `${vendorWithBenchmark.length}/${vendorRegister.length} vendor punya benchmark + selected reason; ${expenseVendorRequired.length - expensesWithoutVendor.length}/${expenseVendorRequired.length} expense vendor-category punya vendor link.`),
      makeScore("fairness", "Fairness", fairnessScore, `${personalPaidNotInLedger.length}/${approvedPersonalPaidExpenses.length} approved personal-paid expense belum terlacak ke ledger; ${overduePurchaseOrders.length}/${openPurchaseOrders.length} open PO melewati expected date.`),
    ];

    const overallScore = Math.round(scores.reduce((sum, score) => sum + score.score, 0) / scores.length);

    const payload = {
      source: SOURCE,
      sourceStatus,
      warning,
      details,
      generatedAt: new Date().toISOString(),
      overallScore,
      scores,
      summary: {
        expenses: {
          total: expenses.length,
          pendingCount: expensePending.length,
          pendingAmount: expensePending.reduce((sum, row) => sum + amount(row[6]), 0),
          needsProofCount: expenseNeedsProof.length,
          needsProofAmount: expenseNeedsProof.reduce((sum, row) => sum + amount(row[6]), 0),
          withoutDivisionCount: expenses.length - expenseWithDivision.length,
          approvedWithoutDivisionOrCoaCount: approvedWithoutDivisionOrCoa.length,
          largeWithoutApprovalCount: expenseLargeWithoutApproval.length,
          personalPaidCount: personalPaidExpenses.length,
          personalPaidAmount: personalPaidExpenses.reduce((sum, row) => sum + amount(row[6]), 0),
          personalPaidNotInLedgerCount: personalPaidNotInLedger.length,
          vendorRequiredCount: expenseVendorRequired.length,
          withoutVendorCount: expensesWithoutVendor.length,
          relatedPartyVendorExpenseCount: expenseRelatedPartyVendor.length,
        },
        shareholder: {
          ledgerRows: shareholderLedger.length,
          outstandingDebt: shareholderDebtOutstanding,
          outstandingRows: shareholderOutstandingRows.length,
          over30DaysCount: shareholderDebtOver30.length,
          over30DaysAmount: shareholderDebtOver30.reduce((sum, item) => sum + item.balance, 0),
          over60DaysCount: shareholderDebtOver60.length,
          over60DaysAmount: shareholderDebtOver60.reduce((sum, item) => sum + item.balance, 0),
          unagedCount: shareholderDebtUnaged.length,
        },
        compliance: {
          total: complianceRegister.length,
          open: openCompliance.length,
          overdue: overdueCompliance.length,
          dueSoon: dueSoonCompliance.length,
          completedWithoutProof: completedComplianceMissingProof.length,
        },
        vendor: {
          total: vendorRegister.length,
          relatedParty: relatedPartyVendors.length,
          exceptions: vendorExceptions.length,
          benchmarkComplete: vendorWithBenchmark.length,
          openPo: openPurchaseOrders.length,
          overduePo: overduePurchaseOrders.length,
          overduePoValue: overduePurchaseOrders.reduce((sum, row) => sum + amount(row[9]), 0),
        },
        audit: {
          governanceAuditRows: governanceAuditLog.length,
          humanOnlyAutomationApprovalCount: humanOnlyAutomationApprovals.length,
        },
        monthlyGcgReport: {
          total: monthlyGcgReport.length,
          latestPeriod: latestMonthlyGcg?.period || "TBA",
          latestGeneratedAt: latestMonthlyGcg?.generatedAt || "TBA",
          latestStatus: latestMonthlyGcg?.status || "Belum dicatat",
        },
        event: {
          events: events.length,
          budgetRows: eventBudget.length,
          overBudgetRows: eventBudgetOverActual.length,
          overBudgetWithoutNotes: eventBudgetOverActualWithoutNotes.length + eventsOverBudgetWithoutNotes.length,
          tenantReceivableCount: tenantReceivableRows.length,
          tenantReceivableAmount,
          sponsorReceivableCount: sponsorReceivableRows.length,
          sponsorReceivableAmount,
          mediaRows: eventMedia.length,
          closeoutCandidateEvents: closeoutCandidateEvents.length,
          missingMediaCount: eventsMissingMedia.length,
        },
      },
      exceptions: [
        ...expenseNeedsProof.slice(0, 10).map((row) => ({ type: "EXPENSE_NEEDS_PROOF", severity: "high", entityId: text(row[0]), description: text(row[5]) || "Expense tanpa bukti", amount: amount(row[6]), owner: text(row[2]) || "Belum dicatat" })),
        ...expenseLargeWithoutApproval.slice(0, 10).map((row) => ({ type: "LARGE_EXPENSE_PENDING_APPROVAL", severity: "high", entityId: text(row[0]), description: text(row[5]) || "Expense besar belum closed approval", amount: amount(row[6]), owner: text(row[2]) || "Belum dicatat" })),
        ...approvedWithoutDivisionOrCoa.slice(0, 10).map((row) => ({ type: "APPROVED_EXPENSE_MISSING_DIVISION_OR_COA", severity: "high", entityId: text(row[0]), description: text(row[5]) || "Expense approved tanpa division/COA lengkap", amount: amount(row[6]), owner: text(row[2]) || "Belum dicatat" })),
        ...overdueCompliance.slice(0, 10).map((row) => ({ type: "COMPLIANCE_OVERDUE", severity: "high", entityId: text(row[0]), description: text(row[2]) || "Compliance overdue", amount: 0, owner: text(row[6]) || "Belum dicatat" })),
        ...dueSoonCompliance.slice(0, 10).map((row) => {
          const days = daysUntilDue(text(row[4]));
          return {
            type: "COMPLIANCE_DUE_SOON",
            severity: days !== null && days <= 3 ? "high" : "medium",
            entityId: text(row[0]),
            description: `${text(row[2]) || "Compliance due soon"} — due ${text(row[4]) || "TBA"}${days !== null ? ` (H-${days})` : ""}`,
            amount: 0,
            owner: text(row[6]) || "Belum dicatat",
          };
        }),
        ...completedComplianceMissingProof.slice(0, 10).map((row) => ({ type: "COMPLIANCE_COMPLETED_WITHOUT_PROOF", severity: "medium", entityId: text(row[0]), description: text(row[2]) || "Compliance selesai tanpa proof URL", amount: 0, owner: text(row[6]) || "Belum dicatat" })),
        ...vendorExceptions.slice(0, 10).map((row) => ({ type: "VENDOR_GOVERNANCE_EXCEPTION", severity: isYes(text(row[4])) ? "high" : "medium", entityId: text(row[0]), description: text(row[1]) || "Vendor perlu review benchmark/COI", amount: 0, owner: text(row[3]) || "Belum dicatat" })),
        ...overduePurchaseOrders.slice(0, 10).map((row) => ({ type: "VENDOR_PO_OVERDUE", severity: highValueOverduePurchaseOrders.some((po) => text(po[0]) === text(row[0])) ? "high" : "medium", entityId: text(row[0]), description: `${text(row[3]) || "Vendor"} — ${text(row[5]) || "PO open melewati expected date"} due ${text(row[11]) || "TBA"}`, amount: amount(row[9]), owner: text(row[3]) || "Belum dicatat" })),
        ...expensesWithoutVendor.slice(0, 10).map((row) => ({ type: "EXPENSE_VENDOR_NOT_LINKED", severity: amount(row[6]) > 2000000 ? "high" : "medium", entityId: text(row[0]), description: text(row[5]) || "Expense kategori vendor belum dikaitkan ke Vendor_Register", amount: amount(row[6]), owner: text(row[2]) || "Belum dicatat" })),
        ...personalPaidNotInLedger.slice(0, 10).map((row) => ({ type: "PERSONAL_PAID_NOT_IN_LEDGER", severity: "medium", entityId: text(row[0]), description: text(row[5]) || "Personal paid belum cocok ke Shareholder_Ledger", amount: amount(row[6]), owner: text(row[2]) || "Belum dicatat" })),
        ...shareholderDebtOver60.slice(0, 10).map((item) => ({ type: "SHAREHOLDER_DEBT_AGING_OVER_60", severity: "high", entityId: text(item.row[0]), description: `${item.description} — ${item.ageDays} hari belum diselesaikan`, amount: item.balance, owner: item.shareholder })),
        ...shareholderDebtOver30.slice(0, 10).filter((item) => !shareholderDebtOver60.some((older) => text(older.row[0]) === text(item.row[0]))).map((item) => ({ type: "SHAREHOLDER_DEBT_AGING_OVER_30", severity: "medium", entityId: text(item.row[0]), description: `${item.description} — ${item.ageDays} hari belum diselesaikan`, amount: item.balance, owner: item.shareholder })),
        ...eventsOverBudgetWithoutNotes.slice(0, 10).map((row) => ({ type: "EVENT_OVER_BUDGET_NO_NOTES", severity: "high", entityId: text(row[0]), description: text(row[1]) || "Event actual > budget tanpa catatan closeout", amount: amount(row[13]) - amount(row[12]), owner: text(row[6]) || "Belum dicatat" })),
        ...eventBudgetOverActualWithoutNotes.slice(0, 10).map((row) => ({ type: "EVENT_BUDGET_ROW_OVER_ACTUAL_NO_NOTES", severity: "medium", entityId: text(row[1]) || text(row[0]), description: text(row[3]) || text(row[2]) || "Budget row actual > planned tanpa notes", amount: amount(row[5]) - amount(row[4]), owner: "Event PIC" })),
        ...tenantReceivableRows.slice(0, 10).map((row) => ({ type: "EVENT_TENANT_RECEIVABLE", severity: Math.max(amount(row[9]) - amount(row[11]), 0) > 2000000 ? "high" : "medium", entityId: text(row[1]) || text(row[0]), description: `${text(row[2]) || "Tenant"} belum lunas`, amount: Math.max(amount(row[9]) - amount(row[11]), 0), owner: text(row[3]) || "Event PIC" })),
        ...sponsorReceivableRows.slice(0, 10).map((row) => ({ type: "EVENT_SPONSOR_RECEIVABLE", severity: amount(row[7]) + amount(row[10]) > 2000000 ? "high" : "medium", entityId: text(row[1]) || text(row[0]), description: `${text(row[2]) || "Sponsor"} belum lunas/follow-up`, amount: amount(row[7]) + amount(row[10]), owner: text(row[3]) || "Event PIC" })),
        ...eventsMissingMedia.slice(0, 10).map((row) => ({ type: "EVENT_CLOSEOUT_MEDIA_MISSING", severity: "medium", entityId: text(row[0]), description: `${text(row[1]) || "Event"} perlu dokumentasi Event_Media untuk closeout`, amount: 0, owner: text(row[6]) || "Event PIC" })),
        ...humanOnlyAutomationApprovals.slice(0, 10).map((row) => ({ type: "HUMAN_ONLY_APPROVAL_BY_AUTOMATION", severity: "high", entityId: text(row[6]) || text(row[5]) || "Governance_Audit_Log", description: `${text(row[4]) || "Approval"} untuk pajak/legal/termination/COI tercatat oleh actor otomatis; wajib review manusia.`, amount: amount(row[7]), owner: text(row[2]) || "Belum dicatat" })),
        ...(!hasMonthlyGcgReport ? [{ type: "MONTHLY_GCG_REPORT_NOT_RECORDED", severity: "medium", entityId: "Monthly_GCG_Report", description: "Belum ada log laporan bulanan GCG/TARIF untuk pemegang saham", amount: 0, owner: "Direksi/Finance" }] : []),
      ],
      recentAuditTrail,
      nextActions: [
        expenseNeedsProof.length ? "Lengkapi proof URL untuk expense berstatus Needs Proof/tanpa bukti." : "Pertahankan disiplin bukti expense.",
        approvedWithoutDivisionOrCoa.length ? "Perbaiki approved expense yang belum punya division/COA; acceptance GCG melarang approved expense tanpa klasifikasi." : expensePending.length ? "Review dan approve/reject expense pending; semua keputusan harus masuk Governance_Audit_Log." : "Tidak ada expense pending dari data yang terbaca.",
        overdueCompliance.length ? "Tindaklanjuti compliance overdue dan upload bukti setelah selesai." : dueSoonCompliance.length ? "Follow-up compliance due soon (H-7/H-3/H-1) dan siapkan proof URL sebelum status submitted/paid." : completedComplianceMissingProof.length ? "Lengkapi proof URL untuk compliance yang sudah marked submitted/paid/complete." : "Pantau compliance due soon dan jangan menandai submitted tanpa bukti.",
        vendorExceptions.length ? "Lengkapi benchmark vendor dan deklarasi related-party sebelum transaksi besar." : "Vendor register tidak menunjukkan exception dari data terbaca.",
        overduePurchaseOrders.length ? "Review PO/vendor payable yang melewati expected date; update status received/cancelled atau catat alasan keterlambatan." : "Tidak ada open PO melewati expected date dari data Purchase_Orders yang terbaca.",
        humanOnlyAutomationApprovals.length ? "Review ulang approval pajak/legal/termination/COI yang tercatat oleh actor otomatis; prinsip TARIF mewajibkan keputusan human-only." : "Tidak ada approval human-only oleh automation dari Governance_Audit_Log yang terbaca.",
        eventBudgetOverActualWithoutNotes.length + eventsOverBudgetWithoutNotes.length ? "Lengkapi catatan closeout untuk event/budget row yang actual-nya melewati budget." : tenantReceivableRows.length + sponsorReceivableRows.length ? "Follow-up receivable tenant/sponsor sebelum event closeout dinyatakan selesai." : eventsMissingMedia.length ? "Lengkapi Event_Media untuk event yang sudah selesai/berakhir agar closeout siap dibagikan." : "Event closeout tidak menunjukkan exception dari data terbaca.",
        expensesWithoutVendor.length ? "Hubungkan expense Bahan Baku/Packaging/Sewa Booth ke Vendor_Register atau isi vendor name." : "Expense kategori vendor sudah punya vendor link atau belum ada data.",
        personalPaidNotInLedger.length ? "Cocokkan approved Personal Paid expense ke Shareholder_Ledger." : "Approved personal-paid expense sudah cocok atau belum ada data personal-paid approved.",
        shareholderDebtOver60.length ? "Review hutang pemegang saham berumur >60 hari; putuskan reimburse, konversi modal, atau jadwal pembayaran." : shareholderDebtOver30.length ? "Review aging hutang pemegang saham >30 hari agar fairness pemegang saham tetap jelas." : shareholderDebtUnaged.length ? "Lengkapi tanggal di Shareholder_Ledger agar aging hutang pemegang saham bisa dihitung." : "Aging hutang pemegang saham tidak menunjukkan exception dari data terbaca.",
        hasMonthlyGcgReport ? `Review Monthly_GCG_Report terakhir: ${latestMonthlyGcg?.period || "TBA"}.` : "Generate dan catat Monthly GCG Report pertama setelah data expense/compliance/vendor siap.",
      ],
    };

    if (req.nextUrl.searchParams.get("format") === "csv") {
      return new NextResponse(toGovernanceCsv(payload), {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="governance-dashboard-${new Date().toISOString().slice(0, 10)}.csv"`,
        },
      });
    }

    return NextResponse.json(payload);
  } catch (error) {
    if (isGoogleWorkspaceAuthError(error)) {
      return NextResponse.json({
        ...googleWorkspaceDegradedSource(SOURCE, error),
        overallScore: 0,
        scores: [],
        summary: {},
        exceptions: [],
        nextActions: ["Re-auth Google Workspace agar dashboard governance bisa membaca Sheets source of truth."],
      });
    }
    return NextResponse.json({ error: "Failed to build governance dashboard", details: String(error) }, { status: 500 });
  }
}
