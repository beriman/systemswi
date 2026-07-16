// GET /api/expenses — List all expense submissions (filter: status, event, category)
// POST /api/expenses — Submit new expense
import { NextRequest, NextResponse } from "next/server";
import {
  readExpenseSheet,
  appendExpenseRows,
  initializeExpenseSheets,
  EXPENSE_SHEETS,
} from "@/lib/expense/sheets";
import { readSheet } from "@/lib/sheets/sheets-real";
import { listVendorRegister } from "@/lib/governance/vendor-register";
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

function isMissingCoa(value: string): boolean {
  const normalized = value.toLowerCase();
  return !value || normalized.includes("tba") || normalized.includes("belum dicatat") || normalized.includes("belum tersedia");
}

function isMissingPaymentMethod(value: string): boolean {
  const normalized = value.toLowerCase();
  return !value || normalized.includes("tba") || normalized.includes("belum dicatat") || normalized.includes("belum tersedia");
}

const PAYMENT_METHODS = ["Cash", "Bank", "Personal Paid", "Company Paid"] as const;

function normalizePaymentMethod(value: unknown): string {
  const normalized = String(value ?? "").trim().toLowerCase().replace(/[\s_-]+/g, " ");
  if (!normalized) return "Company Paid";
  if (["cash", "tunai", "kas"].includes(normalized)) return "Cash";
  if (["bank", "transfer", "bank transfer", "rekening"].includes(normalized)) return "Bank";
  if (["personal paid", "paid personally", "dibayar pribadi", "pribadi"].includes(normalized)) return "Personal Paid";
  if (["company paid", "company", "perusahaan", "paid by company"].includes(normalized)) return "Company Paid";
  return "";
}

function isPersonalPaidMethod(value: string): boolean {
  return normalizePaymentMethod(value) === "Personal Paid";
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
  division: string;
  coaCategory: string;
  paymentMethod: string;
  relatedBrand: string;
  proofRequired: string;
  shareholderDebtFlag: string;
  vendorId: string;
  vendorName: string;
  vendorRelatedParty: string;
  vendorBenchmarkNotes: string;
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
    division: s(row, 12),
    coaCategory: s(row, 13),
    paymentMethod: s(row, 14),
    relatedBrand: s(row, 15),
    proofRequired: s(row, 16),
    shareholderDebtFlag: s(row, 17),
    vendorId: s(row, 18),
    vendorName: s(row, 19),
    vendorRelatedParty: s(row, 20),
    vendorBenchmarkNotes: s(row, 21),
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

    if (statusFilter) {
      expenses = expenses.filter((e) => e.status.toLowerCase() === statusFilter.toLowerCase());
    }
    if (eventFilter) {
      expenses = expenses.filter((e) => e.relatedEvent.toLowerCase().includes(eventFilter.toLowerCase()));
    }
    if (categoryFilter) {
      expenses = expenses.filter((e) => e.category.toLowerCase() === categoryFilter.toLowerCase());
    }

    const pending = expenses.filter((e) => e.status === "Pending");
    const approved = expenses.filter((e) => e.status === "Approved");
    const rejected = expenses.filter((e) => e.status === "Rejected");
    const needsProof = expenses.filter((e) => e.status === "Needs Proof" || (e.amount > 0 && !e.proofUrl));
    const withoutDivision = expenses.filter((e) => !e.division);
    const approvedWithoutDivisionOrCoa = approved.filter((e) => !e.division || isMissingCoa(e.coaCategory));
    const withoutPaymentMethod = expenses.filter((e) => isMissingPaymentMethod(e.paymentMethod));
    const approvedWithoutPaymentMethod = approved.filter((e) => isMissingPaymentMethod(e.paymentMethod));
    const personalPaid = expenses.filter((e) => isPersonalPaidMethod(e.paymentMethod) || e.shareholderDebtFlag === "Yes");
    const approvedPersonalPaid = personalPaid.filter((e) => e.status === "Approved");
    let personalPaidNotInLedger = approvedPersonalPaid;
    const vendorRequiredCategories = new Set(["Bahan Baku", "Packaging", "Venue", "Dokumentasi", "Sewa Booth"]);
    const vendorRequired = expenses.filter((e) => vendorRequiredCategories.has(e.category));
    const withoutVendor = vendorRequired.filter((e) => !e.vendorId && !e.vendorName);
    const vendorRelatedParty = expenses.filter((e) => e.vendorRelatedParty === "Yes");

    const currentMonth = today().slice(0, 7);
    const reviewedMonth = (e: ExpenseSubmission) => (e.reviewedDate || e.date || "").slice(0, 7);
    const approvedThisMonth = approved.filter((e) => reviewedMonth(e) === currentMonth);
    const rejectedThisMonth = rejected.filter((e) => reviewedMonth(e) === currentMonth);

    const eventMap: Record<string, { budget: number; actual: number }> = {};
    for (const exp of expenses) {
      if (!eventMap[exp.relatedEvent]) {
        eventMap[exp.relatedEvent] = { budget: 0, actual: 0 };
      }
      if (exp.status === "Approved") {
        eventMap[exp.relatedEvent].actual += exp.amount;
      }
    }

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

    try {
      const ledgerRows = await readSheet("ShareholderLedger");
      const ledgerSourceKeys = new Set<string>(
        ledgerRows.slice(1).map((row) => `${s(row, 12)} ${s(row, 5)}`)
      );
      personalPaidNotInLedger = approvedPersonalPaid.filter((expense) => {
        if (!expense.id) return false;
        return !Array.from(ledgerSourceKeys).some((value) => value.includes(expense.id));
      });
    } catch {
      // Shareholder_Ledger may not exist or may be unavailable; keep approved Personal Paid as reconciliation candidates.
    }

    return NextResponse.json({
      source: EXPENSES_SOURCE,
      sourceStatus: "live",
      expenses,
      stats: {
        total: expenses.length,
        pendingCount: pending.length,
        pendingAmount: pending.reduce((sum, e) => sum + e.amount, 0),
        approvedCount: approved.length,
        approvedAmount: approved.reduce((sum, e) => sum + e.amount, 0),
        approvedThisMonthCount: approvedThisMonth.length,
        approvedThisMonthAmount: approvedThisMonth.reduce((sum, e) => sum + e.amount, 0),
        rejectedCount: rejected.length,
        rejectedAmount: rejected.reduce((sum, e) => sum + e.amount, 0),
        rejectedThisMonthCount: rejectedThisMonth.length,
        rejectedThisMonthAmount: rejectedThisMonth.reduce((sum, e) => sum + e.amount, 0),
        needsProofCount: needsProof.length,
        needsProofAmount: needsProof.reduce((sum, e) => sum + e.amount, 0),
        withoutDivisionCount: withoutDivision.length,
        approvedWithoutDivisionOrCoaCount: approvedWithoutDivisionOrCoa.length,
        withoutPaymentMethodCount: withoutPaymentMethod.length,
        approvedWithoutPaymentMethodCount: approvedWithoutPaymentMethod.length,
        personalPaidCount: personalPaid.length,
        personalPaidAmount: personalPaid.reduce((sum, e) => sum + e.amount, 0),
        personalPaidNotInLedgerCount: personalPaidNotInLedger.length,
        personalPaidNotInLedgerAmount: personalPaidNotInLedger.reduce((sum, e) => sum + e.amount, 0),
        vendorRequiredCount: vendorRequired.length,
        withoutVendorCount: withoutVendor.length,
        vendorRelatedPartyCount: vendorRelatedParty.length,
      },
      budgetVsActual: eventMap,
    });
  } catch (error) {
    if (isGoogleWorkspaceAuthError(error)) {
      return NextResponse.json({
        ...googleWorkspaceDegradedSource(EXPENSES_SOURCE, error),
        expenses: [],
        stats: { total: 0, pendingCount: 0, pendingAmount: 0, approvedCount: 0, approvedAmount: 0, approvedThisMonthCount: 0, approvedThisMonthAmount: 0, rejectedCount: 0, rejectedAmount: 0, rejectedThisMonthCount: 0, rejectedThisMonthAmount: 0, needsProofCount: 0, needsProofAmount: 0, withoutDivisionCount: 0, approvedWithoutDivisionOrCoaCount: 0, withoutPaymentMethodCount: 0, approvedWithoutPaymentMethodCount: 0, personalPaidCount: 0, personalPaidAmount: 0, personalPaidNotInLedgerCount: 0, personalPaidNotInLedgerAmount: 0, vendorRequiredCount: 0, withoutVendorCount: 0, vendorRelatedPartyCount: 0 },
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
    const validCategories = ["Bahan Baku", "Packaging", "Venue", "Dokumentasi", "Sewa Booth", "Iklan", "Transport", "Lainnya"];
    const finalCategory = validCategories.includes(category) ? category : "Lainnya";
    const amount = n(body.amount);
    const proofUrl = body.proofUrl || "";
    const paymentMethod = normalizePaymentMethod(body.paymentMethod);
    if (!paymentMethod) {
      return NextResponse.json({
        error: "Payment Method tidak valid",
        allowedPaymentMethods: PAYMENT_METHODS,
        policy: "Gunakan Cash, Bank, Personal Paid, atau Company Paid agar sumber dana bisa ditelusuri dan personal-paid otomatis masuk Shareholder_Ledger setelah approved.",
      }, { status: 400 });
    }
    const shareholderDebtFlag = paymentMethod === "Personal Paid" || body.shareholderDebtFlag === true || body.shareholderDebtFlag === "Yes" ? "Yes" : "No";
    const proofRequired = amount > 0 ? "Yes" : "No";
    const status = proofRequired === "Yes" && !proofUrl ? "Needs Proof" : "Pending";
    const vendorId = String(body.vendorId || "").trim();
    let vendorName = String(body.vendorName || "").trim();
    let vendorRelatedParty = body.vendorRelatedParty === true || body.vendorRelatedParty === "Yes" ? "Yes" : "No";
    if (vendorId) {
      try {
        const registeredVendor = (await listVendorRegister()).find((vendor) => vendor.id === vendorId);
        if (registeredVendor) {
          vendorName = vendorName || registeredVendor.name;
          vendorRelatedParty = registeredVendor.relatedParty === "Yes" ? "Yes" : vendorRelatedParty;
        }
      } catch {
        // Keep submission non-blocking; approval endpoint will verify Vendor_Register before approving.
      }
    }

    const row = [
      submissionId,
      body.date || now,
      body.submitterName || "System",
      body.relatedEvent || "",
      finalCategory,
      body.description || "",
      amount,
      proofUrl,
      status,
      "",
      "",
      body.notes || "",
      body.division || "",
      body.coaCategory || "",
      paymentMethod,
      body.relatedBrand || "",
      proofRequired,
      shareholderDebtFlag,
      vendorId,
      vendorName,
      vendorRelatedParty,
      body.vendorBenchmarkNotes || "",
    ];

    await appendExpenseRows(EXPENSE_SHEETS.Submissions, [row]);

    return NextResponse.json({
      success: true,
      submissionId,
      status,
      message: status === "Needs Proof" ? "Expense submitted with Needs Proof status." : "Expense submitted successfully. Waiting for approval.",
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
