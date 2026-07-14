// GET /api/shareholder-ledger — List shareholder ledger entries and outstanding debt summary
// POST /api/shareholder-ledger — Append a shareholder ledger entry to Google Sheets

import { NextRequest, NextResponse } from "next/server";
import {
  appendShareholderLedgerEntry,
  listShareholderLedger,
} from "@/lib/shareholder/ledger";
import { googleWorkspaceDegradedSource, isGoogleWorkspaceAuthError } from "@/lib/api/google-workspace-error";
import { logGovernanceActionSafe } from "@/lib/governance/audit";

const SOURCE = "Google Sheets: Shareholder_Ledger";

function n(value: unknown): number {
  if (typeof value === "number") return value;
  if (!value) return 0;
  const cleaned = String(value).replace(/[^0-9.-]/g, "");
  return Number(cleaned) || 0;
}

export async function GET() {
  try {
    const entries = await listShareholderLedger();
    const outstandingDebt = entries.reduce((sum, entry) => sum + entry.debit - entry.credit, 0);
    const personalPaid = entries.filter((entry) => entry.type === "Hutang Pemegang Saham" || entry.type === "Reimbursement");

    return NextResponse.json({
      source: SOURCE,
      sourceStatus: "live",
      entries,
      stats: {
        totalEntries: entries.length,
        outstandingDebt,
        personalPaidCount: personalPaid.length,
        personalPaidAmount: personalPaid.reduce((sum, entry) => sum + entry.debit - entry.credit, 0),
      },
    });
  } catch (error) {
    if (isGoogleWorkspaceAuthError(error)) {
      return NextResponse.json({
        ...googleWorkspaceDegradedSource(SOURCE, error),
        entries: [],
        stats: { totalEntries: 0, outstandingDebt: 0, personalPaidCount: 0, personalPaidAmount: 0 },
      });
    }
    return NextResponse.json({ error: "Failed to fetch shareholder ledger", details: String(error) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const debit = n(body.debit ?? body.amount);
    const credit = n(body.credit);
    if (!body.description || (debit <= 0 && credit <= 0)) {
      return NextResponse.json({ error: "description and debit/credit amount are required" }, { status: 400 });
    }

    const entry = await appendShareholderLedgerEntry({
      date: body.date || new Date().toISOString().slice(0, 10),
      shareholder: body.shareholder || "Beriman Juliano",
      type: body.type || "Hutang Pemegang Saham",
      division: body.division || "Belum dicatat",
      description: body.description,
      debit,
      credit,
      approvalStatus: body.approvalStatus || "Draft",
      approvedBy: body.approvedBy || "",
      proofUrl: body.proofUrl || "",
      notes: body.notes || "Manual shareholder ledger entry from /api/shareholder-ledger",
    });

    await logGovernanceActionSafe({
      actor: body.actor || body.approvedBy || "systemswi",
      role: body.role || "Finance/Governance",
      action: credit > 0 ? "RECORD_SHAREHOLDER_LEDGER_CREDIT" : "RECORD_SHAREHOLDER_LEDGER_DEBIT",
      entityType: "Shareholder Ledger",
      entityId: entry.id,
      amount: debit || credit,
      division: entry.division,
      before: "Not recorded",
      after: entry.approvalStatus || "Draft",
      reason: entry.description || entry.notes,
      proofUrl: entry.proofUrl,
      sourceModule: "/api/shareholder-ledger",
    });

    return NextResponse.json({ success: true, source: SOURCE, sourceStatus: "live", entry, audit: "Governance_Audit_Log" }, { status: 201 });
  } catch (error) {
    if (isGoogleWorkspaceAuthError(error)) {
      return NextResponse.json({
        sourceStatus: "blocked",
        source: SOURCE,
        error: "Google Workspace OAuth perlu re-auth sebelum bisa update shareholder ledger",
        details: String(error),
      }, { status: 503 });
    }
    return NextResponse.json({ error: "Failed to append shareholder ledger", details: String(error) }, { status: 500 });
  }
}