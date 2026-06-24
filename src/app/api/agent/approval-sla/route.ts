// GET /api/agent/approval-sla — Check approval SLA status
// Returns pending approvals with wait times, breach counts, and escalation status
import { NextRequest, NextResponse } from "next/server";
import { checkApprovalSLA, runApprovalSLAMonitor } from "@/lib/agent/approval-sla-monitor";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const autoEscalate = searchParams.get("escalate") === "true";

  try {
    if (autoEscalate) {
      // Run full monitoring + send Telegram alerts for breaches
      const report = await runApprovalSLAMonitor();
      return NextResponse.json({ ok: true, report, escalated: true });
    } else {
      // Just check and return report without sending alerts
      const report = await checkApprovalSLA();
      return NextResponse.json({ ok: true, report, escalated: false });
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("[SLA Monitor API] Error:", errorMessage);
    return NextResponse.json(
      { ok: false, error: errorMessage },
      { status: 500 }
    );
  }
}
