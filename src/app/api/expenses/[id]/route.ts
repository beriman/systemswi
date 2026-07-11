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
import { appendShareholderLedgerEntryOnce } from "@/lib/shareholder/ledger";
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
    vendorId: s(row, 18),
    vendorName: s(row, 19),
    vendorRelatedParty: s(row, 20),
    vendorBenchmarkNotes: s(row, 21),
  };
}

function approvalBlockers(row: string[]): string[] {
  const blockers: string[] = [];
  const amount = n(row[6]);
  const category = s(row, 4);
  const division = s(row, 12);
  const coaCategory = s(row, 13);
  const proofUrl = s(row, 7);
  const relatedEvent = s(row, 3);
  const vendorId = s(row, 18);
  const vendorName = s(row, 19);
  const vendorRelatedParty = s(row, 20);
  const vendorBenchmarkNotes = s(row, 21);
  const vendorRequiredCategories = new Set(["Bahan Baku", "Packaging", "Sewa Booth"]);

  if (amount > 0 && !proofUrl) blockers.push("Bukti pembayaran/nota wajib diisi sebelum approve expense bernilai > 0.");
  if (!division) blockers.push("Division wajib diisi sebelum approve.");
  if (!coaCategory) blockers.push("COA Category wajib diisi sebelum approve.");
  if (category === "Sewa Booth" && !relatedEvent) blockers.push("Expense event/sewa booth wajib dikaitkan ke related event/project sebelum approve.");
  if (vendorRequiredCategories.has(category) && !vendorId && !vendorName) blockers.push("Kategori vendor (Bahan Baku/Packaging/Sewa Booth) wajib punya Vendor ID atau Vendor Name sebelum approve.");
  if (amount > 2_000_000 && vendorRequiredCategories.has(category) && !vendorBenchmarkNotes) blockers.push("Expense vendor > Rp2.000.000 wajib mencatat minimal 2 benchmark/alasan pemilihan sebelum approve.");
  if (vendorRelatedParty === "Yes" && !vendorBenchmarkNotes) blockers.push("Vendor related-party wajib punya catatan konflik kepentingan dan alasan objektif sebelum approve.");

  return blockers;
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

    if (status === "Approved") {
      const blockers = approvalBlockers(existing);
      if (blockers.length) {
        return NextResponse.json({
          error: "Expense belum memenuhi aturan GCG untuk approval.",
          blockers,
          policy: {
            proofRequired: "Expense amount > 0 wajib punya proof URL.",
            divisionAndCoa: "Division dan COA Category wajib terisi sebelum approve.",
            eventExpense: "Expense event/sewa booth wajib dikaitkan ke event/project.",
            vendorThreshold: "Bahan Baku/Packaging/Sewa Booth wajib vendor; > Rp2.000.000 wajib benchmark notes.",
            relatedParty: "Related-party vendor wajib catatan konflik kepentingan.",
          },
        }, { status: 422 });
      }
    }

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
      s(existing, 18),
      s(existing, 19),
      s(existing, 20),
      s(existing, 21),
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
      const isPersonalPaid = s(existing, 14) === "Personal Paid" || s(existing, 17) === "Yes";
      if (isPersonalPaid) {
        try {
          await appendShareholderLedgerEntryOnce(`expense:${id}`, {
            date: s(existing, 1) || now,
            shareholder: s(existing, 2) || "Beriman Juliano",
            type: "Hutang Pemegang Saham",
            division: s(existing, 12) || "Belum dicatat",
            description: s(existing, 5) || `Personal-paid expense ${id}`,
            debit: n(existing[6]),
            credit: 0,
            approvalStatus: "Approved",
            approvedBy: reviewedBy || "Beriman Juliano",
            proofUrl: s(existing, 7),
            notes: `Auto-created from approved personal-paid expense:${id}. ${notes || s(existing, 11) || ""}`,
          });
        } catch {
          // Shareholder ledger append is best-effort; don't fail the approval
        }
      }

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
