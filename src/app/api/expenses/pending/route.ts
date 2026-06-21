// GET /api/expenses/pending — List pending expenses for approver
import { NextResponse } from "next/server";
import {
  readExpenseSheet,
  initializeExpenseSheets,
  EXPENSE_SHEETS,
} from "@/lib/expense/sheets";
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

export async function GET() {
  try {
    await initializeExpenseSheets();
    const rows = await readExpenseSheet(EXPENSE_SHEETS.Submissions);

    const pending = rows.slice(1)
      .filter((row) => s(row, 0) && (s(row, 8) || "Pending") === "Pending")
      .map((row) => ({
        id: s(row, 0),
        date: s(row, 1),
        submitterName: s(row, 2),
        relatedEvent: s(row, 3),
        category: s(row, 4),
        description: s(row, 5),
        amount: n(row[6]),
        proofUrl: s(row, 7),
        status: s(row, 8) || "Pending",
      }));

    const totalPendingAmount = pending.reduce((sum, e) => sum + e.amount, 0);

    return NextResponse.json({
      source: EXPENSES_SOURCE,
      sourceStatus: "live",
      pending,
      count: pending.length,
      totalPendingAmount,
    });
  } catch (error) {
    if (isGoogleWorkspaceAuthError(error)) {
      return NextResponse.json({
        ...googleWorkspaceDegradedSource(EXPENSES_SOURCE, error),
        pending: [],
        count: 0,
        totalPendingAmount: 0,
      });
    }
    return NextResponse.json({ error: "Failed to fetch pending expenses", details: String(error) }, { status: 500 });
  }
}
