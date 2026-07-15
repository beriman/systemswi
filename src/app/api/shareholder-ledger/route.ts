// GET /api/shareholder-ledger — List shareholder ledger entries and outstanding debt summary
// POST /api/shareholder-ledger — Append a shareholder ledger entry to Google Sheets

import { NextRequest, NextResponse } from "next/server";
import {
  appendShareholderLedgerEntry,
  listShareholderLedger,
  updateShareholderLedgerEntry,
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

function daysSince(dateValue: string): number | null {
  if (!dateValue) return null;
  const date = new Date(`${dateValue.slice(0, 10)}T00:00:00Z`).getTime();
  const today = new Date(`${new Date().toISOString().slice(0, 10)}T00:00:00Z`).getTime();
  if (!Number.isFinite(date)) return null;
  return Math.max(0, Math.floor((today - date) / 86400000));
}

function isClosed(status: string): boolean {
  return ["rejected", "cancelled", "canceled", "settled", "paid", "converted to capital"].includes(status.toLowerCase().trim());
}

export async function GET() {
  try {
    const entries = await listShareholderLedger();
    const outstandingEntries = entries
      .map((entry) => ({
        ...entry,
        outstanding: entry.debit - entry.credit,
        ageDays: daysSince(entry.date),
      }))
      .filter((entry) => entry.outstanding > 0 && !isClosed(entry.approvalStatus));
    const over30Days = outstandingEntries.filter((entry) => entry.ageDays !== null && entry.ageDays > 30);
    const over60Days = outstandingEntries.filter((entry) => entry.ageDays !== null && entry.ageDays > 60);
    const unaged = outstandingEntries.filter((entry) => entry.ageDays === null);
    const outstandingDebt = outstandingEntries.reduce((sum, entry) => sum + entry.outstanding, 0);
    const personalPaid = entries.filter((entry) => entry.type === "Hutang Pemegang Saham" || entry.type === "Reimbursement");

    return NextResponse.json({
      source: SOURCE,
      sourceStatus: "live",
      entries,
      stats: {
        totalEntries: entries.length,
        outstandingDebt,
        outstandingRows: outstandingEntries.length,
        over30DaysCount: over30Days.length,
        over30DaysAmount: over30Days.reduce((sum, entry) => sum + entry.outstanding, 0),
        over60DaysCount: over60Days.length,
        over60DaysAmount: over60Days.reduce((sum, entry) => sum + entry.outstanding, 0),
        unagedCount: unaged.length,
        personalPaidCount: personalPaid.length,
        personalPaidAmount: personalPaid.reduce((sum, entry) => sum + entry.debit - entry.credit, 0),
      },
      nextActions: [
        over60Days.length ? "Review hutang pemegang saham >60 hari: putuskan reimburse, konversi modal, atau jadwal pembayaran." : "Tidak ada hutang pemegang saham >60 hari dari data terbaca.",
        over30Days.length ? "Review hutang pemegang saham >30 hari agar fairness pemegang saham tetap jelas." : "Tidak ada hutang pemegang saham >30 hari dari data terbaca.",
        unaged.length ? "Lengkapi tanggal ledger agar aging hutang pemegang saham bisa dihitung." : "Tanggal ledger cukup untuk aging dari data terbaca.",
      ],
      endpoint: {
        post: "POST JSON { description, debit/credit, shareholder, type, proofUrl, notes } untuk menambah ledger row.",
        put: "PUT JSON { id, credit/status/proofUrl/notes } untuk mencatat pelunasan/konversi/update; credit baru wajib proofUrl atau notes dan menulis Governance_Audit_Log.",
      },
    });
  } catch (error) {
    if (isGoogleWorkspaceAuthError(error)) {
      return NextResponse.json({
        ...googleWorkspaceDegradedSource(SOURCE, error),
        entries: [],
        stats: { totalEntries: 0, outstandingDebt: 0, outstandingRows: 0, over30DaysCount: 0, over30DaysAmount: 0, over60DaysCount: 0, over60DaysAmount: 0, unagedCount: 0, personalPaidCount: 0, personalPaidAmount: 0 },
        nextActions: ["Re-auth Google Workspace agar Shareholder_Ledger bisa dibaca dari source of truth."],
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

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const id = String(body.id || body.entryId || "").trim();
    if (!id) return NextResponse.json({ error: "id/entryId wajib diisi" }, { status: 400 });

    const result = await updateShareholderLedgerEntry(id, {
      date: body.date,
      shareholder: body.shareholder,
      type: body.type,
      division: body.division,
      description: body.description,
      debit: body.debit !== undefined ? n(body.debit) : undefined,
      credit: body.credit !== undefined ? n(body.credit) : undefined,
      balance: body.balance,
      approvalStatus: body.approvalStatus || body.status,
      approvedBy: body.approvedBy,
      proofUrl: body.proofUrl,
      notes: body.notes,
    });

    const beforeOutstanding = result.before.debit - result.before.credit;
    const afterOutstanding = result.after.debit - result.after.credit;
    await logGovernanceActionSafe({
      actor: body.actor || body.approvedBy || "Beriman Juliano",
      role: body.role || "Finance/Governance",
      action: afterOutstanding < beforeOutstanding ? "SETTLE_SHAREHOLDER_LEDGER" : "UPDATE_SHAREHOLDER_LEDGER",
      entityType: "Shareholder Ledger",
      entityId: id,
      amount: Math.abs(beforeOutstanding - afterOutstanding) || result.after.debit || result.after.credit,
      division: result.after.division,
      before: `${result.before.approvalStatus || "Draft"} | outstanding ${beforeOutstanding}`,
      after: `${result.after.approvalStatus || "Draft"} | outstanding ${afterOutstanding}`,
      reason: String(body.reason || result.after.notes || result.after.description || "Update Shareholder_Ledger"),
      proofUrl: result.after.proofUrl,
      sourceModule: "/api/shareholder-ledger",
    });

    return NextResponse.json({
      success: true,
      source: SOURCE,
      sourceStatus: "live",
      before: result.before,
      entry: result.after,
      audit: "Governance_Audit_Log",
    });
  } catch (error) {
    if (isGoogleWorkspaceAuthError(error)) {
      return NextResponse.json({
        sourceStatus: "blocked",
        source: SOURCE,
        error: "Google Workspace OAuth perlu re-auth sebelum bisa update shareholder ledger",
        details: String(error),
      }, { status: 503 });
    }
    const message = String(error);
    if (message.includes("not found")) return NextResponse.json({ error: message }, { status: 404 });
    if (message.includes("Proof URL atau notes wajib")) return NextResponse.json({ error: message }, { status: 422 });
    return NextResponse.json({ error: "Failed to update shareholder ledger", details: message }, { status: 500 });
  }
}
