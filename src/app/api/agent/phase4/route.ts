// GET /api/agent/phase4 — Run Phase 4 integration checks
// POST /api/agent/phase4 — Run Phase 4 integration checks (trigger)
import { NextRequest, NextResponse } from "next/server";
import { runPhase4Checks } from "@/lib/agent/phase4-scaffold";
import { logAgentActionSafe } from "@/lib/agent/audit";

export const runtime = "nodejs";

export async function GET() {
  return runPhase4Handler();
}

export async function POST(_request: NextRequest) {
  return runPhase4Handler();
}

async function runPhase4Handler() {
  try {
    const results = await runPhase4Checks();

    await logAgentActionSafe({
      timestamp: new Date().toISOString(),
      agent: "HemuHemu/OWL",
      action: "Phase 4 API Trigger",
      target: "All External Integrations",
      status: "success",
      humanApproved: "n/a",
      notes: `e-Faktur: ${results.eFaktur}, BPOM: ${results.bpom}, BRI: ${results.bri}, WhatsApp: ${results.whatsApp}, Sukuk: ${results.sukuk}`,
    });

    return NextResponse.json({
      ok: true,
      timestamp: new Date().toISOString(),
      results,
      message: "Phase 4 checks completed. See audit log for details.",
    });
  } catch (error) {
    console.error("[Phase4API] Error:", error);
    return NextResponse.json(
      { ok: false, error: String(error) },
      { status: 500 }
    );
  }
}
