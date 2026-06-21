// GET /api/expenses/[id] — Get expense detail
// PUT /api/expenses/[id] — Approve / reject expense
import { NextRequest, NextResponse } from "next/server";
import {
  readExpenseSheet,
  updateExpenseRow,
  ensureExpenseSheet,
  initializeExpenseSheets,
  EXPENSE_SHEETS,
} from "@/lib/expense/sheets";
import { appendRows } from "@/lib/sheets/sheets-real";
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

    const row = rows[rowIndex];
    const expense = {
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
    };

    return NextResponse.json({ source: EXPENSES_SOURCE, sourceStatus: "live", expense });
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

    const rowNum = rowIndex + 1; // 1-indexed
    const existing = rows[rowIndex];
    const now = today();

    // Update the row: Status (col I=9), Reviewed By (col J=10), Reviewed Date (col K=11), Notes (col L=12)
    const updatedRow = [
      s(existing, 0),  // Submission ID
      s(existing, 1),  // Date
      s(existing, 2),  // Submitter Name
      s(existing, 3),  // Related Event
      s(existing, 4),  // Category
      s(existing, 5),  // Description
      n(existing[6]),  // Amount
      s(existing, 7),  // Proof URL
      status,          // Status
      reviewedBy || "",// Reviewed By
      now,             // Reviewed Date
      notes || s(existing, 11), // Notes
    ];

    await updateExpenseRow(EXPENSE_SHEETS.Submissions, rowNum, updatedRow);

    // If approved, auto-insert into Brand_Expenses
    if (status === "Approved") {
      try {
        await appendRows("BrandExpenses", [[
          `exp-${id}`,
          now,
          "",              // brandId — not linked to brand
          s(existing, 3),  // brandName → use relatedEvent
          s(existing, 4),  // category
          s(existing, 5),  // expenseName → description
          "",              // channelEvent
          n(existing[6]),  // amount
          "",              // paymentMethod
          "",              // vendor
          s(existing, 7),  // proofUrl
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
