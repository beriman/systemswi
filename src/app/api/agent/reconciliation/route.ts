// GET /api/agent/reconciliation — Run Cash vs Rekening reconciliation
// POST /api/agent/reconciliation — Run + send Telegram report
import { NextRequest, NextResponse } from "next/server";
import { runReconciliation, formatReconciliationForTelegram } from "@/lib/agent/finance-reconciliation";
import { sendTelegramMessage, isTelegramConfigured } from "@/lib/agent/telegram";
import { logAgentActionSafe } from "@/lib/agent/audit";

export const runtime = "nodejs";

export async function GET() {
  try {
    const report = await runReconciliation();
    return NextResponse.json({
      source: "Google Sheets: Cash_Harian + Rekening_Koran",
      status: report.status,
      cashTotalDebit: report.cashTotalDebit,
      cashTotalCredit: report.cashTotalCredit,
      rekeningTotalDebit: report.rekeningTotalDebit,
      rekeningTotalCredit: report.rekeningTotalCredit,
      netDifference: report.netDifference,
      discrepancyCount: report.discrepancies.length,
      discrepancies: report.discrepancies,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to run reconciliation", details: String(error) },
      { status: 500 }
    );
  }
}

export async function POST() {
  try {
    const report = await runReconciliation();

    await logAgentActionSafe({
      timestamp: new Date().toISOString(),
      agent: "HemuHemu/OWL",
      action: "Finance Reconciliation",
      target: "Cash_Harian + Rekening_Koran",
      status: report.status === "matched" ? "success" : "success",
      humanApproved: "n/a",
      notes: `${report.discrepancies.length} discrepancies, net difference Rp ${report.netDifference.toLocaleString("id-ID")}`,
    });

    let telegramSent = false;
    if (isTelegramConfigured() && report.discrepancies.length > 0) {
      await sendTelegramMessage(formatReconciliationForTelegram(report));
      telegramSent = true;
    }

    return NextResponse.json({
      ...report,
      telegramSent,
      telegramConfigured: isTelegramConfigured(),
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to run reconciliation", details: String(error) },
      { status: 500 }
    );
  }
}
