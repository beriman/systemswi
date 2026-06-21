// GET /api/expenses — List all expense submissions (filter: status, event, category)
// POST /api/expenses — Submit new expense
import { NextRequest, NextResponse } from "next/server";
import {
  readExpenseSheet,
  appendExpenseRows,
  ensureExpenseSheet,
  initializeExpenseSheets,
  EXPENSE_SHEETS,
} from "@/lib/expense/sheets";
import { readSheet } from "@/lib/sheets/sheets-real";
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

interface ExpenseSubmission {
  id: string;
  date: string;
  submitterName: string;
  relatedEvent: string;
  category: string;
  description: string;
  amount: number;
  proofUrl: string;
  status: string;
  reviewedBy: string;
  reviewedDate: string;
  notes: string;
}

function parseExpenseRows(rows: string[][]): ExpenseSubmission[] {
  if (rows.length <= 1) return [];
  return rows.slice(1).filter((row) => s(row, 0)).map((row) => ({
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
  }));
}

export async function GET(req: NextRequest) {
  try {
    await initializeExpenseSheets();

    const url = new URL(req.url);
    const statusFilter = url.searchParams.get("status");
    const eventFilter = url.searchParams.get("event");
    const categoryFilter = url.searchParams.get("category");

    const rows = await readExpenseSheet(EXPENSE_SHEETS.Submissions);
    let expenses = parseExpenseRows(rows);

    // Apply filters
    if (statusFilter) {
      expenses = expenses.filter((e) => e.status.toLowerCase() === statusFilter.toLowerCase());
    }
    if (eventFilter) {
      expenses = expenses.filter((e) => e.relatedEvent.toLowerCase().includes(eventFilter.toLowerCase()));
    }
    if (categoryFilter) {
      expenses = expenses.filter((e) => e.category.toLowerCase() === categoryFilter.toLowerCase());
    }

    // Compute dashboard stats
    const pending = expenses.filter((e) => e.status === "Pending");
    const approved = expenses.filter((e) => e.status === "Approved");
    const rejected = expenses.filter((e) => e.status === "Rejected");

    const currentMonth = today().slice(0, 7);
    const approvedThisMonth = approved.filter((e) => e.date.startsWith(currentMonth));

    // Budget vs actual per event
    const eventMap: Record<string, { budget: number; actual: number }> = {};
    for (const exp of expenses) {
      if (!eventMap[exp.relatedEvent]) {
        eventMap[exp.relatedEvent] = { budget: 0, actual: 0 };
      }
      if (exp.status === "Approved") {
        eventMap[exp.relatedEvent].actual += exp.amount;
      }
    }

    // Read Event_Budget for budget amounts
    try {
      const budgetRows = await readSheet("EventBudget");
      if (budgetRows.length > 1) {
        for (const row of budgetRows.slice(1)) {
          const eventName = s(row, 1) || s(row, 0);
          const budgetAmount = n(row[4]) || n(row[3]);
          if (eventName && eventMap[eventName]) {
            eventMap[eventName].budget = budgetAmount;
          }
        }
      }
    } catch {
      // Budget sheet may not be available, continue without it
    }

    return NextResponse.json({
      source: EXPENSES_SOURCE,
      sourceStatus: "live",
      expenses,
      stats: {
        total: expenses.length,
        pendingCount: pending.length,
        pendingAmount: pending.reduce((s, e) => s + e.amount, 0),
        approvedCount: approved.length,
        approvedAmount: approved.reduce((s, e) => s + e.amount, 0),
        approvedThisMonthCount: approvedThisMonth.length,
        approvedThisMonthAmount: approvedThisMonth.reduce((s, e) => s + e.amount, 0),
        rejectedCount: rejected.length,
        rejectedAmount: rejected.reduce((s, e) => s + e.amount, 0),
      },
      budgetVsActual: eventMap,
    });
  } catch (error) {
    if (isGoogleWorkspaceAuthError(error)) {
      return NextResponse.json({
        ...googleWorkspaceDegradedSource(EXPENSES_SOURCE, error),
        expenses: [],
        stats: { total: 0, pendingCount: 0, pendingAmount: 0, approvedCount: 0, approvedAmount: 0, approvedThisMonthCount: 0, approvedThisMonthAmount: 0, rejectedCount: 0, rejectedAmount: 0 },
        budgetVsActual: {},
      });
    }
    return NextResponse.json({ error: "Failed to fetch expenses", details: String(error) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await initializeExpenseSheets();

    const body = await req.json();
    const now = today();
    const submissionId = `EXP-${Date.now()}`;

    const category = body.category || "Lainnya";
    const validCategories = ["Bahan Baku", "Iklan", "Sewa Booth", "Transport", "Packaging", "Lainnya"];
    const finalCategory = validCategories.includes(category) ? category : "Lainnya";

    const row = [
      submissionId,
      body.date || now,
      body.submitterName || "System",
      body.relatedEvent || "",
      finalCategory,
      body.description || "",
      n(body.amount),
      body.proofUrl || "",
      "Pending",
      "",
      "",
      body.notes || "",
    ];

    await appendExpenseRows(EXPENSE_SHEETS.Submissions, [row]);

    return NextResponse.json({
      success: true,
      submissionId,
      message: "Expense submitted successfully. Waiting for approval.",
    }, { status: 201 });
  } catch (error) {
    if (isGoogleWorkspaceAuthError(error)) {
      return NextResponse.json({
        sourceStatus: "blocked",
        source: EXPENSES_SOURCE,
        error: "Google Workspace OAuth perlu re-auth sebelum bisa submit expense",
        details: String(error),
      }, { status: 503 });
    }
    return NextResponse.json({ error: "Failed to submit expense", details: String(error) }, { status: 500 });
  }
}
