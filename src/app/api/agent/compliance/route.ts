// GET /api/agent/compliance — Check BPOM/Halal/SSL expiry
// POST /api/agent/compliance — Check + send Telegram alerts
import { NextResponse } from "next/server";
import { runComplianceCheck, formatComplianceForTelegram } from "@/lib/agent/compliance-tracking";
import { sendTelegramMessage, isTelegramConfigured } from "@/lib/agent/telegram";
import { logAgentActionSafe } from "@/lib/agent/audit";

export const runtime = "nodejs";

export async function GET() {
  try {
    const report = await runComplianceCheck();
    return NextResponse.json({
      source: "Google Sheets: Compliance_Checks + Legal_Compliance + Compliance_Register",
      status: report.totalAlerts === 0 ? "all_valid" : report.expired > 0 ? "expired" : "expiring_soon",
      bpom: report.bpom,
      halal: report.halal,
      register: report.register,
      totalAlerts: report.totalAlerts,
      expired: report.expired,
      expiringSoon: report.expiringSoon,
      registerReminders: report.register.length,
      registerMissingProof: report.register.filter((item) => item.reminderStage === "missing_proof").length,
      valid: report.valid,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to run compliance check", details: String(error) },
      { status: 500 }
    );
  }
}

export async function POST() {
  try {
    const report = await runComplianceCheck();

    await logAgentActionSafe({
      timestamp: new Date().toISOString(),
      agent: "HemuHemu/OWL",
      action: "Compliance Check",
      target: "Compliance_Checks + Legal_Compliance + Compliance_Register",
      status: report.totalAlerts === 0 ? "success" : "success",
      humanApproved: "n/a",
      notes: `Expired: ${report.expired}, Expiring: ${report.expiringSoon}, Register reminders: ${report.register.length}, Missing proof: ${report.register.filter((item) => item.reminderStage === "missing_proof").length}, Valid: ${report.valid}`,
    });

    let telegramSent = false;
    if (isTelegramConfigured() && report.totalAlerts > 0) {
      await sendTelegramMessage(formatComplianceForTelegram(report));
      telegramSent = true;
    }

    return NextResponse.json({
      ...report,
      telegramSent,
      telegramConfigured: isTelegramConfigured(),
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to run compliance check", details: String(error) },
      { status: 500 }
    );
  }
}
