// GET /api/agent/event-workflow — Event pipeline workflow (agreements, overdue, follow-up)
// POST /api/agent/event-workflow — Run + send Telegram report
import { NextRequest, NextResponse } from "next/server";
import { runEventPipelineWorkflow, formatEventPipelineForTelegram as formatEventPipelineWorkflowForTelegram } from "@/lib/agent/event-pipeline-workflow";
import { sendTelegramMessage, isTelegramConfigured } from "@/lib/agent/telegram";
import { logAgentActionSafe } from "@/lib/agent/audit";

export const runtime = "nodejs";

export async function GET() {
  try {
    const report = await runEventPipelineWorkflow();
    return NextResponse.json({
      source: "Google Sheets: Event_Tenants + Event_Sponsors",
      totalTenants: report.totalTenants,
      totalSponsors: report.totalSponsors,
      totalAgreementDrafts: report.totalAgreementDrafts,
      totalOverdue: report.totalOverdue,
      agreementDrafts: report.agreementDrafts.map((d) => ({
        tenant: d.tenant.companyName,
        event: d.tenant.eventName,
        boothFee: d.boothFee,
        validUntil: d.validUntil,
        status: d.status,
      })),
      overduePayments: report.overduePayments.map((t) => ({
        company: t.companyName,
        boothFee: t.boothFee,
        daysSinceContact: t.daysSinceContact,
      })),
      followUpNeeded: report.followUpNeeded.map((t) => ({
        company: t.companyName,
        contact: t.contactName,
        daysSinceContact: t.daysSinceContact,
      })),
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to run event workflow", details: String(error) },
      { status: 500 }
    );
  }
}

export async function POST() {
  try {
    const report = await runEventPipelineWorkflow();

    await logAgentActionSafe({
      timestamp: new Date().toISOString(),
      agent: "HemuHemu/OWL",
      action: "Event Pipeline Workflow",
      target: "Event_Tenants + Event_Sponsors",
      status: "success",
      humanApproved: "pending",
      notes: `${report.totalAgreementDrafts} drafts, ${report.totalOverdue} overdue, ${report.followUpNeeded.length} follow-up needed`,
    });

    let telegramSent = false;
    if (isTelegramConfigured() && (report.totalAgreementDrafts > 0 || report.totalOverdue > 0 || report.followUpNeeded.length > 0)) {
      await sendTelegramMessage(formatEventPipelineWorkflowForTelegram(report));
      telegramSent = true;
    }

    return NextResponse.json({
      ...report,
      telegramSent,
      telegramConfigured: isTelegramConfigured(),
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to run event workflow", details: String(error) },
      { status: 500 }
    );
  }
}
