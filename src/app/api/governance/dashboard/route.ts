import { NextResponse } from "next/server";
import { googleWorkspaceDegradedSource, isGoogleWorkspaceAuthError } from "@/lib/api/google-workspace-error";
import { readRange, readSheet } from "@/lib/sheets/sheets-real";

export const runtime = "nodejs";

const SOURCE = "Google Sheets: Expense_Submissions + Shareholder_Ledger + Compliance_Register + Vendor_Register + Governance_Audit_Log";

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

function isOverdue(dueDate: string): boolean {
  if (!dueDate) return false;
  const due = new Date(`${dueDate}T00:00:00Z`).getTime();
  const today = new Date(`${new Date().toISOString().slice(0, 10)}T00:00:00Z`).getTime();
  return Number.isFinite(due) && due < today;
}

async function readRows(): Promise<{ rows: Record<string, string[][]>; sourceStatus: SourceStatus; warning?: string; details?: string }> {
  let googleAuthError: unknown = null;
  const emptyOnAuthError = (error: unknown): string[][] => {
    if (isGoogleWorkspaceAuthError(error)) googleAuthError ||= error;
    return [];
  };

  const [expenses, shareholderLedger, complianceRegister, vendorRegister, governanceAuditLog, tasks] = await Promise.all([
    readRange("Expense_Submissions!A1:R1000").catch(emptyOnAuthError),
    readSheet("ShareholderLedger").catch(emptyOnAuthError),
    readSheet("ComplianceRegister").catch(emptyOnAuthError),
    readSheet("VendorRegister").catch(emptyOnAuthError),
    readSheet("GovernanceAuditLog").catch(emptyOnAuthError),
    readSheet("Tasks").catch(emptyOnAuthError),
  ]);

  const degraded = googleAuthError ? googleWorkspaceDegradedSource(SOURCE, googleAuthError) : null;
  return {
    rows: { expenses, shareholderLedger, complianceRegister, vendorRegister, governanceAuditLog, tasks },
    sourceStatus: degraded ? "degraded" : "live",
    warning: degraded?.warning,
    details: degraded?.details,
  };
}

export async function GET() {
  try {
    const { rows, sourceStatus, warning, details } = await readRows();
    const expenses = rows.expenses.slice(1).filter((row) => text(row[0]));
    const shareholderLedger = rows.shareholderLedger.slice(1).filter((row) => text(row[0]));
    const complianceRegister = rows.complianceRegister.slice(1).filter((row) => text(row[0]));
    const vendorRegister = rows.vendorRegister.slice(1).filter((row) => text(row[0]));
    const governanceAuditLog = rows.governanceAuditLog.slice(1).filter((row) => text(row[0]));
    const tasks = rows.tasks.slice(1).filter((row) => text(row[0]));

    const expenseWithProof = expenses.filter((row) => amount(row[6]) <= 0 || Boolean(text(row[7])));
    const expenseWithDivision = expenses.filter((row) => Boolean(text(row[12])) && Boolean(text(row[13] || row[4])));
    const expensePending = expenses.filter((row) => text(row[8]).toLowerCase() === "pending");
    const expenseNeedsProof = expenses.filter((row) => text(row[8]).toLowerCase() === "needs proof" || (amount(row[6]) > 0 && !text(row[7])));
    const expenseLargeWithoutApproval = expenses.filter((row) => amount(row[6]) > 500000 && !isClosed(text(row[8])));
    const approvedExpenses = expenses.filter((row) => text(row[8]).toLowerCase() === "approved");
    const approvedWithReviewer = approvedExpenses.filter((row) => Boolean(text(row[9])));
    const personalPaidExpenses = expenses.filter((row) => text(row[14]).toLowerCase() === "personal paid" || isYes(text(row[17])));

    const taskWithOwner = tasks.filter((row) => Boolean(text(row[3] || row[4] || row[5])));
    const openCompliance = complianceRegister.filter((row) => !isApproved(text(row[5])));
    const overdueCompliance = openCompliance.filter((row) => isOverdue(text(row[4])) || text(row[5]).toLowerCase() === "overdue");
    const dueSoonCompliance = openCompliance.filter((row) => {
      const due = text(row[4]);
      if (!due || isOverdue(due)) return false;
      const dueTime = new Date(`${due}T00:00:00Z`).getTime();
      const today = new Date(`${new Date().toISOString().slice(0, 10)}T00:00:00Z`).getTime();
      return Number.isFinite(dueTime) && Math.ceil((dueTime - today) / 86400000) <= 7;
    });

    const vendorWithBenchmark = vendorRegister.filter((row) => Boolean(text(row[6])) && Boolean(text(row[7])) && Boolean(text(row[8])));
    const relatedPartyVendors = vendorRegister.filter((row) => isYes(text(row[4])));
    const vendorExceptions = vendorRegister.filter((row) => isYes(text(row[4])) || !text(row[6]) || !text(row[7]) || !text(row[8]));

    const shareholderDebtOutstanding = shareholderLedger.reduce((sum, row) => {
      const status = text(row[9]).toLowerCase();
      if (["rejected", "cancelled"].includes(status)) return sum;
      return sum + amount(row[6]) - amount(row[7]);
    }, 0);
    const shareholderLedgerSourceKeys = new Set(shareholderLedger.map((row) => text(row[12]) + " " + text(row[5])));
    const personalPaidNotInLedger = personalPaidExpenses.filter((expense) => {
      const id = text(expense[0]);
      if (!id) return false;
      return !Array.from(shareholderLedgerSourceKeys).some((value) => value.includes(id));
    });

    const transparencyScore = Math.round((percent(expenseWithProof.length, expenses.length) + percent(expenseWithDivision.length, expenses.length)) / 2);
    const accountabilityScore = Math.round((percent(approvedWithReviewer.length, approvedExpenses.length) + percent(taskWithOwner.length, tasks.length) + percent(governanceAuditLog.length > 0 ? 1 : 0, 1)) / 3);
    const responsibilityScore = percent(complianceRegister.length - overdueCompliance.length, complianceRegister.length);
    const independencyScore = percent(vendorWithBenchmark.length, vendorRegister.length);
    const fairnessScore = percent(personalPaidExpenses.length - personalPaidNotInLedger.length, personalPaidExpenses.length);

    const scores = [
      makeScore("transparency", "Transparency", transparencyScore, `${expenseWithProof.length}/${expenses.length} expense punya bukti atau amount 0; ${expenseWithDivision.length}/${expenses.length} punya division/COA.`),
      makeScore("accountability", "Accountability", accountabilityScore, `${approvedWithReviewer.length}/${approvedExpenses.length} approved expense punya reviewer; ${governanceAuditLog.length} governance audit rows.`),
      makeScore("responsibility", "Responsibility", responsibilityScore, `${overdueCompliance.length} overdue dari ${complianceRegister.length} compliance item.`),
      makeScore("independency", "Independency", independencyScore, `${vendorWithBenchmark.length}/${vendorRegister.length} vendor punya benchmark + selected reason.`),
      makeScore("fairness", "Fairness", fairnessScore, `${personalPaidNotInLedger.length}/${personalPaidExpenses.length} personal-paid expense belum terlacak ke ledger.`),
    ];

    const overallScore = Math.round(scores.reduce((sum, score) => sum + score.score, 0) / scores.length);

    return NextResponse.json({
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
          largeWithoutApprovalCount: expenseLargeWithoutApproval.length,
          personalPaidCount: personalPaidExpenses.length,
          personalPaidAmount: personalPaidExpenses.reduce((sum, row) => sum + amount(row[6]), 0),
          personalPaidNotInLedgerCount: personalPaidNotInLedger.length,
        },
        shareholder: {
          ledgerRows: shareholderLedger.length,
          outstandingDebt: shareholderDebtOutstanding,
        },
        compliance: {
          total: complianceRegister.length,
          open: openCompliance.length,
          overdue: overdueCompliance.length,
          dueSoon: dueSoonCompliance.length,
        },
        vendor: {
          total: vendorRegister.length,
          relatedParty: relatedPartyVendors.length,
          exceptions: vendorExceptions.length,
          benchmarkComplete: vendorWithBenchmark.length,
        },
        audit: {
          governanceAuditRows: governanceAuditLog.length,
        },
      },
      exceptions: [
        ...expenseNeedsProof.slice(0, 10).map((row) => ({ type: "EXPENSE_NEEDS_PROOF", severity: "high", entityId: text(row[0]), description: text(row[5]) || "Expense tanpa bukti", amount: amount(row[6]), owner: text(row[2]) || "Belum dicatat" })),
        ...expenseLargeWithoutApproval.slice(0, 10).map((row) => ({ type: "LARGE_EXPENSE_PENDING_APPROVAL", severity: "high", entityId: text(row[0]), description: text(row[5]) || "Expense besar belum closed approval", amount: amount(row[6]), owner: text(row[2]) || "Belum dicatat" })),
        ...overdueCompliance.slice(0, 10).map((row) => ({ type: "COMPLIANCE_OVERDUE", severity: "high", entityId: text(row[0]), description: text(row[2]) || "Compliance overdue", amount: 0, owner: text(row[6]) || "Belum dicatat" })),
        ...vendorExceptions.slice(0, 10).map((row) => ({ type: "VENDOR_GOVERNANCE_EXCEPTION", severity: isYes(text(row[4])) ? "high" : "medium", entityId: text(row[0]), description: text(row[1]) || "Vendor perlu review benchmark/COI", amount: 0, owner: text(row[3]) || "Belum dicatat" })),
        ...personalPaidNotInLedger.slice(0, 10).map((row) => ({ type: "PERSONAL_PAID_NOT_IN_LEDGER", severity: "medium", entityId: text(row[0]), description: text(row[5]) || "Personal paid belum cocok ke Shareholder_Ledger", amount: amount(row[6]), owner: text(row[2]) || "Belum dicatat" })),
      ],
      nextActions: [
        expenseNeedsProof.length ? "Lengkapi proof URL untuk expense berstatus Needs Proof/tanpa bukti." : "Pertahankan disiplin bukti expense.",
        expensePending.length ? "Review dan approve/reject expense pending; semua keputusan harus masuk Governance_Audit_Log." : "Tidak ada expense pending dari data yang terbaca.",
        overdueCompliance.length ? "Tindaklanjuti compliance overdue dan upload bukti setelah selesai." : "Pantau compliance due soon dan jangan menandai submitted tanpa bukti.",
        vendorExceptions.length ? "Lengkapi benchmark vendor dan deklarasi related-party sebelum transaksi besar." : "Vendor register tidak menunjukkan exception dari data terbaca.",
        personalPaidNotInLedger.length ? "Cocokkan expense Personal Paid approved ke Shareholder_Ledger." : "Personal-paid expense sudah cocok atau belum ada data personal-paid.",
      ],
    });
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
