// GET /api/agent/follow-up — Detect inactive customers + draft messages
// POST /api/agent/follow-up — Run + send Telegram report
import { NextRequest, NextResponse } from "next/server";
import { runCustomerFollowUp, formatFollowUpForTelegram } from "@/lib/agent/customer-follow-up";
import { sendTelegramMessage, isTelegramConfigured } from "@/lib/agent/telegram";
import { logAgentActionSafe } from "@/lib/agent/audit";

export const runtime = "nodejs";

export async function GET() {
  try {
    const report = await runCustomerFollowUp();
    return NextResponse.json({
      source: "Google Sheets: Customer_Master + Customer_Interactions",
      inactiveCount: report.inactiveCount,
      dormantCount: report.dormantCount,
      churnedCount: report.churnedCount,
      totalDrafts: report.totalDrafts,
      drafts: report.drafts.map((d) => ({
        customerName: d.customer.name,
        company: d.customer.company,
        status: d.customer.status,
        messageType: d.messageType,
        priority: d.priority,
        suggestedDate: d.suggestedDate,
        messagePreview: d.message.slice(0, 100),
      })),
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to run customer follow-up", details: String(error) },
      { status: 500 }
    );
  }
}

export async function POST() {
  try {
    const report = await runCustomerFollowUp();

    await logAgentActionSafe({
      timestamp: new Date().toISOString(),
      agent: "HemuHemu/OWL",
      action: "Customer Follow-up",
      target: "Customer_Master + Customer_Interactions",
      status: "success",
      humanApproved: "pending",
      notes: `${report.totalDrafts} follow-up drafts, ${report.churnedCount} churned, ${report.dormantCount} dormant`,
    });

    let telegramSent = false;
    if (isTelegramConfigured() && report.totalDrafts > 0) {
      await sendTelegramMessage(formatFollowUpForTelegram(report));
      telegramSent = true;
    }

    return NextResponse.json({
      ...report,
      telegramSent,
      telegramConfigured: isTelegramConfigured(),
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to run customer follow-up", details: String(error) },
      { status: 500 }
    );
  }
}
