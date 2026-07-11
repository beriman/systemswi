// GET /api/expenses/[id] — Get expense detail
// PUT /api/expenses/[id] — Approve / reject expense
import { NextRequest, NextResponse } from "next/server";
import {
  readExpenseSheet,
  updateExpenseRow,
  initializeExpenseSheets,
  EXPENSE_SHEETS,
} from "@/lib/expense/sheets";
import { appendRows } from "@/lib/sheets/sheets-real";
import { logGovernanceActionSafe } from "@/lib/governance/audit";
import { googleWorkspaceDegradedSource, isGoogleWorkspaceAuthError } from "@/lib/api/google-workspace-error";

const EXPENSES_SOURCE = "Google Sheets: Expense_Submissions";

function n(value: unknown): number {
  if (typeof value === "number") return value;
  if (!value) return 0;
  const cleaned = String(value).replace(/[^0-9.-]/g, "");
  return Number(cleaned) || 0;
}

function s(row: string[], idx: number): string {
  return row[idx] || "";
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function parseExpense(row: string[]) {
  return {
    id: s(row, 0),
    date: s(row, 1),
    submitterName: s(row, 2),
    relatedEvent: s(row, 3),
    category: s(row, 4),
    description: s(row, 5),
    amount: n(row[6]),
    proofUrl: s(row, 7),
    status: s(row, 8) || "Pending",
    reviewedBy: s(row, 9),
    reviewedDate: s(row, 10),
    notes: s(row, 11),
    division: s(row, 12),
    coaCategory: s(row, 13),
    paymentMethod: s(row, 14),
    relatedBrand: s(row, 15),
    proofRequired: s(row, 16),
    shareholderDebtFlag: s(row, 17),
  };
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await initializeExpenseSheets();
    const { id } = await params;
    const rows = await readExpenseSheet(EXPENSE_SHEETS.Submissions);

    const rowIndex = rows.findIndex((row, i) => i > 0 && s(row, 0) === id);
    if (rowIndex === -1) {
      return NextResponse.json({ error: "Expense not found" }, { status: 404 });
    }

    return NextResponse.json({ source: EXPENSES_SOURCE, sourceStatus: "live", expense: parseExpense(rows[rowIndex]) });
  } catch (error) {
    if (isGoogleWorkspaceAuthError(error)) {
      return NextResponse.json({
        ...googleWorkspaceDegradedSource(EXPENSES_SOURCE, error),
        expense: null,
      });
    }
    return NextResponse.json({ error: "Failed to fetch expense detail", details: String(error) }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await initializeExpenseSheets();
    const { id } = await params;
    const body = await req.json();
    const { status, reviewedBy, notes } = body;

    if (!status || !["Approved", "Rejected"].includes(status)) {
      return NextResponse.json({ error: "Status must be 'Approved' or 'Rejected'" }, { status: 400 });
    }

    const rows = await readExpenseSheet(EXPENSE_SHEETS.Submissions);
    const rowIndex = rows.findIndex((row, i) => i > 0 && s(row, 0) === id);
    if (rowIndex === -1) {
      return NextResponse.json({ error: "Expense not found" }, { status: 404 });
    }

    const rowNum = rowIndex + 1;
    const existing = rows[rowIndex];
    const now = today();
    const previousStatus = s(existing, 8) || "Pending";

    const updatedRow = [
      s(existing, 0),
      s(existing, 1),
      s(existing, 2),
      s(existing, 3),
      s(existing, 4),
      s(existing, 5),
      n(existing[6]),
      s(existing, 7),
      status,
      reviewedBy || "",
      now,
      notes || s(existing, 11),
      s(existing, 12),
      s(existing, 13),
      s(existing, 14),
      s(existing, 15),
      s(existing, 16),
      s(existing, 17),
    ];

    await updateExpenseRow(EXPENSE_SHEETS.Submissions, rowNum, updatedRow);

    await logGovernanceActionSafe({
      actor: reviewedBy || "Beriman Juliano",
      role: "Direktur",
      action: status === "Approved" ? "APPROVE_EXPENSE" : "REJECT_EXPENSE",
      entityType: "Expense",
      entityId: id,
      amount: n(existing[6]),
      division: s(existing, 12),
      before: previousStatus,
      after: status,
      reason: notes || s(existing, 11),
      proofUrl: s(existing, 7),
      sourceModule: "/expenses",
    });

    if (status === "Approved") {
      try {
        await appendRows("BrandExpenses", [[
          `exp-${id}`,
          now,
          "",
          s(existing, 15) || s(existing, 3),
          s(existing, 4),
          s(existing, 5),
          s(existing, 3),
          n(existing[6]),
          s(existing, 14),
          "",
          s(existing, 7),
          `Auto-imported from expense ${id}. ${notes || ""}`,
        ]]);
      } catch {
        // Brand_Expenses append is best-effort; don't fail the approval
      }
    }

    return NextResponse.json({
      success: true,
      id,
      status,
      reviewedBy: reviewedBy || "",
      reviewedDate: now,
      audit: "Governance_Audit_Log",
      message: `Expense ${status.toLowerCase()} successfully.`,
    });
  } catch (error) {
    if (isGoogleWorkspaceAuthError(error)) {
      return NextResponse.json({
        sourceStatus: "blocked",
        source: EXPENSES_SOURCE,
        error: "Google Workspace OAuth perlu re-auth sebelum bisa update expense",
        details: String(error),
      }, { status: 503 });
    }
    return NextResponse.json({ error: "Failed to update expense", details: String(error) }, { status: 500 });
  }
}
